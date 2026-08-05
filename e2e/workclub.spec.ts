import { expect, test } from '@playwright/test';

const password = 'WorkClubDemo!2026';

async function login(page: import('@playwright/test').Page, email: string) {
  await page.goto('/login');
  await page.getByLabel('Work email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
}

test('Owner can access the operational workspace and audit trail', async ({ page }) => {
  await login(page, 'owner@workclub.demo');
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText('Northstar Studio')).toBeVisible();

  await page.getByRole('menuitem', { name: 'Projects' }).click();
  await expect(page.getByText('Atlas Digital Launch')).toBeVisible();

  await page.getByRole('menuitem', { name: 'Audit trail' }).click();
  await expect(page.getByRole('heading', { name: 'Audit trail' })).toBeVisible();
});

test('Member navigation is restricted to assigned delivery work', async ({ page }) => {
  await login(page, 'member@workclub.demo');
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole('menuitem', { name: 'Clients' })).toHaveCount(0);
  await expect(page.getByRole('menuitem', { name: 'Invoices' })).toHaveCount(0);

  await page.getByRole('menuitem', { name: 'Projects' }).click();
  await expect(page.getByText('Atlas Digital Launch')).toBeVisible();
  await expect(page.getByText('Lumen Discovery')).toHaveCount(0);
});

test('Client is isolated inside the lightweight portal', async ({ page }) => {
  await login(page, 'client@workclub.demo');
  await expect(page).toHaveURL(/\/portal$/);
  await expect(page.getByText('Atlas Digital Launch')).toBeVisible();
  await expect(page.getByText('NS-1001')).toBeVisible();
  await expect(page.getByText('Internal tasks')).toHaveCount(0);
});
