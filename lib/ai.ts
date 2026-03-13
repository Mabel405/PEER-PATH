import { generateText } from "ai";
import { groq } from "@ai-sdk/groq";
import {
  createMatch,
  getGoalsByUserAndCommunity,
  getGoalsByUsersAndCommunity,
  getMembersInCommunity,
  getPartnerUserId,
  getUserMatchesInCommunity,
  getUsersByIds,
} from "./db-helpers";
import { getOrCreateUserByClerkId } from "./user-utils";
import { conversationSummaries, learningGoals, messages } from "@/db/schema";
import { db } from "@/db";
import { desc, eq } from "drizzle-orm";

export const aiMatchUsers = async (
  user: NonNullable<Awaited<ReturnType<typeof getOrCreateUserByClerkId>>>,
  communityId: string
) => {
  try {
    const currentUserGoals = await getGoalsByUserAndCommunity(user.id, communityId);
    const members = await getMembersInCommunity(communityId, user.id);
    const existingMatches = await getUserMatchesInCommunity(user.id, communityId);

    const existingMatchUserIds = new Set(
      existingMatches.map((m) => getPartnerUserId(m, user.id))
    );

    const potentialMemberIds = members
      .filter((m) => !existingMatchUserIds.has(m.user.id))
      .map((m) => m.user.id);

    const goalsMap = await getGoalsByUsersAndCommunity(potentialMemberIds, communityId);

    const potentialPartners = [];
    const memberWithoutGoals = [];

    for (const member of members) {
      if (existingMatchUserIds.has(member.user.id)) continue;
      const memberGoals = goalsMap.get(member.user.id) || [];
      if (memberGoals.length > 0) {
        potentialPartners.push({
          userId: member.user.id,
          username: member.user.name,
          goals: memberGoals.map((g: typeof learningGoals.$inferSelect) => ({
            title: g.title,
            description: g.description || "",
          })),
        });
      } else {
        memberWithoutGoals.push(member.user.name);
      }
    }

    if (potentialPartners.length === 0) {
      return { matched: 0, matches: [], message: "No potential partners found with learning goals" };
    }

    const prompt = `You are an AI matching assistant for a learning platform. Your job is to match learners with compatible learning partners.

Current User: ${user.name}
Their Learning Goals:
${currentUserGoals.map((g) => `- ${g.title}: ${g.description}`).join("\n")}

Potential Partners:
${potentialPartners.map((p, idx) => `
${idx + 1}. ${p.username}
   Goals:
   ${p.goals.map((g: { title: string; description: string }) => `   - ${g.title}: ${g.description}`).join("\n")}
`).join("\n")}

Task: Analyze the learning goals and identify the TOP 3 most compatible learning partners for ${user.name}.

IMPORTANT MATCHING CRITERIA:
1. Use SEMANTIC SIMILARITY - goals don't need exact title matches.
2. Look at BOTH title and description to understand what the person wants to learn
3. Consider overlapping or complementary learning goals
4. Be INCLUSIVE - if there's any reasonable connection, include them

Return ONLY a JSON array of partner indices (1-based) in order of compatibility. Return between 1-3 matches maximum.
Example: [2, 5, 1] means partner #2 is the best match, then #5, then #1.
Only return an empty array [] if there are truly NO partners with any related learning interests.`;

    const { text } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      prompt,
    });

    console.log("Raw AI response:", text);

    let jsonText = text.trim();
    if (jsonText.startsWith("```json")) {
      jsonText = jsonText.replace(/^```json\s*\n/, "").replace(/\n```\s*$/, "");
    } else if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```\s*\n/, "").replace(/\n```\s*$/, "");
    }

    let matchIndices = [];
    try {
      matchIndices = JSON.parse(jsonText);
      if (!Array.isArray(matchIndices)) matchIndices = [];
    } catch (error) {
      const arrayMatch = jsonText.match(/\[[\d,\s]+\]/);
      if (arrayMatch) {
        matchIndices = JSON.parse(arrayMatch[0]);
      } else {
        throw new Error("AI returned invalid response");
      }
    }

    const createdMatches = [];
    for (const idx of matchIndices) {
      const partnerIndex = idx - 1;
      if (partnerIndex >= 0 && partnerIndex < potentialPartners.length) {
        const partner = potentialPartners[partnerIndex];
        const match = await createMatch(user.id, partner.userId, communityId);
        createdMatches.push({ ...match, partnerName: partner.username });
      }
    }

    return { matched: createdMatches.length, matches: createdMatches };
  } catch (error) {
    console.error("Error matching users", error);
    return {
      matched: 0,
      matches: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export const generateAISummaries = async (
  conversationId: string,
  conversationMessages: (typeof messages.$inferSelect)[]
) => {
  const userIds = [...new Set(conversationMessages.map((m) => m.senderId))];
  const usersMap = await getUsersByIds(userIds);

  const formattedMessages = conversationMessages.map((m) => {
    const user = usersMap.get(m.senderId);
    return `${user?.name}: ${m.content}`;
  });

  const conversationText = formattedMessages.join("\n");

  const prompt = `You are an AI assistant that summarizes learning conversations between matched learning partners.

Analyze the following conversation and provide:
1. A concise summary of what was discussed
2. Key points and insights shared
3. Action items mentioned in the conversation
4. Next steps for the learning partners

Conversation:
${conversationText}

Please format your response as JSON with this structure:
{
  "summary": "A 2-3 sentence overview",
  "keyPoints": ["point 1", "point 2", ...],
  "actionItems": ["action item 1", "action item 2", ...],
  "nextSteps": ["step 1", "step 2", ...]
}

IMPORTANT: Respond entirely in Spanish.`;

  try {
    const { text } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      prompt,
    });

    let jsonText = text.trim();
    if (jsonText.startsWith("```json")) {
      jsonText = jsonText.replace(/^```json\s*\n/, "").replace(/\n```\s*$/, "");
    } else if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```\s*\n/, "").replace(/\n```\s*$/, "");
    }

    const parsed = JSON.parse(jsonText);

    const [summary] = await db
      .insert(conversationSummaries)
      .values({
        conversationId,
        summary: parsed.summary || "",
        actionItems: parsed.actionItems || [],
        keyPoints: parsed.keyPoints || [],
        nextSteps: parsed.nextSteps || [],
      })
      .returning();

    return summary;
  } catch (error) {
    console.error("Error generating AI summary", error);
    throw new Error("Error generating AI summary");
  }
};

export const getLatestConversationSummary = async (conversationId: string) => {
  const [summary] = await db
    .select()
    .from(conversationSummaries)
    .where(eq(conversationSummaries.conversationId, conversationId))
    .orderBy(desc(conversationSummaries.generatedAt))
    .limit(1);

  return summary || null;
};

export const generateTopicSuggestions = async (
  conversationMessages: (typeof messages.$inferSelect)[],
  userGoals: string[],
  partnerGoals: string[]
): Promise<string[]> => {
  const recentMessages = conversationMessages.slice(-10);
  const conversationContext = recentMessages.length > 0
    ? recentMessages.map((m) => m.content).join("\n")
    : "La conversación acaba de comenzar";

  const prompt = `You are a learning assistant helping two study partners have productive conversations.

Their learning goals:
- User 1: ${userGoals.join(", ")}
- User 2: ${partnerGoals.join(", ")}

Recent conversation:
${conversationContext}

Suggest exactly 3 short conversation topic starters in Spanish that are relevant to their learning goals.
Return ONLY a JSON array of 3 short strings (max 8 words each).
Example: ["¿Cómo aplicas React en proyectos reales?", "¿Qué recursos usas para aprender?", "¿Cuál es tu mayor reto con JavaScript?"]`;

  const { text } = await generateText({
    model: groq("llama-3.3-70b-versatile"),
    prompt,
  });

  let jsonText = text.trim();
  if (jsonText.startsWith("```json")) {
    jsonText = jsonText.replace(/^```json\s*\n/, "").replace(/\n```\s*$/, "");
  } else if (jsonText.startsWith("```")) {
    jsonText = jsonText.replace(/^```\s*\n/, "").replace(/\n```\s*$/, "");
  }

  try {
    const suggestions = JSON.parse(jsonText);
    if (Array.isArray(suggestions)) return suggestions.slice(0, 3);
  } catch {
    const arrayMatch = jsonText.match(/\[[\s\S]*?\]/);
    if (arrayMatch) return JSON.parse(arrayMatch[0]).slice(0, 3);
  }

  return [];
};


export const generatePartnerResponse = async (
  conversationMessages: (typeof messages.$inferSelect)[],
  partnerName: string,
  partnerGoals: string[],
  userGoals: string[]
): Promise<string> => {
  const recentMessages = conversationMessages.slice(-10);
  const conversationContext = recentMessages
    .map((m) => m.content)
    .join("\n");

  const prompt = `You are ${partnerName}, a learning partner on a study platform.

Your learning goals: ${partnerGoals.join(", ")}
Your study partner's goals: ${userGoals.join(", ")}

Recent conversation:
${conversationContext}

Respond naturally as ${partnerName} in Spanish, as a friendly study partner. 
Keep your response short (1-3 sentences), conversational, and relevant to the learning goals.
Do NOT mention you are an AI. Just respond naturally as a person would.`;

  const { text } = await generateText({
    model: groq("llama-3.3-70b-versatile"),
    prompt,
  });

  return text.trim();
};