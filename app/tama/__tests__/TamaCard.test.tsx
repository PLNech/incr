/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TamaCard } from '../components/TamaCard';
import { TamaData } from '../types';

const mockTama: TamaData = {
  id: 'test-tama-1',
  name: 'Buddy',
  species: 'basic',
  tier: 1,
  level: 5,
  experience: 150,
  genetics: {
    cuteness: 75,
    intelligence: 60,
    energy: 80,
    appetite: 45
  },
  needs: {
    hunger: 85,
    happiness: 90,
    energy: 70,
    cleanliness: 95
  },
  stats: {
    totalInteractions: 25,
    hoursLived: 48,
    jobsCompleted: 3
  },
  createdAt: Date.now() - (48 * 60 * 60 * 1000), // 48 hours ago
  lastInteraction: Date.now() - (2 * 60 * 60 * 1000) // 2 hours ago
};

const mockHungryTama: TamaData = {
  ...mockTama,
  id: 'hungry-tama',
  name: 'Hungry',
  needs: {
    hunger: 25,
    happiness: 60,
    energy: 80,
    cleanliness: 90
  }
};

const mockOnInteract = jest.fn();

describe('TamaCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Display', () => {
    it('should display Tama basic information', () => {
      render(<TamaCard tama={mockTama} onInteract={mockOnInteract} />);

      expect(screen.getByText('Buddy')).toBeInTheDocument();
      expect(screen.getByText(/Level 5/)).toBeInTheDocument();
      expect(screen.getByText(/basic/i)).toBeInTheDocument();
      expect(screen.getByText(/Tier 1/i)).toBeInTheDocument();
    });

    it('should display Tama needs with progress bars', () => {
      render(<TamaCard tama={mockTama} onInteract={mockOnInteract} />);

      // Should show need values with percentage format
      expect(screen.getByText('hunger')).toBeInTheDocument();
      expect(screen.getByText('85%')).toBeInTheDocument();
      expect(screen.getByText('happiness')).toBeInTheDocument();
      expect(screen.getByText('90%')).toBeInTheDocument();
      expect(screen.getByText('energy')).toBeInTheDocument();
      expect(screen.getByText('70%')).toBeInTheDocument();
      expect(screen.getByText('cleanliness')).toBeInTheDocument();
      expect(screen.getByText('95%')).toBeInTheDocument();
    });

    it('should display Tama genetics information', () => {
      render(<TamaCard tama={mockTama} onInteract={mockOnInteract} />);

      expect(screen.getByText(/Cuteness.*75/)).toBeInTheDocument();
      expect(screen.getByText(/Intelligence.*60/)).toBeInTheDocument();
      expect(screen.getByText(/Energy.*80/)).toBeInTheDocument();
      expect(screen.getByText(/Appetite.*45/)).toBeInTheDocument();
    });
  });

  describe('Interaction Buttons', () => {
    it('should display interaction buttons', () => {
      render(<TamaCard tama={mockTama} onInteract={mockOnInteract} />);

      expect(screen.getByRole('button', { name: /feed/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /clean/i })).toBeInTheDocument();
    });

    it('should call onInteract when feed button is clicked', () => {
      render(<TamaCard tama={mockTama} onInteract={mockOnInteract} />);

      fireEvent.click(screen.getByRole('button', { name: /feed/i }));

      expect(mockOnInteract).toHaveBeenCalledWith(mockTama.id, 'feed');
    });

    it('should call onInteract when play button is clicked', () => {
      render(<TamaCard tama={mockTama} onInteract={mockOnInteract} />);

      fireEvent.click(screen.getByRole('button', { name: /play/i }));

      expect(mockOnInteract).toHaveBeenCalledWith(mockTama.id, 'play');
    });

    it('should call onInteract when clean button is clicked', () => {
      render(<TamaCard tama={mockTama} onInteract={mockOnInteract} />);

      fireEvent.click(screen.getByRole('button', { name: /clean/i }));

      expect(mockOnInteract).toHaveBeenCalledWith(mockTama.id, 'clean');
    });
  });

  describe('Visual Indicators', () => {
    it('should highlight low hunger with warning colors', () => {
      render(<TamaCard tama={mockHungryTama} onInteract={mockOnInteract} />);

      // Should have warning styling for low hunger - find the container with the percentage value
      const hungerValue = screen.getByText('25%');
      expect(hungerValue.closest('.bg-red-50')).toBeInTheDocument();
    });

    it('should show species-appropriate emoji or icon', () => {
      render(<TamaCard tama={mockTama} onInteract={mockOnInteract} />);

      // Should display species-appropriate visual element
      expect(screen.getByText('🐾')).toBeInTheDocument(); // Default for basic species
    });

    it('should display tier with appropriate styling', () => {
      const tierTwoTama = { ...mockTama, tier: 2 as const };
      render(<TamaCard tama={tierTwoTama} onInteract={mockOnInteract} />);

      const tierElement = screen.getByText(/Tier 2/i);
      expect(tierElement).toHaveClass('text-purple-600');
    });
  });

  describe('Need States', () => {
    it('should show urgent attention needed for very low needs', () => {
      const urgentTama: TamaData = {
        ...mockTama,
        needs: {
          hunger: 15,
          happiness: 20,
          energy: 10,
          cleanliness: 25
        }
      };

      render(<TamaCard tama={urgentTama} onInteract={mockOnInteract} />);

      // Should show attention indicators
      expect(screen.getByText(/needs attention/i)).toBeInTheDocument();
    });

    it('should show happy state for high needs', () => {
      const happyTama: TamaData = {
        ...mockTama,
        needs: {
          hunger: 95,
          happiness: 98,
          energy: 90,
          cleanliness: 95
        }
      };

      render(<TamaCard tama={happyTama} onInteract={mockOnInteract} />);

      // Should show happy indicators
      expect(screen.getByText(/happy/i)).toBeInTheDocument();
    });
  });

  describe('Statistics Display', () => {
    it('should show Tama statistics in collapsed mode by default', () => {
      render(<TamaCard tama={mockTama} onInteract={mockOnInteract} />);

      // Stats should not be visible by default
      expect(screen.queryByText(/Total Interactions.*25/)).not.toBeInTheDocument();
    });

    it('should show expanded statistics when clicked', async () => {
      render(<TamaCard tama={mockTama} onInteract={mockOnInteract} />);

      // Find and click the expand button
      const expandButton = screen.getByRole('button', { name: /details|more|expand/i });
      fireEvent.click(expandButton);

      // Stats should now be visible
      await waitFor(() => {
        expect(screen.getByText(/Total Interactions.*25/)).toBeInTheDocument();
        expect(screen.getByText(/Hours Lived.*48/)).toBeInTheDocument();
        expect(screen.getByText(/Jobs Completed.*3/)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria labels for screen readers', () => {
      render(<TamaCard tama={mockTama} onInteract={mockOnInteract} />);

      expect(screen.getByLabelText(/Tama card for Buddy/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Feed Buddy/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Play with Buddy/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Clean Buddy/i)).toBeInTheDocument();
    });

    it('should support keyboard navigation', () => {
      render(<TamaCard tama={mockTama} onInteract={mockOnInteract} />);

      const feedButton = screen.getByRole('button', { name: /feed/i });

      // Should be focusable
      feedButton.focus();
      expect(document.activeElement).toBe(feedButton);

      // Should trigger on Enter key
      fireEvent.keyDown(feedButton, { key: 'Enter', code: 'Enter' });
      expect(mockOnInteract).toHaveBeenCalledWith(mockTama.id, 'feed');
    });
  });
});