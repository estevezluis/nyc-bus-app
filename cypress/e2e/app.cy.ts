const MAPBOX_ACCESS_TOKEN = Cypress.env('MAPBOX_ACCESS_TOKEN')
const API_ENDPOINT = Cypress.env('API_ENDPOINT')
const API_KEY = Cypress.env('API_KEY')

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

    cy.intercept('GET', `/api/autocomplete?term=${busRoute.id}`).as('autocomplete')
    cy.intercept('GET', `/api/vehicle-monitoring?${params.toString()}`).as('fetchData')

    // autocomplete test
    cy.get('input#search').type(busRoute.id)
    cy.wait('@autocomplete', { timeout: 10 * 1000 })
    cy.contains('li', busRoute.id).should('exist')
    cy.contains('li', busRoute.id).click()

    // list route
    cy.contains('h3', busRoute.longName).should('exist')

    cy.wait('@fetchData', { timeout: 10 * 1000 })

    // reset map
    cy.get('div[data-page="search"] button').click()
    cy.contains('h3', busRoute.longName).should('not.exist')
  })
})