import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  FileText, 
  Download, 
  Eye, 
  Clock, 
  User, 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Brain,
  Target,
  Users,
  Calendar,
  Printer
} from 'lucide-react';
import { api } from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const Reports = () => {
  const { childId } = useParams();
  const { user } = useAuth();
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [reports, setReports] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    if (childId) {
      fetchChildReports(childId);
    } else {
      fetchAllChildren();
    }
  }, [childId]);

  const fetchAllChildren = async () => {
    try {
      const response = await api.get('/user/profile');
      setChildren(response.data.children || []);
      
      if (response.data.children.length > 0) {
        const firstChild = response.data.children[0];
        setSelectedChild(firstChild);
        fetchChildReports(firstChild.id);
      }
    } catch (error) {
      console.error('Failed to fetch children:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChildReports = async (cId) => {
    try {
      setLoading(true);
      const response = await api.get(`/reports/${cId}`);
      setSelectedChild(response.data.child);
      setReports(response.data.reports || []);
      setSessions(response.data.sessions || []);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateProgressData = () => {
    if (sessions.length === 0) return [];
    
    return sessions.map((session, index) => ({
      session: index + 1,
      completionTime: session.completion_time,
      errors: session.errors,
      reactionTime: session.reaction_time,
      date: new Date(session.created_at).toLocaleDateString()
    }));
  };

  const calculateOverallStats = () => {
    if (sessions.length === 0) {
      return {
        avgCompletionTime: 0,
        avgErrors: 0,
        avgReactionTime: 0,
        totalSessions: 0,
        improvementTrend: 'stable'
      };
    }

    const avgCompletionTime = sessions.reduce((sum, s) => sum + s.completion_time, 0) / sessions.length;
    const avgErrors = sessions.reduce((sum, s) => sum + s.errors, 0) / sessions.length;
    const avgReactionTime = sessions.reduce((sum, s) => sum + s.reaction_time, 0) / sessions.length;

    // Calculate improvement trend (comparing first half vs second half)
    const midPoint = Math.floor(sessions.length / 2);
    const firstHalf = sessions.slice(0, midPoint);
    const secondHalf = sessions.slice(midPoint);

    const firstHalfAvgErrors = firstHalf.length > 0 
      ? firstHalf.reduce((sum, s) => sum + s.errors, 0) / firstHalf.length 
      : 0;
    const secondHalfAvgErrors = secondHalf.length > 0 
      ? secondHalf.reduce((sum, s) => sum + s.errors, 0) / secondHalf.length 
      : 0;

    const improvementTrend = secondHalfAvgErrors < firstHalfAvgErrors ? 'improving' : 
                           secondHalfAvgErrors > firstHalfAvgErrors ? 'declining' : 'stable';

    return {
      avgCompletionTime: Math.round(avgCompletionTime),
      avgErrors: Math.round(avgErrors * 10) / 10,
      avgReactionTime: Math.round(avgReactionTime),
      totalSessions: sessions.length,
      improvementTrend
    };
  };

  const viewReport = (report) => {
    setSelectedReport(report);
    setShowReportModal(true);
  };

  const downloadReport = async (reportId) => {
    try {
      const response = await api.get(`/reports/${reportId}/download`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${selectedChild?.name}_report_${new Date().toISOString().split('T')[0]}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download report:', error);
    }
  };

  const getASDLikelihoodColor = (likelihood) => {
    if (likelihood >= 70) return 'text-red-600 bg-red-100';
    if (likelihood >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const stats = calculateOverallStats();
  const progressData = generateProgressData();

  if (loading) {
    return <LoadingSpinner size="large" text="Loading reports..." className="min-h-screen" />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Assessment Reports</h1>
              <p className="mt-2 text-gray-600">
                AI-powered behavioral analysis and diagnostic insights
              </p>
            </div>
            
            {selectedChild && (
              <div className="flex space-x-3">
                <Link
                  to={`/game/${selectedChild.id}`}
                  className="btn btn-primary flex items-center space-x-2"
                >
                  <Brain className="w-4 h-4" />
                  <span>New Assessment</span>
                </Link>
                
                <button
                  onClick={() => window.print()}
                  className="btn btn-outline flex items-center space-x-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Child Selector */}
        {!childId && children.length > 1 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Child
            </label>
            <select
              className="input max-w-md"
              value={selectedChild?.id || ''}
              onChange={(e) => {
                const child = children.find(c => c.id === e.target.value);
                setSelectedChild(child);
                if (child) fetchChildReports(child.id);
              }}
            >
              {children.map(child => (
                <option key={child.id} value={child.id}>
                  {child.name} (Age {child.age})
                </option>
              ))}
            </select>
          </div>
        )}

        {!selectedChild ? (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No children found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Add a child profile to start generating reports.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Child Info & Overview Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Child Profile */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{selectedChild.name}</h3>
                    <p className="text-sm text-gray-500">Age {selectedChild.age}</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Gender:</span>
                    <span className="font-medium">{selectedChild.gender}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Interests:</span>
                    <span className="font-medium text-xs">{selectedChild.special_interest}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      selectedChild.diagnosis_status === 'confirmed' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedChild.diagnosis_status === 'confirmed' ? 'Assessed' : 'Pending'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Total Sessions</span>
                  <Calendar className="w-4 h-4 text-gray-400" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{stats.totalSessions}</div>
                <div className="text-xs text-gray-500">Assessment sessions</div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Avg Errors</span>
                  <Target className="w-4 h-4 text-gray-400" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{stats.avgErrors}</div>
                <div className="text-xs text-gray-500">Per session</div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Progress</span>
                  {stats.improvementTrend === 'improving' ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : stats.improvementTrend === 'declining' ? (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  ) : (
                    <BarChart3 className="w-4 h-4 text-gray-400" />
                  )}
                </div>
                <div className={`text-2xl font-bold ${
                  stats.improvementTrend === 'improving' ? 'text-green-600' : 
                  stats.improvementTrend === 'declining' ? 'text-red-600' : 'text-gray-900'
                }`}>
                  {stats.improvementTrend === 'improving' ? 'Improving' : 
                   stats.improvementTrend === 'declining' ? 'Declining' : 'Stable'}
                </div>
                <div className="text-xs text-gray-500">Overall trend</div>
              </div>
            </div>

            {/* Progress Charts */}
            {sessions.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Progress Over Time</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={progressData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="session" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="errors" stroke="#ef4444" strokeWidth={2} />
                      <Line type="monotone" dataKey="reactionTime" stroke="#3b82f6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Completion Time Trend</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={progressData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="session" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="completionTime" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* AI Reports */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">AI Analysis Reports</h3>
              </div>
              
              <div className="p-6">
                {reports.length === 0 ? (
                  <div className="text-center py-8">
                    <Brain className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No reports generated</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Complete a game session to generate an AI analysis report.
                    </p>
                    <div className="mt-6">
                      <Link
                        to={`/game/${selectedChild.id}`}
                        className="btn btn-primary"
                      >
                        Start Assessment
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reports.map((report) => (
                      <div key={report.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <Brain className="w-5 h-5 text-primary-600" />
                              <div>
                                <h4 className="font-medium text-gray-900">
                                  AI Behavioral Analysis Report
                                </h4>
                                <p className="text-sm text-gray-500">
                                  Generated on {new Date(report.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            
                            {report.report_data && (
                              <div className="mt-3 flex items-center space-x-4">
                                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                                  getASDLikelihoodColor(report.report_data.asd_likelihood || 0)
                                }`}>
                                  ASD Likelihood: {report.report_data.asd_likelihood || 0}%
                                </div>
                                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  report.report_data.confidence_level === 'high' ? 'bg-green-100 text-green-800' :
                                  report.report_data.confidence_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  Confidence: {report.report_data.confidence_level || 'Low'}
                                </div>
                                {report.diagnosis && (
                                  <div className="flex items-center space-x-1">
                                    {report.diagnosis === 'autism' ? (
                                      <AlertCircle className="w-4 h-4 text-red-500" />
                                    ) : report.diagnosis === 'non-autism' ? (
                                      <CheckCircle className="w-4 h-4 text-green-500" />
                                    ) : (
                                      <XCircle className="w-4 h-4 text-gray-500" />
                                    )}
                                    <span className="text-sm font-medium capitalize">
                                      {report.diagnosis}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex space-x-2">
                            <button
                              onClick={() => viewReport(report)}
                              className="btn btn-outline btn-sm flex items-center space-x-1"
                            >
                              <Eye className="w-4 h-4" />
                              <span>View</span>
                            </button>
                            <button
                              onClick={() => downloadReport(report.id)}
                              className="btn btn-primary btn-sm flex items-center space-x-1"
                            >
                              <Download className="w-4 h-4" />
                              <span>Download</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Session History */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Session History</h3>
              </div>
              
              <div className="p-6">
                {sessions.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">No sessions recorded yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Level
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Duration
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Errors
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Reaction Time
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {sessions.map((session) => (
                          <tr key={session.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(session.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {session.level}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {Math.round(session.completion_time)}s
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {session.errors}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {Math.round(session.reaction_time)}ms
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                session.abandoned 
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {session.abandoned ? 'Incomplete' : 'Completed'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Report Modal */}
      {showReportModal && selectedReport && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowReportModal(false)}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    AI Behavioral Analysis Report
                  </h3>
                  <button
                    onClick={() => setShowReportModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
                
                {selectedReport.report_data && (
                  <div className="space-y-6">
                    {/* ASD Likelihood */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">Assessment Summary</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm text-gray-600">ASD Likelihood</span>
                          <div className={`text-2xl font-bold ${
                            selectedReport.report_data.asd_likelihood >= 70 ? 'text-red-600' :
                            selectedReport.report_data.asd_likelihood >= 40 ? 'text-yellow-600' : 'text-green-600'
                          }`}>
                            {selectedReport.report_data.asd_likelihood}%
                          </div>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Confidence Level</span>
                          <div className="text-lg font-medium capitalize">
                            {selectedReport.report_data.confidence_level}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Key Indicators */}
                    {selectedReport.report_data.key_indicators && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Key Behavioral Indicators</h4>
                        <ul className="space-y-1">
                          {selectedReport.report_data.key_indicators.map((indicator, index) => (
                            <li key={index} className="text-sm text-gray-600 flex items-start">
                              <span className="w-2 h-2 bg-primary-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                              {indicator}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Analysis Summary */}
                    {selectedReport.report_data.analysis_summary && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Detailed Analysis</h4>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {selectedReport.report_data.analysis_summary}
                        </p>
                      </div>
                    )}

                    {/* Recommendations */}
                    {selectedReport.report_data.recommendations && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Recommendations</h4>
                        {selectedReport.report_data.recommendations.caregiver_notes && (
                          <p className="text-sm text-gray-600 mb-3">
                            {selectedReport.report_data.recommendations.caregiver_notes}
                          </p>
                        )}
                        {selectedReport.report_data.recommendations.follow_up_needed && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                            <div className="flex">
                              <AlertCircle className="h-5 w-5 text-yellow-400" />
                              <div className="ml-3">
                                <h3 className="text-sm font-medium text-yellow-800">
                                  Follow-up Recommended
                                </h3>
                                <p className="mt-1 text-sm text-yellow-700">
                                  Consider consulting with a healthcare professional for further evaluation.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={() => downloadReport(selectedReport.id)}
                  className="btn btn-primary sm:ml-3 sm:w-auto"
                >
                  Download PDF
                </button>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="btn btn-outline mt-3 sm:mt-0 sm:w-auto"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
