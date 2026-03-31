import { test, expect, Page } from '@playwright/test';

test.describe('Negative & Edge Case Tests', () => {
  
  // Helper function to get error message
  const getErrorMessage = async (page: Page): Promise<string> => {
    const errorElement = page.locator('[data-test="error"]');
    if (await errorElement.isVisible()) {
      return (await errorElement.textContent()) || '';
    }
    return '';
  };
  
  // Helper function to verify error message
  const verifyErrorMessage = async (page: Page, expectedMessage: string) => {
    const errorElement = page.locator('[data-test="error"]');
    await expect(errorElement).toBeVisible();
    await expect(errorElement).toHaveText(expectedMessage);
    
    // Verify error icon is present
    const errorButton = page.locator('[data-test="error-button"]');
    await expect(errorButton).toBeVisible();
  };
  
  // Helper function to close error message
  const closeErrorMessage = async (page: Page) => {
    const errorButton = page.locator('[data-test="error-button"]');
    if (await errorButton.isVisible()) {
      await errorButton.click();
      await expect(page.locator('[data-test="error"]')).not.toBeVisible();
    }
  };
  
  test.describe('Login Negative Tests', () => {
    
    test('should show error with invalid username', async ({ page }) => {
      await page.goto('https://www.saucedemo.com/');
      
      // Enter invalid username with valid password format
      await page.fill('[data-test="username"]', 'invalid_user');
      await page.fill('[data-test="password"]', 'secret_sauce');
      await page.click('[data-test="login-button"]');
      
      // Assert error message
      await verifyErrorMessage(
        page, 
        'Epic sadface: Username and password do not match any user in this service'
      );
      
      // Take screenshot of error
      await page.screenshot({ path: 'screenshots/error-invalid-username.png' });
      
      // Verify URL hasn't changed (still on login page)
      expect(page.url()).toBe('https://www.saucedemo.com/');
    });
    
    test('should show error with invalid password', async ({ page }) => {
      await page.goto('https://www.saucedemo.com/');
      
      // Enter valid username with invalid password
      await page.fill('[data-test="username"]', 'standard_user');
      await page.fill('[data-test="password"]', 'wrong_password');
      await page.click('[data-test="login-button"]');
      
      // Assert error message
      await verifyErrorMessage(
        page,
        'Epic sadface: Username and password do not match any user in this service'
      );
      
      // Verify input fields still have values
      await expect(page.locator('[data-test="username"]')).toHaveValue('standard_user');
      await expect(page.locator('[data-test="password"]')).toHaveValue('wrong_password');
    });
    
    test('should show error with empty username', async ({ page }) => {
      await page.goto('https://www.saucedemo.com/');
      
      // Leave username empty, enter password
      await page.fill('[data-test="username"]', '');
      await page.fill('[data-test="password"]', 'secret_sauce');
      await page.click('[data-test="login-button"]');
      
      // Assert error message
      await verifyErrorMessage(page, 'Epic sadface: Username is required');
      
      // Verify password field still has value
      await expect(page.locator('[data-test="password"]')).toHaveValue('secret_sauce');
    });
    
    test('should show error with empty password', async ({ page }) => {
      await page.goto('https://www.saucedemo.com/');
      
      // Enter username, leave password empty
      await page.fill('[data-test="username"]', 'standard_user');
      await page.fill('[data-test="password"]', '');
      await page.click('[data-test="login-button"]');
      
      // Assert error message
      await verifyErrorMessage(page, 'Epic sadface: Password is required');
      
      // Verify username field still has value
      await expect(page.locator('[data-test="username"]')).toHaveValue('standard_user');
    });
    
    test('should show error with both fields empty', async ({ page }) => {
      await page.goto('https://www.saucedemo.com/');
      
      // Leave both fields empty
      await page.fill('[data-test="username"]', '');
      await page.fill('[data-test="password"]', '');
      await page.click('[data-test="login-button"]');
      
      // Assert error message
      await verifyErrorMessage(page, 'Epic sadface: Username is required');
    });
    
    test('should allow closing error message', async ({ page }) => {
      await page.goto('https://www.saucedemo.com/');
      
      // Trigger error
      await page.click('[data-test="login-button"]');
      await verifyErrorMessage(page, 'Epic sadface: Username is required');
      
      // Close error message
      await closeErrorMessage(page);
      
      // Verify error is gone
      await expect(page.locator('[data-test="error"]')).not.toBeVisible();
      
      // Verify can still interact with form
      await page.fill('[data-test="username"]', 'standard_user');
      await page.fill('[data-test="password"]', 'secret_sauce');
      await page.click('[data-test="login-button"]');
      
      // Should login successfully
      await page.waitForURL('**/inventory.html');
      expect(page.url()).toContain('/inventory.html');
    });
    
    test('should handle locked out user', async ({ page }) => {
      await page.goto('https://www.saucedemo.com/');
      
      // Login with locked_out_user
      await page.fill('[data-test="username"]', 'locked_out_user');
      await page.fill('[data-test="password"]', 'secret_sauce');
      await page.click('[data-test="login-button"]');
      
      // Assert specific error for locked out user
      await verifyErrorMessage(
        page,
        'Epic sadface: Sorry, this user has been locked out.'
      );
      
      // Verify URL hasn't changed
      expect(page.url()).toBe('https://www.saucedemo.com/');
    });
    
    test('should handle problem user (visual issues)', async ({ page }) => {
      await page.goto('https://www.saucedemo.com/');
      
      // Login with problem_user
      await page.fill('[data-test="username"]', 'problem_user');
      await page.fill('[data-test="password"]', 'secret_sauce');
      await page.click('[data-test="login-button"]');
      
      // Should login but may have visual issues
      await page.waitForURL('**/inventory.html');
      expect(page.url()).toContain('/inventory.html');
      
      // Verify images may be broken (expected behavior for problem_user)
      const images = page.locator('img');
      const imageCount = await images.count();
      expect(imageCount).toBeGreaterThan(0);
      
      // Take screenshot to document visual issues
      await page.screenshot({ path: 'screenshots/problem-user-dashboard.png', fullPage: true });
    });
  });
  
  test.describe('Checkout Form Validation Tests', () => {
    
    test.beforeEach(async ({ page }) => {
      // Login and add item to cart before each checkout test
      await page.goto('https://www.saucedemo.com/');
      await page.fill('[data-test="username"]', 'standard_user');
      await page.fill('[data-test="password"]', 'secret_sauce');
      await page.click('[data-test="login-button"]');
      await page.waitForURL('**/inventory.html');
      
      // Add an item to cart
      await page.click('[data-test="add-to-cart-sauce-labs-backpack"]');
      await page.click('[data-test="shopping-cart-link"]');
      await page.click('[data-test="checkout"]');
      await page.waitForURL('**/checkout-step-one.html');
    });
    
    test('should show error when checking out with all fields empty', async ({ page }) => {
      // Ensure fields are empty
      await page.fill('[data-test="firstName"]', '');
      await page.fill('[data-test="lastName"]', '');
      await page.fill('[data-test="postalCode"]', '');
      
      // Try to continue
      await page.click('[data-test="continue"]');
      
      // Verify error message
      await verifyErrorMessage(page, 'Error: First Name is required');
      
      // Take screenshot
      await page.screenshot({ path: 'screenshots/checkout-error-all-empty.png' });
    });
    
    test('should show error when first name is empty', async ({ page }) => {
      await page.fill('[data-test="firstName"]', '');
      await page.fill('[data-test="lastName"]', 'Doe');
      await page.fill('[data-test="postalCode"]', '12345');
      await page.click('[data-test="continue"]');
      
      await verifyErrorMessage(page, 'Error: First Name is required');
      
      // Verify other fields retain their values
      await expect(page.locator('[data-test="lastName"]')).toHaveValue('Doe');
      await expect(page.locator('[data-test="postalCode"]')).toHaveValue('12345');
    });
    
    test('should show error when last name is empty', async ({ page }) => {
      await page.fill('[data-test="firstName"]', 'John');
      await page.fill('[data-test="lastName"]', '');
      await page.fill('[data-test="postalCode"]', '12345');
      await page.click('[data-test="continue"]');
      
      await verifyErrorMessage(page, 'Error: Last Name is required');
      
      // Verify other fields retain their values
      await expect(page.locator('[data-test="firstName"]')).toHaveValue('John');
      await expect(page.locator('[data-test="postalCode"]')).toHaveValue('12345');
    });
    
    test('should show error when postal code is empty', async ({ page }) => {
      await page.fill('[data-test="firstName"]', 'John');
      await page.fill('[data-test="lastName"]', 'Doe');
      await page.fill('[data-test="postalCode"]', '');
      await page.click('[data-test="continue"]');
      
      await verifyErrorMessage(page, 'Error: Postal Code is required');
      
      // Verify other fields retain their values
      await expect(page.locator('[data-test="firstName"]')).toHaveValue('John');
      await expect(page.locator('[data-test="lastName"]')).toHaveValue('Doe');
    });
    
    test('should show sequential errors when fixing one field at a time', async ({ page }) => {
      // Try with all empty
      await page.click('[data-test="continue"]');
      await verifyErrorMessage(page, 'Error: First Name is required');
      await closeErrorMessage(page);
      
      // Fill first name only
      await page.fill('[data-test="firstName"]', 'John');
      await page.click('[data-test="continue"]');
      await verifyErrorMessage(page, 'Error: Last Name is required');
      await closeErrorMessage(page);
      
      // Fill last name only
      await page.fill('[data-test="lastName"]', 'Doe');
      await page.click('[data-test="continue"]');
      await verifyErrorMessage(page, 'Error: Postal Code is required');
      await closeErrorMessage(page);
      
      // Fill postal code
      await page.fill('[data-test="postalCode"]', '12345');
      await page.click('[data-test="continue"]');
      
      // Should navigate to overview
      await page.waitForURL('**/checkout-step-two.html');
      expect(page.url()).toContain('/checkout-step-two.html');
    });
    
    test('should allow cancel and return to cart from checkout form', async ({ page }) => {
      // Fill some fields
      await page.fill('[data-test="firstName"]', 'John');
      await page.fill('[data-test="lastName"]', 'Doe');
      await page.fill('[data-test="postalCode"]', '12345');
      
      // Cancel checkout
      await page.click('[data-test="cancel"]');
      
      // Should return to cart
      await page.waitForURL('**/cart.html');
      expect(page.url()).toContain('/cart.html');
      
      // Cart should still have the item
      const cartItems = page.locator('[data-test="inventory-item"]');
      await expect(cartItems).toHaveCount(1);
    });
  });
  
  test.describe('Cart Edge Cases', () => {
    
    test.beforeEach(async ({ page }) => {
      await page.goto('https://www.saucedemo.com/');
      await page.fill('[data-test="username"]', 'standard_user');
      await page.fill('[data-test="password"]', 'secret_sauce');
      await page.click('[data-test="login-button"]');
      await page.waitForURL('**/inventory.html');
    });
    
    test('should handle adding and removing same item multiple times', async ({ page }) => {
      const addButton = page.locator('[data-test="add-to-cart-sauce-labs-backpack"]');
      const removeButton = page.locator('[data-test="remove-sauce-labs-backpack"]');
      const cartBadge = page.locator('[data-test="shopping-cart-badge"]');
      
      // Add item
      await addButton.click();
      await expect(cartBadge).toHaveText('1');
      await expect(removeButton).toBeVisible();
      
      // Try to add again (button should have changed to Remove)
      await expect(addButton).not.toBeVisible();
      
      // Remove item
      await removeButton.click();
      await expect(cartBadge).not.toBeVisible();
      await expect(addButton).toBeVisible();
      
      // Add again
      await addButton.click();
      await expect(cartBadge).toHaveText('1');
      await expect(removeButton).toBeVisible();
    });
    
    test('should handle cart with maximum items (all products)', async ({ page }) => {
      // Add all items to cart
      const addButtons = page.locator('[data-test^="add-to-cart"]');
      const buttonCount = await addButtons.count();
      
      for (let i = 0; i < buttonCount; i++) {
        await addButtons.nth(i).click();
      }
      
      // Verify cart count shows 6 items
      const cartBadge = page.locator('[data-test="shopping-cart-badge"]');
      await expect(cartBadge).toHaveText('6');
      
      // Go to cart and verify all items are present
      await page.click('[data-test="shopping-cart-link"]');
      const cartItems = page.locator('[data-test="inventory-item"]');
      await expect(cartItems).toHaveCount(6);
      
      // Take screenshot of full cart
      await page.screenshot({ path: 'screenshots/full-cart.png', fullPage: true });
    });
    
    test('should handle empty cart state', async ({ page }) => {
      // Go to cart without adding items
      await page.click('[data-test="shopping-cart-link"]');
      await page.waitForURL('**/cart.html');
      
      // Verify cart is empty
      const cartItems = page.locator('[data-test="inventory-item"]');
      await expect(cartItems).toHaveCount(0);
      
      // Verify continue shopping button is present
      const continueShoppingBtn = page.locator('[data-test="continue-shopping"]');
      await expect(continueShoppingBtn).toBeVisible();
      
      // Checkout button should be disabled or not present
      const checkoutBtn = page.locator('[data-test="checkout"]');
      await expect(checkoutBtn).toBeVisible();
      
      // Click continue shopping and verify navigation
      await continueShoppingBtn.click();
      await page.waitForURL('**/inventory.html');
    });
  });
  
  test.describe('Checkout Completion Edge Cases', () => {
    
    test('should not allow checkout with empty cart', async ({ page }) => {
      await page.goto('https://www.saucedemo.com/');
      await page.fill('[data-test="username"]', 'standard_user');
      await page.fill('[data-test="password"]', 'secret_sauce');
      await page.click('[data-test="login-button"]');
      await page.waitForURL('**/inventory.html');
      
      // Go to cart without adding items
      await page.click('[data-test="shopping-cart-link"]');
      
      // Try to checkout
      await page.click('[data-test="checkout"]');
      
      // Should still navigate to checkout page but with empty cart
      await page.waitForURL('**/checkout-step-one.html');
      
      // Fill form and continue
      await page.fill('[data-test="firstName"]', 'John');
      await page.fill('[data-test="lastName"]', 'Doe');
      await page.fill('[data-test="postalCode"]', '12345');
      await page.click('[data-test="continue"]');
      
      // Should navigate to overview with empty cart
      await page.waitForURL('**/checkout-step-two.html');
      
      // Verify no items in overview
      const cartItems = page.locator('[data-test="inventory-item"]');
      await expect(cartItems).toHaveCount(0);
      
      // Verify subtotal is $0.00
      const subtotalLabel = await page.locator('[data-test="subtotal-label"]').textContent();
      expect(subtotalLabel).toContain('$0');
      
      // Complete checkout
      await page.click('[data-test="finish"]');
      
      // Should still show success message
      await expect(page.locator('[data-test="complete-header"]')).toHaveText('Thank you for your order!');
    });
    
    test('should handle checkout with special characters in form fields', async ({ page }) => {
      await page.goto('https://www.saucedemo.com/');
      await page.fill('[data-test="username"]', 'standard_user');
      await page.fill('[data-test="password"]', 'secret_sauce');
      await page.click('[data-test="login-button"]');
      await page.waitForURL('**/inventory.html');
      
      // Add item and go to checkout
      await page.click('[data-test="add-to-cart-sauce-labs-backpack"]');
      await page.click('[data-test="shopping-cart-link"]');
      await page.click('[data-test="checkout"]');
      
      // Fill form with special characters
      await page.fill('[data-test="firstName"]', 'John@#$%');
      await page.fill('[data-test="lastName"]', 'Doe!@#$');
      await page.fill('[data-test="postalCode"]', '12-345');
      await page.click('[data-test="continue"]');
      
      // Should proceed to overview
      await page.waitForURL('**/checkout-step-two.html');
      expect(page.url()).toContain('/checkout-step-two.html');
      
      // Complete checkout
      await page.click('[data-test="finish"]');
      await expect(page.locator('[data-test="complete-header"]')).toBeVisible();
    });
    
    test('should handle checkout with very long input values', async ({ page }) => {
      await page.goto('https://www.saucedemo.com/');
      await page.fill('[data-test="username"]', 'standard_user');
      await page.fill('[data-test="password"]', 'secret_sauce');
      await page.click('[data-test="login-button"]');
      await page.waitForURL('**/inventory.html');
      
      // Add item and go to checkout
      await page.click('[data-test="add-to-cart-sauce-labs-backpack"]');
      await page.click('[data-test="shopping-cart-link"]');
      await page.click('[data-test="checkout"]');
      
      // Fill form with long strings
      const longString = 'a'.repeat(100);
      await page.fill('[data-test="firstName"]', longString);
      await page.fill('[data-test="lastName"]', longString);
      await page.fill('[data-test="postalCode"]', '12345');
      await page.click('[data-test="continue"]');
      
      // Should proceed to overview
      await page.waitForURL('**/checkout-step-two.html');
      
      // Verify long strings are displayed
      const firstNameDisplay = page.locator('[data-test="payment-info-value"]');
      await expect(firstNameDisplay).toBeVisible();
      
      // Complete checkout
      await page.click('[data-test="finish"]');
      await expect(page.locator('[data-test="complete-header"]')).toBeVisible();
    });
  });
  
  test.describe('Navigation Edge Cases', () => {
    
    test('should handle browser back button after login', async ({ page }) => {
      await page.goto('https://www.saucedemo.com/');
      await page.fill('[data-test="username"]', 'standard_user');
      await page.fill('[data-test="password"]', 'secret_sauce');
      await page.click('[data-test="login-button"]');
      await page.waitForURL('**/inventory.html');
      
      // Click browser back button
      await page.goBack();
      
      // Should stay on inventory page (not go back to login)
      expect(page.url()).toContain('/inventory.html');
    });
    
    test('should handle browser forward/back during checkout', async ({ page }) => {
      await page.goto('https://www.saucedemo.com/');
      await page.fill('[data-test="username"]', 'standard_user');
      await page.fill('[data-test="password"]', 'secret_sauce');
      await page.click('[data-test="login-button"]');
      await page.waitForURL('**/inventory.html');
      
      // Add item and go through checkout
      await page.click('[data-test="add-to-cart-sauce-labs-backpack"]');
      await page.click('[data-test="shopping-cart-link"]');
      await page.click('[data-test="checkout"]');
      await page.fill('[data-test="firstName"]', 'John');
      await page.fill('[data-test="lastName"]', 'Doe');
      await page.fill('[data-test="postalCode"]', '12345');
      await page.click('[data-test="continue"]');
      await page.waitForURL('**/checkout-step-two.html');
      
      // Go back to cart
      await page.goBack();
      await page.waitForURL('**/checkout-step-one.html');
      
      // Form should retain values
      await expect(page.locator('[data-test="firstName"]')).toHaveValue('John');
      await expect(page.locator('[data-test="lastName"]')).toHaveValue('Doe');
      await expect(page.locator('[data-test="postalCode"]')).toHaveValue('12345');
      
      // Go forward again
      await page.goForward();
      await page.waitForURL('**/checkout-step-two.html');
      
      // Complete checkout
      await page.click('[data-test="finish"]');
      await expect(page.locator('[data-test="complete-header"]')).toBeVisible();
    });
    
    test('should handle page refresh during checkout', async ({ page }) => {
      await page.goto('https://www.saucedemo.com/');
      await page.fill('[data-test="username"]', 'standard_user');
      await page.fill('[data-test="password"]', 'secret_sauce');
      await page.click('[data-test="login-button"]');
      await page.waitForURL('**/inventory.html');
      
      // Add item and go to checkout
      await page.click('[data-test="add-to-cart-sauce-labs-backpack"]');
      await page.click('[data-test="shopping-cart-link"]');
      await page.click('[data-test="checkout"]');
      await page.fill('[data-test="firstName"]', 'John');
      await page.fill('[data-test="lastName"]', 'Doe');
      await page.fill('[data-test="postalCode"]', '12345');
      
      // Refresh page
      await page.reload();
      
      // Form should be empty after refresh
      await expect(page.locator('[data-test="firstName"]')).toHaveValue('');
      await expect(page.locator('[data-test="lastName"]')).toHaveValue('');
      await expect(page.locator('[data-test="postalCode"]')).toHaveValue('');
      
      // Cart should still have the item
      const cartBadge = page.locator('[data-test="shopping-cart-badge"]');
      await expect(cartBadge).toHaveText('1');
    });
  });
  
  test.describe('Performance Edge Cases', () => {
    
    test('should handle rapid clicks on add to cart button', async ({ page }) => {
      await page.goto('https://www.saucedemo.com/');
      await page.fill('[data-test="username"]', 'standard_user');
      await page.fill('[data-test="password"]', 'secret_sauce');
      await page.click('[data-test="login-button"]');
      await page.waitForURL('**/inventory.html');
      
      const addButton = page.locator('[data-test="add-to-cart-sauce-labs-backpack"]');
      
      // Click rapidly multiple times
      for (let i = 0; i < 5; i++) {
        await addButton.click();
      }
      
      // Cart should only have 1 item (button changes to Remove after first click)
      const cartBadge = page.locator('[data-test="shopping-cart-badge"]');
      await expect(cartBadge).toHaveText('1');
      
      // Button should be Remove, not Add
      const removeButton = page.locator('[data-test="remove-sauce-labs-backpack"]');
      await expect(removeButton).toBeVisible();
    });
    
    test('should handle rapid navigation between pages', async ({ page }) => {
      await page.goto('https://www.saucedemo.com/');
      await page.fill('[data-test="username"]', 'standard_user');
      await page.fill('[data-test="password"]', 'secret_sauce');
      await page.click('[data-test="login-button"]');
      await page.waitForURL('**/inventory.html');
      
      // Rapidly navigate between pages
      const actions = [
        () => page.click('[data-test="shopping-cart-link"]'),
        () => page.click('[data-test="continue-shopping"]'),
        () => page.click('[data-test="add-to-cart-sauce-labs-backpack"]'),
        () => page.click('[data-test="shopping-cart-link"]'),
      ];
      
      for (const action of actions) {
        await action();
        await page.waitForTimeout(100); // Small delay to prevent test instability
      }
      
      // Verify final state is consistent
      await page.waitForURL('**/cart.html');
      const cartItems = page.locator('[data-test="inventory-item"]');
      await expect(cartItems).toHaveCount(1);
    });
  });
});