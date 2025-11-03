// @ts-check
import { base } from '$app/paths';

// Read PUBLIC_API_URL from Vite environment at build time (optional)
const PUBLIC_API_URL = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.PUBLIC_API_URL
	? String(import.meta.env.PUBLIC_API_URL)
	: '';

/**
 * @typedef {Object} OdooClient
 * @property {(model: string, fields: Record<string, any>) => Promise<number>} createRecord
 * @property {(model: string, domain?: any[], fields?: string[]) => Promise<any[]>} searchRecords
 * @property {(model: string, id: number, values: Record<string, any>) => Promise<boolean>} updateRecord
 * @property {(model: string, id: number) => Promise<boolean>} deleteRecord
 */

class OdooAPI {
	constructor() {
		// If a PUBLIC_API_URL is set at build time, use it as the API base.
		// This is required when the frontend is deployed to a static host (GitHub Pages)
		// and the server proxy runs on a separate host (e.g. Vercel/Render).
		if (PUBLIC_API_URL && PUBLIC_API_URL.trim() !== '') {
			this.apiUrl = `${PUBLIC_API_URL.replace(/\/$/, '')}/api/odoo`;
		} else {
			this.apiUrl = `${base}/api/odoo`;
		}
	}

	/**
	 * Call the server-side API
	 * @param {string} action
	 * @param {any} data
	 * @returns {Promise<any>}
	 */
	async callApi(action, data) {
		const response = await fetch(this.apiUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ action, data })
		});

		const result = await response.json();

		if (!result.success) {
			throw new Error(result.error || 'API Error');
		}

		return result;
	}

	/**
	 * Create a new record in specified model
	 * @param {string} model - Odoo model name
	 * @param {Record<string, any>} fields - Record fields
	 * @returns {Promise<number>} - Created record ID
	 */
	async createRecord(model, fields) {
		const result = await this.callApi('create', { model, fields });
		return result.id;
	}

	/**
	 * Search and read records from specified model
	 * @param {string} model - Odoo model name
	 * @param {any[]} domain - Odoo domain filter
	 * @param {string[]} fields - Fields to retrieve
	 * @returns {Promise<any[]>} - Array of records
	 */
	async searchRecords(model, domain = [], fields = []) {
		const result = await this.callApi('search', { model, domain, fields });
		return result.results;
	}

	/**
	 * Generic search_read for any model (alias for searchRecords)
	 * @param {string} model
	 * @param {any[]} domain
	 * @param {string[]} fields
	 * @returns {Promise<any[]>}
	 */
	async searchModel(model, domain = [], fields = []) {
		const result = await this.callApi('search_model', { model, domain, fields });
		return result.results;
	}

	/**
	 * Fetch partner list (common operation)
	 * @returns {Promise<Array<{id:number, display_name:string}>>}
	 */
	async fetchPartners() {
		return await this.searchModel('res.partner', [], ['id', 'display_name']);
	}

	/**
	 * Helpers to format Odoo relational fields
	 */

	/**
	 * Format a many2one field value
	 * @param {number|string|null|undefined} id
	 * @returns {number|false}
	 */
	formatMany2one(id) {
		// many2one expects an integer id or false
		return id ? Number(id) : false;
	}

	/**
	 * Format a many2many field using the (6,0,[ids]) command
	 * @param {Array<number|string>} ids
	 * @returns {any[]}
	 */
	formatMany2many(ids) {
		// many2many 'commands' format: use (6, 0, [ids]) to replace with list of ids
		if (!Array.isArray(ids) || ids.length === 0) return [];
		// Odoo expects a list of command tuples. For JSON this is an array containing
		// the command array(s). For example: [[6, 0, [1,2]]]
		return [[6, 0, ids.map((i) => Number(i))]];
	}

	/**
	 * Update a record
	 * @param {string} model - Odoo model name
	 * @param {number} id - Record ID
	 * @param {Record<string, any>} values - Fields to update
	 * @returns {Promise<boolean>}
	 */
	async updateRecord(model, id, values) {
		const result = await this.callApi('update', { model, id, values });
		return result.result;
	}

	/**
	 * Delete a record
	 * @param {string} model - Odoo model name
	 * @param {number} id - Record ID
	 * @returns {Promise<boolean>}
	 */
	async deleteRecord(model, id) {
		const result = await this.callApi('delete', { model, id });
		return result.result;
	}
}

export const odooClient = new OdooAPI();
