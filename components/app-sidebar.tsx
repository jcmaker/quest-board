"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { Settings, LogOut, Moon, Sun, UserCircle, Users, MoreHorizontal, Trash2, LogOut as LogOutIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Team, getUserTeams, deleteTeam, leaveTeam } from "@/lib/teams";
import { TeamManageDialog } from "@/components/TeamManageDialog";
import { TeamSettingsDialog } from "@/components/TeamSettingsDialog";

export function AppSidebar() {
  const { user, logout } = useAuth();
  const { setTheme } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [teams, setTeams] = useState<Team[]>([]);
  const [settingsTeamId, setSettingsTeamId] = useState<string | null>(null);
  
  const currentTeamId = searchParams.get("teamId");
  const isPersonal = !currentTeamId;

  useEffect(() => {
    if (user) {
      loadTeams();
    }
  }, [user]);

  const loadTeams = async () => {
    if (!user) return;
    try {
      const userTeams = await getUserTeams(user.uid);
      setTeams(userTeams);
    } catch (error) {
      console.error("Error loading teams:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const navigateToPersonal = () => {
    router.push("?");
  };

  const navigateToTeam = (teamId: string) => {
    router.push(`?teamId=${teamId}`);
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!user) return;
    if (!confirm("Are you sure you want to delete this team? This action cannot be undone.")) return;
    try {
      await deleteTeam(teamId, user.uid);
      await loadTeams();
      if (currentTeamId === teamId) navigateToPersonal();
    } catch (error) {
      console.error("Error deleting team:", error);
      alert("Failed to delete team. Ensure you are an admin.");
    }
  };

  const handleLeaveTeam = async (teamId: string) => {
    if (!user) return;
    if (!confirm("Are you sure you want to leave this team?")) return;
    try {
      await leaveTeam(teamId, user.uid);
      await loadTeams();
      if (currentTeamId === teamId) navigateToPersonal();
    } catch (error) {
      console.error("Error leaving team:", error);
      alert("Failed to leave team.");
    }
  };

  if (!user) return null;

  return (
    <Sidebar>
      <SidebarHeader className="border-b p-4">
        <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
          <span className="text-primary">Quest</span> Board
        </h2>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Personal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={isPersonal}
                  onClick={navigateToPersonal}
                >
                  <UserCircle className="mr-2" />
                  <span>Personal Todos</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Teams</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {teams.map((team) => (
                <SidebarMenuItem key={team.id}>
                  <SidebarMenuButton 
                    isActive={currentTeamId === team.id}
                    onClick={() => navigateToTeam(team.id)}
                  >
                    <Users className="mr-2" />
                    <span>{team.name}</span>
                  </SidebarMenuButton>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuAction showOnHover>
                        <MoreHorizontal />
                        <span className="sr-only">More</span>
                      </SidebarMenuAction>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="right" align="start">
                      <DropdownMenuItem onClick={() => setSettingsTeamId(team.id)}>
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {team.admins?.includes(user.uid) ? (
                        <DropdownMenuItem onClick={() => handleDeleteTeam(team.id)} className="text-destructive focus:text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Team
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => handleLeaveTeam(team.id)} className="text-destructive focus:text-destructive">
                          <LogOutIcon className="mr-2 h-4 w-4" />
                          Leave Team
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
            <div className="px-2 mt-2">
              <TeamManageDialog onTeamChanged={loadTeams} />
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={user.photoURL || undefined} alt={user.displayName || ""} />
                    <AvatarFallback className="rounded-lg">
                      {user.displayName?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user.displayName || "User"}</span>
                    <span className="truncate text-xs">{user.email}</span>
                  </div>
                  <Settings className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem onClick={() => setTheme("light")}>
                  <Sun className="mr-2 h-4 w-4" />
                  Light Mode
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                  <Moon className="mr-2 h-4 w-4" />
                  Dark Mode
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />

      {settingsTeamId && (
        <TeamSettingsDialog 
          teamId={settingsTeamId}
          open={!!settingsTeamId}
          onOpenChange={(open) => !open && setSettingsTeamId(null)}
          onTeamUpdated={loadTeams}
        />
      )}
    </Sidebar>
  );
}
