import { Button } from "@/components/ui/button";
import { BookOpen, Sparkles } from "lucide-react";
import heroImage from "@/assets/hero-transparent.png";
import WaveDecoration from "./WaveDecoration";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen pt-24 pb-16 overflow-hidden bg-[hsl(var(--cream))]">
      {/* Decorative circles - simple colored shapes */}
      <div className="absolute top-32 left-10 w-40 h-40 rounded-full bg-[hsl(var(--edu-blue))] opacity-20 animate-float" />
      <div className="absolute top-48 right-20 w-64 h-64 rounded-full bg-[hsl(var(--edu-yellow))] opacity-15 animate-float" style={{ animationDelay: "1s" }} />
      <div className="absolute bottom-1/4 left-1/3 w-48 h-48 rounded-full bg-[hsl(var(--edu-mint))] opacity-20 animate-float" style={{ animationDelay: "2s" }} />
      <div className="absolute bottom-1/3 right-10 w-56 h-56 rounded-full bg-[hsl(var(--edu-coral))] opacity-15 animate-float" style={{ animationDelay: "1.5s" }} />

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Left Content */}
          <div className="space-y-6 animate-fade-in">
            <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
              <span className="handwriting text-7xl lg:text-8xl mb-2" style={{ color: '#0047AB' }}>
                Une pédagogie qui
              </span>
              <span className="block" style={{ color: '#0047AB' }}>s&apos;adapte à chaque</span>
              <span className="block" style={{ color: '#0047AB' }}>élève</span>
            </h1>

            <p className="text-lg max-w-xl leading-relaxed font-medium" style={{ color: '#0047AB', opacity: 0.85 }}>
              Diagnostic personnalisé, coaching enseignant, suivi familial et
              activités interactives.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button 
                size="lg" 
                className="gap-2 text-base px-6 py-5 rounded-full text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 font-bold"
                style={{ backgroundColor: '#0047AB' }}
              >
                <Sparkles className="h-5 w-5" />
                Contacter nous 
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="gap-2 text-base px-6 py-5 rounded-full border-2 hover:scale-105 font-bold transition-all duration-300"
                style={{ borderColor: '#0047AB', color: '#0047AB', backgroundColor: 'white' }}
              >
                <BookOpen className="h-5 w-5" />
                Notre méthode
              </Button>
            </div>
          </div>

          {/* Right Image */}
          <div className="relative animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <div className="absolute inset-0 bg-[hsl(var(--edu-blue))] opacity-10 rounded-full blur-3xl scale-125" />
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

      {/* Wave Decoration */}
      <WaveDecoration />
    </section>
  );
};

export default HeroSection;
