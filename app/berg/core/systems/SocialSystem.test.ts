import { Agent, AgentState } from '../agents/Agent';
import { NeedsSystem } from './NeedsSystem';
import { JourneySystem } from './JourneySystem';
import { SocialSystem, SocialGroup, GroupType, SocialRelationship, GroupRole } from './SocialSystem';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

class SocialSystemTestSuite {
  private results: TestResult[] = [];

  private test(name: string, testFn: () => boolean): void {
    try {
      const passed = testFn();
      this.results.push({ name, passed });
      console.log(`${passed ? '✅' : '❌'} ${name}`);
    } catch (error) {
      this.results.push({ 
        name, 
        passed: false, 
        error: error instanceof Error ? error.message : String(error) 
      });
      console.log(`❌ ${name}: ${error}`);
    }
  }

  private createTestAgent(type: string, id: string = 'test-agent'): Agent {
    return new Agent(id, Math.random() * 20, Math.random() * 20, {
      type: type as any,
      stamina: 80 + Math.random() * 20,
      socialEnergy: 60 + Math.random() * 40,
      entertainment: 50 + Math.random() * 50
    });
  }

  private createTestAgents(): Agent[] {
    return [
      this.createTestAgent('authentic', 'auth-1'),
      this.createTestAgent('authentic', 'auth-2'),
      this.createTestAgent('regular', 'reg-1'),
      this.createTestAgent('curious', 'cur-1'),
      this.createTestAgent('tourist', 'tour-1'),
      this.createTestAgent('influencer', 'inf-1')
    ];
  }

  testSocialRelationshipCreation(): void {
    this.test('creates social relationship with correct compatibility', () => {
      const agent1 = this.createTestAgent('authentic', 'agent1');
      const agent2 = this.createTestAgent('authentic', 'agent2');
      
      const relationship = new SocialRelationship(agent1.id, agent2.id);
      const compatibility = relationship.calculateCompatibility(agent1.type as any, agent2.type as any);
      
      if (compatibility <= 0 || compatibility > 100) {
        throw new Error(`Invalid compatibility score: ${compatibility}`);
      }
      
      // Authentic agents should be compatible with each other
      if (compatibility < 60) {
        throw new Error(`Authentic agents should have good compatibility, got ${compatibility}`);
      }
      return true;
    });

    this.test('calculates different compatibility scores for different agent types', () => {
      const authentic = this.createTestAgent('authentic', 'auth');
      const tourist = this.createTestAgent('tourist', 'tour');
      
      const authTourRelation = new SocialRelationship(authentic.id, tourist.id);
      const authTourCompat = authTourRelation.calculateCompatibility(authentic.type as any, tourist.type as any);
      
      const authAuthRelation = new SocialRelationship(authentic.id, authentic.id + '2');
      const authAuthCompat = authAuthRelation.calculateCompatibility('authentic', 'authentic');
      
      if (authAuthCompat <= authTourCompat) {
        throw new Error(`Authentic-Authentic (${authAuthCompat}) should be more compatible than Authentic-Tourist (${authTourCompat})`);
      }
      return true;
    });

    this.test('relationship strength changes over time', () => {
      const agent1 = this.createTestAgent('regular', 'reg1');
      const agent2 = this.createTestAgent('curious', 'cur1');
      
      const relationship = new SocialRelationship(agent1.id, agent2.id);
      const initialStrength = relationship.strength;
      
      // Simulate positive interaction
      relationship.recordInteraction(80, 'danced_together');
      
      if (relationship.strength <= initialStrength) {
        throw new Error(`Relationship strength should increase after positive interaction: ${initialStrength} -> ${relationship.strength}`);
      }
      
      // Simulate negative interaction
      relationship.recordInteraction(20, 'ignored');
      
      const finalStrength = relationship.strength;
      if (finalStrength >= relationship.strength) {
        throw new Error('Relationship strength should decrease after negative interaction');
      }
      return true;
    });
  }

  testSocialGroupFormation(): void {
    this.test('forms group with compatible agents', () => {
      const agents = this.createTestAgents();
      const socialSystem = new SocialSystem();
      
      // Add all agents to system
      agents.forEach(agent => socialSystem.addAgent(agent));
      
      // Update to allow group formation
      socialSystem.update(1000);
      
      const groups = socialSystem.getAllGroups();
      if (groups.length === 0) {
        throw new Error('Should form at least one group');
      }
      
      const firstGroup = groups[0];
      if (firstGroup.members.size < 2) {
        throw new Error('Group should have at least 2 members');
      }
      return true;
    });

    this.test('assigns appropriate group roles', () => {
      const leader = this.createTestAgent('influencer', 'leader');
      const follower1 = this.createTestAgent('tourist', 'follower1');
      const follower2 = this.createTestAgent('curious', 'follower2');
      
      const group = new SocialGroup('test-group', GroupType.FRIEND_GROUP);
      group.addMember(leader.id, GroupRole.LEADER);
      group.addMember(follower1.id, GroupRole.FOLLOWER);
      group.addMember(follower2.id, GroupRole.FOLLOWER);
      
      if (group.getLeader() !== leader.id) {
        throw new Error(`Expected leader to be ${leader.id}, got ${group.getLeader()}`);
      }
      
      const followers = group.getFollowers();
      if (!followers.includes(follower1.id) || !followers.includes(follower2.id)) {
        throw new Error('Followers not correctly assigned');
      }
      return true;
    });

    this.test('limits group size appropriately', () => {
      const group = new SocialGroup('size-test', GroupType.FRIEND_GROUP);
      
      // Add maximum members
      for (let i = 0; i < 6; i++) {
        const success = group.addMember(`member-${i}`, GroupRole.MEMBER);
        if (!success && i < 5) {
          throw new Error(`Should be able to add member ${i} to friend group`);
        }
      }
      
      // Try to add one more (should fail)
      const overflowSuccess = group.addMember('overflow', GroupRole.MEMBER);
      if (overflowSuccess) {
        throw new Error('Should not be able to exceed friend group size limit');
      }
      return true;
    });

    this.test('creates different group types with different behaviors', () => {
      const friendGroup = new SocialGroup('friends', GroupType.FRIEND_GROUP);
      const followerGroup = new SocialGroup('followers', GroupType.FOLLOWER_GROUP);
      const danceGroup = new SocialGroup('dancers', GroupType.DANCE_CIRCLE);
      
      if (friendGroup.maxSize === followerGroup.maxSize) {
        throw new Error('Friend groups and follower groups should have different max sizes');
      }
      
      if (danceGroup.cohesion === friendGroup.cohesion) {
        throw new Error('Dance circles should have different cohesion than friend groups');
      }
      return true;
    });
  }

  testGroupBehavior(): void {
    this.test('group moves together when cohesion is high', () => {
      const agents = [
        this.createTestAgent('authentic', 'auth1'),
        this.createTestAgent('authentic', 'auth2'),
        this.createTestAgent('regular', 'reg1')
      ];
      
      const socialSystem = new SocialSystem();
      agents.forEach(agent => socialSystem.addAgent(agent));
      
      const group = new SocialGroup('test-group', GroupType.FRIEND_GROUP);
      group.addMember(agents[0].id, GroupRole.LEADER);
      group.addMember(agents[1].id, GroupRole.MEMBER);
      group.addMember(agents[2].id, GroupRole.MEMBER);
      
      socialSystem.addGroup(group);
      
      // Check if group should move together
      const shouldMoveTogether = group.shouldMoveAsTogether();
      if (group.cohesion > 70 && !shouldMoveTogether) {
        throw new Error('High cohesion group should move together');
      }
      return true;
    });

    this.test('group influences individual agent decisions', () => {
      const leader = this.createTestAgent('influencer', 'leader');
      const follower = this.createTestAgent('tourist', 'follower');
      
      const socialSystem = new SocialSystem();
      socialSystem.addAgent(leader);
      socialSystem.addAgent(follower);
      
      const group = new SocialGroup('influence-test', GroupType.FOLLOWER_GROUP);
      group.addMember(leader.id, GroupRole.LEADER);
      group.addMember(follower.id, GroupRole.FOLLOWER);
      
      socialSystem.addGroup(group);
      
      // Test influence on location preference
      const influence = socialSystem.getGroupInfluenceOnDecision(follower.id, 'choose_location');
      if (typeof influence !== 'object' || !influence.hasOwnProperty('suggestedLocation')) {
        throw new Error('Group should influence follower location decisions');
      }
      return true;
    });

    this.test('group satisfaction affects group stability', () => {
      const group = new SocialGroup('stability-test', GroupType.FRIEND_GROUP);
      group.addMember('member1', GroupRole.LEADER);
      group.addMember('member2', GroupRole.MEMBER);
      
      const initialCohesion = group.cohesion;
      
      // Simulate negative group experience
      group.recordGroupExperience('bad_location', 20);
      
      if (group.cohesion >= initialCohesion) {
        throw new Error('Bad experiences should decrease group cohesion');
      }
      
      // Simulate positive group experience
      group.recordGroupExperience('great_music', 90);
      
      if (group.cohesion <= initialCohesion) {
        throw new Error('Good experiences should help restore group cohesion');
      }
      return true;
    });
  }

  testGroupDissolution(): void {
    this.test('group dissolves when cohesion becomes too low', () => {
      const group = new SocialGroup('dissolution-test', GroupType.FRIEND_GROUP);
      group.addMember('member1', GroupRole.LEADER);
      group.addMember('member2', GroupRole.MEMBER);
      
      // Force very low cohesion
      for (let i = 0; i < 10; i++) {
        group.recordGroupExperience('conflict', 10);
      }
      
      if (group.cohesion > 20 && !group.shouldDissolve()) {
        throw new Error('Group with very low cohesion should dissolve');
      }
      return true;
    });

    this.test('members can leave groups voluntarily', () => {
      const group = new SocialGroup('leave-test', GroupType.FRIEND_GROUP);
      group.addMember('stayer', GroupRole.LEADER);
      group.addMember('leaver', GroupRole.MEMBER);
      
      const initialSize = group.members.size;
      const success = group.removeMember('leaver');
      
      if (!success) {
        throw new Error('Should be able to remove group member');
      }
      if (group.members.size !== initialSize - 1) {
        throw new Error('Group size should decrease after member removal');
      }
      if (group.hasMember('leaver')) {
        throw new Error('Removed member should no longer be in group');
      }
      return true;
    });

    this.test('group dissolves when leader leaves', () => {
      const group = new SocialGroup('leader-leave-test', GroupType.FOLLOWER_GROUP);
      group.addMember('leader', GroupRole.LEADER);
      group.addMember('follower1', GroupRole.FOLLOWER);
      group.addMember('follower2', GroupRole.FOLLOWER);
      
      group.removeMember('leader');
      
      // Follower groups should dissolve when leader leaves
      if (group.getGroupType() === GroupType.FOLLOWER_GROUP && !group.shouldDissolve()) {
        throw new Error('Follower group should dissolve when leader leaves');
      }
      return true;
    });
  }

  testSocialInfluenceOnNeeds(): void {
    this.test('group membership affects individual social needs', () => {
      const agent = this.createTestAgent('curious', 'social-agent');
      const needsSystem = new NeedsSystem(agent);
      const socialSystem = new SocialSystem();
      
      socialSystem.addAgent(agent);
      
      // Get baseline social need
      const baselineSocial = needsSystem.getNeed('social' as any)?.currentValue;
      
      // Add agent to a satisfying group
      const group = new SocialGroup('satisfying-group', GroupType.FRIEND_GROUP);
      group.addMember(agent.id, GroupRole.MEMBER);
      group.addMember('friend1', GroupRole.MEMBER);
      group.addMember('friend2', GroupRole.MEMBER);
      
      socialSystem.addGroup(group);
      
      // Simulate being in group for some time
      const groupSatisfaction = socialSystem.getGroupSatisfactionForAgent(agent.id);
      
      if (groupSatisfaction <= 0) {
        throw new Error('Agent in group should have some group satisfaction');
      }
      return true;
    });

    this.test('group activities influence entertainment needs', () => {
      const agents = [
        this.createTestAgent('regular', 'dancer1'),
        this.createTestAgent('regular', 'dancer2'),
        this.createTestAgent('curious', 'dancer3')
      ];
      
      const socialSystem = new SocialSystem();
      agents.forEach(agent => socialSystem.addAgent(agent));
      
      const danceGroup = new SocialGroup('dance-party', GroupType.DANCE_CIRCLE);
      agents.forEach(agent => danceGroup.addMember(agent.id, GroupRole.MEMBER));
      
      socialSystem.addGroup(danceGroup);
      
      // Simulate group dancing activity
      danceGroup.recordGroupExperience('amazing_set', 95);
      
      const groupBonus = socialSystem.getGroupEntertainmentBonus(agents[0].id);
      if (groupBonus <= 0) {
        throw new Error('Dancing in group should provide entertainment bonus');
      }
      return true;
    });
  }

  testSocialProximityDetection(): void {
    this.test('detects agents in proximity for group formation', () => {
      const agent1 = this.createTestAgent('authentic', 'close1');
      const agent2 = this.createTestAgent('regular', 'close2');
      const agent3 = this.createTestAgent('tourist', 'far');
      
      // Place agents at specific positions
      agent1.x = 10;
      agent1.y = 10;
      agent2.x = 12;
      agent2.y = 11; // Close to agent1
      agent3.x = 20;
      agent3.y = 20; // Far from others
      
      const socialSystem = new SocialSystem();
      socialSystem.addAgent(agent1);
      socialSystem.addAgent(agent2);
      socialSystem.addAgent(agent3);
      
      const nearbyAgents = socialSystem.getAgentsInProximity(agent1, 5);
      
      if (!nearbyAgents.some(a => a.id === agent2.id)) {
        throw new Error('Should detect agent2 in proximity of agent1');
      }
      if (nearbyAgents.some(a => a.id === agent3.id)) {
        throw new Error('Should not detect agent3 in proximity of agent1');
      }
      return true;
    });

    this.test('groups form based on location and agent type compatibility', () => {
      const agents = [
        this.createTestAgent('authentic', 'auth1'),
        this.createTestAgent('authentic', 'auth2'),
        this.createTestAgent('regular', 'reg1')
      ];
      
      // Place all agents at dancefloor
      agents.forEach(agent => {
        agent.x = 10 + Math.random() * 2; // Close together
        agent.y = 10 + Math.random() * 2;
      });
      
      const socialSystem = new SocialSystem();
      agents.forEach(agent => socialSystem.addAgent(agent));
      
      // Force group formation check
      socialSystem.checkForGroupFormation();
      
      const groups = socialSystem.getAllGroups();
      if (groups.length > 0) {
        const group = groups[0];
        // Check if group has compatible agents
        const hasAuthentic = Array.from(group.members.keys()).some(id => 
          agents.find(a => a.id === id)?.type === 'authentic'
        );
        if (!hasAuthentic) {
          throw new Error('Group should include authentic agents when they are nearby');
        }
      }
      return true;
    });
  }

  testAdvancedSocialBehaviors(): void {
    this.test('agents can be in multiple groups simultaneously', () => {
      const agent = this.createTestAgent('curious', 'social-butterfly');
      const socialSystem = new SocialSystem();
      socialSystem.addAgent(agent);
      
      const friendGroup = new SocialGroup('friends', GroupType.FRIEND_GROUP);
      const danceGroup = new SocialGroup('dancers', GroupType.DANCE_CIRCLE);
      
      friendGroup.addMember(agent.id, GroupRole.MEMBER);
      danceGroup.addMember(agent.id, GroupRole.MEMBER);
      
      socialSystem.addGroup(friendGroup);
      socialSystem.addGroup(danceGroup);
      
      const agentGroups = socialSystem.getGroupsForAgent(agent.id);
      if (agentGroups.length !== 2) {
        throw new Error(`Agent should be in 2 groups, found ${agentGroups.length}`);
      }
      return true;
    });

    this.test('social energy spreads through groups', () => {
      const energeticAgent = this.createTestAgent('influencer', 'energetic');
      const tiredAgent = this.createTestAgent('regular', 'tired');
      
      energeticAgent.socialEnergy = 95;
      tiredAgent.socialEnergy = 30;
      
      const socialSystem = new SocialSystem();
      socialSystem.addAgent(energeticAgent);
      socialSystem.addAgent(tiredAgent);
      
      const group = new SocialGroup('energy-group', GroupType.FRIEND_GROUP);
      group.addMember(energeticAgent.id, GroupRole.LEADER);
      group.addMember(tiredAgent.id, GroupRole.MEMBER);
      
      socialSystem.addGroup(group);
      
      // Simulate energy transfer
      const energyBonus = socialSystem.getSocialEnergyBonus(tiredAgent.id);
      if (energyBonus <= 0) {
        throw new Error('Tired agent should get energy bonus from energetic group leader');
      }
      return true;
    });

    this.test('group consensus affects decision making', () => {
      const agents = [
        this.createTestAgent('regular', 'reg1'),
        this.createTestAgent('regular', 'reg2'),
        this.createTestAgent('curious', 'cur1')
      ];
      
      const socialSystem = new SocialSystem();
      agents.forEach(agent => socialSystem.addAgent(agent));
      
      const group = new SocialGroup('consensus-group', GroupType.FRIEND_GROUP);
      agents.forEach(agent => group.addMember(agent.id, GroupRole.MEMBER));
      
      socialSystem.addGroup(group);
      
      // Test group decision making
      const groupDecision = socialSystem.getGroupConsensus(group.id, 'next_location');
      if (!groupDecision) {
        throw new Error('Group should be able to reach consensus on decisions');
      }
      
      if (typeof groupDecision.location !== 'string' || groupDecision.confidence < 0 || groupDecision.confidence > 100) {
        throw new Error('Group consensus should return valid location and confidence');
      }
      return true;
    });
  }

  testSocialSystemIntegration(): void {
    this.test('integrates with needs and journey systems', () => {
      const agent = this.createTestAgent('regular', 'integrated-agent');
      const needsSystem = new NeedsSystem(agent);
      const journeySystem = new JourneySystem(agent, needsSystem);
      const socialSystem = new SocialSystem();
      
      socialSystem.addAgent(agent);
      
      // Create a group that influences journey planning
      const group = new SocialGroup('influence-group', GroupType.FRIEND_GROUP);
      group.addMember(agent.id, GroupRole.MEMBER);
      group.addMember('friend', GroupRole.LEADER);
      
      socialSystem.addGroup(group);
      
      // Test integration
      const socialInfluence = socialSystem.getInfluenceOnJourney(agent.id);
      if (!socialInfluence) {
        throw new Error('Social system should provide journey influence');
      }
      
      if (typeof socialInfluence.preferredLocation !== 'string') {
        throw new Error('Social influence should suggest preferred location');
      }
      return true;
    });

    this.test('handles agent removal from social system', () => {
      const agent = this.createTestAgent('regular', 'leaving-agent');
      const socialSystem = new SocialSystem();
      
      socialSystem.addAgent(agent);
      
      const group = new SocialGroup('temp-group', GroupType.FRIEND_GROUP);
      group.addMember(agent.id, GroupRole.MEMBER);
      socialSystem.addGroup(group);
      
      // Remove agent from social system
      socialSystem.removeAgent(agent.id);
      
      // Agent should be removed from all groups
      if (group.hasMember(agent.id)) {
        throw new Error('Agent should be removed from groups when leaving social system');
      }
      return true;
    });
  }

  runAllTests(): void {
    console.log('\n👥 SocialSystem Test Suite\n');
    
    this.testSocialRelationshipCreation();
    this.testSocialGroupFormation();
    this.testGroupBehavior();
    this.testGroupDissolution();
    this.testSocialInfluenceOnNeeds();
    this.testSocialProximityDetection();
    this.testAdvancedSocialBehaviors();
    this.testSocialSystemIntegration();

    // Summary
    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    const failedTests = this.results.filter(r => !r.passed);
    
    console.log(`\n📊 SocialSystem Results: ${passed}/${total} passed`);
    
    if (failedTests.length > 0) {
      console.log('\n❌ Failed Tests:');
      failedTests.forEach(test => {
        console.log(`  • ${test.name}: ${test.error}`);
      });
    } else {
      console.log('\n🎉 All social system tests passed! Dynamic group formation and social influence working.');
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const suite = new SocialSystemTestSuite();
  suite.runAllTests();
}

export default SocialSystemTestSuite;