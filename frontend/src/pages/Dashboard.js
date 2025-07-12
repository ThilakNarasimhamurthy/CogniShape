import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Plus, 
  User, 
  Calendar, 
  BarChart3, 
  PlayCircle, 
  FileText, 
  Clock,
  TrendingUp,
  Users,
  Activity,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { childrenAPI, dashboardAPI, sessionAPI } from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [children, setChildren] = useState([]);
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [childrenRes, statsRes, activityRes] = await Promise.all([
        childrenAPI.getAll(),
        dashboardAPI.getStats(),
        dashboardAPI.getRecentActivity()
      ]);
      
      setChildren(childrenRes.data.children || []);
      setStats(statsRes.data);
      setRecentActivity(activityRes.data.activities || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleStartSession = async (childId) => {
    try {
      const response = await sessionAPI.startSession(childId, {});
      toast.success('Game session started!');
      navigate(`/game/${childId}`);
    } catch (error) {
      console.error('Failed to start session:', error);
      toast.error('Failed to start game session');
    }
  };

  const getAgeString = (birthDate) => {
    if (!birthDate) return 'Age not set';
    const today = new Date();
    const birth = new Date(birthDate);
    const years = today.getFullYear() - birth.getFullYear();
    const months = today.getMonth() - birth.getMonth();
    
    if (years === 0) {
      return `${months} months`;
    } else if (months < 0) {
      return `${years - 1} years, ${12 + months} months`;
    } else {
      return years === 1 ? '1 year' : `${years} years`;
    }
  };

  const getRiskLevelColor = (riskLevel) => {
    switch (riskLevel?.toLowerCase()) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'moderate': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return <LoadingSpinner size="large" text="Loading dashboard..." className="min-h-screen" />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.email?.split('@')[0] || 'User'}!
          </h1>
          <p className="text-gray-600 mt-2">
            {user?.role === 'doctor' 
              ? 'Manage your patients and review their progress'
              : 'Monitor your children\'s development and progress'
            }
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    {user?.role === 'doctor' ? 'Total Patients' : 'Children Profiles'}
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats.total_children || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Activity className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Sessions</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats.total_sessions || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FileText className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Generated Reports</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats.total_reports || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-8 w-8 text-indigo-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">This Month</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats.sessions_this_month || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Children/Patients List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  {user?.role === 'doctor' ? 'Patients' : 'Children'}
                </h2>
                <Link
                  to="/profile"
                  className="btn btn-primary btn-sm flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add {user?.role === 'doctor' ? 'Patient' : 'Child'}</span>
                </Link>
              </div>

              <div className="p-6">
                {children.length === 0 ? (
                  <div className="text-center py-12">
                    <User className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      No {user?.role === 'doctor' ? 'patients' : 'children'} yet
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Get started by adding a {user?.role === 'doctor' ? 'patient' : 'child'} profile.
                    </p>
                    <div className="mt-6">
                      <Link to="/profile" className="btn btn-primary">
                        <Plus className="w-4 h-4 mr-2" />
                        Add {user?.role === 'doctor' ? 'Patient' : 'Child'}
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {children.map((child) => (
                      <div key={child.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">
                              {child.name}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {getAgeString(child.birth_date)}
                            </p>
                          </div>
                          {child.latest_risk_assessment && (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskLevelColor(child.latest_risk_assessment)}`}>
                              {child.latest_risk_assessment}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-500 mb-4">
                          <Calendar className="w-4 h-4 mr-1" />
                          <span>
                            Last session: {child.last_session_date 
                              ? new Date(child.last_session_date).toLocaleDateString()
                              : 'Never'
                            }
                          </span>
                        </div>

                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleStartSession(child.id)}
                            className="btn btn-primary btn-sm flex-1 flex items-center justify-center space-x-1"
                          >
                            <PlayCircle className="w-4 h-4" />
                            <span>Start Game</span>
                          </button>
                          <Link
                            to={`/reports/${child.id}`}
                            className="btn btn-outline btn-sm flex items-center justify-center space-x-1"
                          >
                            <BarChart3 className="w-4 h-4" />
                            <span>Reports</span>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
              </div>
              
              <div className="p-6">
                {recentActivity.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">No recent activity</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentActivity.slice(0, 5).map((activity, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          {activity.type === 'session_completed' && (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          )}
                          {activity.type === 'report_generated' && (
                            <FileText className="h-5 w-5 text-blue-500" />
                          )}
                          {activity.type === 'profile_created' && (
                            <User className="h-5 w-5 text-purple-500" />
                          )}
                          {activity.type === 'alert' && (
                            <AlertCircle className="h-5 w-5 text-yellow-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900">
                            {activity.description}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(activity.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
              </div>
              
              <div className="p-6 space-y-3">
                <Link
                  to="/profile"
                  className="w-full btn btn-outline flex items-center justify-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add {user?.role === 'doctor' ? 'Patient' : 'Child'}</span>
                </Link>
                
                <Link
                  to="/reports"
                  className="w-full btn btn-outline flex items-center justify-center space-x-2"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>View All Reports</span>
                </Link>
                
                {user?.role === 'parent' && (
                  <Link
                    to="/payment/upgrade"
                    className="w-full btn btn-outline flex items-center justify-center space-x-2"
                  >
                    <TrendingUp className="w-4 h-4" />
                    <span>Upgrade Plan</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;