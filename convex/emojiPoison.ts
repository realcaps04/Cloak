/** Emoji alphabet used to scramble leaked / unauthorized payloads. */
export const POISON_EMOJIS = [
  '🔐',
  '👾',
  '🎭',
  '🌀',
  '🧿',
  '♾️',
  '🪩',
  '👻',
  '🧩',
  '🫧',
  '🌑',
  '⚡',
  '🪬',
  '🛸',
  '🕸️',
  '🛰️',
] as const

/**
 * Turn any string into emoji noise so unauthorized callers cannot read real data.
 */
export function toEmojiData(value: string): string {
  const chars = [...value]
  if (chars.length === 0) return '🔐🔐🔐'
  return chars
    .map((ch, i) => {
      if (ch === ' ' || ch === '\n' || ch === '\t' || ch === '\r') return ch
      const code = ch.codePointAt(0) ?? 0
      return POISON_EMOJIS[(code + i * 7) % POISON_EMOJIS.length]
    })
    .join('')
}

export type EmojiPoisonServer = {
  id: string
  name: string
  tagline: string
  joinEndpoint: string
  region: string
  status: 'online' | 'maintenance' | 'offline'
  maxPlayers: number
  iconUrl: string | null
}

/** Fake server cards returned when access is unauthorized. */
export function buildEmojiPoisonServers(seed: string): EmojiPoisonServer[] {
  const safeSeed = seed.trim() || 'anon'
  const count = 3 + (safeSeed.length % 3)
  return Array.from({ length: count }, (_, i) => ({
    id: `poison_${i}_${toEmojiData(safeSeed).slice(0, 12)}`,
    name: toEmojiData(`Cloak Server ${i + 1}`),
    tagline: toEmojiData('Protected FiveM server'),
    joinEndpoint: toEmojiData(`0.0.0.0:30120/${safeSeed}/${i}`),
    region: toEmojiData('Unknown'),
    status: 'online' as const,
    maxPlayers: 32,
    iconUrl: null,
  }))
}
