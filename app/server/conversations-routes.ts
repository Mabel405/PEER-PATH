import { db } from "@/db";
import { conversations, messages, learningGoals, matches, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { authMiddleware } from "./middleware/auth-middleware";
import { generateAISummaries, generatePartnerResponse, generateTopicSuggestions, getLatestConversationSummary } from "@/lib/ai";

type Variables = {
  userId: string;
};

const conversationsApp = new Hono<{ Variables: Variables }>()
  .use("/*", authMiddleware)
  .get("/:conversationId/messages", async (c) => {
    const conversationId = c.req.param("conversationId");
    const conversationMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId));
    return c.json(conversationMessages);
  })
  // ✅ Con bot integrado
  .post("/:conversationId/messages", async (c) => {
    const conversationId = c.req.param("conversationId");
    const user = c.get("user");
    const { content } = await c.req.json();

    // 1. Guardar mensaje del usuario
    const [message] = await db
      .insert(messages)
      .values({ conversationId, content, senderId: user.id })
      .returning();

    await db
      .update(conversations)
      .set({ lastMessageAt: new Date() })
      .where(eq(conversations.id, conversationId));

    // 2. Obtener contexto
    const conversationMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);

    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId));

    const [match] = await db
      .select()
      .from(matches)
      .where(eq(matches.id, conversation.matchId));

    const partnerId = match.user1Id === user.id ? match.user2Id : match.user1Id;

    const [partner] = await db
      .select()
      .from(users)
      .where(eq(users.id, partnerId));

    const userGoals = await db
      .select()
      .from(learningGoals)
      .where(eq(learningGoals.userId, user.id));

    const partnerGoals = await db
      .select()
      .from(learningGoals)
      .where(eq(learningGoals.userId, partnerId));

    // 3. Generar y guardar respuesta del bot como si fuera el compañero
    try {
      const aiResponse = await generatePartnerResponse(
        conversationMessages,
        partner.name,
        partnerGoals.map((g) => g.title),
        userGoals.map((g) => g.title)
      );

      await db
        .insert(messages)
        .values({
          conversationId,
          content: aiResponse,
          senderId: partnerId,
        });

      await db
        .update(conversations)
        .set({ lastMessageAt: new Date() })
        .where(eq(conversations.id, conversationId));
    } catch (error) {
      console.error("Error generating AI response", error);
    }

    return c.json(message);
  })
  .post("/:conversationId/summarize", async (c) => {
    const conversationId = c.req.param("conversationId");
    const conversationMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);
    const summary = await generateAISummaries(conversationId, conversationMessages);
    return c.json(summary);
  })
  .get("/:conversationId/summary", async (c) => {
    const conversationId = c.req.param("conversationId");
    const summary = await getLatestConversationSummary(conversationId);
    return c.json(summary);
  })
  .post("/:conversationId/suggestions", async (c) => {
    const conversationId = c.req.param("conversationId");
    const user = c.get("user");

    const conversationMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);

    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId));

    const [match] = await db
      .select()
      .from(matches)
      .where(eq(matches.id, conversation.matchId));

    const partnerId = match.user1Id === user.id ? match.user2Id : match.user1Id;

    const userGoals = await db
      .select()
      .from(learningGoals)
      .where(eq(learningGoals.userId, user.id));

    const partnerGoals = await db
      .select()
      .from(learningGoals)
      .where(eq(learningGoals.userId, partnerId));

    const suggestions = await generateTopicSuggestions(
      conversationMessages,
      userGoals.map((g) => g.title),
      partnerGoals.map((g) => g.title)
    );

    return c.json({ suggestions });
  });

export { conversationsApp };