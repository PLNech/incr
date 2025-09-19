/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { ResourceBar } from '../components/ResourceBar';
import { GameResources } from '../types';

const mockResources: GameResources = {
  tamaCoins: 1500,
  berries: 250,
  wood: 75,
  stone: 30,
  happinessStars: 12,
  evolutionCrystals: 5
};

const mockLowResources: GameResources = {
  tamaCoins: 0,
  berries: 2,
  wood: 0,
  stone: 1,
  happinessStars: 0,
  evolutionCrystals: 0
};

describe('ResourceBar', () => {
  describe('Basic Display', () => {
    it('should display all resource types with values', () => {
      render(<ResourceBar resources={mockResources} />);

      // Should show all resource types and values
      expect(screen.getByText('1,500')).toBeInTheDocument(); // tamaCoins
      expect(screen.getByText('250')).toBeInTheDocument(); // berries
      expect(screen.getByText('75')).toBeInTheDocument(); // wood
      expect(screen.getByText('30')).toBeInTheDocument(); // stone
      expect(screen.getByText('12')).toBeInTheDocument(); // happinessStars
      expect(screen.getByText('5')).toBeInTheDocument(); // evolutionCrystals
    });

    it('should display resource icons/emojis', () => {
      render(<ResourceBar resources={mockResources} />);

      // Should show appropriate icons for each resource
      expect(screen.getByText('🪙')).toBeInTheDocument(); // tamaCoins
      expect(screen.getByText('🍎')).toBeInTheDocument(); // berries
      expect(screen.getByText('🪵')).toBeInTheDocument(); // wood
      expect(screen.getByText('🪨')).toBeInTheDocument(); // stone
      expect(screen.getByText('⭐')).toBeInTheDocument(); // happinessStars
      expect(screen.getByText('💎')).toBeInTheDocument(); // evolutionCrystals
    });

    it('should display resource names as labels', () => {
      render(<ResourceBar resources={mockResources} />);

      // Should show resource names for accessibility (using getAllByLabelText for multiple matches)
      expect(screen.getAllByLabelText(/tama coins/i)).toHaveLength(2); // Both aria-label and icon
      expect(screen.getAllByLabelText(/berries/i)).toHaveLength(2);
      expect(screen.getAllByLabelText(/wood/i)).toHaveLength(2);
      expect(screen.getAllByLabelText(/stone/i)).toHaveLength(2);
      expect(screen.getAllByLabelText(/happiness stars/i)).toHaveLength(2);
      expect(screen.getAllByLabelText(/evolution crystals/i)).toHaveLength(2);
    });
  });

  describe('Number Formatting', () => {
    it('should format large numbers with commas', () => {
      const largeResources: GameResources = {
        tamaCoins: 123456,
        berries: 7890,
        wood: 1234,
        stone: 567,
        happinessStars: 89,
        evolutionCrystals: 12
      };

      render(<ResourceBar resources={largeResources} />);

      expect(screen.getByText('123,456')).toBeInTheDocument();
      expect(screen.getByText('7,890')).toBeInTheDocument();
      expect(screen.getByText('1,234')).toBeInTheDocument();
    });

    it('should display zero values correctly', () => {
      render(<ResourceBar resources={mockLowResources} />);

      expect(screen.getAllByText('0')).toHaveLength(4); // Multiple resources with 0 value
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  describe('Visual Indicators', () => {
    it('should highlight low resource values', () => {
      render(<ResourceBar resources={mockLowResources} />);

      // Should have warning styling for low resources
      const zeroResources = screen.getAllByText('0');
      zeroResources.forEach(element => {
        expect(element.closest('.text-red-600')).toBeInTheDocument();
      });
    });

    it('should show normal styling for adequate resources', () => {
      render(<ResourceBar resources={mockResources} />);

      // Should have normal styling for adequate resources
      const coinsElement = screen.getByText('1,500');
      expect(coinsElement.closest('.text-green-600')).toBeInTheDocument();
    });

    it('should group primary and secondary resources visually', () => {
      render(<ResourceBar resources={mockResources} />);

      // Should visually separate primary resources (coins, berries) from secondary
      const resourceBar = screen.getByRole('region', { name: /resources/i });
      expect(resourceBar).toBeInTheDocument();

      // Should have distinct sections
      expect(resourceBar.querySelector('.border-r')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should be responsive and handle small screens', () => {
      render(<ResourceBar resources={mockResources} />);

      const resourceBar = screen.getByRole('region', { name: /resources/i });

      // Should handle overflow properly
      expect(resourceBar).toHaveClass('overflow-hidden');

      // Should have grid structure (in the inner div)
      const gridContainer = resourceBar.querySelector('.grid');
      expect(gridContainer).toBeTruthy();
      expect(gridContainer).toHaveClass('grid-cols-6');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(<ResourceBar resources={mockResources} />);

      // Should have main region role
      expect(screen.getByRole('region', { name: /resources/i })).toBeInTheDocument();

      // Each resource should have proper labeling
      expect(screen.getByLabelText(/tama coins.*1,500/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/berries.*250/i)).toBeInTheDocument();
    });

    it('should support screen reader navigation', () => {
      render(<ResourceBar resources={mockResources} />);

      // Should have descriptive text for screen readers
      expect(screen.getByText(/current resources/i)).toBeInTheDocument();
    });
  });

  describe('Compact Mode', () => {
    it('should support compact display mode', () => {
      render(<ResourceBar resources={mockResources} compact={true} />);

      // In compact mode, should show fewer details
      const resourceBar = screen.getByRole('region', { name: /resources/i });
      expect(resourceBar).toHaveClass('py-1'); // Smaller padding
    });

    it('should show priority resources first in compact mode', () => {
      render(<ResourceBar resources={mockResources} compact={true} />);

      // Should prioritize coins and berries in compact view
      expect(screen.getByText('1,500')).toBeInTheDocument();
      expect(screen.getByText('250')).toBeInTheDocument();
    });
  });
});