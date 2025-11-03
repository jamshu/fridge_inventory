// @ts-check
import { writable, derived } from 'svelte/store';
import { odooClient } from '$lib/odoo';

// Cache configuration
const CACHE_KEY = 'inventory_cache_v1';
const CACHE_META_KEY = 'inventory_cache_meta_v1';
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes cache validity
const SYNC_INTERVAL_MS = 3 * 60 * 1000; // Background sync every 3 minutes

/**
 * @typedef {Object} InventoryRecord
 * @property {number} id
 * @property {string} x_name
 * // Add more field types based on your Odoo model
 */

/**
 * @typedef {Object} CacheMeta
 * @property {number} lastSyncTime
 * @property {number} lastRecordId
 * @property {number} recordCount
 * @property {boolean} isStale
 */

/**
 * @typedef {Object} CacheState
 * @property {InventoryRecord[]} records
 * @property {boolean} loading
 * @property {boolean} syncing
 * @property {string} error
 * @property {CacheMeta} meta
 */

// Helper functions for localStorage
function loadFromStorage() {
	try {
		const cachedData = localStorage.getItem(CACHE_KEY);
		const meta = localStorage.getItem(CACHE_META_KEY);

		if (cachedData && meta) {
			const records = JSON.parse(cachedData);
			const metaData = JSON.parse(meta);

			// Check if cache is stale
			const now = Date.now();
			const isStale = now - metaData.lastSyncTime > CACHE_DURATION_MS;

			return {
				records,
				meta: { ...metaData, isStale }
			};
		}
	} catch (e) {
		console.warn('Failed to load cache from storage:', e);
	}

	return {
		records: [],
		meta: {
			lastSyncTime: 0,
			lastRecordId: 0,
			recordCount: 0,
			isStale: true
		}
	};
}

function saveToStorage(records, meta) {
	try {
		localStorage.setItem(CACHE_KEY, JSON.stringify(records));
		localStorage.setItem(CACHE_META_KEY, JSON.stringify({
			lastSyncTime: meta.lastSyncTime || Date.now(),
			lastRecordId: meta.lastRecordId || 0,
			recordCount: records.length,
			isStale: false
		}));
	} catch (e) {
		console.warn('Failed to save cache to storage:', e);
	}
}

function clearStorage() {
	try {
		localStorage.removeItem(CACHE_KEY);
		localStorage.removeItem(CACHE_META_KEY);
	} catch (e) {
		console.warn('Failed to clear cache:', e);
	}
}

// Create the main store
function createCacheStore() {
	// Start with cached data if available
	const initialCache = loadFromStorage();

	/** @type {import('svelte/store').Writable<CacheState>} */
	const { subscribe, set, update } = writable({
		records: initialCache.records,
		loading: false,
		syncing: false,
		error: '',
		meta: initialCache.meta
	});

	let syncInterval = null;
	let partnerMap = new Map();

	// Helper to resolve partner names (if your model has Many2one fields to res.partner)
	async function resolvePartnerNames(records) {
		try {
			// Collect all unique partner IDs from Many2one fields
			const partnerIds = new Set();

			for (const record of records) {
				// Example: if you have x_studio_partner field
				// Uncomment and adapt to your model's fields
				/*
				if (Array.isArray(record.x_studio_partner) && record.x_studio_partner.length > 0) {
					partnerIds.add(Number(record.x_studio_partner[0]));
				} else if (typeof record.x_studio_partner === 'number') {
					partnerIds.add(record.x_studio_partner);
				}
				*/
			}

			// Fetch missing partner names
			const missingIds = Array.from(partnerIds).filter(id => !partnerMap.has(id));

			if (missingIds.length > 0) {
				const partners = await odooClient.searchModel(
					'res.partner',
					[['id', 'in', missingIds]],
					['id', 'display_name']
				);

				for (const partner of partners) {
					partnerMap.set(Number(partner.id), partner.display_name);
				}
			}

			// Map IDs to names in records
			return records.map(record => {
				const copy = { ...record };

				// Example: resolve partner field
				// Uncomment and adapt to your model's fields
				/*
				if (Array.isArray(copy.x_studio_partner) && copy.x_studio_partner.length > 0) {
					const id = Number(copy.x_studio_partner[0]);
					copy.x_studio_partner = partnerMap.get(id) || copy.x_studio_partner[1] || String(id);
				} else if (typeof copy.x_studio_partner === 'number') {
					copy.x_studio_partner = partnerMap.get(copy.x_studio_partner) || String(copy.x_studio_partner);
				}
				*/

				return copy;
			});

		} catch (error) {
			console.warn('Failed to resolve partner names:', error);
			return records;
		}
	}

	// Sync function - fetches new data from server
	async function sync(forceFullRefresh = false) {
		// Only show syncing indicator, don't set loading
		update(state => ({ ...state, syncing: true, error: '' }));

		try {
			const fields = [
				'id',
				'x_name',
				// Add all fields from your Odoo model here
			];

			let currentState;
			subscribe(s => currentState = s)();

			let domain = [];
			let fetchedRecords = [];

			if (!forceFullRefresh && currentState.meta.lastRecordId > 0) {
				// Incremental fetch - get only new records
				domain = [['id', '>', currentState.meta.lastRecordId]];

				try {
					fetchedRecords = await odooClient.searchRecords('x_inventory', domain, fields);
				} catch (err) {
					console.warn('Incremental fetch failed, falling back to full fetch:', err);
					forceFullRefresh = true;
				}
			}

			if (forceFullRefresh || currentState.meta.lastRecordId === 0) {
				// Full refresh
				fetchedRecords = await odooClient.searchRecords('x_inventory', [], fields);
			}

			// Merge or replace records
			let mergedRecords;
			if (forceFullRefresh || currentState.meta.lastRecordId === 0) {
				// Replace all records
				mergedRecords = fetchedRecords;
			} else {
				// Merge new records with existing ones
				const existingIds = new Set(currentState.records.map(r => r.id));
				const newRecords = fetchedRecords.filter(r => !existingIds.has(r.id));
				mergedRecords = [...currentState.records, ...newRecords];
			}

			// Sort by ID to ensure consistent ordering
			mergedRecords.sort((a, b) => a.id - b.id);

			// Resolve partner names if needed
			const recordsWithNames = await resolvePartnerNames(mergedRecords);

			// Calculate new metadata
			const lastRecordId = recordsWithNames.length > 0
				? Math.max(...recordsWithNames.map(r => r.id))
				: 0;

			const newMeta = {
				lastSyncTime: Date.now(),
				lastRecordId,
				recordCount: recordsWithNames.length,
				isStale: false
			};

			// Save to storage
			saveToStorage(recordsWithNames, newMeta);

			// Update store
			update(state => ({
				...state,
				records: recordsWithNames,
				meta: newMeta,
				syncing: false,
				error: ''
			}));

		} catch (error) {
			console.error('Sync failed:', error);
			update(state => ({
				...state,
				syncing: false,
				error: error.message || 'Failed to sync data'
			}));
		}
	}

	// Initial load - show cached data immediately, then sync in background
	async function initialize() {
		const currentState = loadFromStorage();

		if (currentState.records.length > 0) {
			// Show cached data immediately (no loading state)
			const recordsWithNames = await resolvePartnerNames(currentState.records);

			update(state => ({
				...state,
				records: recordsWithNames,
				loading: false,
				meta: currentState.meta
			}));

			// Then sync in the background if stale
			if (currentState.meta.isStale) {
				sync();
			}
		} else {
			// No cache, do initial sync
			update(state => ({ ...state, loading: true }));
			await sync(true);
			update(state => ({ ...state, loading: false }));
		}

		// Set up periodic background sync
		if (syncInterval) {
			clearInterval(syncInterval);
		}

		syncInterval = setInterval(() => {
			sync();
		}, SYNC_INTERVAL_MS);
	}

	// Clean up function
	function destroy() {
		if (syncInterval) {
			clearInterval(syncInterval);
			syncInterval = null;
		}
	}

	// Force refresh function
	async function forceRefresh() {
		clearStorage();
		partnerMap.clear();
		await sync(true);
	}

	// Create a new record
	async function createRecord(fields) {
		try {
			const id = await odooClient.createRecord('x_inventory', fields);

			// Optimistically add to cache
			const newRecord = { id, ...fields };
			update(state => ({
				...state,
				records: [...state.records, newRecord]
			}));

			// Sync to get the full record with all fields
			await sync();

			return id;
		} catch (error) {
			console.error('Failed to create record:', error);
			throw error;
		}
	}

	// Update a record
	async function updateRecord(id, values) {
		try {
			await odooClient.updateRecord('x_inventory', id, values);

			// Optimistically update cache
			update(state => ({
				...state,
				records: state.records.map(r => r.id === id ? { ...r, ...values } : r)
			}));

			// Sync to get the full updated record
			await sync();

			return true;
		} catch (error) {
			console.error('Failed to update record:', error);
			throw error;
		}
	}

	// Delete a record
	async function deleteRecord(id) {
		try {
			await odooClient.deleteRecord('x_inventory', id);

			// Optimistically remove from cache
			update(state => ({
				...state,
				records: state.records.filter(r => r.id !== id)
			}));

			return true;
		} catch (error) {
			console.error('Failed to delete record:', error);
			throw error;
		}
	}

	return {
		subscribe,
		initialize,
		sync,
		forceRefresh,
		destroy,
		createRecord,
		updateRecord,
		deleteRecord
	};
}

// Create a singleton store instance
export const inventoryCache = createCacheStore();

// Derived store for recent records
export const recentInventories = derived(
	inventoryCache,
	$cache => $cache.records.slice(-10).reverse()
);

// Derived store for loading states
export const cacheStatus = derived(
	inventoryCache,
	$cache => ({
		isLoading: $cache.loading,
		isSyncing: $cache.syncing,
		hasError: !!$cache.error,
		error: $cache.error,
		isStale: $cache.meta.isStale,
		lastSync: $cache.meta.lastSyncTime,
		recordCount: $cache.meta.recordCount
	})
);
