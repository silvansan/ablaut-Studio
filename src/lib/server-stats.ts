import { readFile } from 'node:fs/promises'
import os from 'node:os'

import { RoomServiceClient } from 'livekit-server-sdk'
import type { Payload } from 'payload'

import { getLiveKitConfigOrNull, getLiveKitHttpUrl } from '@/lib/livekit'
import { isHlsEgressEnabled } from '@/lib/streaming/egress-config'

export type ServerStats = {
  cpu: { cores: number; load1: number; load5: number; load15: number; loadPercent: number }
  database: { latencyMs: null | number; ok: boolean }
  livekit: {
    configured: boolean
    participants: null | number
    reachable: boolean
    rooms: null | number
  }
  memory: { limitBytes: number; process: number; source: 'container' | 'host'; usedBytes: number }
  network: null | { rxBytes: number; txBytes: number }
  sampledAt: number
  streaming: { hlsEgress: boolean }
  uptime: { processSeconds: number; systemSeconds: number }
}

async function readNumber(path: string): Promise<null | number> {
  try {
    const value = Number((await readFile(path, 'utf8')).trim())
    return Number.isFinite(value) ? value : null
  } catch {
    return null
  }
}

/** Container limits when running in Docker (cgroup v2, then v1); otherwise the host's memory. */
async function readMemory(): Promise<ServerStats['memory']> {
  const processBytes = process.memoryUsage().rss
  const limitV2 = await readNumber('/sys/fs/cgroup/memory.max')
  const usedV2 = await readNumber('/sys/fs/cgroup/memory.current')

  if (limitV2 !== null && usedV2 !== null && limitV2 < os.totalmem() * 2) {
    return { limitBytes: limitV2, process: processBytes, source: 'container', usedBytes: usedV2 }
  }

  const limitV1 = await readNumber('/sys/fs/cgroup/memory/memory.limit_in_bytes')
  const usedV1 = await readNumber('/sys/fs/cgroup/memory/memory.usage_in_bytes')

  if (limitV1 !== null && usedV1 !== null && limitV1 < os.totalmem() * 2) {
    return { limitBytes: limitV1, process: processBytes, source: 'container', usedBytes: usedV1 }
  }

  return {
    limitBytes: os.totalmem(),
    process: processBytes,
    source: 'host',
    usedBytes: os.totalmem() - os.freemem(),
  }
}

/** Cumulative bytes on non-loopback interfaces (Linux). The client turns two samples into a rate. */
async function readNetwork(): Promise<ServerStats['network']> {
  try {
    const lines = (await readFile('/proc/net/dev', 'utf8')).split('\n').slice(2)
    let rxBytes = 0
    let txBytes = 0

    for (const line of lines) {
      const [name, rest] = line.split(':')

      if (!name || !rest || name.trim() === 'lo') {
        continue
      }

      const columns = rest.trim().split(/\s+/).map(Number)
      rxBytes += columns[0] ?? 0
      txBytes += columns[8] ?? 0
    }

    return { rxBytes, txBytes }
  } catch {
    return null
  }
}

async function readLiveKit(): Promise<ServerStats['livekit']> {
  const config = getLiveKitConfigOrNull()

  if (!config) {
    return { configured: false, participants: null, reachable: false, rooms: null }
  }

  try {
    const client = new RoomServiceClient(getLiveKitHttpUrl(config.url), config.apiKey, config.apiSecret)
    const rooms = await Promise.race([
      client.listRooms(),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000)),
    ])

    return {
      configured: true,
      participants: rooms.reduce((total, room) => total + (room.numParticipants ?? 0), 0),
      reachable: true,
      rooms: rooms.length,
    }
  } catch {
    return { configured: true, participants: null, reachable: false, rooms: null }
  }
}

async function readDatabase(payload: Payload): Promise<ServerStats['database']> {
  const started = performance.now()

  try {
    await payload.count({ collection: 'organizations', overrideAccess: true })
    return { latencyMs: Math.round(performance.now() - started), ok: true }
  } catch {
    return { latencyMs: null, ok: false }
  }
}

export async function collectServerStats(payload: Payload): Promise<ServerStats> {
  const cores = Math.max(1, os.cpus().length)
  const [load1 = 0, load5 = 0, load15 = 0] = os.loadavg()
  const [memory, network, livekit, database] = await Promise.all([
    readMemory(),
    readNetwork(),
    readLiveKit(),
    readDatabase(payload),
  ])

  return {
    cpu: {
      cores,
      load1,
      load15,
      load5,
      // Windows reports no load average; show 0 rather than a misleading number.
      loadPercent: Math.min(100, Math.round((load1 / cores) * 100)),
    },
    database,
    livekit,
    memory,
    network,
    sampledAt: Date.now(),
    streaming: { hlsEgress: isHlsEgressEnabled() },
    uptime: { processSeconds: Math.round(process.uptime()), systemSeconds: Math.round(os.uptime()) },
  }
}
