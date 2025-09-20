// Service to manage compensation notifications and prevent duplicates

interface CompensationMessage {
  title: string;
  message: string;
}

interface CompensationData {
  message: CompensationMessage;
  rewards: {
    resources: Record<string, number>;
    tamaName: string;
    tamaSpecies: string;
    tamaTier: number;
  };
}

type CompensationCallback = (data: CompensationData) => void;

export class CompensationManager {
  private static instance: CompensationManager;
  private hasShownCompensation = false;
  private compensationCallback: CompensationCallback | null = null;

  static getInstance(): CompensationManager {
    if (!CompensationManager.instance) {
      CompensationManager.instance = new CompensationManager();
    }
    return CompensationManager.instance;
  }

  setCallback(callback: CompensationCallback): void {
    this.compensationCallback = callback;
  }

  showCompensation(oldState: any): void {
    // Prevent showing multiple times in the same session
    if (this.hasShownCompensation) {
      console.log('Compensation already shown in this session, skipping');
      return;
    }

    if (!this.compensationCallback) {
      console.warn('No compensation callback set');
      return;
    }

    // Mark as shown
    this.hasShownCompensation = true;

    // Generate compensation data
    const data = this.generateCompensationData(oldState);

    // Show with slight delay to ensure UI is ready
    setTimeout(() => {
      this.compensationCallback!(data);
    }, 1000);
  }

  private generateCompensationData(oldState: any): CompensationData {
    // Extract old progress
    const oldLevel = oldState.progression?.level || oldState.level || 1;
    const oldTamaCount = oldState.tamas?.length || oldState.tamaCount || 0;

    // Calculate compensation multiplier
    const compensationMultiplier = Math.max(1, Math.floor(oldLevel / 2) + Math.floor(oldTamaCount / 3));

    // Terry Pratchett-style messages
    const messages: CompensationMessage[] = [
      {
        title: "Oops! Reality Experienced a Minor Glitch",
        message: "It seems the fundamental nature of existence shifted slightly while you weren't looking. Don't worry, this happens approximately every third Thursday. We've compensated you with some shiny things and a particularly nice Tama who definitely wasn't involved in any ontological maintenance work."
      },
      {
        title: "The Department of Temporal Affairs Apologizes",
        message: "Due to unforeseen circumstances involving a butterfly, a time paradox, and someone's grandmother, your save file got caught in a causality loop. The good news is that we've broken you out and thrown in some premium resources as an apology. The bad news is that your Tama now knows things about the universe that probably aren't good for its mental health."
      },
      {
        title: "Software Entropy Has Claimed Another Victim",
        message: "Your save file bravely fought against the inexorable march of digital decay, but ultimately succumbed to what computer scientists call 'bit rot' and philosophers call 'the heat death of the universe in miniature.' Fear not! We've provided you with a compensation package that would make even the most jaded Tama rancher weep with joy."
      },
      {
        title: "The Save File Migration Office Regrets...",
        message: "...to inform you that your precious data has become incompatible with current reality. This is not our fault, but rather the fault of Progress, which as we all know, waits for no one and breaks everything in its wake. Please accept this generous compensation package and pretend nothing happened. The Tama included definitely wasn't created in a lab."
      },
      {
        title: "Breaking: Local Save File Discovers Philosophy",
        message: "Your save file has undergone what experts are calling an 'existential crisis' and decided it no longer wished to conform to conventional data structures. While we applaud its journey of self-discovery, this has made it somewhat difficult to read. Please enjoy these replacement resources and remember: the journey is more important than the destination (especially when the destination involves massive data corruption)."
      }
    ];

    const selectedMessage = messages[Math.floor(Math.random() * messages.length)];

    // Generate compensation Tama
    const species = ['forest', 'aquatic', 'crystal'][Math.floor(Math.random() * 3)];
    const names = ['Compensation', 'Sorry', 'MakeItUp', 'Rare', 'Bonus', 'Gift'];
    const tamaName = names[Math.floor(Math.random() * names.length)];
    const tamaTier = Math.random() < 0.3 ? 2 : 1; // 30% chance of tier 2!

    return {
      message: selectedMessage,
      rewards: {
        resources: {
          tamaCoins: 500 * compensationMultiplier,
          berries: 100 * compensationMultiplier,
          wood: 50 * compensationMultiplier,
          stone: 25 * compensationMultiplier,
          happinessStars: 20 * compensationMultiplier,
          evolutionCrystals: 10 * compensationMultiplier
        },
        tamaName,
        tamaSpecies: species,
        tamaTier
      }
    };
  }

  // Reset for testing purposes
  reset(): void {
    this.hasShownCompensation = false;
  }
}