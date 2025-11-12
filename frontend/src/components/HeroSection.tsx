import { Button } from "@/components/ui/button";
import { BookOpen, Sparkles } from "lucide-react";
import heroImage from "@/assets/hero-transparent.png";
import { WebGLShader } from "./WebGLShader";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen pt-24 pb-16 overflow-hidden bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      {/* Decorative circles - subtle blue shapes */}
      <div className="absolute top-32 left-10 w-40 h-40 rounded-full bg-blue-600 opacity-10 animate-float" />
      <div className="absolute top-48 right-20 w-64 h-64 rounded-full bg-blue-500 opacity-8 animate-float" style={{ animationDelay: "1s" }} />
      <div className="absolute bottom-1/4 left-1/3 w-48 h-48 rounded-full bg-blue-400 opacity-10 animate-float" style={{ animationDelay: "2s" }} />
      <div className="absolute bottom-1/3 right-10 w-56 h-56 rounded-full bg-blue-500 opacity-8 animate-float" style={{ animationDelay: "1.5s" }} />

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Left Content */}
          <div className="space-y-6 animate-fade-in">
            <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
              <span className="handwriting text-7xl lg:text-8xl mb-2 text-blue-600">
                Une pédagogie qui
              </span>
              <span className="block text-blue-600">s&apos;adapte à chaque</span>
              <span className="block text-blue-600">élève</span>
            </h1>

            <p className="text-lg max-w-xl leading-relaxed font-medium text-blue-500">
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
  );
};

export default HeroSection;
