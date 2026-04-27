import type { ParseResult, NotionConfig } from '../types'

const BASE = '/api'

export async function parseSaveFile(file: File): Promise<ParseResult> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${BASE}/parse`, { method: 'POST', body: form })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'Parse failed')
  }
  return res.json()
}

export async function pushToNotion(
  parseId: string,
  config: NotionConfig,
): Promise<{ pushed: string[]; errors: Array<{ section: string; error: string }> }> {
  const res = await fetch(`${BASE}/notion/push`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ parse_id: parseId, ...config }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'Notion push failed')
  }
  return res.json()
}

export function downloadJson(data: ParseResult, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.replace('.sav', '_parsed.json')
  a.click()
  URL.revokeObjectURL(url)
}
