import razorpay
import os
import hmac
import hashlib
from typing import Dict, Any
from dotenv import load_dotenv
import logging

load_dotenv()

logger = logging.getLogger(__name__)

# Razorpay configuration
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET")

# Initialize Razorpay client
if RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET:
    razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
else:
    razorpay_client = None
    logger.warning("Razorpay credentials not found. Payment functionality will be limited.")

class PaymentManager:
    def __init__(self):
        self.client = razorpay_client
        
    def create_order(self, amount: int, currency: str = "INR", receipt: str = None) -> Dict[str, Any]:
        """Create a Razorpay order."""
        if not self.client:
            raise Exception("Razorpay client not initialized")
        
        order_data = {
            "amount": amount,  # Amount in paise (for INR)
            "currency": currency,
            "receipt": receipt or f"order_{amount}_{currency}",
            "payment_capture": 1  # Auto capture
        }
        
        try:
            order = self.client.order.create(order_data)
            return order
        except Exception as e:
            logger.error(f"Razorpay order creation failed: {str(e)}")
            raise Exception(f"Failed to create payment order: {str(e)}")
    
    def verify_payment(self, order_id: str, payment_id: str, signature: str) -> bool:
        """Verify Razorpay payment signature."""
        if not self.client:
            return False
        
        try:
            # Generate expected signature
            message = f"{order_id}|{payment_id}"
            expected_signature = hmac.new(
                RAZORPAY_KEY_SECRET.encode(),
                message.encode(),
                hashlib.sha256
            ).hexdigest()
            
            return hmac.compare_digest(expected_signature, signature)
        except Exception as e:
            logger.error(f"Payment verification failed: {str(e)}")
            return False
    
    def get_payment_details(self, payment_id: str) -> Dict[str, Any]:
        """Get payment details from Razorpay."""
        if not self.client:
            raise Exception("Razorpay client not initialized")
        
        try:
            payment = self.client.payment.fetch(payment_id)
            return payment
        except Exception as e:
            logger.error(f"Failed to fetch payment details: {str(e)}")
            raise Exception(f"Failed to fetch payment details: {str(e)}")
    
    def refund_payment(self, payment_id: str, amount: int = None) -> Dict[str, Any]:
        """Refund a payment."""
        if not self.client:
            raise Exception("Razorpay client not initialized")
        
        refund_data = {}
        if amount:
            refund_data["amount"] = amount
        
        try:
            refund = self.client.payment.refund(payment_id, refund_data)
            return refund
        except Exception as e:
            logger.error(f"Refund failed: {str(e)}")
            raise Exception(f"Refund failed: {str(e)}")

# Pricing configuration
PRICING = {
    "report_unlock": {
        "INR": 299,  # ₹299 for full report
        "USD": 4     # $4 for full report
    },
    "license_upgrade": {
        "parent": {
            "INR": 999,  # ₹999 to upgrade from 10 to 25 slots
            "USD": 12
        },
        "doctor": {
            "INR": 2499,  # ₹2499 to upgrade from 25 to 50 slots
            "USD": 30
        }
    },
    "premium_subscription": {
        "monthly": {
            "INR": 499,
            "USD": 6
        },
        "yearly": {
            "INR": 4999,
            "USD": 60
        }
    }
}

# Global payment manager instance
payment_manager = PaymentManager()

# Convenience functions
def create_razorpay_order(amount: int, currency: str = "INR", receipt: str = None) -> Dict[str, Any]:
    """Create a Razorpay order."""
    return payment_manager.create_order(amount, currency, receipt)

def verify_razorpay_payment(order_id: str, payment_id: str, signature: str) -> bool:
    """Verify Razorpay payment signature."""
    return payment_manager.verify_payment(order_id, payment_id, signature)

def get_payment_details(payment_id: str) -> Dict[str, Any]:
    """Get payment details."""
    return payment_manager.get_payment_details(payment_id)

def get_pricing(item_type: str, user_role: str = None, subscription_type: str = None, currency: str = "INR") -> int:
    """Get pricing for different services."""
    try:
        if item_type == "report_unlock":
            return PRICING["report_unlock"][currency]
        elif item_type == "license_upgrade" and user_role:
            return PRICING["license_upgrade"][user_role][currency]
        elif item_type == "premium_subscription" and subscription_type:
            return PRICING["premium_subscription"][subscription_type][currency]
        else:
            raise ValueError("Invalid pricing request")
    except KeyError:
        logger.error(f"Pricing not found for {item_type}, {user_role}, {subscription_type}, {currency}")
        return 0

def calculate_amount(item_type: str, user_role: str = None, subscription_type: str = None, currency: str = "INR") -> int:
    """Calculate amount in smallest currency unit (paise for INR)."""
    base_amount = get_pricing(item_type, user_role, subscription_type, currency)
    
    if currency == "INR":
        return base_amount * 100  # Convert to paise
    elif currency == "USD":
        return base_amount * 100  # Convert to cents
    else:
        return base_amount * 100  # Default conversion

# Mock payment for development/testing
class MockPaymentManager:
    """Mock payment manager for development and testing."""
    
    def create_order(self, amount: int, currency: str = "INR", receipt: str = None) -> Dict[str, Any]:
        """Create a mock order."""
        import uuid
        return {
            "id": f"order_{uuid.uuid4().hex[:10]}",
            "amount": amount,
            "currency": currency,
            "receipt": receipt or f"mock_order_{amount}",
            "status": "created"
        }
    
    def verify_payment(self, order_id: str, payment_id: str, signature: str) -> bool:
        """Always return True for mock payments."""
        return True
    
    def get_payment_details(self, payment_id: str) -> Dict[str, Any]:
        """Return mock payment details."""
        return {
            "id": payment_id,
            "status": "captured",
            "amount": 29900,
            "currency": "INR",
            "method": "card"
        }

# Use mock payment manager if Razorpay is not configured
if not razorpay_client:
    payment_manager = MockPaymentManager()
    logger.info("Using mock payment manager for development")

def create_subscription_order(user_role: str, subscription_type: str, currency: str = "INR") -> Dict[str, Any]:
    """Create order for subscription upgrade."""
    amount = calculate_amount("premium_subscription", subscription_type=subscription_type, currency=currency)
    receipt = f"subscription_{user_role}_{subscription_type}"
    return create_razorpay_order(amount, currency, receipt)

def create_license_upgrade_order(user_role: str, currency: str = "INR") -> Dict[str, Any]:
    """Create order for license upgrade."""
    amount = calculate_amount("license_upgrade", user_role=user_role, currency=currency)
    receipt = f"license_upgrade_{user_role}"
    return create_razorpay_order(amount, currency, receipt)

def create_report_unlock_order(child_id: str, currency: str = "INR") -> Dict[str, Any]:
    """Create order for report unlock."""
    amount = calculate_amount("report_unlock", currency=currency)
    receipt = f"report_unlock_{child_id}"
    return create_razorpay_order(amount, currency, receipt)