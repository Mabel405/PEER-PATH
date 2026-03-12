import { PricingTable } from "@clerk/nextjs";
import SectionHeading from "./section-heading";

export default function PricingSection() {
  return (
    <section className="section-container section-padding" id="pricing">
      <SectionHeading
        title="Precios simples y transparentes"
        description="Elige el plan que mejor se adapte a ti. Empieza gratis y mejora cuando lo necesites."
      />
      <div className="max-w-6xl mx-auto">
        <PricingTable />
      </div>
    </section>
  );
}