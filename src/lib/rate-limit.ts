import { NextResponse } from 'next/server'

type RateLimitBucket = {
  count: number
  resetAt: number
}

const buckets = new Map<string, RateLimitBucket>()
const MAX_BUCKETS = 10_000
let lastCleanupAt = 0
const CLEANUP_INTERVAL_MS = 60_000

function getClientIP(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()

  return forwardedFor || request.headers.get('x-real-ip') || 'unknown'
}

export function purgeExpiredRateLimitBuckets(now = Date.now()): number {
  let removed = 0

  for (const [bucketKey, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) {
      buckets.delete(bucketKey)
      removed += 1
    }
  }

  return removed
}

function maybeCleanupBuckets(now: number) {
  if (now - lastCleanupAt < CLEANUP_INTERVAL_MS) {
    return
  }

  lastCleanupAt = now
  purgeExpiredRateLimitBuckets(now)

  if (buckets.size <= MAX_BUCKETS) {
    return
  }

  const overflow = buckets.size - MAX_BUCKETS
  const oldestKeys = [...buckets.entries()]
    .sort((left, right) => left[1].resetAt - right[1].resetAt)
    .slice(0, overflow)
    .map(([bucketKey]) => bucketKey)

  for (const bucketKey of oldestKeys) {
    buckets.delete(bucketKey)
  }
}

export function resetRateLimitBucketsForTests() {
  buckets.clear()
  lastCleanupAt = 0
}

export function consumeRateLimit(
  bucketKey: string,
  options: {
    limit: number
    windowMs: number
  },
): boolean {
  const now = Date.now()
  maybeCleanupBuckets(now)

  const bucket = buckets.get(bucketKey)

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(bucketKey, {
      count: 1,
      resetAt: now + options.windowMs,
    })
    return true
  }

  bucket.count += 1

  return bucket.count <= options.limit
}

export function rateLimitRequest(
  request: Request,
  key: string,
  options: {
    limit: number
    windowMs: number
  },
): NextResponse | null {
  const now = Date.now()
  maybeCleanupBuckets(now)

  const bucketKey = `${key}:${getClientIP(request)}`
  const bucket = buckets.get(bucketKey)

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(bucketKey, {
      count: 1,
      resetAt: now + options.windowMs,
    })
    return null
  }

  bucket.count += 1

  if (bucket.count <= options.limit) {
    return null
  }

  const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))

  return NextResponse.json(
    { error: 'Too many requests' },
    {
      headers: {
        'Retry-After': String(retryAfterSeconds),
      },
      status: 429,
    },
  )
}
