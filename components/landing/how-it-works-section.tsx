import { Card, CardDescription, CardHeader, CardTitle } from "../ui/card";
import SectionHeading from "./section-heading";

const steps = [
  {
    title: "Elige una comunidad",
    description:
      "Explora comunidades y únete a las que coincidan con lo que estás aprendiendo.",
  },
  {
    title: "Añade tus metas",
    description:
      "Cuéntanos qué quieres aprender, en qué nivel estás y en qué estás trabajando.",
  },
  {
    title: "Encuentra tu match",
    description:
      "Te buscaremos alguien con metas similares y los emparejaremos para manteneros motivados.",
  },
  {
    title: "Empieza a aprender",
    description:
      "Conversa con tu compañero, programen sesiones y ayúdense mutuamente a mantener el rumbo.",
  },
];

export default function HowItWorksSection() {
  return (
    <section className="section-padding">
      <div className="section-container">
        <SectionHeading
          title="Cómo Funciona"
          description="Encuentra a tu compañero de aprendizaje ideal en cuatro simples pasos"
        />
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, idx) => (
            <Card
              key={idx}
              className="hover:scale-105 transition-all duration-300"
            >
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <div className="step-number">{idx + 1}</div>
                </div>

                <CardTitle>{step.title}</CardTitle>
                <CardDescription>{step.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}