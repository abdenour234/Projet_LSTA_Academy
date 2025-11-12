import { useState, useEffect } from "react";
import { Target, Users, Lightbulb, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, useMotionValue, animate } from "framer-motion";

interface SlideData {
  id: number;
  icon: React.ElementType;
  title: string;
  description: string;
  subtitle: string;
  detailedContent: string;
  color: string;
  emoji: string;
}

export const PedagogiaCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const x = useMotionValue(0);

  const slides: SlideData[] = [
    {
      id: 1,
      icon: Target,
      title: "Approche Ciblée",
      description: "Solutions pédagogiques adaptées",
      subtitle: "À chaque besoin",
      detailedContent: "Nous analysons les besoins spécifiques de chaque élève pour créer un parcours d'apprentissage personnalisé. Notre approche ciblée garantit que chaque étudiant reçoit l'attention et les ressources dont il a besoin pour réussir.",
      color: "bg-blue-600",
      emoji: "🎯",
    },
    {
      id: 2,
      icon: Users,
      title: "Collaboration",
      description: "Communauté éducative connectée",
      subtitle: "Ensemble pour réussir",
      detailedContent: "Notre plateforme favorise la collaboration entre enseignants, élèves et parents. En créant une communauté éducative connectée, nous renforçons l'engagement et le soutien mutuel pour la réussite de tous.",
      color: "bg-emerald-600",
      emoji: "🤝",
    },
    {
      id: 3,
      icon: Lightbulb,
      title: "Innovation",
      description: "Technologies au service de l'éducation",
      subtitle: "Apprentissage moderne",
      detailedContent: "Nous intégrons les dernières technologies éducatives pour offrir une expérience d'apprentissage moderne et interactive. L'intelligence artificielle et les outils numériques transforment la façon dont les élèves apprennent et progressent.",
      color: "bg-blue-500",
      emoji: "💡",
    },
  ];

  // Auto-advance carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 5000); // 5 seconds

    return () => clearInterval(interval);
  }, [slides.length]);

  // Animate slide transition
  useEffect(() => {
    const targetX = -currentIndex * 100;
    animate(x, targetX, {
      type: "spring",
      stiffness: 300,
      damping: 30,
    });
  }, [currentIndex, x]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  const currentSlide = slides[currentIndex];
  const Icon = currentSlide.icon;

  return (
    <div className="relative w-full max-w-6xl mx-auto">
      <div className="relative overflow-hidden rounded-3xl shadow-2xl min-h-[500px] lg:min-h-[550px]">
        {/* Slides Container */}
        <motion.div
          className="flex"
          style={{ x: x.get() === 0 ? "0%" : x }}
        >
          {slides.map((slide) => {
            const SlideIcon = slide.icon;
            return (
              <div
                key={slide.id}
                className="min-w-full relative"
                style={{ flex: "0 0 100%" }}
              >
                {/* Background with solid color */}
                <div className={`absolute inset-0 ${slide.color}`} />

                {/* Content */}
                <div className="relative z-10 h-full min-h-[500px] lg:min-h-[550px] flex flex-col items-center justify-center text-center px-6 lg:px-16 py-12">
                  {/* Icon with emoji decoration */}
                  <div className="relative mb-8">
                    <div className="w-32 h-32 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-xl">
                      <SlideIcon className="w-16 h-16 text-white" />
                    </div>
                    <div className="absolute -bottom-3 -right-3 text-5xl">
                      {slide.emoji}
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-4xl lg:text-5xl font-bold text-white mb-4">
                    {slide.title}
                  </h3>

                  {/* Subtitle */}
                  <p className="text-xl lg:text-2xl text-white/90 font-semibold mb-3">
                    {slide.subtitle}
                  </p>

                  {/* Description */}
                  <p className="text-lg text-white/80 font-medium mb-6 max-w-xl">
                    {slide.description}
                  </p>

                  {/* Detailed Content */}
                  <div className="max-w-3xl mx-auto">
                    <p className="text-base lg:text-lg text-white/90 leading-relaxed">
                      {slide.detailedContent}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </motion.div>

        {/* Navigation Buttons */}
        <div className="absolute top-1/2 -translate-y-1/2 left-4 lg:left-6 z-20">
          <button
            onClick={goToPrevious}
            className="w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/40 transition-all duration-300 shadow-lg hover:scale-110"
          >
            <ChevronLeft className="w-6 h-6 lg:w-7 lg:h-7" />
          </button>
        </div>

        <div className="absolute top-1/2 -translate-y-1/2 right-4 lg:right-6 z-20">
          <button
            onClick={goToNext}
            className="w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/40 transition-all duration-300 shadow-lg hover:scale-110"
          >
            <ChevronRight className="w-6 h-6 lg:w-7 lg:h-7" />
          </button>
        </div>

        {/* Progress Dots */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
          <div className="flex items-center gap-2 bg-white/30 backdrop-blur-md px-4 py-2 rounded-full shadow-lg">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-3 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? "w-12 bg-white"
                    : "w-3 bg-white/50 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Caption below carousel */}
      <div className="mt-8 text-center">
        <p className="text-blue-600 font-semibold text-lg">
          {currentSlide.subtitle}
        </p>
      </div>
    </div>
  );
};
