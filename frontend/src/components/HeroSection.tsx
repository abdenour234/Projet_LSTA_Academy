import { Button } from "@/components/ui/button";
import { BookOpen, Sparkles } from "lucide-react";
import heroImage from "@/assets/hero-transparent.png";
import { WebGLShader } from "./WebGLShader";
import { AuroraBackground } from "./AuroraBackground";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

const HeroSection = () => {
  const [titleNumber, setTitleNumber] = useState(0);
  const titles = useMemo(
    () => ["élève", "Parent", "Professeur", "Administration"],
    []
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (titleNumber === titles.length - 1) {
        setTitleNumber(0);
      } else {
        setTitleNumber(titleNumber + 1);
      }
    }, 2000);
    return () => clearTimeout(timeoutId);
  }, [titleNumber, titles]);
  return (
    <AuroraBackground className="relative min-h-screen pt-24 pb-32">
      <section className="relative w-full z-10 pb-20">
        {/* Decorative circles - subtle blue shapes */}
        <div className="absolute top-32 left-10 w-40 h-40 rounded-full bg-blue-600 opacity-10 animate-float" />
        <div className="absolute top-48 right-20 w-64 h-64 rounded-full bg-blue-500 opacity-8 animate-float" style={{ animationDelay: "1s" }} />
        <div className="absolute bottom-1/4 left-1/3 w-48 h-48 rounded-full bg-blue-400 opacity-10 animate-float" style={{ animationDelay: "2s" }} />
        <div className="absolute bottom-1/3 right-10 w-56 h-56 rounded-full bg-blue-500 opacity-8 animate-float" style={{ animationDelay: "1.5s" }} />

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Left Content */}
          <div className="space-y-8 animate-fade-in">
            <h1 className="text-5xl lg:text-6xl font-bold leading-relaxed">
              <span className="handwriting text-7xl lg:text-8xl mb-4 block leading-tight text-blue-600">
                Une pédagogie qui
              </span>
              <span className="block text-blue-600 mt-6 mb-4 leading-relaxed">s&apos;adapte à chaque</span>
              <span className="relative flex w-full overflow-hidden text-left pb-8 pt-2 min-h-[80px]">
                {titles.map((title, index) => (
                  <motion.span
                    key={index}
                    className="absolute text-5xl lg:text-6xl font-bold text-blue-600"
                    initial={{ opacity: 0, y: -100 }}
                    transition={{ type: "spring", stiffness: 50 }}
                    animate={
                      titleNumber === index
                        ? {
                            y: 0,
                            opacity: 1,
                          }
                        : {
                            y: titleNumber > index ? -150 : 150,
                            opacity: 0,
                          }
                    }
                  >
                    {title}
                  </motion.span>
                ))}
              </span>
            </h1>

            <p className="text-lg max-w-xl leading-loose font-medium text-blue-500 mt-6">
              Diagnostic personnalisé, coaching enseignant, suivi familial et
              activités interactives.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button 
                size="lg" 
                className="gap-2 text-base px-6 py-5 rounded-full bg-blue-600 hover:bg-emerald-500 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 font-medium"
              >
                <Sparkles className="h-5 w-5" />
                Contacter nous 
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="gap-2 text-base px-6 py-5 rounded-full border-2 border-blue-200 text-blue-600 bg-white hover:bg-emerald-50 hover:scale-105 font-medium transition-all duration-300"
              >
                <BookOpen className="h-5 w-5" />
                Notre méthode
              </Button>
            </div>
          </div>

          {/* Right Image */}
          <div className="relative animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <div className="absolute inset-0 bg-blue-500 opacity-6 rounded-full blur-3xl scale-125" />
            <div className="relative">
              <img
                src={heroImage}
                alt="Enseignant avec élèves"
                className="w-full h-auto relative z-10 drop-shadow-2xl scale-105"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Animated Wave Decoration */}
      <WebGLShader />
      </section>
    </AuroraBackground>
  );
};

export default HeroSection;
