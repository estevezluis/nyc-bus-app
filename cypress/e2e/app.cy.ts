describe('Visit App', () => {
  it('passes', () => {
    cy.visit('http://localhost:3000')
    cy.get('input#search').should('exist')
    cy.get('div#map').should('exist')

  })
})