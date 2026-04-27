import { useState, useMemo } from 'react'
import type { ProductionBuilding } from '../../types'
import { Search, ChevronUp, ChevronDown } from 'lucide-react'

interface Props {
  buildings: ProductionBuilding[]
}

type SortKey = 'type' | 'recipe' | 'clock_speed_pct' | 'is_producing'

export default function ProductionTab({ buildings }: Props) {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('type')
  const [sortAsc, setSortAsc] = useState(true)
  const [typeFilter, setTypeFilter] = useState('All')

  const types = useMemo(() => {
    const s = new Set(buildings.map((b) => b.type))
    return ['All', ...Array.from(s).sort()]
  }, [buildings])

  const filtered = useMemo(() => {
    let list = buildings
    if (typeFilter !== 'All') list = list.filter((b) => b.type === typeFilter)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((b) =>
        b.type.toLowerCase().includes(q) || (b.recipe || '').toLowerCase().includes(q),
      )
    }
    list = [...list].sort((a, b) => {
      const av = a[sortKey] ?? ''
      const bv = b[sortKey] ?? ''
      if (typeof av === 'boolean') return sortAsc ? (av ? -1 : 1) : av ? 1 : -1
      if (typeof av === 'number') return sortAsc ? av - (bv as number) : (bv as number) - av
      return sortAsc
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av))
    })
    return list
  }, [buildings, search, sortKey, sortAsc, typeFilter])

  const producing = buildings.filter((b) => b.is_producing).length
  const standby = buildings.filter((b) => b.is_standby).length

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(!sortAsc)
    else { setSortKey(key); setSortAsc(true) }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-48 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-sf-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search type or recipe…"
            className="w-full pl-8 pr-3 py-1.5 bg-sf-card border border-sf-border rounded text-sm text-sf-text placeholder-sf-muted focus:outline-none focus:border-sf-orange"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-sf-card border border-sf-border rounded px-3 py-1.5 text-sm text-sf-text focus:outline-none focus:border-sf-orange"
        >
          {types.map((t) => <option key={t}>{t}</option>)}
        </select>
        <span className="text-sf-muted text-sm">
          {filtered.length} buildings &middot; <span className="text-sf-green">{producing} running</span>
          {standby > 0 && <> &middot; <span className="text-sf-yellow">{standby} standby</span></>}
        </span>
      </div>

      <div className="bg-sf-card border border-sf-border rounded-lg overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-sf-border text-sf-muted">
              <Th label="Type" sortKey="type" current={sortKey} asc={sortAsc} onSort={toggleSort} />
              <Th label="Recipe" sortKey="recipe" current={sortKey} asc={sortAsc} onSort={toggleSort} />
              <Th label="Clock %" sortKey="clock_speed_pct" current={sortKey} asc={sortAsc} onSort={toggleSort} />
              <Th label="Status" sortKey="is_producing" current={sortKey} asc={sortAsc} onSort={toggleSort} />
            </tr>
          </thead>
          <tbody>
            {filtered.map((b) => (
              <tr key={b.instance} className="border-b border-sf-border/40 hover:bg-white/5 transition-colors">
                <td className="px-4 py-2 text-sf-text">{b.type}</td>
                <td className="px-4 py-2 text-sf-muted">{b.recipe ?? <span className="text-sf-border italic">no recipe</span>}</td>
                <td className="px-4 py-2">
                  <ClockBadge pct={b.clock_speed_pct} />
                </td>
                <td className="px-4 py-2">
                  <StatusBadge producing={b.is_producing} standby={b.is_standby} />
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-sf-muted">No buildings found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Th({ label, sortKey, current, asc, onSort }: {
  label: string; sortKey: SortKey; current: SortKey; asc: boolean; onSort: (k: SortKey) => void
}) {
  const active = current === sortKey
  return (
    <th
      className="px-4 py-2.5 text-left cursor-pointer hover:text-sf-text select-none"
      onClick={() => onSort(sortKey)}
    >
      <span className="flex items-center gap-1">
        {label}
        {active ? (asc ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : null}
      </span>
    </th>
  )
}

function ClockBadge({ pct }: { pct: number }) {
  const color = pct > 100 ? 'text-sf-yellow' : pct === 100 ? 'text-sf-green' : 'text-sf-muted'
  return <span className={`${color} font-mono`}>{pct}%</span>
}

function StatusBadge({ producing, standby }: { producing: boolean; standby: boolean }) {
  if (standby) return <span className="text-sf-yellow text-xs px-2 py-0.5 bg-sf-yellow/10 rounded">Standby</span>
  if (producing) return <span className="text-sf-green text-xs px-2 py-0.5 bg-sf-green/10 rounded">Running</span>
  return <span className="text-sf-muted text-xs px-2 py-0.5 bg-white/5 rounded">Idle</span>
}
