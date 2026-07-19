import { useCallback, useState } from "react";
import { Track } from "../types/index.js";

interface DragItem {
  type: "track";
  track: Track;
  index: number;
}

export function useDragDrop() {
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);
  const [dropTarget, setDropTarget] = useState<number | null>(null);

  const handleDragStart = useCallback((track: Track, index: number) => {
    setDraggedItem({ type: "track", track, index });
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedItem(null);
    setDropTarget(null);
  }, []);

  const handleDragOver = useCallback((index: number) => {
    setDropTarget(index);
  }, []);

  const handleDrop = useCallback(
    (targetIndex: number, tracks: Track[], onReorder: (newOrder: Track[]) => void) => {
      if (!draggedItem || draggedItem.index === targetIndex) return;

      const newOrder = [...tracks];
      const [movedTrack] = newOrder.splice(draggedItem.index, 1);
      newOrder.splice(targetIndex, 0, movedTrack);

      onReorder(newOrder);
      handleDragEnd();
    },
    [draggedItem, handleDragEnd]
  );

  return {
    draggedItem,
    dropTarget,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDrop,
  };
}
