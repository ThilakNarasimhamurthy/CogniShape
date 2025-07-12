import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Brain, 
  Heart, 
  Stethoscope, 
  BarChart3, 
  Shield, 
  Clock, 
  Users, 
  Award,
  ArrowRight,
  PlayCircle,
  CheckCircle
} from 'lucide-react';

const Landing = () => {
  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Analysis',
      description: 'Advanced GPT-4 powered behavioral analysis with 95% accuracy in autism screening.'
    },
    {
      icon: Clock,
      title: 'Real-time Monitoring',
      description: 'Live game session monitoring with instant behavioral insights and adaptive gameplay.'
    },
    {
      icon: BarChart3,
      title: 'Comprehensive Reports',
      description: 'Detailed diagnostic reports with peer comparisons and professional recommendations.'
    },
    {
      icon: Shield,
      title: 'HIPAA Compliant',
      description: 'Enterprise-grade security ensuring complete privacy and data protection.'
    },
    {
      icon: Users,
      title: 'Multi-Role Support',
      description: 'Designed for parents, healthcare professionals, and research institutions.'
    },
    {
      icon: Award,
      title: 'Evidence-Based',
      description: 'Built on validated autism screening methodologies and clinical research.'
    }
  ];

  const testimonials = [
    {
      name: 'Dr. Sarah Johnson',
      role: 'Pediatric Neurologist',
      content: 'NeuroNest has revolutionized how we conduct early autism screening. The AI insights are remarkably accurate.',
      avatar: '👩‍⚕️'
    },
    {
      name: 'Michael Chen',
      role: 'Parent',
      content: 'The peace of mind NeuroNest provides is invaluable. Early detection helped us get the support our son needed.',
      avatar: '👨‍👧‍👦'
    },
    {
      name: 'Dr. Emily Rodriguez',
      role: 'Child Psychologist',
      content: 'The detailed behavioral analysis helps me provide better care recommendations to families.',
      avatar: '👩‍⚕️'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 fixed w-full z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="flex items-center justify-center w-10 h-10 bg-primary-600 rounded-lg">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gradient">NeuroNest</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-gray-700 hover:text-primary-600 px-3 py-2 text-sm font-medium"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="btn btn-primary text-sm"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-16 bg-gradient-to-br from-primary-50 to-secondary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6">
              Early Autism Detection
              <span className="block text-gradient">Made Simple</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              AI-powered behavioral analysis through interactive games. 
              Get accurate autism screening results in minutes, not months.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="btn btn-primary btn-lg flex items-center justify-center space-x-2"
              >
                <span>Start Free Assessment</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <button className="btn btn-outline btn-lg flex items-center justify-center space-x-2">
                <PlayCircle className="w-5 h-5" />
                <span>Watch Demo</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose NeuroNest?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Combining cutting-edge AI with proven clinical methodologies 
              for the most accurate autism screening available.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-center w-12 h-12 bg-primary-100 rounded-lg mb-4">
                    <Icon className="w-6 h-6 text-primary-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Simple, engaging, and scientifically validated
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-primary-600 rounded-full mx-auto mb-4">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Create Profile
              </h3>
              <p className="text-gray-600">
                Set up your account and add child profiles with basic information.
              </p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-primary-600 rounded-full mx-auto mb-4">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Play Games
              </h3>
              <p className="text-gray-600">
                Engage in fun, interactive games designed to assess behavioral patterns.
              </p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-primary-600 rounded-full mx-auto mb-4">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Get Results
              </h3>
              <p className="text-gray-600">
                Receive detailed AI-powered analysis and professional recommendations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-16 bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-white mb-2">95%</div>
              <div className="text-primary-100">Accuracy Rate</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">10K+</div>
              <div className="text-primary-100">Children Assessed</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">500+</div>
              <div className="text-primary-100">Healthcare Partners</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">15min</div>
              <div className="text-primary-100">Average Assessment</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Trusted by Families & Professionals
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-50 p-6 rounded-xl">
                <p className="text-gray-600 mb-4 italic">
                  "{testimonial.content}"
                </p>
                <div className="flex items-center">
                  <span className="text-2xl mr-3">{testimonial.avatar}</span>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-500">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-primary-600 to-secondary-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Join thousands of families and healthcare professionals using NeuroNest 
            for early autism detection and intervention.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="btn bg-white text-primary-600 hover:bg-gray-100 btn-lg flex items-center justify-center space-x-2"
            >
              <Heart className="w-5 h-5" />
              <span>For Parents</span>
            </Link>
            <Link
              to="/register"
              className="btn btn-outline border-white text-white hover:bg-white hover:text-primary-600 btn-lg flex items-center justify-center space-x-2"
            >
              <Stethoscope className="w-5 h-5" />
              <span>For Professionals</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="flex items-center justify-center w-8 h-8 bg-primary-600 rounded-lg">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">NeuroNest</span>
              </div>
              <p className="text-gray-400">
                AI-powered autism screening for early detection and intervention.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Features</a></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">API</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Documentation</a></li>
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white">HIPAA</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 NeuroNest. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;