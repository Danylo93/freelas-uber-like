describe('Provider app smoke', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
  });

  it('shows splash screen or reaches welcome quickly', async () => {
    try {
      await waitFor(element(by.id('provider-splash-title')))
        .toBeVisible()
        .withTimeout(5000);
    } catch (_) {
      await waitFor(element(by.id('provider-auth-welcome-screen')))
        .toBeVisible()
        .withTimeout(20000);
    }
  });

  it('opens welcome screen after splash', async () => {
    await waitFor(element(by.id('provider-auth-welcome-screen')))
      .toBeVisible()
      .withTimeout(20000);

    await expect(element(by.id('provider-auth-go-login-button'))).toBeVisible();
  });

  it('opens login screen from welcome screen', async () => {
    await waitFor(element(by.id('provider-auth-go-login-button')))
      .toBeVisible()
      .withTimeout(20000);

    await element(by.id('provider-auth-go-login-button')).tap();

    await waitFor(element(by.id('provider-auth-login-screen')))
      .toBeVisible()
      .withTimeout(10000);

    await expect(element(by.id('provider-auth-email-input'))).toBeVisible();
    await expect(element(by.id('provider-auth-password-input'))).toBeVisible();
    await expect(element(by.id('provider-auth-login-button'))).toBeVisible();
  });
});
