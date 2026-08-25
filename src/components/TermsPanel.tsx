import type { ReactNode } from 'react'
import termsMarkdown from '@/content/terms.md?raw'
import { slugifyTermsHeading } from '@/lib/terms'

function renderInline(text: string): ReactNode[] {
  const parts: ReactNode[] = []
  const pattern = /\*\*(.+?)\*\*/g
  let last = 0
  let match: RegExpExecArray | null
  let key = 0

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index))
    }
    parts.push(
      <strong key={key++} className="font-semibold text-snow">
        {match[1]}
      </strong>,
    )
    last = match.index + match[0].length
  }

  if (last < text.length) parts.push(text.slice(last))
  return parts
}

function TermsMarkdown({ source }: { source: string }) {
  const lines = source.replace(/\r\n/g, '\n').split('\n')
  const blocks: ReactNode[] = []
  let i = 0
  let key = 0

  while (i < lines.length) {
    const line = lines[i]

    if (!line.trim()) {
      i += 1
      continue
    }

    if (/^---+$/.test(line.trim())) {
      blocks.push(<hr key={key++} className="my-8 border-line" />)
      i += 1
      continue
    }

    if (line.startsWith('# ')) {
      blocks.push(
        <h1 key={key++} className="font-display text-3xl font-bold tracking-tight text-snow">
          {renderInline(line.slice(2))}
        </h1>,
      )
      i += 1
      continue
    }

    if (line.startsWith('## ')) {
      const title = line.slice(3).trim()
      const sectionId = slugifyTermsHeading(title)
      blocks.push(
        <h2
          key={key++}
          id={`terms-${sectionId}`}
          className="font-display mt-10 scroll-mt-6 text-xl font-semibold text-snow"
        >
          {renderInline(title)}
        </h2>,
      )
      i += 1
      continue
    }

    if (line.startsWith('### ')) {
      blocks.push(
        <h3 key={key++} className="mt-6 text-base font-semibold text-snow">
          {renderInline(line.slice(4))}
        </h3>,
      )
      i += 1
      continue
    }

    if (/^\d+\.\s/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ''))
        i += 1
      }
      blocks.push(
        <ol key={key++} className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-mist">
          {items.map((item, index) => (
            <li key={index}>{renderInline(item)}</li>
          ))}
        </ol>,
      )
      continue
    }

    if (/^\*\s/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\*\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\*\s/, ''))
        i += 1
      }
      blocks.push(
        <ul key={key++} className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-mist">
          {items.map((item, index) => (
            <li key={index}>{renderInline(item)}</li>
          ))}
        </ul>,
      )
      continue
    }

    const paragraph: string[] = [line]
    i += 1
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].startsWith('#') &&
      !/^---+$/.test(lines[i].trim()) &&
      !/^\*\s/.test(lines[i]) &&
      !/^\d+\.\s/.test(lines[i])
    ) {
      paragraph.push(lines[i])
      i += 1
    }

    blocks.push(
      <p key={key++} className="mt-3 text-sm leading-relaxed text-mist">
        {renderInline(paragraph.join(' '))}
      </p>,
    )
  }

  return <div className="pb-10">{blocks}</div>
}

export function TermsPanel() {
  return (
    <section className="mx-auto max-w-3xl">
      <TermsMarkdown source={termsMarkdown} />
    </section>
  )
}
