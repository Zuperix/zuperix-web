'use client';

import React from 'react';
import { 
  Square3Stack3DIcon, 
  PlusIcon,
} from '@heroicons/react/24/outline';
import { Collection } from '@/hooks/useCollections';

interface CollectionListProps {
  collections: Collection[];
  onSelect: (collection: Collection) => void;
  onCreate?: () => void;
  selectedId?: string;
}

export default function CollectionList({ 
  collections, 
  onSelect, 
  onCreate,
  selectedId 
}: CollectionListProps) {
  return (
    <div className="flex flex-col gap-0.5 px-3">
      {collections.map((collection) => (
        <div
          key={collection.id}
          onClick={() => onSelect(collection)}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all duration-150 ${
            selectedId === collection.id 
              ? 'bg-indigo-600/15 text-indigo-400' 
              : 'text-gray-500 hover:bg-gray-800/60 hover:text-gray-200'
          }`}
        >
          <Square3Stack3DIcon className={`h-4 w-4 ${selectedId === collection.id ? 'text-indigo-400' : 'text-gray-500'}`} />
          <span className="text-sm font-medium truncate">{collection.name}</span>
        </div>
      ))}
      
      {onCreate && (
        <button
          onClick={onCreate}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:text-gray-300 hover:bg-gray-800/40 transition-all border border-dashed border-gray-800/60 mt-2"
        >
          <PlusIcon className="h-4 w-4" />
          <span className="text-xs font-medium uppercase tracking-wider">New Collection</span>
        </button>
      )}
    </div>
  );
}
