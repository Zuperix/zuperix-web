import { useState } from 'react';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import { StarIcon as StarOutline } from '@heroicons/react/24/outline';

interface StarRatingProps {
  value: number;
  totalRatings?: number;
  interactive?: boolean;
  onRate?: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export default function StarRating({
  value,
  totalRatings,
  interactive = false,
  onRate,
  size = 'md',
  label
}: StarRatingProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  const starSize = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-8 w-8'
  };

  const getStarColor = (index: number) => {
    const current = hovered !== null ? hovered : value;
    if (index <= current) return 'text-yellow-400';
    return 'text-gray-300 dark:text-gray-600';
  };

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
          {label}
        </span>
      )}
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((index) => (
          <button
            key={index}
            disabled={!interactive}
            onClick={() => interactive && onRate?.(index)}
            onMouseEnter={() => interactive && setHovered(index)}
            onMouseLeave={() => interactive && setHovered(null)}
            className={`transition-all duration-200 ${interactive ? 'hover:scale-125 cursor-pointer' : 'cursor-default'}`}
          >
            {index <= (hovered !== null ? hovered : Math.round(value)) ? (
              <StarSolid className={`${starSize[size]} ${getStarColor(index)}`} />
            ) : (
              <StarOutline className={`${starSize[size]} ${getStarColor(index)}`} />
            )}
          </button>
        ))}
        {totalRatings !== undefined && (
          <span className="ml-2 text-sm text-gray-500 font-medium">
            ({totalRatings})
          </span>
        )}
      </div>
    </div>
  );
}
