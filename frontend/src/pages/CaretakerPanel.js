import React from 'react';

export default function CaretakerPanel() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-blue-100">
      <div className="bg-white rounded-xl shadow-lg p-10 max-w-lg w-full text-center">
        <h1 className="text-3xl font-bold text-green-700 mb-4">Caretaker Panel</h1>
        <p className="text-gray-600 mb-6">This page will allow caretakers to monitor progress, manage users, and access special tools.</p>
        <div className="py-8">
          <span className="inline-block bg-green-100 text-green-700 px-4 py-2 rounded-full font-semibold text-lg animate-pulse">Coming Soon!</span>
        </div>
      </div>
    </div>
  );
} 