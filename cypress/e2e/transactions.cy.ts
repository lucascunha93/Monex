describe('Transacoes', () => {
  const user = {
    id: 'user_cypress_test',
    name: 'Cypress',
    email: 'cypress@monex.com',
    passwordHash: 'irrelevant_for_session',
    createdAt: new Date().toISOString(),
  };

  const session = {
    userId: user.id,
    token: btoa(`${user.id}:seed`),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  };

  const visitWithAuth = (path: string) => {
    cy.visit(path, {
      onBeforeLoad(win) {
        win.localStorage.setItem('monex_users', JSON.stringify([user]));
        win.localStorage.setItem('monex_session', JSON.stringify(session));
      },
    });
  };

  before(() => {
    visitWithAuth('/transactions');
    cy.window().then((win: any) => win.monexSeed(1));
  });

  beforeEach(() => {
    visitWithAuth('/transactions');
    cy.get('[data-cy="tx-row"]').should('have.length.greaterThan', 0);
  });

  it('exibe a pagina de transacoes com titulo', () => {
    cy.contains('Transacoes').should('be.visible');
  });

  it('exibe o campo de entrada rapida', () => {
    cy.get('[data-cy="quick-input"]').should('be.visible');
  });

  it('limpa os filtros ao clicar em Limpar', () => {
    cy.get('[data-cy="filter-search"]').type('algo');
    cy.get('[data-cy="filter-clear-btn"]').click();
    cy.get('[data-cy="filter-search"]').should('have.value', '');
  });

  it('adiciona uma despesa pela entrada rapida', () => {
    const desc = `farmacia-cy-${Date.now()}`;
    cy.get('[data-cy="quick-input"]').type(`50 ${desc}`);
    cy.get('[data-cy="quick-add-btn"]').click();
    cy.contains(desc).should('be.visible');
  });

  it('exclui uma transacao', () => {
    const desc = `excluir-cy-${Date.now()}`;
    cy.get('[data-cy="quick-input"]').type(`100 ${desc}`);
    cy.get('[data-cy="quick-add-btn"]').click();
    cy.contains(desc).should('be.visible');
    cy.contains('[data-cy="tx-row"]', desc)
      .find('[data-cy="tx-delete-btn"]')
      .click();
    cy.contains(desc).should('not.exist');
  });
});