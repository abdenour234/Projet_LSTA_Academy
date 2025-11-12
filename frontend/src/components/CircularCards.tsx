import { useState } from "react";
import { Target, Users, Lightbulb, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CardData {
  id: number;
  icon: React.ReactNode;
  title: string;
  description: string;
  subtitle: string;
  detailedContent: string;
  color: string;
}

const CircularCards = () => {
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [rotation, setRotation] = useState(0);

  const cards: CardData[] = [
    {
      id: 1,
      icon: <Target className="w-8 h-8 text-white" />,
      title: "Approche Ciblée",
      description: "Solutions pédagogiques adaptées",
      subtitle: "À chaque besoin",
      detailedContent: "Nous analysons les besoins spécifiques de chaque élève pour créer un parcours d'apprentissage personnalisé. Notre approche ciblée garantit que chaque étudiant reçoit l'attention et les ressources dont il a besoin pour réussir.",
      color: "bg-blue-600",
    },
    {
      id: 2,
      icon: <Users className="w-8 h-8 text-white" />,
      title: "Collaboration",
      description: "Communauté éducative connectée",
      subtitle: "Ensemble pour réussir",
      detailedContent: "Notre plateforme favorise la collaboration entre enseignants, élèves et parents. En créant une communauté éducative connectée, nous renforçons l'engagement et le soutien mutuel pour la réussite de tous.",
      color: "bg-emerald-600",
    },
    {
      id: 3,
      icon: <Lightbulb className="w-8 h-8 text-white" />,
      title: "Innovation",
      description: "Technologies au service de l'éducation",
      subtitle: "Apprentissage moderne",
      detailedContent: "Nous intégrons les dernières technologies éducatives pour offrir une expérience d'apprentissage moderne et interactive. L'intelligence artificielle et les outils numériques transforment la façon dont les élèves apprennent et progressent.",
      color: "bg-blue-500",
    },
  ];

  const handleCardClick = (cardId: number) => {
    if (selectedCard === cardId) {
      setSelectedCard(null);
    } else {
      setSelectedCard(cardId);
    }
  };

  const handleRotate = (direction: "left" | "right") => {
    const angle = direction === "left" ? -120 : 120;
    setRotation(rotation + angle);
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto py-20">
      {/* Central Circle */}
      <div className="relative w-full aspect-square max-w-[600px] mx-auto">
        {/* Center Title */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 text-center">
          <h3 className="text-3xl font-bold text-blue-600 mb-2">Innovation</h3>
          <p className="text-blue-500 font-medium">Pédagogie Moderne</p>
        </div>

        {/* Rotating Cards Container */}
        <motion.div
          className="relative w-full h-full"
          animate={{ rotate: rotation }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        >
          {cards.map((card, index) => {
            const angle = (index * 120 * Math.PI) / 180; // 120 degrees apart
            const radius = 200; // Distance from center
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;

            return (
              <motion.div
                key={card.id}
                className="absolute top-1/2 left-1/2 cursor-pointer"
                style={{
                  x: x - 80,
                  y: y - 80,
                }}
                animate={{ rotate: -rotation }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                onClick={() => handleCardClick(card.id)}
                whileHover={{ scale: 1.05 }}
              >
                <div
                  className={`w-40 h-40 rounded-2xl ${card.color} p-6 shadow-xl flex flex-col items-center justify-center text-center text-white hover:shadow-2xl transition-shadow duration-300`}
                >
                  <div className="mb-3">{card.icon}</div>
                  <h4 className="text-lg font-bold mb-1">{card.title}</h4>
                  <p className="text-xs opacity-90">{card.description}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Rotation Controls */}
        <div className="absolute -bottom-20 left-1/2 transform -translate-x-1/2 flex gap-4">
          <button
            onClick={() => handleRotate("left")}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-300"
          >
            ← Précédent
          </button>
          <button
            onClick={() => handleRotate("right")}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Suivant →
          </button>
        </div>
      </div>

      {/* Expanded Card Modal */}
      <AnimatePresence>
        {selectedCard !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedCard(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", duration: 0.5 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-2xl w-full"
            >
              {cards
                .filter((card) => card.id === selectedCard)
                .map((card) => (
                  <div
                    key={card.id}
                    className={`${card.color} rounded-3xl p-8 md:p-12 text-white shadow-2xl`}
                  >
                    {/* Close Button */}
                    <button
                      onClick={() => setSelectedCard(null)}
                      className="absolute top-6 right-6 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors duration-200"
                    >
                      <X className="w-6 h-6" />
                    </button>

                    {/* Card Content */}
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                        {card.icon}
                      </div>
                      <div>
                        <h3 className="text-3xl font-bold mb-1">{card.title}</h3>
                        <p className="text-lg opacity-90">{card.subtitle}</p>
                      </div>
                    </div>

                    <p className="text-xl font-medium mb-4 opacity-95">
                      {card.description}
                    </p>

                    <div className="w-full h-px bg-white/30 my-6"></div>

                    <p className="text-lg leading-relaxed opacity-90">
                      {card.detailedContent}
                    </p>

                    <div className="mt-8 flex gap-4">
                      <button className="px-6 py-3 bg-white text-blue-600 rounded-full font-semibold hover:scale-105 transition-transform duration-200">
                        En savoir plus
                      </button>
                      <button
                        onClick={() => setSelectedCard(null)}
                        className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-full font-semibold transition-colors duration-200"
                      >
                        Fermer
                      </button>
                    </div>
                  </div>
                ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CircularCards;
