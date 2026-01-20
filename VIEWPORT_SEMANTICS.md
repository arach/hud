# HUD Viewport Semantics - Visual Guide

## Current State Analysis

### Geographic Definitions

Each workspace has a defined origin in world coordinates:

```
┌─────────────────────────────────────────────────────────────┐
│                    INFINITE CANVAS                          │
│                                                             │
│  ┌──────────────┐              ┌──────────────┐           │
│  │   DEV CORE   │              │  BLUEPRINTS  │           │
│  │  (0, 0)      │              │  (1800, 0)   │           │
│  │  1220×620    │              │  1220×770    │           │
│  └──────────────┘              └──────────────┘           │
│                                                             │
│                                                             │
│  ┌──────────────┐              ┌──────────────┐           │
│  │  SYSTEM OPS  │              │ VISUAL STUDIO │           │
│  │  (0, 1200)   │              │ (1800, 1200) │           │
│  │  1220×770    │              │  1220×720    │           │
│  └──────────────┘              └──────────────┘           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Current Terminology Issues

**Problem 1: "Context" is ambiguous**
- Sometimes means geographic region (workspace)
- Sometimes means filter/scope
- Used inconsistently across codebase

**Problem 2: "View Mode" conflates concepts**
```typescript
type ViewMode = 'spatial' | 'terminals' | 'editors' | 'visuals';
//              ^^^^^^^^   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
//              Layout     Filter
```

**Problem 3: "Scope" is unclear**
- Used in `sendMessage(text, scope?)` - what does it mean?
- Used in UI as `activeScope={activeView.toUpperCase()}` - confusing!

## Proposed Semantic Model

### 1. WORKSPACE (Geographic Region)

A workspace is a **spatial region** in the infinite canvas.

```typescript
interface WorkspaceDef {
  id: WorkspaceId;                    // 'dev' | 'design' | 'ops' | 'studio' | 'global'
  origin: { x: number; y: number };  // World coordinates
  bounds?: { width: number; height: number }; // Visual reference
  color: string;                      // Visual identity
  icon: React.ReactNode;              // Visual identity
  label: string;                      // Display name
}
```

**Key Concept:** Windows belong to a workspace and are positioned relative to that workspace's origin.

### 2. VIEW FILTER (What to Show)

A view filter determines **which windows are visible** based on type.

```typescript
type ViewFilter = 'all' | 'terminals' | 'editors' | 'visuals';
```

**Filtering Logic:**
```
All Windows
    ↓
[Workspace Filter] → Only windows from active workspace (or all if global)
    ↓
[Type Filter] → Only windows matching viewFilter type
    ↓
Visible Windows
```

### 3. LAYOUT MODE (How to Arrange)

A layout mode determines **how windows are positioned**.

```typescript
type LayoutMode = 'spatial' | 'grid';
```

**Spatial Mode:**
- Uses actual world coordinates (`window.x`, `window.y`)
- Preserves window positions
- Allows dragging/resizing
- Windows can be anywhere in the canvas

**Grid Mode:**
- Ignores world coordinates
- Arranges filtered windows in a grid
- Centered on viewport
- Fixed grid cell size (700×500)
- Calculated dynamically based on filtered list

### 4. VIEW STATE (Complete Configuration)

```typescript
interface ViewState {
  activeWorkspaceId: WorkspaceId;  // Which workspace to show
  viewFilter: ViewFilter;          // What types to show
  layoutMode: LayoutMode;          // How to arrange
}
```

## Filtering Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│                    ALL WINDOWS                              │
└─────────────────────────────────────────────────────────────┘
                        ↓
        ┌───────────────────────────┐
        │  WORKSPACE FILTER         │
        │  activeWorkspaceId        │
        └───────────────────────────┘
                        ↓
        ┌───────────────────────────┐
        │  TYPE FILTER              │
        │  viewFilter               │
        └───────────────────────────┘
                        ↓
        ┌───────────────────────────┐
        │  LAYOUT APPLICATION       │
        │  layoutMode               │
        │  - spatial: use coords    │
        │  - grid: calculate grid   │
        └───────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│              RENDERED WINDOWS                               │
└─────────────────────────────────────────────────────────────┘
```

## Example Scenarios

### Scenario 1: Viewing Dev Workspace in Spatial Mode
```typescript
{
  activeWorkspaceId: 'dev',
  viewFilter: 'all',
  layoutMode: 'spatial'
}
```
**Result:** All windows from dev workspace, positioned at their actual coordinates.

### Scenario 2: Viewing All Terminals in Grid Mode
```typescript
{
  activeWorkspaceId: 'global',
  viewFilter: 'terminals',
  layoutMode: 'grid'
}
```
**Result:** All terminal-type windows from all workspaces, arranged in a grid.

### Scenario 3: Viewing Design Editors in Spatial Mode
```typescript
{
  activeWorkspaceId: 'design',
  viewFilter: 'editors',
  layoutMode: 'spatial'
}
```
**Result:** Only editor-type windows from design workspace, at their actual positions.

## Migration Strategy

### Step 1: Add New Types (Non-Breaking)
✅ Create `WorkspaceId`, `ViewFilter`, `LayoutMode` types
✅ Add conversion helpers
✅ Keep existing `ViewMode` for compatibility

### Step 2: Refactor Core Logic
- Update `getSyntheticLayout` to use new semantics
- Separate filter logic from layout logic
- Add clear comments using new terminology

### Step 3: Update Components
- Rename props: `activeContextId` → `activeWorkspaceId`
- Split `ViewMode` into `viewFilter` + `layoutMode`
- Update UI labels and tooltips

### Step 4: Clean Up
- Remove legacy `ViewMode` type
- Update all references
- Update documentation

## Benefits

1. **Clarity**: Each concept has one clear name
2. **Separation**: Filter and layout are independent
3. **Extensibility**: Easy to add new filters or layouts
4. **Type Safety**: Better TypeScript support
5. **Maintainability**: Self-documenting code
