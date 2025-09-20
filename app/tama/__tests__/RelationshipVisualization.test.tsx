/**
 * TDD Test Suite for Relationship Visualization in Garden View
 * Following proper red-green-refactor methodology
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AdvancedTamaData, TamaRelationship, RelationshipType } from '../types-advanced';

// Import components we'll implement
import { RelationshipNetwork } from '../components/RelationshipNetwork';
import { SocialNetworkDisplay } from '../components/SocialNetworkDisplay';

// Mock data
const createMockAdvancedTama = (id: string, relationships: Record<string, TamaRelationship> = {}): AdvancedTamaData => ({
  id,
  name: `Tama${id}`,
  species: 'basic',
  tier: 1,
  level: 5,
  experience: 100,
  needs: { hunger: 80, happiness: 70, energy: 90, cleanliness: 85 },
  stats: { totalInteractions: 10, hoursLived: 24, jobsCompleted: 2 },
  skills: {},
  createdAt: Date.now(),
  lastInteraction: Date.now(),
  rpgStats: {} as any,
  personality: {} as any,
  relationships,
  currentGoals: [],
  goalHistory: [],
  currentActivity: null,
  activityStartTime: Date.now(),
  activityLocation: 'garden',
  autonomyLevel: 50,
  socialStatus: { reputation: 60, leadership: 50, popularity: 70, respect: 55 },
  territory: { claimedAreas: [], favoriteSpots: [], sharedAreas: [] },
  possessions: { personalItems: [], sharedItems: [], treasuredItems: [] },
  mentalState: { stress: 30, confidence: 70, satisfaction: 75, lastMajorEvent: null }
});

const createMockRelationship = (targetId: string, type: RelationshipType, strength: number): TamaRelationship => ({
  targetId,
  relationshipType: type,
  strength,
  trust: 60,
  respect: 55,
  history: [],
  interactionFrequency: 0.3,
  cooperationLevel: 70,
  conflictLevel: 20,
  personalityCompatibility: 65,
  statComplementarity: 50,
  sharedInterests: 60,
  lastInteraction: Date.now(),
  relationshipStability: 70
});

describe('Relationship Visualization - TDD', () => {

  describe('RelationshipNetwork Component', () => {
    test('RED: should render network visualization for Tamas with relationships', () => {
      // This test should FAIL initially since component doesn't exist
      const tamasWithRelationships = [
        createMockAdvancedTama('A', {
          'B': createMockRelationship('B', 'friend', 75),
          'C': createMockRelationship('C', 'rival', -30)
        }),
        createMockAdvancedTama('B', {
          'A': createMockRelationship('A', 'friend', 75),
          'C': createMockRelationship('C', 'acquaintance', 20)
        }),
        createMockAdvancedTama('C', {
          'A': createMockRelationship('A', 'rival', -30),
          'B': createMockRelationship('B', 'acquaintance', 20)
        })
      ];

      render(<RelationshipNetwork tamas={tamasWithRelationships} />);

      // Should display all Tamas as nodes
      expect(screen.getByText('TamaA')).toBeInTheDocument();
      expect(screen.getByText('TamaB')).toBeInTheDocument();
      expect(screen.getByText('TamaC')).toBeInTheDocument();

      // Should show relationship connections
      expect(screen.getByTestId('relationship-A-B')).toBeInTheDocument();
      expect(screen.getByTestId('relationship-A-C')).toBeInTheDocument();
      expect(screen.getByTestId('relationship-B-C')).toBeInTheDocument();
    });

    test('RED: should use different visual styles for different relationship types', () => {
      const tamas = [
        createMockAdvancedTama('A', {
          'B': createMockRelationship('B', 'friend', 75),
          'C': createMockRelationship('C', 'enemy', -80),
          'D': createMockRelationship('D', 'romantic', 90)
        }),
        createMockAdvancedTama('B'),
        createMockAdvancedTama('C'),
        createMockAdvancedTama('D')
      ];

      render(<RelationshipNetwork tamas={tamas} />);

      // Friend relationships should be green
      const friendConnection = screen.getByTestId('relationship-A-B');
      expect(friendConnection).toHaveClass('relationship-friend');

      // Enemy relationships should be red
      const enemyConnection = screen.getByTestId('relationship-A-C');
      expect(enemyConnection).toHaveClass('relationship-enemy');

      // Romantic relationships should be pink/purple
      const romanticConnection = screen.getByTestId('relationship-A-D');
      expect(romanticConnection).toHaveClass('relationship-romantic');
    });

    test('RED: should indicate relationship strength with line thickness', () => {
      const tamas = [
        createMockAdvancedTama('A', {
          'B': createMockRelationship('B', 'friend', 90), // Strong
          'C': createMockRelationship('C', 'acquaintance', 20) // Weak
        }),
        createMockAdvancedTama('B'),
        createMockAdvancedTama('C')
      ];

      render(<RelationshipNetwork tamas={tamas} />);

      // Strong relationship should have thick line
      const strongConnection = screen.getByTestId('relationship-A-B');
      expect(strongConnection).toHaveStyle('stroke-width: 3px');

      // Weak relationship should have thin line
      const weakConnection = screen.getByTestId('relationship-A-C');
      expect(weakConnection).toHaveStyle('stroke-width: 1px');
    });

    test('RED: should handle Tamas with no relationships', () => {
      const lonelyTamas = [
        createMockAdvancedTama('A'),
        createMockAdvancedTama('B')
      ];

      render(<RelationshipNetwork tamas={lonelyTamas} />);

      // Should still show Tama nodes
      expect(screen.getByText('TamaA')).toBeInTheDocument();
      expect(screen.getByText('TamaB')).toBeInTheDocument();

      // Should show "no relationships" indicator
      expect(screen.getByText('No active relationships')).toBeInTheDocument();
    });
  });

  describe('SocialNetworkDisplay Component', () => {
    test('RED: should provide relationship statistics summary', () => {
      const tamas = [
        createMockAdvancedTama('A', {
          'B': createMockRelationship('B', 'friend', 75),
          'C': createMockRelationship('C', 'enemy', -50)
        }),
        createMockAdvancedTama('B', {
          'A': createMockRelationship('A', 'friend', 75)
        }),
        createMockAdvancedTama('C')
      ];

      render(<SocialNetworkDisplay tamas={tamas} />);

      // Should show total relationships count
      expect(screen.getByText(/Total Relationships: 3/)).toBeInTheDocument();

      // Should categorize relationships
      expect(screen.getByText(/Friends: 1/)).toBeInTheDocument();
      expect(screen.getByText(/Enemies: 1/)).toBeInTheDocument();
      expect(screen.getByText(/Neutral: 1/)).toBeInTheDocument();

      // Should show most popular Tama
      expect(screen.getByText(/Most Social: TamaA/)).toBeInTheDocument();
    });

    test('RED: should show relationship history timeline', () => {
      const tamas = [
        createMockAdvancedTama('A', {
          'B': {
            ...createMockRelationship('B', 'friend', 75),
            history: [
              {
                timestamp: Date.now() - 86400000, // 1 day ago
                eventType: 'bonding',
                impact: 20,
                description: 'TamaA and TamaB had a great conversation',
                witnessIds: []
              },
              {
                timestamp: Date.now() - 3600000, // 1 hour ago
                eventType: 'cooperation',
                impact: 15,
                description: 'TamaA helped TamaB with a task',
                witnessIds: []
              }
            ]
          }
        }),
        createMockAdvancedTama('B')
      ];

      render(<SocialNetworkDisplay tamas={tamas} />);

      // Should show recent relationship events
      expect(screen.getByText(/Recent Activity/)).toBeInTheDocument();
      expect(screen.getByText(/TamaA and TamaB had a great conversation/)).toBeInTheDocument();
      expect(screen.getByText(/TamaA helped TamaB with a task/)).toBeInTheDocument();
    });

    test('RED: should provide relationship insights and patterns', () => {
      const tamas = [
        createMockAdvancedTama('A', {
          'B': createMockRelationship('B', 'friend', 85),
          'C': createMockRelationship('C', 'friend', 70)
        }),
        createMockAdvancedTama('B', {
          'A': createMockRelationship('A', 'friend', 85),
          'C': createMockRelationship('C', 'rival', -20)
        }),
        createMockAdvancedTama('C', {
          'A': createMockRelationship('A', 'friend', 70),
          'B': createMockRelationship('B', 'rival', -20)
        })
      ];

      render(<SocialNetworkDisplay tamas={tamas} />);

      // Should identify social dynamics
      expect(screen.getByText(/Social Insights/)).toBeInTheDocument();
      expect(screen.getByText(/TamaA is well-liked by everyone/)).toBeInTheDocument();
      expect(screen.getByText(/TamaB and TamaC have conflict/)).toBeInTheDocument();
    });
  });

  describe('Integration with Garden View', () => {
    test('RED: should toggle relationship visualization overlay', () => {
      // Note: This will require updating GardenView component
      const mockEngine = {
        getAdvancedTamas: () => [
          createMockAdvancedTama('A', {
            'B': createMockRelationship('B', 'friend', 75)
          }),
          createMockAdvancedTama('B')
        ],
        getActivitySummary: () => ({})
      } as any;

      const mockGameState = {
        tamas: [],
        resources: {},
        buildings: [],
        customers: [],
        activeContracts: [],
        crafting: { queue: [], unlockedRecipes: [] },
        progression: {},
        unlocks: { buildings: [], recipes: [], species: [] },
        achievements: [],
        tamadex: {},
        settings: {},
        statistics: {},
        lastUpdate: Date.now()
      } as any;

      // This import will fail initially - that's expected for TDD
      const { GardenView } = require('../components/GardenView');

      render(<GardenView gameState={mockGameState} engine={mockEngine} />);

      // Should have a button to toggle relationship view
      expect(screen.getByText(/Show Relationships/)).toBeInTheDocument();
    });

    test('RED: should overlay relationship lines on Garden canvas', () => {
      // This test verifies that relationship visualization integrates with the pixel art garden
      const mockEngine = {
        getAdvancedTamas: () => [
          createMockAdvancedTama('A', {
            'B': createMockRelationship('B', 'friend', 75)
          }),
          createMockAdvancedTama('B')
        ],
        getActivitySummary: () => ({})
      } as any;

      const mockGameState = {} as any;

      const { GardenView } = require('../components/GardenView');

      render(<GardenView gameState={mockGameState} engine={mockEngine} showRelationships={true} />);

      // Should draw relationship lines between Tama positions
      const canvas = screen.getByRole('img'); // Canvas elements have img role
      expect(canvas).toBeInTheDocument();

      // Should have relationship visualization active
      expect(screen.getByTestId('relationship-overlay-active')).toBeInTheDocument();
    });
  });

  describe('Interactive Features', () => {
    test('RED: should show relationship tooltip on hover', () => {
      const tamas = [
        createMockAdvancedTama('A', {
          'B': createMockRelationship('B', 'friend', 75)
        }),
        createMockAdvancedTama('B')
      ];

      render(<RelationshipNetwork tamas={tamas} />);

      const relationshipLine = screen.getByTestId('relationship-A-B');

      // Tooltip should not be visible initially
      expect(screen.queryByText(/Friendship: 75%/)).not.toBeInTheDocument();

      // Should show tooltip on hover (this will require fireEvent)
      // For now, test the data attributes that would trigger tooltip
      expect(relationshipLine).toHaveAttribute('data-tooltip', 'Friendship: 75% strength');
    });

    test('RED: should allow clicking on relationships for details', () => {
      const tamas = [
        createMockAdvancedTama('A', {
          'B': {
            ...createMockRelationship('B', 'best_friend', 90),
            history: [
              {
                timestamp: Date.now() - 3600000,
                eventType: 'bonding',
                impact: 15,
                description: 'Shared a special moment',
                witnessIds: []
              }
            ]
          }
        }),
        createMockAdvancedTama('B')
      ];

      render(<RelationshipNetwork tamas={tamas} onRelationshipClick={() => {}} />);

      const relationshipLine = screen.getByTestId('relationship-A-B');

      // Should be clickable
      expect(relationshipLine).toHaveAttribute('role', 'button');
      expect(relationshipLine).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('Performance and Edge Cases', () => {
    test('RED: should handle large numbers of Tamas efficiently', () => {
      // Create 20 Tamas with full relationship network
      const manyTamas = Array.from({ length: 20 }, (_, i) => {
        const relationships: Record<string, TamaRelationship> = {};

        // Each Tama has relationships with 5 random others
        for (let j = 0; j < 5; j++) {
          const targetId = `T${(i + j + 1) % 20}`;
          if (targetId !== `T${i}`) {
            relationships[targetId] = createMockRelationship(
              targetId,
              'acquaintance',
              Math.random() * 100 - 50
            );
          }
        }

        return createMockAdvancedTama(`T${i}`, relationships);
      });

      const renderStart = performance.now();
      render(<RelationshipNetwork tamas={manyTamas} />);
      const renderTime = performance.now() - renderStart;

      // Should render in reasonable time (less than 100ms)
      expect(renderTime).toBeLessThan(100);

      // Should still show all Tamas
      expect(screen.getAllByText(/^Tama/).length).toBe(20);
    });

    test('RED: should handle empty Tama array gracefully', () => {
      render(<RelationshipNetwork tamas={[]} />);

      expect(screen.getByText(/No Tamas in garden/)).toBeInTheDocument();
    });

    test('RED: should handle circular relationships correctly', () => {
      // A likes B, B likes C, C likes A
      const circularTamas = [
        createMockAdvancedTama('A', {
          'B': createMockRelationship('B', 'friend', 60)
        }),
        createMockAdvancedTama('B', {
          'C': createMockRelationship('C', 'friend', 70)
        }),
        createMockAdvancedTama('C', {
          'A': createMockRelationship('A', 'friend', 80)
        })
      ];

      render(<RelationshipNetwork tamas={circularTamas} />);

      // Should show all relationships without infinite loops
      expect(screen.getByTestId('relationship-A-B')).toBeInTheDocument();
      expect(screen.getByTestId('relationship-B-C')).toBeInTheDocument();
      expect(screen.getByTestId('relationship-C-A')).toBeInTheDocument();
    });
  });
});