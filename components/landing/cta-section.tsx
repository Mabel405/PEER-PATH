import { Button } from "../ui/button";
import Link from "next/link";

export default function CtaSection() {
  return (
    <section className="section-container section-padding">
      <div className="border rounded-lg p-8 sm:p-12 text-center">
        <div className="max-w-2xl mx-auto">
          <h2>Deja de aprender solo</h2>
          <p className="text-lg mb-8">
            Conéctate con alguien que esté aprendiendo lo mismo. 
            Manténganse motivados mutuamente. Progresen de verdad.
          </p>
          <Link href="/sign-up">
            <Button size="lg">Pruébalo gratis</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}