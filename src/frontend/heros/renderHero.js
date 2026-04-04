import { renderHighImpact } from './HighImpact.js'
import { renderMediumImpact } from './MediumImpact.js'
import { renderLowImpact } from './LowImpact.js'

export function renderHero(hero) {
  if (!hero || hero.type === 'none') return ''
  switch (hero.type) {
    case 'highImpact':   return renderHighImpact(hero)
    case 'mediumImpact': return renderMediumImpact(hero)
    case 'lowImpact':    return renderLowImpact(hero)
    default:             return renderLowImpact(hero)
  }
}
