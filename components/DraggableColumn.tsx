"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { KanbanColumn } from "./KanbanColumn";
import { Column } from "@/lib/columns";
import { Todo } from "@/lib/todos";
import { UserProfile } from "@/lib/users";

interface DraggableColumnProps {
  column: Column;
  todos: Todo[];
  onAddCard: (columnId: string, title: string, assignedTo?: string | null) => void;
  onDeleteCard: (todoId: string) => void;
  onEditCard: (todoId: string, newTitle: string) => void;
  onRenameColumn: (columnId: string, newName: string) => void;
  onDeleteColumn: (columnId: string) => void;
  teamMembers?: UserProfile[];
  isTeamBoard?: boolean;
}

export function DraggableColumn(props: DraggableColumnProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: props.column.id,
    data: {
      type: "column",
      column: props.column,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <KanbanColumn {...props} />
    </div>
  );
}
