# HUD

A spatial canvas interface for organizing context, windows, and workflows.

![HUD Interface](https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6)

## Quick Start

```bash
pnpm install
pnpm dev
```

Set `GEMINI_API_KEY` in `.env.local` for voice/AI features.

## Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Production build |
| `pnpm preview` | Preview production build |
| `pnpm og` | Generate Open Graph image |

## Architecture

### Component Structure

```
components/
├── chrome/              # HUD frame & shell
│   ├── HUDFrame         # Main container with canvas
│   ├── NavigationStack  # Context breadcrumb navigation
│   ├── ContextBar       # Context definitions & types
│   ├── ContextDock      # View mode selector
│   ├── ContextManifest  # Left sidebar - windows, tasks, logs
│   ├── InspectorPanel   # Right sidebar - details, voice chat
│   ├── StatusBar        # Bottom status indicators
│   ├── CommandDock      # Quick action buttons
│   └── ZoomControls     # Canvas zoom controls
│
├── canvas/              # Spatial workspace
│   ├── Canvas           # Infinite pan/zoom with dot grid
│   ├── DraggableWindow  # Resizable window container
│   ├── ContextZone      # Visual context boundaries
│   └── Minimap          # Navigation overview
│
├── overlays/            # Modal & drawer components
│   ├── CommandPalette   # ⌘K command search
│   ├── TerminalDrawer   # Sliding chat/terminal panel
│   └── ApiKeyModal      # API key configuration
│
├── shared/              # Reusable UI components
│   ├── ChatInterface    # Chat message display
│   ├── TaskManager      # Task list management
│   ├── VoiceLog         # Voice transcript display
│   └── ScreenDraggable  # Drag utility wrapper
│
├── tools/               # Window content modules
│   ├── registry.ts      # Tool definitions & lazy loading
│   ├── CodeEditor       # Syntax-highlighted code view
│   ├── DbSchema         # Database schema visualizer
│   ├── GitGraph         # Git commit history
│   ├── ArchDiagram      # Architecture diagram
│   ├── PipelineMonitor  # CI/CD pipeline status
│   ├── LogViewer        # Log stream viewer
│   ├── DiffViewer       # File diff comparison
│   ├── DocsEditor       # Markdown documentation
│   ├── UiPreview        # UI component preview
│   ├── SystemMonitor    # System metrics charts
│   ├── DitherTool       # Image dithering lab
│   ├── TextLab          # Text editing with AI
│   └── SimpleDiff       # Inline diff component
│
└── index.ts             # Barrel exports
```

### Tool Registry

Tools are registered in `components/tools/registry.ts` with lazy loading:

```typescript
import { getToolComponent, getAllTools, getToolsByCategory } from './components';

// Get a tool component by type
const CodeEditor = getToolComponent('code');

// Get all tools in a category
const devTools = getToolsByCategory('dev');

// Categories: 'dev' | 'ops' | 'creative' | 'system'
```

### Key Directories

| Directory | Purpose |
|-----------|---------|
| `components/` | React components (organized by concern) |
| `contexts/` | React contexts (HudContext, AuthContext) |
| `hooks/` | Custom hooks (useLiveSession, etc.) |
| `lib/` | Utilities (hudChrome, namespace, logger) |
| `types.ts` | TypeScript type definitions |
| `constants.ts` | App constants and tool definitions |

## Features

- **Infinite Canvas**: Pan and zoom workspace with dot grid background
- **Context Zones**: Visual boundaries for organizing related windows
- **View Modes**: Spatial, Terminals, Editors, Visuals
- **Command Palette**: `⌘K` for quick actions
- **Voice Integration**: Gemini-powered voice commands
- **Tool Windows**: Lazy-loaded specialized content modules

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘K` | Open command palette |
| `Ctrl+`` ` | Toggle terminal drawer |

## Tech Stack

- **React 19** + TypeScript
- **Vite** for dev/build
- **TailwindCSS** for styling
- **Recharts** for data visualization
- **Lucide** for icons
- **Google Gemini** for AI/voice features

## Configuration

### Environment Variables

```bash
# .env.local
GEMINI_API_KEY=your_api_key_here
```

### OG Image

Edit `og-config.json` to customize social preview:

```json
{
  "title": "HUD",
  "subtitle": "Spatial Canvas Interface",
  "template": "branded"
}
```

Generate with `pnpm og`.
