export type TextDirection = 'ltr' | 'rtl'

const RTL_LANGUAGES = new Set(['ar', 'fa', 'he', 'ur'])

export function getTextDirection(language: string): TextDirection {
  const baseLanguage = language.toLowerCase().split('-')[0]
  return RTL_LANGUAGES.has(baseLanguage) ? 'rtl' : 'ltr'
}
