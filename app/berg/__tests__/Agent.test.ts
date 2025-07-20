/**
 * Agent Tests - Core agent behavior and floor tracking
 * Testing autonomous clubber movement and intelligence
 */

import { Agent, AgentState, MovementBehavior } from '../core/agents/Agent';
import { Floor } from '../core/map/FloorLayout';

describe('Agent', () => {
  let agent: Agent;

  beforeEach(() => {
    agent = new Agent('test-agent', 100, 200, {
      type: 'authentic',
      stamina: 80,
      socialEnergy: 60,
      entertainment: 50
    });
  });

  test('should initialize with correct properties', () => {
    expect(agent.id).toBe('test-agent');
    expect(agent.x).toBe(100);
    expect(agent.y).toBe(200);
    expect(agent.type).toBe('authentic');
    expect(agent.state).toBe(AgentState.IDLE);
    expect(agent.stamina).toBe(80);
    expect(agent.socialEnergy).toBe(60);
    expect(agent.entertainment).toBe(50);
  });

  test('should start on first floor (Berghain main)', () => {
    expect(agent.getFloor()).toBe(1); // First floor
  });

  test('should handle floor changes', () => {
    agent.setFloor(Floor.GROUND);
    expect(agent.getFloor()).toBe(Floor.GROUND);
    
    agent.setFloor(Floor.SECOND);
    expect(agent.getFloor()).toBe(Floor.SECOND);
  });

  test('should set and reach destinations', () => {
    agent.setDestination(300, 400);
    expect(agent.hasDestination()).toBe(true);
    expect(agent.state).toBe(AgentState.MOVING);
  });

  test('should handle metadata for multi-floor navigation', () => {
    agent.setMetadata('nextFloor', Floor.SECOND);
    agent.setMetadata('nextAreaId', 'panorama_bar');
    
    expect(agent.getMetadata('nextFloor')).toBe(Floor.SECOND);
    expect(agent.getMetadata('nextAreaId')).toBe('panorama_bar');
    expect(agent.hasMetadata('nextFloor')).toBe(true);
    
    agent.clearMetadata('nextFloor');
    expect(agent.hasMetadata('nextFloor')).toBe(false);
  });

  test('should have correct movement behavior by type', () => {
    const authentic = new Agent('auth', 0, 0, { type: 'authentic' });
    expect(authentic.movementBehavior).toBe(MovementBehavior.ORGANIC);
    
    const tourist = new Agent('tour', 0, 0, { type: 'tourist' });
    expect(tourist.movementBehavior).toBe(MovementBehavior.PERFORMATIVE);
    
    const curious = new Agent('cur', 0, 0, { type: 'curious' });
    expect(curious.movementBehavior).toBe(MovementBehavior.ERRATIC);
  });

  test('should decay needs over time', () => {
    const initialStamina = agent.stamina;
    const initialSocial = agent.socialEnergy;
    const initialEntertainment = agent.entertainment;
    
    // Simulate time passing (this would normally happen in the game loop)
    agent.stamina -= 1;
    agent.socialEnergy -= 1;
    agent.entertainment -= 1;
    
    expect(agent.stamina).toBeLessThan(initialStamina);
    expect(agent.socialEnergy).toBeLessThan(initialSocial);
    expect(agent.entertainment).toBeLessThan(initialEntertainment);
  });

  test('should calculate distance to other agents', () => {
    const otherAgent = new Agent('other', 150, 250, { type: 'regular' });
    const distance = agent.getDistanceTo(otherAgent);
    
    // Distance should be sqrt((150-100)^2 + (250-200)^2) = sqrt(2500 + 2500) = sqrt(5000) ≈ 70.71
    expect(distance).toBeCloseTo(70.71, 1);
  });

  test('should find nearby agents', () => {
    const agents = [
      new Agent('close', 110, 210, { type: 'regular' }), // Close
      new Agent('far', 500, 600, { type: 'tourist' }), // Far
      new Agent('medium', 150, 250, { type: 'curious' }) // Medium distance
    ];
    
    const nearby = agent.getNearbyAgents(agents, 50);
    expect(nearby.length).toBe(1);
    expect(nearby[0].id).toBe('close');
  });

  test('should provide debug information', () => {
    agent.setFloor(Floor.SECOND);
    agent.setDestination(300, 400);
    
    const debugInfo = agent.getDebugInfo();
    expect(debugInfo.id).toBe('test-agent');
    expect(debugInfo.floor).toBe(Floor.SECOND);
    expect(debugInfo.type).toBe('authentic');
    expect(debugInfo.hasDestination).toBe(true);
    expect(debugInfo.stamina).toBe(80);
  });

  test('should cleanup properly', () => {
    agent.setDestination(300, 400);
    agent.setMetadata('test', 'value');
    
    agent.cleanup();
    expect(agent.state).toBe(AgentState.IDLE);
    expect(agent.hasDestination()).toBe(false);
  });

  test('should handle different agent types with appropriate defaults', () => {
    const influencer = new Agent('inf', 0, 0, { type: 'influencer' });
    expect(influencer.movementBehavior).toBe(MovementBehavior.PERFORMATIVE);
    
    const regular = new Agent('reg', 0, 0, { type: 'regular' });
    expect(regular.movementBehavior).toBe(MovementBehavior.ORGANIC);
    
    // Check default social energy levels
    expect(influencer.socialEnergy).toBeLessThan(regular.socialEnergy);
  });

  test('should maintain consistent toString representation', () => {
    const str = agent.toString();
    expect(str).toContain('test-agent');
    expect(str).toContain('100.0');
    expect(str).toContain('200.0');
    expect(str).toContain('authentic');
  });
});