'use client';

import React, { useState } from 'react';
import { 
  ChevronRightIcon, 
  ChevronDownIcon, 
  FolderIcon,
  PlusIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/outline';
import { Category } from '@/hooks/useCategories';

interface CategoryTreeProps {
  categories: Category[];
  onSelect: (category: Category) => void;
  onAddChild?: (parentId: string) => void;
  selectedId?: string;
  depth?: number;
}

export default function CategoryTree({ 
  categories, 
  onSelect, 
  onAddChild,
  selectedId, 
  depth = 0 
}: CategoryTreeProps) {
  return (
    <div className="flex flex-col gap-0.5">
      {categories.map((category) => (
        <CategoryItem
          key={category.id}
          category={category}
          onSelect={onSelect}
          onAddChild={onAddChild}
          selectedId={selectedId}
          depth={depth}
        />
      ))}
    </div>
  );
}

function CategoryItem({ 
  category, 
  onSelect, 
  onAddChild,
  selectedId, 
  depth 
}: { 
  category: Category; 
  onSelect: (c: Category) => void;
  onAddChild?: (id: string) => void;
  selectedId?: string;
  depth: number;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = category.children && category.children.length > 0;
  const isSelected = selectedId === category.id;

  return (
    <div>
      <div 
        className={`group flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-all duration-150 ${
          isSelected 
            ? 'bg-blue-600/15 text-blue-400' 
            : 'text-gray-500 hover:bg-gray-800/60 hover:text-gray-200'
        }`}
        style={{ paddingLeft: `${(depth * 12) + 12}px` }}
        onClick={() => onSelect(category)}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className={`p-0.5 rounded-md hover:bg-gray-700/50 transition-colors ${!hasChildren && 'invisible'}`}
        >
          {isOpen ? (
            <ChevronDownIcon className="h-3 w-3" />
          ) : (
            <ChevronRightIcon className="h-3 w-3" />
          )}
        </button>
        
        <FolderIcon className={`h-3.5 w-3.5 ${isSelected ? 'text-blue-400' : 'text-gray-500'}`} />
        <span className="text-xs font-medium truncate flex-1">{category.name}</span>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onAddChild && (
            <button 
              onClick={(e) => { e.stopPropagation(); onAddChild(category.id); }}
              className="p-1 rounded-md hover:bg-gray-700/50 text-gray-400 hover:text-blue-400"
            >
              <PlusIcon className="h-3 w-3" />
            </button>
          )}
          <button className="p-1 rounded-md hover:bg-gray-700/50 text-gray-400 hover:text-gray-200">
            <EllipsisVerticalIcon className="h-3 w-3" />
          </button>
        </div>
      </div>

      {isOpen && hasChildren && (
        <CategoryTree
          categories={category.children!}
          onSelect={onSelect}
          onAddChild={onAddChild}
          selectedId={selectedId}
          depth={depth + 1}
        />
      )}
    </div>
  );
}
