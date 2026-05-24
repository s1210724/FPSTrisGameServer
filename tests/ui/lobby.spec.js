const { test, expect } = require('@playwright/test');

test.describe('Lobby page', () => {
  test('loads lobby page and shows lobby elements', async ({ page }) => {
    await page.goto('/lobby');

    await expect(page).toHaveTitle(/Lobby/);
    await expect(page.locator('#lobbyMessage')).toHaveText(/Welkom in de FPSTris Lobby/);
    await expect(page.locator('#playerList')).toBeVisible();
    await expect(page.locator('#leaveButton')).toHaveAttribute('href', '/');
  });

  test('starts session from lobby when two players join', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    await page1.goto('/lobby');
    await page2.goto('/lobby');

    await expect(page1).toHaveURL(/\/lobby$/);
    await expect(page2).toHaveURL(/\/lobby$/);

    await page1.evaluate(() => {
      if (window.migrateToSession) {
        window.migrateToSession();
      }
    });

    await Promise.all([
      page1.waitForURL(/\/game$/),
      page2.waitForURL(/\/game$/),
    ]);

    const sessionData1 = await page1.evaluate(() => localStorage.getItem('sessionData'));
    const sessionData2 = await page2.evaluate(() => localStorage.getItem('sessionData'));

    expect(sessionData1).not.toBeNull();
    expect(sessionData2).not.toBeNull();

    await context1.close();
    await context2.close();
  });
});
