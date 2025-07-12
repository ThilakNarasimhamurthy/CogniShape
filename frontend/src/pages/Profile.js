import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Plus, 
  Edit2, 
  Trash2, 
  Save,
  X,
  Baby,
  Heart,
  Stethoscope
} from 'lucide-react';
import { authAPI, childrenAPI } from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, updateUserProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [children, setChildren] = useState([]);
  const [editingChild, setEditingChild] = useState(null);
  const [showChildForm, setShowChildForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const profileForm = useForm({
    defaultValues: {
      email: user?.email || '',
      full_name: user?.full_name || '',
      phone: user?.phone || '',
      address: user?.address || '',
      organization: user?.organization || ''
    }
  });

  const childForm = useForm();

  useEffect(() => {
    if (activeTab === 'children') {
      fetchChildren();
    }
  }, [activeTab]);

  const fetchChildren = async () => {
    try {
      setLoading(true);
      const response = await childrenAPI.getAll();
      setChildren(response.data.children || []);
    } catch (error) {
      console.error('Failed to fetch children:', error);
      toast.error('Failed to load children profiles');
    } finally {
      setLoading(false);
    }
  };

  const onSubmitProfile = async (data) => {
    setLoading(true);
    const success = await updateUserProfile(data);
    setLoading(false);
    
    if (success) {
      toast.success('Profile updated successfully');
    }
  };

  const onSubmitChild = async (data) => {
    try {
      setLoading(true);
      
      if (editingChild) {
        await childrenAPI.update(editingChild.id, data);
        toast.success('Child profile updated successfully');
      } else {
        await childrenAPI.create(data);
        toast.success('Child profile created successfully');
      }
      
      childForm.reset();
      setEditingChild(null);
      setShowChildForm(false);
      fetchChildren();
    } catch (error) {
      console.error('Failed to save child:', error);
      toast.error('Failed to save child profile');
    } finally {
      setLoading(false);
    }
  };

  const handleEditChild = (child) => {
    setEditingChild(child);
    childForm.reset({
      name: child.name,
      birth_date: child.birth_date,
      gender: child.gender,
      interests: child.interests || '',
      medical_history: child.medical_history || '',
      notes: child.notes || ''
    });
    setShowChildForm(true);
  };

  const handleDeleteChild = async (childId) => {
    if (!window.confirm('Are you sure you want to delete this child profile?')) {
      return;
    }

    try {
      await childrenAPI.delete(childId);
      toast.success('Child profile deleted successfully');
      fetchChildren();
    } catch (error) {
      console.error('Failed to delete child:', error);
      toast.error('Failed to delete child profile');
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

  const tabs = [
    { id: 'profile', name: 'Profile Settings', icon: User },
    { id: 'children', name: user?.role === 'doctor' ? 'Patients' : 'Children', icon: Baby }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-600 mt-2">
            Manage your account settings and {user?.role === 'doctor' ? 'patient' : 'children'} profiles
          </p>
        </div>

        {/* Account Type Badge */}
        <div className="mb-6">
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800">
            {user?.role === 'doctor' ? (
              <>
                <Stethoscope className="w-4 h-4 mr-2" />
                Healthcare Professional
              </>
            ) : (
              <>
                <Heart className="w-4 h-4 mr-2" />
                Parent/Guardian
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Profile Settings Tab */}
        {activeTab === 'profile' && (
          <div className="bg-white shadow-sm rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Account Information</h2>
            </div>
            
            <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      className="input pl-10"
                      disabled
                      {...profileForm.register('email')}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      className="input pl-10"
                      placeholder="Enter your full name"
                      {...profileForm.register('full_name')}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type="tel"
                      className="input pl-10"
                      placeholder="Enter your phone number"
                      {...profileForm.register('phone')}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      className="input pl-10"
                      placeholder="Enter your address"
                      {...profileForm.register('address')}
                    />
                  </div>
                </div>

                {user?.role === 'doctor' && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Organization/Hospital
                    </label>
                    <input
                      type="text"
                      className="input"
                      placeholder="Enter your organization or hospital name"
                      {...profileForm.register('organization')}
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary flex items-center space-x-2"
                >
                  {loading ? (
                    <LoadingSpinner size="small" />
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Children/Patients Tab */}
        {activeTab === 'children' && (
          <div className="space-y-6">
            {/* Add Child Button */}
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">
                {user?.role === 'doctor' ? 'Patient Profiles' : 'Children Profiles'}
              </h2>
              <button
                onClick={() => {
                  setEditingChild(null);
                  childForm.reset();
                  setShowChildForm(true);
                }}
                className="btn btn-primary flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add {user?.role === 'doctor' ? 'Patient' : 'Child'}</span>
              </button>
            </div>

            {/* Child Form Modal */}
            {showChildForm && (
              <div className="bg-white shadow-sm rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">
                    {editingChild ? 'Edit' : 'Add'} {user?.role === 'doctor' ? 'Patient' : 'Child'} Profile
                  </h3>
                  <button
                    onClick={() => setShowChildForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <form onSubmit={childForm.handleSubmit(onSubmitChild)} className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Name *
                      </label>
                      <input
                        type="text"
                        className="input"
                        placeholder="Enter name"
                        {...childForm.register('name', { required: 'Name is required' })}
                      />
                      {childForm.formState.errors.name && (
                        <p className="mt-1 text-sm text-red-600">
                          {childForm.formState.errors.name.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Birth Date *
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <input
                          type="date"
                          className="input pl-10"
                          {...childForm.register('birth_date', { required: 'Birth date is required' })}
                        />
                      </div>
                      {childForm.formState.errors.birth_date && (
                        <p className="mt-1 text-sm text-red-600">
                          {childForm.formState.errors.birth_date.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Gender
                      </label>
                      <select className="input" {...childForm.register('gender')}>
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Interests
                      </label>
                      <input
                        type="text"
                        className="input"
                        placeholder="e.g., puzzles, music, drawing"
                        {...childForm.register('interests')}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Medical History
                      </label>
                      <textarea
                        rows={3}
                        className="input"
                        placeholder="Any relevant medical history or conditions"
                        {...childForm.register('medical_history')}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Additional Notes
                      </label>
                      <textarea
                        rows={3}
                        className="input"
                        placeholder="Any additional notes or observations"
                        {...childForm.register('notes')}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowChildForm(false)}
                      className="btn btn-outline"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn btn-primary flex items-center space-x-2"
                    >
                      {loading ? (
                        <LoadingSpinner size="small" />
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>{editingChild ? 'Update' : 'Create'} Profile</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Children List */}
            <div className="bg-white shadow-sm rounded-lg">
              {loading ? (
                <div className="p-8">
                  <LoadingSpinner size="medium" text="Loading profiles..." />
                </div>
              ) : children.length === 0 ? (
                <div className="p-8 text-center">
                  <Baby className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No {user?.role === 'doctor' ? 'patients' : 'children'} yet
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Get started by adding a {user?.role === 'doctor' ? 'patient' : 'child'} profile.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {children.map((child) => (
                    <div key={child.id} className="p-6 flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{child.name}</h3>
                        <div className="mt-1 text-sm text-gray-500 space-y-1">
                          <p>{getAgeString(child.birth_date)}</p>
                          {child.gender && <p>Gender: {child.gender}</p>}
                          {child.interests && <p>Interests: {child.interests}</p>}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditChild(child)}
                          className="btn btn-outline btn-sm flex items-center space-x-1"
                        >
                          <Edit2 className="w-4 h-4" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteChild(child.id)}
                          className="btn btn-outline btn-sm text-red-600 border-red-200 hover:bg-red-50 flex items-center space-x-1"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;