import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Target, Users, Zap } from "lucide-react";
import logoPedagoria from "@/assets/logo-pedagoria.png";

const PedagoriaSection = () => {
  const features = [
    {
      icon: Target,
      title: "Approche Ciblée",
      description: "Des solutions pédagogiques adaptées à chaque besoin",
      color: "hsl(var(--edu-blue))",
    },
    {
      icon: Users,
      title: "Collaboration",
      description: "Une communauté éducative engagée et connectée",
      color: "hsl(var(--edu-mint))",
    },
    {
      icon: Zap,
      title: "Innovation",
      description: "Les dernières technologies au service de l'éducation",
      color: "hsl(var(--edu-coral))",
    },
  ];

  return (
    <section className="py-16 relative overflow-hidden bg-white">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden opacity-10">
        <div className="absolute top-20 right-20 w-72 h-72 bg-[hsl(var(--edu-blue))] rounded-full animate-float" />
        <div className="absolute bottom-32 left-20 w-64 h-64 bg-[hsl(var(--edu-yellow))] rounded-full animate-float" style={{ animationDelay: "1.5s" }} />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Main content */}
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center space-y-2 mb-8 animate-fade-in">
            <div className="space-y-1">
              <h2 className="text-3xl lg:text-4xl font-bold text-[hsl(var(--edu-blue))] leading-tight">
                Propulsé par Pedagoria
              </h2>
              <div className="flex items-center justify-center gap-3 my-4">
                <div className="w-12 h-1 bg-[hsl(var(--edu-blue))]" />
                <div className="w-2 h-2 bg-[hsl(var(--edu-yellow))] rotate-45" />
                <div className="w-12 h-1 bg-[hsl(var(--edu-mint))]" />
              </div>
              <p className="text-sm lg:text-base text-foreground/70 max-w-2xl mx-auto leading-relaxed font-medium pt-1">
                Une plateforme innovante qui révolutionne l&apos;apprentissage en combinant 
                pédagogie moderne, intelligence artificielle et accompagnement humain.
              </p>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="group animate-fade-in-scale"
                  style={{ animationDelay: `${index * 0.2}s` }}
                >
                  <Card 
                    className="h-full bg-[hsl(var(--cream))] border-2 hover:border-4 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:-translate-y-2 cursor-pointer overflow-hidden"
                    style={{ borderColor: feature.color }}
                  >
                    <CardContent className="p-8 lg:p-10 space-y-6 text-center">
                      {/* Icon Container */}
                      <div className="relative inline-block">
                        <div 
                          className="w-24 h-24 mx-auto rounded-full flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-md"
                          style={{ backgroundColor: feature.color }}
                        >
                          <Icon className="h-12 w-12 text-white" strokeWidth={2.5} />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="space-y-3">
                        <h3 
                          className="font-bold text-2xl lg:text-3xl drop-shadow-sm"
                          style={{ color: feature.color }}
                        >
                          {feature.title}
                        </h3>
                        <p className="text-foreground/70 font-medium text-base lg:text-lg leading-relaxed">
                          {feature.description}
                        </p>
                        
                        {/* Decorative line */}
                        <div className="w-12 h-1 mx-auto" style={{ backgroundColor: feature.color }} />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>

          {/* Bottom statement */}
          <div className="text-center animate-fade-in bg-[hsl(var(--edu-blue))] text-white rounded-3xl p-8 lg:p-10 shadow-lg" style={{ animationDelay: "0.6s" }}>
            <p className="text-xl lg:text-2xl font-bold leading-relaxed">
              <span className="text-[hsl(var(--edu-yellow))]">Pedagoria</span> transforme l&apos;éducation en rendant 
              l&apos;apprentissage plus accessible, interactif et personnalisé pour chaque élève.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PedagoriaSection;
