import { test, expect, Page } from '@playwright/test';

test.describe('Product List & Sorting Tests', () => {
  
  // Helper function to login
  const login = async (page: Page) => {
    await page.goto('https://www.saucedemo.com/');
    await page.fill('[data-test="username"]', 'standard_user');
    await page.fill('[data-test="password"]', 'secret_sauce');
    await page.click('[data-test="login-button"]');
    await page.waitForURL('**/inventory.html');
  };
  
  // Helper function to get product data
  const getProductData = async (page: Page) => {
    const titles = await page.locator('[data-test="inventory-item-name"]').allTextContents();
    const prices = await page.locator('[data-test="inventory-item-price"]').allTextContents();
    return { titles, prices };
  };
  
  // Helper function to parse prices
  const parsePrices = (prices: string[]) => {
    return prices.map(price => parseFloat(price.replace('$', '')));
  };
  
  // Helper function to verify price sorting
  const verifyPriceSorting = (prices: number[], ascending: boolean = true) => {
    if (ascending) {
      return prices.every((price, index) => index === 0 || price >= prices[index - 1]);
    } else {
      return prices.every((price, index) => index === 0 || price <= prices[index - 1]);
    }
  };
  
  test.beforeEach(async ({ page }) => {
    await login(page);
  });
  
  test('should sort products by price (low to high) and verify order', async ({ page }) => {
    // Step 1: Select sorting option
    const sortDropdown = page.locator('[data-test="product-sort-container"]');
    await sortDropdown.selectOption('lohi');
    await expect(sortDropdown).toHaveValue('lohi');
    
    // Step 2: Verify product order reflects sorting
    const { titles, prices } = await getProductData(page);
    const numericPrices = parsePrices(prices);
    
    // Verify prices are sorted ascending
    expect(verifyPriceSorting(numericPrices, true)).toBe(true);
    
    // Step 3: Assert title + price correctness
    const expectedProducts = [
      { title: "Sauce Labs Onesie", price: "$7.99" },
      { title: "Sauce Labs Bike Light", price: "$9.99" },
      { title: "Sauce Labs Bolt T-Shirt", price: "$15.99" },
      { title: "Test.allTheThings() T-Shirt (Red)", price: "$15.99" },
      { title: "Sauce Labs Backpack", price: "$29.99" },
      { title: "Sauce Labs Fleece Jacket", price: "$49.99" }
    ];
    
    // Verify each product matches expected
    expectedProducts.forEach((expected, index) => {
      expect(titles[index]).toBe(expected.title);
      expect(prices[index]).toBe(expected.price);
    });
    
    // Take screenshot
    await page.screenshot({ 
      path: 'screenshots/products-sorted-low-to-high.png',
      fullPage: true 
    });
  });
  
  test('should sort products by price (high to low)', async ({ page }) => {
    const sortDropdown = page.locator('[data-test="product-sort-container"]');
    await sortDropdown.selectOption('hilo');
    
    const { titles, prices } = await getProductData(page);
    const numericPrices = parsePrices(prices);
    
    // Verify prices are sorted descending
    expect(verifyPriceSorting(numericPrices, false)).toBe(true);
    
    const expectedProducts = [
      { title: "Sauce Labs Fleece Jacket", price: "$49.99" },
      { title: "Sauce Labs Backpack", price: "$29.99" },
      { title: "Sauce Labs Bolt T-Shirt", price: "$15.99" },
      { title: "Test.allTheThings() T-Shirt (Red)", price: "$15.99" },
      { title: "Sauce Labs Bike Light", price: "$9.99" },
      { title: "Sauce Labs Onesie", price: "$7.99" }
    ];
    
    expectedProducts.forEach((expected, index) => {
      expect(titles[index]).toBe(expected.title);
      expect(prices[index]).toBe(expected.price);
    });
  });
});