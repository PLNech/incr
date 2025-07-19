// Basic HTML5 Audio Management for BergInc
// Simulates loop mixing based on tier progression

export class BergAudioManager {
  private audioContext: AudioContext | null = null;
  private currentTier: number = 0;
  private isPlaying: boolean = false;
  private volume: number = 0.3;
  
  // For now, we'll use oscillators to simulate the evolution
  // In production, these would be actual audio loop files
  private oscillators: OscillatorNode[] = [];
  private gainNodes: GainNode[] = [];

  constructor() {
    this.setupAudioContext();
  }

  private setupAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
    }
  }

  public updateTier(newTier: number) {
    if (newTier !== this.currentTier) {
      this.currentTier = newTier;
      if (this.isPlaying) {
        this.stopAudio();
        this.startAudio();
      }
    }
  }

  public startAudio() {
    if (!this.audioContext || this.isPlaying) return;

    // Resume audio context if suspended (Chrome requires user interaction)
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    this.isPlaying = true;
    this.createOscillators();
  }

  public stopAudio() {
    if (!this.isPlaying) return;

    this.oscillators.forEach(osc => {
      try {
        osc.stop();
      } catch (e) {
        // Oscillator already stopped
      }
    });
    
    this.oscillators = [];
    this.gainNodes = [];
    this.isPlaying = false;
  }

  private createOscillators() {
    if (!this.audioContext) return;

    // Create different sound textures based on tier
    const tierConfigs = this.getTierAudioConfig(this.currentTier);
    
    tierConfigs.forEach((config, index) => {
      const oscillator = this.audioContext!.createOscillator();
      const gainNode = this.audioContext!.createGain();
      
      oscillator.type = config.type;
      oscillator.frequency.setValueAtTime(config.frequency, this.audioContext!.currentTime);
      
      // Add subtle frequency modulation for more organic sound
      oscillator.frequency.setValueAtTime(
        config.frequency + Math.sin(Date.now() / 1000) * config.modulation,
        this.audioContext!.currentTime
      );
      
      gainNode.gain.setValueAtTime(config.volume * this.volume, this.audioContext!.currentTime);
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext!.destination);
      
      oscillator.start();
      
      this.oscillators.push(oscillator);
      this.gainNodes.push(gainNode);
    });
  }

  private getTierAudioConfig(tier: number) {
    // Audio evolution from pure minimal techno to commercial EDM
    switch (tier) {
      case 0: // Underground - Pure minimal
        return [
          { type: 'sine' as OscillatorType, frequency: 60, volume: 0.4, modulation: 2 },
          { type: 'triangle' as OscillatorType, frequency: 120, volume: 0.2, modulation: 1 }
        ];
      
      case 1: // Word of mouth - Slightly more complex
        return [
          { type: 'sine' as OscillatorType, frequency: 60, volume: 0.3, modulation: 2 },
          { type: 'triangle' as OscillatorType, frequency: 120, volume: 0.3, modulation: 1 },
          { type: 'sawtooth' as OscillatorType, frequency: 240, volume: 0.1, modulation: 3 }
        ];
      
      case 2: // Rising fame - More accessible
        return [
          { type: 'sine' as OscillatorType, frequency: 80, volume: 0.3, modulation: 3 },
          { type: 'square' as OscillatorType, frequency: 160, volume: 0.2, modulation: 2 },
          { type: 'sawtooth' as OscillatorType, frequency: 320, volume: 0.2, modulation: 4 }
        ];
      
      case 3: // Tourist magnet - Commercial creep
        return [
          { type: 'square' as OscillatorType, frequency: 100, volume: 0.4, modulation: 4 },
          { type: 'sawtooth' as OscillatorType, frequency: 200, volume: 0.3, modulation: 5 },
          { type: 'triangle' as OscillatorType, frequency: 400, volume: 0.2, modulation: 6 }
        ];
      
      case 4: // Brand empire - EDM influences
        return [
          { type: 'square' as OscillatorType, frequency: 120, volume: 0.5, modulation: 6 },
          { type: 'sawtooth' as OscillatorType, frequency: 240, volume: 0.4, modulation: 8 },
          { type: 'triangle' as OscillatorType, frequency: 480, volume: 0.3, modulation: 10 }
        ];
      
      case 5: // Corporate asset - Full commercialization
        return [
          { type: 'square' as OscillatorType, frequency: 140, volume: 0.6, modulation: 10 },
          { type: 'sawtooth' as OscillatorType, frequency: 280, volume: 0.5, modulation: 12 },
          { type: 'triangle' as OscillatorType, frequency: 560, volume: 0.4, modulation: 15 },
          { type: 'square' as OscillatorType, frequency: 840, volume: 0.2, modulation: 8 }
        ];
      
      default:
        return [
          { type: 'sine' as OscillatorType, frequency: 60, volume: 0.4, modulation: 2 }
        ];
    }
  }

  public setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    this.gainNodes.forEach(gain => {
      gain.gain.setValueAtTime(this.volume * 0.3, this.audioContext!.currentTime);
    });
  }

  public togglePlayback() {
    if (this.isPlaying) {
      this.stopAudio();
    } else {
      this.startAudio();
    }
    return this.isPlaying;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }
}