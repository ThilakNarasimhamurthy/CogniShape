import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  User, 
  Mail, 
  Shield, 
  Bell, 
  Globe, 
  Save, 
  Edit3, 
  Trash2,
  Plus,
  Users,
  Crown,
  Calendar,
  Settings,
  Play
} from 'lucide-react';
import { api } from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const Profile = () => {
  const { user, updateUserProfile } = useAuth();
  const [profile, setProfile] = useState(null);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  
  const [profileForm, setProfileForm] = useState({
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [preferences, setPreferences] = useState({
    notifications: {
      email: true,
      browser: true,
      sessionReminders: true,
      reportReady: true
    },
    privacy: {
      dataSharing: false,
      analytics: true,
      marketing: false
    },
    display: {
      theme: 'light',
      language: 'en',
      timezone: 'UTC'
    }
  });

  const [showAddChildModal, setShowAddChildModal] = useState(false);
  const [childForm, setChildForm] = useState({
    name: '',
    age: '',
    gender: '',
    special_interest: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/user/profile');
      setProfile(response.data);
      setChildren(response.data.children || []);
      setProfileForm({
        email: response.data.user.email,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Update email if changed
      if (profileForm.email !== user.email) {
        await api.put('/user/profile', { email: profileForm.email });
        toast.success('Email updated successfully');
      }

      // Update password if provided
      if (profileForm.newPassword) {
        if (profileForm.newPassword !== profileForm.confirmPassword) {
          toast.error('Passwords do not match');
          return;
        }

        await api.put('/user/password', {
          current_password: profileForm.currentPassword,
          new_password: profileForm.newPassword
        });
        
        setProfileForm(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
        
        toast.success('Password updated successfully');
      }

      await fetchProfile();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePreferencesUpdate = async () => {
    setSaving(true);
    try {
      await api.put('/user/preferences', preferences);
      toast.success('Preferences updated successfully');
    } catch (error) {
      toast.error('Failed to update preferences');
    } finally {
      setSaving(false);
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
      await fetchProfile();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create child profile');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteChild = async (childId, childName) => {
    if (window.confirm(`Are you sure you want to delete ${childName}'s profile? This action cannot be undone.`)) {
      try {
        await api.delete(`/children/${childId}`);
        toast.success('Child profile deleted successfully');
        await fetchProfile();
      } catch (error) {
        toast.error('Failed to delete child profile');
      }
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'children', label: 'Children', icon: Users },
    { id: 'preferences', label: 'Preferences', icon: Settings },
    { id: 'subscription', label: 'Subscription', icon: Crown }
  ];

  if (loading) {
    return <LoadingSpinner size="large" text="Loading profile..." className="min-h-screen" />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
          <p className="mt-2 text-gray-600">Manage your account, children, and preferences</p>
        </div>

        {/* Tabs */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                      activeTab === tab.id
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <form onSubmit={handleProfileUpdate} className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="email"
                          className="input pl-10"
                          value={profileForm.email}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Account Type
                      </label>
                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-2 text-sm font-medium rounded-md ${
                          user?.role === 'doctor' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {user?.role === 'doctor' ? 'Healthcare Professional' : 'Parent'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Password
                      </label>
                      <input
                        type="password"
                        className="input"
                        value={profileForm.currentPassword}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        className="input"
                        value={profileForm.newPassword}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, newPassword: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        className="input"
                        value={profileForm.confirmPassword}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn btn-primary flex items-center space-x-2"
                  >
                    {saving ? (
                      <LoadingSpinner size="small" text="" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            )}

            {/* Children Tab */}
            {activeTab === 'children' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">
                    {user?.role === 'doctor' ? 'Patient Profiles' : 'Children Profiles'}
                  </h3>
                  <button
                    onClick={() => setShowAddChildModal(true)}
                    disabled={profile?.license && profile.license.used_slots >= profile.license.total_slots}
                    className="btn btn-primary flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add {user?.role === 'doctor' ? 'Patient' : 'Child'}</span>
                  </button>
                </div>

                {profile?.license && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <div className="flex items-center space-x-2">
                      <Crown className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-blue-900">
                        License Usage: {profile.license.used_slots} / {profile.license.total_slots}
                      </span>
                    </div>
                    <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${(profile.license.used_slots / profile.license.total_slots) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {children.map((child) => (
                    <div key={child.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">{child.name}</h4>
                          <p className="text-sm text-gray-500">
                            Age: {child.age} • {child.gender} • Interested in {child.special_interest}
                          </p>
                          <div className="mt-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              child.diagnosis_status === 'confirmed' 
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {child.diagnosis_status === 'confirmed' ? 'Assessed' : 'Pending Assessment'}
                            </span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {/* Edit child logic */}}
                            className="btn btn-outline btn-sm"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteChild(child.id, child.name)}
                            className="btn btn-danger btn-sm"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <Link to={`/game/${child.id}`} className="btn btn-success btn-sm flex items-center space-x-1">
                            <Play className="w-4 h-4" />
                            <span>Launch Game</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h3>
                  <div className="space-y-4">
                    {Object.entries(preferences.notifications).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={value}
                            onChange={(e) => setPreferences(prev => ({
                              ...prev,
                              notifications: { ...prev.notifications, [key]: e.target.checked }
                            }))}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Privacy Settings</h3>
                  <div className="space-y-4">
                    {Object.entries(preferences.privacy).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={value}
                            onChange={(e) => setPreferences(prev => ({
                              ...prev,
                              privacy: { ...prev.privacy, [key]: e.target.checked }
                            }))}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handlePreferencesUpdate}
                    disabled={saving}
                    className="btn btn-primary flex items-center space-x-2"
                  >
                    {saving ? (
                      <LoadingSpinner size="small" text="" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>Save Preferences</span>
                  </button>
                </div>
              </div>
            )}

            {/* Subscription Tab */}
            {activeTab === 'subscription' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Subscription & Billing</h3>
                
                {profile?.license && (
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">Current Plan</h4>
                        <p className="text-sm text-gray-500">
                          {profile.license.upgraded ? 'Premium Plan' : 'Basic Plan'}
                        </p>
                      </div>
                      <Crown className="w-8 h-8 text-yellow-500" />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">
                          {profile.license.total_slots}
                        </div>
                        <div className="text-sm text-gray-500">Total Slots</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">
                          {profile.license.used_slots}
                        </div>
                        <div className="text-sm text-gray-500">Used Slots</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {profile.license.total_slots - profile.license.used_slots}
                        </div>
                        <div className="text-sm text-gray-500">Available</div>
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                      <div 
                        className="bg-primary-600 h-3 rounded-full transition-all"
                        style={{ width: `${(profile.license.used_slots / profile.license.total_slots) * 100}%` }}
                      ></div>
                    </div>
                    
                    {!profile.license.upgraded && (
                      <div className="text-center">
                        <button className="btn btn-primary">
                          Upgrade to Premium
                        </button>
                        <p className="text-sm text-gray-500 mt-2">
                          Get more slots and advanced features
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Child Modal */}
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

export default Profile;