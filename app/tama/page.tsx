'use client';

import React from 'react';

export default function TamaGamePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-green-800">
          🐾 Tama Bokujō 🏡
        </h1>
        <div className="text-center text-gray-600">
          <p>Your virtual Tama ranch is loading...</p>
          <div className="mt-4 animate-pulse">
            <div className="w-16 h-16 bg-green-200 rounded-full mx-auto"></div>
          </div>
        </div>
      </div>
    </div>
  );
}