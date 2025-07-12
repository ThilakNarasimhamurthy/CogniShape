from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(String, nullable=False)  # 'parent' or 'doctor'
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    child_profiles = relationship("ChildProfile", back_populates="user")
    license_usage = relationship("LicenseUsage", back_populates="user", uselist=False)
    confirmed_reports = relationship("DiagnosticReport", back_populates="confirmer")

class ChildProfile(Base):
    __tablename__ = "child_profiles"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String, nullable=False)
    special_interest = Column(String)
    diagnosis_status = Column(String, default="unconfirmed")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="child_profiles")
    session_logs = relationship("SessionLog", back_populates="child")
    diagnostic_reports = relationship("DiagnosticReport", back_populates="child")

class SessionLog(Base):
    __tablename__ = "session_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    child_id = Column(UUID(as_uuid=True), ForeignKey("child_profiles.id"), nullable=False)
    level = Column(Integer, nullable=False)
    completion_time = Column(Float)
    errors = Column(Integer, default=0)
    reaction_time = Column(Float)
    surprise_triggered = Column(String)
    abandoned = Column(Boolean, default=False)
    behavioral_notes = Column(Text)
    game_data = Column(JSON)  # Store detailed game interactions
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    child = relationship("ChildProfile", back_populates="session_logs")

class DiagnosticReport(Base):
    __tablename__ = "diagnostic_reports"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    child_id = Column(UUID(as_uuid=True), ForeignKey("child_profiles.id"), nullable=False)
    report_json = Column(JSON, nullable=False)  # AI-generated report data
    diagnosis = Column(String)  # 'autism', 'non-autism', 'inconclusive'
    confidence_score = Column(Float)
    confirmed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    confirmed_at = Column(DateTime)
    payment_status = Column(String, default="pending")  # 'pending', 'paid', 'free'
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    child = relationship("ChildProfile", back_populates="diagnostic_reports")
    confirmer = relationship("User", back_populates="confirmed_reports")

class LicenseUsage(Base):
    __tablename__ = "license_usage"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    role = Column(String, nullable=False)
    total_slots = Column(Integer, nullable=False)
    used_slots = Column(Integer, default=0)
    upgraded = Column(Boolean, default=False)
    last_payment_date = Column(DateTime)
    subscription_type = Column(String, default="basic")  # 'basic', 'premium', 'enterprise'
    
    # Relationships
    user = relationship("User", back_populates="license_usage")

class PaymentHistory(Base):
    __tablename__ = "payment_history"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    order_id = Column(String, nullable=False)
    payment_id = Column(String)
    amount = Column(Integer, nullable=False)  # Amount in smallest currency unit (paise for INR)
    currency = Column(String, default="INR")
    status = Column(String, default="pending")  # 'pending', 'completed', 'failed'
    payment_type = Column(String)  # 'report_unlock', 'license_upgrade'
    created_at = Column(DateTime, default=datetime.utcnow)