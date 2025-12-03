"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Team, removeTeamMember, getTeam, updateTeamName } from "@/lib/teams";
import { useAuth } from "@/contexts/AuthContext";
import { Settings, Trash2, UserX, Save } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface TeamSettingsDialogProps {
  teamId: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onTeamUpdated?: () => void;
  trigger?: React.ReactNode;
}

export function TeamSettingsDialog({ 
  teamId, 
  open, 
  onOpenChange, 
  onTeamUpdated,
  trigger 
}: TeamSettingsDialogProps) {
  const { user } = useAuth();
  const [internalOpen, setInternalOpen] = useState(false);
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(false);
  const [newName, setNewName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);

  const isOpen = open !== undefined ? open : internalOpen;
  const setIsOpen = onOpenChange || setInternalOpen;

  useEffect(() => {
    if (isOpen && teamId) {
      loadTeam();
    }
  }, [isOpen, teamId]);

  const loadTeam = async () => {
    try {
      const teamData = await getTeam(teamId);
      setTeam(teamData);
      if (teamData) setNewName(teamData.name);
    } catch (error) {
      console.error("Error loading team settings:", error);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!user || !team) return;
    if (!confirm("Are you sure you want to remove this member?")) return;

    setLoading(true);
    try {
      await removeTeamMember(teamId, user.uid, memberId);
      await loadTeam(); // Reload local state
      onTeamUpdated?.();
    } catch (error) {
      console.error("Error removing member:", error);
      alert("Failed to remove member");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateName = async () => {
    if (!user || !team || !newName.trim()) return;
    
    setLoading(true);
    try {
      await updateTeamName(teamId, user.uid, newName.trim());
      await loadTeam();
      setIsEditingName(false);
      onTeamUpdated?.();
    } catch (error) {
      console.error("Error updating team name:", error);
      alert("Failed to update team name");
    } finally {
      setLoading(false);
    }
  };

  if (!team) return null;

  const isAdmin = user && team.admins?.includes(user.uid);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Team Settings</DialogTitle>
          <DialogDescription>
            Manage team members and settings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label>Team Name</Label>
            <div className="flex gap-2">
              <Input 
                value={newName} 
                onChange={(e) => setNewName(e.target.value)}
                disabled={!isEditingName || !isAdmin}
              />
              {isAdmin && (
                isEditingName ? (
                  <Button onClick={handleUpdateName} disabled={loading}>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                ) : (
                  <Button variant="outline" onClick={() => setIsEditingName(true)}>
                    Rename
                  </Button>
                )
              )}
            </div>
          </div>

          <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
            <span className="text-sm font-medium">Invite Code:</span>
            <div className="flex items-center gap-2">
              <code className="bg-background px-2 py-1 rounded border">{team.inviteCode}</code>
            </div>
          </div>

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member ID</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {team.members.map((memberId) => (
                  <TableRow key={memberId}>
                    <TableCell className="font-mono text-xs">{memberId}</TableCell>
                    <TableCell>
                      {team.admins?.includes(memberId) ? (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">Admin</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Member</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {(isAdmin || user?.uid === memberId) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleRemoveMember(memberId)}
                          disabled={loading}
                        >
                          <UserX className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
