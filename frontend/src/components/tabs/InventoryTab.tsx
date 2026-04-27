import { useState, useMemo } from 'react'
import type { InventoryData } from '../../types'
import { Search, Package, User, BarChart2 } from 'lucide-react'

interface Props {
  inventory: InventoryData
}

type View = 'totals' | 'storage' | 'players'

export default function InventoryTab({ inventory }: Props) {
  const [view, setView] = useState<View>('totals')
  const [search, setSearch] = useState('')

  const filteredTotals = useMemo(() => {
    const q = search.toLowerCase()
    return q
      ? inventory.combined_totals.filter((i) => i.item.toLowerCase().includes(q))
      : inventory.combined_totals
  }, [inventory.combined_totals, search])

  const totalItems = inventory.combined_totals.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <TabBtn active={view === 'totals'} onClick={() => setView('totals')} icon={<BarChart2 size={14} />} label={`All Items (${inventory.combined_totals.length})`} />
        <TabBtn active={view === 'storage'} onClick={() => setView('storage')} icon={<Package size={14} />} label={`Storage (${inventory.storage_containers.length})`} />
        <TabBtn active={view === 'players'} onClick={() => setView('players')} icon={<User size={14} />} label={`Players (${inventory.player_inventories.length})`} />
        <span className="ml-auto text-sf-muted text-sm">{totalItems.toLocaleString()} total items</span>
      </div>

      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-sf-muted" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search items…"
          className="w-full pl-8 pr-3 py-1.5 bg-sf-card border border-sf-border rounded text-sm text-sf-text placeholder-sf-muted focus:outline-none focus:border-sf-orange"
        />
      </div>

      {view === 'totals' && (
        <div className="bg-sf-card border border-sf-border rounded-lg overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-sf-border text-sf-muted">
                <th className="px-4 py-2.5 text-left">Item</th>
                <th className="px-4 py-2.5 text-right">Quantity</th>
                <th className="px-4 py-2.5 text-right w-48">Share</th>
              </tr>
            </thead>
            <tbody>
              {filteredTotals.map((item) => (
                <tr key={item.item} className="border-b border-sf-border/40 hover:bg-white/5">
                  <td className="px-4 py-2 text-sf-text">{item.item}</td>
                  <td className="px-4 py-2 text-right font-mono text-sf-text">{item.quantity.toLocaleString()}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2 justify-end">
                      <div className="flex-1 bg-sf-border/40 rounded-full h-1.5 max-w-24">
                        <div
                          className="bg-sf-orange h-1.5 rounded-full"
                          style={{ width: `${Math.min(100, (item.quantity / filteredTotals[0]?.quantity) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === 'storage' && (
        <div className="space-y-3">
          {inventory.storage_containers
            .filter((c) => !search || c.items.some((i) => i.item.toLowerCase().includes(search.toLowerCase())))
            .map((container) => (
              <ContainerCard
                key={container.instance}
                label={container.label}
                items={container.items}
                slots={container.total_slots}
                used={container.used_slots}
                search={search}
              />
            ))}
          {inventory.storage_containers.length === 0 && (
            <p className="text-sf-muted text-sm text-center py-8">No storage containers found</p>
          )}
        </div>
      )}

      {view === 'players' && (
        <div className="space-y-3">
          {inventory.player_inventories.map((p, i) => (
            <ContainerCard
              key={p.instance}
              label={`Player ${i + 1}`}
              items={p.items}
              search={search}
            />
          ))}
          {inventory.player_inventories.length === 0 && (
            <p className="text-sf-muted text-sm text-center py-8">No player inventories found</p>
          )}
        </div>
      )}
    </div>
  )
}

function TabBtn({ active, onClick, icon, label }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; label: string
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm transition-colors ${
        active
          ? 'bg-sf-orange/20 text-sf-orange border border-sf-orange/40'
          : 'bg-sf-card border border-sf-border text-sf-muted hover:text-sf-text'
      }`}
    >
      {icon}{label}
    </button>
  )
}

function ContainerCard({
  label, items, slots, used, search,
}: {
  label: string; items: Array<{ item: string; quantity: number }>; slots?: number; used?: number; search?: string
}) {
  const visible = search
    ? items.filter((i) => i.item.toLowerCase().includes(search.toLowerCase()))
    : items
  return (
    <div className="bg-sf-card border border-sf-border rounded-lg p-4">
      <div className="flex justify-between items-center mb-3">
        <span className="text-sf-orange text-sm font-semibold">{label}</span>
        {slots !== undefined && (
          <span className="text-sf-muted text-xs">{used}/{slots} slots</span>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1">
        {visible.map((item) => (
          <div key={item.item} className="flex justify-between text-sm">
            <span className="text-sf-text truncate">{item.item}</span>
            <span className="text-sf-muted ml-2 font-mono">{item.quantity.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

import React from 'react'
