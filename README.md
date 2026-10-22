# AKV — Entrepreneurs & Ecosystem Directory Platform

> High-performance geospatial and AI-assisted directory platform for regional entrepreneurs, startups, hubs, and investors.

---

## Architecture Overview

**AKV** is a dedicated installation of the Entrepreneurs Ecosystem Directory, focused on:
- **Main Portal** (`index.html`): Interactive Leaflet geospatial map with clustering, regional filtering, and AI advisor.
- **Admin Management** (`admin.html`): Real-time administrative controls and profile synchronization.
- **Shared Backend**: Seamless two-way synchronization with Google Sheets via Google Apps Script.

---

## Getting Started

### Prerequisites
- Node.js 18.0.0 or higher
- npm 9.0.0 or higher

### Installation & Setup
```bash
# Install dependencies
npm install

# Start local development server (port 5175)
npm run dev
```

### Verification & Testing
```bash
# Run Vitest test suite
npm test

# Run ESLint linter
npm run lint

# Compile production bundle
npm run build
```

---

## Deployment (Vercel)

- **Framework**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Entry Points**: `index.html` and `admin.html`
- **Environment Variables**:
  - `VITE_APPS_SCRIPT_URL`: Google Apps Script Web App endpoint.
  - `VITE_GEMINI_API_KEY`: Google Gemini AI API key.
