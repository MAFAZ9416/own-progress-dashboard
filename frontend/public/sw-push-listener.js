// Service Worker Push Event and Notification Click Listeners

self.addEventListener('push', function(event) {
  if (!event.data) return

  try {
    const payload = event.data.json()
    const title = payload.title || 'Progressly Update'
    const body = payload.body || ''
    
    // Choose appropriate icon & badge based on category
    const category = payload.category || 'notification'
    const icon = '/icons/icon-192x192.png'
    const badge = '/icons/favicon.svg'

    const actions = []
    
    // Configure context-aware actions based on category
    if (category === 'task') {
      actions.push({ action: 'open_tasks', title: 'Open Tasks' })
    } else if (category === 'skill') {
      actions.push({ action: 'open_skills', title: 'Open Skills' })
    } else if (category === 'announcement' || category === 'notification' || category === 'admin') {
      actions.push({ action: 'open_notifications', title: 'View Updates' })
    }
    
    actions.push({ action: 'open_dashboard', title: 'Dashboard' })
    actions.push({ action: 'dismiss', title: 'Dismiss' })

    const options = {
      body: body,
      icon: icon,
      badge: badge,
      vibrate: [100, 50, 100],
      data: {
        url: payload.url || '/dashboard',
        category: category
      },
      actions: actions,
      tag: payload.tag || 'progressly-push-tag',
      renotify: true
    }

    event.waitUntil(
      self.registration.showNotification(title, options)
    )
  } catch (err) {
    console.error('Error rendering incoming push notification:', err)
  }
})

// Handle action button and general notification clicks
self.addEventListener('notificationclick', function(event) {
  event.notification.close()

  let targetUrl = event.notification.data?.url || '/dashboard'

  // Map actions to specific routing paths
  if (event.action === 'open_tasks') {
    targetUrl = '/tasks'
  } else if (event.action === 'open_skills') {
    targetUrl = '/skills'
  } else if (event.action === 'open_notifications') {
    targetUrl = '/notifications'
  } else if (event.action === 'open_dashboard') {
    targetUrl = '/dashboard'
  } else if (event.action === 'dismiss') {
    return // Just dismiss
  }

  // Open or focus the application window
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // Find if an app window is already open and focus it
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i]
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus().then(function() {
            if ('navigate' in client) {
              return client.navigate(targetUrl)
            }
          })
        }
      }
      
      // If no window is open, open a new one
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl)
      }
    })
  )
})
