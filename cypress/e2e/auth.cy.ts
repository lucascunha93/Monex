describe('Autenticacao', () => {
  it('redireciona para /login se nao autenticado', () => {
    cy.visit('/dashboard');
    cy.url().should('include', '/login');
  });

  it('exibe o formulario de login', () => {
    cy.visit('/login');
    cy.dataCy('login-email').should('be.visible');
    cy.dataCy('login-password').should('be.visible');
    cy.dataCy('login-submit').should('be.visible');
  });

  it('exibe erro com credenciais invalidas', () => {
    cy.visit('/login');
    cy.dataCy('login-email').type('errado@email.com');
    cy.dataCy('login-password').find('input').type('senhaerrada');
    cy.dataCy('login-submit').click();
    cy.dataCy('login-error').should('be.visible');
  });
});