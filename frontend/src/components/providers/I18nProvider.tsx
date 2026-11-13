'use client'

import React, { useEffect, useState } from 'react'
import '@/lib/i18n'
import { LanguageLoadingOverlay } from '@/components/common/LanguageLoadingOverlay'
import i18n from '@/lib/i18n'
import { getTextDirection } from '@/lib/utils/language-direction'

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const applyLanguageAttributes = (language: string) => {
      const root = document.documentElement
      const normalizedLanguage = language || 'en-US'
      root.lang = normalizedLanguage
      root.dir = getTextDirection(normalizedLanguage)
    }

    applyLanguageAttributes(i18n.resolvedLanguage || i18n.language)
    i18n.on('languageChanged', applyLanguageAttributes)
    setMounted(true)

    return () => {
      i18n.off('languageChanged', applyLanguageAttributes)
    }
  }, [])

  // Avoid hydration mismatch by waiting for mount
  if (!mounted) {
    return <div style={{ visibility: 'hidden' }}>{children}</div>
  }

  return (
    <>
      <LanguageLoadingOverlay />
      {children}
    </>
  )
}
