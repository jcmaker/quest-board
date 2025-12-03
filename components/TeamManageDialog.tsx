"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createTeam, joinTeam } from "@/lib/teams";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Users } from "lucide-react";

interface TeamManageDialogProps {
  onTeamChanged: () => void;
}

export function TeamManageDialog({ onTeamChanged }: TeamManageDialogProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreateTeam = async () => {
    if (!user || !teamName.trim()) return;
    setLoading(true);
    setError("");
    try {
      await createTeam(user.uid, teamName.trim());
      setTeamName("");
      setIsOpen(false);
      onTeamChanged();
    } catch (err) {
      console.error(err);
      setError("Failed to create team");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinTeam = async () => {
    if (!user || !inviteCode.trim()) return;
    setLoading(true);
    setError("");
    try {
      await joinTeam(user.uid, inviteCode.trim());
      setInviteCode("");
      setIsOpen(false);
      onTeamChanged();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to join team");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start gap-2">
          <Plus className="h-4 w-4" />
          <span>Create or Join Team</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage Teams</DialogTitle>
          <DialogDescription>
            Create a new team or join an existing one using an invite code.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="create" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create">Create Team</TabsTrigger>
            <TabsTrigger value="join">Join Team</TabsTrigger>
          </TabsList>
          
          <TabsContent value="create" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="team-name">Team Name</Label>
              <Input
                id="team-name"
                placeholder="My Awesome Team"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
              />
            </div>
            <Button 
              onClick={handleCreateTeam} 
              disabled={loading || !teamName.trim()}
              className="w-full"
            >
              {loading ? "Creating..." : "Create Team"}
            </Button>
          </TabsContent>
          
          <TabsContent value="join" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="invite-code">Invite Code</Label>
              <Input
                id="invite-code"
                placeholder="ENTER-CODE"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              />
            </div>
            <Button 
              onClick={handleJoinTeam} 
              disabled={loading || !inviteCode.trim()}
              className="w-full"
            >
              {loading ? "Joining..." : "Join Team"}
            </Button>
          </TabsContent>
        </Tabs>

        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}
      </DialogContent>
    </Dialog>
  );
}

