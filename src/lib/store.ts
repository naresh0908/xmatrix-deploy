// Global State Store using Zustand

import { create } from 'zustand';
import { ViewState, SelectedElement, HoveredElement, FilterState, XMatrixData, Relationship, RelationshipStrength, LongTermObjective, AnnualObjective, Initiative, KPI, Owner } from './types';
import { xMatrixData } from './mock-data';

interface XMatrixStore {
  // Data
  data: XMatrixData;
  
  // View State
  viewState: ViewState;
  
  // Filter State
  filterState: FilterState;
  
  // Actions
  setRotation: (rotation: 0 | 90 | 180 | 270) => void;
  rotateClockwise: () => void;
  setSelectedElement: (element: SelectedElement | null) => void;
  setHoveredElement: (element: HoveredElement | null) => void;
  setZoom: (zoom: number) => void;
  toggleDarkMode: () => void;
  toggleSidebar: () => void;
  setTimeHorizon: (horizon: 'current' | 'future') => void;
  
  // Filter Actions
  setOwnerFilter: (owners: string[]) => void;
  setHealthFilter: (health: ('on-track' | 'at-risk' | 'off-track')[]) => void;
  clearFilters: () => void;
  
  // Relationship Actions
  toggleRelationship: (sourceId: string, sourceType: 'lto' | 'ao' | 'initiative' | 'kpi' | 'owner', targetId: string, targetType: 'lto' | 'ao' | 'initiative' | 'kpi' | 'owner') => void;
  
  // Data Entry Actions
  addLongTermObjective: () => void;
  addAnnualObjective: () => void;
  addInitiative: () => void;
  addKPI: () => void;
  addOwner: () => void;
  
  // Computed
  getRelatedElements: (elementId: string, elementType: string) => Set<string>;
  getHighlightedElements: () => Set<string>;
  getActiveRelationships: () => Relationship[];
}

const initialViewState: ViewState = {
  rotation: 0,
  selectedElement: null,
  hoveredElement: null,
  zoom: 1,
  isDarkMode: true,
  sidebarCollapsed: false,
  timeHorizon: 'current',
};

const initialFilterState: FilterState = {
  owners: [],
  health: [],
  objectives: [],
  timeRange: null,
};

export const useXMatrixStore = create<XMatrixStore>((set, get) => ({
  data: xMatrixData,
  viewState: initialViewState,
  filterState: initialFilterState,
  
  setRotation: (rotation) => 
    set((state) => ({ viewState: { ...state.viewState, rotation } })),
  
  rotateClockwise: () =>
    set((state) => {
      const rotations: (0 | 90 | 180 | 270)[] = [0, 90, 180, 270];
      const currentIndex = rotations.indexOf(state.viewState.rotation);
      const nextIndex = (currentIndex + 1) % 4;
      return { viewState: { ...state.viewState, rotation: rotations[nextIndex] } };
    }),
  
  setSelectedElement: (element) =>
    set((state) => ({ viewState: { ...state.viewState, selectedElement: element } })),
  
  setHoveredElement: (element) =>
    set((state) => ({ viewState: { ...state.viewState, hoveredElement: element } })),
  
  setZoom: (zoom) =>
    set((state) => ({ viewState: { ...state.viewState, zoom } })),
  
  toggleDarkMode: () =>
    set((state) => ({ viewState: { ...state.viewState, isDarkMode: !state.viewState.isDarkMode } })),
  
  toggleSidebar: () =>
    set((state) => ({ viewState: { ...state.viewState, sidebarCollapsed: !state.viewState.sidebarCollapsed } })),
  
  setTimeHorizon: (horizon) =>
    set((state) => ({ viewState: { ...state.viewState, timeHorizon: horizon } })),
  
  setOwnerFilter: (owners) =>
    set((state) => ({ filterState: { ...state.filterState, owners } })),
  
  setHealthFilter: (health) =>
    set((state) => ({ filterState: { ...state.filterState, health } })),
  
  clearFilters: () => set({ filterState: initialFilterState }),
  
  // Toggle relationship: none → primary → secondary → none (supports owner relationships)
  toggleRelationship: (sourceId, sourceType, targetId, targetType) =>
    set((state) => {
      const { relationships } = state.data;
      const existingIndex = relationships.findIndex(
        (r) => (r.sourceId === sourceId && r.targetId === targetId) ||
               (r.sourceId === targetId && r.targetId === sourceId)
      );
      
      let newRelationships: Relationship[];
      
      if (existingIndex === -1) {
        // No relationship exists → create primary
        newRelationships = [...relationships, {
          sourceId,
          sourceType,
          targetId,
          targetType,
          strength: 'primary' as RelationshipStrength,
        }];
      } else {
        const existing = relationships[existingIndex];
        if (existing.strength === 'primary') {
          // Primary → Secondary
          newRelationships = [...relationships];
          newRelationships[existingIndex] = { ...existing, strength: 'secondary' as RelationshipStrength };
        } else {
          // Secondary → Remove (none)
          newRelationships = relationships.filter((_, i) => i !== existingIndex);
        }
      }
      
      return {
        data: {
          ...state.data,
          relationships: newRelationships,
        },
      };
    }),
  
  // Add new Long-Term Objective
  addLongTermObjective: () =>
    set((state) => {
      const count = state.data.longTermObjectives.length + 1;
      const newLTO: LongTermObjective = {
        id: `lto-${count}`,
        code: `LTO-${count}`,
        title: `New Long-Term Objective ${count}`,
        description: 'Click to edit description',
        timeframe: '2025-2028',
        health: 'on-track',
      };
      return {
        data: {
          ...state.data,
          longTermObjectives: [...state.data.longTermObjectives, newLTO],
        },
      };
    }),
  
  // Add new Annual Objective
  addAnnualObjective: () =>
    set((state) => {
      const count = state.data.annualObjectives.length + 1;
      const newAO: AnnualObjective = {
        id: `ao-${count}`,
        code: `AO-${count}`,
        title: `New Annual Objective ${count}`,
        description: 'Click to edit description',
        year: 2026,
        health: 'on-track',
        progress: 0,
      };
      return {
        data: {
          ...state.data,
          annualObjectives: [...state.data.annualObjectives, newAO],
        },
      };
    }),
  
  // Add new Initiative
  addInitiative: () =>
    set((state) => {
      const count = state.data.initiatives.length + 1;
      const newInit: Initiative = {
        id: `init-${count}`,
        code: `I-${count}`,
        title: `New Initiative ${count}`,
        description: 'Click to edit description',
        priority: 'medium',
        health: 'on-track',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
      };
      return {
        data: {
          ...state.data,
          initiatives: [...state.data.initiatives, newInit],
        },
      };
    }),
  
  // Add new KPI
  addKPI: () =>
    set((state) => {
      const count = state.data.kpis.length + 1;
      const newKPI: KPI = {
        id: `kpi-${count}`,
        code: `K-${count}`,
        title: `New KPI ${count}`,
        unit: '%',
        currentValue: 0,
        targetValue: 100,
        health: 'on-track',
        trend: 'stable',
        ownerIds: [],
        monthlyData: [],
      };
      return {
        data: {
          ...state.data,
          kpis: [...state.data.kpis, newKPI],
        },
      };
    }),
  
  // Add new Owner
  addOwner: () =>
    set((state) => {
      const count = state.data.owners.length + 1;
      const newOwner: Owner = {
        id: `owner-${count}`,
        name: `Owner ${count}`,
        role: 'Team Member',
        avatar: '',
        initials: `O${count}`,
        responsibilityType: 'responsible',
      };
      return {
        data: {
          ...state.data,
          owners: [...state.data.owners, newOwner],
        },
      };
    }),
  
  getRelatedElements: (elementId: string, elementType: string) => {
    const { relationships } = get().data;
    const related = new Set<string>();
    related.add(elementId);
    
    // Find direct relationships
    relationships.forEach((rel) => {
      if (rel.sourceId === elementId) {
        related.add(rel.targetId);
      }
      if (rel.targetId === elementId) {
        related.add(rel.sourceId);
      }
    });
    
    // Find indirect relationships (through connected elements)
    const directlyRelated = Array.from(related);
    directlyRelated.forEach((relatedId) => {
      relationships.forEach((rel) => {
        if (rel.sourceId === relatedId) {
          related.add(rel.targetId);
        }
        if (rel.targetId === relatedId) {
          related.add(rel.sourceId);
        }
      });
    });
    
    // Add owners for KPIs
    if (elementType === 'kpi') {
      const kpi = get().data.kpis.find(k => k.id === elementId);
      if (kpi) {
        kpi.ownerIds.forEach(ownerId => related.add(ownerId));
      }
    }
    
    // Add KPIs for owners
    if (elementType === 'owner') {
      get().data.kpis.forEach(kpi => {
        if (kpi.ownerIds.includes(elementId)) {
          related.add(kpi.id);
          // Also add initiatives related to those KPIs
          relationships.forEach(rel => {
            if (rel.targetId === kpi.id) {
              related.add(rel.sourceId);
            }
          });
        }
      });
    }
    
    return related;
  },
  
  getHighlightedElements: () => {
    const { viewState } = get();
    const activeElement = viewState.hoveredElement || viewState.selectedElement;
    
    if (!activeElement) return new Set<string>();
    
    return get().getRelatedElements(activeElement.id, activeElement.type);
  },
  
  getActiveRelationships: () => {
    const { viewState, data } = get();
    const activeElement = viewState.hoveredElement || viewState.selectedElement;
    
    if (!activeElement) return [];
    
    return data.relationships.filter(
      (rel) => rel.sourceId === activeElement.id || rel.targetId === activeElement.id
    );
  },
}));
