'use client'

import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes'
import { useEffect } from 'react'

function applyThemeColor(color: string) {
  const metas = Array.from(document.querySelectorAll('meta[name="theme-color"]'))
  if (metas.length === 0) {
    const meta = document.createElement('meta')
    meta.setAttribute('name', 'theme-color')
    meta.setAttribute('content', color)
    document.head.appendChild(meta)
    return
  }
  metas.forEach((meta, index) => {
    meta.removeAttribute('media')
    if (index === 0) meta.setAttribute('content', color)
    else meta.remove()
  })
}

function ThemeColorSync() {
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    if (!resolvedTheme) return
    applyThemeColor(resolvedTheme === 'light' ? '#e4e7eb' : '#050506')
  }, [resolvedTheme])

  return null
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange={false}
      storageKey="xactscore-theme"
    >
      <ThemeColorSync />
      {children}
    </NextThemesProvider>
  )
}
