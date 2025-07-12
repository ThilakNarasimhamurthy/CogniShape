import asyncio
import json
import logging
from typing import Dict, List, Any
from fastapi import WebSocket
from datetime import datetime
import uuid

logger = logging.getLogger(__name__)

class GameManager:
    """Manages WebSocket connections and real-time game communications."""
    
    def __init__(self):
        # Store active connections: child_id -> {"child": websocket, "caretakers": [websockets]}
        self.connections: Dict[str, Dict[str, Any]] = {}
        # Store game sessions: session_id -> session_data
        self.active_sessions: Dict[str, Dict[str, Any]] = {}
        
    async def add_connection(self, child_id: str, websocket: WebSocket, connection_type: str = "child"):
        """Add a WebSocket connection for a child."""
        if child_id not in self.connections:
            self.connections[child_id] = {
                "child": None,
                "caretakers": []
            }
        
        if connection_type == "child":
            self.connections[child_id]["child"] = websocket
            logger.info(f"Child connection added for {child_id}")
        else:
            self.connections[child_id]["caretakers"].append(websocket)
            logger.info(f"Caretaker connection added for {child_id}")
            
        # Send initial connection confirmation
        await websocket.send_text(json.dumps({
            "type": "connection_confirmed",
            "child_id": child_id,
            "role": connection_type,
            "timestamp": datetime.utcnow().isoformat()
        }))
    
    async def remove_connection(self, child_id: str, websocket: WebSocket):
        """Remove a WebSocket connection."""
        if child_id not in self.connections:
            return
            
        connections = self.connections[child_id]
        
        # Remove from child connection
        if connections["child"] == websocket:
            connections["child"] = None
            logger.info(f"Child connection removed for {child_id}")
            
        # Remove from caretaker connections
        if websocket in connections["caretakers"]:
            connections["caretakers"].remove(websocket)
            logger.info(f"Caretaker connection removed for {child_id}")
            
        # Clean up if no connections left
        if not connections["child"] and not connections["caretakers"]:
            del self.connections[child_id]
            logger.info(f"All connections removed for {child_id}")
    
    async def broadcast_to_caretakers(self, child_id: str, message: Dict[str, Any]):
        """Broadcast a message to all caretakers monitoring a child."""
        if child_id not in self.connections:
            return
            
        caretakers = self.connections[child_id]["caretakers"]
        message_str = json.dumps(message)
        
        # Send to all caretakers
        disconnected_caretakers = []
        for caretaker_ws in caretakers:
            try:
                await caretaker_ws.send_text(message_str)
            except Exception as e:
                logger.error(f"Failed to send message to caretaker: {str(e)}")
                disconnected_caretakers.append(caretaker_ws)
        
        # Remove disconnected caretakers
        for ws in disconnected_caretakers:
            if ws in caretakers:
                caretakers.remove(ws)
    
    async def send_control_to_child(self, child_id: str, control_message: Dict[str, Any]):
        """Send a control message to the child's game session."""
        if child_id not in self.connections:
            logger.warning(f"No connection found for child {child_id}")
            return
            
        child_ws = self.connections[child_id]["child"]
        if not child_ws:
            logger.warning(f"No child connection found for {child_id}")
            return
            
        try:
            await child_ws.send_text(json.dumps(control_message))
            logger.info(f"Control message sent to child {child_id}: {control_message['type']}")
        except Exception as e:
            logger.error(f"Failed to send control message to child {child_id}: {str(e)}")
            # Remove broken connection
            self.connections[child_id]["child"] = None
    
    async def start_game_session(self, child_id: str, game_config: Dict[str, Any]) -> str:
        """Start a new game session."""
        session_id = str(uuid.uuid4())
        
        session_data = {
            "session_id": session_id,
            "child_id": child_id,
            "config": game_config,
            "started_at": datetime.utcnow().isoformat(),
            "events": [],
            "status": "active"
        }
        
        self.active_sessions[session_id] = session_data
        
        # Send session start message to child
        start_message = {
            "type": "session_start",
            "session_id": session_id,
            "config": game_config,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        await self.send_control_to_child(child_id, start_message)
        
        # Notify caretakers
        caretaker_message = {
            "type": "session_started",
            "session_id": session_id,
            "child_id": child_id,
            "config": game_config,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        await self.broadcast_to_caretakers(child_id, caretaker_message)
        
        logger.info(f"Game session {session_id} started for child {child_id}")
        return session_id
    
    async def end_game_session(self, session_id: str, session_summary: Dict[str, Any]):
        """End a game session."""
        if session_id not in self.active_sessions:
            logger.warning(f"Session {session_id} not found")
            return
            
        session_data = self.active_sessions[session_id]
        session_data["status"] = "completed"
        session_data["ended_at"] = datetime.utcnow().isoformat()
        session_data["summary"] = session_summary
        
        child_id = session_data["child_id"]
        
        # Send session end message to child
        end_message = {
            "type": "session_end",
            "session_id": session_id,
            "summary": session_summary,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        await self.send_control_to_child(child_id, end_message)
        
        # Notify caretakers
        caretaker_message = {
            "type": "session_ended",
            "session_id": session_id,
            "child_id": child_id,
            "summary": session_summary,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        await self.broadcast_to_caretakers(child_id, caretaker_message)
        
        logger.info(f"Game session {session_id} ended for child {child_id}")
        
        # Clean up session after some time (could be moved to a cleanup task)
        # For now, keep it for potential analysis
        
    async def log_game_event(self, session_id: str, event: Dict[str, Any]):
        """Log a game event during an active session."""
        if session_id not in self.active_sessions:
            logger.warning(f"Trying to log event for non-existent session {session_id}")
            return
            
        session_data = self.active_sessions[session_id]
        event["timestamp"] = datetime.utcnow().isoformat()
        session_data["events"].append(event)
        
        child_id = session_data["child_id"]
        
        # Broadcast event to caretakers with real-time updates
        caretaker_message = {
            "type": "game_event",
            "session_id": session_id,
            "child_id": child_id,
            "event": event,
            "timestamp": event["timestamp"]
        }
        
        await self.broadcast_to_caretakers(child_id, caretaker_message)
    
    async def send_caretaker_control(self, child_id: str, control_data: Dict[str, Any]):
        """Send control commands from caretaker to child game."""
        control_message = {
            "type": "caretaker_control",
            "control": control_data,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        await self.send_control_to_child(child_id, control_message)
        
        # Log the control action
        logger.info(f"Caretaker control sent to {child_id}: {control_data}")
    
    def get_active_sessions(self) -> List[Dict[str, Any]]:
        """Get all active game sessions."""
        return [
            session for session in self.active_sessions.values()
            if session["status"] == "active"
        ]
    
    def get_session_data(self, session_id: str) -> Dict[str, Any]:
        """Get session data by session ID."""
        return self.active_sessions.get(session_id)
    
    async def handle_surprise_trigger(self, child_id: str, surprise_type: str):
        """Handle surprise element triggers during gameplay."""
        surprise_message = {
            "type": "surprise_trigger",
            "surprise_type": surprise_type,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        await self.send_control_to_child(child_id, surprise_message)
        
        # Notify caretakers about the surprise
        caretaker_message = {
            "type": "surprise_triggered",
            "child_id": child_id,
            "surprise_type": surprise_type,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        await self.broadcast_to_caretakers(child_id, caretaker_message)
    
    async def handle_game_pause(self, child_id: str, pause_duration: int = 30):
        """Handle game pause requests."""
        pause_message = {
            "type": "game_pause",
            "duration": pause_duration,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        await self.send_control_to_child(child_id, pause_message)
        
        # Notify caretakers
        caretaker_message = {
            "type": "game_paused",
            "child_id": child_id,
            "duration": pause_duration,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        await self.broadcast_to_caretakers(child_id, caretaker_message)
    
    async def cleanup_old_sessions(self, hours_old: int = 24):
        """Clean up old completed sessions."""
        current_time = datetime.utcnow()
        sessions_to_remove = []
        
        for session_id, session_data in self.active_sessions.items():
            if session_data["status"] == "completed":
                session_end = datetime.fromisoformat(session_data.get("ended_at", session_data["started_at"]))
                if (current_time - session_end).total_seconds() > hours_old * 3600:
                    sessions_to_remove.append(session_id)
        
        for session_id in sessions_to_remove:
            del self.active_sessions[session_id]
            logger.info(f"Cleaned up old session {session_id}")
        
        return len(sessions_to_remove)