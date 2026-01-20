# HUD Viewport Semantics - Revamped Terminology

## Problem Statement

The current codebase uses inconsistent terminology:
- **"Context"** sometimes means geographic region, sometimes means filter
- **"Scope"** is used inconsistently (AI context vs UI filter)
- **"View Mode"** conflates two concepts: filter (what to show) and layout (how to arrange)
- **"Sector"** appears in comments but isn't consistently used

## Proposed Semantic Model

### 1. **WORKSPACE** (Geographic Region)
**Old term:** `contextId`, "Context"

A **workspace** is a geographic region in the infinite canvas with:
- A unique identifier (`WorkspaceId`)
- An origin point in world coordinates (`x, y`)
- Visual properties (color, icon, label)
- Optional bounding box dimensions

**Examples:**
- `dev` - Development workspace at origin (0, 0)
- `design` - Design workspace at origin (1800, 0)
- `ops` - Operations workspace at origin (0, 1200)
- `studio` - Visual studio workspace at origin (1800, 1200)
- `global` - Special workspace showing all workspaces

**Key Properties:**
- Windows belong to exactly one workspace (`workspaceId` on `WindowState`)
- Each workspace has its own coordinate space (relative to its origin)
- Workspaces are spatially separated to avoid overlap

### 2. **VIEW FILTER** (What to Show)
**Old term:** Part of `ViewMode` (`'terminals' | 'editors' | 'visuals'`)

A **view filter** determines which windows are visible based on their type:
- `all` - Show all window types
- `terminals` - Only show terminal-type windows
- `editors` - Only show editor-type windows  
- `visuals` - Only show visual-type windows

**Key Properties:**
- Independent of layout/arrangement
- Applied after workspace filtering
- Can be combined with any layout mode

### 3. **LAYOUT MODE** (How to Arrange)
**Old term:** Part of `ViewMode` (`'spatial'`)

A **layout mode** determines how windows are arranged:
- `spatial` - Use actual world coordinates (windows positioned where they are)
- `grid` - Auto-arrange filtered windows in a grid pattern

**Key Properties:**
- `spatial` preserves window positions and allows free movement
- `grid` ignores world coordinates and arranges by index
- Only `spatial` mode allows dragging/resizing

### 4. **VIEWPORT STATE** (Camera)
The viewport represents the "camera" viewing the canvas:
- `panOffset` - Camera position in world coordinates
- `scale` - Zoom level
- `width/height` - Screen dimensions

### 5. **VIEW STATE** (Current View Configuration)
Combines workspace, filter, and layout:
```typescript
interface ViewState {
  activeWorkspaceId: WorkspaceId;  // Which workspace is active
  viewFilter: ViewFilter;          // What types to show
  layoutMode: LayoutMode;          // How to arrange
}
```

## Geographic Definitions

### Workspace Origins
```typescript
const WORKSPACE_ORIGINS = {
  dev: { x: 0, y: 0 },
  design: { x: 1800, y: 0 },
  ops: { x: 0, y: 1200 },
  studio: { x: 1800, y: 1200 },
  global: { x: 0, y: 0 } // Special: shows all workspaces
};
```

### Workspace Bounds (Optional)
Each workspace can define a bounding box for visual reference:
- `dev`: 1220 × 620
- `design`: 1220 × 770
- `ops`: 1220 × 770
- `studio`: 1220 × 720

## Filtering Hierarchy

Windows are filtered in this order:

1. **Workspace Filter** (Level 1)
   - If `activeWorkspaceId !== 'global'`, only show windows where `window.workspaceId === activeWorkspaceId`
   - If `activeWorkspaceId === 'global'`, show windows from all workspaces

2. **Type Filter** (Level 2)
   - Apply `viewFilter` to window types
   - `all` → show all types
   - `terminals` → only `type === 'terminal'`
   - `editors` → only `type === 'editor'`
   - `visuals` → only `type === 'visual'`

3. **Layout Application** (Level 3)
   - `spatial`: Use window's actual `x, y, w, h`
   - `grid`: Calculate grid position based on filtered list index

## Migration Path

### Phase 1: Add New Types (Non-Breaking)
- Add `WorkspaceId`, `ViewFilter`, `LayoutMode` types
- Add helper functions for conversion
- Keep existing `ViewMode` type for backward compatibility

### Phase 2: Update Internal Logic
- Refactor `getSyntheticLayout` to use new semantics
- Update filtering logic to use `ViewFilter` and `LayoutMode`
- Keep `activeContextId` → `activeWorkspaceId` mapping

### Phase 3: Update UI Components
- Rename `ContextBar` → `WorkspaceBar` (or keep name, update semantics)
- Update `ContextDock` to separate filter from layout
- Update all prop names and comments

### Phase 4: Remove Legacy Terms
- Remove `ViewMode` type
- Remove `contextId` → use `workspaceId`
- Update all references

## Terminology Mapping

| Old Term | New Term | Notes |
|----------|----------|-------|
| `contextId` | `workspaceId` | Geographic region |
| `activeContextId` | `activeWorkspaceId` | Currently active workspace |
| `ViewMode` | `ViewFilter` + `LayoutMode` | Split into two concepts |
| `'spatial'` | `LayoutMode.spatial` | Layout concept |
| `'terminals'` | `ViewFilter.terminals` | Filter concept |
| `'editors'` | `ViewFilter.editors` | Filter concept |
| `'visuals'` | `ViewFilter.visuals` | Filter concept |
| `scope` (in sendMessage) | `workspaceId` or `viewFilter` | Clarify what it means |
| "Sector" (comments) | `Workspace` | Use consistently |

## Benefits

1. **Clarity**: Each concept has a single, clear name
2. **Separation of Concerns**: Filter and layout are independent
3. **Extensibility**: Easy to add new filters or layout modes
4. **Type Safety**: Better TypeScript types prevent confusion
5. **Documentation**: Self-documenting code with clear semantics
