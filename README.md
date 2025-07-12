# 🧠 CogniShape - Autism Screening Application

NeuroNest is a comprehensive autism screening application that uses GPT-4 powered AI analysis to assess behavioral patterns through interactive gameplay. The application provides real-time monitoring, detailed reports, and evidence-based insights for parents and healthcare professionals.

## 🚀 Features

### Core Functionality
- **Interactive Game-based Assessment**: Engaging games designed to observe behavioral patterns
- **Real-time Monitoring**: Live game monitoring with caretaker controls
- **AI-Powered Analysis**: GPT-4 integration for behavioral pattern analysis
- **Comprehensive Reports**: Detailed diagnostic reports with confidence scores
- **Multi-user Support**: Separate interfaces for parents and doctors
- **Payment Integration**: Razorpay integration for premium features

### Technical Features
- **Real-time Communication**: WebSocket-based live game monitoring
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Secure Authentication**: JWT-based authentication system
- **Database Management**: PostgreSQL with SQLAlchemy ORM
- **AI Caching**: Redis-based caching for AI responses
- **File Management**: Support for report downloads and data export

## 🛠️ Tech Stack

### Frontend
- **React.js 18** - Modern React with hooks
- **Tailwind CSS** - Utility-first CSS framework
- **Phaser.js 3** - Game development framework
- **Socket.io Client** - Real-time communication
- **Recharts** - Data visualization
- **React Router** - Client-side routing
- **Axios** - HTTP client

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - Python SQL toolkit and ORM
- **PostgreSQL** - Primary database (NeonDB compatible)
- **OpenAI API** - GPT-4 integration
- **Redis** - Caching layer
- **WebSockets** - Real-time communication
- **Razorpay** - Payment processing

### Infrastructure
- **Frontend**: Vercel deployment
- **Backend**: Railway/Render deployment
- **Database**: NeonDB (PostgreSQL)
- **Caching**: Redis Cloud
- **CDN**: Vercel Edge Network

## 📦 Installation

### Prerequisites
- Node.js 16+ and npm
- Python 3.9+
- PostgreSQL database
- Redis (optional, for caching)
- OpenAI API key
- Razorpay API keys (for payments)

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/neuronest.git
cd neuronest
```

### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment variables
cp .env.example .env

# Edit .env with your configuration
nano .env
```

#### Environment Variables (Backend)
```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/neuronest

# Security
SECRET_KEY=your-super-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=30

# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key

# Razorpay
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Redis (optional)
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Edit .env.local with your configuration
nano .env.local
```

#### Environment Variables (Frontend)
```env
REACT_APP_API_URL=http://localhost:8000
REACT_APP_WS_URL=ws://localhost:8000
REACT_APP_BACKEND_URL=http://localhost:8000
```

### 4. Database Setup
```bash
cd backend

# Run database migrations
alembic upgrade head

# Or create tables manually
python -c "from database import init_db; init_db()"
```

### 5. Run the Application
```bash
# Start backend (from backend directory)
uvicorn main:app --reload --port 8000

# Start frontend (from frontend directory)
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## 🚀 Deployment

### Frontend Deployment (Vercel)

1. **Connect Repository to Vercel**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy from frontend directory
   cd frontend
   vercel
   ```

2. **Configure Environment Variables in Vercel**
   - `REACT_APP_API_URL`: Your backend URL
   - `REACT_APP_WS_URL`: Your WebSocket URL

3. **Build Settings**
   - Build Command: `npm run build`
   - Output Directory: `build`
   - Install Command: `npm install`

### Backend Deployment (Railway)

1. **Create Railway Project**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login and deploy
   railway login
   railway init
   railway up
   ```

2. **Configure Environment Variables**
   Set all backend environment variables in Railway dashboard

3. **Database Setup**
   - Use Railway PostgreSQL add-on or NeonDB
   - Update `DATABASE_URL` in environment variables

### Database Deployment (NeonDB)

1. **Create NeonDB Project**
   - Sign up at https://neon.tech
   - Create a new project
   - Copy connection string

2. **Update Environment Variables**
   ```env
   DATABASE_URL=postgresql://user:password@ep-cool-scene-123456.us-east-2.aws.neon.tech/neondb
   ```

## 🎮 Usage

### For Parents
1. **Register Account** - Create parent account
2. **Create Child Profile** - Add child's basic information
3. **Start Game Session** - Begin interactive assessment
4. **Monitor Progress** - Use caretaker panel for real-time monitoring
5. **View Reports** - Access AI-generated behavioral reports
6. **Upgrade License** - Expand assessment capacity

### For Doctors
1. **Register Professional Account** - Create doctor account
2. **Manage Multiple Patients** - Handle up to 25 patients by default
3. **Conduct Assessments** - Perform structured behavioral evaluations
4. **Generate Reports** - Create detailed diagnostic reports
5. **Confirm Diagnoses** - Validate AI assessments professionally

### Game Features
- **Drag and Drop Puzzles** - Motor skills and problem-solving assessment
- **Shape Recognition** - Cognitive pattern recognition
- **Surprise Elements** - Adaptability and attention measurement
- **Reaction Time Tracking** - Response speed analysis
- **Error Pattern Detection** - Learning and adaptation assessment

## 🔧 API Documentation

### Authentication Endpoints
```http
POST /auth/register    # User registration
POST /auth/login       # User login
GET  /user/profile     # Get user profile
```

### Children Management
```http
POST /children/create  # Create child profile
GET  /children         # List children
GET  /children/{id}    # Get child details
```

### Game Sessions
```http
POST /session/log      # Log game session
GET  /session/history/{child_id}  # Get session history
```

### Reports
```http
GET  /reports/{child_id}    # Get child reports
POST /reports/{id}/confirm  # Confirm diagnosis
```

### Payments
```http
POST /payments/create-order  # Create payment order
POST /payments/verify       # Verify payment
```

## 🤖 AI Integration

### GPT-4 Analysis Features
- **Behavioral Pattern Recognition**
- **ASD Likelihood Assessment** (0-100% confidence)
- **Personalized Game Configuration**
- **Comparative Analysis** with peer groups
- **Evidence-based Recommendations**

### Caching System
- **Redis-based caching** for similar session analyses
- **95% similarity threshold** for cache hits
- **1-hour cache TTL** for optimal performance

## 💳 Payment Integration

### Razorpay Features
- **Report Unlock**: ₹299 for detailed analysis
- **License Upgrade**: 
  - Parents: ₹999 (10→25 children)
  - Doctors: ₹2499 (25→50 patients)
- **Subscription Plans**: Monthly and yearly options

### Payment Flow
1. User initiates payment
2. Razorpay order creation
3. Payment gateway integration
4. Signature verification
5. Service activation

## 📊 Analytics & Reporting

### Report Components
- **ASD Likelihood Score** with confidence level
- **Behavioral Indicators** observed during gameplay
- **Peer Comparison** against age-matched groups
- **Recommendations** for next steps
- **Session Timeline** with detailed event tracking

### Data Visualization
- **Progress Charts** showing improvement over time
- **Heatmaps** for behavioral pattern visualization
- **Comparison Graphs** against typical development
- **Session Analytics** with completion rates and error patterns

## 🔒 Security & Privacy

### Data Protection
- **JWT Authentication** with secure token handling
- **Encrypted API Communication** via HTTPS
- **Database Encryption** for sensitive data
- **GDPR Compliance** for user data protection

### Privacy Features
- **Anonymized Analytics** for research purposes
- **Data Export** options for users
- **Account Deletion** with complete data removal
- **Consent Management** for data usage

## 🧪 Testing

### Backend Testing
```bash
cd backend
pytest tests/ -v
```

### Frontend Testing
```bash
cd frontend
npm test
```

### Integration Testing
```bash
# Run full test suite
npm run test:full
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Development Guidelines
- Follow PEP 8 for Python code
- Use ESLint configuration for JavaScript
- Write comprehensive tests for new features
- Update documentation for API changes

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Common Issues
- **Database Connection**: Check DATABASE_URL configuration
- **API Errors**: Verify OpenAI API key and rate limits
- **Payment Issues**: Confirm Razorpay credentials and webhook setup
- **WebSocket Problems**: Check CORS settings and WebSocket URL

### Getting Help
- 📧 Email: support@neuronest.app
- 💬 Discord: [NeuroNest Community](https://discord.gg/neuronest)
- 📖 Documentation: [docs.neuronest.app](https://docs.neuronest.app)
- 🐛 Issues: [GitHub Issues](https://github.com/your-username/neuronest/issues)

## 🔮 Roadmap

### Upcoming Features
- **Multi-language Support** - Internationalization
- **Advanced Analytics** - ML-powered insights
- **Mobile Apps** - Native iOS and Android apps
- **Telehealth Integration** - Video consultation features
- **Research Platform** - Anonymous data contribution for research

### Version History
- **v1.0.0** - Initial release with core features
- **v1.1.0** - Enhanced AI analysis and reporting
- **v1.2.0** - Payment integration and licensing
- **v2.0.0** - Real-time monitoring and caretaker panel

---

**Built with ❤️ for autism awareness and early intervention**
