import { test, expect } from '@playwright/test';

test.describe('Swag Labs Login Tests', () => {
  test('should login with valid credentials and load product page', async ({ page }) => {
    const screenshotDir = 'screenshots';
    
    try {
      // Step a: Navigate to Swag Labs
      await page.goto('https://www.saucedemo.com/', {
        waitUntil: 'networkidle',
        timeout: 10000
      });
      
      // Take screenshot of login page
      await page.screenshot({ path: `${screenshotDir}/01-login-page.png` });
      
      // Step b: Login with valid credentials
      await test.step('Login with credentials', async () => {
        await page.fill('[data-test="username"]', 'standard_user');
        await page.fill('[data-test="password"]', 'secret_sauce');
        await page.click('[data-test="login-button"]');
      });
      
      // Step c: Assert that the product page loads
      await test.step('Verify product page loads', async () => {
        // Wait for navigation to complete
        await page.waitForURL('**/inventory.html', { timeout: 5000 });
        
        // Verify URL
        expect(page.url()).toContain('/inventory.html');
        
        // Verify inventory container is visible
        const inventoryContainer = page.locator('[data-test="inventory-container"]');
        await expect(inventoryContainer).toBeVisible({ timeout: 5000 });
        
        // Verify product title
        const title = page.locator('[data-test="title"]');
        await expect(title).toHaveText('Products');
        
        // Verify products are loaded (at least one product)
        const products = page.locator('[data-test="inventory-item"]');
        await expect(products).toHaveCount(6); // Swag Labs has 6 products
      });
      
      // Step d: Capture a screenshot of the product page
      await page.screenshot({ 
        path: `${screenshotDir}/02-product-page.png`,
        fullPage: true 
      });
      
    } catch (error) {
      // Take error screenshot if test fails
      await page.screenshot({ 
        path: `${screenshotDir}/error-${Date.now()}.png`,
        fullPage: true 
      });
      throw error;
    }
  });
});