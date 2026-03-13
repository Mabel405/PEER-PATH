// dashboard/page.tsx
"use client";
import StatsCard from "@/components/dashboard/stats-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useMatches } from "@/hooks/use-ai-partner";
import { client } from "@/lib/api-client";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { MessageCircleIcon, UsersIcon } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const user = useUser();

  const {
    data: userCommunities,
    isLoading: isLoadingUserCommunities,
    error: errorUserCommunities,
  } = useQuery({
    queryKey: ["communities"],
    queryFn: async () => {
      const res = await client.api.communities.$get();
      if (!res.ok) throw new Error("Error al obtener las comunidades");
      return res.json();
    },
  });

  const { data: allMatches } = useQuery({
    queryKey: ["allMatches"],
    queryFn: async () => {
      const res = await client.api.matches["allmatches"].$get();
      if (!res.ok) throw new Error("Error al obtener los matches");
      return res.json();
    },
  });

  const pendingMatchesData = allMatches?.filter(
    (match) => match.status === "pending"
  );
  const activeMatchesData = allMatches?.filter(
    (match) => match.status === "accepted"
  );

  // ✅ Suma goals de todas las comunidades del usuario
  const { data: learningGoals } = useQuery({
    queryKey: ["communityGoals", "all"],
    queryFn: async () => {
      if (!userCommunities?.length) return [];
      const results = await Promise.all(
        userCommunities.map((c) =>
          client.api.communities[":communityId"].goals
            .$get({ param: { communityId: c.community.id } })
            .then((r) => r.json())
        )
      );
      return results.flat();
    },
    enabled: !!userCommunities?.length,
  });

  const { data: matches } = useMatches();

  if (isLoadingUserCommunities) return <div>Cargando...</div>;
  if (errorUserCommunities)
    return <div>Error: {errorUserCommunities.message}</div>;

  return (
    <div className="page-wrapper">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Panel de control</h1>
        <p className="text-muted-foreground">
          ¡Bienvenido de nuevo, {user?.user?.firstName || "Usuario"}!
        </p>
      </div>

      <Card className="border-primary">
        <CardHeader>
          <CardTitle>
            🎉 Tienes {pendingMatchesData?.length ?? 0}{" "}
            {pendingMatchesData?.length === 1 ? "nuevo match" : "nuevos matches"}!
          </CardTitle>
          <CardDescription>
            Revisa y acepta tus matches para comenzar a chatear
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/chat">
            <Button>Revisar Matches</Button>
          </Link>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard
          title="Tus comunidades"
          value={userCommunities?.length ?? 0}
        />
        <StatsCard
          title="Objetivos de aprendizaje"
          value={learningGoals?.length ?? 0}
        />
        <StatsCard
          title="Matches activos"
          value={activeMatchesData?.length ?? 0}
        />
        <StatsCard
          title="Matches pendientes"
          value={pendingMatchesData?.length ?? 0}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <MessageCircleIcon className="size-4 mr-2 text-primary" />
                Chats recientes
              </CardTitle>
              <Link href="/chat">
                <Button variant="outline" size="sm">
                  <UsersIcon className="size-4 mr-2 text-primary" />
                  Ver todos
                </Button>
              </Link>
            </div>
            <CardDescription>Conversaciones de las que formas parte</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {matches?.map((match) => (
                <Link href={`/chat/${match.id}`} key={match.id}>
                  <Card className="shadow-none">
                    <CardHeader>
                      <div className="flex items-center gap-4">
                        <UserAvatar
                          name={match.partner.name}
                          imageUrl={match.partner.imageUrl ?? undefined}
                          size="sm"
                        />
                        <div className="flex-1 min-w-0">
                          <CardTitle className="font-medium">
                            {match.partner.name}
                          </CardTitle>
                          <CardDescription className="text-xs text-muted-foreground mt-1">
                            <span>
                              {match.userGoals.map((g) => g.title).join(", ")}
                            </span>
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <UsersIcon className="size-4 mr-2 text-primary" />
                Comunidades
              </CardTitle>
              <Link href="/communities">
                <Button variant="outline" size="sm">
                  <UsersIcon className="size-4 mr-2 text-primary" />
                  Gestionar
                </Button>
              </Link>
            </div>
            <CardDescription>Comunidades de las que formas parte</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {userCommunities?.map((community) => (
                <Card className="shadow-none" key={community.id}>
                  <Link href={`/communities/${community.id}`}>
                    <CardHeader>
                      <CardTitle className="text-sm">
                        {community.community.name}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {community.community.description}
                      </CardDescription>
                    </CardHeader>
                  </Link>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}