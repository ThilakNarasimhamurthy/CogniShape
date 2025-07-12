from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get Database URL from environment
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is required")

print(f"Using DATABASE_URL: {DATABASE_URL}")

try:
    # Create SQLAlchemy engine
    engine = create_engine(DATABASE_URL, echo=True)  # echo=True for debugging
    print("SUCCESS: Database engine created successfully")
except Exception as e:
    print(f"ERROR creating database engine: {e}")
    raise

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class
Base = declarative_base()

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Initialize database
def init_db():
    # Import models to register them with Base
    try:
        import models  # Direct import for Docker environment
        print("Models imported successfully")
    except ImportError as e:
        print(f"Failed to import models: {e}")
        raise
    
    # Create tables
    try:
        Base.metadata.create_all(bind=engine)
        print("Database tables created successfully")
    except Exception as e:
        print(f"Error creating database tables: {e}")
        raise

# Test database connection
def test_connection():
    """Test if database connection works"""
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            print("Database connection test: SUCCESS")
            return True
    except Exception as e:
        print(f"Database connection test: FAILED - {e}")
        return False