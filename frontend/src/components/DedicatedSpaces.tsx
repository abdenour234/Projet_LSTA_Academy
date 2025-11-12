import { Card, CardContent } from "@/components/ui/card";
import { GraduationCap, Users, BookOpen, Lightbulb } from "lucide-react";

const DedicatedSpaces = () => {
  const spaces = [
    {
      icon: GraduationCap,
      title: "Espace Élève",
      description: "Activités personnalisées et suivi de progression",
      color: "from-blue-500 to-blue-600",
    },
    {
      icon: Users,
      title: "Espace Parent",
      description: "Suivi familial et communication avec l'équipe",
      color: "from-emerald-500 to-emerald-600",
    },
    {
      icon: BookOpen,
      title: "Espace Enseignant",
      description: "Outils pédagogiques et coaching personnalisé",
      color: "from-amber-500 to-amber-600",
    },
    {
      icon: Lightbulb,
      title: "Activités & Clubs",
      description: "Découverte et apprentissage ludique",
      color: "from-purple-500 to-purple-600",
    },
  ];

  return (
    <section className="py-12 relative bg-slate-50">
      <div className="container mx-auto px-6">
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-blue-600 text-white px-5 py-2 rounded-full font-semibold text-base">
            Nos Espaces Dédiés
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {spaces.map((space, index) => {
            const Icon = space.icon;
            return (
              <Card
                key={index}
                className="group hover:shadow-xl transition-all duration-300 border-2 border-slate-200 hover:border-blue-600/50 cursor-pointer overflow-hidden bg-white"
              >
                <CardContent className="p-5 space-y-3">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${space.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="font-bold text-lg text-slate-900">
                    {space.title}
                  </h3>
                  <p className="text-slate-600 text-sm">{space.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* L.S.T.A. ACADEMY branding */}
        <div className="mt-10 text-center">
          <div className="inline-flex flex-col items-center gap-2">
            <h2 className="text-2xl font-bold text-blue-600">L.S.T.A. ACADEMY</h2>
            <p className="text-lg font-semibold text-slate-900 tracking-wider">
              LEARN & INNOVATE
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DedicatedSpaces;
