describe('Customer app smoke', () => {
  beforeEach(async () => {
    await device.launchApp({ delete: true, newInstance: true });
  });

  it('shows splash screen or reaches login quickly', async () => {
    try {
      await waitFor(element(by.id('customer-splash-title')))
        .toBeVisible()
        .withTimeout(5000);
    } catch (_) {
      await waitFor(element(by.id('customer-auth-login-screen')))
        .toBeVisible()
        .withTimeout(20000);
    }
  });

  it('opens login screen after splash', async () => {
    await waitFor(element(by.id('customer-auth-login-screen')))
      .toBeVisible()
      .withTimeout(20000);

    await expect(element(by.id('customer-auth-email-input'))).toBeVisible();
    await expect(element(by.id('customer-auth-password-input'))).toBeVisible();
    await expect(element(by.id('customer-auth-login-button'))).toBeVisible();
  });
});
