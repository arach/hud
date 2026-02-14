# CLAUDE.md

Project instructions for Claude Code working with the HUD codebase.

## Project Overview

HUD is a spatial canvas interface for organizing context, windows, and workflows. Built with React 19 + TypeScript 5.8 + Vite 6 + TailwindCSS 3. Production URL: `https://hud.arach.dev`

## Commands

```bash
pnpm dev      # Start dev server
pnpm build    # Production build
pnpm preview  # Preview production build
pnpm og       # Generate OG image (uses @arach/og)
```

## Architecture

The app separates **Chrome** (persistent structural UI) from **Content** (dynamic user windows). See `ARCHITECTURE.md` for full details.

### Chrome (Fixed viewport, always present)
- `HUDFrame` - Root container, manages 3 render layers (canvas, world content, static HUD)
- `NavigationStack` - Top bar: context switching, namespace query input
- `ContextManifest` - Left sidebar: window list, tasks, logs, minimap
- `InspectorPanel` - Right sidebar: inspector, voice transcripts
- `StatusBar` - Bottom bar: pan/scale info, toggles
- `CommandDock` - Bottom-right floating action buttons
- `ContextBar` / `ContextDock` - Context definitions, view mode selector
- `ZoomControls` - Floating zoom buttons
- `Canvas` - Pan/zoom surface with dot grid background
- `ContextZone` - Visual workspace boundary indicators

### Content (World-space, dynamic)
- `DraggableWindow` - Resizable window container positioned in canvas
- Tool components loaded via `components/tools/registry.ts` (lazy-loaded with `React.lazy`)

### Overlays
- `CommandPalette` - `Cmd+K` command search
- `TerminalDrawer` - Sliding chat/terminal drawer (`Ctrl+backtick`)
- `ApiKeyModal` - Gemini API key input

### Render Layers (in HUDFrame)
1. **Canvas layer** - Pan/zoom background with dot grid
2. **World content layer** - `scale(${scale})` transformed, contains all DraggableWindows
3. **Static HUD layer** - Fixed viewport chrome panels (z-index 40-60)

## Component Structure

```
components/
  chrome/       # HUD shell: HUDFrame, NavigationStack, ContextManifest, InspectorPanel, StatusBar, CommandDock, ContextBar, ContextDock, ZoomControls
  canvas/       # Spatial: Canvas, DraggableWindow, ContextZone, Minimap
  overlays/     # Modals: CommandPalette, TerminalDrawer, ApiKeyModal
  shared/       # Reusable: ChatInterface, TaskManager, VoiceLog, ScreenDraggable
  tools/        # Window content: registry.ts + CodeEditor, DbSchema, GitGraph, ArchDiagram, PipelineMonitor, LogViewer, DiffViewer, DocsEditor, UiPreview, SystemMonitor, DitherTool, TextLab, SimpleDiff
```

## Key Files

- `App.tsx` - Main layout, all top-level state, tool call dispatch, keyboard handlers (~1000 lines)
- `types.ts` - Core type definitions (WindowState, Task, Message, etc.)
- `constants.ts` - System instructions, AI tool definitions
- `contexts/HudContext.tsx` - Global state provider, CONTEXTS, DEFAULT_WINDOWS, window/task/message management
- `contexts/AuthContext.tsx` - Gemini API key auth
- `hooks/useLiveSession.ts` - Gemini voice/audio integration
- `services/geminiService.ts` - Gemini API client
- `components/canvas/Canvas.tsx` - Pan/zoom canvas with dot grid
- `components/tools/registry.ts` - Tool definitions, lazy loading, `getToolComponent(type)`
- `lib/hudChrome.ts` - CSS constants (HUD_CHROME, PANEL_STYLES, LAYOUT, Z_LAYERS)
- `lib/namespace.ts` - Namespace query matching for window filtering

## State Management

Core state in `HudContext.tsx`, consumed via `useHud()` hook:
- `windows: WindowState[]` - All open windows (NOT persisted, resets on reload)
- `tasks: Task[]` - Task list (persisted to localStorage)
- `messages: Message[]` - Chat history (persisted to localStorage)
- `contexts: ContextDef[]` - Workspace definitions
- `activeContextId` - Current focused context
- `activeView: ViewMode` - spatial | terminals | editors | visuals
- `namespaceQuery` - Hierarchical filter (e.g., "hud.dev.editor")

## Workspace Layout

4 context zones arranged in quadrants:
- **DEV CORE** (top-left, x:0 y:0) - Code editors, docs, tasks
- **BLUEPRINTS** (top-right, x:1800 y:0) - Schema, architecture, git
- **SYSTEM OPS** (bottom-left, x:0 y:1200) - Pipeline, processes, logs
- **VISUAL STUDIO** (bottom-right, x:1800 y:1200) - UI preview, diffs

## Key Features

- **Overview mode**: App starts zoomed out showing all context zones; click to zoom into nearest zone
- **View modes**: Spatial (world positions) or filtered grid (terminals/editors/visuals)
- **Namespace filtering**: Hierarchical scoping via NavigationStack input
- **AI/Voice**: Gemini integration for voice commands and chat (create windows, switch contexts, control tools)
- **Tool registry**: 12+ lazy-loaded tool components with category system (dev/ops/creative/system)
- **Command palette**: `Cmd+K` for quick actions

## OG Image Generation

Config: `og-config.json` | Output: `public/og.png`

```bash
pnpm og
```

Edit `og-config.json` to customize: `title`, `subtitle`, `accent`, `accentSecondary`, `template` (branded/docs/minimal/editor-dark), `tag`
