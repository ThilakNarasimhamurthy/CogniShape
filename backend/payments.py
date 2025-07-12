import os
import uuid
import time
from typing import Dict, Any, Optional
from dotenv import load_dotenv
import logging
from datetime import datetime, timedelta

load_dotenv()

logger = logging.getLogger(__name__)

# Dummy payment configuration
DUMMY_PAYMENT_CONFIG = {
    "enabled": True,
    "success_rate": 0.95,  # 95% success rate
    "processing_delay": 2,  # 2 seconds processing delay
    "currency": "USD"
}

# Pricing configuration
PRICING = {
    "report_unlock": {
        "USD": 4.99,    # $4.99 for full report
        "INR": 299,     # ₹299 for full report
        "EUR": 4.50     # €4.50 for full report
    },
    "license_upgrade": {
        "parent": {
            "USD": 9.99,  # $9.99 to upgrade from 10 to 25 slots
            "INR": 599,
            "EUR": 8.99
        },
        "doctor": {
            "USD": 24.99,  # $24.99 to upgrade from 25 to 50 slots
            "INR": 1499,
            "EUR": 22.99
        }
    },
    "premium_subscription": {
        "monthly": {
            "USD": 9.99,
            "INR": 599,
            "EUR": 8.99
        },
        "yearly": {
            "USD": 99.99,
            "INR": 5999,
            "EUR": 89.99
        }
    },
    "game_session": {
        "USD": 1.99,    # $1.99 per game session
        "INR": 99,
        "EUR": 1.79
    }
}

class DummyPaymentManager:
    """Dummy payment manager that simulates real payment processing."""
    
    def __init__(self):
        self.payments = {}  # Store payment history
        self.orders = {}    # Store order history
        
    def create_order(self, amount: int, currency: str = "USD", receipt: Optional[str] = None) -> Dict[str, Any]:
        """Create a dummy payment order."""
        order_id = f"order_{uuid.uuid4().hex[:12]}"
        
        order = {
            "id": order_id,
            "amount": amount,
            "currency": currency,
            "receipt": receipt if receipt else f"dummy_order_{int(time.time())}",
            "status": "created",
            "created_at": datetime.now().isoformat(),
            "key": "dummy_key_12345"  # Dummy key for frontend
        }
        
        self.orders[order_id] = order
        logger.info(f"Dummy order created: {order_id} for {amount} {currency}")
        
        return order
    
    def process_payment(self, order_id: str, payment_method: str = "card") -> Dict[str, Any]:
        """Process a dummy payment."""
        if order_id not in self.orders:
            raise Exception("Order not found")
        
        order = self.orders[order_id]
        
        # Simulate processing delay
        time.sleep(DUMMY_PAYMENT_CONFIG["processing_delay"])
        
        # Simulate success/failure based on success rate
        import random
        success = random.random() < DUMMY_PAYMENT_CONFIG["success_rate"]
        
        payment_id = f"pay_{uuid.uuid4().hex[:12]}"
        
        payment = {
            "id": payment_id,
            "order_id": order_id,
            "amount": order["amount"],
            "currency": order["currency"],
            "status": "captured" if success else "failed",
            "method": payment_method,
            "created_at": datetime.now().isoformat(),
            "processed_at": datetime.now().isoformat()
        }
        
        self.payments[payment_id] = payment
        
        if success:
            logger.info(f"Dummy payment successful: {payment_id}")
            return {
                "success": True,
                "payment_id": payment_id,
                "order_id": order_id,
                "amount": order["amount"],
                "currency": order["currency"],
                "status": "captured"
            }
        else:
            logger.warning(f"Dummy payment failed: {payment_id}")
            return {
                "success": False,
                "payment_id": payment_id,
                "order_id": order_id,
                "error": "Payment failed - insufficient funds"
            }
    
    def verify_payment(self, order_id: str, payment_id: str, signature: Optional[str] = None) -> bool:
        """Verify a dummy payment (always returns True for valid payments)."""
        if payment_id not in self.payments:
            return False
        
        payment = self.payments[payment_id]
        return payment["status"] == "captured"
    
    def get_payment_details(self, payment_id: str) -> Dict[str, Any]:
        """Get dummy payment details."""
        if payment_id not in self.payments:
            raise Exception("Payment not found")
        
        return self.payments[payment_id]
    
    def refund_payment(self, payment_id: str, amount: Optional[int] = None) -> Dict[str, Any]:
        """Refund a dummy payment."""
        if payment_id not in self.payments:
            raise Exception("Payment not found")
        
        payment = self.payments[payment_id]
        refund_amount = amount if amount is not None else payment["amount"]
        
        refund_id = f"refund_{uuid.uuid4().hex[:12]}"
        
        refund = {
            "id": refund_id,
            "payment_id": payment_id,
            "amount": refund_amount,
            "currency": payment["currency"],
            "status": "processed",
            "created_at": datetime.now().isoformat()
        }
        
        logger.info(f"Dummy refund processed: {refund_id}")
        return refund
    
    def get_payment_history(self) -> list:
        """Get all payment history."""
        return list(self.payments.values())
    
    def get_order_history(self) -> list:
        """Get all order history."""
        return list(self.orders.values())

# Global dummy payment manager instance
dummy_payment_manager = DummyPaymentManager()

# Convenience functions
def create_dummy_order(amount: int, currency: str = "USD", receipt: Optional[str] = None) -> Dict[str, Any]:
    """Create a dummy payment order."""
    return dummy_payment_manager.create_order(amount, currency, receipt)

def process_dummy_payment(order_id: str, payment_method: str = "card") -> Dict[str, Any]:
    """Process a dummy payment."""
    return dummy_payment_manager.process_payment(order_id, payment_method)

def verify_dummy_payment(order_id: str, payment_id: str, signature: Optional[str] = None) -> bool:
    """Verify a dummy payment."""
    return dummy_payment_manager.verify_payment(order_id, payment_id, signature)

def get_dummy_payment_details(payment_id: str) -> Dict[str, Any]:
    """Get dummy payment details."""
    return dummy_payment_manager.get_payment_details(payment_id)

def refund_dummy_payment(payment_id: str, amount: Optional[int] = None) -> Dict[str, Any]:
    """Refund a dummy payment."""
    return dummy_payment_manager.refund_payment(payment_id, amount)

def get_pricing(item_type: str, user_role: str = None, subscription_type: str = None, currency: str = "USD") -> float:
    """Get pricing for different services."""
    try:
        if item_type == "report_unlock":
            return PRICING["report_unlock"][currency]
        elif item_type == "license_upgrade" and user_role:
            return PRICING["license_upgrade"][user_role][currency]
        elif item_type == "premium_subscription" and subscription_type:
            return PRICING["premium_subscription"][subscription_type][currency]
        elif item_type == "game_session":
            return PRICING["game_session"][currency]
        else:
            raise ValueError("Invalid pricing request")
    except KeyError:
        logger.error(f"Pricing not found for {item_type}, {user_role}, {subscription_type}, {currency}")
        return 0.0

def calculate_amount(item_type: str, user_role: str = None, subscription_type: str = None, currency: str = "USD") -> int:
    """Calculate amount in smallest currency unit (cents for USD)."""
    base_amount = get_pricing(item_type, user_role, subscription_type, currency)
    
    if currency == "USD":
        return int(base_amount * 100)  # Convert to cents
    elif currency == "INR":
        return int(base_amount * 100)  # Convert to paise
    elif currency == "EUR":
        return int(base_amount * 100)  # Convert to cents
    else:
        return int(base_amount * 100)  # Default conversion

# Specific order creation functions
def create_subscription_order(user_role: str, subscription_type: str, currency: str = "USD") -> Dict[str, Any]:
    """Create order for subscription upgrade."""
    amount = calculate_amount("premium_subscription", subscription_type=subscription_type, currency=currency)
    receipt = f"subscription_{user_role}_{subscription_type}"
    return create_dummy_order(amount, currency, receipt)

def create_license_upgrade_order(user_role: str, currency: str = "USD") -> Dict[str, Any]:
    """Create order for license upgrade."""
    amount = calculate_amount("license_upgrade", user_role=user_role, currency=currency)
    receipt = f"license_upgrade_{user_role}"
    return create_dummy_order(amount, currency, receipt)

def create_report_unlock_order(child_id: str, currency: str = "USD") -> Dict[str, Any]:
    """Create order for report unlock."""
    amount = calculate_amount("report_unlock", currency=currency)
    receipt = f"report_unlock_{child_id}"
    return create_dummy_order(amount, currency, receipt)

def create_game_session_order(child_id: str, currency: str = "USD") -> Dict[str, Any]:
    """Create order for game session."""
    amount = calculate_amount("game_session", currency=currency)
    receipt = f"game_session_{child_id}"
    return create_dummy_order(amount, currency, receipt)

# Backward compatibility functions (for existing code)
def create_razorpay_order(amount: int, currency: str = "USD", receipt: Optional[str] = None) -> Dict[str, Any]:
    """Create a dummy order (replaces Razorpay)."""
    return create_dummy_order(amount, currency, receipt)

def verify_razorpay_payment(order_id: str, payment_id: str, signature: str) -> bool:
    """Verify a dummy payment (replaces Razorpay)."""
    return verify_dummy_payment(order_id, payment_id, signature)

def get_payment_details(payment_id: str) -> Dict[str, Any]:
    """Get payment details."""
    return get_dummy_payment_details(payment_id)

# Payment manager for backward compatibility
class PaymentManager:
    def __init__(self):
        self.client = dummy_payment_manager
        
    def create_order(self, amount: int, currency: str = "USD", receipt: Optional[str] = None) -> Dict[str, Any]:
        return create_dummy_order(amount, currency, receipt)
    
    def verify_payment(self, order_id: str, payment_id: str, signature: Optional[str] = None) -> bool:
        return verify_dummy_payment(order_id, payment_id, signature)
    
    def get_payment_details(self, payment_id: str) -> Dict[str, Any]:
        return get_dummy_payment_details(payment_id)
    
    def refund_payment(self, payment_id: str, amount: Optional[int] = None) -> Dict[str, Any]:
        return refund_dummy_payment(payment_id, amount)

# Global payment manager instance
payment_manager = PaymentManager()

logger.info("Dummy payment system initialized successfully")