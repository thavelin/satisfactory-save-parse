import { useState, useCallback } from 'react'
import type { ParseResult } from './types'
import { parseSaveFile, pushToNotion, downloadJson } from './api/client'
import StatsTab from './components/tabs/StatsTab'
import ProductionTab from './components/tabs/ProductionTab'
import InventoryTab from './components/tabs/InventoryTab'
import MapTab from './components/tabs/MapTab'
import NotionPanel from './components/NotionPanel'
import { Upload, Download, RefreshCw, ChevronRight } from 'lucide-react'

type Tab = 'stats' | 'production' | 'inventory' | 'map'

export default function App() {
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ParseResult | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('stats')

  async function handleParse(f: File) {
    setFile(f)
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const data = await parseSaveFile(f)
      setResult(data)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f?.name.endsWith('.sav')) handleParse(f)
    else setError('Please upload a .sav file')
  }, [])

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) handleParse(f)
    e.target.value = ''
  }

  const TABS: { key: Tab; label: string; count?: number }[] = [
    { key: 'stats', label: 'Overview' },
    { key: 'production', label: 'Production', count: result?.production.length },
    { key: 'inventory', label: 'Inventory', count: result?.inventory.combined_totals.length },
    { key: 'map', label: 'Map Data', count: result?.map_data.resource_nodes.length },
  ]

  return (
    <div className="min-h-full flex flex-col">
      {/* Header */}
      <header className="border-b border-sf-border bg-sf-card px-6 py-4 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-sf-orange" />
          <span className="text-white font-semibold tracking-wide">Satisfactory</span>
          <ChevronRight size={14} className="text-sf-border" />
          <span className="text-sf-muted text-sm">Save Parser</span>
        </div>
        {result && (
          <div className="ml-auto flex items-center gap-3">
            <span className="text-sf-muted text-xs">{file?.name}</span>
            <button
              onClick={() => downloadJson(result, file?.name ?? 'save')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-sf-card border border-sf-border rounded text-sm text-sf-text hover:border-sf-orange hover:text-sf-orange transition-colors"
            >
              <Download size={13} /> Download JSON
            </button>
          </div>
        )}
      </header>

      <main className="flex-1 px-6 py-6 max-w-7xl mx-auto w-full space-y-6">
        {/* Upload zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
            dragging
              ? 'border-sf-orange bg-sf-orange/5'
              : 'border-sf-border hover:border-sf-orange/50 bg-sf-card'
          }`}
        >
          <Upload size={28} className={`mx-auto mb-3 ${dragging ? 'text-sf-orange' : 'text-sf-muted'}`} />
          <p className="text-sf-text text-sm mb-1">
            Drag &amp; drop your <span className="text-sf-orange">.sav</span> file here
          </p>
          <p className="text-sf-muted text-xs mb-4">
            Satisfactory save files are usually at{' '}
            <span className="font-mono text-sf-border">%LOCALAPPDATA%\FactoryGame\Saved\SaveGames</span>
          </p>
          <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-sf-orange text-sf-dark font-semibold rounded text-sm hover:bg-sf-orange/90 transition-colors">
            <Upload size={14} /> Choose File
            <input type="file" accept=".sav" className="hidden" onChange={onFileInput} />
          </label>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center gap-3 text-sf-muted text-sm bg-sf-card border border-sf-border rounded-lg px-4 py-3">
            <RefreshCw size={14} className="animate-spin text-sf-orange" />
            Parsing {file?.name}…
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-sf-red/10 border border-sf-red/40 text-sf-red rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-4">
            {/* Tab bar */}
            <div className="flex gap-1 border-b border-sf-border">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                    activeTab === t.key
                      ? 'border-sf-orange text-sf-orange'
                      : 'border-transparent text-sf-muted hover:text-sf-text'
                  }`}
                >
                  {t.label}
                  {t.count !== undefined && (
                    <span className="ml-2 text-xs bg-sf-border/60 text-sf-muted px-1.5 py-0.5 rounded-full">
                      {t.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div>
              {activeTab === 'stats' && <StatsTab stats={result.stats} />}
              {activeTab === 'production' && <ProductionTab buildings={result.production} />}
              {activeTab === 'inventory' && <InventoryTab inventory={result.inventory} />}
              {activeTab === 'map' && <MapTab mapData={result.map_data} />}
            </div>

            {/* Notion push */}
            <NotionPanel
              parseId={result.id}
              onPush={(cfg) => pushToNotion(result.id, cfg)}
            />
          </div>
        )}
      </main>
    </div>
  )
}
