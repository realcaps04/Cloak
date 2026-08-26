import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const COPY = {
  title: 'Copying is blocked',
  message:
    'Cloak blocks copy shortcuts and clipboard capture so connection details stay inside the app. Do not share, stream, or screenshot protected join information.',
}

/**
 * Capture selection / clipboard attempt text for admin F8 reports.
 */
function captureAttemptedCopyText(): string {
  const selection = window.getSelection()?.toString()?.trim() ?? ''
  if (selection) return selection.slice(0, 500)
  return ''
}

/**
 * Player Desktop guard: block copy/cut; on F8 sync any copied text so main can
 * report to admin Warnings and quit the app.
 */
export function StreamSafetyGuard() {
  const titleId = useId()
  const [showCopyWarning, setShowCopyWarning] = useState(false)
  const [closingForF8, setClosingForF8] = useState(false)
  const lastCopyRef = useRef('')

  const rememberCopy = useCallback((text: string) => {
    const trimmed = text.trim().slice(0, 500)
    if (!trimmed) return
    lastCopyRef.current = trimmed
    void window.cloak?.noteCopyAttempt?.(trimmed)
  }, [])

  const dismiss = useCallback(() => setShowCopyWarning(false), [])

  useEffect(() => {
    const blockClipboard = (e: Event) => {
      e.preventDefault()
      rememberCopy(captureAttemptedCopyText())
      setShowCopyWarning(true)
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F8') {
        e.preventDefault()
        e.stopPropagation()
        const copiedText = lastCopyRef.current || captureAttemptedCopyText()
        void window.cloak?.noteCopyAttempt?.(copiedText)
        setClosingForF8(true)
        // Main `before-input-event` reports + quits; this is a backup path.
        void window.cloak?.forceQuit?.()
        return
      }

      const key = e.key.toLowerCase()
      const wantsCopy =
        (e.ctrlKey || e.metaKey) && (key === 'c' || key === 'x' || key === 'insert')
      const shiftInsert = e.shiftKey && key === 'insert'
      if (wantsCopy || shiftInsert) {
        e.preventDefault()
        e.stopPropagation()
        rememberCopy(captureAttemptedCopyText())
        setShowCopyWarning(true)
      }
    }

    document.addEventListener('copy', blockClipboard, true)
    document.addEventListener('cut', blockClipboard, true)
    window.addEventListener('keydown', onKeyDown, true)

    return () => {
      document.removeEventListener('copy', blockClipboard, true)
      document.removeEventListener('cut', blockClipboard, true)
      window.removeEventListener('keydown', onKeyDown, true)
    }
  }, [rememberCopy])

  useEffect(() => {
    if (!showCopyWarning) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showCopyWarning, dismiss])

  if (closingForF8) {
    return createPortal(
      <div className="fixed inset-0 z-[250] flex items-center justify-center bg-[#0a0404]/95 p-4">
        <div className="max-w-md text-center">
          <p className="text-[10px] font-semibold tracking-[0.18em] text-alert-bright uppercase">
            Security alert
          </p>
          <h2 className="font-display mt-2 text-xl font-bold text-snow">Closing Cloak</h2>
          <p className="mt-3 text-sm text-mist">
            F8 was pressed. Admins have been notified. The app is closing now.
          </p>
        </div>
      </div>,
      document.body,
    )
  }

  if (!showCopyWarning) return null

  return createPortal(
    <div className="fixed inset-0 z-[240] flex items-center justify-center p-4">
      <button
        type="button"
        className="no-drag absolute inset-0 bg-[#0a0404]/90 backdrop-blur-sm"
        aria-label="Dismiss warning"
        onClick={dismiss}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-md rounded-3xl border border-alert/40 bg-panel p-6 shadow-[0_0_80px_rgba(239,68,68,0.18)]"
      >
        <p className="text-[10px] font-semibold tracking-[0.18em] text-alert-bright uppercase">
          Do not stream
        </p>
        <h2 id={titleId} className="font-display mt-1 text-xl font-bold text-snow">
          {COPY.title}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-mist">{COPY.message}</p>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={dismiss}
            className="no-drag rounded-xl border border-alert/45 bg-alert/20 px-5 py-2.5 text-sm font-bold text-alert-bright transition hover:bg-alert/30"
          >
            Got it
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
