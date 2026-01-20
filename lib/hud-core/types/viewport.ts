/**
 * VIEWPORT SEMANTICS - Revamped Terminology
 * 
 * The HUD uses a multi-dimensional coordinate system with clear separation of concerns:
 * 
 * 1. WORKSPACE (formerly "Context")
 *    - A geographic region in the infinite canvas
 *    - Has an origin point (x, y) in world coordinates
 *    - Windows belong to a workspace
 *    - Examples: dev, design, ops, studio, global
 * 
 * 2. VIEW FILTER (formerly part of "View Mode")
 *    - Determines which windows are visible based on type
 *    - Independent of layout/arrangement
 *    - Examples: all, terminals, editors, visuals
 * 
 * 3. LAYOUT MODE (formerly part of "View Mode")
 *    - How windows are arranged/displayed
 *    - Examples: spatial (uses world coords), grid (auto-arranged)
 * 
 * 4. VIEWPORT STATE
 *    - Current camera position (panOffset)
 *    - Current zoom level (scale)
 *    - Screen dimensions
 */

export type WorkspaceId = 'global' | 'dev' | 'design' | 'ops' | 'studio';

export type ViewFilter = 'all' | 'terminals' | 'editors' | 'visuals';

export type LayoutMode = 'spatial' | 'grid';

import React from 'react';

export interface WorkspaceDef {
  id: WorkspaceId;
  label: string;
  origin: { x: number; y: number }; // World coordinates
  color: string;
  icon: React.ReactNode;
  bounds?: { width: number; height: number }; // Optional bounding box
}

export interface ViewportState {
  panOffset: { x: number; y: number };
  scale: number;
  width: number;
  height: number;
}

export interface ViewState {
  activeWorkspaceId: WorkspaceId;
  viewFilter: ViewFilter;
  layoutMode: LayoutMode;
}

/**
 * Helper to derive the effective view mode from ViewState
 * This maintains backward compatibility while using clearer semantics
 */
export function getViewMode(state: ViewState): string {
  if (state.layoutMode === 'spatial') {
    return 'spatial';
  }
  return state.viewFilter; // grid mode uses filter name
}

/**
 * Helper to parse a legacy view mode string into ViewState
 */
export function parseViewMode(mode: string): Partial<ViewState> {
  if (mode === 'spatial') {
    return { layoutMode: 'spatial', viewFilter: 'all' };
  }
  return { 
    layoutMode: 'grid', 
    viewFilter: mode as ViewFilter 
  };
}
