import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

interface TeamMember {
  uid: string;
  displayName: string;
  email: string;
}

interface ParseTranscriptRequest {
  transcript: string;
  teamMembers: TeamMember[];
}

interface ExtractedTask {
  title: string;
  assignedTo: string | null;
  assigneeName: string | null;
  confidence: number;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body: ParseTranscriptRequest = await request.json();
    const { transcript, teamMembers } = body;

    if (!transcript || transcript.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Transcript is required" },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { success: false, error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    const memberList = teamMembers
      .map((m) => `- ${m.displayName} (${m.email})`)
      .join("\n");

    const systemPrompt = `You are an expert at extracting action items and tasks from meeting transcripts.

Your job is to:
1. Identify all action items, tasks, and to-dos mentioned in the transcript
2. Determine who each task is assigned to (if mentioned)
3. Return structured JSON output

Rules:
- Extract only concrete, actionable tasks
- If a task mentions a person's name, include it in assigneeName (use the exact name as mentioned)
- If no assignee is clear, leave assigneeName as null
- Be concise - task titles should be 5-15 words
- Ignore general discussion that doesn't result in action items
- Look for phrases like "할 것", "해야 한다", "담당", "맡다", "하기로", "will do", "should", "needs to", "action item", "task", "TODO", "assigned to", etc.
- IMPORTANT: Write task titles in Korean if the transcript is in Korean. Match the language of the transcript.

Team members available for assignment:
${memberList || "No team members provided"}

You MUST respond with ONLY a valid JSON array, no other text. Example:
[
  {
    "title": "데이터베이스 스키마 설정하기",
    "assigneeName": "철수",
    "confidence": 0.9
  },
  {
    "title": "인증 관련 PR 리뷰하기",
    "assigneeName": null,
    "confidence": 0.7
  }
]`;

    const userPrompt = `Extract action items from this meeting transcript:

---
${transcript}
---

Return ONLY a valid JSON array.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-5.2-chat-latest",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_completion_tokens: 2000,
    });

    const responseText = completion.choices[0]?.message?.content || "[]";

    // Parse the JSON response
    let extractedTasks: { title: string; assigneeName: string | null; confidence: number }[];
    try {
      // Clean up response - remove markdown code blocks if present
      let cleanedResponse = responseText.trim();
      if (cleanedResponse.startsWith("```json")) {
        cleanedResponse = cleanedResponse.slice(7);
      } else if (cleanedResponse.startsWith("```")) {
        cleanedResponse = cleanedResponse.slice(3);
      }
      if (cleanedResponse.endsWith("```")) {
        cleanedResponse = cleanedResponse.slice(0, -3);
      }
      cleanedResponse = cleanedResponse.trim();

      extractedTasks = JSON.parse(cleanedResponse);
    } catch {
      console.error("Failed to parse OpenAI response:", responseText);
      return NextResponse.json(
        { success: false, error: "Failed to parse AI response" },
        { status: 500 }
      );
    }

    // Match assignee names to team member UIDs
    const tasksWithUids: ExtractedTask[] = extractedTasks.map((task) => {
      let assignedTo: string | null = null;

      if (task.assigneeName) {
        const normalizedName = task.assigneeName.toLowerCase().trim();

        // Try to match to a team member
        const matchedMember = teamMembers.find((m) => {
          const displayLower = m.displayName.toLowerCase();
          const firstName = displayLower.split(" ")[0];
          const emailPrefix = m.email.split("@")[0].toLowerCase();

          return (
            displayLower === normalizedName ||
            firstName === normalizedName ||
            displayLower.includes(normalizedName) ||
            normalizedName.includes(firstName) ||
            emailPrefix === normalizedName
          );
        });

        if (matchedMember) {
          assignedTo = matchedMember.uid;
        }
      }

      return {
        title: task.title,
        assignedTo,
        assigneeName: task.assigneeName,
        confidence: task.confidence || 0.5,
      };
    });

    return NextResponse.json({
      success: true,
      tasks: tasksWithUids,
    });
  } catch (error) {
    console.error("Error parsing transcript:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
