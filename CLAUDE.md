# CLAUDE.md

Project instructions for Claude Code working with the HUD codebase.

## Project Overview

HUD is a spatial canvas interface for organizing context, windows, and workflows. Built with React + TypeScript + Vite + TailwindCSS.

## Commands

```bash
pnpm dev      # Start dev server
pnpm build    # Production build
pnpm preview  # Preview production build
pnpm og       # Generate OG image (uses @arach/og)
```

## OG Image Generation

The project uses `@arach/og` for Open Graph image generation.

**Config**: `og-config.json`
**Output**: `public/og.png`

To regenerate:
```bash
pnpm og
```

Edit `og-config.json` to customize:
- `title` / `subtitle` - Text content
- `accent` / `accentSecondary` - Brand colors
- `template` - `branded`, `docs`, `minimal`, or `editor-dark`
- `tag` - Badge text (e.g., "Developer Tool")

## Architecture

- **Chrome Panels**: NavigationStack, ContextManifest, InspectorPanel, StatusBar
- **Canvas**: Infinite pan/zoom workspace with context zones and windows
- **Style System**: `lib/hudChrome.ts` defines shared panel styles

## Key Files

- `App.tsx` - Main layout and state
- `components/Canvas.tsx` - Pan/zoom canvas with dot grid
- `lib/hudChrome.ts` - Chrome panel style constants
- `og-config.json` - OG image configuration
