import React, { createContext, useContext, useState } from 'react';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [gameEvents, setGameEvents] = useState([]);
  const [liveGameData, setLiveGameData] = useState(null);
  const { user, token } = useAuth();

  // Native WebSocket connection for game/caretaker
  const connectToChild = (childId, connectionType = 'caretaker') => {
    if (!user || !token) return null;
    const wsUrl = `${process.env.REACT_APP_WS_URL || 'ws://localhost:8000'}/ws/${childId}?type=${connectionType}&token=${token}`;
    const gameSocket = new window.WebSocket(wsUrl);

    gameSocket.onopen = () => {
      console.log(`Connected to child ${childId} as ${connectionType}`);
    };

    gameSocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleGameMessage(data);
    };

    gameSocket.onerror = (error) => {
      console.error('Game socket error:', error);
    };

    gameSocket.onclose = () => {
      console.log(`Disconnected from child ${childId}`);
    };

    return gameSocket;
  };

  const handleGameMessage = (data) => {
    switch (data.type) {
      case 'connection_confirmed':
        console.log('Connection confirmed:', data);
        break;
      case 'game_event':
        setGameEvents(prev => [...prev, data.event]);
        break;
      case 'session_started':
        setLiveGameData({
          sessionId: data.session_id,
          childId: data.child_id,
          config: data.config,
          status: 'active',
          startedAt: data.timestamp
        });
        break;
      case 'session_ended':
        setLiveGameData(prev => prev ? {
          ...prev,
          status: 'ended',
          summary: data.summary,
          endedAt: data.timestamp
        } : null);
        break;
      case 'surprise_triggered':
        setGameEvents(prev => [...prev, {
          type: 'surprise',
          surpriseType: data.surprise_type,
          timestamp: data.timestamp
        }]);
        break;
      case 'game_paused':
        setLiveGameData(prev => prev ? {
          ...prev,
          status: 'paused',
          pauseDuration: data.duration
        } : null);
        break;
      default:
        console.log('Unhandled game message:', data);
    }
  };

  const sendCaretakerControl = (gameSocket, controlData) => {
    if (gameSocket && gameSocket.readyState === WebSocket.OPEN) {
      gameSocket.send(JSON.stringify({
        type: 'control_command',
        control: controlData,
        timestamp: new Date().toISOString()
      }));
    }
  };

  const sendGameEvent = (gameSocket, eventData) => {
    if (gameSocket && gameSocket.readyState === WebSocket.OPEN) {
      gameSocket.send(JSON.stringify({
        type: 'game_event',
        event: eventData,
        timestamp: new Date().toISOString()
      }));
    }
  };

  const triggerSurprise = (gameSocket, surpriseType) => {
    sendCaretakerControl(gameSocket, {
      action: 'trigger_surprise',
      surpriseType: surpriseType
    });
  };

  const pauseGame = (gameSocket, duration = 30) => {
    sendCaretakerControl(gameSocket, {
      action: 'pause_game',
      duration: duration
    });
  };

  const resumeGame = (gameSocket) => {
    sendCaretakerControl(gameSocket, {
      action: 'resume_game'
    });
  };

  const adjustGameSettings = (gameSocket, settings) => {
    sendCaretakerControl(gameSocket, {
      action: 'adjust_settings',
      settings: settings
    });
  };

  const clearGameEvents = () => {
    setGameEvents([]);
  };

  const resetLiveGameData = () => {
    setLiveGameData(null);
  };

  const value = {
    gameEvents,
    liveGameData,
    connectToChild,
    sendCaretakerControl,
    sendGameEvent,
    triggerSurprise,
    pauseGame,
    resumeGame,
    adjustGameSettings,
    clearGameEvents,
    resetLiveGameData
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};