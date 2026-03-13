import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function CommunitiesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="page-wrapper">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Comunidades</h1>
          <p className="text-muted-foreground">
            Gestiona tus metas de aprendizaje y encuentra compañeros de estudio
          </p>
        </div>
        <div>
          <Link href="/communities/all">
            <Button variant={"outline"}>+ Unirse a más comunidades</Button>
          </Link>
        </div>
      </div>
      {children}
    </div>
  );
}