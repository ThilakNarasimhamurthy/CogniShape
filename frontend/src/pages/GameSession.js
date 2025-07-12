import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import { Play, Pause, Square, Volume2, VolumeX, Settings, Home } from 'lucide-react';
import { api } from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import GameCanvas from '../components/GameCanvas';
import toast from 'react-hot-toast';

const GameSession = () => {
  const { childId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { connectToChild, sendGameEvent } = useSocket();
  
  const [child, setChild] = useState(null);
  const [gameSocket, setGameSocket] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [gameState, setGameState] = useState('loading'); // loading, ready, playing, paused, ended
  const [sessionData, setSessionData] = useState({
    startTime: null,
    events: [],
    completionTime: 0,
    errors: 0,
    reactionTimes: [],
    caretakerPaused: false,
    pauseReason: null
  });
  const [gameConfig, setGameConfig] = useState({
    level: 1,
    difficulty: 'easy',
    soundEnabled: true,
    surpriseEnabled: true,
    shapes: ['circle', 'square', 'triangle'],
    colors: ['red', 'blue', 'green', 'yellow']
  });
  const [loading, setLoading] = useState(true);

  const gameCanvasRef = useRef(null);

  useEffect(() => {
    fetchChildData();
    setupGameSession();
    
    return () => {
      if (gameSocket) {
        gameSocket.close();
      }
    };
  }, [childId]);

  const fetchChildData = async () => {
    try {
      const response = await api.get(`/children/${childId}`);
      setChild(response.data);
      
      // Generate AI-powered game config based on child profile
      const configResponse = await api.post('/ai/game-config', {
        child_id: childId,
        age: response.data.age,
        interests: response.data.special_interest
      });
      
      // Update game config with AI-generated configuration
      if (configResponse.data.level_config) {
        setGameConfig(prev => ({
          ...prev,
          ...configResponse.data.level_config,
          // Ensure we have the interests from the child profile
          interests: response.data.special_interest ? response.data.special_interest.split(',').map(i => i.trim()) : []
        }));
      }
    } catch (error) {
      console.error('Failed to fetch child data:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupGameSession = () => {
    const socket = connectToChild(childId, 'child');
    setGameSocket(socket);

    if (socket) {
      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleGameMessage(data);
      };
    }
  };

  const handleGameMessage = (data) => {
    console.log('Received game message:', data);
    
    switch (data.type) {
      case 'session_start': // For child
        console.log('Starting game session with config:', data.config);
        setSessionId(data.session_id);
        setGameConfig(data.config || gameConfig);
        setGameState('ready');
        setSessionData(prev => ({
          ...prev,
          startTime: new Date()
        }));
        break;
      case 'session_started': // For caretaker
        console.log('Caretaker received session_started:', data.config);
        setSessionId(data.session_id);
        setGameConfig(data.config || gameConfig);
        setGameState('ready');
        break;
        
      case 'connection_confirmed':
        console.log('Connection confirmed for child:', data.child_id);
        break;
        
      case 'caretaker_control':
        handleCaretakerControl(data.control);
        break;
        
      case 'session_end':
        setGameState('ended');
        handleSessionEnd(data);
        break;
        
      default:
        console.log('Unhandled game message:', data);
    }
  };

  const handleCaretakerControl = (control) => {
    console.log('Received caretaker control:', control);
    
    switch (control.action) {
      case 'pause_game':
        setGameState('paused');
        // Show pause overlay
        setSessionData(prev => ({
          ...prev,
          caretakerPaused: true,
          pauseReason: 'Game paused by caretaker'
        }));
        toast.info('Game paused by caretaker');
        break;
        
      case 'resume_game':
        setGameState('playing');
        // Clear pause overlay
        setSessionData(prev => ({
          ...prev,
          caretakerPaused: false,
          pauseReason: null
        }));
        toast.success('Game resumed by caretaker');
        break;
        
      case 'trigger_surprise':
        triggerSurpriseElement(control.surpriseType);
        toast.info(`Surprise triggered: ${control.surpriseType}`);
        break;
        
      case 'adjust_settings':
        setGameConfig(prev => ({ ...prev, ...control.settings }));
        break;
        
      default:
        console.log('Unknown caretaker control:', control);
    }
  };

  const startGame = async () => {
    setGameState('playing');
    setSessionData(prev => ({
      ...prev,
      startTime: new Date()
    }));
    // Notify caretakers via socket
    if (gameSocket) {
      gameSocket.send(JSON.stringify({
        type: 'session_started',
        config: gameConfig,
        timestamp: new Date().toISOString()
      }));
    }
  };

  const pauseGame = () => {
    setGameState('paused');
    logGameEvent('game_paused', { timestamp: new Date() });
    // Notify caretakers
    if (gameSocket) {
      gameSocket.send(JSON.stringify({
        type: 'game_paused',
        timestamp: new Date().toISOString()
      }));
    }
  };

  const resumeGame = () => {
    setGameState('playing');
    logGameEvent('game_resumed', { timestamp: new Date() });
    // Notify caretakers
    if (gameSocket) {
      gameSocket.send(JSON.stringify({
        type: 'game_resumed',
        timestamp: new Date().toISOString()
      }));
    }
  };

  const endGame = async () => {
    const endTime = new Date();
    const completionTime = (endTime - sessionData.startTime) / 1000; // seconds
    const finalSessionData = {
      ...sessionData,
      completionTime,
      endTime,
      level: gameConfig.level,
      abandoned: false
    };
    try {
      // Log session to backend
      await api.post('/session/log', {
        child_id: childId,
        level: gameConfig.level,
        completion_time: completionTime,
        errors: sessionData.errors,
        reaction_time: sessionData.reactionTimes.length > 0 
          ? sessionData.reactionTimes.reduce((a, b) => a + b) / sessionData.reactionTimes.length 
          : 0,
        surprise_triggered: sessionData.events.filter(e => e.type === 'surprise').length > 0 ? 'yes' : 'no',
        abandoned: false,
        behavioral_notes: `Game completed with ${sessionData.errors} errors`
      });
      setGameState('ended');
      // Notify caretakers
      if (gameSocket) {
        gameSocket.send(JSON.stringify({
          type: 'session_ended',
          summary: finalSessionData,
          timestamp: new Date().toISOString()
        }));
      }
      // Navigate to results
      setTimeout(() => {
        navigate(`/reports/${childId}`);
      }, 3000);
    } catch (error) {
      console.error('Failed to end game session:', error);
    }
  };

  const logGameEvent = (eventType, eventData) => {
    const event = {
      type: eventType,
      timestamp: new Date(),
      ...eventData
    };
    setSessionData(prev => ({
      ...prev,
      events: [...prev.events, event]
    }));
    // Send to caretakers via socket
    if (gameSocket && (eventType === 'interaction' || eventType === 'surprise')) {
      sendGameEvent(gameSocket, event);
    }
  };

  const handleGameInteraction = (interactionData) => {
    const reactionTime = interactionData.reactionTime || 0;
    
    setSessionData(prev => ({
      ...prev,
      reactionTimes: [...prev.reactionTimes, reactionTime],
      errors: interactionData.isError ? prev.errors + 1 : prev.errors
    }));
    
    logGameEvent('interaction', interactionData);
  };

  const triggerSurpriseElement = (surpriseType = 'color_change') => {
    logGameEvent('surprise', { 
      surpriseType,
      timestamp: new Date()
    });
    // Notify caretakers
    if (gameSocket) {
      sendGameEvent(gameSocket, {
        type: 'surprise',
        surpriseType,
        timestamp: new Date().toISOString()
      });
    }
    // Trigger surprise in game canvas
    if (gameCanvasRef.current) {
      gameCanvasRef.current.triggerSurprise(surpriseType);
    }
  };

  const toggleSound = () => {
    setGameConfig(prev => ({
      ...prev,
      soundEnabled: !prev.soundEnabled
    }));
  };

  const handleSessionEnd = (data) => {
    setSessionData(prev => ({
      ...prev,
      ...data.summary
    }));
  };

  if (loading) {
    return <LoadingSpinner size="large" text="Loading game session..." className="min-h-screen" />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <Home className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-semibold">
                {child?.name}'s Game Session
              </h1>
              <p className="text-sm text-gray-400">
                Level {gameConfig.level} • {gameState}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Game Controls */}
            {gameState === 'ready' && (
              <button
                onClick={startGame}
                className="btn btn-primary flex items-center space-x-2"
              >
                <Play className="w-4 h-4" />
                <span>Start Game</span>
              </button>
            )}

            {gameState === 'playing' && (
              <>
                <button
                  onClick={pauseGame}
                  className="btn btn-secondary flex items-center space-x-2"
                >
                  <Pause className="w-4 h-4" />
                  <span>Pause</span>
                </button>
                <button
                  onClick={endGame}
                  className="btn btn-danger flex items-center space-x-2"
                >
                  <Square className="w-4 h-4" />
                  <span>End</span>
                </button>
              </>
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

            {/* Sound Toggle */}
            <button
              onClick={toggleSound}
              className={`p-2 rounded-md transition-colors ${
                gameConfig.soundEnabled 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-gray-600 text-gray-300'
              }`}
            >
              {gameConfig.soundEnabled ? (
                <Volume2 className="w-4 h-4" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
            </button>

            {/* Settings */}
            <button className="p-2 rounded-md bg-gray-600 text-gray-300 hover:bg-gray-500 transition-colors">
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Game Area */}
      <div className="flex-1 flex">
        {/* Main Game Canvas */}
        <div className="flex-1 flex items-center justify-center bg-gray-800">
          {gameState === 'loading' && (
            <LoadingSpinner size="large" text="Preparing game..." />
          )}
          
          {gameState === 'ready' && (
            <div className="text-center">
              <div className="w-32 h-32 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Play className="w-16 h-16 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-4">Ready to Start!</h2>
              <p className="text-gray-400 mb-6">
                {child?.name}, let's play some fun games together!
              </p>
              <button
                onClick={startGame}
                className="btn btn-primary btn-lg"
              >
                Start Playing
              </button>
            </div>
          )}
          
          {(gameState === 'playing' || gameState === 'paused') && (
            <div className="relative w-full h-full">
              <GameCanvas
                ref={gameCanvasRef}
                config={gameConfig}
                gameState={gameState}
                onInteraction={handleGameInteraction}
                onGameEvent={logGameEvent}
              />
              
              {/* Caretaker Pause Overlay */}
              {sessionData.caretakerPaused && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-6 text-center max-w-md">
                    <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Pause className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Game Paused
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {sessionData.pauseReason || 'The game has been paused by your caretaker.'}
                    </p>
                    <p className="text-sm text-gray-500">
                      Please wait for the game to resume...
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {gameState === 'ended' && (
            <div className="text-center">
              <div className="w-32 h-32 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Square className="w-16 h-16 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-4">Great Job!</h2>
              <p className="text-gray-400 mb-6">
                Session completed in {Math.round(sessionData.completionTime)} seconds
              </p>
              <p className="text-sm text-gray-500">
                Redirecting to results...
              </p>
            </div>
          )}
        </div>

        {/* Side Panel - Game Stats */}
        <div className="w-80 bg-gray-800 border-l border-gray-700 p-4">
          <h3 className="text-lg font-semibold mb-4">Session Stats</h3>
          
          <div className="space-y-4">
            <div className="bg-gray-700 rounded-lg p-3">
              <div className="text-sm text-gray-400">Time Elapsed</div>
              <div className="text-xl font-bold">
                {sessionData.startTime 
                  ? Math.round((new Date() - sessionData.startTime) / 1000)
                  : 0}s
              </div>
            </div>
            
            <div className="bg-gray-700 rounded-lg p-3">
              <div className="text-sm text-gray-400">Interactions</div>
              <div className="text-xl font-bold">{sessionData.events.length}</div>
            </div>
            
            <div className="bg-gray-700 rounded-lg p-3">
              <div className="text-sm text-gray-400">Errors</div>
              <div className="text-xl font-bold text-red-400">{sessionData.errors}</div>
            </div>
            
            <div className="bg-gray-700 rounded-lg p-3">
              <div className="text-sm text-gray-400">Avg Reaction Time</div>
              <div className="text-xl font-bold">
                {sessionData.reactionTimes.length > 0
                  ? Math.round(sessionData.reactionTimes.reduce((a, b) => a + b) / sessionData.reactionTimes.length)
                  : 0}ms
              </div>
            </div>
          </div>

          {/* Recent Events */}
          <div className="mt-6">
            <h4 className="text-sm font-semibold text-gray-400 mb-2">Recent Events</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {sessionData.events.slice(-5).reverse().map((event, index) => (
                <div key={index} className="text-xs bg-gray-700 rounded p-2">
                  <div className="font-medium capitalize">{event.type.replace('_', ' ')}</div>
                  <div className="text-gray-400">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameSession;