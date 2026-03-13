import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import ChatInterface from "@/components/chat/chat-interface";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = await params;

  return (
    <div className="page-wrapper">
      <div>
        <Link href="/chat">
          <Button variant="outline">
            <ArrowLeftIcon className="size-4" /> Volver a Conversaciones
          </Button>
        </Link>
      </div>

      {/* Interfaz de chat para la coincidencia seleccionada */}
      <ChatInterface matchId={matchId} />
    </div>
  );
}