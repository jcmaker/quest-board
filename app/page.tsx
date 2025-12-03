"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TodoList } from "@/components/TodoList";
import { LogIn } from "lucide-react";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function MainContent() {
  const { user, loading, signInWithGoogle } = useAuth();
  const searchParams = useSearchParams();
  const teamId = searchParams.get("teamId");

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto">
              <h1 className="text-4xl font-bold">Quest Board</h1>
            </div>
            <CardTitle className="text-2xl">Welcome!</CardTitle>
            <CardDescription>
              Sign in with Google to start managing your personal and team
              todos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={signInWithGoogle} className="w-full" size="lg">
              <LogIn className="mr-2 h-5 w-5" />
              Sign in with Google
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 border-b px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="min-h-screen flex-1 rounded-xl bg-muted/50 md:min-h-min p-4">
            <TodoList
              type={teamId ? "team" : "personal"}
              teamId={teamId || undefined}
            />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MainContent />
    </Suspense>
  );
}
