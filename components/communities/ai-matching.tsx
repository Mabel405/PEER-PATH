import { useAiPartners } from "@/hooks/use-ai-partner";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { LockIcon } from "lucide-react";

export default function AIMatching({
  totalGoals,
  selectedCommunityId,
  showLockIcon,
}: {
  totalGoals: number;
  selectedCommunityId: string;
  showLockIcon: boolean;
}) {
  const aiPartnerMutation = useAiPartners();

  const handleFindAIPartners = async () => {
    try {
      await aiPartnerMutation.mutateAsync(selectedCommunityId);
      toast.success("Compañeros de IA encontrados exitosamente");
    } catch (error) {
      console.error("Error finding ai partners", error);
      toast.error("Error al encontrar compañeros con IA");
    }
  };
  return (
    <div className="text-center py-8">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Emparejamiento con IA</h3>
        <p>
          Nuestra IA analizará tus metas de aprendizaje y te emparejará automáticamente
          con los compañeros más compatibles en esta comunidad.
        </p>
      </div>
      <Button
        size="lg"
        disabled={totalGoals === 0 || showLockIcon}
        onClick={handleFindAIPartners}
      >
        {showLockIcon && <LockIcon className="size-4 text-muted-foreground" />}
        🤖 Encontrar Compañeros con IA
      </Button>
      {totalGoals > 0 && (
        <p className="mt-4 text-sm text-muted-foreground">
          Tienes {totalGoals} {totalGoals === 1 ? "meta" : "metas"} de aprendizaje {totalGoals === 1 ? "establecida" : "establecidas"}
        </p>
      )}
      {totalGoals === 0 && (
        <p className="mt-4 text-sm text-muted-foreground">
          Agrega metas de aprendizaje primero para activar el emparejamiento con IA
        </p>
      )}
    </div>
  );
}