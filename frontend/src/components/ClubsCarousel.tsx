'use client';
import React, { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, animate } from 'framer-motion';
import { Code, Bot, MessageCircle, BookText, Palette } from 'lucide-react';
import clubDev from "@/assets/club-developpement.png";
import clubRobot from "@/assets/club-robotique.png";
import clubSoft from "@/assets/club-softskills.png";
import clubLit from "@/assets/club-litterature.png";
import clubDesign from "@/assets/club-design.png";

export const clubItems = [
  {
    id: 1,
    icon: <Code className="w-16 h-16 text-white" />,
    emoji: "💻",
    title: 'Développement Informatique',
    description: 'Le Club Développement Informatique ouvre les portes du monde du code et de la création numérique. Les élèves y apprennent à concevoir des sites web, des applications et des jeux interactifs à l\'aide de langages simples et adaptés à leur niveau.',
    fullDescription: 'À travers des projets concrets, ils développent leur logique, leur autonomie et leur esprit d\'innovation, tout en découvrant comment les technologies façonnent le monde moderne.',
    color: 'bg-blue-600',
    image: clubDev,
  },
  {
    id: 2,
    icon: <Bot className="w-16 h-16 text-white" />,
    emoji: "🤖",
    title: 'Robotique and Innovation',
    description: 'Le Club Robotique invite les élèves à explorer le monde fascinant des machines intelligentes. En assemblant des robots, en les programmant et en les testant, ils découvrent comment la science, la technologie et la créativité peuvent s\'unir.',
    fullDescription: 'Le club valorise la coopération, la pensée critique et l\'expérimentation, tout en rendant l\'apprentissage scientifique amusant et concret.',
    color: 'bg-emerald-600',
    image: clubRobot,
  },
  {
    id: 3,
    icon: <MessageCircle className="w-16 h-16 text-white" />,
    emoji: "🗣️",
    title: 'Soft Skills & Leadership',
    description: 'Ce club aide les élèves à mieux se connaître, à collaborer efficacement et à communiquer avec confiance. À travers des activités ludiques, des jeux de rôle et des mini-projets collectifs, ils développent des compétences essentielles.',
    fullDescription: 'Le club prépare les élèves à devenir des citoyens responsables, ouverts et capables de s\'adapter à toutes les situations.',
    color: 'bg-blue-500',
    image: clubSoft,
  },
  {
    id: 4,
    icon: <BookText className="w-16 h-16 text-white" />,
    emoji: "📖",
    title: 'Littérature & Théâtre',
    description: 'Le Club Littérature et Théâtre célèbre la magie des mots et des émotions. Les élèves y lisent, interprètent et mettent en scène des textes issus de la littérature marocaine et universelle.',
    fullDescription: 'À travers des ateliers d\'écriture, de lecture expressive et de jeu théâtral, ils renforcent leur maîtrise du langage, leur confiance en soi et leur sens artistique.',
    color: 'bg-emerald-500',
    image: clubLit,
  },
  {
    id: 5,
    icon: <Palette className="w-16 h-16 text-white" />,
    emoji: "🎨",
    title: 'Design Graphique & Dessin',
    description: 'Ce club est un espace d\'expression artistique et numérique. Les élèves y apprennent à créer des affiches, logos, illustrations et bandes dessinées à l\'aide d\'outils modernes comme Canva.',
    fullDescription: 'Ils découvrent les bases du design graphique, de la couleur et de la mise en page tout en développant leur sens esthétique et leur imagination.',
    color: 'bg-blue-600',
    image: clubDesign,
  },
];

export function ClubsCarousel() {
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
      setIndex((i) => (i + 1) % clubItems.length);
    }, 6000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className='lg:p-10 sm:p-4 p-2 max-w-6xl mx-auto'>
      <div className='flex flex-col gap-3'>
        <div className='relative overflow-hidden rounded-3xl shadow-2xl' ref={containerRef}>
          <motion.div className='flex' style={{ x }}>
            {clubItems.map((item) => (
              <div key={item.id} className='shrink-0 w-full'>
                <div className='relative min-h-[550px] lg:min-h-[600px] overflow-hidden'>
                  {/* Background Image */}
                  <div className="absolute inset-0">
                    <img
                      src={item.image}
                      alt={item.title}
                      className='w-full h-full object-cover'
                    />
                    {/* Dark overlay */}
                    <div className="absolute inset-0 bg-black/60"></div>
                  </div>

                  {/* Content Overlay */}
                  <div className={`absolute inset-0 ${item.color} bg-opacity-90 p-8 lg:p-16 flex flex-col justify-center text-white`}>
                    {/* Emoji decorations */}
                    <div className="absolute top-10 right-10 opacity-20 text-9xl animate-bounce">
                      {item.emoji}
                    </div>
                    <div className="absolute bottom-10 left-10 opacity-20 text-9xl">
                      {item.emoji}
                    </div>

                    {/* Main Content */}
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.5 }}
                      className="relative z-10 max-w-3xl mx-auto text-center space-y-6"
                    >
                      {/* Icon with emoji badge */}
                      <div className="relative inline-block mb-4">
                        <div className="w-28 h-28 mx-auto rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border-4 border-white/30 shadow-xl">
                          {item.icon}
                        </div>
                        <div className="absolute -bottom-2 -right-2 text-5xl bg-white rounded-full p-2 shadow-lg">
                          {item.emoji}
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className="text-3xl lg:text-5xl font-bold mb-4 drop-shadow-lg">
                        {item.title}
                      </h3>

                      {/* Description */}
                      <p className="text-lg lg:text-xl font-medium leading-relaxed opacity-95">
                        {item.description}
                      </p>

                      {/* Full Description */}
                      <p className="text-base lg:text-lg opacity-90 leading-relaxed border-t border-white/30 pt-4">
                        {item.fullDescription}
                      </p>
                    </motion.div>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Previous Button */}
          <motion.button
            disabled={index === 0}
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            className={`absolute left-4 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all z-20
              ${
                index === 0
                  ? 'opacity-30 cursor-not-allowed bg-white/50'
                  : 'bg-white hover:scale-110 hover:shadow-2xl opacity-90 hover:opacity-100'
              }`}
            whileHover={{ scale: index === 0 ? 1 : 1.1 }}
            whileTap={{ scale: index === 0 ? 1 : 0.95 }}
          >
            <svg
              className='w-7 h-7 text-blue-600'
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
            disabled={index === clubItems.length - 1}
            onClick={() => setIndex((i) => Math.min(clubItems.length - 1, i + 1))}
            className={`absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all z-20
              ${
                index === clubItems.length - 1
                  ? 'opacity-30 cursor-not-allowed bg-white/50'
                  : 'bg-white hover:scale-110 hover:shadow-2xl opacity-90 hover:opacity-100'
              }`}
            whileHover={{ scale: index === clubItems.length - 1 ? 1 : 1.1 }}
            whileTap={{ scale: index === clubItems.length - 1 ? 1 : 0.95 }}
          >
            <svg
              className='w-7 h-7 text-blue-600'
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
          <div className='absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 p-3 bg-white/30 backdrop-blur-md rounded-full border border-white/40 shadow-xl z-20'>
            {clubItems.map((_, i) => (
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
