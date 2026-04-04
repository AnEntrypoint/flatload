import { findGlobal } from '../store/index.js'

export const getHeader = () => findGlobal({ slug: 'header' })
export const getFooter = () => findGlobal({ slug: 'footer' })
