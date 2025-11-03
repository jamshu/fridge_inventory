# 📋 Fridge Inventory PWA

An offline-first Progressive Web Application (PWA) for managing fridge inventory with seamless Odoo backend integration.

## ✨ Features

- **Offline-First Design**: Works seamlessly even without internet connection
- **Automatic Sync**: Data automatically syncs with Odoo when back online
- **PWA Capabilities**: Install on mobile and desktop devices
- **Real-time Search**: Search through inventory items instantly
- **Optimistic Updates**: Instant UI feedback for all actions
- **Responsive Design**: Works beautifully on all screen sizes
- **Odoo Integration**: Direct integration with Odoo inventory model

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- Odoo instance with API access
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd fridge_inventory
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```

4. **Update `.env` with your Odoo credentials**
   ```env
   VITE_ODOO_URL=https://your-odoo-instance.com
   VITE_ODOO_DATABASE=your_database
   VITE_ODOO_USERNAME=your_username
   VITE_ODOO_PASSWORD=your_password
   VITE_ODOO_API_KEY=your_api_key
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Build for production**
   ```bash
   npm run build
   ```

## 📱 Usage

### Adding Inventory Items

1. Navigate to the home page
2. Enter an item name in the form
3. Click "Add Fridge Inventory"
4. The item is saved locally and will sync with Odoo automatically

### Viewing All Items

1. Click "View All" in the navigation
2. Browse through all inventory items
3. Use the search box to filter items
4. Click the trash icon to delete an item

### Offline Mode

When offline, the app:
- Shows an offline banner
- Saves data locally in IndexedDB
- Displays cached data
- Syncs automatically when connection is restored

## 🏗️ Architecture

This app uses a three-layer architecture:

```
┌─────────────────┐
│   UI Layer      │  Svelte Components
│  (Pages)        │  +page.svelte
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Cache Layer    │  inventoryCache.js
│  (Store)        │  Smart caching with
└────────┬────────┘  offline-first logic
         │
         ▼
┌─────────────────┐
│  API Layer      │  odoo.js
│  (Client)       │  JSON-RPC calls
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Server Layer   │  /api/odoo/+server.js
│  (SvelteKit)    │  Server-side proxy
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Backend Layer  │  Odoo Server
│  (Odoo)         │  JSON-RPC API
└─────────────────┘
```

## 🛠️ Technology Stack

- **Framework**: SvelteKit 2.x
- **Language**: JavaScript (with JSDoc types)
- **Build Tool**: Vite
- **PWA**: VitePWA plugin
- **Storage**: IndexedDB (via idb) + localStorage
- **Backend**: Odoo JSON-RPC API
- **Deployment**: Vercel (adapter-static)

## 📦 Project Structure

```
fridge_inventory/
├── src/
│   ├── lib/
│   │   ├── odoo.js                 # Odoo API client
│   │   ├── db.js                   # IndexedDB manager
│   │   ├── inventoryUtils.js       # Utility functions
│   │   └── stores/
│   │       └── inventoryCache.js   # Main cache store
│   ├── routes/
│   │   ├── +layout.svelte          # Root layout
│   │   ├── +layout.js              # Layout config
│   │   ├── +page.svelte            # Home page (add items)
│   │   ├── list/
│   │   │   └── +page.svelte        # List view page
│   │   └── api/odoo/
│   │       └── +server.js          # API proxy
│   └── app.html                    # HTML template
├── static/
│   ├── manifest.json               # PWA manifest
│   ├── icon-192.png                # PWA icon (192x192)
│   └── icon-512.png                # PWA icon (512x512)
├── .env.example                    # Environment template
├── .gitignore                      # Git ignore rules
├── package.json                    # Dependencies
├── svelte.config.js                # Svelte config
├── vite.config.js                  # Vite config
├── vercel.json                     # Vercel deployment config
└── README.md                       # This file
```

## 🔧 Configuration

### Odoo Model

The app is configured for the `inventory` model in Odoo. The main field used is:
- `x_name`: Item name

To add more fields:

1. Update `src/lib/inventoryUtils.js` to include new fields in search
2. Modify the form in `src/routes/+page.svelte`
3. Update the display in `src/routes/list/+page.svelte`
4. Add field types in `src/lib/odoo.js` if needed

### PWA Settings

Configure PWA settings in:
- `static/manifest.json`: App name, icons, display mode
- `vite.config.js`: Service worker configuration

### Deployment

The app is configured for Vercel deployment. To deploy:

1. Push code to GitHub/GitLab/Bitbucket
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

Environment variables needed in Vercel:
- `VITE_ODOO_URL`
- `VITE_ODOO_DATABASE`
- `VITE_ODOO_USERNAME`
- `VITE_ODOO_PASSWORD`
- `VITE_ODOO_API_KEY`

## 📊 Cache Strategy

The app uses a dual storage strategy:

1. **localStorage**: Metadata (last sync time, record count)
2. **IndexedDB**: Master data (all inventory records)

### Sync Process

1. On app load: Load from IndexedDB (instant display)
2. Background sync: Fetch new records from Odoo (id > lastRecordId)
3. Update local cache and UI
4. Save new lastRecordId to localStorage

### Optimistic Updates

When creating/deleting records:
1. Update UI immediately
2. Save to IndexedDB
3. Sync with Odoo in background
4. Handle errors gracefully with user feedback

## 🐛 Troubleshooting

### Build Errors

If you encounter build errors, ensure:
- Node.js version is 18+
- All dependencies are installed (`npm install`)
- Environment variables are set

### Odoo Connection Issues

- Verify Odoo URL is accessible
- Check credentials in `.env`
- Ensure API key has necessary permissions
- Check CORS settings on Odoo instance

### PWA Not Installing

- Ensure HTTPS is enabled (required for PWA)
- Check manifest.json is accessible
- Verify icons are present in `static/`
- Clear browser cache and try again

## 📄 License

This project is generated using the odoo-pwa-generator plugin.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For issues and questions, please open an issue in the repository.
