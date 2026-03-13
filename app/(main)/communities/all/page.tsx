"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { ArrowLeftIcon, CheckIcon, LockIcon, LogOutIcon } from "lucide-react";
import Link from "next/link";
import {
  useAllCommunities,
  useCommunities,
  useJoinCommunity,
  useLeaveCommunity,
} from "@/hooks/use-communities";
import { toast } from "sonner";
import { useCurrentUser } from "@/hooks/use-users";
import { useState } from "react";

export default function AllCommunitiesPage() {
  const [leavingId, setLeavingId] = useState<string | null>(null);
  
  const {
    data: allCommunities,
    isLoading: isLoadingAllCommunities,
    error: errorAllCommunities,
  } = useAllCommunities();

  const { data: user } = useCurrentUser();
  const isPro = user?.isPro;

  const { data: userCommunities } = useCommunities();
  const numberOfCommunities = userCommunities?.length || 0;

  const isJoined = (communityId: string) => {
    return userCommunities?.some(
      (community) => community.community.id === communityId
    );
  };

  const showLockIcon = numberOfCommunities >= 5 && !isPro;

  const joinCommunityMutation = useJoinCommunity();
  const leaveCommunityMutation = useLeaveCommunity();

  const handleJoinCommunity = async (communityId: string) => {
    await joinCommunityMutation.mutateAsync(communityId);
    toast.success("Te has unido a la comunidad exitosamente");
  };

  const handleLeaveCommunity = async (communityId: string) => {
    setLeavingId(communityId);
    try {
      await leaveCommunityMutation.mutateAsync(communityId);
    } finally {
      setLeavingId(null);
    }
  };

  if (isLoadingAllCommunities) return <div>Cargando...</div>;
  if (errorAllCommunities)
    return <div>Error: {errorAllCommunities.message}</div>;

  return (
    <div>
      <Link href="/communities">
        <Button variant={"outline"}>
          <ArrowLeftIcon className="size-4" />
          Volver a Mis Comunidades
        </Button>
      </Link>
      <div className="space-y-4 mt-4">
        <h2 className="text-2xl font-bold">Explorar Comunidades</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {allCommunities?.map((community) => (
            <Card key={community.id}>
              <CardHeader>
                <CardTitle>{community.name}</CardTitle>
                <CardDescription>{community.description}</CardDescription>
                <CardFooter className="px-0 mt-2 flex flex-col gap-2">
                  {isJoined(community.id) ? (
                    <>
                      <Button
                        className="w-full"
                        variant="outline"
                        disabled={true}
                      >
                        <CheckIcon className="size-4 mr-2" /> Unido
                      </Button>
                      <Button
                        className="w-full"
                        variant="destructive"
                        size="sm"
                        onClick={() => handleLeaveCommunity(community.id)}
                        disabled={leavingId === community.id}
                      >
                        <LogOutIcon className="size-4 mr-2" />
                        {leavingId === community.id ? "Abandonando..." : "Abandonar comunidad"}
                      </Button>
                    </>
                  ) : (
                    <Button
                      className="w-full"
                      disabled={showLockIcon}
                      onClick={() => handleJoinCommunity(community.id)}
                    >
                      {showLockIcon && (
                        <LockIcon className="size-4 text-muted-foreground mr-2" />
                      )}
                      Unirse a la comunidad
                    </Button>
                  )}
                </CardFooter>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}