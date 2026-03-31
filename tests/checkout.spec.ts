import { test, expect, Page } from '@playwright/test';

// Test data for different scenarios
const checkoutScenarios = [
  {
    name: 'Single inexpensive item',
    items: [{ name: 'Sauce Labs Onesie', price: 7.99 }],
    expectedSubtotal: 7.99,
    expectedTax: 0.64,
    expectedTotal: 8.63
  },
  {
    name: 'Multiple items',
    items: [
      { name: 'Sauce Labs Backpack', price: 29.99 },
      { name: 'Sauce Labs Bike Light', price: 9.99 },
      { name: 'Sauce Labs Bolt T-Shirt', price: 15.99 }
    ],
    expectedSubtotal: 55.97,
    expectedTax: 4.48,
    expectedTotal: 60.45
  },
  {
    name: 'Expensive items',
    items: [
      { name: 'Sauce Labs Fleece Jacket', price: 49.99 },
      { name: 'Sauce Labs Backpack', price: 29.99 }
    ],
    expectedSubtotal: 79.98,
    expectedTax: 6.40,
    expectedTotal: 86.38
  }
];

test.describe('Checkout Workflow - Data-Driven Tests', () => {
  const login = async (page: Page) => {
    await page.goto('https://www.saucedemo.com/');
    await page.fill('[data-test="username"]', 'standard_user');
    await page.fill('[data-test="password"]', 'secret_sauce');
    await page.click('[data-test="login-button"]');
    await page.waitForURL('**/inventory.html');
  };
  
  const addItemsToCart = async (page: Page, itemNames: string[]) => {
    for (const itemName of itemNames) {
      const addButton = page.locator(`[data-test="add-to-cart-${itemName.toLowerCase().replace(/ /g, '-')}"]`);
      await addButton.click();
    }
  };
  
  const parsePrice = (priceString: string): number => {
    return parseFloat(priceString.replace('$', ''));
  };
  
  test.beforeEach(async ({ page }) => {
    await login(page);
  });
  
  for (const scenario of checkoutScenarios) {
    test(`should complete checkout: ${scenario.name}`, async ({ page }) => {
      // Add items
      const itemNames = scenario.items.map(item => item.name);
      await addItemsToCart(page, itemNames);
      
      // Go to checkout
      await page.click('[data-test="shopping-cart-link"]');
      await page.click('[data-test="checkout"]');
      
      // Fill form
      await page.fill('[data-test="firstName"]', 'John');
      await page.fill('[data-test="lastName"]', 'Doe');
      await page.fill('[data-test="postalCode"]', '12345');
      await page.click('[data-test="continue"]');
      
      // Verify calculations
      const subtotalText = await page.locator('[data-test="subtotal-label"]').textContent();
      const taxText = await page.locator('[data-test="tax-label"]').textContent();
      const totalText = await page.locator('[data-test="total-label"]').textContent();
      
      const displayedSubtotal = parsePrice(subtotalText?.replace('Item total: ', '') || '0');
      const displayedTax = parsePrice(taxText?.replace('Tax: ', '') || '0');
      const displayedTotal = parsePrice(totalText?.replace('Total: ', '') || '0');
      
      expect(displayedSubtotal).toBeCloseTo(scenario.expectedSubtotal, 2);
      expect(displayedTax).toBeCloseTo(scenario.expectedTax, 2);
      expect(displayedTotal).toBeCloseTo(scenario.expectedTotal, 2);
      
      // Complete checkout
      await page.click('[data-test="finish"]');
      
      // Verify success
      await expect(page.locator('[data-test="complete-header"]')).toHaveText('Thank you for your order!');
    });
  }
});