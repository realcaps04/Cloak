import termsMarkdown from '@/content/terms.md?raw'

export type TermsSection = {
  id: string
  title: string
  shortLabel: string
}

export function slugifyTermsHeading(title: string) {
  return title
    .toLowerCase()
    .replace(/\*\*/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function parseTermsSections(source: string = termsMarkdown): TermsSection[] {
  const sections: TermsSection[] = []

  for (const line of source.replace(/\r\n/g, '\n').split('\n')) {
    if (!line.startsWith('## ')) continue
    const title = line.slice(3).trim()
    const id = slugifyTermsHeading(title)
    const numbered = title.match(/^(\d+)\.\s*(.+)$/)
    sections.push({
      id,
      title,
      shortLabel: numbered ? `${numbered[1]}. ${numbered[2]}` : title,
    })
  }

  return sections
}

export const TERMS_SECTIONS = parseTermsSections()

export function scrollToTermsSection(sectionId: string) {
  document.getElementById(`terms-${sectionId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
