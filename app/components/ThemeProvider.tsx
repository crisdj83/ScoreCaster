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
    document.documentElement.style.backgroundColor = color
    return
  }
  metas.forEach((meta) => {
    meta.removeAttribute('media')
    meta.setAttribute('content', color)
  })
  document.documentElement.style.backgroundColor = color
}

function ThemeColorSync() {
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    if (!resolvedTheme) return
    applyThemeColor(resolvedTheme === 'light' ? '#E2E8F0' : '#18181b')
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
