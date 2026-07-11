import pkg from '../../package.json'

export const versionManager = {
  appVersion: pkg.version || '1.1.0',
  buildDate: '2026-07-11',
  environment: import.meta.env.MODE || 'production',
  serviceWorkerVersion: '1.3.0',
  cacheVersion: 'v1.1.0-cache'
}
