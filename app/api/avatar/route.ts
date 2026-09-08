import { renderSoccerAvatar } from '../../../lib/soccer-avatar'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const seed = (searchParams.get('s') || 'xact').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32) || 'xact'
  const kit = searchParams.get('kit')
  const svg = renderSoccerAvatar(seed, kit)

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
