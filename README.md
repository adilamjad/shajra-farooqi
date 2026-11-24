# Shajra (شجرة) — Interactive Family Tree & Genealogy Workspace

**Shajra** is a modern, client-side genealogy and family tree visualization web application built with **React 19**, **Vite 8**, and **Lucide React**. It features a movable split-screen workspace pairing an interactive family tree on the left with rich member personal pages and a built-in page studio editor on the right.

---

## Key Features

- **Movable Split-Screen Workspace**:
  - **Left Pane**: Interactive **Tree View** (Focused Pedigree & Full Family Tree modes with pan, zoom, box-zoom, and automatic search panning) and **Table Directory View** (sortable, filterable directory with demographic metrics).
  - **Right Pane**: Dedicated **Member Personal Page** viewer and **Personal Page Studio Editor** separated by a draggable, keyboard-accessible divider.
- **Rich Member Personal Pages**:
  - Custom cover banner, framed portrait with interactive **Crop & Scale Tool**, English & RTL Arabic names, maiden name, and personal tagline.
  - **Biography & Story Chapters**: Multi-chapter articles (e.g., *Early Life*, *Career*, *Memories*, *Legacy*).
  - **Photo Gallery Album**: Multi-photo upload with automatic image compression, captions, dates, locations, and a full-screen lightbox carousel.
  - **Chronological Life Timeline**: Automatically combines vital family milestones (birth, children's births, passing) with custom life events.
  - **Family Ties**: Clickable cards for Parents, Spouse, Children, and Siblings that pan the tree and open the relative's personal page.
- **Bilingual CSV & JSON Portability**:
  - Import and export full backups via **JSON** or spreadsheet-friendly **CSV** (supporting both English and Arabic column headers).
- **Local-First Storage**:
  - Persists family trees and photo galleries locally in the browser using **IndexedDB** with `localStorage` fallback.

---

## Getting Started

### Prerequisites
- **Node.js** (v18+ recommended)
- **npm**

### Installation & Development

```bash
# Install dependencies
npm install

# Start local development server
npm run dev
```

### Linting & Production Build

```bash
# Run Oxlint
npm run lint

# Build production bundle into dist/
npm run build

# Preview production build locally
npm run preview
```

---

## Project Structure

```text
Shajra/
├── files/                          # Sample lineage CSV datasets
├── public/                         # Static assets & favicon
├── src/
│   ├── components/
│   │   ├── BulkImport.jsx          # CSV & JSON drag-and-drop importer
│   │   ├── ExportModal.jsx         # JSON backup & CSV spreadsheet exporter
│   │   ├── GenderAvatar.jsx        # Default gender-styled avatar SVG
│   │   ├── Header.jsx              # Top navigation, search auto-pan & filters
│   │   ├── MemberForm.jsx          # Add/Edit member & relative links modal
│   │   ├── MemberPersonalPage.jsx  # Right-pane member personal page & lightbox
│   │   ├── PersonCard.jsx          # Interactive family tree node card
│   │   ├── PersonalPageEditor.jsx  # Studio tool for editing chapters, photos & timeline
│   │   ├── PhotoCropModal.jsx      # HTML5 Canvas photo crop, zoom, rotate & fit tool
│   │   ├── TableView.jsx           # Sortable/filterable family directory table
│   │   └── TreeViewer.jsx          # Interactive SVG & HTML family tree canvas
│   ├── utils/
│   │   ├── dataHelper.ts           # Bilingual CSV parser, exporter & age calculator
│   │   ├── mockData.ts             # Initial sample family tree with personal pages
│   │   └── storageHelper.ts        # IndexedDB persistence & client image compression
│   ├── App.jsx                     # Split-screen workspace & state orchestration
│   ├── main.jsx                    # Application entry point
│   └── types.ts                    # TypeScript interfaces for Person & PersonalPageData
├── index.html
├── package.json
└── vite.config.js
```
