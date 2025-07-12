import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';
import { 
  Play, 
  Pause, 
  Square, 
  Volume2, 
  VolumeX, 
  Settings, 
  Eye,
  Clock,
  Target,
  Zap,
  BarChart3,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { sessionAPI, childrenAPI } from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const GameSession = () => {
  const { childId } = useParams();
  const navigate = useNavigate();
  const { socket, isConnected } = useSocket();
  const [child, setChild] = useState(null);
  const [session, setSession] = useState(null);
  const [gameState, setGameState] = useState('waiting'); // waiting, playing, paused, ended
  const [gameData, setGameData] = useState(null);
  const [behaviorMetrics, setBehaviorMetrics] = useState({});
  const [loading, setLoading] = useState(true);
  const [muted, setMuted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const gameCanvasRef = useRef(null);
  const sessionStartTime = useRef(null);

  useEffect(() => {
    fetchChildData();
    initializeSession();
    
    return () => {
      if (socket && session?.id) {
        socket.emit('leave_session', { session_id: session.id });
      }
    };
  }, [childId]);

  useEffect(() => {
    if (socket && isConnected) {
      setupSocketListeners();
    }
  }, [socket, isConnected, session]);

  const fetchChildData = async () => {
    try {
      const response = await childrenAPI.getById(childId);
      setChild(response.data.child);
    } catch (error) {
      console.error('Failed to fetch child data:', error);
      toast.error('Failed to load child information');
    }
  };

  const initializeSession = async () => {
    try {
      setLoading(true);
      const response = await sessionAPI.startSession(childId, {
        game_type: 'puzzle_adaptive',
        difficulty: 'auto',
        duration_minutes: 15
      });
      
      setSession(response.data.session);
      setGameData(response.data.game_config);
      sessionStartTime.current = new Date();
      
      if (socket && isConnected) {
        socket.emit('join_session', { 
          session_id: response.data.session.id,
          child_id: childId 
        });
      }
    } catch (error) {
      console.error('Failed to initialize session:', error);
      toast.error('Failed to start game session');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const setupSocketListeners = () => {
    if (!socket || !session) return;

    socket.on('game_event', (data) => {
      handleGameEvent(data);
    });

    socket.on('behavior_update', (data) => {
      setBehaviorMetrics(prev => ({ ...prev, ...data.metrics }));
    });

    socket.on('session_ended', (data) => {
      setGameState('ended');
      toast.success('Session completed successfully!');
    });

    socket.on('caretaker_action', (data) => {
      handleCaretakerAction(data);
    });

    return () => {
      socket.off('game_event');
      socket.off('behavior_update');
      socket.off('session_ended');
      socket.off('caretaker_action');
    };
  };

  const handleGameEvent = (data) => {
    switch (data.event_type) {
      case 'puzzle_completed':
        toast.success('Puzzle completed! Great job!');
        break;
      case 'difficulty_adjusted':
        toast.info(`Difficulty adjusted to ${data.new_difficulty}`);
        break;
      case 'behavior_detected':
        logBehaviorEvent(data);
        break;
      default:
        console.log('Game event:', data);
    }
  };

  const handleCaretakerAction = (data) => {
    switch (data.action) {
      case 'pause_game':
        setGameState('paused');
        toast.info('Game paused by caretaker');
        break;
      case 'resume_game':
        setGameState('playing');
        toast.info('Game resumed by caretaker');
        break;
      case 'adjust_difficulty':
        toast.info(`Difficulty adjusted to ${data.new_difficulty}`);
        break;
      default:
        console.log('Caretaker action:', data);
    }
  };

  const logBehaviorEvent = (event) => {
    if (socket && session) {
      socket.emit('log_behavior', {
        session_id: session.id,
        event_type: event.event_type,
        timestamp: new Date().toISOString(),
        data: event.data
      });
    }
  };

  const startGame = () => {
    setGameState('playing');
    if (socket && session) {
      socket.emit('start_game', { session_id: session.id });
    }
    toast.success('Game started! Have fun!');
  };

  const pauseGame = () => {
    setGameState('paused');
    if (socket && session) {
      socket.emit('pause_game', { session_id: session.id });
    }
  };

  const resumeGame = () => {
    setGameState('playing');
    if (socket && session) {
      socket.emit('resume_game', { session_id: session.id });
    }
  };

  const endSession = async () => {
    try {
      if (socket && session) {
        socket.emit('end_session', { session_id: session.id });
      }
      
      await sessionAPI.endSession(session.id, {
        duration_minutes: Math.round((new Date() - sessionStartTime.current) / 60000),
        completion_status: 'completed',
        final_metrics: behaviorMetrics
      });
      
      toast.success('Session ended successfully!');
      navigate(`/reports/${childId}`);
    } catch (error) {
      console.error('Failed to end session:', error);
      toast.error('Failed to end session properly');
    }
  };

  const getSessionDuration = () => {
    if (!sessionStartTime.current) return '00:00';
    const duration = Math.floor((new Date() - sessionStartTime.current) / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <LoadingSpinner size="large" text="Initializing game session..." className="min-h-screen" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">
                Game Session - {child?.name}
              </h1>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">{getSessionDuration()}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Connection Status */}
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm text-gray-600">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>

              {/* Audio Control */}
              <button
                onClick={() => setMuted(!muted)}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100"
              >
                {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>

              {/* Settings */}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100"
              >
                <Settings className="w-5 h-5" />
              </button>

              {/* Caretaker View */}
              <button
                onClick={() => navigate(`/caretaker/${childId}`)}
                className="btn btn-outline btn-sm flex items-center space-x-2"
              >
                <Eye className="w-4 h-4" />
                <span>Caretaker View</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Game Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Game Controls */}
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {gameState === 'waiting' && (
                      <button
                        onClick={startGame}
                        className="btn btn-primary flex items-center space-x-2"
                      >
                        <Play className="w-4 h-4" />
                        <span>Start Game</span>
                      </button>
                    )}
                    
                    {gameState === 'playing' && (
                      <button
                        onClick={pauseGame}
                        className="btn btn-secondary flex items-center space-x-2"
                      >
                        <Pause className="w-4 h-4" />
                        <span>Pause</span>
                      </button>
                    )}
                    
                    {gameState === 'paused' && (
                      <button
                        onClick={resumeGame}
                        className="btn btn-primary flex items-center space-x-2"
                      >
                        <Play className="w-4 h-4" />
                        <span>Resume</span>
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
                  
                  <div className="flex items-center space-x-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      gameState === 'playing' ? 'bg-green-100 text-green-800' :
                      gameState === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                      gameState === 'waiting' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {gameState.charAt(0).toUpperCase() + gameState.slice(1)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Game Canvas */}
              <div className="relative h-96 bg-gradient-to-br from-blue-100 to-purple-100">
                <canvas
                  ref={gameCanvasRef}
                  className="w-full h-full"
                  width={800}
                  height={600}
                />
                
                {/* Game Overlay */}
                {gameState === 'waiting' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20">
                    <div className="text-center text-white">
                      <Target className="w-16 h-16 mx-auto mb-4" />
                      <h3 className="text-2xl font-bold mb-2">Ready to Play?</h3>
                      <p className="text-lg">Click "Start Game" to begin the assessment</p>
                    </div>
                  </div>
                )}
                
                {gameState === 'paused' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20">
                    <div className="text-center text-white">
                      <Pause className="w-16 h-16 mx-auto mb-4" />
                      <h3 className="text-2xl font-bold mb-2">Game Paused</h3>
                      <p className="text-lg">Click "Resume" to continue</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Game Instructions */}
              <div className="px-6 py-4 bg-blue-50 border-t border-gray-200">
                <div className="flex items-start space-x-3">
                  <Zap className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-900">Current Activity</h4>
                    <p className="text-sm text-blue-700">
                      {gameData?.current_instruction || 'Drag and drop the puzzle pieces to complete the picture. Take your time and have fun!'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Metrics Panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* Real-time Metrics */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-900">Live Metrics</h3>
              </div>
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Attention Score</span>
                  <span className="text-sm font-medium text-gray-900">
                    {behaviorMetrics.attention_score || 0}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Response Time</span>
                  <span className="text-sm font-medium text-gray-900">
                    {behaviorMetrics.avg_response_time || 0}ms
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Accuracy</span>
                  <span className="text-sm font-medium text-gray-900">
                    {behaviorMetrics.accuracy || 0}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Puzzles Completed</span>
                  <span className="text-sm font-medium text-gray-900">
                    {behaviorMetrics.puzzles_completed || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Behavioral Indicators */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-900">Behavioral Indicators</h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-700">Sustained attention</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-700">Motor coordination</span>
                </div>
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm text-gray-700">Pattern recognition</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-700">Problem solving</span>
                </div>
              </div>
            </div>

            {/* Session Progress */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-900">Session Progress</h3>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Completion</span>
                  <span className="text-sm font-medium text-gray-900">
                    {Math.round((behaviorMetrics.progress || 0) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(behaviorMetrics.progress || 0) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Estimated time remaining: {15 - Math.round((new Date() - sessionStartTime.current) / 60000)} minutes
                </p>
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
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameSession;