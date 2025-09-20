import { TamaData, TamaJob, TamaJobType, Building, TamaGameState, JobEffects } from '../types';

export class TamaJobManager {
  private jobs: Map<string, TamaJob> = new Map();

  assignTamaToJob(tama: TamaData, building: Building, jobType: TamaJobType): boolean {
    // Check if building supports this job type and has available slots
    if (!this.canAssignToBuilding(building, jobType)) {
      return false;
    }

    // Check if Tama is already assigned to a job
    const existingJob = this.getTamaJob(tama.id);
    if (existingJob) {
      this.unassignTama(tama.id);
    }

    // Create new job assignment
    const job: TamaJob = {
      tamaId: tama.id,
      jobType,
      buildingId: building.id,
      startTime: Date.now(),
      experience: 0,
      level: 1,
      efficiency: this.calculateInitialEfficiency(tama, jobType)
    };

    this.jobs.set(tama.id, job);
    return true;
  }

  unassignTama(tamaId: string): boolean {
    return this.jobs.delete(tamaId);
  }

  getTamaJob(tamaId: string): TamaJob | undefined {
    return this.jobs.get(tamaId);
  }

  getJobsForBuilding(buildingId: string): TamaJob[] {
    return Array.from(this.jobs.values()).filter(job => job.buildingId === buildingId);
  }

  private canAssignToBuilding(building: Building, jobType: TamaJobType): boolean {
    const currentJobs = this.getJobsForBuilding(building.id);
    const maxSlots = this.getBuildingJobSlots(building);

    if (currentJobs.length >= maxSlots) {
      return false;
    }

    // Check if building supports this job type
    return this.isJobTypeValidForBuilding(building, jobType);
  }

  private getBuildingJobSlots(building: Building): number {
    const buildingTypes = {
      'training_ground': 2,
      'academy': 1,
      'social_center': 1,
      'lumber_mill': 1,
      'stone_quarry': 2,
      'employment_center': 1 // Employment center employs managers
    };

    return (buildingTypes as any)[building.id] || 0;
  }

  private isJobTypeValidForBuilding(building: Building, jobType: TamaJobType): boolean {
    const validJobs = {
      'training_ground': ['trainer'],
      'academy': ['teacher'],
      'social_center': ['social_coordinator'],
      'lumber_mill': ['lumberjack'],
      'stone_quarry': ['miner'],
      'employment_center': ['manager']
    };

    return ((validJobs as any)[building.id] || []).includes(jobType);
  }

  private calculateInitialEfficiency(tama: TamaData, jobType: TamaJobType): number {
    // Base efficiency starts at 0.8-1.2 depending on Tama genetics
    let efficiency = 0.8;

    switch (jobType) {
      case 'trainer':
        efficiency += (tama.genetics.energy / 100) * 0.4; // Physical job
        break;
      case 'teacher':
        efficiency += (tama.genetics.intelligence / 100) * 0.4; // Mental job
        break;
      case 'social_coordinator':
        efficiency += (tama.genetics.cuteness / 100) * 0.4; // Social job
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
  }

  updateJobExperience(gameState: TamaGameState, deltaTime: number): void {
    const experienceGain = (deltaTime / (1000 * 60 * 60)) * 10; // 10 XP per hour

    Array.from(this.jobs.values()).forEach(job => {
      job.experience += experienceGain;

      // Level up system (exponential growth)
      const requiredXP = job.level * job.level * 100;
      if (job.experience >= requiredXP && job.level < 5) {
        job.level++;
        job.efficiency = Math.min(2.0, job.efficiency + 0.1); // +10% efficiency per level
      }
    });
  }

  calculateJobEffects(gameState: TamaGameState): JobEffects {
    const effects: JobEffects = {};

    Array.from(this.jobs.values()).forEach(job => {
      const multiplier = job.efficiency * (1 + (job.level - 1) * 0.2); // Level bonus

      switch (job.jobType) {
        case 'trainer':
          effects.trainer = {
            statTrainingBonus: 1 + (multiplier - 1) * 0.5, // 1.1-1.5x
            trainingQualityBonus: 1 + (multiplier - 1) * 0.3 // Better stat gains
          };
          break;

        case 'teacher':
          effects.teacher = {
            experienceBonus: 1 + (multiplier - 1) * 0.4, // 1.1-1.4x
            skillLearningBonus: 1 + (multiplier - 1) * 0.6,
            specializationSlots: job.level >= 3 ? 1 : 0
          };
          break;

        case 'social_coordinator':
          effects.social_coordinator = {
            relationshipBonus: 1.2 + (multiplier - 1) * 0.4, // 1.2-1.6x
            happinessAura: Math.floor(multiplier * 2), // +1-3 per hour
            conflictReduction: multiplier * 0.3
          };
          break;

        case 'lumberjack':
          effects.lumberjack = {
            woodProductionBonus: 1.2 + (multiplier - 1) * 0.6, // 1.2-1.8x
            craftingWoodBonus: 1 + (multiplier - 1) * 0.3
          };
          break;

        case 'miner':
          effects.miner = {
            stoneProductionBonus: 1.2 + (multiplier - 1) * 0.6,
            buildingStoneBonus: 1 + (multiplier - 1) * 0.4
          };
          break;

        case 'manager':
          effects.manager = {
            globalEfficiencyBonus: 1.1 + (multiplier - 1) * 0.2, // 1.1-1.3x
            jobSlotIncrease: job.level >= 4 ? 1 : 0,
            automationBonus: 1 + (multiplier - 1) * 0.5
          };
          break;
      }
    });

    return effects;
  }

  getAllJobs(): TamaJob[] {
    return Array.from(this.jobs.values());
  }

  // Get available job types for a building
  getAvailableJobTypes(building: Building): TamaJobType[] {
    const jobTypes = {
      'training_ground': ['trainer' as TamaJobType],
      'academy': ['teacher' as TamaJobType],
      'social_center': ['social_coordinator' as TamaJobType],
      'lumber_mill': ['lumberjack' as TamaJobType],
      'stone_quarry': ['miner' as TamaJobType],
      'employment_center': ['manager' as TamaJobType]
    };

    return (jobTypes as any)[building.id] || [];
  }

  // Check if a building has the Employment Center unlocked (required for job assignments)
  canAssignJobs(gameState: TamaGameState): boolean {
    return gameState.buildings.some(building => building.id === 'employment_center');
  }
}