"use client";

import { useDeleteLearningGoal, useUpdateLearningGoal } from "@/hooks/use-goals";
import { PencilIcon, Trash2Icon, CheckIcon, XIcon, LockIcon, UsersIcon, TargetIcon, SparklesIcon, MoreVerticalIcon, LogOutIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import AddLearningGoal from "@/components/communities/add-learning-goal";
import AIMatching from "@/components/communities/ai-matching";
import { Button } from "@/components/ui/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useCommunities, useCommunityGoals, useLeaveCommunity } from "@/hooks/use-communities";
import { useCurrentUser } from "@/hooks/use-users";
import { startTransition, useEffect, useState } from "react";
import { toast } from "sonner";

export default function CommunitiesPage() {
  const [activeTab, setActiveTab] = useState<"goals" | "matches">("goals");
  const [selectedCommunity, setSelectedCommunity] = useState<string | null>(null);
  const [leavingId, setLeavingId] = useState<string | null>(null);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");

  // ✅ Estado para el dialog de eliminar meta
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<string | null>(null);

  // ✅ Estado para el dialog de abandonar comunidad
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [communityToLeave, setCommunityToLeave] = useState<string | null>(null);

  const { data: communities } = useCommunities();
  const { data: communityGoals } = useCommunityGoals(selectedCommunity);
  const leaveCommunityMutation = useLeaveCommunity();
  const deleteGoalMutation = useDeleteLearningGoal();
  const updateGoalMutation = useUpdateLearningGoal();

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

  // ✅ Abandonar comunidad con dialog
  const handleLeaveCommunity = async () => {
    if (!communityToLeave) return;
    setLeavingId(communityToLeave);
    try {
      await leaveCommunityMutation.mutateAsync(communityToLeave);
      if (selectedCommunity === communityToLeave) {
        const remaining = communities?.filter(c => c.community.id !== communityToLeave) || [];
        setSelectedCommunity(remaining.length > 0 ? remaining[0].community.id : null);
      }
    } finally {
      setLeavingId(null);
      setLeaveDialogOpen(false);
      setCommunityToLeave(null);
    }
  };

  // ✅ Eliminar meta con dialog
  const handleDeleteGoal = async () => {
    if (!goalToDelete) return;
    await deleteGoalMutation.mutateAsync({
      goalId: goalToDelete,
      communityId: selectedCommunity!,
    });
    toast.success("Meta eliminada");
    setDeleteDialogOpen(false);
    setGoalToDelete(null);
  };

  const handleSaveEdit = async (goalId: string) => {
    await updateGoalMutation.mutateAsync({
      goalId,
      communityId: selectedCommunity!,
      title: editingText.slice(0, 100),
      description: editingText,
    });
    toast.success("Meta actualizada");
    setEditingGoalId(null);
  };

  const getGoalText = (count: number) => count === 1 ? "meta" : "metas";

  return (
    <div className="grid gap-6 lg:grid-cols-3">

      {/* ✅ Dialog eliminar meta */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar esta meta?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteGoal}
              disabled={deleteGoalMutation.isPending}
            >
              {deleteGoalMutation.isPending ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ✅ Dialog abandonar comunidad */}
      <Dialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Abandonar esta comunidad?</DialogTitle>
            <DialogDescription>
              Perderás acceso a las metas y compañeros de esta comunidad.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLeaveDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleLeaveCommunity}
              disabled={!!leavingId}
            >
              {leavingId ? "Abandonando..." : "Abandonar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {showLockIcon && <LockIcon className="size-4 text-muted-foreground" />}
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
                onClick={() => setSelectedCommunity(c.community.id)}
                variant={selectedCommunity === c.community.id ? "default" : "outline"}
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
                    onClick={() => {
                      setCommunityToLeave(c.community.id);
                      setLeaveDialogOpen(true);
                    }}
                    disabled={leavingId === c.community.id}
                  >
                    <LogOutIcon className="size-4 mr-2" />
                    Abandonar comunidad
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
              <><TargetIcon className="size-5" /> Metas de Aprendizaje</>
            ) : (
              <><SparklesIcon className="size-5" /> Posibles Compañeros de Aprendizaje</>
            )}
          </CardTitle>
          <CardDescription>
            {activeTab === "goals" ? (
              selectedCommunity
                ? `${communityGoals?.length || 0} ${getGoalText(communityGoals?.length || 0)} en la comunidad seleccionada`
                : "Selecciona una comunidad para ver sus metas"
            ) : "Miembros con metas de aprendizaje similares"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeTab === "goals" ? (
            <div className="space-y-4">
              {communityGoals && communityGoals.length > 0 ? (
                communityGoals.map((c) => (
                  <Card key={c.id} className="shadow-none border-l-4 border-l-primary">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          {editingGoalId === c.id ? (
                            <Input
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              autoFocus
                            />
                          ) : (
                            <>
                              <CardTitle className="text-base font-semibold">{c.title}</CardTitle>
                              <CardDescription className="text-sm">{c.description}</CardDescription>
                            </>
                          )}
                        </div>
                        <div className="flex gap-1 shrink-0">
                          {editingGoalId === c.id ? (
                            <>
                              <Button
                                size="icon" variant="ghost"
                                className="h-7 w-7 text-green-600 hover:text-green-700"
                                onClick={() => handleSaveEdit(c.id)}
                                disabled={updateGoalMutation.isPending || editingText.trim().length === 0}
                              >
                                <CheckIcon className="size-4" />
                              </Button>
                              <Button
                                size="icon" variant="ghost" className="h-7 w-7"
                                onClick={() => setEditingGoalId(null)}
                              >
                                <XIcon className="size-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="icon" variant="ghost" className="h-7 w-7"
                                onClick={() => {
                                  setEditingGoalId(c.id);
                                  setEditingText(c.title);
                                }}
                              >
                                <PencilIcon className="size-4" />
                              </Button>
                              <Button
                                size="icon" variant="ghost"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={() => {
                                  setGoalToDelete(c.id);
                                  setDeleteDialogOpen(true);
                                }}
                                disabled={deleteGoalMutation.isPending}
                              >
                                <Trash2Icon className="size-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
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