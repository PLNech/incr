/**
 * Name Generator for diverse clubber identities
 * Generates names from various cultural backgrounds
 */

export interface NameOrigin {
  origin: string;
  firstNames: string[];
  lastNames: string[];
}

const NAME_ORIGINS: NameOrigin[] = [
  {
    origin: 'German',
    firstNames: ['Hans', 'Klaus', 'Petra', 'Greta', 'Wolfgang', 'Ingrid', 'Stefan', 'Sabine', 'Michael', 'Andrea'],
    lastNames: ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Schulz', 'Hoffmann']
  },
  {
    origin: 'French',
    firstNames: ['Pierre', 'Marie', 'Jean', 'Sophie', 'Antoine', 'Camille', 'Laurent', 'Céline', 'Nicolas', 'Amélie'],
    lastNames: ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Petit', 'Durand', 'Leroy', 'Moreau', 'Simon']
  },
  {
    origin: 'English',
    firstNames: ['James', 'Emma', 'Oliver', 'Charlotte', 'William', 'Sophie', 'Harry', 'Grace', 'George', 'Emily'],
    lastNames: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Wilson']
  },
  {
    origin: 'Eastern European',
    firstNames: ['Dmitri', 'Katarina', 'Pavel', 'Anya', 'Viktor', 'Natasha', 'Alexei', 'Oksana', 'Sergei', 'Irina'],
    lastNames: ['Petrov', 'Volkov', 'Smirnov', 'Kuznetsov', 'Popov', 'Lebedev', 'Kozlov', 'Novak', 'Kowalski', 'Nowak']
  },
  {
    origin: 'African',
    firstNames: ['Kwame', 'Amara', 'Kofi', 'Asha', 'Sekou', 'Zara', 'Tunde', 'Kaia', 'Jomo', 'Safiya'],
    lastNames: ['Okafor', 'Mensah', 'Diallo', 'Kone', 'Traore', 'Camara', 'Sy', 'Sow', 'Ba', 'Keita']
  },
  {
    origin: 'American',
    firstNames: ['Tyler', 'Madison', 'Brandon', 'Ashley', 'Jordan', 'Taylor', 'Cameron', 'Morgan', 'Austin', 'Samantha'],
    lastNames: ['Jackson', 'Thompson', 'White', 'Lopez', 'Lee', 'Gonzalez', 'Harris', 'Clark', 'Lewis', 'Robinson']
  },
  {
    origin: 'Asian',
    firstNames: ['Hiroshi', 'Yuki', 'Takeshi', 'Mei', 'Wei', 'Li', 'Raj', 'Priya', 'Min', 'Sung'],
    lastNames: ['Tanaka', 'Suzuki', 'Wang', 'Li', 'Zhang', 'Chen', 'Patel', 'Sharma', 'Kim', 'Park']
  },
  {
    origin: 'Oceanian',
    firstNames: ['Koa', 'Leilani', 'Kai', 'Aria', 'Tane', 'Kiri', 'Mateo', 'Isla', 'Finn', 'Ruby'],
    lastNames: ['Williams', 'Brown', 'Smith', 'Jones', 'Wilson', 'Taylor', 'Johnson', 'White', 'Martin', 'Anderson']
  }
];

export class NameGenerator {
  private usedNames = new Set<string>();
  
  public generateName(preferredOrigin?: string): { firstName: string; lastName: string; origin: string } {
    let attempts = 0;
    const maxAttempts = 50;
    
    while (attempts < maxAttempts) {
      let selectedOrigin: NameOrigin;
      
      if (preferredOrigin) {
        selectedOrigin = NAME_ORIGINS.find(o => o.origin === preferredOrigin) || this.getRandomOrigin();
      } else {
        selectedOrigin = this.getRandomOrigin();
      }
      
      const firstName = this.getRandomElement(selectedOrigin.firstNames);
      const lastName = this.getRandomElement(selectedOrigin.lastNames);
      const fullName = `${firstName} ${lastName}`;
      
      if (!this.usedNames.has(fullName)) {
        this.usedNames.add(fullName);
        return {
          firstName,
          lastName,
          origin: selectedOrigin.origin
        };
      }
      
      attempts++;
    }
    
    // Fallback if all names exhausted (shouldn't happen in normal use)
    return {
      firstName: 'Anonymous',
      lastName: `#${Math.floor(Math.random() * 1000)}`,
      origin: 'Generated'
    };
  }
  
  public generateSpecificName(firstName: string, lastName: string, origin: string): { firstName: string; lastName: string; origin: string } {
    const fullName = `${firstName} ${lastName}`;
    this.usedNames.add(fullName);
    return { firstName, lastName, origin };
  }
  
  private getRandomOrigin(): NameOrigin {
    return this.getRandomElement(NAME_ORIGINS);
  }
  
  private getRandomElement<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }
  
  public resetUsedNames(): void {
    this.usedNames.clear();
  }
  
  public getStats(): { totalGenerated: number; availableOrigins: string[] } {
    return {
      totalGenerated: this.usedNames.size,
      availableOrigins: NAME_ORIGINS.map(o => o.origin)
    };
  }
}

// Singleton instance
export const nameGenerator = new NameGenerator();