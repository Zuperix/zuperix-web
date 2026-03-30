import { useState, useEffect, useCallback } from 'react';

interface Point {
  x: number;
  y: number;
}

interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

export const useMarqueeSelection = (
  containerRef: React.RefObject<HTMLElement | null>,
  assetItemSelector: string,
  onSelectionChange: (selectedIds: string[]) => void,
  onSelectionEnd: (selectedIds: string[]) => void
) => {
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState<Point | null>(null);
  const [currentPos, setCurrentPos] = useState<Point | null>(null);
  const [selectionBox, setSelectionBox] = useState<Box | null>(null);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (e.button !== 0) return;
    
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('a')) return;

    const container = containerRef.current;
    if (!container) return;

    // We store start position in viewport coordinates (clientX/Y)
    setIsDragging(true);
    setStartPos({ x: e.clientX, y: e.clientY });
    setCurrentPos({ x: e.clientX, y: e.clientY });
    setSelectionBox(null);
  }, [containerRef]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !startPos || !containerRef.current) return;

    const container = containerRef.current;
    if (!container) return;

    setCurrentPos({ x: e.clientX, y: e.clientY });

    // Auto-scroll logic
    const rect = container.getBoundingClientRect();
    const threshold = 50;
    const speed = 10;

    if (e.clientY < rect.top + threshold) {
      container.scrollTop -= speed;
    } else if (e.clientY > rect.bottom - threshold) {
      container.scrollTop += speed;
    }

    const left = Math.min(startPos.x, e.clientX);
    const top = Math.min(startPos.y, e.clientY);
    const width = Math.abs(startPos.x - e.clientX);
    const height = Math.abs(startPos.y - e.clientY);

    // Box for visual rendering (re-transformed into container coordinates)
    const containerRect = container.getBoundingClientRect();
    setSelectionBox({
      left: left - containerRect.left + container.scrollLeft,
      top: top - containerRect.top + container.scrollTop,
      width,
      height,
    });

    // Calculate intersections using viewport coordinates
    const items = container.querySelectorAll(assetItemSelector);
    const selectedIds: string[] = [];

    const marqueeRect = {
      left,
      top,
      right: left + width,
      bottom: top + height,
    };

    items.forEach((item) => {
      const itemElement = item as HTMLElement;
      const assetId = itemElement.getAttribute('data-asset-id');
      if (!assetId) return;

      const itemRect = itemElement.getBoundingClientRect();

      if (
        marqueeRect.left < itemRect.right &&
        marqueeRect.right > itemRect.left &&
        marqueeRect.top < itemRect.bottom &&
        marqueeRect.bottom > itemRect.top
      ) {
        selectedIds.push(assetId);
      }
    });

    onSelectionChange(selectedIds);
  }, [isDragging, startPos, assetItemSelector, onSelectionChange, containerRef]);

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      if (startPos && currentPos) {
        const width = Math.abs(startPos.x - currentPos.x);
        const height = Math.abs(startPos.y - currentPos.y);

        if (width < 3 && height < 3) {
          onSelectionEnd([]);
        } else {
          // Final selection calculation ... (could be cached from mouseMove but let's be safe)
          const left = Math.min(startPos.x, currentPos.x);
          const top = Math.min(startPos.y, currentPos.y);
          const marqueeRect = {
            left,
            top,
            right: left + width,
            bottom: top + height,
          };

          const container = containerRef.current;
          if (container) {
            const items = container.querySelectorAll(assetItemSelector);
            const finalIds: string[] = [];
            items.forEach((item) => {
              const itemElement = item as HTMLElement;
              const assetId = itemElement.getAttribute('data-asset-id');
              const itemRect = itemElement.getBoundingClientRect();
              if (
                assetId &&
                marqueeRect.left < itemRect.right &&
                marqueeRect.right > itemRect.left &&
                marqueeRect.top < itemRect.bottom &&
                marqueeRect.bottom > itemRect.top
              ) {
                finalIds.push(assetId);
              }
            });
            onSelectionEnd(finalIds);
          }
        }
      }
    }
    
    setIsDragging(false);
    setStartPos(null);
    setCurrentPos(null);
    setSelectionBox(null);
  }, [isDragging, startPos, currentPos, containerRef, assetItemSelector, onSelectionEnd]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [containerRef, handleMouseDown, handleMouseMove, handleMouseUp]);

  return {
    isDragging,
    selectionBox,
  };
};
