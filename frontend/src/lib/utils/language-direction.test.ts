import { describe, expect, it } from 'vitest'
import { getTextDirection } from './language-direction'

describe('getTextDirection', () => {
  it.each(['he', 'he-IL', 'ar', 'fa-IR', 'ur'])('%s uses RTL direction', (language) => {
    expect(getTextDirection(language)).toBe('rtl')
  })

  it.each(['en-US', 'fr-FR', 'zh-CN'])('%s uses LTR direction', (language) => {
    expect(getTextDirection(language)).toBe('ltr')
  })
})
