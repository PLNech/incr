'use client';

import React, { useState } from 'react';
import { TamaData, TamaJob, TamaJobType, Building, TamaGameState } from '../types';

interface EmploymentModalProps {
  isVisible: boolean;
  onClose: () => void;
  gameState: TamaGameState;
  onAssignJob: (tamaId: string, buildingId: string, jobType: TamaJobType) => void;
  onUnassignJob: (tamaId: string) => void;
  jobs: TamaJob[];
  getAvailableJobTypes: (building: Building) => TamaJobType[];
  getJobsForBuilding: (buildingId: string) => TamaJob[];
}

export const EmploymentModal: React.FC<EmploymentModalProps> = ({
  isVisible,
  onClose,
  gameState,
  onAssignJob,
  onUnassignJob,
  jobs,
  getAvailableJobTypes,
  getJobsForBuilding
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'assign'>('overview');
  const [selectedTama, setSelectedTama] = useState<string | null>(null);

  if (!isVisible) return null;

  // Check if Employment Center is built
  const employmentCenter = gameState.buildings.find(b => b.type === 'employment_center');
  if (!employmentCenter) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Employment Center Required</h2>
            <p className="text-gray-600 mb-6">
              You need to build an Employment Center before you can assign Tamas to jobs.
            </p>
            <button
              onClick={onClose}
              className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-6 rounded font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const unemployedTamas = gameState.tamas.filter(tama => !jobs.find(job => job.tamaId === tama.id));
  const employedTamas = gameState.tamas.filter(tama => jobs.find(job => job.tamaId === tama.id));

  const jobTypeNames = {
    trainer: 'Trainer',
    teacher: 'Teacher',
    social_coordinator: 'Social Coordinator',
    lumberjack: 'Lumberjack',
    miner: 'Miner',
    manager: 'Manager',
    unemployed: 'Unemployed'
  };

  const buildingNames = {
    training_ground: 'Training Ground',
    academy: 'Tama Academy',
    social_center: 'Social Center',
    lumber_mill: 'Lumber Mill',
    stone_quarry: 'Stone Quarry',
    employment_center: 'Employment Center'
  };

  const getJobColor = (jobType: TamaJobType) => {
    const colors = {
      trainer: 'bg-red-100 text-red-800',
      teacher: 'bg-purple-100 text-purple-800',
      social_coordinator: 'bg-pink-100 text-pink-800',
      lumberjack: 'bg-green-100 text-green-800',
      miner: 'bg-gray-100 text-gray-800',
      manager: 'bg-blue-100 text-blue-800',
      unemployed: 'bg-yellow-100 text-yellow-800'
    };
    return colors[jobType] || colors.unemployed;
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-600">{employedTamas.length}</div>
          <div className="text-sm text-blue-800">Employed</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-yellow-600">{unemployedTamas.length}</div>
          <div className="text-sm text-yellow-800">Unemployed</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-600">{gameState.tamas.length}</div>
          <div className="text-sm text-green-800">Total Tamas</div>
        </div>
      </div>

      {/* Employed Tamas */}
      {employedTamas.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3">📋 Employed Tamas</h3>
          <div className="space-y-3">
            {employedTamas.map(tama => {
              const job = jobs.find(j => j.tamaId === tama.id)!;
              const building = gameState.buildings.find(b => b.id === job.buildingId);
              return (
                <div key={tama.id} className="bg-white border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-medium text-gray-800">{tama.name}</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getJobColor(job.jobType)}`}>
                          {jobTypeNames[job.jobType]}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>Building: {building ? (buildingNames as any)[building.id] : 'Unknown'}</div>
                        <div>Level: {job.level}/5 | XP: {Math.floor(job.experience)}</div>
                        <div>Efficiency: {(job.efficiency * 100).toFixed(0)}%</div>
                      </div>
                    </div>
                    <button
                      onClick={() => onUnassignJob(tama.id)}
                      className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded text-sm font-medium transition-colors"
                    >
                      Unassign
                    </button>
                  </div>

                  {/* Experience Progress Bar */}
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, ((job.experience % (job.level * job.level * 100)) / (job.level * job.level * 100)) * 100)}%`
                        }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {job.level < 5 ? `${Math.floor(job.experience % (job.level * job.level * 100))}/${job.level * job.level * 100} XP to next level` : 'Max Level'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Unemployed Tamas */}
      {unemployedTamas.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3">💼 Unemployed Tamas</h3>
          <div className="grid grid-cols-2 gap-3">
            {unemployedTamas.map(tama => (
              <div key={tama.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium text-gray-800">{tama.name}</div>
                    <div className="text-sm text-gray-600">Level {tama.level}</div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedTama(tama.id);
                      setActiveTab('assign');
                    }}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                  >
                    Assign Job
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderAssignTab = () => {
    const tama = selectedTama ? gameState.tamas.find(t => t.id === selectedTama) : null;
    const availableBuildings = gameState.buildings.filter(b => {
      const jobTypes = getAvailableJobTypes(b);
      const currentJobs = getJobsForBuilding(b.id);
      const maxSlots = getMaxSlots(b);
      return jobTypes.length > 0 && currentJobs.length < maxSlots;
    });

    if (!tama) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">Select a Tama to assign a job</p>
          <div className="grid grid-cols-2 gap-3">
            {unemployedTamas.map(t => (
              <button
                key={t.id}
                onClick={() => setSelectedTama(t.id)}
                className="bg-blue-100 hover:bg-blue-200 text-blue-800 p-3 rounded-lg font-medium transition-colors"
              >
                {t.name} (Lv.{t.level})
              </button>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Selected Tama Info */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">Assigning Job for: {tama.name}</h3>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium">Cuteness:</span> {tama.genetics.cuteness}
            </div>
            <div>
              <span className="font-medium">Intelligence:</span> {tama.genetics.intelligence}
            </div>
            <div>
              <span className="font-medium">Energy:</span> {tama.genetics.energy}
            </div>
            <div>
              <span className="font-medium">Level:</span> {tama.level}
            </div>
          </div>
        </div>

        {/* Available Positions */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3">🏢 Available Positions</h3>
          {availableBuildings.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p>No job positions available.</p>
              <p className="text-sm mt-2">Build more job-supporting buildings or wait for positions to open up!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {availableBuildings.map(building => {
                const jobTypes = getAvailableJobTypes(building);
                const currentJobs = getJobsForBuilding(building.id);
                const maxSlots = getMaxSlots(building);

                return jobTypes.map(jobType => (
                  <div key={`${building.id}-${jobType}`} className="bg-white border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-medium text-gray-800">
                            {jobTypeNames[jobType]}
                          </span>
                          <span className="text-sm text-gray-600">
                            at {(buildingNames as any)[building.id]}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          Slots: {currentJobs.length}/{maxSlots}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {getJobDescription(jobType)}
                        </div>
                        <div className="text-sm text-green-600 mt-1">
                          Predicted efficiency: {(calculatePredictedEfficiency(tama, jobType) * 100).toFixed(0)}%
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          onAssignJob(tama.id, building.id, jobType);
                          setSelectedTama(null);
                          setActiveTab('overview');
                        }}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded font-medium transition-colors"
                      >
                        Assign
                      </button>
                    </div>
                  </div>
                ));
              })}
            </div>
          )}
        </div>

        <button
          onClick={() => setSelectedTama(null)}
          className="w-full bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded font-medium transition-colors"
        >
          Back to Tama Selection
        </button>
      </div>
    );
  };

  const getMaxSlots = (building: Building) => {
    const slots = {
      'training_ground': 2,
      'academy': 1,
      'social_center': 1,
      'lumber_mill': 1,
      'stone_quarry': 2,
      'employment_center': 1
    };
    return (slots as any)[building.id] || 0;
  };

  const getJobDescription = (jobType: TamaJobType) => {
    const descriptions = {
      trainer: 'Improves stat training speed and quality for all Tamas',
      teacher: 'Boosts experience gain and skill learning for all Tamas',
      social_coordinator: 'Enhances relationship building and happiness',
      lumberjack: 'Increases wood production and reduces wood crafting costs',
      miner: 'Increases stone production and reduces stone building costs',
      manager: 'Improves efficiency of all other jobs and automation'
    };
    return descriptions[jobType] || '';
  };

  const calculatePredictedEfficiency = (tama: TamaData, jobType: TamaJobType) => {
    let efficiency = 0.8;

    switch (jobType) {
      case 'trainer':
        efficiency += (tama.genetics.energy / 100) * 0.4;
        break;
      case 'teacher':
        efficiency += (tama.genetics.intelligence / 100) * 0.4;
        break;
      case 'social_coordinator':
        efficiency += (tama.genetics.cuteness / 100) * 0.4;
        break;
      case 'lumberjack':
        efficiency += (tama.genetics.energy / 100) * 0.3 + (tama.level / 50) * 0.1;
        break;
      case 'miner':
        efficiency += (tama.genetics.energy / 100) * 0.3 + (tama.level / 50) * 0.1;
        break;
      case 'manager':
        efficiency += (tama.genetics.intelligence / 100) * 0.2 + (tama.genetics.cuteness / 100) * 0.2;
        break;
    }

    return Math.min(2.0, Math.max(0.5, efficiency));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 modal-backdrop">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col modal-content">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">🏢 Employment Center</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl btn-animated micro-bounce"
            >
              ×
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mt-4">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded font-medium btn-animated tab-slide-indicator ${
                activeTab === 'overview'
                  ? 'bg-blue-500 text-white active'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              📊 Overview
            </button>
            <button
              onClick={() => setActiveTab('assign')}
              className={`px-4 py-2 rounded font-medium btn-animated tab-slide-indicator ${
                activeTab === 'assign'
                  ? 'bg-blue-500 text-white active'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              💼 Assign Jobs
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'assign' && renderAssignTab()}
        </div>
      </div>
    </div>
  );
};