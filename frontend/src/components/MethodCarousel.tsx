'use client';
import React, { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, animate } from 'framer-motion';
import { Lightbulb, Cpu, Heart } from 'lucide-react';

export const methodItems = [
  {
    id: 1,
    icon: <Lightbulb className="w-20 h-20 text-white" />,
    emoji: "💡",
    title: 'Innovation Pédagogique',
    description: 'Des pratiques éducatives modernes et interactives.',
    color: 'bg-blue-600',
    details: 'Nous utilisons des méthodes pédagogiques innovantes qui encouragent la participation active et l\'engagement des élèves.',
  },
  {
    id: 2,
    icon: <Cpu className="w-20 h-20 text-white" />,
    emoji: "🤖",
    title: 'Technologie Intelligente',
    description: 'L\'intelligence artificielle au service de l\'apprentissage.',
    color: 'bg-emerald-600',
    details: 'Des outils d\'IA qui personnalisent l\'apprentissage et s\'adaptent au rythme de chaque élève.',
  },
  {
    id: 3,
    icon: <Heart className="w-20 h-20 text-white" />,
    emoji: "❤️",
    title: 'Accompagnement Humain',
    description: 'Un suivi personnalisé pour chaque élève et enseignant.',
    color: 'bg-blue-500',
    details: 'Un coaching personnalisé et un suivi rapproché pour garantir la réussite de chaque apprenant.',
  },
];

export function MethodCarousel() {
  const [index, setIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);

  useEffect(() => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth || 1;
      const targetX = -index * containerWidth;

      animate(x, targetX, {
        type: 'spring',
        stiffness: 300,
        damping: 30,
      });
    }
  }, [index, x]);

  // Auto-advance carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % methodItems.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className='lg:p-10 sm:p-4 p-2 max-w-5xl mx-auto'>
      <div className='flex flex-col gap-3'>
        <div className='relative overflow-hidden rounded-2xl shadow-2xl' ref={containerRef}>
          <motion.div className='flex' style={{ x }}>
            {methodItems.map((item) => (
              <div key={item.id} className='shrink-0 w-full'>
                <div className={`${item.color} p-12 lg:p-16 min-h-[500px] flex flex-col items-center justify-center text-center text-white relative overflow-hidden`}>
                  {/* Background decoration */}
                  <div className="absolute top-10 right-10 opacity-10 text-9xl">
                    {item.emoji}
                  </div>
                  <div className="absolute bottom-10 left-10 opacity-10 text-9xl">
                    {item.emoji}
                  </div>

                  {/* Content */}
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="relative z-10 space-y-6"
                  >
                    {/* Icon with emoji */}
                    <div className="relative inline-block mb-4">
                      <div className="w-32 h-32 mx-auto rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-4 border-white/30">
                        {item.icon}
                      </div>
                      <div className="absolute -top-3 -right-3 text-5xl animate-bounce">
                        {item.emoji}
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-4xl lg:text-5xl font-bold mb-4">
                      {item.title}
                    </h3>

                    {/* Description */}
                    <p className="text-xl lg:text-2xl font-medium max-w-2xl mx-auto opacity-95">
                      {item.description}
                    </p>

                    {/* Details */}
                    <p className="text-lg max-w-xl mx-auto opacity-90 mt-6">
                      {item.details}
                    </p>
                  </motion.div>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Previous Button */}
          <motion.button
            disabled={index === 0}
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            className={`absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all z-10
              ${
                index === 0
                  ? 'opacity-40 cursor-not-allowed bg-white/50'
                  : 'bg-white hover:scale-110 hover:shadow-xl opacity-90 hover:opacity-100'
              }`}
            whileHover={{ scale: index === 0 ? 1 : 1.1 }}
            whileTap={{ scale: index === 0 ? 1 : 0.9 }}
          >
            <svg
              className='w-6 h-6 text-blue-600'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={3}
                d='M15 19l-7-7 7-7'
              />
            </svg>
          </motion.button>

          {/* Next Button */}
          <motion.button
            disabled={index === methodItems.length - 1}
            onClick={() => setIndex((i) => Math.min(methodItems.length - 1, i + 1))}
            className={`absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all z-10
              ${
                index === methodItems.length - 1
                  ? 'opacity-40 cursor-not-allowed bg-white/50'
                  : 'bg-white hover:scale-110 hover:shadow-xl opacity-90 hover:opacity-100'
              }`}
            whileHover={{ scale: index === methodItems.length - 1 ? 1 : 1.1 }}
            whileTap={{ scale: index === methodItems.length - 1 ? 1 : 0.9 }}
          >
            <svg
              className='w-6 h-6 text-blue-600'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={3}
                d='M9 5l7 7-7 7'
              />
            </svg>
          </motion.button>

          {/* Progress Indicator */}
          <div className='absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 p-3 bg-white/30 backdrop-blur-md rounded-full border border-white/40 shadow-lg'>
            {methodItems.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`h-3 rounded-full transition-all ${
                  i === index ? 'w-12 bg-white shadow-md' : 'w-3 bg-white/60 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
