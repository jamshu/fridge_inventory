<script>
	import { inventoryCache, cacheStatus } from '$lib/stores/inventoryCache';
	import { filterRecords } from '$lib/inventoryUtils';
	import { onMount, onDestroy } from 'svelte';

	let searchTerm = $state('');
	let records = $derived($inventoryCache.records);
	let filteredRecords = $derived(filterRecords(records, searchTerm, ['x_name']));
	let status = $derived($cacheStatus);

	onMount(async () => {
		await inventoryCache.initialize();
	});

	onDestroy(() => {
		inventoryCache.destroy();
	});

	async function handleDelete(id) {
		if (!confirm('Are you sure you want to delete this Fridge Inventory?')) {
			return;
		}

		try {
			await inventoryCache.deleteRecord(id);
		} catch (error) {
			alert(`Failed to delete: ${error.message}`);
		}
	}

	async function handleIncrement(id) {
		try {
			await inventoryCache.incrementItemCount(id);
		} catch (error) {
			alert(`Failed to increment: ${error.message}`);
		}
	}

	async function handleDecrement(id) {
		try {
			await inventoryCache.decrementItemCount(id);
		} catch (error) {
			alert(`Failed to decrement: ${error.message}`);
		}
	}

	function handleRefresh() {
		inventoryCache.forceRefresh();
	}
</script>

<svelte:head>
	<title>All Fridge Inventorys - fridge_inventory</title>
</svelte:head>

<div class="container">
	<h1>📋 fridge_inventory</h1>

	<nav>
		<a href="/">Add Fridge Inventory</a>
		<a href="/list" class="active">View All</a>
	</nav>

	<div class="list-container">
		<div class="list-header">
			<h2>All Fridge Inventorys</h2>
			<div class="header-actions">
				<input
					type="search"
					placeholder="Search..."
					bind:value={searchTerm}
					class="search-input"
				/>
				<button class="refresh-btn" onclick={handleRefresh} disabled={status.isSyncing}>
					{status.isSyncing ? '⏳' : '🔄'}
				</button>
			</div>
		</div>

		{#if status.isLoading}
			<div class="loading">Loading...</div>
		{:else if filteredRecords.length === 0}
			<div class="empty">
				{searchTerm ? 'No matching records found' : 'No Fridge Inventorys yet. Add your first one!'}
			</div>
		{:else}
			<div class="record-list">
				{#each filteredRecords as record (record.id)}
					<div class="record-card">
						<div class="record-content">
							<h3>{record.x_name}</h3>
							<div class="record-details">
								<p class="record-meta">ID: {record.id}</p>
								<div class="items-counter">
									<span class="counter-label">Items:</span>
									<button class="counter-btn" onclick={() => handleDecrement(record.id)}>-</button>
									<span class="counter-value">{Number(record.x_studio_items_count) || 0}</span>
									<button class="counter-btn" onclick={() => handleIncrement(record.id)}>+</button>
								</div>
							</div>
						</div>
						<div class="record-actions">
							<button class="delete-btn" onclick={() => handleDelete(record.id)}>
								🗑️
							</button>
						</div>
					</div>
				{/each}
			</div>
		{/if}

		{#if status.lastSync > 0}
			<div class="sync-info">
				Last synced: {new Date(status.lastSync).toLocaleString()}
				{#if status.isStale}
					<span class="stale-badge">Stale</span>
				{/if}
			</div>
		{/if}
	</div>
</div>

<style>
	.container {
		max-width: 800px;
		margin: 0 auto;
		padding: 16px;
	}

	h1 {
		color: white;
		text-align: center;
		margin-bottom: 30px;
		font-size: 2.5em;
	}

	h2 {
		margin: 0;
		color: #333;
		font-size: 1.5em;
	}

	nav {
		display: flex;
		gap: 10px;
		margin-bottom: 30px;
		background: white;
		border-radius: 10px;
		padding: 5px;
	}

	nav a {
		flex: 1;
		text-align: center;
		padding: 12px;
		text-decoration: none;
		color: #667eea;
		border-radius: 8px;
		font-weight: 600;
		transition: all 0.3s;
	}

	nav a.active {
		background: #667eea;
		color: white;
	}

	.list-container {
		background: white;
		padding: 24px;
		border-radius: 15px;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
	}

	.list-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20px;
		flex-wrap: wrap;
		gap: 15px;
	}

	.header-actions {
		display: flex;
		gap: 10px;
		align-items: center;
	}

	.search-input {
		padding: 10px;
		border: 2px solid #e0e0e0;
		border-radius: 8px;
		font-size: 14px;
		min-width: 200px;
	}

	.search-input:focus {
		outline: none;
		border-color: #667eea;
	}

	.refresh-btn {
		padding: 10px 15px;
		background: #f0f0f0;
		color: #667eea;
		border: none;
		border-radius: 8px;
		font-size: 18px;
		cursor: pointer;
		transition: all 0.3s;
	}

	.refresh-btn:hover:not(:disabled) {
		background: #e0e0e0;
		transform: rotate(360deg);
	}

	.refresh-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.loading,
	.empty {
		text-align: center;
		padding: 40px;
		color: #666;
		font-size: 16px;
	}

	.record-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.record-card {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 16px;
		border: 2px solid #e0e0e0;
		border-radius: 10px;
		transition: all 0.3s;
	}

	.record-card:hover {
		border-color: #667eea;
		box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
	}

	.record-content {
		flex: 1;
	}

	.record-content h3 {
		margin: 0 0 8px 0;
		color: #333;
		font-size: 1.1em;
	}

	.record-details {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.record-meta {
		margin: 0;
		color: #666;
		font-size: 0.9em;
	}

	.items-counter {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.counter-label {
		font-weight: 600;
		color: #555;
		font-size: 0.9em;
	}

	.counter-btn {
		padding: 4px 10px;
		background: #667eea;
		color: white;
		border: none;
		border-radius: 5px;
		font-size: 16px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		min-width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.counter-btn:hover {
		background: #5568d3;
		transform: scale(1.05);
	}

	.counter-btn:active {
		transform: scale(0.95);
	}

	.counter-value {
		min-width: 40px;
		text-align: center;
		font-size: 1.1em;
		font-weight: 600;
		color: #333;
		background: #f5f5f5;
		padding: 4px 12px;
		border-radius: 5px;
	}

	.record-actions {
		display: flex;
		gap: 8px;
	}

	.delete-btn {
		padding: 8px 12px;
		background: #fff5f5;
		color: #e53e3e;
		border: 1px solid #feb2b2;
		border-radius: 6px;
		font-size: 18px;
		cursor: pointer;
		transition: all 0.3s;
	}

	.delete-btn:hover {
		background: #fed7d7;
	}

	.sync-info {
		margin-top: 20px;
		padding-top: 20px;
		border-top: 1px solid #e0e0e0;
		text-align: center;
		color: #666;
		font-size: 0.9em;
	}

	.stale-badge {
		display: inline-block;
		margin-left: 10px;
		padding: 2px 8px;
		background: #fef5e7;
		color: #f39c12;
		border-radius: 4px;
		font-size: 0.85em;
		font-weight: 600;
	}

	@media (max-width: 600px) {
		.list-header {
			flex-direction: column;
			align-items: stretch;
		}

		.header-actions {
			flex-direction: column;
			align-items: stretch;
		}

		.search-input {
			min-width: auto;
		}

		.record-card {
			flex-direction: column;
			align-items: flex-start;
			gap: 12px;
		}

		.record-actions {
			align-self: flex-end;
		}

		.items-counter {
			width: 100%;
			justify-content: flex-start;
		}
	}
</style>
