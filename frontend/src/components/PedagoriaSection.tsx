import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Target, Users, Zap } from "lucide-react";
import logoPedagoria from "@/assets/logo-pedagoria.png";

const PedagoriaSection = () => {
  const features = [
    {
      icon: Target,
      title: "Approche Ciblée",
      description: "Des solutions pédagogiques adaptées à chaque besoin",
    },
    {
      icon: Users,
      title: "Collaboration",
      description: "Une communauté éducative engagée et connectée",
    },
    {
      icon: Zap,
      title: "Innovation",
      description: "Les dernières technologies au service de l'éducation",
    },
  ];

  return (
    <section className="py-16 relative overflow-hidden bg-slate-50">
      <div className="container mx-auto px-6 relative z-10">
        {/* Main content */}
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center space-y-2 mb-8 animate-fade-in">
            <div className="space-y-1">
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 leading-tight">
                Propulsé par Pedagoria
              </h2>
              <div className="flex items-center justify-center gap-3 my-4">
                <div className="w-12 h-1 bg-blue-600" />
                <div className="w-2 h-2 bg-blue-500 rotate-45" />
                <div className="w-12 h-1 bg-blue-400" />
              </div>
              <p className="text-sm lg:text-base text-slate-700 max-w-2xl mx-auto leading-relaxed font-medium pt-1">
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
                    className="h-full bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 cursor-pointer overflow-hidden"
                  >
                    <CardContent className="p-8 lg:p-10 space-y-6 text-center">
                      {/* Icon Container */}
                      <div className="relative inline-block">
                        <div 
                          className="w-16 h-16 mx-auto rounded-full flex items-center justify-center bg-slate-900 group-hover:bg-slate-800 transition-all duration-300"
                        >
                          <Icon className="h-8 w-8 text-white" strokeWidth={2} />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="space-y-3">
                        <h3 className="font-bold text-xl lg:text-2xl text-slate-900">
                          {feature.title}
                        </h3>
                        <p className="text-slate-700 font-medium text-base leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>

          {/* Bottom statement */}
          <div className="text-center animate-fade-in bg-slate-900 text-white rounded-lg p-8 lg:p-10 shadow-md" style={{ animationDelay: "0.6s" }}>
            <p className="text-xl lg:text-2xl font-bold leading-relaxed">
              <span className="text-blue-400">Pedagoria</span> transforme l&apos;éducation en rendant 
              l&apos;apprentissage plus accessible, interactif et personnalisé pour chaque élève.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PedagoriaSection;
