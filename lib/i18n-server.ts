import { cookies, headers } from 'next/headers'
import { defaultLocale, isLocale, type Locale } from './i18n'

const SOUTH_AMERICAN_COUNTRIES = new Set([
  'AR', 'BO', 'BR', 'CL', 'CO', 'EC', 'GY', 'PE', 'PY', 'SR', 'UY', 'VE',
])

function localeFromCountry(country: string | null): Locale | null {
  if (!country) return null
  const normalizedCountry = country.toUpperCase()
  if (normalizedCountry === 'RO') return 'ro'
  if (SOUTH_AMERICAN_COUNTRIES.has(normalizedCountry)) return 'es'
  if (normalizedCountry === 'US') return 'en'
  return null
}

function localeFromAcceptLanguage(value: string | null): Locale {
  if (!value) return defaultLocale
  const language = value.toLowerCase()
  if (language.startsWith('ro')) return 'ro'
  if (language.startsWith('es')) return 'es'
  return defaultLocale
}

export function getServerLocale(): Locale {
  const value = cookies().get('scorecaster_locale')?.value
  if (isLocale(value)) return value

  const requestHeaders = headers()
  const country = requestHeaders.get('x-vercel-ip-country') || requestHeaders.get('cf-ipcountry')
  return localeFromCountry(country) || localeFromAcceptLanguage(requestHeaders.get('accept-language'))
}
