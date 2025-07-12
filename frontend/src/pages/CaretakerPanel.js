import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  Monitor, 
  Play, 
  Pause, 
  Square, 
  Volume2, 
  VolumeX, 
  Zap, 
  Settings,
  User,
  Clock,
  Target,
  AlertTriangle,
  TrendingUp,
  Eye
} from 'lucide-react';
import { api } from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const CaretakerPanel = () => {
  const { childId } = useParams();
  const { user } = useAuth();
  const { connectToChild, gameEvents, liveGameData, triggerSurprise, pauseGame, resumeGame, adjustGameSettings } = useSocket();
  
  const [child, setChild] = useState(null);
  const [gameSocket, setGameSocket] = useState(null);
  const [sessionStats, setSessionStats] = useState({
    startTime: null,
    duration: 0,
    interactions: 0,
    errors: 0,
    avgReactionTime: 0,
    surprisesTriggered: 0
  });
  const [controlSettings, setControlSettings] = useState({
    soundEnabled: true,
    surpriseFrequency: 0.3,
    difficulty: 2,
    observationNotes: ''
  });
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    fetchChildData();
    setupConnection();
    
    return () => {
      if (gameSocket) {
        gameSocket.close();
      }
    };
  }, [childId]);

  useEffect(() => {
    // Update stats when new game events arrive
    updateSessionStats();
  }, [gameEvents, liveGameData]);

  const fetchChildData = async () => {
    try {
      const response = await api.get(`/children/${childId}`);
      setChild(response.data);
    } catch (error) {
      console.error('Failed to fetch child data:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupConnection = () => {
    const socket = connectToChild(childId, 'caretaker');
    setGameSocket(socket);

    if (socket) {
      socket.onopen = () => {
        setIsConnected(true);
      };

      socket.onclose = () => {
        setIsConnected(false);
      };

      socket.onerror = () => {
        setIsConnected(false);
      };
    }
  };

  const updateSessionStats = () => {
    if (!liveGameData) return;

    const interactions = gameEvents.filter(event => event.type === 'interaction').length;
    const errors = gameEvents.filter(event => event.type === 'interaction' && event.isError).length;
    const reactionTimes = gameEvents
      .filter(event => event.type === 'interaction' && event.reactionTime)
      .map(event => event.reactionTime);
    const avgReactionTime = reactionTimes.length > 0 
      ? reactionTimes.reduce((a, b) => a + b) / reactionTimes.length 
      : 0;
    const surprisesTriggered = gameEvents.filter(event => event.type === 'surprise').length;

    setSessionStats(prev => ({
      ...prev,
      interactions,
      errors,
      avgReactionTime: Math.round(avgReactionTime),
      surprisesTriggered,
      duration: liveGameData.startedAt 
        ? Math.round((new Date() - new Date(liveGameData.startedAt)) / 1000)
        : 0
    }));
  };

  const handleTriggerSurprise = (surpriseType) => {
    if (gameSocket && isConnected) {
      triggerSurprise(gameSocket, surpriseType);
      toast.success(`${surpriseType} surprise triggered!`);
    } else {
      toast.error('Cannot trigger surprise: Child not connected');
    }
  };

  const handlePauseGame = () => {
    if (gameSocket && isConnected) {
      pauseGame(gameSocket, 30); // 30 second pause
      toast.success('Pause command sent to child');
    } else {
      toast.error('Cannot pause game: Child not connected');
    }
  };

  const handleResumeGame = () => {
    if (gameSocket && isConnected) {
      resumeGame(gameSocket);
      toast.success('Resume command sent to child');
    } else {
      toast.error('Cannot resume game: Child not connected');
    }
  };

  const handleSettingsChange = (newSettings) => {
    setControlSettings(prev => ({ ...prev, ...newSettings }));
    if (gameSocket) {
      adjustGameSettings(gameSocket, newSettings);
    }
  };

  const saveObservationNotes = async () => {
    try {
      await api.post(`/session/notes`, {
        child_id: childId,
        notes: controlSettings.observationNotes,
        timestamp: new Date().toISOString()
      });
      
      // Show success message
      console.log('Notes saved successfully');
    } catch (error) {
      console.error('Failed to save notes:', error);
    }
  };

  if (loading) {
    return <LoadingSpinner size="large" text="Loading caretaker panel..." className="min-h-screen" />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Monitor className="w-6 h-6 text-primary-600" />
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Live Monitoring: {child?.name}
              </h1>
              <p className="text-sm text-gray-500">
                Real-time game session observation and control
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
              isConnected 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
            
            <Link
              to={`/game/${childId}`}
              className="btn btn-outline flex items-center space-x-2"
            >
              <Eye className="w-4 h-4" />
              <span>Join Game</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Live Game View */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Live Game View
                </h3>
                
                {!isConnected ? (
                  <div className="text-center py-12">
                    <Monitor className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      Waiting for connection
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      The child needs to start a game session to see live updates.
                    </p>
                  </div>
                ) : !liveGameData ? (
                  <div className="text-center py-12">
                    <Play className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      Game not started
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Waiting for the child to start the game session.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Game Status */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">Game Status</h4>
                          <p className="text-sm text-gray-500">
                            Session: {liveGameData.sessionId?.slice(0, 8)}...
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          liveGameData.status === 'active' 
                            ? 'bg-green-100 text-green-800'
                            : liveGameData.status === 'paused'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {liveGameData.status}
                        </span>
                      </div>
                    </div>

                    {/* Game Configuration */}
                    {liveGameData.config && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">Game Configuration</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Level:</span>
                            <span className="ml-2 font-medium">{liveGameData.config.level || 1}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Difficulty:</span>
                            <span className="ml-2 font-medium">{liveGameData.config.difficulty || 'easy'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Shapes:</span>
                            <span className="ml-2 font-medium">{liveGameData.config.shapes?.join(', ') || 'circle, square, triangle'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Colors:</span>
                            <span className="ml-2 font-medium">{liveGameData.config.colors?.join(', ') || 'red, blue, green, yellow'}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Real-time Game Events */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">Recent Activity</h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {gameEvents.length === 0 ? (
                          <p className="text-sm text-gray-500">No recent activity</p>
                        ) : (
                          gameEvents.slice(-5).reverse().map((event, index) => (
                            <div key={index} className="flex items-center space-x-2 text-sm">
                              <div className={`w-2 h-2 rounded-full ${
                                event.type === 'interaction' ? 'bg-blue-500' :
                                event.type === 'surprise' ? 'bg-yellow-500' :
                                event.type === 'error' ? 'bg-red-500' : 'bg-gray-500'
                              }`}></div>
                              <span className="text-gray-600">{event.type}</span>
                              {event.timestamp && (
                                <span className="text-gray-400 text-xs">
                                  {new Date(event.timestamp).toLocaleTimeString()}
                                </span>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Control Panel */}
          <div className="space-y-6">
            {/* Child Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Child Profile</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="font-medium">{child?.name}</div>
                    <div className="text-sm text-gray-500">Age: {child?.age}</div>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  <strong>Interests:</strong> {child?.special_interest}
                </div>
                <div className="text-sm text-gray-600">
                  <strong>Gender:</strong> {child?.gender}
                </div>
              </div>
            </div>

            {/* Game Controls */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Game Controls</h3>
              <div className="space-y-3">
                <button
                  onClick={() => handleTriggerSurprise('color_change')}
                  disabled={!isConnected}
                  className="w-full btn btn-outline flex items-center justify-center space-x-2"
                >
                  <Zap className="w-4 h-4" />
                  <span>Color Surprise</span>
                </button>
                
                <button
                  onClick={() => handleTriggerSurprise('size_change')}
                  disabled={!isConnected}
                  className="w-full btn btn-outline flex items-center justify-center space-x-2"
                >
                  <Zap className="w-4 h-4" />
                  <span>Size Surprise</span>
                </button>
                
                <button
                  onClick={handlePauseGame}
                  disabled={!isConnected}
                  className="w-full btn btn-secondary flex items-center justify-center space-x-2"
                >
                  <Pause className="w-4 h-4" />
                  <span>Pause Game</span>
                </button>
                
                <button
                  onClick={handleResumeGame}
                  disabled={!isConnected}
                  className="w-full btn btn-primary flex items-center justify-center space-x-2"
                >
                  <Play className="w-4 h-4" />
                  <span>Resume Game</span>
                </button>
              </div>
            </div>

            {/* Session Stats */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Session Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Duration</span>
                  <span className="text-sm font-medium">{sessionStats.duration}s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Interactions</span>
                  <span className="text-sm font-medium">{sessionStats.interactions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Errors</span>
                  <span className="text-sm font-medium">{sessionStats.errors}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Avg Reaction Time</span>
                  <span className="text-sm font-medium">{sessionStats.avgReactionTime}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Surprises Triggered</span>
                  <span className="text-sm font-medium">{sessionStats.surprisesTriggered}</span>
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