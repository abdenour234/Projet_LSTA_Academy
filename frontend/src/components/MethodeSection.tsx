import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, Cpu, Heart, ArrowRight, Sparkles } from "lucide-react";

const MethodeSection = () => {
  const pillars = [
    {
      icon: Lightbulb,
      title: "Innovation Pédagogique",
      description: "Des pratiques éducatives modernes et interactives.",
      emoji: "💡",
    },
    {
      icon: Cpu,
      title: "Technologie Intelligente",
      description: "L'intelligence artificielle au service de l'apprentissage.",
      emoji: "🤖",
    },
    {
      icon: Heart,
      title: "Accompagnement Humain",
      description: "Un suivi personnalisé pour chaque élève et enseignant.",
      emoji: "❤️",
    },
  ];

  return (
    <section id="methode" className="py-16 relative overflow-hidden scroll-mt-20 bg-white">
      <div className="container mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="text-center space-y-4 mb-12 animate-fade-in">
          <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 leading-tight">
            Méthode Pédagogique
          </h2>
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-1 bg-blue-600 rounded-full" />
            <Sparkles className="w-6 h-6 text-blue-500" />
            <div className="w-12 h-1 bg-blue-600 rounded-full" />
          </div>
          <p className="text-lg lg:text-xl text-slate-700 font-semibold max-w-3xl mx-auto leading-relaxed">
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
                  className="h-full bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-500 hover:scale-105 cursor-pointer overflow-hidden"
                >
                  <CardContent className="p-6 lg:p-8 space-y-4 text-center">
                    {/* Icon Container */}
                    <div className="relative inline-block">
                      <div 
                        className="w-16 h-16 mx-auto rounded-full flex items-center justify-center bg-slate-900 group-hover:bg-slate-800 transition-all duration-500"
                      >
                        <Icon className="h-8 w-8 text-white" strokeWidth={2} />
                      </div>
                      
                      {/* Floating emoji */}
                      <div className="absolute -top-2 -right-2 text-3xl">
                        {pillar.emoji}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="space-y-3">
                      <h3 className="font-bold text-xl lg:text-2xl text-slate-900">
                        {pillar.title}
                      </h3>
                      <p className="text-slate-700 font-medium text-sm lg:text-base leading-relaxed">
                        {pillar.description}
                      </p>
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
            className="gap-3 text-base px-8 py-5 rounded-full bg-slate-900 hover:bg-slate-800 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 group font-medium"
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
