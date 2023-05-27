const MAPBOX_ACCESS_TOKEN = Cypress.env('MAPBOX_ACCESS_TOKEN')

describe('Search for Bus', () => {
  it('passes', () => {
    const busRoute = {
      id: 'B38',
      longName: 'B38 Ridgewood - Downtown Brooklyn'
    }
    cy.visit('http://localhost:3000')

    cy.intercept(
      'POST',
      `https://events.mapbox.com/events/v2?access_token=${MAPBOX_ACCESS_TOKEN}`
    ).as('mapboxLoad')

    cy.wait('@mapboxLoad', { timeout: 30 * 1000 })
    cy.get('input#search').should('exist')
    cy.get('canvas.mapboxgl-canvas').should('exist')

    const params = new URLSearchParams({ LineRef: `MTA NYCT_${busRoute.id}`})

    cy.intercept('GET', `/api/vehicle-monitoring?${params.toString()}`).as('fetchData')

    cy.get('input#search').type(busRoute.id)
    const suggestion = cy.contains('li', busRoute.id)
    suggestion.should('exist')

    suggestion.click()
    cy.contains('h3', busRoute.longName).should('exist')

    cy.wait('@fetchData', { timeout: 10 * 1000 })
    // interval in MapControl.tsx
    cy.wait('@fetchData', { timeout: 65 * 1000 })

    cy.get('div[data-page="search"] button').click()
    cy.contains('h3', busRoute.longName).should('not.exist')
  })
})