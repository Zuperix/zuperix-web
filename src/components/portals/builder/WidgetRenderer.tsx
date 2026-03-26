'use client';

import React from 'react';
import { PortalWidget } from '@/stores/builderStore';
import SearchWidget from './widgets/SearchWidget';
import AssetsGridWidget from './widgets/AssetsGridWidget';
import CollectionWidget from './widgets/CollectionWidget';
import TextWidget from './widgets/TextWidget';
import BannerWidget from './widgets/BannerWidget';
import SpacerWidget from './widgets/SpacerWidget';
import CategoryWidget from './widgets/CategoryWidget';

export default function WidgetRenderer({ widget, isEditMode = false, context }: { widget: PortalWidget, isEditMode?: boolean, context?: any }) {
  switch (widget.type) {
    case 'search':
      return <SearchWidget widget={widget} isEditMode={isEditMode} context={context} />;
    case 'assets_grid':
      return <AssetsGridWidget widget={widget} isEditMode={isEditMode} context={context} />;
    case 'collection':
      return <CollectionWidget widget={widget} isEditMode={isEditMode} context={context} />;
    case 'category':
      return <CategoryWidget widget={widget} isEditMode={isEditMode} context={context} />;
    case 'text':
      return <TextWidget widget={widget} isEditMode={isEditMode} context={context} />;
    case 'banner':
      return <BannerWidget widget={widget} isEditMode={isEditMode} context={context} />;
    case 'spacer':
      return <SpacerWidget widget={widget} isEditMode={isEditMode} context={context} />;
    default:
      return <div className="p-4 bg-red-900/20 text-red-500 rounded-xl">Unknown widget type: {widget.type}</div>;
  }
}
