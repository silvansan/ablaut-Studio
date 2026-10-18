'use client'

import { useEffect, useRef, useState } from 'react'

import type { ServerStats } from '@/lib/server-stats'

const POLL_MS = 5000

type Rates = { rx: null | number; tx: null | number }

function formatBytes(value: number) {
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let size = value
  let unit = 0

  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024
    unit += 1
  }

  return `${size >= 100 || unit === 0 ? Math.round(size) : size.toFixed(1)} ${units[unit]}`
}

function formatDuration(seconds: number) {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (days > 0) {
    return `${days}d ${hours}h`
  }

  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
}

function level(percent: number): 'ok' | 'high' | 'critical' {
  if (percent >= 90) {
    return 'critical'
  }

  return percent >= 75 ? 'high' : 'ok'
}

function Meter({ label, percent }: { label: string; percent: number }) {
  const state = level(percent)
  const color =
    state === 'critical' ? 'var(--us-danger)' : state === 'high' ? 'var(--us-warning)' : 'var(--us-green)'

  return (
    <div
      aria-label={label}
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={Math.round(percent)}
      className="h-1.5 w-full overflow-hidden"
      role="meter"
      style={{ background: 'var(--us-border)', borderRadius: 'var(--us-r-chip)' }}
    >
      <div className="h-full" style={{ background: color, width: `${Math.min(100, Math.max(0, percent))}%` }} />
    </div>
  )
}

function Tile({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <article className="us-panel space-y-2 px-4 py-4">
      <p className="us-side-heading px-0">{label}</p>
      {children}
    </article>
  )
}

export function ServerStatsPanel() {
  const [stats, setStats] = useState<null | ServerStats>(null)
  const [rates, setRates] = useState<Rates>({ rx: null, tx: null })
  const [error, setError] = useState<null | string>(null)
  const previous = useRef<null | ServerStats>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (document.hidden) {
        return
      }

      try {
        const response = await fetch('/api/app/server-stats', { cache: 'no-store', credentials: 'same-origin' })

        if (!response.ok) {
          throw new Error('Could not read server numbers.')
        }

        const next = (await response.json()) as ServerStats

        if (cancelled) {
          return
        }

        const before = previous.current
        const seconds = before ? (next.sampledAt - before.sampledAt) / 1000 : 0

        if (before?.network && next.network && seconds > 0) {
          setRates({
            rx: Math.max(0, (next.network.rxBytes - before.network.rxBytes) / seconds),
            tx: Math.max(0, (next.network.txBytes - before.network.txBytes) / seconds),
          })
        }

        previous.current = next
        setStats(next)
        setError(null)
      } catch (failure) {
        if (!cancelled) {
          setError(failure instanceof Error ? failure.message : 'Could not read server numbers.')
        }
      }
    }

    void load()
    const timer = window.setInterval(() => void load(), POLL_MS)

    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [])

  if (!stats) {
    return (
      <p className="text-sm" role="status" style={{ color: error ? 'var(--us-danger)' : 'var(--us-muted)' }}>
        {error ?? 'Reading server numbers...'}
      </p>
    )
  }

  const memoryPercent = stats.memory.limitBytes > 0 ? (stats.memory.usedBytes / stats.memory.limitBytes) * 100 : 0
  const numeric = { fontVariantNumeric: 'tabular-nums' as const }

  return (
    <div className="space-y-3">
      {error ? (
        <p className="text-sm" role="alert" style={{ color: 'var(--us-danger)' }}>
          {error} Showing the last reading.
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <Tile label="CPU load">
          <p className="text-2xl font-semibold" style={{ ...numeric, color: 'var(--us-green-dark)' }}>
            {stats.cpu.loadPercent}%
          </p>
          <Meter label="CPU load" percent={stats.cpu.loadPercent} />
          <p className="text-xs" style={{ ...numeric, color: 'var(--us-muted)' }}>
            Load {stats.cpu.load1.toFixed(2)} · {stats.cpu.load5.toFixed(2)} · {stats.cpu.load15.toFixed(2)} on{' '}
            {stats.cpu.cores} core{stats.cpu.cores === 1 ? '' : 's'}
          </p>
        </Tile>

        <Tile label="Memory">
          <p className="text-2xl font-semibold" style={{ ...numeric, color: 'var(--us-green-dark)' }}>
            {Math.round(memoryPercent)}%
          </p>
          <Meter label="Memory used" percent={memoryPercent} />
          <p className="text-xs" style={{ ...numeric, color: 'var(--us-muted)' }}>
            {formatBytes(stats.memory.usedBytes)} of {formatBytes(stats.memory.limitBytes)}
            {stats.memory.source === 'container' ? ' (container limit)' : ' (whole machine)'} · app uses{' '}
            {formatBytes(stats.memory.process)}
          </p>
        </Tile>

        <Tile label="Network">
          {stats.network ? (
            <>
              <p className="text-sm" style={numeric}>
                <span style={{ color: 'var(--us-muted)' }}>In </span>
                <strong>{rates.rx === null ? '...' : `${formatBytes(rates.rx)}/s`}</strong>
                <span style={{ color: 'var(--us-muted)' }}> · Out </span>
                <strong>{rates.tx === null ? '...' : `${formatBytes(rates.tx)}/s`}</strong>
              </p>
              <p className="text-xs" style={{ ...numeric, color: 'var(--us-muted)' }}>
                Total since start: {formatBytes(stats.network.rxBytes)} in · {formatBytes(stats.network.txBytes)} out.
                Listener audio flows through LiveKit, so heavy events show up here.
              </p>
            </>
          ) : (
            <p className="text-sm" style={{ color: 'var(--us-muted)' }}>
              Network counters are only available on Linux servers.
            </p>
          )}
        </Tile>

        <Tile label="Live audio (LiveKit)">
          <p className="text-sm">
            <span className={`us-chip ${stats.livekit.reachable ? 'us-chip-active' : 'us-chip-inactive'}`}>
              {stats.livekit.configured ? (stats.livekit.reachable ? 'Reachable' : 'Not reachable') : 'Not set up'}
            </span>
          </p>
          <p className="text-sm" style={numeric}>
            <strong>{stats.livekit.rooms ?? '–'}</strong> room{stats.livekit.rooms === 1 ? '' : 's'} ·{' '}
            <strong>{stats.livekit.participants ?? '–'}</strong> connected
          </p>
          <p className="text-xs" style={{ color: 'var(--us-muted)' }}>
            Listener fallback (LL-HLS): {stats.streaming.hlsEgress ? 'on' : 'off'}
          </p>
        </Tile>

        <Tile label="Database">
          <p className="text-sm">
            <span className={`us-chip ${stats.database.ok ? 'us-chip-active' : 'us-chip-inactive'}`}>
              {stats.database.ok ? 'Connected' : 'Not responding'}
            </span>
          </p>
          <p className="text-sm" style={numeric}>
            Answer time: <strong>{stats.database.latencyMs === null ? '–' : `${stats.database.latencyMs} ms`}</strong>
          </p>
        </Tile>

        <Tile label="Uptime">
          <p className="text-sm" style={numeric}>
            App running <strong>{formatDuration(stats.uptime.processSeconds)}</strong>
          </p>
          <p className="text-xs" style={{ ...numeric, color: 'var(--us-muted)' }}>
            Machine up {formatDuration(stats.uptime.systemSeconds)} · updates every {POLL_MS / 1000} seconds
          </p>
        </Tile>
      </div>
    </div>
  )
}
