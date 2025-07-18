from fastapi import FastAPI, HTTPException, Depends, status, WebSocket, WebSocketDisconnect, Path, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import List, Optional
import os
from dotenv import load_dotenv
import json
from datetime import datetime
import asyncio
import logging

# Load environment variables
load_dotenv()

# Import custom modules
from database import engine, SessionLocal, get_db
from models import User, ChildProfile, SessionLog, DiagnosticReport, LicenseUsage
from auth import verify_token, create_access_token, hash_password, verify_password
from ai_agent import generate_game_config
from payments import create_razorpay_order, verify_razorpay_payment
from game_manager import GameManager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="NeuroNest API",
    description="Autism Screening Application with GPT-4 Integration",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://neuronest.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Game manager instance
game_manager = GameManager()

# Pydantic models
class UserCreate(BaseModel):
    email: str
    password: str
    role: str

class UserLogin(BaseModel):
    email: str
    password: str

class ChildProfileCreate(BaseModel):
    name: str
    age: int
    gender: str
    special_interest: str

class SessionData(BaseModel):
    child_id: str
    level: int
    completion_time: float
    errors: int
    reaction_time: float
    surprise_triggered: str
    abandoned: bool
    behavioral_notes: Optional[str] = None

class PaymentOrder(BaseModel):
    amount: int
    currency: str = "INR"
    child_id: str
    report_type: str

# Helper functions
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db = Depends(get_db)):
    try:
        payload = verify_token(credentials.credentials)
        email = payload.get("email")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = db.query(User).filter(User.email == email).first()
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid token")

# Routes
@app.get("/")
async def root():
    return {"message": "NeuroNest API is running", "version": "1.0.0"}

@app.post("/auth/register")
async def register(user_data: UserCreate, db = Depends(get_db)):
    try:
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == user_data.email).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Create new user
        hashed_password = hash_password(user_data.password)
        new_user = User(
            email=user_data.email,
            password=hashed_password,
            role=user_data.role
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        # Create license usage record
        license_slots = 10 if user_data.role == "parent" else 25
        license_usage = LicenseUsage(
            user_id=new_user.id,
            role=user_data.role,
            total_slots=license_slots,
            used_slots=0
        )
        db.add(license_usage)
        db.commit()
        
        # Create access token
        access_token = create_access_token({"email": user_data.email})
        
        return {
            "message": "User created successfully",
            "access_token": access_token,
            "user": {
                "id": str(new_user.id),
                "email": new_user.email,
                "role": new_user.role
            }
        }
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        raise HTTPException(status_code=500, detail="Registration failed")

@app.post("/auth/login")
async def login(user_data: UserLogin, db = Depends(get_db)):
    try:
        user = db.query(User).filter(User.email == user_data.email).first()
        if not user or not verify_password(user_data.password, user.password):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        access_token = create_access_token({"email": user_data.email})
        
        return {
            "access_token": access_token,
            "user": {
                "id": str(user.id),
                "email": user.email,
                "role": user.role
            }
        }
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(status_code=500, detail="Login failed")

@app.get("/user/profile")
async def get_user_profile(current_user: User = Depends(get_current_user), db = Depends(get_db)):
    try:
        license_usage = db.query(LicenseUsage).filter(LicenseUsage.user_id == current_user.id).first()
        child_profiles = db.query(ChildProfile).filter(ChildProfile.user_id == current_user.id).all()
        
        return {
            "user": {
                "id": str(current_user.id),
                "email": current_user.email,
                "role": current_user.role
            },
            "license": {
                "total_slots": license_usage.total_slots if license_usage else 0,
                "used_slots": license_usage.used_slots if license_usage else 0,
                "upgraded": license_usage.upgraded if license_usage else False
            },
            "children": [
                {
                    "id": str(child.id),
                    "name": child.name,
                    "age": child.age,
                    "gender": child.gender,
                    "special_interest": child.special_interest,
                    "diagnosis_status": child.diagnosis_status
                }
                for child in child_profiles
            ]
        }
    except Exception as e:
        logger.error(f"Profile fetch error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch profile")

@app.post("/children/create")
async def create_child_profile(child_data: ChildProfileCreate, current_user: User = Depends(get_current_user), db = Depends(get_db)):
    try:
        # Check license usage
        license_usage = db.query(LicenseUsage).filter(LicenseUsage.user_id == current_user.id).first()
        if license_usage and license_usage.used_slots >= license_usage.total_slots:
            raise HTTPException(status_code=400, detail="License limit reached")
        
        # Create child profile
        new_child = ChildProfile(
            user_id=current_user.id,
            name=child_data.name,
            age=child_data.age,
            gender=child_data.gender,
            special_interest=child_data.special_interest
        )
        db.add(new_child)
        db.commit()
        db.refresh(new_child)
        
        # Update license usage
        if license_usage:
            license_usage.used_slots += 1
            db.commit()
        
        return {
            "message": "Child profile created successfully",
            "child": {
                "id": str(new_child.id),
                "name": new_child.name,
                "age": new_child.age,
                "gender": new_child.gender,
                "special_interest": new_child.special_interest
            }
        }
    except Exception as e:
        logger.error(f"Child profile creation error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create child profile")

@app.post("/session/log")
async def log_session(session_data: SessionData, current_user: User = Depends(get_current_user), db = Depends(get_db)):
    try:
        # Log session data
        session_log = SessionLog(
            child_id=session_data.child_id,
            level=session_data.level,
            completion_time=session_data.completion_time,
            errors=session_data.errors,
            reaction_time=session_data.reaction_time,
            surprise_triggered=session_data.surprise_triggered,
            abandoned=session_data.abandoned
        )
        db.add(session_log)
        db.commit()
        db.refresh(session_log)
        
        # Generate AI analysis
        session_summary = {
            "level": session_data.level,
            "completion_time": session_data.completion_time,
            "errors": session_data.errors,
            "reaction_time": session_data.reaction_time,
            "surprise_triggered": session_data.surprise_triggered,
            "abandoned": session_data.abandoned,
            "behavioral_notes": session_data.behavioral_notes
        }
        
        # ai_analysis = await analyze_behavior(json.dumps(session_summary)) # This line is removed
        
        return {
            "message": "Session logged successfully",
            "session_id": str(session_log.id),
            # "ai_analysis": ai_analysis # This line is removed
        }
    except Exception as e:
        logger.error(f"Session logging error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to log session")

@app.get("/reports/{child_id}")
async def get_child_reports(child_id: str, current_user: User = Depends(get_current_user), db = Depends(get_db)):
    try:
        # Verify child belongs to user
        child = db.query(ChildProfile).filter(
            ChildProfile.id == child_id,
            ChildProfile.user_id == current_user.id
        ).first()
        
        if not child:
            raise HTTPException(status_code=404, detail="Child not found")
        
        # Get all session logs for this child
        session_logs = db.query(SessionLog).filter(SessionLog.child_id == child_id).all()
        
        # Get diagnostic reports
        diagnostic_reports = db.query(DiagnosticReport).filter(DiagnosticReport.child_id == child_id).all()
        
        return {
            "child": {
                "id": str(child.id),
                "name": child.name,
                "age": child.age,
                "diagnosis_status": child.diagnosis_status
            },
            "sessions": [
                {
                    "id": str(session.id),
                    "level": session.level,
                    "completion_time": session.completion_time,
                    "errors": session.errors,
                    "reaction_time": session.reaction_time,
                    "surprise_triggered": session.surprise_triggered,
                    "abandoned": session.abandoned,
                    "created_at": session.created_at.isoformat()
                }
                for session in session_logs
            ],
            "reports": [
                {
                    "id": str(report.id),
                    "report_data": report.report_json,
                    "diagnosis": report.diagnosis,
                    "confirmed_at": report.confirmed_at.isoformat() if report.confirmed_at else None
                }
                for report in diagnostic_reports
            ]
        }
    except Exception as e:
        logger.error(f"Reports fetch error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch reports")

@app.get("/children/{child_id}")
async def get_child(child_id: str, current_user: User = Depends(get_current_user), db = Depends(get_db)):
    child = db.query(ChildProfile).filter(ChildProfile.id == child_id, ChildProfile.user_id == current_user.id).first()
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    return {
        "id": str(child.id),
        "name": child.name,
        "age": child.age,
        "gender": child.gender,
        "special_interest": child.special_interest,
        "diagnosis_status": child.diagnosis_status,
        "created_at": child.created_at
    }

@app.post("/payments/create-order")
async def create_payment_order(order_data: PaymentOrder, current_user: User = Depends(get_current_user)):
    try:
        order = create_razorpay_order(order_data.amount, order_data.currency)
        return {
            "order_id": order["id"],
            "amount": order["amount"],
            "currency": order["currency"],
            "key": "dummy_key_12345"  # Dummy key for frontend
        }
    except Exception as e:
        logger.error(f"Payment order creation error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create payment order")

@app.post("/payments/process")
async def process_payment(payment_data: dict, current_user: User = Depends(get_current_user)):
    """Process a dummy payment."""
    try:
        from payments import process_dummy_payment
        result = process_dummy_payment(
            payment_data["order_id"],
            payment_data.get("payment_method", "card")
        )
        return result
    except Exception as e:
        logger.error(f"Payment processing error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to process payment")

@app.post("/payments/verify")
async def verify_payment(payment_data: dict, current_user: User = Depends(get_current_user)):
    try:
        is_valid = verify_razorpay_payment(
            payment_data["order_id"],
            payment_data["payment_id"],
            payment_data.get("signature", "")
        )
        
        if is_valid:
            return {"message": "Payment verified successfully"}
        else:
            raise HTTPException(status_code=400, detail="Payment verification failed")
    except Exception as e:
        logger.error(f"Payment verification error: {str(e)}")
        raise HTTPException(status_code=500, detail="Payment verification failed")

@app.get("/payments/pricing")
async def get_pricing_info(current_user: User = Depends(get_current_user)):
    """Get pricing information for different services."""
    try:
        from payments import PRICING
        return {
            "pricing": PRICING,
            "currency": "USD",
            "message": "Dummy payment system - all payments are simulated"
        }
    except Exception as e:
        logger.error(f"Pricing fetch error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch pricing")

@app.post("/payments/create-subscription-order")
async def create_subscription_order(
    subscription_type: str = Body(...),
    currency: str = Body("USD"),
    current_user: User = Depends(get_current_user)
):
    """Create order for subscription upgrade."""
    try:
        from payments import create_subscription_order
        order = create_subscription_order(str(current_user.role), subscription_type, currency)
        return {
            "order_id": order["id"],
            "amount": order["amount"],
            "currency": order["currency"],
            "key": "dummy_key_12345"
        }
    except Exception as e:
        logger.error(f"Subscription order creation error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create subscription order")

@app.post("/payments/create-license-upgrade-order")
async def create_license_upgrade_order(
    currency: str = Body("USD"),
    current_user: User = Depends(get_current_user)
):
    """Create order for license upgrade."""
    try:
        from payments import create_license_upgrade_order
        order = create_license_upgrade_order(str(current_user.role), currency)
        return {
            "order_id": order["id"],
            "amount": order["amount"],
            "currency": order["currency"],
            "key": "dummy_key_12345"
        }
    except Exception as e:
        logger.error(f"License upgrade order creation error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create license upgrade order")

@app.post("/payments/create-report-unlock-order")
async def create_report_unlock_order(
    child_id: str = Body(...),
    currency: str = Body("USD"),
    current_user: User = Depends(get_current_user)
):
    """Create order for report unlock."""
    try:
        from payments import create_report_unlock_order
        order = create_report_unlock_order(child_id, currency)
        return {
            "order_id": order["id"],
            "amount": order["amount"],
            "currency": order["currency"],
            "key": "dummy_key_12345"
        }
    except Exception as e:
        logger.error(f"Report unlock order creation error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create report unlock order")

@app.get("/payments/history")
async def get_payment_history(current_user: User = Depends(get_current_user)):
    """Get payment history for the current user."""
    try:
        from payments import dummy_payment_manager
        payments = dummy_payment_manager.get_payment_history()
        return {
            "payments": payments,
            "total_payments": len(payments)
        }
    except Exception as e:
        logger.error(f"Payment history fetch error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch payment history")

@app.websocket("/ws/{child_id}")
async def websocket_endpoint(websocket: WebSocket, child_id: str):
    import logging
    logging.info(f"WebSocket connection attempt for child {child_id}")
    await websocket.accept()
    logging.info(f"WebSocket accepted for child {child_id}")
    await game_manager.add_connection(child_id, websocket)

    # Start game session for the child connection
    from models import ChildProfile, SessionLog
    from database import SessionLocal
    db = SessionLocal()
    try:
        child = db.query(ChildProfile).filter(ChildProfile.id == child_id).first()
        if not child:
            import logging
            logging.error(f"Child with id {child_id} not found. Closing WebSocket.")
            await websocket.close()
            return
        
        previous_sessions = db.query(SessionLog).filter(SessionLog.child_id == child_id).all()
        # Convert previous_sessions to plain dicts (avoid SQLAlchemy InstanceState)
        previous_sessions_dicts = [
            {
                "id": str(s.id),
                "level": s.level,
                "completion_time": s.completion_time,
                "errors": s.errors,
                "reaction_time": s.reaction_time,
                "surprise_triggered": s.surprise_triggered,
                "abandoned": s.abandoned,
                "behavioral_notes": s.behavioral_notes,
                "game_data": s.game_data,
                "created_at": s.created_at.isoformat() if s.created_at is not None else None
            }
            for s in previous_sessions
        ]
        child_profile = {
            "id": str(child.id),
            "name": child.name,
            "age": child.age,
            "gender": child.gender,
            "special_interest": child.special_interest
        }
        
        # Generate game config with fallback
        try:
            from ai_agent import generate_game_config
            game_config = generate_game_config(child_profile, previous_sessions_dicts)
        except Exception as e:
            import logging
            logging.error(f"AI config generation failed, using fallback: {e}")
            # Fallback config
            game_config = {
                "level_config": {
                    "difficulty": 2,
                    "shapes": ["circle", "square", "triangle"],
                    "colors": ["red", "blue", "green", "yellow"],
                    "sounds": True,
                    "animation_speed": 1.0,
                    "surprise_elements": ["color_change", "size_change"]
                },
                "assessment_focus": ["attention", "motor_skills", "pattern_recognition"],
                "session_duration": 10,
                "break_intervals": 3,
                "motivation_elements": ["celebration_sounds", "progress_indicators"]
            }
        
        # Always start the game session
        logging.info(f"Starting game session for child {child_id} with config: {game_config}")
        await game_manager.start_game_session(child_id, game_config)
        logging.info(f"Game session started successfully for child {child_id}")
        
    except Exception as e:
        import logging
        logging.error(f"Failed to start game session: {e}")
        # Send a basic session start even if everything else fails
        try:
            fallback_config = {
                "level_config": {
                    "difficulty": 1,
                    "shapes": ["circle", "square"],
                    "colors": ["red", "blue"],
                    "sounds": False,
                    "animation_speed": 1.0,
                    "surprise_elements": []
                }
            }
            await game_manager.start_game_session(child_id, fallback_config)
        except Exception as fallback_error:
            logging.error(f"Even fallback session start failed: {fallback_error}")
    finally:
        db.close()

    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            logging.info(f"Received WebSocket message from {child_id}: {message['type']}")
            
            if message["type"] == "game_event":
                await game_manager.broadcast_to_caretakers(child_id, message)
                logging.info(f"Game event broadcasted to caretakers for {child_id}")
            elif message["type"] == "control_command":
                logging.info(f"Control command received for {child_id}: {message}")
                await game_manager.send_control_to_child(child_id, message)
            elif message["type"] in ["session_started", "game_paused", "game_resumed", "session_ended"]:
                # Route session state messages to caretakers
                await game_manager.broadcast_to_caretakers(child_id, message)
                logging.info(f"Session state message broadcasted to caretakers for {child_id}: {message['type']}")
            else:
                logging.info(f"Unhandled message type: {message['type']}")
    except WebSocketDisconnect:
        logging.info(f"WebSocket disconnected for {child_id}")
        await game_manager.remove_connection(child_id, websocket)

@app.post("/ai/game-config")
async def ai_game_config(
    child_id: str = Body(...),
    age: int = Body(...),
    interests: str = Body(...),
    current_user: User = Depends(get_current_user)
):
    # Example: Generate a simple config based on age/interests
    config = {
        "level_config": {
            "level": 1,
            "difficulty": "easy" if age < 8 else "medium",
            "interests": interests.split(",") if interests else [],
            "shapes": ["circle", "square", "triangle"],
            "colors": ["red", "blue", "green", "yellow"]
        }
    }
    return config

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)