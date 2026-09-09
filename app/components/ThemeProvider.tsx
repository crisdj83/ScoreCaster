'use client'

import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes'
import { useEffect } from 'react'

function ThemeColorSync() {
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    const color = resolvedTheme === 'light' ? '#e5e9f0' : '#050506'
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', color)
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
