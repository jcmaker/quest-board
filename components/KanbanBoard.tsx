"use client";

import { useState, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Copy } from "lucide-react";
import { DraggableColumn } from "./DraggableColumn";
import { KanbanCard } from "./KanbanCard";
import {
  Todo,
  getPersonalTodos,
  getTeamTodos,
  createPersonalTodo,
  createTeamTodo,
  updateTodo,
  deleteTodo,
} from "@/lib/todos";
import {
  Column,
  getPersonalColumns,
  getTeamColumns,
  createColumn,
  updateColumn,
  deleteColumn,
} from "@/lib/columns";
import { useAuth } from "@/contexts/AuthContext";
import { Team, getTeam } from "@/lib/teams";
import { TeamSettingsDialog } from "@/components/TeamSettingsDialog";
import { MeetingTranscriptDialog } from "@/components/MeetingTranscriptDialog";
import { UserProfile, getTeamMemberProfiles } from "@/lib/users";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface KanbanBoardProps {
  type: "personal" | "team";
  teamId?: string;
}

export function KanbanBoard({ type, teamId }: KanbanBoardProps) {
  const { user } = useAuth();
  const [columns, setColumns] = useState<Column[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [team, setTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, type, teamId]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      if (type === "personal") {
        const [personalTodos, personalColumns] = await Promise.all([
          getPersonalTodos(user.uid),
          getPersonalColumns(user.uid),
        ]);
        setTodos(personalTodos);
        setColumns(personalColumns);
        setTeam(null);
      } else if (teamId) {
        const [teamTodos, teamColumns, teamData] = await Promise.all([
          getTeamTodos(teamId),
          getTeamColumns(teamId, user.uid),
          getTeam(teamId),
        ]);
        setTodos(teamTodos);
        setColumns(teamColumns);
        setTeam(teamData);

        // Fetch team member profiles
        if (teamData && teamData.members.length > 0) {
          const profiles = await getTeamMemberProfiles(teamData.members);
          setTeamMembers(profiles);
        }
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Check if dragging a column
    const activeColumn = columns.find((c) => c.id === activeId);
    if (activeColumn) {
      const overColumn = columns.find((c) => c.id === overId);
      if (overColumn && activeColumn.id !== overColumn.id) {
        const oldIndex = columns.findIndex((c) => c.id === activeId);
        const newIndex = columns.findIndex((c) => c.id === overId);
        setColumns(arrayMove(columns, oldIndex, newIndex));
      }
      return;
    }

    // Otherwise, dragging a card
    const activeTodo = todos.find((t) => t.id === activeId);
    if (!activeTodo) return;

    // Find the target column - either directly or from the card being hovered
    let overColumnId: string | undefined;

    // Check if hovering over a column directly
    const overColumn = columns.find((c) => c.id === overId);
    if (overColumn) {
      overColumnId = overColumn.id;
    } else {
      // Check if hovering over a card - find which column it belongs to
      const overTodo = todos.find((t) => t.id === overId);
      if (overTodo) {
        overColumnId = overTodo.status;
      }
    }

    const activeColumnId = activeTodo.status;

    if (overColumnId && activeColumnId !== overColumnId) {
      setTodos((todos) =>
        todos.map((todo) =>
          todo.id === activeId ? { ...todo, status: overColumnId } : todo
        )
      );
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Check if dragging a column
    const activeColumn = columns.find((c) => c.id === activeId);
    if (activeColumn) {
      const overColumn = columns.find((c) => c.id === overId);
      if (overColumn && activeColumn.id !== overColumn.id) {
        // Update column order in database (background)
        try {
          const updatedColumns = columns.map((col, index) => ({
            ...col,
            order: index,
          }));
          // Update in background without reloading
          Promise.all(
            updatedColumns.map((col) => updateColumn(col.id, { order: col.order }))
          ).catch((error) => {
            console.error("Error updating column order:", error);
          });
        } catch (error) {
          console.error("Error updating column order:", error);
        }
      }
      return;
    }

    // Otherwise, dragging a card
    const activeTodo = todos.find((t) => t.id === activeId);
    if (!activeTodo) return;

    // Find the target column - either directly or from the card being hovered
    let overColumnId: string | undefined;

    // Check if hovering over a column directly
    const overColumn = columns.find((c) => c.id === overId);
    if (overColumn) {
      overColumnId = overColumn.id;
    } else {
      // Check if hovering over a card - find which column it belongs to
      const overTodo = todos.find((t) => t.id === overId);
      if (overTodo) {
        overColumnId = overTodo.status;
      }
    }

    // If no valid drop target, keep card in original column
    if (!overColumnId) {
      overColumnId = activeTodo.status;
    }

    try {
      await updateTodo(activeId, { status: overColumnId });
      // Only reload todos, not columns
      if (type === "personal" && user) {
        const personalTodos = await getPersonalTodos(user.uid);
        setTodos(personalTodos);
      } else if (teamId && user) {
        const teamTodos = await getTeamTodos(teamId);
        setTodos(teamTodos);
      }
    } catch (error) {
      console.error("Error updating todo:", error);
      await loadData();
    }
  };

  const handleAddCard = async (columnId: string, title: string, assignedTo?: string | null) => {
    if (!user) return;

    try {
      if (type === "personal") {
        await createPersonalTodo(user.uid, title, columnId);
        const personalTodos = await getPersonalTodos(user.uid);
        setTodos(personalTodos);
      } else if (teamId) {
        await createTeamTodo(user.uid, teamId, title, assignedTo || undefined, columnId);
        const teamTodos = await getTeamTodos(teamId);
        setTodos(teamTodos);
      }
    } catch (error) {
      console.error("Error creating todo:", error);
    }
  };

  const handleDeleteCard = async (todoId: string) => {
    if (!user) return;

    try {
      await deleteTodo(todoId);
      // Only reload todos, not columns
      if (type === "personal") {
        const personalTodos = await getPersonalTodos(user.uid);
        setTodos(personalTodos);
      } else if (teamId) {
        const teamTodos = await getTeamTodos(teamId);
        setTodos(teamTodos);
      }
    } catch (error) {
      console.error("Error deleting todo:", error);
    }
  };

  const handleEditCard = async (todoId: string, newTitle: string) => {
    if (!user) return;

    try {
      await updateTodo(todoId, { title: newTitle });
      // Only reload todos, not columns
      if (type === "personal") {
        const personalTodos = await getPersonalTodos(user.uid);
        setTodos(personalTodos);
      } else if (teamId) {
        const teamTodos = await getTeamTodos(teamId);
        setTodos(teamTodos);
      }
    } catch (error) {
      console.error("Error editing todo:", error);
    }
  };

  const handleAddColumn = async () => {
    if (!user || !newColumnName.trim()) return;

    try {
      const newOrder = columns.length;
      await createColumn(user.uid, newColumnName.trim(), newOrder, teamId);
      setNewColumnName("");
      setIsAddingColumn(false);
      await loadData();
    } catch (error) {
      console.error("Error creating column:", error);
    }
  };

  const handleRenameColumn = async (columnId: string, newName: string) => {
    try {
      await updateColumn(columnId, { name: newName });
      await loadData();
    } catch (error) {
      console.error("Error renaming column:", error);
    }
  };

  const handleDeleteColumn = async (columnId: string) => {
    if (!confirm("Delete this column? All cards will remain but lose their status.")) {
      return;
    }

    try {
      await deleteColumn(columnId);
      await loadData();
    } catch (error) {
      console.error("Error deleting column:", error);
    }
  };

  const copyInviteCode = () => {
    if (team?.inviteCode) {
      navigator.clipboard.writeText(team.inviteCode);
    }
  };

  const getTodosForColumn = (columnId: string) => {
    return todos.filter((todo) => todo.status === columnId);
  };

  const activeTodo = activeId ? todos.find((t) => t.id === activeId) : null;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <p className="text-center text-muted-foreground">Loading...</p>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">
              {type === "personal" ? "Personal Board" : team?.name || "Team Board"}
            </h2>
            {type === "team" && team && teamId && (
              <>
                <TeamSettingsDialog teamId={teamId} onTeamUpdated={loadData} />
                <MeetingTranscriptDialog teamId={teamId} onTasksCreated={loadData} />
              </>
            )}
          </div>
          {type === "team" && team && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Invite Code: {team.inviteCode}</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={copyInviteCode}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Copy Invite Code</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
          <SortableContext
            items={columns.map((c) => c.id)}
            strategy={horizontalListSortingStrategy}
          >
            {columns.map((column) => (
              <DraggableColumn
                key={column.id}
                column={column}
                todos={getTodosForColumn(column.id)}
                onAddCard={handleAddCard}
                onDeleteCard={handleDeleteCard}
                onEditCard={handleEditCard}
                onRenameColumn={handleRenameColumn}
                onDeleteColumn={handleDeleteColumn}
                teamMembers={teamMembers}
                isTeamBoard={type === "team"}
              />
            ))}
          </SortableContext>

          <div className="flex-shrink-0 w-80">
            {isAddingColumn ? (
              <Card className="p-4 bg-muted/30 border-border/50">
                <Input
                  placeholder="Column name..."
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddColumn();
                    if (e.key === "Escape") {
                      setIsAddingColumn(false);
                      setNewColumnName("");
                    }
                  }}
                  autoFocus
                  className="mb-2"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAddColumn}>
                    Add
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setIsAddingColumn(false);
                      setNewColumnName("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </Card>
            ) : (
              <Button
                variant="ghost"
                onClick={() => setIsAddingColumn(true)}
                className="w-full h-full min-h-[100px] border-2 border-dashed border-border/50 hover:border-border hover:bg-muted/30"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Column
              </Button>
            )}
          </div>
        </div>

        <DragOverlay>
          {activeTodo ? (
            <KanbanCard todo={activeTodo} onDelete={() => { }} onEdit={() => { }} />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
