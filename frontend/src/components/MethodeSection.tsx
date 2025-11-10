import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, Cpu, Heart, ArrowRight, Sparkles } from "lucide-react";

const MethodeSection = () => {
  const pillars = [
    {
      icon: Lightbulb,
      title: "Innovation Pédagogique",
      description: "Des pratiques éducatives modernes et interactives.",
      color: "hsl(var(--edu-blue))",
      emoji: "💡",
    },
    {
      icon: Cpu,
      title: "Technologie Intelligente",
      description: "L'intelligence artificielle au service de l'apprentissage.",
      color: "hsl(var(--edu-mint))",
      emoji: "🤖",
    },
    {
      icon: Heart,
      title: "Accompagnement Humain",
      description: "Un suivi personnalisé pour chaque élève et enseignant.",
      color: "hsl(var(--edu-coral))",
      emoji: "❤️",
    },
  ];

  return (
    <section id="methode" className="py-16 relative overflow-hidden scroll-mt-20 bg-[hsl(var(--cream))]">
      {/* Simple background shapes */}
      <div className="absolute inset-0 overflow-hidden opacity-20">
        <div className="absolute top-20 right-20 w-40 h-40 bg-[hsl(var(--edu-blue))] rounded-full animate-float" />
        <div className="absolute bottom-32 left-20 w-48 h-48 bg-[hsl(var(--edu-yellow))] rounded-full animate-float" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/3 w-36 h-36 bg-[hsl(var(--edu-mint))] rounded-full animate-float" style={{ animationDelay: "2s" }} />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="text-center space-y-4 mb-12 animate-fade-in">
          <h2 className="text-4xl lg:text-5xl font-bold text-[hsl(var(--edu-blue))] leading-tight">
            Méthode Pédagogique
          </h2>
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-1 bg-[hsl(var(--edu-coral))] rounded-full" />
            <Sparkles className="w-6 h-6 text-[hsl(var(--edu-yellow))] animate-pulse-glow" />
            <div className="w-12 h-1 bg-[hsl(var(--edu-blue))] rounded-full" />
          </div>
          <p className="text-lg lg:text-xl text-foreground font-semibold max-w-3xl mx-auto leading-relaxed">
            Une pédagogie moderne propulsée par la technologie et l'intelligence humaine
          </p>
        </div>

        {/* Pillars Grid */}
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-10">
          {pillars.map((pillar, index) => {
            const Icon = pillar.icon;
            return (
              <div
                key={index}
                className="group animate-fade-in-scale"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <Card 
                  className="h-full bg-white border-4 hover:border-white rounded-[2rem] shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-all duration-500 hover:scale-105 hover:-translate-y-2 cursor-pointer overflow-hidden"
                  style={{ borderColor: pillar.color }}
                >
                  <CardContent className="p-6 lg:p-8 space-y-4 text-center">
                    {/* Icon Container */}
                    <div className="relative inline-block">
                      <div 
                        className="w-20 h-20 mx-auto rounded-full flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 shadow-lg"
                        style={{ backgroundColor: pillar.color }}
                      >
                        <Icon className="h-10 w-10 text-white" strokeWidth={2.5} />
                      </div>
                      
                      {/* Floating emoji */}
                      <div className="absolute -top-2 -right-2 text-3xl animate-bounce-soft">
                        {pillar.emoji}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="space-y-3">
                      <h3 
                        className="font-bold text-xl lg:text-2xl drop-shadow-sm"
                        style={{ color: pillar.color }}
                      >
                        {pillar.title}
                      </h3>
                      <p className="text-foreground/80 font-medium text-sm lg:text-base leading-relaxed">
                        {pillar.description}
                      </p>
                      
                      {/* Decorative line */}
                      <div className="w-12 h-1 mx-auto rounded-full" style={{ backgroundColor: pillar.color }} />
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center animate-fade-in" style={{ animationDelay: "0.8s" }}>
          <Button 
            size="lg" 
            className="gap-3 text-base px-8 py-5 rounded-full bg-[hsl(var(--edu-blue))] hover:bg-[hsl(200_90%_45%)] text-white shadow-[var(--shadow-button)] hover:shadow-[var(--shadow-card-hover)] hover:scale-105 transition-all duration-300 group font-bold"
          >
            Découvrir notre méthode
            <ArrowRight className="h-5 w-5 group-hover:translate-x-2 transition-transform duration-300" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default MethodeSection;
