/**
 * HUD Chrome Style Constants
 * Unified visual treatment for all HUD chrome panels
 */

export const HUD_CHROME = {
  // Stronger blur than current md
  blur: 'backdrop-blur-xl',

  // Semi-transparent dark background
  bg: 'bg-black/85',

  // Border with subtle definition
  border: 'border border-neutral-800/80',

  // Edge shadow for depth separation
  shadow: 'shadow-[0_0_30px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.05)]',

  // Top highlight line (use with relative positioning)
  topHighlight: 'before:absolute before:top-0 before:left-0 before:right-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent',
} as const;

// Combined chrome base styles
export const CHROME_BASE = `${HUD_CHROME.bg} ${HUD_CHROME.blur} ${HUD_CHROME.border} ${HUD_CHROME.shadow}`;

// Panel-specific styles
export const PANEL_STYLES = {
  // Navigation stack at top - edge-to-edge
  navigationStack: `fixed top-0 left-0 right-0 z-50`,

  // Manifest rail on left - starts below nav (48px), ends above status (28px)
  manifest: `${CHROME_BASE} fixed top-[48px] left-0 bottom-[28px] w-[280px] z-40 rounded-none border-l-0 border-t-0 overflow-hidden`,

  // Inspector rail on right - starts below nav (48px), ends above status (28px)
  inspector: `${CHROME_BASE} fixed top-[48px] right-0 bottom-[28px] w-[280px] z-40 rounded-none border-r-0 border-t-0 overflow-hidden`,

  // Minimap in bottom-left corner - above status bar
  minimap: `bg-black/90 backdrop-blur-xl border border-neutral-800/80 shadow-[0_0_20px_rgba(0,0,0,0.7)] fixed left-0 bottom-[28px] z-[45] rounded-none border-l-0 border-b-0 overflow-hidden`,

  // Status bar at bottom - edge-to-edge
  statusBar: `bg-[#09090b]/95 backdrop-blur-xl border-t border-neutral-800 shadow-[0_-5px_30px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.03)] fixed bottom-0 left-0 right-0 z-[60]`,

  // Command dock at bottom-right
  commandDock: `bg-black/90 backdrop-blur-xl border border-neutral-800/80 shadow-[0_0_20px_rgba(0,0,0,0.7)] fixed right-0 bottom-[28px] z-[45] rounded-none border-r-0 border-b-0 overflow-hidden`,
} as const;

// Edge fade effects for panels that border the canvas
export const EDGE_EFFECTS = {
  // Right edge fade (for left panels like Manifest)
  rightFade: 'after:absolute after:top-0 after:right-0 after:bottom-0 after:w-4 after:bg-gradient-to-l after:from-transparent after:to-black/20 after:pointer-events-none',

  // Left edge fade (for right panels like Inspector)
  leftFade: 'after:absolute after:top-0 after:left-0 after:bottom-0 after:w-4 after:bg-gradient-to-r after:from-transparent after:to-black/20 after:pointer-events-none',

  // Bottom edge glow (for top panels)
  bottomGlow: 'after:absolute after:bottom-0 after:left-0 after:right-0 after:h-8 after:bg-gradient-to-t after:from-black/30 after:to-transparent after:pointer-events-none',
} as const;

// Z-index reference
export const Z_LAYERS = {
  canvas: 0,
  contextZones: 10,
  windows: 20,
  manifest: 40,
  inspector: 40,
  minimap: 45,
  navigationStack: 50,
  statusBar: 60,
  terminal: 70,
  modals: 100,
} as const;

// Layout measurements
export const LAYOUT = {
  // Navigation stack - edge-to-edge
  navStackHeight: 48,

  // Side panels
  panelWidth: 280,
  panelTopOffset: 48, // navStackHeight

  // Status bar
  statusBarHeight: 28,

  // Minimap
  minimapWidth: 200,
  minimapHeight: 150,

  // Bottom offset for panels (status bar height)
  panelBottomOffset: 28,
} as const;
