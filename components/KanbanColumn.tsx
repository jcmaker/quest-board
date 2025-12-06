"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { KanbanCard } from "./KanbanCard";
import { Todo } from "@/lib/todos";
import { Column } from "@/lib/columns";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface KanbanColumnProps {
  column: Column;
  todos: Todo[];
  onAddCard: (columnId: string, title: string) => void;
  onDeleteCard: (todoId: string) => void;
  onEditCard: (todoId: string, newTitle: string) => void;
  onRenameColumn: (columnId: string, newName: string) => void;
  onDeleteColumn: (columnId: string) => void;
}

export function KanbanColumn({
  column,
  todos,
  onAddCard,
  onDeleteCard,
  onEditCard,
  onRenameColumn,
  onDeleteColumn,
}: KanbanColumnProps) {
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const [columnName, setColumnName] = useState(column.name);

  const { setNodeRef } = useDroppable({
    id: column.id,
  });

  const handleAddCard = () => {
    if (newCardTitle.trim()) {
      onAddCard(column.id, newCardTitle.trim());
      setNewCardTitle("");
      setIsAddingCard(false);
    }
  };

  const handleRename = () => {
    if (columnName.trim() && columnName !== column.name) {
      onRenameColumn(column.id, columnName.trim());
    }
    setIsRenaming(false);
  };

  return (
    <div className="flex-shrink-0 w-80">
      <Card className="h-full flex flex-col bg-muted/30 border-border/50">
        <CardHeader className="pb-2 space-y-0">
          <div className="flex items-center justify-between gap-2">
            {isRenaming ? (
              <Input
                value={columnName}
                onChange={(e) => setColumnName(e.target.value)}
                onBlur={handleRename}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRename();
                  if (e.key === "Escape") {
                    setColumnName(column.name);
                    setIsRenaming(false);
                  }
                }}
                autoFocus
                className="h-8 text-sm font-semibold"
              />
            ) : (
              <h3 className="font-semibold text-sm flex items-center gap-2">
                {column.name}
                <span className="text-xs text-muted-foreground font-normal">
                  {todos.length}
                </span>
              </h3>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsRenaming(true)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDeleteColumn(column.id)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto space-y-2 pb-3">
          <SortableContext
            items={todos.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <div ref={setNodeRef} className="space-y-2 min-h-[100px]">
              {todos.map((todo) => (
                <KanbanCard
                  key={todo.id}
                  todo={todo}
                  onDelete={onDeleteCard}
                  onEdit={onEditCard}
                />
              ))}
            </div>
          </SortableContext>

          {isAddingCard ? (
            <div className="space-y-2">
              <Input
                placeholder="Card title..."
                value={newCardTitle}
                onChange={(e) => setNewCardTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddCard();
                  if (e.key === "Escape") {
                    setIsAddingCard(false);
                    setNewCardTitle("");
                  }
                }}
                autoFocus
                className="text-sm"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAddCard}>
                  Add
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsAddingCard(false);
                    setNewCardTitle("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsAddingCard(true)}
              className="w-full text-left px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-md transition-colors flex items-center gap-1.5 border border-dashed border-border/40 hover:border-border"
            >
              <Plus className="h-3.5 w-3.5" />
              New
            </button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
