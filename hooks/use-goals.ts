import { client } from "@/lib/api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useCreateLearningGoal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      communityId,
      title,
      description,
      tags,
    }: {
      communityId: string;
      title: string;
      description: string;
      tags: string[] | undefined;
    }) => {
      const res = await client.api.communities.goals.$post({
        json: { title, communityId, description, tags },
        param: { communityId },
      });
      if (!res.ok) throw new Error("Failed to create learning goal");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["communityGoals", variables.communityId] });
      queryClient.invalidateQueries({ queryKey: ["communityGoals", "all"] });
    },
    onError: (error) => {
      console.error("Error creating learning goal", error);
    },
  });
};

// ✅ Eliminar meta — fetch directo
export const useDeleteLearningGoal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ goalId }: { goalId: string; communityId: string }) => {
      const res = await fetch(`/api/communities/goals/${goalId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete learning goal");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["communityGoals", variables.communityId] });
      queryClient.invalidateQueries({ queryKey: ["communityGoals", "all"] });
    },
    onError: (error) => {
      console.error("Error deleting learning goal", error);
    },
  });
};

// ✅ Editar meta — fetch directo
export const useUpdateLearningGoal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      goalId,
      title,
      description,
      tags,
    }: {
      goalId: string;
      communityId: string;
      title?: string;
      description?: string;
      tags?: string[];
    }) => {
      const res = await fetch(`/api/communities/goals/${goalId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, tags }),
      });
      if (!res.ok) throw new Error("Failed to update learning goal");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["communityGoals", variables.communityId] });
      queryClient.invalidateQueries({ queryKey: ["communityGoals", "all"] });
    },
    onError: (error) => {
      console.error("Error updating learning goal", error);
    },
  });
};