"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { UserProfile } from "@/lib/users";
import { cn } from "@/lib/utils";

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (title: string, assignedTo: string | null) => void;
  onCancel: () => void;
  teamMembers: UserProfile[];
  placeholder?: string;
  className?: string;
}

export function MentionInput({
  value,
  onChange,
  onSubmit,
  onCancel,
  teamMembers,
  placeholder = "카드 제목... (@로 멘션)",
  className,
}: MentionInputProps) {
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionIndex, setMentionIndex] = useState(0);
  const [selectedMember, setSelectedMember] = useState<UserProfile | null>(null);
  const [mentionStartPos, setMentionStartPos] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const filteredMembers = teamMembers.filter((member) =>
    member.displayName.toLowerCase().includes(mentionQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  useEffect(() => {
    setMentionIndex(0);
  }, [mentionQuery]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart || 0;
    onChange(newValue);

    // Check for @ symbol
    const textBeforeCursor = newValue.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
      // Only show menu if there's no space after @ (still typing the mention)
      if (!textAfterAt.includes(" ")) {
        setMentionQuery(textAfterAt);
        setMentionStartPos(lastAtIndex);
        setShowMentions(true);
        return;
      }
    }

    setShowMentions(false);
    setMentionQuery("");
    setMentionStartPos(null);
  };

  const selectMember = (member: UserProfile) => {
    if (mentionStartPos !== null) {
      const beforeMention = value.slice(0, mentionStartPos);
      const afterMention = value.slice(mentionStartPos + mentionQuery.length + 1);
      const newValue = `${beforeMention}@${member.displayName}${afterMention}`;
      onChange(newValue);
      setSelectedMember(member);
    }
    setShowMentions(false);
    setMentionQuery("");
    setMentionStartPos(null);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (showMentions && filteredMembers.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMentionIndex((prev) =>
          prev < filteredMembers.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setMentionIndex((prev) =>
          prev > 0 ? prev - 1 : filteredMembers.length - 1
        );
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        selectMember(filteredMembers[mentionIndex]);
      } else if (e.key === "Escape") {
        setShowMentions(false);
      }
    } else {
      if (e.key === "Enter") {
        e.preventDefault();
        // Extract the clean title (remove @mentions for display, keep assignedTo)
        const cleanTitle = value.trim();
        if (cleanTitle) {
          onSubmit(cleanTitle, selectedMember?.id || null);
        }
      } else if (e.key === "Escape") {
        onCancel();
      }
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowMentions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn("text-sm", className)}
        autoFocus
      />

      {showMentions && filteredMembers.length > 0 && (
        <div
          ref={menuRef}
          className="absolute top-full left-0 mt-1 w-full bg-popover border rounded-md shadow-lg z-50 overflow-hidden"
        >
          <div className="py-1 max-h-48 overflow-y-auto">
            {filteredMembers.map((member, index) => (
              <button
                key={member.id}
                onClick={() => selectMember(member)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-accent transition-colors",
                  index === mentionIndex && "bg-accent"
                )}
              >
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary shrink-0">
                  {member.displayName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{member.displayName}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {member.email}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {showMentions && filteredMembers.length === 0 && mentionQuery && (
        <div
          ref={menuRef}
          className="absolute top-full left-0 mt-1 w-full bg-popover border rounded-md shadow-lg z-50 p-3 text-sm text-muted-foreground"
        >
          &apos;{mentionQuery}&apos; 검색 결과 없음
        </div>
      )}

      {selectedMember && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">
          <span>@{selectedMember.displayName}</span>
        </div>
      )}
    </div>
  );
}
