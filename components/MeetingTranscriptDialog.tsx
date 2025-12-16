"use client";

import { useState, useEffect, useRef } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { getTeam } from "@/lib/teams";
import { getTeamMemberProfiles, UserProfile } from "@/lib/users";
import { createTeamTodosBatch } from "@/lib/todos";
import { getTeamColumns, Column } from "@/lib/columns";
import {
  FileText,
  Sparkles,
  Loader2,
  ChevronDown,
  X,
  Check,
  User,
  AlertCircle,
  Upload,
} from "lucide-react";

interface ExtractedTask {
  title: string;
  assignedTo: string | null;
  assigneeName: string | null;
  confidence: number;
}

interface MeetingTranscriptDialogProps {
  teamId: string;
  onTasksCreated?: () => void;
}

export function MeetingTranscriptDialog({
  teamId,
  onTasksCreated,
}: MeetingTranscriptDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [transcript, setTranscript] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [teamMembers, setTeamMembers] = useState<UserProfile[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [extractedTasks, setExtractedTasks] = useState<ExtractedTask[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"input" | "review">("input");

  useEffect(() => {
    if (open && teamId && user) {
      loadTeamData();
    }
  }, [open, teamId, user]);

  const loadTeamData = async () => {
    try {
      const team = await getTeam(teamId);
      if (team) {
        const profiles = await getTeamMemberProfiles(team.members);
        setTeamMembers(profiles);
      }
      const cols = await getTeamColumns(teamId, user!.uid);
      setColumns(cols);
    } catch (err) {
      console.error("Error loading team data:", err);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setTranscript(content);
      setError(null);
    };
    reader.onerror = () => {
      setError("파일을 읽는데 실패했습니다");
    };
    reader.readAsText(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleExtract = async () => {
    if (!transcript.trim()) {
      setError("회의록을 먼저 붙여넣어 주세요");
      return;
    }

    setIsExtracting(true);
    setError(null);

    try {
      const response = await fetch("/api/parse-transcript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript,
          teamMembers: teamMembers.map((m) => ({
            uid: m.id,
            displayName: m.displayName,
            email: m.email,
          })),
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || "할 일 추출에 실패했습니다");
        return;
      }

      if (data.tasks.length === 0) {
        setError("회의록에서 할 일을 찾을 수 없습니다");
        return;
      }

      setExtractedTasks(data.tasks);
      setStep("review");
    } catch (err) {
      setError("AI 서비스 연결에 실패했습니다");
      console.error("Extract error:", err);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleCreateTasks = async () => {
    if (!user || extractedTasks.length === 0) return;

    setIsCreating(true);

    try {
      // Find the "To Do" column or first column
      const todoColumn = columns.find(
        (c) => c.name.toLowerCase() === "to do"
      ) || columns[0];

      if (!todoColumn) {
        setError("컬럼이 없습니다. 먼저 컬럼을 생성해주세요.");
        setIsCreating(false);
        return;
      }

      await createTeamTodosBatch(
        user.uid,
        teamId,
        extractedTasks.map((t) => ({
          title: t.title,
          assignedTo: t.assignedTo || undefined,
        })),
        todoColumn.id
      );

      onTasksCreated?.();
      handleClose();
    } catch (err) {
      setError("할 일 생성에 실패했습니다");
      console.error("Create error:", err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setTranscript("");
    setExtractedTasks([]);
    setError(null);
    setStep("input");
  };

  const updateTaskTitle = (index: number, title: string) => {
    setExtractedTasks((prev) =>
      prev.map((t, i) => (i === index ? { ...t, title } : t))
    );
  };

  const updateTaskAssignee = (index: number, assignedTo: string | null) => {
    const member = teamMembers.find((m) => m.id === assignedTo);
    setExtractedTasks((prev) =>
      prev.map((t, i) =>
        i === index
          ? {
              ...t,
              assignedTo,
              assigneeName: member?.displayName || null,
            }
          : t
      )
    );
  };

  const removeTask = (index: number) => {
    setExtractedTasks((prev) => prev.filter((_, i) => i !== index));
  };

  const getMemberName = (uid: string | null) => {
    if (!uid) return null;
    return teamMembers.find((m) => m.id === uid)?.displayName || null;
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : handleClose())}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-dashed hover:border-solid transition-all"
        >
          <FileText className="h-4 w-4" />
          회의록 가져오기
        </Button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
        showCloseButton={false}
      >
        <DialogHeader className="relative pb-4 border-b">
          <div className="absolute -top-2 -left-2 w-20 h-20 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-2xl" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold tracking-tight">
                  {step === "input" ? "회의록 가져오기" : "할 일 확인"}
                </DialogTitle>
                <DialogDescription className="text-sm mt-0.5">
                  {step === "input"
                    ? "회의록을 붙여넣어 할 일을 추출하세요"
                    : `${extractedTasks.length}개의 할 일이 추출되었습니다`}
                </DialogDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={handleClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Progress indicator */}
          <div className="flex gap-2 mt-4">
            <div
              className={`h-1 flex-1 rounded-full transition-colors ${
                step === "input" ? "bg-primary" : "bg-primary/30"
              }`}
            />
            <div
              className={`h-1 flex-1 rounded-full transition-colors ${
                step === "review" ? "bg-primary" : "bg-muted"
              }`}
            />
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 px-1">
          {step === "input" ? (
            <div className="space-y-4">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".md,.txt,.markdown"
                className="hidden"
              />
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  파일 업로드
                </Button>
                <span className="text-xs text-muted-foreground">
                  .md, .txt 파일 지원
                </span>
              </div>
              <div className="relative">
                <Textarea
                  placeholder="회의록을 여기에 붙여넣으세요...

예시:
'철수가 금요일까지 데이터베이스를 설정하기로 했습니다. 영희는 인증 관련 PR을 리뷰하겠다고 했고, 문서 업데이트는 민수가 담당하기로 했습니다.'"
                  value={transcript}
                  onChange={(e) => {
                    setTranscript(e.target.value);
                    setError(null);
                  }}
                  className="min-h-[280px] resize-none font-mono text-sm leading-relaxed"
                />
                <div className="absolute bottom-3 right-3 text-xs text-muted-foreground">
                  {transcript.length}자
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-muted-foreground">
                  AI가 할 일을 추출하고 팀원에게 자동 배정합니다
                </p>
                <Button
                  onClick={handleExtract}
                  disabled={isExtracting || !transcript.trim()}
                  className="gap-2 min-w-[140px]"
                >
                  {isExtracting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      분석 중...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      할 일 추출
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {extractedTasks.map((task, index) => (
                <div
                  key={index}
                  className="group relative p-4 rounded-xl border bg-card hover:border-primary/30 transition-all"
                  style={{
                    animationDelay: `${index * 50}ms`,
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1 p-1.5 rounded-md bg-primary/10 text-primary shrink-0">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <Input
                        value={task.title}
                        onChange={(e) => updateTaskTitle(index, e.target.value)}
                        className="border-0 p-0 h-auto text-sm font-medium bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                      <div className="flex items-center gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                            >
                              <User className="h-3 w-3" />
                              {getMemberName(task.assignedTo) || "미배정"}
                              <ChevronDown className="h-3 w-3 opacity-50" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-48">
                            <DropdownMenuItem
                              onClick={() => updateTaskAssignee(index, null)}
                            >
                              <span className="text-muted-foreground">미배정</span>
                            </DropdownMenuItem>
                            {teamMembers.map((member) => (
                              <DropdownMenuItem
                                key={member.id}
                                onClick={() => updateTaskAssignee(index, member.id)}
                              >
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                                    {member.displayName.charAt(0).toUpperCase()}
                                  </div>
                                  <span className="truncate">{member.displayName}</span>
                                </div>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        {task.confidence < 0.7 && (
                          <span className="text-xs text-amber-500/80 bg-amber-500/10 px-1.5 py-0.5 rounded">
                            낮은 신뢰도
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                      onClick={() => removeTask(index)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}
            </div>
          )}
        </div>

        {step === "review" && (
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="ghost"
              onClick={() => {
                setStep("input");
                setExtractedTasks([]);
                setError(null);
              }}
            >
              뒤로
            </Button>
            <Button
              onClick={handleCreateTasks}
              disabled={isCreating || extractedTasks.length === 0}
              className="gap-2 min-w-[160px]"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  생성 중...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  {extractedTasks.length}개 할 일 생성
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
