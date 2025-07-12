import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Plus, 
  Users, 
  FileText, 
  BarChart3, 
  Play, 
  Monitor,
  Crown,
  AlertCircle,
  Activity,
  TrendingUp 
} from 'lucide-react';
import { api } from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState([]);
  const [showAddChildModal, setShowAddChildModal] = useState(false);
  const [childForm, setChildForm] = useState({
    name: '',
    age: '',
    gender: '',
    special_interest: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await api.get('/user/profile');
      setUserProfile(response.data);
      setChildren(response.data.children || []);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddChild = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/children/create', childForm);
      setShowAddChildModal(false);
      setChildForm({ name: '', age: '', gender: '', special_interest: '' });
      toast.success('Child profile created successfully');
      await fetchUserProfile();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create child profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="large" text="Loading dashboard..." className="min-h-screen" />;
  }

  const licenseUsage = userProfile?.license || { total_slots: 0, used_slots: 0 };
  const isNearLimit = licenseUsage.used_slots >= licenseUsage.total_slots * 0.8;
  const recentSessions = children.filter(child => child.diagnosis_status !== 'unconfirmed').length;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.email?.split('@')[0]}! 👋
          </h1>
          <p className="mt-2 text-gray-600">
            {user?.role === 'doctor' ? 'Healthcare Professional Dashboard' : 'Parent Dashboard'}
          </p>
        </div>

        {/* License Warning */}
        {isNearLimit && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Approaching License Limit
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    You're using {licenseUsage.used_slots} of {licenseUsage.total_slots} available slots.
                    <Link to="/payment/license" className="font-medium underline hover:text-yellow-600 ml-1">
                      Upgrade your license
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-primary-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-primary-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {user?.role === 'doctor' ? 'Total Patients' : 'Total Children'}
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {licenseUsage.used_slots}
                    <span className="text-sm font-normal text-gray-500">
                      /{licenseUsage.total_slots}
                    </span>
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Reports Generated</dt>
                  <dd className="text-2xl font-bold text-gray-900">{recentSessions}</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Activity className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Sessions</dt>
                  <dd className="text-2xl font-bold text-gray-900">0</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Crown className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Plan Status</dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {licenseUsage.upgraded ? 'Premium' : 'Basic'}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Children/Patients List */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {user?.role === 'doctor' ? 'Patient Profiles' : 'Children Profiles'}
                  </h3>
                  {licenseUsage.used_slots < licenseUsage.total_slots && (
                    <button
                      onClick={() => setShowAddChildModal(true)}
                      className="btn btn-primary flex items-center space-x-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add {user?.role === 'doctor' ? 'Patient' : 'Child'}</span>
                    </button>
                  )}
                </div>

                {children.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      No {user?.role === 'doctor' ? 'patients' : 'children'} yet
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Get started by adding a {user?.role === 'doctor' ? 'patient' : 'child'} profile.
                    </p>
                    <div className="mt-6">
                      <button
                        onClick={() => setShowAddChildModal(true)}
                        className="btn btn-primary"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add {user?.role === 'doctor' ? 'Patient' : 'Child'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {children.map((child) => (
                      <div key={child.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-900">{child.name}</h4>
                            <p className="text-sm text-gray-500">
                              Age: {child.age} • {child.gender} • Interested in {child.special_interest}
                            </p>
                            <div className="flex items-center mt-2 space-x-2">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                child.diagnosis_status === 'confirmed' 
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {child.diagnosis_status === 'confirmed' ? 'Assessed' : 'Pending Assessment'}
                              </span>
                              {child.diagnosis_status === 'confirmed' && (
                                <span className="text-xs text-gray-500 flex items-center">
                                  <TrendingUp className="w-3 h-3 mr-1" />
                                  Progress available
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Link
                              to={`/game/${child.id}`}
                              className="btn btn-primary btn-sm flex items-center space-x-1"
                            >
                              <Play className="h-4 w-4" />
                              <span>Start Game</span>
                            </Link>
                            <Link
                              to={`/caretaker/${child.id}`}
                              className="btn btn-outline btn-sm flex items-center space-x-1"
                            >
                              <Monitor className="h-4 w-4" />
                              <span>Monitor</span>
                            </Link>
                            <Link
                              to={`/reports/${child.id}`}
                              className="btn btn-outline btn-sm flex items-center space-x-1"
                            >
                              <FileText className="h-4 w-4" />
                              <span>Reports</span>
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Quick Actions
                </h3>
                <div className="space-y-3">
                  {licenseUsage.used_slots < licenseUsage.total_slots && (
                    <button
                      onClick={() => setShowAddChildModal(true)}
                      className="w-full btn btn-primary flex items-center justify-center space-x-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add {user?.role === 'doctor' ? 'Patient' : 'Child'}</span>
                    </button>
                  )}
                  <Link
                    to="/reports"
                    className="w-full btn btn-outline flex items-center justify-center space-x-2"
                  >
                    <FileText className="h-4 w-4" />
                    <span>View All Reports</span>
                  </Link>
                  <Link
                    to="/profile"
                    className="w-full btn btn-outline flex items-center justify-center space-x-2"
                  >
                    <Users className="h-4 w-4" />
                    <span>Account Settings</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* License Info */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  License Status
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Used Slots</span>
                    <span className="font-medium">{licenseUsage.used_slots}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Total Slots</span>
                    <span className="font-medium">{licenseUsage.total_slots}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${
                        isNearLimit ? 'bg-yellow-500' : 'bg-primary-600'
                      }`}
                      style={{ width: `${Math.min((licenseUsage.used_slots / licenseUsage.total_slots) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <div className="text-center">
                    <span className={`text-xs ${isNearLimit ? 'text-yellow-600' : 'text-gray-500'}`}>
                      {Math.round((licenseUsage.used_slots / licenseUsage.total_slots) * 100)}% used
                    </span>
                  </div>
                  {(licenseUsage.used_slots >= licenseUsage.total_slots || isNearLimit) && (
                    <Link
                      to="/payment/license"
                      className="w-full btn btn-primary text-sm flex items-center justify-center space-x-2"
                    >
                      <Crown className="h-4 w-4" />
                      <span>Upgrade License</span>
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Recent Activity
                </h3>
                <div className="space-y-3">
                  {recentSessions === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No recent activity
                    </p>
                  ) : (
                    <div className="text-sm text-gray-600">
                      <p className="flex items-center space-x-2">
                        <Activity className="h-4 w-4 text-green-500" />
                        <span>{recentSessions} reports generated</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {showAddChildModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowAddChildModal(false)}></div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleAddChild}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Add {user?.role === 'doctor' ? 'Patient' : 'Child'} Profile
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input
                        type="text"
                        required
                        className="input"
                        value={childForm.name}
                        onChange={(e) => setChildForm(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                      <input
                        type="number"
                        required
                        min="1"
                        max="18"
                        className="input"
                        value={childForm.age}
                        onChange={(e) => setChildForm(prev => ({ ...prev, age: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                      <select
                        required
                        className="input"
                        value={childForm.gender}
                        onChange={(e) => setChildForm(prev => ({ ...prev, gender: e.target.value }))}
                      >
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Special Interests</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="e.g., animals, trains, music"
                        value={childForm.special_interest}
                        onChange={(e) => setChildForm(prev => ({ ...prev, special_interest: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn btn-primary sm:ml-3 sm:w-auto"
                  >
                    {saving ? 'Creating...' : 'Create Profile'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddChildModal(false)}
                    className="btn btn-outline mt-3 sm:mt-0 sm:w-auto"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;