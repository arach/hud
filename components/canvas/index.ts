// Canvas components - Spatial canvas components
// 
// CHROME (framework):
// - Canvas: Pan/zoom surface (framework infrastructure)
// - ContextZone: Visual workspace boundaries (reference only)
// - Minimap: Navigation overview (chrome overlay)
//
// CONTENT (user instances):
// - DraggableWindow: Container for user-created tool instances (content)
//
// See ARCHITECTURE.md for distinction between Chrome and Content.
export { default as Canvas, type CanvasDebugState } from './Canvas';
export { default as DraggableWindow } from './DraggableWindow';
export { default as ContextZone } from './ContextZone';
export { default as Minimap } from './Minimap';
