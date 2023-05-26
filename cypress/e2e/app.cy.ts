describe('Search for Bus', () => {
  it('passes', () => {
    const busRoute = {
      id: 'B38',
      longName: 'B38 Ridgewood - Downtown Brooklyn'
    }
    cy.visit('http://localhost:3000')
    cy.wait(60 * 1000) // wait for mapbox load event
    cy.get('input#search').should('exist')
    cy.get('canvas.mapboxgl-canvas').should('exist')

    cy.get('input#search').type(busRoute.id)
    cy.contains('li', busRoute.id).should('exist');

    cy.contains('li', busRoute.id).click()
    cy.contains('h3', busRoute.longName).should('exist')
  })
})