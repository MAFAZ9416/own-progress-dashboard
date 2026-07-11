import { openDB } from 'idb'

const DB_NAME = 'progressly-offline-db'
const DB_VERSION = 1

export const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(db) {
    // Mutations Queue store
    if (!db.objectStoreNames.contains('mutations')) {
      db.createObjectStore('mutations', { keyPath: 'uuid' })
    }

    // Dedicated caches for GET endpoints
    const cacheStores = [
      'dashboard',
      'profile',
      'skills',
      'tasks',
      'notifications',
      'achievements',
      'settings',
      'metadata'
    ]

    cacheStores.forEach((store) => {
      if (!db.objectStoreNames.contains(store)) {
        db.createObjectStore(store, { keyPath: 'id' })
      }
    })
  }
})

// Caching helper operations
export async function getCachedData(storeName, key = 'default') {
  try {
    const db = await dbPromise
    const record = await db.get(storeName, key)
    if (!record) return null

    // Check expiration
    if (record.expires_at && new Date(record.expires_at) < new Date()) {
      await db.delete(storeName, key)
      return null
    }
    return record.data
  } catch (error) {
    console.error(`IndexedDB fetch error from ${storeName}:`, error)
    return null
  }
}

export async function setCachedData(storeName, key = 'default', data, ttlSeconds = 86400) {
  try {
    const db = await dbPromise
    const now = new Date()
    const expires = new Date(now.getTime() + ttlSeconds * 1000)

    const record = {
      id: key,
      cached_at: now.toISOString(),
      expires_at: expires.toISOString(),
      version: '1.1.0',
      data: data
    }
    await db.put(storeName, record)
  } catch (error) {
    console.error(`IndexedDB write error to ${storeName}:`, error)
  }
}

export async function clearCacheStore(storeName) {
  try {
    const db = await dbPromise
    await db.clear(storeName)
  } catch (error) {
    console.error(`IndexedDB clear error in ${storeName}:`, error)
  }
}

export async function clearAllCaches() {
  const cacheStores = [
    'dashboard',
    'profile',
    'skills',
    'tasks',
    'notifications',
    'achievements',
    'settings',
    'metadata'
  ]
  for (const store of cacheStores) {
    await clearCacheStore(store)
  }
}

export async function getDatabaseMetrics() {
  try {
    const db = await dbPromise
    const metrics = {}
    let totalRecords = 0

    const stores = [
      'mutations',
      'dashboard',
      'profile',
      'skills',
      'tasks',
      'notifications',
      'achievements',
      'settings',
      'metadata'
    ]

    for (const store of stores) {
      const tx = db.transaction(store, 'readonly')
      const count = await tx.store.count()
      metrics[store] = count
      totalRecords += count
    }

    return {
      stores: metrics,
      totalRecords
    }
  } catch (error) {
    console.error('Error fetching database metrics:', error)
    return { stores: {}, totalRecords: 0 }
  }
}

export async function clearCacheCategory(category) {
  try {
    if (typeof caches === 'undefined') return
    const keys = await caches.keys()
    
    for (const key of keys) {
      if (category === 'images' && (key.includes('image') || key.includes('assets') || key.includes('static'))) {
        await caches.delete(key)
        console.log(`PWA Cache: Deleted image cache key: ${key}`)
      } else if (category === 'api' && (key.includes('api') || key.includes('data'))) {
        await caches.delete(key)
        console.log(`PWA Cache: Deleted api cache key: ${key}`)
      } else if (category === 'all') {
        // Delete all workbox/assets caches except the active precache assets required to run the PWA offline
        if (!key.includes('precache')) {
          await caches.delete(key)
          console.log(`PWA Cache: Deleted obsolete cache key: ${key}`)
        }
      }
    }

    // Also clear custom IndexedDB cache tables if API/Everything is cleared
    if (category === 'api' || category === 'all') {
      await clearAllCaches()
    }
  } catch (error) {
    console.error('Error executing category cache clear:', error)
  }
}
