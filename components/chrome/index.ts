// Chrome components - HUD frame/shell components
// These are STRUCTURAL FRAMEWORK components (always present, fixed positioning)
// They provide the HUD interface infrastructure, not user-created content.
// See ARCHITECTURE.md for distinction between Chrome and Content.
export { default as HUDFrame } from './HUDFrame';
export { default as NavigationStack } from './NavigationStack';
export { default as ContextBar, type ContextDef } from './ContextBar';
export { default as ContextDock, type ViewMode } from './ContextDock';
export { default as ContextManifest } from './ContextManifest';
export { default as InspectorPanel } from './InspectorPanel';
export { default as StatusBar } from './StatusBar';
export { default as CommandDock } from './CommandDock';
export { default as ZoomControls } from './ZoomControls';
