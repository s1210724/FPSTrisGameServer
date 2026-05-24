const { test, expect } = require('@playwright/test');

test.describe('Login page', () => {
  test('loads login page and shows form fields', async ({ page }) => {
    await page.goto('/login');

    await expect(page).toHaveTitle(/Login/);
    await expect(page.locator('h1')).toHaveText('Login');
    await expect(page.locator('#username')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('#loginButton')).toHaveText('Login');
  });

  test('shows validation message when login fields are empty', async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => document.querySelector('#loginForm').noValidate = true);
    await page.click('#loginButton');

    await expect(page.locator('#loginStatus')).toHaveText('Vul beide velden in.');
  });

  test('navigates to register page from login page', async ({ page }) => {
    await page.goto('/login');
    await page.click('text=Register here');

    await expect(page).toHaveURL(/\/register$/);
    await expect(page.locator('h1')).toHaveText('Register');
  });
});
