"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";
import { Todo } from "@/lib/todos";
import { useState } from "react";

interface KanbanCardProps {
  todo: Todo;
  onDelete: (todoId: string) => void;
  onEdit: (todoId: string, newTitle: string) => void;
}

export function KanbanCard({ todo, onDelete, onEdit }: KanbanCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(todo.title);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleSave = () => {
    if (editedTitle.trim() && editedTitle !== todo.title) {
      onEdit(todo.id, editedTitle.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedTitle(todo.title);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div ref={setNodeRef} style={style}>
        <Card className="p-3 border-border/50 bg-card">
          <Input
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
              if (e.key === "Escape") handleCancel();
            }}
            autoFocus
            className="text-sm"
          />
        </Card>
      </div>
    );
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card className="group p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-all duration-200 border-border/50 hover:border-border bg-card">
        <div className="flex items-start gap-2">
          <div
            className="flex-1 min-w-0"
            onDoubleClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
          >
            <p className="text-sm font-medium text-foreground break-words">
              {todo.title}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(todo.id);
            }}
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
