const { test, expect } = require('@playwright/test');

test.describe('Register page', () => {
  test('loads register page and shows form fields', async ({ page }) => {
    await page.goto('/register');

    await expect(page).toHaveTitle(/Register/);
    await expect(page.locator('h1')).toHaveText('Register');
    await expect(page.locator('#username')).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('#registerButton')).toHaveText('Register');
  });

  test('shows validation message when register form is submitted empty', async ({ page }) => {
    await page.goto('/register');
    await page.evaluate(() => document.querySelector('#registerForm').noValidate = true);
    await page.click('#registerButton');

    await expect(page.locator('#registerStatus')).toHaveText('Vul alle velden in.');
  });

  test('navigates to login page from register page', async ({ page }) => {
    await page.goto('/register');
    await page.click('text=Login here');

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.locator('h1')).toHaveText('Login');
  });
});
