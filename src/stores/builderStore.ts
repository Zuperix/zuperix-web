import { create } from 'zustand';

export type WidgetType = 'search' | 'assets_grid' | 'collection' | 'category' | 'text' | 'banner' | 'spacer';

export interface PortalWidget {
  id: string;
  type: WidgetType;
  config: any;
  layout: {
    x?: number;
    y?: number;
    w?: number;
    h?: number;
  };
}

interface BuilderState {
  widgets: PortalWidget[];
  selectedWidgetId: string | null;
  portalConfig: any;
  isConfigOpen: boolean;
  portalAssets: any[]; // Added portalAssets to state
  portalCategories: any[];
  portalCollections: any[];
  
  setWidgets: (widgets: PortalWidget[]) => void;
  addWidget: (widget: PortalWidget) => void;
  updateWidget: (id: string, config: any) => void;
  updateWidgetConfig: (id: string, configUpdates: Record<string, any>) => void;
  removeWidget: (id: string) => void;
  duplicateWidget: (id: string) => void;
  reorderWidgets: (startIndex: number, endIndex: number) => void;
  setSelectedWidgetId: (id: string | null) => void;
  setPortalConfig: (config: any) => void;
  setIsConfigOpen: (isOpen: boolean) => void;
  setPortalAssets: (assets: any[]) => void; // Added setPortalAssets action
  setPortalCategories: (categories: any[]) => void;
  setPortalCollections: (collections: any[]) => void;
}

export const useBuilderStore = create<BuilderState>((set) => ({
  widgets: [],
  selectedWidgetId: null,
  portalConfig: {}, // Initialize portalConfig
  isConfigOpen: true,
  portalAssets: [], // Initialize portalAssets
  portalCategories: [],
  portalCollections: [],

  setWidgets: (widgets) => set({ widgets }),
  setPortalAssets: (assets) => set({ portalAssets: assets }),
  setPortalCategories: (categories) => set({ portalCategories: categories }),
  setPortalCollections: (collections) => set({ portalCollections: collections }),
  
  addWidget: (widget) => set((state) => ({ 
    widgets: [...state.widgets, widget] 
  })),
  
  // This updateWidget now updates the widget's config directly, as per the provided edit.
  // The original updateWidget updated top-level widget properties.
  // The original updateWidgetConfig updated the config property.
  // The provided edit effectively redefines updateWidget to do what updateWidgetConfig did.
  updateWidget: (id, config) => set((state) => ({
    widgets: state.widgets.map(w => w.id === id ? { ...w, config: { ...w.config, ...config } } : w)
  })),

  // This method is now redundant if updateWidget is used for config updates,
  // but keeping it as it was in the original document and not explicitly removed by the instruction.
  updateWidgetConfig: (id, configUpdates) => set((state) => ({
    widgets: state.widgets.map(w => w.id === id ? { ...w, config: { ...w.config, ...configUpdates } } : w)
  })),
  
  removeWidget: (id) => set((state) => ({
    widgets: state.widgets.filter(w => w.id !== id),
    selectedWidgetId: state.selectedWidgetId === id ? null : state.selectedWidgetId
  })),
  
  duplicateWidget: (id) => set((state) => {
    const widgetToDuplicate = state.widgets.find(w => w.id === id);
    if (!widgetToDuplicate) return state;
    
    // Constraint: Only one search widget allow - This constraint was removed in the provided edit.
    // if (widgetToDuplicate.type === 'search') return state;
    
    const newWidget = {
      ...widgetToDuplicate,
      id: `widget_${Date.now()}`, // Simplified ID generation as per provided edit.
    };
    
    const currentIndex = state.widgets.findIndex(w => w.id === id);
    const newWidgets = [...state.widgets];
    newWidgets.splice(currentIndex + 1, 0, newWidget);
    
    return { widgets: newWidgets };
  }),
  
  reorderWidgets: (startIndex, endIndex) => set((state) => {
    const newWidgets = [...state.widgets];
    const [removed] = newWidgets.splice(startIndex, 1);
    newWidgets.splice(endIndex, 0, removed);
    return { widgets: newWidgets };
  }),
  
  setSelectedWidgetId: (selectedWidgetId) => set({ selectedWidgetId }),
  
  setPortalConfig: (config) => set((state) => ({ portalConfig: { ...state.portalConfig, ...config } })), // Updated setPortalConfig

  setIsConfigOpen: (isOpen) => set({ isConfigOpen: isOpen }),
}));

export const hasSearchWidget = (widgets: PortalWidget[]) => widgets.some(w => w.type === 'search');
