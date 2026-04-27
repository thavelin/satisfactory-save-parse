import type { GameStats } from '../../types'
import { Clock, Cpu, Trophy, Zap } from 'lucide-react'

interface Props {
  stats: GameStats
}

export default function StatsTab({ stats }: Props) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Clock size={18} />} label="Play Time" value={stats.play_time_formatted} />
        <StatCard icon={<Cpu size={18} />} label="Build Version" value={String(stats.build_version)} />
        <StatCard
          icon={<Trophy size={18} />}
          label="AWESOME Points"
          value={stats.total_points !== null ? stats.total_points.toLocaleString() : '—'}
        />
        <StatCard
          icon={<Zap size={18} />}
          label="Coupons"
          value={stats.resource_sink_coupons !== null ? String(stats.resource_sink_coupons) : '—'}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <InfoBlock title="Session Info">
          <Row label="Session Name" value={stats.session_name} />
          <Row label="Save File" value={stats.save_name} />
          <Row label="Save Date" value={stats.save_date?.split('T')[0] ?? '—'} />
          <Row label="Creative Mode" value={stats.is_creative_mode ? 'Yes' : 'No'} accent={stats.is_creative_mode} />
          <Row label="Modded" value={stats.is_modded ? 'Yes' : 'No'} accent={stats.is_modded} />
        </InfoBlock>

        <InfoBlock title="Progression">
          <Row label="Game Phase" value={stats.current_phase ?? '—'} />
          <Row label="Active Research" value={stats.active_schematic ?? 'None'} />
        </InfoBlock>
      </div>

      {stats.creatures_killed.length > 0 && (
        <InfoBlock title={`Creatures Killed (${stats.creatures_killed.length} types)`}>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 mt-2">
            {stats.creatures_killed
              .sort((a, b) => b.count - a.count)
              .map((c) => (
                <Row key={c.creature} label={c.creature} value={c.count.toLocaleString()} />
              ))}
          </div>
        </InfoBlock>
      )}
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-sf-card border border-sf-border rounded-lg p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2 text-sf-orange text-sm">{icon}<span>{label}</span></div>
      <div className="text-xl font-semibold text-white truncate">{value}</div>
    </div>
  )
}

function InfoBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-sf-card border border-sf-border rounded-lg p-4">
      <h3 className="text-sf-orange text-sm font-semibold mb-3 uppercase tracking-wider">{title}</h3>
      <div className="space-y-1.5">{children}</div>
    </div>
  )
}

function Row({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-sf-muted">{label}</span>
      <span className={accent ? 'text-sf-yellow' : 'text-sf-text'}>{value}</span>
    </div>
  )
}
