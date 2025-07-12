import React from 'react';

export default function GameSession() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-purple-100">
      <div className="bg-white rounded-xl shadow-lg p-10 max-w-lg w-full text-center">
        <h1 className="text-3xl font-bold text-blue-700 mb-4">Game Session</h1>
        <p className="text-gray-600 mb-6">This page will let you join, create, or manage cognitive training game sessions for users.</p>
        <div className="py-8">
          <span className="inline-block bg-blue-100 text-blue-700 px-4 py-2 rounded-full font-semibold text-lg animate-pulse">Coming Soon!</span>
        </div>
      </div>
    </div>
  );
} 