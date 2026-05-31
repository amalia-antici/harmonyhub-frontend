import { test, expect } from '@playwright/test';

// ==========================================
// REGISTER TESTS
// ==========================================

test.describe('Register Page', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/signup');
  });

  test('renders all required fields', async ({ page }) => {
    await expect(page.locator('input[name="firstName"]')).toBeVisible();
    await expect(page.locator('input[name="lastName"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('select[name="securityQuestion"]')).toBeVisible();
    await expect(page.locator('input[name="securityAnswer"]')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Join us' })).toBeVisible();
  });

  test('security question is required by browser validation', async ({ page }) => {
    await page.locator('input[name="firstName"]').fill('Test');
    await page.locator('input[name="lastName"]').fill('User');
    await page.locator('input[name="email"]').fill('test@example.com');
    await page.locator('input[name="username"]').fill('testuser');
    await page.locator('input[name="password"]').fill('password123');

    await page.getByRole('button', { name: 'Join us' }).click();

    const isInvalid = await page.locator('select[name="securityQuestion"]').evaluate(
      el => !el.validity.valid
    );
    expect(isInvalid).toBe(true);
  });

  test('security answer is required by browser validation', async ({ page }) => {
    await page.locator('input[name="firstName"]').fill('Test');
    await page.locator('input[name="lastName"]').fill('User');
    await page.locator('input[name="email"]').fill('test@example.com');
    await page.locator('input[name="username"]').fill('testuser');
    await page.locator('input[name="password"]').fill('password123');
    await page.locator('select[name="securityQuestion"]').selectOption('What was the name of your first pet?');

    await page.getByRole('button', { name: 'Join us' }).click();

    const isInvalid = await page.locator('input[name="securityAnswer"]').evaluate(
      el => !el.validity.valid
    );
    expect(isInvalid).toBe(true);
  });

  test('successful registration redirects to login', async ({ page }) => {
    await page.route('/api/auth/register', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/plain',
        body: 'User registered successfully',
      });
    });

    await page.locator('input[name="firstName"]').fill('Test');
    await page.locator('input[name="lastName"]').fill('User');
    await page.locator('input[name="email"]').fill('test@example.com');
    await page.locator('input[name="username"]').fill('testuser');
    await page.locator('input[name="password"]').fill('password123');
    await page.locator('select[name="securityQuestion"]').selectOption('What was the name of your first pet?');
    await page.locator('input[name="securityAnswer"]').fill('fluffy');

    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toBe('Registration successful! Please log in.');
      await dialog.accept();
    });

    await page.getByRole('button', { name: 'Join us' }).click();
    await expect(page).toHaveURL('/login');
  });

  test('security answer input has lowercase style', async ({ page }) => {
    await expect(page.locator('input[name="securityAnswer"]')).toHaveCSS('text-transform', 'lowercase');
  });

  test('security question dropdown shows all options', async ({ page }) => {
    const select = page.locator('select[name="securityQuestion"]');
    await expect(select.locator('option')).toHaveCount(7);
  });
});

// ==========================================
// LOGIN TESTS - STEP 1
// ==========================================

test.describe('Login Page - Step 1 (Credentials)', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('renders step 1 form correctly', async ({ page }) => {
    await expect(page.getByLabel('Username')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue →' })).toBeVisible();
    await expect(page.getByText('Credentials')).toBeVisible();
    await expect(page.getByText('Email Verify')).toBeVisible();
    await expect(page.getByText('Security')).toBeVisible();
  });

  test('advances to step 2 on valid credentials', async ({ page }) => {
    await page.route('/api/auth/login/step1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ token: 'partial-token-step1', nextStep: 'MFA_CODE_PROMPT' }),
      });
    });

    await page.getByLabel('Username').fill('testuser');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Continue →' }).click();

    await expect(page.getByText('A 6-digit verification code has been sent to your email address.')).toBeVisible();
    await expect(page.getByLabel('Verification Code')).toBeVisible();
  });

  test('forgot password link navigates correctly', async ({ page }) => {
    await page.getByRole('link', { name: 'Forgot password?' }).click();
    await expect(page).toHaveURL('/forgot-password');
  });

  test('sign up link navigates to register page', async ({ page }) => {
    await page.getByRole('link', { name: 'Sign Up' }).click();
    await expect(page).toHaveURL('/signup');
  });
});

// ==========================================
// LOGIN TESTS - STEP 2
// ==========================================

test.describe('Login Page - Step 2 (Email OTP)', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.route('/api/auth/login/step1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ token: 'partial-token-step1', nextStep: 'MFA_CODE_PROMPT' }),
      });
    });
    await page.getByLabel('Username').fill('testuser');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Continue →' }).click();
    await expect(page.getByLabel('Verification Code')).toBeVisible();
  });

  test('OTP input only accepts digits', async ({ page }) => {
    const otpInput = page.getByLabel('Verification Code');
    await otpInput.fill('abc123def');
    await expect(otpInput).toHaveValue('123');
  });

  test('verify button is disabled until 6 digits are entered', async ({ page }) => {
    const btn = page.getByRole('button', { name: 'Verify Code →' });
    await expect(btn).toBeDisabled();

    await page.getByLabel('Verification Code').fill('12345');
    await expect(btn).toBeDisabled();

    await page.getByLabel('Verification Code').fill('123456');
    await expect(btn).toBeEnabled();
  });

  test('advances to step 3 on correct OTP', async ({ page }) => {
    await page.route('/api/auth/login/step2', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'partial-token-step2',
          nextStep: 'SECURITY_QUESTION_PROMPT',
          question: 'What was the name of your first pet?'
        }),
      });
    });

    await page.getByLabel('Verification Code').fill('123456');
    await page.getByRole('button', { name: 'Verify Code →' }).click();

    await expect(page.getByText('What was the name of your first pet?')).toBeVisible();
    await expect(page.getByLabel('Your Answer')).toBeVisible();
  });

  test('back button returns to step 1', async ({ page }) => {
    await page.getByRole('button', { name: '← Back' }).click();
    await expect(page.getByLabel('Username')).toBeVisible();
  });
});

// ==========================================
// LOGIN TESTS - STEP 3
// ==========================================

test.describe('Login Page - Step 3 (Security Question)', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');

    await page.route('/api/auth/login/step1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ token: 'partial-token-step1', nextStep: 'MFA_CODE_PROMPT' }),
      });
    });

    await page.route('/api/auth/login/step2', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'partial-token-step2',
          nextStep: 'SECURITY_QUESTION_PROMPT',
          question: 'What was the name of your first pet?'
        }),
      });
    });

    await page.getByLabel('Username').fill('testuser');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Continue →' }).click();
    await page.getByLabel('Verification Code').fill('123456');
    await page.getByRole('button', { name: 'Verify Code →' }).click();
    await expect(page.getByText('What was the name of your first pet?')).toBeVisible();
  });

  test('displays the security question from backend', async ({ page }) => {
    await expect(page.getByText('What was the name of your first pet?')).toBeVisible();
  });

  test('successful login saves session and redirects to events', async ({ page }) => {
    await page.route('/api/auth/login/step3', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'final-jwt-token',
          username: 'testuser',
          roles: ['ROLE_USER'],
          id: 1
        }),
      });
    });

    await page.route('/api/events*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.getByLabel('Your Answer').fill('fluffy');
    await page.getByRole('button', { name: 'Sign In ✓' }).click();

    await expect(page).toHaveURL('/events');

    const token = await page.evaluate(() => localStorage.getItem('harmonyhub-token'));
    expect(token).toBe('final-jwt-token');
  });

  test('answer input has lowercase transform style', async ({ page }) => {
    await expect(page.getByLabel('Your Answer')).toHaveCSS('text-transform', 'lowercase');
  });

  test('back button returns to step 2', async ({ page }) => {
    await page.getByRole('button', { name: '← Back' }).click();
    await expect(page.getByLabel('Verification Code')).toBeVisible();
  });

  test('step indicator shows steps 1 and 2 as completed', async ({ page }) => {
    const stepCircles = page.locator('div').filter({ hasText: /^✓$/ });
    await expect(stepCircles).toHaveCount(2);
  });
});