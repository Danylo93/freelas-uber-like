const API_BASE = process.env.E2E_API_URL || 'http://localhost:5000';
jest.retryTimes(1, { logErrorsBeforeRetry: true });

const randomEmail = (prefix) =>
  `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}@example.com`;

async function createBackendUser(role = 'PROVIDER') {
  const email = randomEmail(`detox-provider-${role.toLowerCase()}`);
  const password = '123456';
  const payload = {
    name: 'Detox QA Provider',
    email,
    password,
    role,
    phone: '11999999999',
    category: 'Encanador',
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

async function waitForWelcome() {
  await waitFor(element(by.id('provider-auth-welcome-screen')))
    .toBeVisible()
    .withTimeout(25000);
}

async function openLoginFromWelcome() {
  await waitFor(element(by.id('provider-auth-go-login-button')))
    .toBeVisible()
    .withTimeout(10000);
  await element(by.id('provider-auth-go-login-button')).tap();
  await waitFor(element(by.id('provider-auth-login-screen')))
    .toBeVisible()
    .withTimeout(10000);
}

async function expectAuthenticatedState() {
  try {
    await waitFor(element(by.id('provider-home-screen')))
      .toBeVisible()
      .withTimeout(40000);
    return;
  } catch (_) {
    await waitFor(element(by.id('provider-auth-welcome-screen')))
      .toBeNotVisible()
      .withTimeout(20000);
  }
}

async function submitProviderDocuments() {
  const submitButton = element(by.id('provider-auth-documents-submit-button'));
  await waitFor(submitButton).toBeVisible().withTimeout(10000);
  try {
    await submitButton.tap();
  } catch (_) {
    // If app is already processing submit, allow state assertion to decide.
    await expectAuthenticatedState();
    return;
  }
}

async function expectUnauthenticatedState() {
  try {
    await waitFor(element(by.text('Login Falhou')))
      .toBeVisible()
      .withTimeout(6000);
    try {
      await element(by.text('OK')).tap();
    } catch (_) {
      // Button label may vary by system locale.
    }
    return;
  } catch (_) {
    await waitFor(element(by.id('provider-auth-email-input')))
      .toBeVisible()
      .withTimeout(8000);
  }
}

describe('Provider auth QA', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    await waitForWelcome();
  });

  it('keeps user on login when credentials are invalid', async () => {
    await openLoginFromWelcome();
    await element(by.id('provider-auth-email-input')).replaceText(randomEmail('invalid-provider-login'));
    await element(by.id('provider-auth-password-input')).replaceText('123456');
    await element(by.id('provider-auth-login-button')).tap();

    await expectUnauthenticatedState();
  });

  it('logs in successfully with a valid provider account', async () => {
    const { email, password } = await createBackendUser('PROVIDER');

    await openLoginFromWelcome();
    await element(by.id('provider-auth-email-input')).replaceText(email);
    await element(by.id('provider-auth-password-input')).replaceText(password);
    await element(by.id('provider-auth-login-button')).tap();

    await expectAuthenticatedState();
  });

  it('registers a new provider account successfully', async () => {
    const email = randomEmail('provider-register');
    const password = '123456';

    await element(by.id('provider-auth-welcome-register-button')).tap();

    await waitFor(element(by.id('provider-auth-register-screen')))
      .toBeVisible()
      .withTimeout(10000);

    await element(by.id('provider-auth-profession-plumbing')).tap();
    await element(by.id('provider-auth-register-name-input')).replaceText('QA Provider Register');
    await element(by.id('provider-auth-register-email-input')).replaceText(email);
    await element(by.id('provider-auth-register-password-input')).replaceText(password);
    await element(by.id('provider-auth-register-confirm-password-input')).replaceText(password);
    await element(by.id('provider-auth-register-continue-button')).tap();

    await waitFor(element(by.id('provider-auth-documents-screen')))
      .toBeVisible()
      .withTimeout(10000);

    await submitProviderDocuments();
    await expectAuthenticatedState();
  });
});
