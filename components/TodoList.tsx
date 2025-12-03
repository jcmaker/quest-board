"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Copy } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Todo, getPersonalTodos, getTeamTodos, createPersonalTodo, createTeamTodo, updateTodo, deleteTodo } from "@/lib/todos";
import { useAuth } from "@/contexts/AuthContext";
import { Team, getTeam } from "@/lib/teams";
import { TeamSettingsDialog } from "@/components/TeamSettingsDialog";

interface TodoListProps {
  type: "personal" | "team";
  teamId?: string;
}

export function TodoList({ type, teamId }: TodoListProps) {
  const { user } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [newTodoTitle, setNewTodoTitle] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
        const personalTodos = await getPersonalTodos(user.uid);
        setTodos(personalTodos);
        setTeam(null);
      } else if (teamId) {
        const [teamTodos, teamData] = await Promise.all([
          getTeamTodos(teamId),
          getTeam(teamId)
        ]);
        setTodos(teamTodos);
        setTeam(teamData);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTodo = async () => {
    if (!user || !newTodoTitle.trim()) return;

    try {
      if (type === "personal") {
        await createPersonalTodo(user.uid, newTodoTitle.trim());
      } else if (teamId) {
        await createTeamTodo(user.uid, teamId, newTodoTitle.trim());
      }
      setNewTodoTitle("");
      setIsDialogOpen(false);
      await loadData();
    } catch (error) {
      console.error("Error creating todo:", error);
    }
  };

  const handleToggleComplete = async (todo: Todo) => {
    try {
      await updateTodo(todo.id, { completed: !todo.completed });
      await loadData();
    } catch (error) {
      console.error("Error updating todo:", error);
    }
  };

  const handleDeleteTodo = async (todoId: string) => {
    try {
      await deleteTodo(todoId);
      await loadData();
    } catch (error) {
      console.error("Error deleting todo:", error);
    }
  };

  const copyInviteCode = () => {
    if (team?.inviteCode) {
      navigator.clipboard.writeText(team.inviteCode);
      // You could add a toast notification here
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <CardTitle>
              {type === "personal" ? "Personal Todos" : team?.name || "Team Todos"}
            </CardTitle>
            {type === "team" && team && teamId && (
              <TeamSettingsDialog 
                teamId={teamId} 
                onTeamUpdated={loadData} 
              />
            )}
          </div>
          {type === "team" && team && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Invite Code: {team.inviteCode}</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyInviteCode}>
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
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Todo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Todo</DialogTitle>
              <DialogDescription>
                Create a new {type === "personal" ? "personal" : "team"} todo item.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Input
                placeholder="Todo title..."
                value={newTodoTitle}
                onChange={(e) => setNewTodoTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleCreateTodo();
                  }
                }}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTodo}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {todos.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No todos yet. Create your first one!
          </p>
        ) : (
          <div className="space-y-2">
            {todos.map((todo) => (
              <div
                key={todo.id}
                className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
              >
                <Checkbox
                  checked={todo.completed}
                  onCheckedChange={() => handleToggleComplete(todo)}
                />
                <span
                  className={`flex-1 ${
                    todo.completed
                      ? "line-through text-muted-foreground"
                      : ""
                  }`}
                >
                  {todo.title}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteTodo(todo.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
