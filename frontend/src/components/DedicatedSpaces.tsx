import { GraduationCap, Users, BookOpen, Lightbulb } from "lucide-react";
import { motion } from "framer-motion";
import { ServiceCard } from "@/components/ui/service-card";

const DedicatedSpaces = () => {
  const spaces = [
    {
      icon: <GraduationCap className="w-12 h-12 text-white" />,
      title: "Espace Élève",
      description: "Activités personnalisées et suivi de progression",
      href: "#eleve",
      variant: "blue" as const,
    },
    {
      icon: <Users className="w-12 h-12 text-white" />,
      title: "Espace Parent",
      description: "Suivi familial et communication avec l'équipe",
      href: "#parent",
      variant: "emerald" as const,
    },
    {
      icon: <BookOpen className="w-12 h-12 text-white" />,
      title: "Espace Enseignant",
      description: "Outils pédagogiques et coaching personnalisé",
      href: "#enseignant",
      variant: "blue" as const,
    },
    {
      icon: <Lightbulb className="w-12 h-12 text-white" />,
      title: "Activités & Clubs",
      description: "Découverte et apprentissage ludique",
      href: "#clubs",
      variant: "emerald" as const,
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
          {spaces.map((space, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <ServiceCard
                title={space.title}
                description={space.description}
                href={space.href}
                icon={space.icon}
                variant={space.variant}
                className="min-h-[280px]"
              />
            </motion.div>
          ))}
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
