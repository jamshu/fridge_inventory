// @ts-check

/**
 * Utility Functions for Fridge Inventory Management
 *
 * Add business logic, calculations, and data transformations here
 */

/**
 * Normalize a person/partner field which may be a string, number, or [id, name] tuple
 * @param {any} person
 * @returns {string}
 */
export function normalizePerson(person) {
	if (person == null) return '';
	// If person is an array/tuple like [id, name]
	if (Array.isArray(person) && person.length >= 2) return String(person[1]);
	// If person is an object with display_name
	if (typeof person === 'object') {
		if (person.display_name) return String(person.display_name);
		if (person.name) return String(person.name);
	}
	// Primitive fallback
	return String(person);
}

/**
 * Format currency value
 * @param {number} value
 * @param {string} currency - Currency code (default: SAR)
 * @returns {string}
 */
export function formatCurrency(value, currency = 'SAR') {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: currency
	}).format(value);
}

/**
 * Format date for display
 * @param {string|Date} date
 * @returns {string}
 */
export function formatDate(date) {
	if (!date) return '';
	const d = typeof date === 'string' ? new Date(date) : date;
	return d.toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric'
	});
}

/**
 * Format relative time (e.g., "2 hours ago")
 * @param {number} timestamp - Milliseconds since epoch
 * @returns {string}
 */
export function formatRelativeTime(timestamp) {
	const now = Date.now();
	const diff = now - timestamp;
	const seconds = Math.floor(diff / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);

	if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
	if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
	if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
	return 'Just now';
}

/**
 * Validate email address
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}

/**
 * Generate a unique ID for offline records (will be replaced by Odoo ID on sync)
 * @returns {string}
 */
export function generateTempId() {
	return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if a record is a temporary offline record
 * @param {any} id
 * @returns {boolean}
 */
export function isTempId(id) {
	return typeof id === 'string' && id.startsWith('temp_');
}

/**
 * Sort array of records by field
 * @param {any[]} records
 * @param {string} field
 * @param {'asc'|'desc'} order
 * @returns {any[]}
 */
export function sortRecords(records, field, order = 'asc') {
	return [...records].sort((a, b) => {
		const aVal = a[field];
		const bVal = b[field];

		if (aVal < bVal) return order === 'asc' ? -1 : 1;
		if (aVal > bVal) return order === 'asc' ? 1 : -1;
		return 0;
	});
}

/**
 * Filter records by search term
 * @param {any[]} records
 * @param {string} searchTerm
 * @param {string[]} searchFields - Fields to search in
 * @returns {any[]}
 */
export function filterRecords(records, searchTerm, searchFields = ['x_name']) {
	if (!searchTerm || searchTerm.trim() === '') return records;

	const term = searchTerm.toLowerCase();
	return records.filter(record => {
		return searchFields.some(field => {
			const value = record[field];
			if (value == null) return false;
			return String(value).toLowerCase().includes(term);
		});
	});
}
