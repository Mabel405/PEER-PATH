"use client";

import AddLearningGoal from "@/components/communities/add-learning-goal";
import AIMatching from "@/components/communities/ai-matching";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCommunities, useCommunityGoals, useLeaveCommunity } from "@/hooks/use-communities";
import { useCurrentUser } from "@/hooks/use-users";
import { BotIcon, LockIcon, UsersIcon, TargetIcon, SparklesIcon, MoreVerticalIcon, LogOutIcon } from "lucide-react";
import { startTransition, useEffect, useState } from "react";
import { toast } from "sonner";

export default function CommunitiesPage() {
  const [activeTab, setActiveTab] = useState<"goals" | "matches">("goals");
  const [selectedCommunity, setSelectedCommunity] = useState<string | null>(
    null
  );
  const [leavingId, setLeavingId] = useState<string | null>(null);
  
  const {
    data: communities,
    isLoading: isLoadingCommunities,
    error: errorCommunities,
  } = useCommunities();

  const {
    data: communityGoals,
    isLoading: isLoadingCommunityGoals,
    error: errorCommunityGoals,
  } = useCommunityGoals(selectedCommunity);

  const leaveCommunityMutation = useLeaveCommunity();

  useEffect(() => {
    if (communities && communities.length > 0 && !selectedCommunity) {
      startTransition(() => {
        setSelectedCommunity(communities[0].community.id);
      });
    }
  }, [communities?.length]);

  const numberOfCommunities = communities?.length || 0;

  const { data: user } = useCurrentUser();
  const isPro = user?.isPro;

  const showLockIcon = numberOfCommunities >= 3 && !isPro;

  const handleLeaveCommunity = async (communityId: string) => {
    if (confirm("¿Estás seguro de que quieres abandonar esta comunidad?")) {
      setLeavingId(communityId);
      try {
        await leaveCommunityMutation.mutateAsync(communityId);
        if (selectedCommunity === communityId) {
          // Si abandonamos la comunidad seleccionada, seleccionamos otra
          const remainingCommunities = communities?.filter(c => c.community.id !== communityId) || [];
          if (remainingCommunities.length > 0) {
            setSelectedCommunity(remainingCommunities[0].community.id);
          } else {
            setSelectedCommunity(null);
          }
        }
      } finally {
        setLeavingId(null);
      }
    }
  };

  // Función para manejar el texto plural
  const getGoalText = (count: number) => {
    return count === 1 ? "meta" : "metas";
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {showLockIcon && (
              <LockIcon className="size-4 text-muted-foreground" />
            )}
            <UsersIcon className="size-5" />
            Comunidades
          </CardTitle>
          <CardDescription>
            {communities?.length} {communities?.length === 1 ? "unida" : "unidas"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {communities?.map((c) => (
            <div key={c.community.id} className="flex items-center gap-1">
              <Button
                className="flex-1 justify-start truncate"
                onClick={() => {
                  setSelectedCommunity(c.community.id);
                }}
                variant={
                  selectedCommunity === c.community.id ? "default" : "outline"
                }
                title={c.community.name}
              >
                {c.community.name}
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-10 w-10">
                    <MoreVerticalIcon className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => handleLeaveCommunity(c.community.id)}
                    disabled={leavingId === c.community.id}
                  >
                    <LogOutIcon className="size-4 mr-2" />
                    {leavingId === c.community.id ? "Abandonando..." : "Abandonar comunidad"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
          {communities?.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No te has unido a ninguna comunidad
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex flex-wrap gap-2 mb-4">
            <Button
              onClick={() => setActiveTab("goals")}
              variant={activeTab === "goals" ? "default" : "outline"}
              className="flex items-center gap-2"
            >
              <TargetIcon className="size-4" />
              Mis Metas
            </Button>
            <Button
              onClick={() => setActiveTab("matches")}
              variant={activeTab === "matches" ? "default" : "outline"}
              className="flex items-center gap-2"
            >
              <SparklesIcon className="size-4" />
              Encontrar Compañeros con IA
            </Button>
          </div>
          <CardTitle className="flex items-center gap-2">
            {activeTab === "goals" ? (
              <>
                <TargetIcon className="size-5" />
                Metas de Aprendizaje
              </>
            ) : (
              <>
                <SparklesIcon className="size-5" />
                Posibles Compañeros de Aprendizaje
              </>
            )}
          </CardTitle>
          <CardDescription>
            {activeTab === "goals" ? (
              selectedCommunity ? (
                `${communityGoals?.length || 0} ${getGoalText(communityGoals?.length || 0)} en la comunidad seleccionada`
              ) : (
                "Selecciona una comunidad para ver sus metas"
              )
            ) : (
              "Miembros con metas de aprendizaje similares"
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeTab === "goals" ? (
            <div className="space-y-4">
              {communityGoals && communityGoals.length > 0 ? (
                communityGoals.map((c) => (
                  <Card key={c.id} className="shadow-none border-l-4 border-l-primary">
                    <CardHeader>
                      <CardTitle className="text-base font-semibold">
                        {c.title}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {c.description}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {selectedCommunity 
                    ? "No hay metas en esta comunidad todavía" 
                    : "Selecciona una comunidad para ver sus metas"}
                </p>
              )}
              {selectedCommunity && (
                <AddLearningGoal
                  selectedCommunityId={selectedCommunity}
                  showLockIcon={showLockIcon}
                />
              )}
            </div>
          ) : (
            <AIMatching
              totalGoals={communityGoals?.length || 0}
              selectedCommunityId={selectedCommunity!}
              showLockIcon={showLockIcon}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}