const API_BASE = process.env.E2E_API_URL || 'http://localhost:5000';

const randomEmail = (prefix) =>
  `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}@example.com`;

async function createBackendUser(role = 'CUSTOMER') {
  const email = randomEmail(`detox-customer-${role.toLowerCase()}`);
  const password = '123456';
  const payload = {
    name: 'Detox QA Customer',
    email,
    password,
    role,
    phone: '11999999999',
  };

  const response = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to create backend user (${response.status}): ${body}`);
  }

  return { email, password };
}

async function waitForLoginScreen() {
  await waitFor(element(by.id('customer-auth-login-screen')))
    .toBeVisible()
    .withTimeout(25000);
}

async function expectAuthenticatedState() {
  try {
    await waitFor(element(by.id('customer-home-screen')))
      .toBeVisible()
      .withTimeout(20000);
    return;
  } catch (_) {
    await waitFor(element(by.id('customer-auth-login-screen')))
      .toBeNotVisible()
      .withTimeout(10000);
  }
}

describe('Customer auth QA', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    await waitForLoginScreen();
  });

  it('keeps user on login when credentials are invalid', async () => {
    await element(by.id('customer-auth-email-input')).replaceText(randomEmail('invalid-login'));
    await element(by.id('customer-auth-password-input')).replaceText('123456');
    await element(by.id('customer-auth-login-button')).tap();

    await waitFor(element(by.id('customer-auth-login-screen')))
      .toBeVisible()
      .withTimeout(8000);
  });

  it('logs in successfully with a valid backend user', async () => {
    const { email, password } = await createBackendUser('CUSTOMER');

    await element(by.id('customer-auth-email-input')).replaceText(email);
    await element(by.id('customer-auth-password-input')).replaceText(password);
    await element(by.id('customer-auth-login-button')).tap();

    await expectAuthenticatedState();
  });

  it('registers a new customer account successfully', async () => {
    const email = randomEmail('customer-register');
    const password = '123456';

    await element(by.id('customer-auth-go-register-button')).tap();

    await waitFor(element(by.id('customer-auth-register-screen')))
      .toBeVisible()
      .withTimeout(8000);

    await element(by.id('customer-auth-register-name-input')).replaceText('QA Customer Register');
    await element(by.id('customer-auth-register-email-input')).replaceText(email);
    await element(by.id('customer-auth-register-phone-input')).replaceText('11988887777');
    await element(by.id('customer-auth-register-password-input')).replaceText(password);
    await element(by.id('customer-auth-register-confirm-password-input')).replaceText(password);
    await element(by.id('customer-auth-register-submit-button')).tap();

    await expectAuthenticatedState();
  });
});
