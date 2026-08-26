/** Client-side mirror of Convex emoji poison helpers. */

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
