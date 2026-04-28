Cypress.Commands.add('dataCy', (value: string) => {
  return cy.get(`[data-cy="${value}"]`);
});

Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/login');
  cy.dataCy('login-email').type(email);
  cy.dataCy('login-password').find('input').type(password);
  cy.dataCy('login-submit').click();
  cy.url().should('include', '/dashboard');
});

Cypress.Commands.add('seedAuth', () => {
  const user = {
    id: 'user_cypress_test',
    name: 'Cypress',
    email: 'cypress@monex.com',
    passwordHash: 'irrelevant_for_session',
    createdAt: new Date().toISOString(),
  };
  const session = {
    userId: user.id,
    token: btoa(`${user.id}:${Date.now()}`),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  };
  cy.window().then((win) => {
    win.localStorage.setItem('monex_users', JSON.stringify([user]));
    win.localStorage.setItem('monex_session', JSON.stringify(session));
  });
});

declare global {
  namespace Cypress {
    interface Chainable {
      dataCy(value: string): Chainable<JQuery<HTMLElement>>;
      login(email: string, password: string): Chainable<void>;
      seedAuth(): Chainable<void>;
    }
  }
}