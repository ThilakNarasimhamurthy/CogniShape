import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';
import { 
  Eye, 
  Play, 
  Pause, 
  Square, 
  Settings, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  Target,
  Brain,
  Heart,
  Zap,
  BarChart3,
  MessageCircle,
  Volume2,
  VolumeX
} from 'lucide-react';
import { sessionAPI, childrenAPI } from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const CaretakerPanel = () => {
  const { childId } = useParams();
  const navigate = useNavigate();
  const { socket, isConnected } = useSocket();
  
  const [child, setChild] = useState(null);
  const [session, setSession] = useState(null);
  const [gameState, setGameState] = useState('waiting');
  const [behaviorMetrics, setBehaviorMetrics] = useState({});
  const [realtimeEvents, setRealtimeEvents] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);

  useEffect(() => {
    fetchData();
    connectToSession();
    
    return () => {
      if (socket && session?.id) {
        socket.emit('leave_caretaker_session', { session_id: session.id });
      }
    };
  }, [childId]);

  useEffect(() => {
    if (socket && isConnected && session) {
      setupSocketListeners();
    }
  }, [socket, isConnected, session]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [childRes, sessionRes] = await Promise.all([
        childrenAPI.getById(childId),
        sessionAPI.getHistory(childId)
      ]);
      
      setChild(childRes.data.child);
      // Get the most recent active session
      const activeSessions = sessionRes.data.sessions.filter(s => s.status === 'active');
      if (activeSessions.length > 0) {
        setSession(activeSessions[0]);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load session data');
    } finally {
      setLoading(false);
    }
  };

  const connectToSession = () => {
    if (socket && isConnected && session?.id) {
      socket.emit('join_caretaker_session', { 
        session_id: session.id,
        child_id: childId 
      });
    }
  };

  const setupSocketListeners = () => {
    if (!socket) return;

    socket.on('game_state_update', (data) => {
      setGameState(data.state);
    });

    socket.on('behavior_update', (data) => {
      setBehaviorMetrics(prev => ({ ...prev, ...data.metrics }));
      addRealtimeEvent({
        type: 'behavior_update',
        timestamp: new Date(),
        data: data.metrics
      });
    });

    socket.on('game_event', (data) => {
      addRealtimeEvent({
        type: 'game_event',
        timestamp: new Date(),
        data
      });
      
      // Check for alerts
      if (data.event_type === 'attention_drop' || data.event_type === 'frustration_detected') {
        addAlert({
          type: 'warning',
          message: `${data.event_type.replace('_', ' ')} detected`,
          timestamp: new Date()
        });
      }
    });

    socket.on('session_ended', (data) => {
      setGameState('ended');
      toast.success('Session completed');
    });

    return () => {
      socket.off('game_state_update');
      socket.off('behavior_update');
      socket.off('game_event');
      socket.off('session_ended');
    };
  };

  const addRealtimeEvent = (event) => {
    setRealtimeEvents(prev => [event, ...prev.slice(0, 49)]); // Keep last 50 events
  };

  const addAlert = (alert) => {
    setAlerts(prev => [{ ...alert, id: Date.now() }, ...prev.slice(0, 9)]); // Keep last 10 alerts
  };

  const sendCaretakerAction = (action, data = {}) => {
    if (socket && session) {
      socket.emit('caretaker_action', {
        session_id: session.id,
        action,
        ...data
      });
    }
  };

  const pauseGame = () => {
    sendCaretakerAction('pause_game');
    toast.info('Game paused');
  };

  const resumeGame = () => {
    sendCaretakerAction('resume_game');
    toast.info('Game resumed');
  };

  const adjustDifficulty = (newDifficulty) => {
    sendCaretakerAction('adjust_difficulty', { new_difficulty: newDifficulty });
    toast.info(`Difficulty adjusted to ${newDifficulty}`);
  };

  const endSession = () => {
    sendCaretakerAction('end_session');
    toast.info('Session ended by caretaker');
  };

  const getMetricTrend = (metric) => {
    // This would typically compare with historical data
    const value = behaviorMetrics[metric] || 0;
    if (value > 70) return 'up';
    if (value < 30) return 'down';
    return 'stable';
  };

  const getMetricColor = (metric) => {
    const trend = getMetricTrend(metric);
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getTrendIcon = (metric) => {
    const trend = getMetricTrend(metric);
    switch (trend) {
      case 'up': return TrendingUp;
      case 'down': return TrendingDown;
      default: return Activity;
    }
  };

  if (loading) {
    return <LoadingSpinner size="large" text="Loading caretaker panel..." className="min-h-screen" />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Eye className="w-6 h-6 text-primary-600" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Caretaker Panel - {child?.name}
                </h1>
                <p className="text-sm text-gray-500">Real-time session monitoring</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Connection Status */}
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm text-gray-600">
                  {isConnected ? 'Live' : 'Disconnected'}
                </span>
              </div>

              {/* Audio Toggle */}
              <button
                onClick={() => setAudioEnabled(!audioEnabled)}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100"
              >
                {audioEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>

              {/* Back to Game */}
              <button
                onClick={() => navigate(`/game/${childId}`)}
                className="btn btn-outline btn-sm"
              >
                Back to Game
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Monitoring Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Game Controls */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Session Controls</h2>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {gameState === 'playing' && (
                      <button
                        onClick={pauseGame}
                        className="btn btn-secondary flex items-center space-x-2"
                      >
                        <Pause className="w-4 h-4" />
                        <span>Pause Game</span>
                      </button>
                    )}
                    
                    {gameState === 'paused' && (
                      <button
                        onClick={resumeGame}
                        className="btn btn-primary flex items-center space-x-2"
                      >
                        <Play className="w-4 h-4" />
                        <span>Resume Game</span>
                      </button>
                    )}
                    
                    <button
                      onClick={endSession}
                      className="btn btn-outline flex items-center space-x-2"
                    >
                      <Square className="w-4 h-4" />
                      <span>End Session</span>
                    </button>
                  </div>
                  
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    gameState === 'playing' ? 'bg-green-100 text-green-800' :
                    gameState === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                    gameState === 'waiting' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {gameState.charAt(0).toUpperCase() + gameState.slice(1)}
                  </span>
                </div>

                {/* Difficulty Adjustment */}
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Difficulty Adjustment</h3>
                  <div className="flex space-x-2">
                    {['easy', 'medium', 'hard'].map((level) => (
                      <button
                        key={level}
                        onClick={() => adjustDifficulty(level)}
                        className="btn btn-outline btn-sm"
                      >
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Behavioral Metrics */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Real-time Behavioral Metrics</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {[
                    { key: 'attention_score', label: 'Attention', icon: Brain, unit: '%' },
                    { key: 'engagement_level', label: 'Engagement', icon: Heart, unit: '%' },
                    { key: 'response_time', label: 'Response Time', icon: Clock, unit: 'ms' },
                    { key: 'accuracy', label: 'Accuracy', icon: Target, unit: '%' }
                  ].map((metric) => {
                    const Icon = metric.icon;
                    const TrendIcon = getTrendIcon(metric.key);
                    const value = behaviorMetrics[metric.key] || 0;
                    
                    return (
                      <div key={metric.key} className="text-center">
                        <div className="flex items-center justify-center w-12 h-12 bg-primary-100 rounded-lg mx-auto mb-2">
                          <Icon className="w-6 h-6 text-primary-600" />
                        </div>
                        <div className="flex items-center justify-center space-x-1">
                          <span className={`text-2xl font-bold ${getMetricColor(metric.key)}`}>
                            {Math.round(value)}
                          </span>
                          <span className="text-sm text-gray-500">{metric.unit}</span>
                          <TrendIcon className={`w-4 h-4 ${getMetricColor(metric.key)}`} />
                        </div>
                        <p className="text-sm text-gray-600">{metric.label}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Real-time Events */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Live Event Stream</h2>
              </div>
              <div className="p-6">
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {realtimeEvents.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No events yet. Events will appear here as the session progresses.
                    </p>
                  ) : (
                    realtimeEvents.map((event, index) => (
                      <div key={index} className="flex items-start space-x-3 p-2 bg-gray-50 rounded">
                        <div className="flex-shrink-0 mt-1">
                          {event.type === 'behavior_update' && (
                            <Activity className="w-4 h-4 text-blue-500" />
                          )}
                          {event.type === 'game_event' && (
                            <Zap className="w-4 h-4 text-green-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900">
                            {event.type === 'behavior_update' ? 'Behavior metrics updated' : 
                             event.data.event_type || 'Game event'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {event.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Alerts */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-900">Active Alerts</h3>
              </div>
              <div className="p-4">
                {alerts.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No alerts</p>
                ) : (
                  <div className="space-y-2">
                    {alerts.map((alert) => (
                      <div key={alert.id} className={`p-2 rounded border-l-4 ${
                        alert.type === 'warning' ? 'bg-yellow-50 border-yellow-400' :
                        alert.type === 'error' ? 'bg-red-50 border-red-400' :
                        'bg-blue-50 border-blue-400'
                      }`}>
                        <div className="flex items-start space-x-2">
                          <AlertTriangle className={`w-4 h-4 mt-0.5 ${
                            alert.type === 'warning' ? 'text-yellow-600' :
                            alert.type === 'error' ? 'text-red-600' :
                            'text-blue-600'
                          }`} />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {alert.message}
                            </p>
                            <p className="text-xs text-gray-500">
                              {alert.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Session Summary */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-900">Session Summary</h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Duration</span>
                  <span className="text-sm font-medium text-gray-900">
                    {Math.round((behaviorMetrics.session_duration || 0) / 60)} min
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Tasks Completed</span>
                  <span className="text-sm font-medium text-gray-900">
                    {behaviorMetrics.tasks_completed || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Overall Score</span>
                  <span className="text-sm font-medium text-gray-900">
                    {Math.round(behaviorMetrics.overall_score || 0)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-900">Quick Actions</h3>
              </div>
              <div className="p-4 space-y-2">
                <button
                  onClick={() => navigate(`/reports/${childId}`)}
                  className="w-full btn btn-outline btn-sm flex items-center justify-center space-x-2"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>View Reports</span>
                </button>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full btn btn-outline btn-sm"
                >
                  Dashboard
                </button>
              </div>
            </div>

            {/* Communication */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-900">Send Message</h3>
              </div>
              <div className="p-4">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Encourage the child..."
                    className="flex-1 input text-sm"
                  />
                  <button className="btn btn-primary btn-sm">
                    <MessageCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaretakerPanel;