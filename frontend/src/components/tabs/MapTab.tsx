import { useState, useMemo } from 'react'
import type { MapData } from '../../types'
import { Search, MapPin } from 'lucide-react'

interface Props {
  mapData: MapData
}

type View = 'summary' | 'nodes' | 'markers'

export default function MapTab({ mapData }: Props) {
  const [view, setView] = useState<View>('summary')
  const [search, setSearch] = useState('')

  const filteredNodes = useMemo(() => {
    const q = search.toLowerCase()
    return q
      ? mapData.resource_nodes.filter(
          (n) => n.resource.toLowerCase().includes(q) || n.purity.toLowerCase().includes(q),
        )
      : mapData.resource_nodes
  }, [mapData.resource_nodes, search])

  const filteredMarkers = useMemo(() => {
    const q = search.toLowerCase()
    return q
      ? mapData.map_markers.filter((m) => m.name.toLowerCase().includes(q))
      : mapData.map_markers
  }, [mapData.map_markers, search])

  const PURITY_ORDER = ['Pure', 'Normal', 'Impure', 'Unknown']
  const PURITY_COLORS: Record<string, string> = {
    Pure: 'text-sf-green',
    Normal: 'text-sf-orange',
    Impure: 'text-sf-red',
    Unknown: 'text-sf-muted',
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <TabBtn active={view === 'summary'} onClick={() => setView('summary')} label="Node Summary" />
        <TabBtn active={view === 'nodes'} onClick={() => setView('nodes')} label={`All Nodes (${mapData.resource_nodes.length})`} />
        <TabBtn active={view === 'markers'} onClick={() => setView('markers')} label={`Map Markers (${mapData.map_markers.length})`} />
      </div>

      {view !== 'summary' && (
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-sf-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={view === 'nodes' ? 'Search resource or purity…' : 'Search markers…'}
            className="w-full pl-8 pr-3 py-1.5 bg-sf-card border border-sf-border rounded text-sm text-sf-text placeholder-sf-muted focus:outline-none focus:border-sf-orange"
          />
        </div>
      )}

      {view === 'summary' && (
        <div className="bg-sf-card border border-sf-border rounded-lg overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-sf-border text-sf-muted">
                <th className="px-4 py-2.5 text-left">Resource</th>
                {PURITY_ORDER.map((p) => (
                  <th key={p} className={`px-4 py-2.5 text-right ${PURITY_COLORS[p]}`}>{p}</th>
                ))}
                <th className="px-4 py-2.5 text-right text-sf-text">Total</th>
              </tr>
            </thead>
            <tbody>
              {mapData.node_summary
                .sort((a, b) => b.total - a.total)
                .map((row) => (
                  <tr key={row.resource} className="border-b border-sf-border/40 hover:bg-white/5">
                    <td className="px-4 py-2 text-sf-text">{row.resource}</td>
                    {PURITY_ORDER.map((p) => (
                      <td key={p} className={`px-4 py-2 text-right font-mono ${row[p as keyof typeof row] ? PURITY_COLORS[p] : 'text-sf-border'}`}>
                        {row[p as keyof typeof row] || '—'}
                      </td>
                    ))}
                    <td className="px-4 py-2 text-right font-mono text-sf-text font-semibold">{row.total}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {view === 'nodes' && (
        <div className="bg-sf-card border border-sf-border rounded-lg overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-sf-border text-sf-muted">
                <th className="px-4 py-2.5 text-left">Resource</th>
                <th className="px-4 py-2.5 text-left">Purity</th>
                <th className="px-4 py-2.5 text-right">X</th>
                <th className="px-4 py-2.5 text-right">Y</th>
                <th className="px-4 py-2.5 text-right">Z</th>
              </tr>
            </thead>
            <tbody>
              {filteredNodes.map((node) => (
                <tr key={node.instance} className="border-b border-sf-border/40 hover:bg-white/5">
                  <td className="px-4 py-2 text-sf-text">{node.resource}</td>
                  <td className={`px-4 py-2 ${PURITY_COLORS[node.purity] ?? 'text-sf-muted'}`}>{node.purity}</td>
                  <td className="px-4 py-2 text-right font-mono text-sf-muted text-xs">{node.position?.x.toFixed(0) ?? '—'}</td>
                  <td className="px-4 py-2 text-right font-mono text-sf-muted text-xs">{node.position?.y.toFixed(0) ?? '—'}</td>
                  <td className="px-4 py-2 text-right font-mono text-sf-muted text-xs">{node.position?.z.toFixed(0) ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === 'markers' && (
        <div className="grid md:grid-cols-2 gap-3">
          {filteredMarkers.map((m) => (
            <div key={m.instance} className="bg-sf-card border border-sf-border rounded-lg p-3 flex gap-3 items-start">
              <MapPin
                size={16}
                style={{ color: m.color ?? '#E8A214' }}
                className="mt-0.5 shrink-0"
              />
              <div className="min-w-0">
                <p className="text-sf-text text-sm font-medium truncate">{m.name}</p>
                <p className="text-sf-muted text-xs">{m.type}</p>
                {m.position && (
                  <p className="text-sf-border text-xs font-mono mt-0.5">
                    {m.position.x.toFixed(0)}, {m.position.y.toFixed(0)}, {m.position.z.toFixed(0)}
                  </p>
                )}
              </div>
            </div>
          ))}
          {filteredMarkers.length === 0 && (
            <p className="text-sf-muted text-sm text-center py-8 col-span-2">No map markers found</p>
          )}
        </div>
      )}
    </div>
  )
}

function TabBtn({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded text-sm transition-colors ${
        active
          ? 'bg-sf-orange/20 text-sf-orange border border-sf-orange/40'
          : 'bg-sf-card border border-sf-border text-sf-muted hover:text-sf-text'
      }`}
    >
      {label}
    </button>
  )
}
