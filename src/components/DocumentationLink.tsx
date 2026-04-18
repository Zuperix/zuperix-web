'use client';

import React from 'react';
import { BookOpenIcon } from '@heroicons/react/24/outline';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/20/solid';

interface DocumentationLinkProps {
  href: string;
  label?: string;
}

const DocumentationLink: React.FC<DocumentationLinkProps> = ({ 
  href, 
  label = "View Documentation" 
}) => {
  return (
    <div className="flex justify-end pt-12 pb-6">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 hover:text-blue-400 transition-all duration-300"
      >
        <BookOpenIcon className="h-4 w-4 text-gray-600 group-hover:text-blue-500 transition-colors" />
        <span>{label}</span>
        <ArrowTopRightOnSquareIcon className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-all -translate-y-1 group-hover:translate-y-0" />
      </a>
    </div>
  );
};

export default DocumentationLink;
