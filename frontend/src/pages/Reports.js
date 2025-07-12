import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  FileText, 
  Download, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  Filter,
  Search,
  Eye,
  Share2,
  AlertCircle,
  CheckCircle,
  Clock,
  Target,
  Brain,
  Heart,
  Zap,
  Users
} from 'lucide-react';
import { reportsAPI, childrenAPI } from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const Reports = () => {
  const { childId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDateRange, setFilterDateRange] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [showReportDetails, setShowReportDetails] = useState(false);

  useEffect(() => {
    fetchChildren();
  }, []);

  useEffect(() => {
    if (childId) {
      const child = children.find(c => c.id === parseInt(childId));
      if (child) {
        setSelectedChild(child);
        fetchReports(childId);
      }
    } else if (children.length > 0) {
      setSelectedChild(children[0]);
      fetchReports(children[0].id);
    }
  }, [childId, children]);

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

  const fetchReports = async (childIdParam) => {
    try {
      setLoading(true);
      const response = await reportsAPI.getChildReports(childIdParam);
      setReports(response.data.reports || []);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleChildChange = (child) => {
    setSelectedChild(child);
    navigate(`/reports/${child.id}`);
    fetchReports(child.id);
  };

  const downloadReport = async (reportId, reportTitle) => {
    try {
      const response = await reportsAPI.downloadReport(reportId);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${reportTitle}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Report downloaded successfully');
    } catch (error) {
      console.error('Failed to download report:', error);
      toast.error('Failed to download report');
    }
  };

  const generateNewReport = async () => {
    if (!selectedChild) return;
    
    try {
      setLoading(true);
      await reportsAPI.generateReport(selectedChild.id, []);
      toast.success('New report generated successfully');
      fetchReports(selectedChild.id);
    } catch (error) {
      console.error('Failed to generate report:', error);
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredReports = () => {
    let filtered = reports;

    // Filter by date range
    if (filterDateRange !== 'all') {
      const now = new Date();
      const daysAgo = {
        '7d': 7,
        '30d': 30,
        '90d': 90
      }[filterDateRange];
      
      if (daysAgo) {
        const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(report => new Date(report.created_at) >= cutoffDate);
      }
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(report => 
        report.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.summary?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const getRiskLevelColor = (riskLevel) => {
    switch (riskLevel?.toLowerCase()) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'moderate': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading && reports.length === 0) {
    return <LoadingSpinner size="large" text="Loading reports..." className="min-h-screen" />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Behavioral Analysis Reports</h1>
              <p className="text-gray-600 mt-2">
                View and download comprehensive autism screening reports
              </p>
            </div>
            <button
              onClick={generateNewReport}
              disabled={!selectedChild || loading}
              className="btn btn-primary flex items-center space-x-2"
            >
              <FileText className="w-4 h-4" />
              <span>Generate New Report</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Child Selector */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
              <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-900">
                  {user?.role === 'doctor' ? 'Select Patient' : 'Select Child'}
                </h3>
              </div>
              <div className="p-4">
                {children.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No {user?.role === 'doctor' ? 'patients' : 'children'} found
                  </p>
                ) : (
                  <div className="space-y-2">
                    {children.map((child) => (
                      <button
                        key={child.id}
                        onClick={() => handleChildChange(child)}
                        className={`w-full text-left p-3 rounded-md border transition-colors ${
                          selectedChild?.id === child.id
                            ? 'border-primary-500 bg-primary-50 text-primary-900'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="font-medium text-sm">{child.name}</div>
                        <div className="text-xs text-gray-500">
                          Age: {child.age || 'Not set'}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
              <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-900">Filters</h3>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date Range
                  </label>
                  <select
                    value={filterDateRange}
                    onChange={(e) => setFilterDateRange(e.target.value)}
                    className="input text-sm"
                  >
                    <option value="all">All Time</option>
                    <option value="7d">Last 7 Days</option>
                    <option value="30d">Last 30 Days</option>
                    <option value="90d">Last 90 Days</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search Reports
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search reports..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="input pl-9 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            {selectedChild && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-4 py-3 border-b border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900">Quick Stats</h3>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Reports</span>
                    <span className="text-sm font-medium text-gray-900">
                      {reports.length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Last Assessment</span>
                    <span className="text-sm font-medium text-gray-900">
                      {reports.length > 0 
                        ? new Date(reports[0].created_at).toLocaleDateString()
                        : 'Never'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Risk Level</span>
                    <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                      selectedChild.latest_risk_assessment 
                        ? getRiskLevelColor(selectedChild.latest_risk_assessment)
                        : 'text-gray-600 bg-gray-100'
                    }`}>
                      {selectedChild.latest_risk_assessment || 'Not assessed'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Reports List */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-900">
                    Reports for {selectedChild?.name || 'Selected Child'}
                  </h2>
                  <div className="flex items-center space-x-2">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500">
                      {getFilteredReports().length} reports
                    </span>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-gray-200">
                {getFilteredReports().length === 0 ? (
                  <div className="p-12 text-center">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No reports found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {selectedChild 
                        ? 'Generate your first report to get started with behavioral analysis.'
                        : 'Select a child to view their reports.'
                      }
                    </p>
                    {selectedChild && (
                      <div className="mt-6">
                        <button
                          onClick={generateNewReport}
                          className="btn btn-primary"
                        >
                          Generate First Report
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  getFilteredReports().map((report) => (
                    <div key={report.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-medium text-gray-900">
                              {report.title || 'Behavioral Analysis Report'}
                            </h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              getRiskLevelColor(report.risk_level)
                            }`}>
                              {report.risk_level || 'Pending'}
                            </span>
                            {report.confidence_score && (
                              <span className={`text-sm font-medium ${getConfidenceColor(report.confidence_score)}`}>
                                {report.confidence_score}% confidence
                              </span>
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-3">
                            {report.summary || 'Comprehensive behavioral analysis based on game session data and AI-powered insights.'}
                          </p>
                          
                          <div className="flex items-center space-x-6 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span>{new Date(report.created_at).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>{report.session_duration || 0} minutes</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Target className="w-4 h-4" />
                              <span>{report.tasks_completed || 0} tasks completed</span>
                            </div>
                          </div>

                          {/* Key Metrics */}
                          {report.metrics && (
                            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                              {[
                                { key: 'attention_score', label: 'Attention', icon: Brain, unit: '%' },
                                { key: 'social_interaction', label: 'Social', icon: Users, unit: '%' },
                                { key: 'motor_skills', label: 'Motor Skills', icon: Target, unit: '%' },
                                { key: 'engagement', label: 'Engagement', icon: Heart, unit: '%' }
                              ].map((metric) => {
                                const Icon = metric.icon;
                                const value = report.metrics[metric.key] || 0;
                                
                                return (
                                  <div key={metric.key} className="text-center p-2 bg-gray-50 rounded">
                                    <Icon className="w-4 h-4 text-gray-600 mx-auto mb-1" />
                                    <div className="text-sm font-medium text-gray-900">
                                      {Math.round(value)}{metric.unit}
                                    </div>
                                    <div className="text-xs text-gray-500">{metric.label}</div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col space-y-2 ml-6">
                          <button
                            onClick={() => {
                              setSelectedReport(report);
                              setShowReportDetails(true);
                            }}
                            className="btn btn-outline btn-sm flex items-center space-x-2"
                          >
                            <Eye className="w-4 h-4" />
                            <span>View</span>
                          </button>
                          <button
                            onClick={() => downloadReport(report.id, report.title)}
                            className="btn btn-primary btn-sm flex items-center space-x-2"
                          >
                            <Download className="w-4 h-4" />
                            <span>Download</span>
                          </button>
                          <button className="btn btn-outline btn-sm flex items-center space-x-2">
                            <Share2 className="w-4 h-4" />
                            <span>Share</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Report Details Modal */}
        {showReportDetails && selectedReport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  {selectedReport.title || 'Report Details'}
                </h2>
                <button
                  onClick={() => setShowReportDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Assessment Summary</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Risk Level:</span>
                        <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                          getRiskLevelColor(selectedReport.risk_level)
                        }`}>
                          {selectedReport.risk_level || 'Not assessed'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Confidence:</span>
                        <span className={`text-sm font-medium ${getConfidenceColor(selectedReport.confidence_score)}`}>
                          {selectedReport.confidence_score || 0}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Date:</span>
                        <span className="text-sm text-gray-900">
                          {new Date(selectedReport.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Session Details</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Duration:</span>
                        <span className="text-sm text-gray-900">
                          {selectedReport.session_duration || 0} minutes
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Tasks Completed:</span>
                        <span className="text-sm text-gray-900">
                          {selectedReport.tasks_completed || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Overall Score:</span>
                        <span className="text-sm text-gray-900">
                          {selectedReport.overall_score || 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Behavioral Analysis</h3>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {selectedReport.detailed_analysis || selectedReport.summary || 
                     'This report contains a comprehensive analysis of behavioral patterns observed during the game session. The AI-powered assessment evaluates various aspects including attention span, social interaction, motor skills, and cognitive processing to provide insights into potential autism spectrum indicators.'}
                  </p>
                </div>

                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Recommendations</h3>
                  <div className="space-y-2">
                    {selectedReport.recommendations?.length > 0 ? (
                      selectedReport.recommendations.map((rec, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                          <span className="text-sm text-gray-700">{rec}</span>
                        </div>
                      ))
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-start space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                          <span className="text-sm text-gray-700">Continue regular monitoring and assessment</span>
                        </div>
                        <div className="flex items-start space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                          <span className="text-sm text-gray-700">Consult with healthcare professionals for further evaluation</span>
                        </div>
                        <div className="flex items-start space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                          <span className="text-sm text-gray-700">Maintain consistent engagement in developmental activities</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowReportDetails(false)}
                    className="btn btn-outline"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => downloadReport(selectedReport.id, selectedReport.title)}
                    className="btn btn-primary flex items-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download PDF</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;