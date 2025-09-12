/**
 * Job Tracker Service Worker
 * Provides offline capability and caching for the Job Tracker application
 */

const CACHE_NAME = 'job-tracker-v1.1';
const CACHE_VERSION = '1.1.0';

// Core application assets - Cache First strategy
const CORE_ASSETS = [
    '/',
    '/index.html',
    '/styles.css',
    '/manifest.json'
];

// JavaScript modules - Cache First strategy
const JS_ASSETS = [
    '/js/app.js',
    '/js/auth.js',
    '/js/data.js',
    '/js/csv.js',
    '/js/job-tracker.js',
    '/js/dashboard.js',
    '/js/settings.js',
    '/js/weekly-report.js',
    '/js/notifications.js',
    '/js/advanced-analytics.js'
];

// Static assets (images, etc.) - Cache First strategy
const STATIC_ASSETS = [
    '/images/screenshot.png',
    '/sample_import.csv'
];

// CDN resources - Stale While Revalidate strategy
const CDN_ASSETS = [
    'https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js'
];

// All assets to pre-cache on install
const PRECACHE_ASSETS = [
    ...CORE_ASSETS,
    ...JS_ASSETS,
    ...STATIC_ASSETS
];

/**
 * Service Worker Install Event
 * Pre-cache essential assets
 */
self.addEventListener('install', event => {
    console.log('[SW] Installing Service Worker v' + CACHE_VERSION);
    
    event.waitUntil(
        Promise.all([
            // Pre-cache core application assets
            caches.open(CACHE_NAME).then(cache => {
                console.log('[SW] Pre-caching core assets');
                return cache.addAll(PRECACHE_ASSETS);
            }),
            
            // Pre-cache CDN resources
            caches.open(CACHE_NAME + '-cdn').then(cache => {
                console.log('[SW] Pre-caching CDN assets');
                return Promise.all(
                    CDN_ASSETS.map(url => 
                        fetch(url)
                            .then(response => {
                                if (response.ok) {
                                    return cache.put(url, response);
                                }
                            })
                            .catch(error => {
                                console.warn('[SW] Failed to cache CDN asset:', url, error);
                            })
                    )
                );
            })
        ])
        .then(() => {
            console.log('[SW] All assets cached successfully');
            // Skip waiting to activate immediately
            return self.skipWaiting();
        })
        .catch(error => {
            console.error('[SW] Failed to cache assets:', error);
        })
    );
});

/**
 * Service Worker Activate Event
 * Clean up old caches and take control
 */
self.addEventListener('activate', event => {
    console.log('[SW] Activating Service Worker v' + CACHE_VERSION);
    
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        // Keep current cache and CDN cache
                        if (cacheName !== CACHE_NAME && cacheName !== CACHE_NAME + '-cdn') {
                            console.log('[SW] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('[SW] Service Worker activated');
                // Take control of all clients immediately
                return self.clients.claim();
            })
            .then(() => {
                // Notify clients that SW is ready
                return self.clients.matchAll();
            })
            .then(clients => {
                clients.forEach(client => {
                    client.postMessage({
                        type: 'SW_ACTIVATED',
                        version: CACHE_VERSION
                    });
                });
            })
            .catch(error => {
                console.error('[SW] Activation failed:', error);
            })
    );
});

/**
 * Service Worker Fetch Event
 * Implement caching strategies
 */
self.addEventListener('fetch', event => {
    const request = event.request;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Skip chrome-extension and other non-http requests
    if (!url.protocol.startsWith('http')) {
        return;
    }
    
    event.respondWith(
        handleFetchRequest(request)
    );
});

/**
 * Handle fetch requests with appropriate caching strategy
 * @param {Request} request - The fetch request
 * @returns {Promise<Response>} The response
 */
async function handleFetchRequest(request) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    try {
        // Strategy 1: CDN Resources - Stale While Revalidate
        if (CDN_ASSETS.some(asset => request.url.startsWith(asset))) {
            return await staleWhileRevalidate(request, CACHE_NAME + '-cdn');
        }
        
        // Strategy 2: Core Assets (HTML, CSS, Manifest) - Network First with fast cache fallback
        if (CORE_ASSETS.some(asset => pathname === asset || pathname.endsWith(asset))) {
            return await networkFirstWithTimeout(request, 2000);
        }
        
        // Strategy 3: JavaScript Assets - Cache First with background update
        if (JS_ASSETS.some(asset => pathname === asset)) {
            return await cacheFirstWithUpdate(request);
        }
        
        // Strategy 4: Static Assets (images, CSV) - Cache First
        if (STATIC_ASSETS.some(asset => pathname === asset || pathname.includes(asset))) {
            return await cacheFirst(request);
        }
        
        // Strategy 5: API-like requests or data - Network First
        if (pathname.includes('/api/') || pathname.includes('.json')) {
            return await networkFirst(request);
        }
        
        // Strategy 6: Default - Network First with cache fallback
        return await networkFirst(request);
        
    } catch (error) {
        console.error('[SW] Fetch error:', error);
        
        // Return offline fallback if available
        return await getOfflineFallback(request);
    }
}

/**
 * Cache First Strategy
 * Check cache first, fallback to network
 */
async function cacheFirst(request) {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
        console.log('[SW] Cache hit:', request.url);
        return cachedResponse;
    }
    
    console.log('[SW] Cache miss, fetching:', request.url);
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
}

/**
 * Network First Strategy
 * Try network first, fallback to cache
 */
async function networkFirst(request) {
    try {
        console.log('[SW] Network first:', request.url);
        const networkResponse = await fetch(request);
        
        // Cache successful responses
        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
        
    } catch (error) {
        console.log('[SW] Network failed, checking cache:', request.url);
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        throw error;
    }
}

/**
 * Stale While Revalidate Strategy
 * Return cached version immediately, update cache in background
 */
async function staleWhileRevalidate(request, cacheName = CACHE_NAME) {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    // Fetch in background to update cache
    const fetchPromise = fetch(request).then(response => {
        if (response.ok) {
            cache.put(request, response.clone());
        }
        return response;
    }).catch(error => {
        console.log('[SW] Background fetch failed:', error);
    });
    
    // Return cached version immediately if available
    if (cachedResponse) {
        console.log('[SW] Stale while revalidate (cached):', request.url);
        return cachedResponse;
    }
    
    // If no cache, wait for network
    console.log('[SW] Stale while revalidate (network):', request.url);
    return await fetchPromise;
}

/**
 * Network First with Timeout Strategy
 * Try network with timeout, fallback to cache quickly
 */
async function networkFirstWithTimeout(request, timeout = 3000) {
    const cache = await caches.open(CACHE_NAME);
    
    try {
        // Race between network request and timeout
        const networkPromise = fetch(request);
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Network timeout')), timeout)
        );
        
        const networkResponse = await Promise.race([networkPromise, timeoutPromise]);
        
        // Cache successful responses
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        
        console.log('[SW] Network first with timeout (network):', request.url);
        return networkResponse;
        
    } catch (error) {
        console.log('[SW] Network timeout, checking cache:', request.url);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        throw error;
    }
}

/**
 * Cache First with Background Update Strategy
 * Return cached version, update in background
 */
async function cacheFirstWithUpdate(request) {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    // Update cache in background
    fetch(request).then(response => {
        if (response.ok) {
            cache.put(request, response.clone());
        }
    }).catch(error => {
        console.log('[SW] Background update failed:', error);
    });
    
    if (cachedResponse) {
        console.log('[SW] Cache first with update (cached):', request.url);
        return cachedResponse;
    }
    
    // If no cache, fetch from network
    console.log('[SW] Cache first with update (network):', request.url);
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
}

/**
 * Get offline fallback response
 * @param {Request} request - The original request
 * @returns {Promise<Response>} Fallback response
 */
async function getOfflineFallback(request) {
    const cache = await caches.open(CACHE_NAME);
    const url = new URL(request.url);
    
    // For HTML/document requests, return cached index.html
    if (request.destination === 'document' || url.pathname.endsWith('.html')) {
        const fallback = await cache.match('/index.html') || await cache.match('/');
        if (fallback) {
            console.log('[SW] Serving offline fallback for document:', request.url);
            return fallback;
        }
    }
    
    // For JavaScript files, try to find cached version
    if (url.pathname.endsWith('.js')) {
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
            console.log('[SW] Serving cached JS for offline:', request.url);
            return cachedResponse;
        }
    }
    
    // For CSS files, try to find cached version
    if (url.pathname.endsWith('.css')) {
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
            console.log('[SW] Serving cached CSS for offline:', request.url);
            return cachedResponse;
        }
    }
    
    // For CDN resources, check CDN cache
    if (CDN_ASSETS.some(asset => request.url.startsWith(asset))) {
        const cdnCache = await caches.open(CACHE_NAME + '-cdn');
        const cachedResponse = await cdnCache.match(request);
        if (cachedResponse) {
            console.log('[SW] Serving cached CDN resource for offline:', request.url);
            return cachedResponse;
        }
    }
    
    // For any other requests, try to find cached version
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
        console.log('[SW] Serving cached resource for offline:', request.url);
        return cachedResponse;
    }
    
    // Return appropriate offline response based on request type
    if (request.destination === 'image') {
        return new Response('', {
            status: 200,
            statusText: 'OK',
            headers: { 'Content-Type': 'image/svg+xml' }
        });
    }
    
    // Return a basic offline response for other requests
    console.log('[SW] No cache available for offline request:', request.url);
    return new Response(JSON.stringify({
        error: 'Offline',
        message: 'This resource is not available offline',
        url: request.url
    }), {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
        }
    });
}

/**
 * Handle service worker messages
 */
self.addEventListener('message', event => {
    const { type, data } = event.data;
    
    switch (type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
            
        case 'GET_VERSION':
            event.ports[0].postMessage({
                version: CACHE_VERSION,
                cacheName: CACHE_NAME
            });
            break;
            
        case 'CLEAR_CACHE':
            Promise.all([
                caches.delete(CACHE_NAME),
                caches.delete(CACHE_NAME + '-cdn')
            ]).then(() => {
                event.ports[0].postMessage({ success: true });
            });
            break;
            
        case 'GET_CACHE_STATUS':
            getCacheStatus().then(status => {
                event.ports[0].postMessage(status);
            });
            break;
            
        case 'PRECACHE_ASSETS':
            precacheAssets().then(result => {
                event.ports[0].postMessage(result);
            });
            break;
            
        default:
            console.log('[SW] Unknown message type:', type);
    }
});

/**
 * Get current cache status
 */
async function getCacheStatus() {
    try {
        const cache = await caches.open(CACHE_NAME);
        const cdnCache = await caches.open(CACHE_NAME + '-cdn');
        
        const cacheKeys = await cache.keys();
        const cdnKeys = await cdnCache.keys();
        
        return {
            version: CACHE_VERSION,
            cacheName: CACHE_NAME,
            cachedAssets: cacheKeys.length,
            cdnAssets: cdnKeys.length,
            totalAssets: cacheKeys.length + cdnKeys.length,
            precacheAssets: PRECACHE_ASSETS.length,
            cdnAssets: CDN_ASSETS.length
        };
    } catch (error) {
        return {
            error: error.message,
            version: CACHE_VERSION
        };
    }
}

/**
 * Manually precache assets (for debugging/recovery)
 */
async function precacheAssets() {
    try {
        const cache = await caches.open(CACHE_NAME);
        const cdnCache = await caches.open(CACHE_NAME + '-cdn');
        
        // Cache core assets
        await cache.addAll(PRECACHE_ASSETS);
        
        // Cache CDN assets
        await Promise.all(
            CDN_ASSETS.map(url => 
                fetch(url)
                    .then(response => {
                        if (response.ok) {
                            return cdnCache.put(url, response);
                        }
                    })
                    .catch(error => {
                        console.warn('[SW] Failed to precache CDN asset:', url, error);
                    })
            )
        );
        
        return {
            success: true,
            message: 'Assets precached successfully',
            cachedAssets: PRECACHE_ASSETS.length,
            cdnAssets: CDN_ASSETS.length
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

console.log('[SW] Service Worker script loaded v' + CACHE_VERSION);