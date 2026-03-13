// use-communities.ts
import { client } from "@/lib/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useCommunities = () => {
  return useQuery({
    queryKey: ["communities"],
    queryFn: async () => {
      const res = await client.api.communities.$get();
      if (!res.ok) {
        throw new Error("Error al obtener las comunidades");
      }
      return res.json();
    },
  });
};

export const useAllCommunities = () => {
  return useQuery({
    queryKey: ["allCommunities"],
    queryFn: async () => {
      const res = await client.api.communities.all.$get();
      if (!res.ok) {
        throw new Error("Error al obtener todas las comunidades");
      }
      return res.json();
    },
  });
};

export const useCommunityGoals = (communityId: string | null) => {
  return useQuery({
    queryKey: ["communityGoals", communityId],
    queryFn: async () => {
      const res = await client.api.communities[":communityId"].goals.$get({
        param: { communityId: communityId! },
      });
      if (!res.ok) {
        throw new Error("Error al obtener las metas de la comunidad");
      }
      return res.json();
    },
    enabled: !!communityId,
  });
};

export const useJoinCommunity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (communityId: string) => {
      const res = await client.api.communities[":communityId"].join.$post({
        param: { communityId: communityId },
      });
      if (!res.ok) {
        if (res.status === 409) {
          throw new Error("Ya eres miembro de esta comunidad");
        }
        throw new Error("Error al unirse a la comunidad");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communities"] });
      queryClient.invalidateQueries({ queryKey: ["allCommunities"] });
      queryClient.invalidateQueries({ queryKey: ["communityGoals"] }); // ✅
    },
    onError: (error) => {
      console.error("Error al unirse a la comunidad", error);
    },
  });
};

export const useLeaveCommunity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (communityId: string) => {
      const res = await client.api.communities[":communityId"].leave.$post({
        param: { communityId: communityId },
      });
      if (!res.ok) {
        throw new Error("Error al abandonar la comunidad");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communities"] });
      queryClient.invalidateQueries({ queryKey: ["allCommunities"] });
      queryClient.invalidateQueries({ queryKey: ["communityGoals"] }); // ✅
      toast.success("Has abandonado la comunidad exitosamente");
    },
    onError: (error) => {
      console.error("Error al abandonar la comunidad", error);
      toast.error("Error al abandonar la comunidad");
    },
  });
};