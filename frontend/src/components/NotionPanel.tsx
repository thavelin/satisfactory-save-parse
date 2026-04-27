import { useState } from 'react'
import type { NotionConfig } from '../types'
import { ChevronDown, ChevronRight, Send, CheckCircle, AlertCircle } from 'lucide-react'

interface Props {
  parseId: string
  onPush: (config: NotionConfig) => Promise<{ pushed: string[]; errors: Array<{ section: string; error: string }> }>
}

export default function NotionPanel({ parseId, onPush }: Props) {
  const [open, setOpen] = useState(false)
  const [config, setConfig] = useState<NotionConfig>({
    notion_token: '',
    stats_page_id: '',
    production_db_id: '',
    inventory_db_id: '',
    map_db_id: '',
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ pushed: string[]; errors: Array<{ section: string; error: string }> } | null>(null)

  async function handlePush() {
    setLoading(true)
    setResult(null)
    try {
      const res = await onPush(config)
      setResult(res)
    } catch (e) {
      setResult({ pushed: [], errors: [{ section: 'general', error: String(e) }] })
    } finally {
      setLoading(false)
    }
  }

  const canPush = config.notion_token.trim().length > 0 && (
    config.stats_page_id || config.production_db_id || config.inventory_db_id || config.map_db_id
  )

  return (
    <div className="bg-sf-card border border-sf-border rounded-lg">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-sf-text hover:text-white transition-colors"
      >
        <span className="flex items-center gap-2 text-sm font-semibold">
          <Send size={15} className="text-sf-orange" />
          Push to Notion
        </span>
        {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-sf-border pt-4 space-y-3">
          <p className="text-sf-muted text-xs leading-relaxed">
            Create a Notion integration at <span className="text-sf-orange">notion.so/my-integrations</span>, share your target databases with it, then paste the IDs below. Leave any field blank to skip that section.
          </p>

          <Field
            label="Integration Token *"
            placeholder="secret_xxxxxxxxxx"
            type="password"
            value={config.notion_token}
            onChange={(v) => setConfig({ ...config, notion_token: v })}
          />
          <Field
            label="Game Stats — Page ID"
            placeholder="Page ID to append stats block"
            value={config.stats_page_id}
            onChange={(v) => setConfig({ ...config, stats_page_id: v })}
          />
          <Field
            label="Production — Database ID"
            placeholder="Database ID for production buildings"
            value={config.production_db_id}
            onChange={(v) => setConfig({ ...config, production_db_id: v })}
          />
          <Field
            label="Inventory — Database ID"
            placeholder="Database ID for item totals"
            value={config.inventory_db_id}
            onChange={(v) => setConfig({ ...config, inventory_db_id: v })}
          />
          <Field
            label="Map / Nodes — Database ID"
            placeholder="Database ID for resource nodes"
            value={config.map_db_id}
            onChange={(v) => setConfig({ ...config, map_db_id: v })}
          />

          <button
            onClick={handlePush}
            disabled={!canPush || loading}
            className="w-full mt-2 px-4 py-2 bg-sf-orange text-sf-dark font-semibold rounded text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-sf-orange/90 transition-colors flex items-center justify-center gap-2"
          >
            <Send size={14} />
            {loading ? 'Pushing…' : 'Push to Notion'}
          </button>

          {result && (
            <div className="mt-3 space-y-1.5">
              {result.pushed.map((s) => (
                <div key={s} className="flex items-center gap-2 text-sf-green text-xs">
                  <CheckCircle size={12} /> Pushed: {s}
                </div>
              ))}
              {result.errors.map((e) => (
                <div key={e.section} className="flex items-start gap-2 text-sf-red text-xs">
                  <AlertCircle size={12} className="shrink-0 mt-0.5" />
                  <span>{e.section}: {e.error}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Field({ label, placeholder, value, onChange, type = 'text' }: {
  label: string; placeholder: string; value: string; onChange: (v: string) => void; type?: string
}) {
  return (
    <div>
      <label className="block text-sf-muted text-xs mb-1">{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-1.5 bg-sf-dark border border-sf-border rounded text-sm text-sf-text placeholder-sf-border focus:outline-none focus:border-sf-orange"
      />
    </div>
  )
}
