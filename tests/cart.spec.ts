import { test, expect, Page } from '@playwright/test';

test.describe('Cart Functionality - Comprehensive Tests', () => {
  
  // Different locator strategies for educational purposes
  const locators = {
    // By data-test attribute (recommended)
    cartBadge: '[data-test="shopping-cart-badge"]',
    cartLink: '[data-test="shopping-cart-link"]',
    cartList: '[data-test="cart-list"]',
    
    // By CSS classes
    inventoryItem: '.inventory_item',
    cartItem: '.cart_item',
    
    // By role (more semantic)
    addToCartButton: (productName: string) => 
      `button:has-text("Add to cart"):has(div:has-text("${productName}"))`,
    
    // Complex selectors for specific items
    specificAddButton: (itemId: string) => 
      `[data-test="add-to-cart-${itemId}"]`,
    specificRemoveButton: (itemId: string) => 
      `[data-test="remove-${itemId}"]`
  };
  
  const login = async (page: Page) => {
    await page.goto('https://www.saucedemo.com/');
    await page.fill('[data-test="username"]', 'standard_user');
    await page.fill('[data-test="password"]', 'secret_sauce');
    await page.click('[data-test="login-button"]');
    await page.waitForURL('**/inventory.html');
  };
  
  const getCartCount = async (page: Page): Promise<number> => {
    const cartBadge = page.locator(locators.cartBadge);
    if (await cartBadge.isVisible()) {
      const text = await cartBadge.textContent();
      return text ? parseInt(text, 10) : 0;
    }
    return 0;
  };
  
  test.beforeEach(async ({ page }) => {
    await login(page);
  });
  
  test('should add and remove items with robust assertions', async ({ page }) => {
    // Step 1: Add 3 items using different strategies
    const itemsToAdd = [
      { name: 'Sauce Labs Backpack', testId: 'sauce-labs-backpack' },
      { name: 'Sauce Labs Bike Light', testId: 'sauce-labs-bike-light' },
      { name: 'Sauce Labs Bolt T-Shirt', testId: 'sauce-labs-bolt-t-shirt' }
    ];
    
    // Add items with verification after each addition
    for (const [index, item] of itemsToAdd.entries()) {
      // Using data-test specific locator
      await page.click(locators.specificAddButton(item.testId));
      
      // Verify cart count after each addition
      const expectedCount = index + 1;
      const cartCount = await getCartCount(page);
      expect(cartCount).toBe(expectedCount);
      
      // Verify cart badge text matches
      if (expectedCount > 0) {
        await expect(page.locator(locators.cartBadge)).toHaveText(expectedCount.toString());
      }
    }
    
    // Step 2: Final validation - cart count should be 3
    const finalCount = await getCartCount(page);
    expect(finalCount).toBe(3);
    
    // Step 3: Remove 1 item
    const itemToRemove = itemsToAdd[1]; // Remove Bike Light
    await page.click(locators.specificRemoveButton(itemToRemove.testId));
    
    // Verify cart count decreased
    const countAfterRemove = await getCartCount(page);
    expect(countAfterRemove).toBe(2);
    await expect(page.locator(locators.cartBadge)).toHaveText('2');
    
    // Step 4: Assert cart content by navigating to cart page
    await page.click(locators.cartLink);
    await page.waitForURL('**/cart.html');
    
    // Verify cart items count
    const cartItems = page.locator(locators.cartItem);
    await expect(cartItems).toHaveCount(2);
    
    // Verify removed item is not in cart
    const cartItemNames = await page.locator('[data-test="inventory-item-name"]').allTextContents();
    expect(cartItemNames).not.toContain(itemToRemove.name);
    expect(cartItemNames).toContain(itemsToAdd[0].name);
    expect(cartItemNames).toContain(itemsToAdd[2].name);
    
    // Verify each cart item has all required elements
    for (let i = 0; i < await cartItems.count(); i++) {
      const cartItem = cartItems.nth(i);
      await expect(cartItem.locator('[data-test="inventory-item-name"]')).toBeVisible();
      await expect(cartItem.locator('[data-test="inventory-item-price"]')).toBeVisible();
      await expect(cartItem.locator('[data-test^="remove"]')).toBeVisible();
      await expect(cartItem.locator('[data-test^="remove"]')).toHaveText('Remove');
    }
    
    // Take screenshot for documentation
    await page.screenshot({ 
      path: 'screenshots/final-cart-state.png',
      fullPage: true 
    });
  });
  
  test('should handle edge cases and maintain cart consistency', async ({ page }) => {
    // Test edge case: Adding same item multiple times
    const productName = 'Sauce Labs Backpack';
    const addButton = page.locator('[data-test="add-to-cart-sauce-labs-backpack"]');
    
    // Add item once
    await addButton.click();
    let cartCount = await getCartCount(page);
    expect(cartCount).toBe(1);
    
    // Try to add same item again - button should have changed to Remove
    await expect(addButton).not.toBeVisible();
    const removeButton = page.locator('[data-test="remove-sauce-labs-backpack"]');
    await expect(removeButton).toBeVisible();
    
    // Remove the item
    await removeButton.click();
    cartCount = await getCartCount(page);
    expect(cartCount).toBe(0);
    
    // Add button should be back
    await expect(addButton).toBeVisible();
    
    // Test removing from cart page
    await addButton.click();
    await page.click(locators.cartLink);
    
    const cartRemoveButton = page.locator('[data-test="remove-sauce-labs-backpack"]');
    await expect(cartRemoveButton).toBeVisible();
    await cartRemoveButton.click();
    
    // Verify cart is empty
    const cartItems = page.locator(locators.cartItem);
    await expect(cartItems).toHaveCount(0);
    
    // Go back to inventory and verify button state
    await page.click('[data-test="continue-shopping"]');
    await expect(addButton).toBeVisible();
    await expect(page.locator(locators.cartBadge)).not.toBeVisible();
  });
  
  test('should verify cart persistence across navigation', async ({ page }) => {
    const itemsToAdd = [
      'Sauce Labs Backpack',
      'Sauce Labs Bike Light'
    ];
    
    // Add items
    for (const item of itemsToAdd) {
      await addItemToCartByName(page, item);
    }
    
    // Verify cart count
    let cartCount = await getCartCount(page);
    expect(cartCount).toBe(2);
    
    // Navigate to different pages and verify cart persists
    
    // Navigate to About page and back
    await page.click('[data-test="about-sidebar-link"]');
    await page.waitForURL('**/about');
    await page.goBack();
    await page.waitForURL('**/inventory.html');
    
    cartCount = await getCartCount(page);
    expect(cartCount).toBe(2);
    
    // Navigate to cart and back
    await page.click(locators.cartLink);
    await page.waitForURL('**/cart.html');
    await page.click('[data-test="continue-shopping"]');
    await page.waitForURL('**/inventory.html');
    
    cartCount = await getCartCount(page);
    expect(cartCount).toBe(2);
    
    // Refresh page
    await page.reload();
    cartCount = await getCartCount(page);
    expect(cartCount).toBe(2);
    
    // Verify cart badge is still visible
    await expect(page.locator(locators.cartBadge)).toHaveText('2');
  });
});

// Helper function for adding items by name
async function addItemToCartByName(page: Page, productName: string) {
  const product = page.locator('.inventory_item').filter({ hasText: productName });
  const addButton = product.locator('[data-test^="add-to-cart"]');
  await addButton.click();
}