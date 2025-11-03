// @ts-check

/**
 * IndexedDB Manager for Offline Data Storage
 *
 * This module provides a simple interface to IndexedDB for storing master data
 * from Odoo that needs to be available offline (partners, categories, config, etc.)
 */

const DB_NAME = 'fridge_inventory_db';
const DB_VERSION = 1;

/**
 * Define object stores for different data types
 */
export const STORES = {
	PARTNERS: 'partners',
	CONFIG: 'config',
	// Add more stores as needed for your application
};

let dbInstance = null;

/**
 * Initialize and open the IndexedDB database
 * @returns {Promise<IDBDatabase>}
 */
export function openDB() {
	return new Promise((resolve, reject) => {
		if (dbInstance) {
			resolve(dbInstance);
			return;
		}

		const request = indexedDB.open(DB_NAME, DB_VERSION);

		request.onerror = () => {
			reject(new Error('Failed to open database'));
		};

		request.onsuccess = (event) => {
			dbInstance = event.target.result;
			resolve(dbInstance);
		};

		request.onupgradeneeded = (event) => {
			const db = event.target.result;

			// Create object stores
			if (!db.objectStoreNames.contains(STORES.PARTNERS)) {
				db.createObjectStore(STORES.PARTNERS, { keyPath: 'id' });
			}

			if (!db.objectStoreNames.contains(STORES.CONFIG)) {
				db.createObjectStore(STORES.CONFIG, { keyPath: 'key' });
			}

			// Add more object stores as needed
		};
	});
}

/**
 * Add or update a record in a store
 * @param {string} storeName - Name of the object store
 * @param {any} data - Data to store (must have 'id' or 'key' property)
 * @returns {Promise<void>}
 */
export async function add(storeName, data) {
	const db = await openDB();
	return new Promise((resolve, reject) => {
		const transaction = db.transaction([storeName], 'readwrite');
		const store = transaction.objectStore(storeName);
		const request = store.put(data);

		request.onsuccess = () => resolve();
		request.onerror = () => reject(new Error(`Failed to add data to ${storeName}`));
	});
}

/**
 * Get a record by ID/key from a store
 * @param {string} storeName - Name of the object store
 * @param {any} key - Record ID or key
 * @returns {Promise<any>}
 */
export async function get(storeName, key) {
	const db = await openDB();
	return new Promise((resolve, reject) => {
		const transaction = db.transaction([storeName], 'readonly');
		const store = transaction.objectStore(storeName);
		const request = store.get(key);

		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(new Error(`Failed to get data from ${storeName}`));
	});
}

/**
 * Get all records from a store
 * @param {string} storeName - Name of the object store
 * @returns {Promise<any[]>}
 */
export async function getAll(storeName) {
	const db = await openDB();
	return new Promise((resolve, reject) => {
		const transaction = db.transaction([storeName], 'readonly');
		const store = transaction.objectStore(storeName);
		const request = store.getAll();

		request.onsuccess = () => resolve(request.result || []);
		request.onerror = () => reject(new Error(`Failed to get all data from ${storeName}`));
	});
}

/**
 * Update a record in a store (alias for add since put handles both)
 * @param {string} storeName - Name of the object store
 * @param {any} data - Data to update
 * @returns {Promise<void>}
 */
export async function update(storeName, data) {
	return add(storeName, data);
}

/**
 * Remove a record from a store
 * @param {string} storeName - Name of the object store
 * @param {any} key - Record ID or key to delete
 * @returns {Promise<void>}
 */
export async function remove(storeName, key) {
	const db = await openDB();
	return new Promise((resolve, reject) => {
		const transaction = db.transaction([storeName], 'readwrite');
		const store = transaction.objectStore(storeName);
		const request = store.delete(key);

		request.onsuccess = () => resolve();
		request.onerror = () => reject(new Error(`Failed to delete from ${storeName}`));
	});
}

/**
 * Clear all records from a store
 * @param {string} storeName - Name of the object store
 * @returns {Promise<void>}
 */
export async function clear(storeName) {
	const db = await openDB();
	return new Promise((resolve, reject) => {
		const transaction = db.transaction([storeName], 'readwrite');
		const store = transaction.objectStore(storeName);
		const request = store.clear();

		request.onsuccess = () => resolve();
		request.onerror = () => reject(new Error(`Failed to clear ${storeName}`));
	});
}

/**
 * Bulk add/update records in a store
 * @param {string} storeName - Name of the object store
 * @param {any[]} dataArray - Array of records to store
 * @returns {Promise<void>}
 */
export async function bulkAdd(storeName, dataArray) {
	const db = await openDB();
	return new Promise((resolve, reject) => {
		const transaction = db.transaction([storeName], 'readwrite');
		const store = transaction.objectStore(storeName);

		let completed = 0;
		const total = dataArray.length;

		if (total === 0) {
			resolve();
			return;
		}

		dataArray.forEach(data => {
			const request = store.put(data);
			request.onsuccess = () => {
				completed++;
				if (completed === total) {
					resolve();
				}
			};
			request.onerror = () => {
				reject(new Error(`Failed to bulk add data to ${storeName}`));
			};
		});
	});
}

/**
 * Close the database connection
 */
export function closeDB() {
	if (dbInstance) {
		dbInstance.close();
		dbInstance = null;
	}
}
