// Main barrel export for all components
//
// ARCHITECTURE: Chrome vs Content
// - Chrome: Structural HUD framework (always present, fixed positioning)
// - Content: User-created tool instances (dynamic, world-space positioned)
// See ARCHITECTURE.md for detailed explanation

// Chrome components (HUD frame/shell - structural framework)
export * from './chrome';

// Canvas components (spatial workspace)
// Note: DraggableWindow is a CONTENT container, not chrome
// ContextZone and Canvas are CHROME (visual reference/framework)
export * from './canvas';

// Overlay components (modals/drawers/palettes - chrome overlays)
export * from './overlays';

// Shared components (reusable UI - used by both chrome and content)
export * from './shared';

// Tool registry (chrome concept - defines available tool types)
// Tool instances (content) are created via WindowState + DraggableWindow
export { getToolComponent, getToolsByCategory, getAllTools, type ToolDefinition } from './tools/registry';
