"use client";

import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { UserAvatar } from "../ui/user-avatar";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/api-client";
import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import { SparklesIcon } from "lucide-react";

export default function ChatInterface({ matchId }: { matchId: string }) {
  const { user: clerkUser } = useUser();
  const [message, setMessage] = useState("");

  const { data: conversation } = useQuery({
    queryKey: ["conversation", matchId],
    queryFn: async () => {
      const res = await client.api.matches[":matchId"].conversation.$get({
        param: { matchId },
      });
      if (!res.ok) throw new Error("Failed to fetch conversation");
      return res.json();
    },
  });

  const { data: messages } = useQuery({
    queryKey: ["messages", conversation?.id],
    queryFn: async () => {
      const res = await client.api.conversations[":conversationId"].messages.$get({
        param: { conversationId: conversation?.id ?? "" },
      });
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json();
    },
    refetchInterval: 5000,
    enabled: !!conversation?.id,
  });

  const { data: suggestionsData, refetch: refetchSuggestions, isFetching: isFetchingSuggestions } = useQuery({
    queryKey: ["suggestions", conversation?.id],
    queryFn: async () => {
      const res = await fetch(`/api/conversations/${conversation?.id}/suggestions`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to fetch suggestions");
      return res.json() as Promise<{ suggestions: string[] }>;
    },
    enabled: false,
  });

  const queryClient = useQueryClient();

  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      const res = await client.api.conversations[":conversationId"].messages.$post({
        param: { conversationId: conversation?.id ?? "" },
        // @ts-expect-error - content is not defined in the API client
        json: { content: message },
      });
      if (!res.ok) throw new Error("Failed to send message");
      return res.json();
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["messages", conversation?.id] });
      refetchSuggestions();
    },
    onError: (error) => console.error(error),
  });

  const generateSummaryMutation = useMutation({
    mutationFn: async () => {
      const res = await client.api.conversations[":conversationId"].summarize.$post({
        param: { conversationId: conversation?.id ?? "" },
      });
      if (!res.ok) throw new Error("Failed to generate summary");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["summary", conversation?.id] });
    },
    onError: (error) => console.error("Error generating summary", error),
  });

  const { data: summary } = useQuery({
    queryKey: ["summary", conversation?.id],
    queryFn: async () => {
      const res = await client.api.conversations[":conversationId"].summary.$get({
        param: { conversationId: conversation?.id ?? "" },
      });
      if (!res.ok) throw new Error("Failed to fetch summary");
      return res.json();
    },
    enabled: !!conversation?.id,
  });

  if (!conversation) return <div>Cargando...</div>;

  const otherUser = {
    id: conversation.otherUser.id,
    name: conversation.otherUser.name,
    imageUrl: conversation.otherUser.imageUrl,
  };

  const currentUser = {
    name: (clerkUser?.firstName + " " + clerkUser?.lastName).trim() ?? "Tú",
    imageUrl: clerkUser?.imageUrl ?? undefined,
  };

  const suggestions = suggestionsData?.suggestions ?? [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="col-span-2">
        <Card className="h-[600px] flex flex-col">
          <CardHeader className="border-b">
            <div className="flex items-center gap-3">
              <UserAvatar name={otherUser.name} imageUrl={otherUser.imageUrl ?? undefined} />
              <CardTitle>{otherUser.name}</CardTitle>
            </div>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages?.map((message) => {
              const isCurrentUser = message.senderId === conversation.currentUserId;
              const user = isCurrentUser ? currentUser : otherUser;
              return (
                <div key={message.id} className="space-y-4">
                  <div className={cn("flex items-center gap-2", isCurrentUser ? "justify-end" : "justify-start")}>
                    {!isCurrentUser && (
                      <UserAvatar name={user?.name ?? "U"} imageUrl={user?.imageUrl ?? undefined} />
                    )}
                    <div className={cn("max-w-[70%] rounded-lg p-3", isCurrentUser ? "bg-primary/10 text-primary-foreground" : "bg-muted")}>
                      <p className="text-sm text-foreground">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1 text-foreground">
                        {new Date(message.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                    {isCurrentUser && (
                      <UserAvatar name={currentUser?.name ?? "Tú"} imageUrl={currentUser?.imageUrl ?? undefined} />
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>

          <CardFooter className="border-t p-4 flex flex-col gap-2">
            <div className="w-full">
              <div className="flex items-center gap-2 mb-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs text-muted-foreground h-7 px-2"
                  onClick={() => refetchSuggestions()}
                  disabled={isFetchingSuggestions}
                >
                  <SparklesIcon className="size-3 mr-1" />
                  {isFetchingSuggestions ? "Generando..." : "Sugerir temas"}
                </Button>
              </div>
              {suggestions.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {suggestions.map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => setMessage(suggestion)}
                      className="text-xs px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex w-full gap-2 items-center">
              <Textarea
                placeholder="Escribe tu mensaje..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="resize-none"
                rows={2}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessageMutation.mutate();
                  }
                }}
              />
              <Button
                onClick={() => sendMessageMutation.mutate()}
                disabled={sendMessageMutation.isPending || message.trim().length === 0}
              >
                {sendMessageMutation.isPending ? "..." : "Enviar"}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>

      <div className="col-span-1">
        <Card className="w-full">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Resumen de la Conversación</CardTitle>
              <Button size="sm" onClick={() => generateSummaryMutation.mutate()}
                disabled={generateSummaryMutation.isPending}>
                {generateSummaryMutation.isPending ? "Generando..." : "Generar"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {summary ? (
              <>
                <div>
                  <h4 className="font-medium mb-2">Resumen</h4>
                  <p className="text-sm text-muted-foreground">{summary.summary}</p>
                </div>
                {summary.keyPoints && summary.keyPoints.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Puntos Clave</h4>
                    <ul className="space-y-1">
                      {summary.keyPoints.map((point: string, index: number) => (
                        <li key={index} className="text-sm text-muted-foreground">• {point}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {summary.actionItems && summary.actionItems.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Tareas</h4>
                    <div className="space-y-2">
                      {summary.actionItems.map((item: string, index: number) => (
                        <div key={index} className="flex items-start gap-2">
                          <ul className="flex-1 list-disc list-inside">
                            <li className="text-sm">{item}</li>
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {summary.nextSteps && summary.nextSteps.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Próximos Pasos</h4>
                    <ul className="space-y-1">
                      {summary.nextSteps.map((step: string, index: number) => (
                        <li key={index} className="text-sm text-muted-foreground">• {step}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Aún no hay resumen. Haz clic en &quot;Generar&quot; para crearlo.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}