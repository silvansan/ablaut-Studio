import type { Payload } from 'payload'

import { markPayloadReady } from '@/lib/app-readiness'
import { ensureDefaultOrganization } from '@/lib/bootstrap-organizations'
import { getLiveKitConfigOrNull } from '@/lib/livekit'
import { syncMobileAppReleaseIfStale } from '@/lib/mobile-app-release'
import { migrations } from '@/migrations'

export async function ensureInitialSuperAdmin(payload: Payload) {
  const existingUsers = await payload.count({
    collection: 'users',
    overrideAccess: true,
  })

  if (existingUsers.totalDocs > 0) {
    return
  }

  const email = process.env.INITIAL_SUPER_ADMIN_EMAIL?.trim().toLowerCase()
  const password = process.env.INITIAL_SUPER_ADMIN_PASSWORD?.trim()

  if (!email || !password) {
    payload.logger.warn(
      'No users exist, but INITIAL_SUPER_ADMIN_EMAIL or INITIAL_SUPER_ADMIN_PASSWORD is missing. Skipping bootstrap user creation.',
    )
    return
  }

  await payload.create({
    collection: 'users',
    data: {
      _verified: true,
      active: true,
      email,
      name: 'Initial Super Admin',
      password,
      role: 'super_admin',
    },
    disableVerificationEmail: true,
    overrideAccess: true,
  })

  payload.logger.info(`Created initial super admin account for ${email}.`)
}

async function logMigrationStatus(payload: Payload) {
  if (process.env.PAYLOAD_RUN_MIGRATIONS === 'false') {
    payload.logger.warn('PAYLOAD_RUN_MIGRATIONS=false. Automatic production migrations may be disabled.')
  }

  payload.logger.info(`Registered ${migrations.length} production migration(s).`)

  if (
    process.env.NODE_ENV !== 'production' ||
    process.env.PAYLOAD_DATABASE === 'sqlite' ||
    process.env.DATABASE_URI?.startsWith('file:')
  ) {
    return
  }

  try {
    const applied = await payload.find({
      collection: 'payload-migrations',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      sort: '-createdAt',
    })

    const latest = applied.docs[0]?.name

    payload.logger.info(
      latest
        ? `Database migrations are up to date through "${latest}".`
        : 'No applied migrations recorded yet. Payload will run pending migrations on startup.',
    )
  } catch (error) {
    payload.logger.warn(
      `Unable to read payload migration status during startup: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}

export async function runStartupBootstrap(payload: Payload) {
  await logMigrationStatus(payload)

  const livekit = getLiveKitConfigOrNull()

  if (livekit) {
    payload.logger.info(`LiveKit server URL configured: ${livekit.url}`)
  } else {
    payload.logger.warn('LiveKit is not fully configured. Speaker/listener WebRTC routes will fail until LIVEKIT_* env vars are set.')
  }

  // Migrations finished before onInit; mark ready so Docker health checks pass while
  // non-critical bootstrap work continues asynchronously.
  markPayloadReady()

  void runDeferredBootstrap(payload)
}

async function runDeferredBootstrap(payload: Payload) {
  try {
    await ensureInitialSuperAdmin(payload)
    await ensureDefaultOrganization(payload)
    await syncMobileAppReleaseIfStale(payload)
  } catch (error) {
    payload.logger.error(
      `Post-startup bootstrap failed after app became ready: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}
