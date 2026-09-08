export type SoccerKit = {
  slug: string
  shirt: string
  trim: string
  number: string
  pattern: 'solid' | 'stripes' | 'hoops'
}

const KITS: SoccerKit[] = [
  { slug: 'arsenal', shirt: '#EF0107', trim: '#FFFFFF', number: '#FFFFFF', pattern: 'solid' },
  { slug: 'aston-villa', shirt: '#95BFE5', trim: '#670E36', number: '#670E36', pattern: 'solid' },
  { slug: 'bournemouth', shirt: '#DA291C', trim: '#000000', number: '#FFFFFF', pattern: 'stripes' },
  { slug: 'brentford', shirt: '#E30613', trim: '#FBB800', number: '#FFFFFF', pattern: 'stripes' },
  { slug: 'brighton', shirt: '#0057B8', trim: '#FFFFFF', number: '#FFFFFF', pattern: 'stripes' },
  { slug: 'chelsea', shirt: '#034694', trim: '#FFFFFF', number: '#FFFFFF', pattern: 'solid' },
  { slug: 'crystal-palace', shirt: '#1B458F', trim: '#C4122E', number: '#FFFFFF', pattern: 'stripes' },
  { slug: 'everton', shirt: '#003399', trim: '#FFFFFF', number: '#FFFFFF', pattern: 'solid' },
  { slug: 'fulham', shirt: '#FFFFFF', trim: '#000000', number: '#000000', pattern: 'solid' },
  { slug: 'ipswich-town', shirt: '#0044A9', trim: '#FFFFFF', number: '#FFFFFF', pattern: 'solid' },
  { slug: 'leicester-city', shirt: '#003090', trim: '#FDBE11', number: '#FFFFFF', pattern: 'solid' },
  { slug: 'liverpool', shirt: '#C8102E', trim: '#FFFFFF', number: '#FFFFFF', pattern: 'solid' },
  { slug: 'manchester-city', shirt: '#6CABDD', trim: '#FFFFFF', number: '#1C2C5B', pattern: 'solid' },
  { slug: 'manchester-united', shirt: '#DA291C', trim: '#FBE122', number: '#FFFFFF', pattern: 'solid' },
  { slug: 'newcastle-united', shirt: '#000000', trim: '#FFFFFF', number: '#FFFFFF', pattern: 'stripes' },
  { slug: 'nottingham-forest', shirt: '#E53233', trim: '#FFFFFF', number: '#FFFFFF', pattern: 'solid' },
  { slug: 'southampton', shirt: '#D71920', trim: '#FFFFFF', number: '#000000', pattern: 'stripes' },
  { slug: 'tottenham-hotspur', shirt: '#FFFFFF', trim: '#132257', number: '#132257', pattern: 'solid' },
  { slug: 'west-ham-united', shirt: '#7A263A', trim: '#1BB1E7', number: '#F3D459', pattern: 'solid' },
  { slug: 'wolverhampton-wanderers', shirt: '#FDB913', trim: '#000000', number: '#000000', pattern: 'solid' },
  { slug: 'real-madrid', shirt: '#FFFFFF', trim: '#FEBE10', number: '#00529F', pattern: 'solid' },
  { slug: 'barcelona', shirt: '#A50044', trim: '#004D98', number: '#FFED02', pattern: 'stripes' },
  { slug: 'bayern-munich', shirt: '#DC052D', trim: '#0066B2', number: '#FFFFFF', pattern: 'solid' },
  { slug: 'paris-saint-germain', shirt: '#004170', trim: '#DA291C', number: '#FFFFFF', pattern: 'solid' },
  { slug: 'internazionale', shirt: '#010E80', trim: '#000000', number: '#FFFFFF', pattern: 'stripes' },
  { slug: 'ac-milan', shirt: '#FB090B', trim: '#000000', number: '#FFFFFF', pattern: 'stripes' },
  { slug: 'juventus', shirt: '#000000', trim: '#FFFFFF', number: '#FFFFFF', pattern: 'stripes' },
  { slug: 'borussia-dortmund', shirt: '#FDE100', trim: '#000000', number: '#000000', pattern: 'solid' },
  { slug: 'atletico-madrid', shirt: '#CE3524', trim: '#FFFFFF', number: '#FFFFFF', pattern: 'stripes' },
  { slug: 'napoli', shirt: '#12A0C6', trim: '#FFFFFF', number: '#FFFFFF', pattern: 'solid' },
  { slug: 'bayer-leverkusen', shirt: '#E32221', trim: '#000000', number: '#FFFFFF', pattern: 'solid' },
  { slug: 'benfica', shirt: '#ED1C24', trim: '#FFFFFF', number: '#FFFFFF', pattern: 'solid' },
  { slug: 'sporting-cp', shirt: '#008057', trim: '#FFFFFF', number: '#FFFFFF', pattern: 'hoops' },
  { slug: 'porto', shirt: '#003087', trim: '#FFFFFF', number: '#FFFFFF', pattern: 'stripes' },
  { slug: 'ajax', shirt: '#FFFFFF', trim: '#D2122E', number: '#D2122E', pattern: 'solid' },
  { slug: 'rb-leipzig', shirt: '#FFFFFF', trim: '#DD0741', number: '#DD0741', pattern: 'solid' },
  { slug: 'atalanta', shirt: '#1E71B8', trim: '#000000', number: '#FFFFFF', pattern: 'stripes' },
  { slug: 'lille', shirt: '#E01A22', trim: '#1D1D1B', number: '#FFFFFF', pattern: 'solid' },
  { slug: 'feyenoord', shirt: '#FFFFFF', trim: '#E03C31', number: '#E03C31', pattern: 'hoops' },
  { slug: 'marseille', shirt: '#2FAEE0', trim: '#FFFFFF', number: '#FFFFFF', pattern: 'solid' },
]

const SKIN = ['#F9D7B8', '#F1C27D', '#E0AC69', '#C68642', '#8D5524', '#5C3310']
const HAIR = ['#1C1917', '#292524', '#44403C', '#78350F', '#B45309', '#A8A29E', '#0C0A09']
const BACKGROUNDS = [
  ['#052e16', '#15803d'],
  ['#14532d', '#166534'],
  ['#0b1220', '#166534'],
  ['#022c22', '#0f766e'],
]

function kitSlug(name: string) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function hashSeed(seed: string) {
  let hash = 2166136261
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function rngFrom(seed: string) {
  let state = hashSeed(seed) || 1
  return () => {
    state |= 0
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pick<T>(rand: () => number, items: T[]) {
  return items[Math.floor(rand() * items.length)]
}

function findKit(slug?: string | null) {
  if (!slug) return undefined
  return KITS.find(kit => kit.slug === kitSlug(slug))
}

export function soccerAvatarPath(seed: string, teamName?: string | null) {
  const safeSeed = seed.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32) || 'xact'
  const kit = teamName ? kitSlug(teamName) : ''
  const params = new URLSearchParams({ s: safeSeed })
  if (kit) params.set('kit', kit)
  return `/api/avatar?${params.toString()}`
}

export function isUnoptimizedAvatar(src: string) {
  return src.includes('dicebear') || src.includes('supabase') || src.includes('/api/avatar')
}

function hairSvg(style: number, color: string) {
  if (style === 0) {
    return `<path d="M40 48c2-18 14-26 24-26s22 8 24 26c-6-8-14-12-24-12s-18 4-24 12z" fill="${color}"/>`
  }
  if (style === 1) {
    return `<path d="M38 52c-2-20 12-30 26-30 14 0 28 10 26 30-4-10-12-16-26-16s-22 6-26 16z" fill="${color}"/><circle cx="42" cy="36" r="7" fill="${color}"/><circle cx="54" cy="30" r="8" fill="${color}"/><circle cx="68" cy="29" r="8" fill="${color}"/><circle cx="84" cy="36" r="7" fill="${color}"/>`
  }
  if (style === 2) {
    return `<path d="M46 28h36v18H46z" fill="${color}"/><path d="M58 18h12l4 12H54z" fill="${color}"/>`
  }
  if (style === 3) {
    return `<path d="M40 50c4-20 16-28 24-28s20 8 24 28c-8-12-40-12-48 0z" fill="${color}"/><path d="M84 48c8 10 12 28 8 40h-8c2-12 0-26-6-36z" fill="${color}"/>`
  }
  if (style === 4) {
    return `<ellipse cx="64" cy="40" rx="28" ry="22" fill="${color}"/>`
  }
  return `<path d="M42 44c3-14 12-20 22-20s19 6 22 20c-6-6-14-9-22-9s-16 3-22 9z" fill="${color}"/>`
}

function soccerBall(cx: number, cy: number, r: number) {
  return `<g transform="translate(${cx} ${cy})">
    <circle r="${r}" fill="#f8fafc" stroke="#0f172a" stroke-width="1.5"/>
    <polygon points="0,${-r * 0.38} ${r * 0.36},${-r * 0.12} ${r * 0.22},${r * 0.3} ${-r * 0.22},${r * 0.3} ${-r * 0.36},${-r * 0.12}" fill="#0f172a"/>
    <path d="M ${-r * 0.72} ${-r * 0.18} L ${-r * 0.36} ${-r * 0.12} M ${r * 0.72} ${-r * 0.18} L ${r * 0.36} ${-r * 0.12} M 0 ${-r} L 0 ${-r * 0.38} M ${-r * 0.55} ${r * 0.62} L ${-r * 0.22} ${r * 0.3} M ${r * 0.55} ${r * 0.62} L ${r * 0.22} ${r * 0.3}" stroke="#0f172a" stroke-width="1.2" fill="none"/>
  </g>`
}

export function renderSoccerAvatar(seed: string, kitQuery?: string | null) {
  const rand = rngFrom(seed)
  const kit = findKit(kitQuery) || pick(rand, KITS)
  const skin = pick(rand, SKIN)
  const hair = pick(rand, HAIR)
  const hairStyle = Math.floor(rand() * 6)
  const [bgTop, bgBottom] = pick(rand, BACKGROUNDS)
  const number = String(1 + Math.floor(rand() * 23))
  const beard = rand() > 0.68
  const headband = rand() > 0.72
  const patternId = `k${hashSeed(seed + kit.slug).toString(16)}`
  const shirtFill =
    kit.pattern === 'solid' ? kit.shirt : `url(#${patternId})`

  const pattern =
    kit.pattern === 'stripes'
      ? `<pattern id="${patternId}" width="12" height="128" patternUnits="userSpaceOnUse">
           <rect width="6" height="128" fill="${kit.shirt}"/>
           <rect x="6" width="6" height="128" fill="${kit.trim}"/>
         </pattern>`
      : kit.pattern === 'hoops'
        ? `<pattern id="${patternId}" width="128" height="14" patternUnits="userSpaceOnUse">
             <rect width="128" height="7" fill="${kit.shirt}"/>
             <rect y="7" width="128" height="7" fill="${kit.trim}"/>
           </pattern>`
        : ''

  const numberColor = kit.pattern === 'solid' ? kit.number : kit.shirt === '#000000' || kit.shirt === '#FFFFFF' ? kit.number : '#FFFFFF'

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
  <defs>
    <linearGradient id="pitch" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${bgTop}"/>
      <stop offset="1" stop-color="${bgBottom}"/>
    </linearGradient>
    ${pattern}
  </defs>
  <rect width="128" height="128" fill="url(#pitch)"/>
  <g opacity=".22" fill="none" stroke="#ecfccb" stroke-width="2">
    <line x1="0" y1="88" x2="128" y2="88"/>
    <circle cx="64" cy="128" r="34"/>
    <line x1="64" y1="88" x2="64" y2="128"/>
  </g>
  ${soccerBall(22, 102, 13)}
  <path d="M28 78 L42 68 L50 76 L64 73 L78 76 L86 68 L100 78 L96 128 L32 128 Z" fill="${shirtFill}" stroke="${kit.trim}" stroke-width="2"/>
  <path d="M50 76 L64 84 L78 76" fill="none" stroke="${kit.trim}" stroke-width="3" stroke-linecap="round"/>
  <text x="64" y="112" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="22" font-weight="900" fill="${numberColor}">${number}</text>
  <rect x="38" y="70" width="8" height="14" rx="2" fill="${kit.trim}"/>
  <ellipse cx="64" cy="58" rx="8" ry="10" fill="${skin}"/>
  ${hairSvg(hairStyle, hair)}
  <ellipse cx="64" cy="54" rx="20" ry="22" fill="${skin}"/>
  <ellipse cx="44" cy="56" rx="4" ry="6" fill="${skin}"/>
  <ellipse cx="84" cy="56" rx="4" ry="6" fill="${skin}"/>
  ${headband ? `<rect x="44" y="40" width="40" height="6" rx="2" fill="${kit.trim}"/>` : ''}
  <ellipse cx="57" cy="54" rx="3.2" ry="3.6" fill="#fff"/><circle cx="57.6" cy="54.4" r="1.6" fill="#0f172a"/>
  <ellipse cx="71" cy="54" rx="3.2" ry="3.6" fill="#fff"/><circle cx="71.6" cy="54.4" r="1.6" fill="#0f172a"/>
  <path d="M58 66c4 4 8 4 12 0" fill="none" stroke="#7f1d1d" stroke-width="1.8" stroke-linecap="round"/>
  ${beard ? `<path d="M50 64c2 14 10 18 14 18s12-4 14-18c-4 8-24 8-28 0z" fill="${hair}" opacity=".9"/>` : ''}
</svg>`
}
