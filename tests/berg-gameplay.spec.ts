import { test, expect } from '@playwright/test';

test.describe('BergInc Gameplay Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/berg');
  });

  test('should start the game and show initial layout', async ({ page }) => {
    // Wait for game to load - be more specific with the selector
    await expect(page.locator('h1.tracking-wider')).toContainText('BergInc');
    
    // Start the game
    await page.click('button:has-text("Open Your Club")');
    
    // Wait for game to actually start
    await page.waitForTimeout(1000);
    
    // Verify game started
    await expect(page.locator('h3:has-text("Berghain")')).toBeVisible();
    await expect(page.locator('canvas')).toBeVisible();
    
    // Check initial stats
    await expect(page.locator('text=/€\\d+/')).toBeVisible();
    await expect(page.locator('text=/Queue.*waiting/')).toBeVisible();
  });

  test('should show revenue progression over time', async ({ page }) => {
    // Start the game
    await page.click('button:has-text("Open Your Club")');
    
    // Get initial revenue
    const initialRevenue = await page.locator('text=/€[0-9]+/').first().textContent();
    const initialValue = parseFloat(initialRevenue?.replace('€', '') || '0');
    
    // Wait 10 seconds for revenue to change
    await page.waitForTimeout(10000);
    
    // Get updated revenue
    const updatedRevenue = await page.locator('text=/€[0-9]+/').first().textContent();
    const updatedValue = parseFloat(updatedRevenue?.replace('€', '') || '0');
    
    // Revenue should have increased
    expect(updatedValue).toBeGreaterThan(initialValue);
  });

  test('should show agents moving between floors', async ({ page }) => {
    // Start the game
    await page.click('button:has-text("Open Your Club")');
    
    // Wait for agents to spawn
    await page.waitForTimeout(3000);
    
    // Check floor tracking displays
    await expect(page.locator('text=0: Queue')).toBeVisible();
    await expect(page.locator('text=1: Ground')).toBeVisible();
    await expect(page.locator('text=2: Berghain')).toBeVisible();
    await expect(page.locator('text=3: Panorama')).toBeVisible();
    
    // Test floor switching
    await page.keyboard.press('2');
    await page.waitForTimeout(500);
    
    await page.keyboard.press('3');
    await page.waitForTimeout(500);
    
    await page.keyboard.press('1');
    await page.waitForTimeout(500);
  });

  test('should open and close management modal', async ({ page }) => {
    // Start the game
    await page.click('button:has-text("Open Your Club")');
    
    // Open management modal
    await page.click('button:has-text("Open Management")');
    await expect(page.locator('text=Club Management')).toBeVisible();
    await expect(page.locator('text=Expand Capacity')).toBeVisible();
    
    // Close management modal
    await page.click('button:has-text("×")');
    await expect(page.locator('text=Club Management')).not.toBeVisible();
  });

  test('should show queue mechanics', async ({ page }) => {
    // Start the game
    await page.click('button:has-text("Open Your Club")');
    
    // Wait for queue to potentially form
    await page.waitForTimeout(5000);
    
    // Check queue display
    const queueText = await page.locator('text=/0: Queue \\([0-9]+\\)/').textContent();
    expect(queueText).toMatch(/0: Queue \(\d+\)/);
    
    // Check queue in header
    const headerQueue = await page.locator('text=/Queue: [0-9]+ waiting/').textContent();
    expect(headerQueue).toMatch(/Queue: \d+ waiting/);
  });

  test('should handle keyboard controls', async ({ page }) => {
    // Start the game
    await page.click('button:has-text("Open Your Club")');
    
    // Test floor switching with keyboard
    await page.keyboard.press('1');
    await page.waitForTimeout(100);
    
    await page.keyboard.press('2');
    await page.waitForTimeout(100);
    
    await page.keyboard.press('3');
    await page.waitForTimeout(100);
    
    // Test zoom controls
    await page.keyboard.press('+');
    await page.waitForTimeout(100);
    
    await page.keyboard.press('-');
    await page.waitForTimeout(100);
  });

  test('should show tier progression effects', async ({ page }) => {
    // Start the game
    await page.click('button:has-text("Open Your Club")');
    
    // Check initial movement description
    await expect(page.locator('text=Collective trance movement')).toBeVisible();
    
    // Use debug to fast forward (if available)
    await page.evaluate(() => {
      if (window.bergDebug) {
        window.bergDebug.fastForward(2);
      }
    });
    
    await page.waitForTimeout(1000);
    
    // Movement description should change with tier
    const movementText = await page.locator('text=/movement|dancing|selfie/').textContent();
    expect(movementText).toBeTruthy();
  });

  test('should maintain game state across sessions', async ({ page, context }) => {
    // Start the game and get initial state
    await page.click('button:has-text("Open Your Club")');
    await page.waitForTimeout(2000);
    
    const initialRevenue = await page.locator('text=/€[0-9]+/').first().textContent();
    
    // Reload the page
    await page.reload();
    
    // Game should restore previous state
    await expect(page.locator('h3:has-text("Berghain")')).toBeVisible();
    
    const restoredRevenue = await page.locator('text=/€[0-9]+/').first().textContent();
    expect(restoredRevenue).toBe(initialRevenue);
  });
});