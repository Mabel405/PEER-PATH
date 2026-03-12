import { RocketIcon, SparkleIcon, ZapIcon } from "lucide-react";
import { Badge } from "../ui/badge";
import { HeroGradient } from "./background-gradient";
import Link from "next/link";
import { Button } from "../ui/button";
import { MotionDiv } from "../ui/motion-div";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <HeroGradient />
      <div className="relative section-container section-padding">
        <div className="text-center">
          <Badge className="mb-6 text-sm font-medium bg-cyan-100 text-cyan-700 border-cyan-200" variant="secondary">
            Impulsado por IA <SparkleIcon className="size-4 inline-block ml-2 text-cyan-500" />
          </Badge>
          <h1>
            Encuentra tu{" "}
            <span className="block gradient-text">Compañero de Aprendizaje IA</span>
          </h1>
          <p className="hero-subheading">
            Únete a comunidades, establece tus metas de aprendizaje y conéctate
            con compañeros que comparten tu pasión. Chatea, colabora y crece
            junto con insights impulsados por inteligencia artificial.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <MotionDiv
              initial={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link href="/sign-up">
                <Button
                  size="lg"
                  className="link-button hero-button-outline group border-cyan-400 text-cyan-600 hover:bg-cyan-50"
                >
                  <span className="hero-button-content">
                    <RocketIcon className="hero-button-icon-outline group-hover:rotate-12 group-hover:text-cyan-500" />
                    <span className="hero-button-text">
                      Comenzar Gratis
                    </span>
                  </span>
                </Button>
              </Link>
            </MotionDiv>
            <MotionDiv
              initial={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.08, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link href="/#pricing">
                <Button
                  size="lg"
                  className="link-button hero-button-primary group bg-cyan-500 hover:bg-cyan-600 text-white"
                >
                  <span className="hero-button-content">
                    <ZapIcon className="hero-button-icon-primary group-hover:scale-125 group-hover:rotate-12" />
                    Ver Planes
                  </span>
                </Button>
              </Link>
            </MotionDiv>
          </div>
        </div>
      </div>
    </section>
  );
}