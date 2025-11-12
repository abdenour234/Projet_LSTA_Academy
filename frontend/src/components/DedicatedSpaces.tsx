import { Card, CardContent } from "@/components/ui/card";
import { GraduationCap, Users, BookOpen, Lightbulb } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

const DedicatedSpaces = () => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const spaces = [
    {
      icon: GraduationCap,
      title: "Espace Élève",
      description: "Activités personnalisées et suivi de progression",
      color: "bg-blue-600",
      hoverColor: "hover:bg-blue-700",
    },
    {
      icon: Users,
      title: "Espace Parent",
      description: "Suivi familial et communication avec l'équipe",
      color: "bg-emerald-600",
      hoverColor: "hover:bg-emerald-700",
    },
    {
      icon: BookOpen,
      title: "Espace Enseignant",
      description: "Outils pédagogiques et coaching personnalisé",
      color: "bg-blue-500",
      hoverColor: "hover:bg-blue-600",
    },
    {
      icon: Lightbulb,
      title: "Activités & Clubs",
      description: "Découverte et apprentissage ludique",
      color: "bg-emerald-500",
      hoverColor: "hover:bg-emerald-600",
    },
  ];

  return (
    <section className="py-12 relative bg-white">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-4 mb-8"
        >
          <div className="bg-blue-600 text-white px-5 py-2 rounded-full font-semibold text-base shadow-lg">
            Nos Espaces Dédiés
          </div>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {spaces.map((space, index) => {
            const Icon = space.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                onHoverStart={() => setHoveredIndex(index)}
                onHoverEnd={() => setHoveredIndex(null)}
              >
                <Card
                  className={`group hover:shadow-2xl transition-all duration-500 border-2 border-blue-200 hover:border-blue-600 cursor-pointer overflow-hidden bg-white ${
                    hoveredIndex === index ? "scale-105 -translate-y-2" : ""
                  }`}
                >
                  <CardContent className="p-5 space-y-3 relative">
                    {/* Animated background circle */}
                    <motion.div
                      className={`absolute -top-10 -right-10 w-32 h-32 ${space.color} rounded-full opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
                      animate={
                        hoveredIndex === index
                          ? { scale: [1, 1.2, 1], rotate: 360 }
                          : {}
                      }
                      transition={{ duration: 2, repeat: Infinity }}
                    />

                    <motion.div
                      className={`w-14 h-14 rounded-2xl ${space.color} ${space.hoverColor} flex items-center justify-center shadow-lg`}
                      animate={
                        hoveredIndex === index
                          ? { rotate: [0, -10, 10, -10, 0], scale: 1.1 }
                          : { rotate: 0, scale: 1 }
                      }
                      transition={{ duration: 0.6 }}
                    >
                      <Icon className="h-7 w-7 text-white" />
                    </motion.div>

                    <h3 className="font-bold text-lg text-blue-600 relative z-10">
                      {space.title}
                    </h3>
                    <p className="text-blue-500 text-sm relative z-10 leading-relaxed">
                      {space.description}
                    </p>

                    {/* Bottom line animation */}
                    <motion.div
                      className={`absolute bottom-0 left-0 h-1 ${space.color}`}
                      initial={{ width: 0 }}
                      animate={hoveredIndex === index ? { width: "100%" } : { width: 0 }}
                      transition={{ duration: 0.4 }}
                    />
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* L.S.T.A. ACADEMY branding */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-10 text-center"
        >
          <div className="inline-flex flex-col items-center gap-2">
            <h2 className="text-2xl font-bold text-blue-600">L.S.T.A. ACADEMY</h2>
            <p className="text-lg font-semibold text-blue-500 tracking-wider">
              LEARN & INNOVATE
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default DedicatedSpaces;
