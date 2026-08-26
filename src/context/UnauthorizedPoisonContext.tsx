import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { toEmojiData } from '@/lib/emojiPoison'

type UnauthorizedPoisonValue = {
  active: boolean
  reason: string | null
  activate: (reason?: string) => void
  poison: (value: string) => string
}

const UnauthorizedPoisonContext = createContext<UnauthorizedPoisonValue | null>(null)

/**
 * When unauthorized access is detected, scramble every visible text node into emojis.
 */
function EmojiPoisonDomEffect({ active }: { active: boolean }) {
  useEffect(() => {
    if (!active) return

    const root = document.getElementById('root') ?? document.body
    let applying = false

    const poisonNode = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent ?? ''
        if (!text.trim()) return
        if (node.parentElement?.closest('[data-no-poison]')) return
        // Skip if already mostly emoji-poisoned.
        if (!/[A-Za-z0-9]/.test(text)) return
        node.textContent = toEmojiData(text)
        return
      }
      node.childNodes.forEach((child) => poisonNode(child))
    }

    const run = () => {
      if (applying) return
      applying = true
      try {
        poisonNode(root)
      } finally {
        applying = false
      }
    }

    run()
    const observer = new MutationObserver(() => run())
    observer.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
    })

    return () => observer.disconnect()
  }, [active])

  return null
}

export function UnauthorizedPoisonProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(false)
  const [reason, setReason] = useState<string | null>(null)

  const activate = useCallback((nextReason = 'unauthorized-access') => {
    setActive(true)
    setReason(nextReason)
  }, [])

  useEffect(() => {
    const unsub = window.cloak?.onDataPoisoned?.((payload) => {
      activate(payload.reason || 'unauthorized-access')
    })
    return () => unsub?.()
  }, [activate])

  const value = useMemo<UnauthorizedPoisonValue>(
    () => ({
      active,
      reason,
      activate,
      poison: (text) => (active ? toEmojiData(text) : text),
    }),
    [active, reason, activate],
  )

  return (
    <UnauthorizedPoisonContext.Provider value={value}>
      {children}
      <EmojiPoisonDomEffect active={active} />
      {active
        ? createPortal(
            <div
              data-no-poison
              className="pointer-events-none fixed inset-x-0 top-10 z-[260] flex justify-center px-4"
            >
              <p className="rounded-full border border-alert/40 bg-[#1a0808]/95 px-4 py-2 text-xs font-semibold tracking-wide text-alert-bright shadow-[0_0_40px_rgba(239,68,68,0.25)]">
                Unauthorized access detected — app data scrambled to emojis
              </p>
            </div>,
            document.body,
          )
        : null}
    </UnauthorizedPoisonContext.Provider>
  )
}

export function useUnauthorizedPoison() {
  const ctx = useContext(UnauthorizedPoisonContext)
  if (!ctx) {
    return {
      active: false,
      reason: null,
      activate: (_reason?: string) => {},
      poison: (value: string) => value,
    }
  }
  return ctx
}
