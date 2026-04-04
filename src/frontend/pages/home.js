import { pagePage } from './page.js'

// Home page is just the page with slug 'home'
export const homePage = (req) => pagePage(req, { slug: 'home' })
