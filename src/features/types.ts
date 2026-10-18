export function isFeatureEnabled(featureId: string): boolean {
  const envKey = `FEATURE_${featureId.toUpperCase().replace(/-/g, '_')}`
  const envValue = process.env[envKey]

  if (envValue === 'false') {
    return false
  }

  return true
}
