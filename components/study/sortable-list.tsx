'use client';

import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import type { QuestionChoice } from '@/types/question';

interface SortableItemProps {
  choice: QuestionChoice;
  index: number;
  disabled: boolean;
}

function SortableItem({ choice, index, disabled }: SortableItemProps): React.ReactElement {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: choice.id,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-4 rounded-lg border-2 bg-white dark:bg-gray-900 ${
        isDragging
          ? 'border-primary shadow-lg z-50'
          : disabled
            ? 'border-border bg-muted/50'
            : 'border-border hover:border-primary/50 cursor-move'
      }`}
      {...attributes}
      {...listeners}
    >
      <div className="shrink-0 flex items-center gap-2">
        <GripVertical
          className={`h-5 w-5 ${disabled ? 'text-muted-foreground' : 'text-primary'}`}
        />
        <span className="font-bold text-lg text-primary">{index + 1}.</span>
      </div>
      <div className="flex-1">
        <span className="text-foreground">{choice.text}</span>
      </div>
    </div>
  );
}

interface SortableListProps {
  choices: QuestionChoice[];
  onOrderChange: (newOrder: QuestionChoice[]) => void;
  disabled?: boolean;
}

export function SortableList({
  choices,
  onOrderChange,
  disabled = false,
}: SortableListProps): React.ReactElement {
  const [items, setItems] = useState<QuestionChoice[]>(choices);

  // Update items when choices prop changes (new question loaded)
  useEffect(() => {
    setItems(choices);
  }, [choices]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent): void => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      const newOrder = arrayMove(items, oldIndex, newIndex);
      setItems(newOrder);
      onOrderChange(newOrder);
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {items.map((choice, index) => (
            <SortableItem key={choice.id} choice={choice} index={index} disabled={disabled} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
