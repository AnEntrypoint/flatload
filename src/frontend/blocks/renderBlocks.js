import { renderBanner } from './Banner.js'
import { renderCallToAction } from './CallToAction.js'
import { renderCode } from './Code.js'
import { renderContent } from './Content.js'
import { renderMediaBlock } from './MediaBlock.js'
import { renderArchiveBlock } from './ArchiveBlock.js'
import { renderFormBlock } from './Form.js'

export async function renderBlocks(blocks = []) {
  const parts = await Promise.all(
    blocks.map((block) => {
      switch (block.blockType) {
        case 'banner':     return renderBanner(block)
        case 'cta':        return renderCallToAction(block)
        case 'code':       return renderCode(block)
        case 'content':    return renderContent(block)
        case 'mediaBlock': return renderMediaBlock(block)
        case 'archive':    return renderArchiveBlock(block)
        case 'formBlock':  return renderFormBlock(block)
        default:           return ''
      }
    }),
  )
  return parts.join('')
}
