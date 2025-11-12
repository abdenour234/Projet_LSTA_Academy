import { Button } from "@/components/ui/button";
import { Lightbulb, Cpu, Heart, ArrowRight, Sparkles } from "lucide-react";
import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface CardProps {
  id: number;
  title: string;
  description: string;
  emoji: string;
  index: number;
  totalCards: number;
  color: string;
}

const GlassCard: React.FC<CardProps> = ({ title, description, emoji, index, totalCards, color }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    const container = containerRef.current;
    if (!card || !container) return;

    const targetScale = 1 - (totalCards - index) * 0.05;

    gsap.set(card, {
      scale: 1,
      transformOrigin: "center top"
    });

    ScrollTrigger.create({
      trigger: container,
      start: "top center",
      end: "bottom center",
      scrub: 1,
      onUpdate: (self) => {
        const progress = self.progress;
        const scale = gsap.utils.interpolate(1, targetScale, progress);

        gsap.set(card, {
          scale: Math.max(scale, targetScale),
          transformOrigin: "center top"
        });
      }
    });

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, [index, totalCards]);

  return (
    <div
      ref={containerRef}
      style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'sticky',
        top: 0
      }}
    >
      <div
        ref={cardRef}
        style={{
          position: 'relative',
          width: '70%',
          maxWidth: '900px',
          height: '450px',
          borderRadius: '24px',
          isolation: 'isolate',
          top: `calc(-5vh + ${index * 25}px)`,
          transformOrigin: 'top'
        }}
        className="card-content"
      >
        {/* Electric Border Effect */}
        <div
          style={{
            position: 'absolute',
            inset: '-3px',
            borderRadius: '27px',
            padding: '3px',
            background: `conic-gradient(
              from 0deg,
              transparent 0deg,
              ${color} 60deg,
              ${color.replace('0.8', '0.6')} 120deg,
              transparent 180deg,
              ${color.replace('0.8', '0.4')} 240deg,
              transparent 360deg
            )`,
            zIndex: -1
          }}
        />

        {/* Main Card Content */}
        <div style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: '24px',
          background: `linear-gradient(145deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))`,
          backdropFilter: 'blur(25px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: `
            0 8px 32px rgba(0, 0, 0, 0.3),
            0 2px 8px rgba(0, 0, 0, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.3),
            inset 0 -1px 0 rgba(255, 255, 255, 0.1)
          `,
          overflow: 'hidden',
          padding: '3rem',
          textAlign: 'center'
        }}>
          {/* Glass effects */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '60%',
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%)',
            pointerEvents: 'none',
            borderRadius: '24px 24px 0 0'
          }} />

          <div style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            right: '10px',
            height: '2px',
            background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.6) 50%, transparent 100%)',
            borderRadius: '1px',
            pointerEvents: 'none'
          }} />

          {/* Content */}
          <div style={{ position: 'relative', zIndex: 10 }}>
            <div style={{ fontSize: '5rem', marginBottom: '1.5rem' }}>{emoji}</div>
            <h3 style={{ 
              fontSize: '2.5rem', 
              fontWeight: 'bold', 
              color: 'white',
              marginBottom: '1rem',
              textShadow: '0 2px 10px rgba(0,0,0,0.3)'
            }}>
              {title}
            </h3>
            <p style={{ 
              fontSize: '1.25rem', 
              color: 'rgba(255, 255, 255, 0.9)',
              lineHeight: '1.6',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              {description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const MethodeSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  const pillars = [
    {
      id: 1,
      title: "Innovation Pédagogique",
      description: "Des pratiques éducatives modernes et interactives.",
      emoji: "💡",
      color: "rgba(59, 130, 246, 0.8)", // blue-600
    },
    {
      id: 2,
      title: "Technologie Intelligente",
      description: "L'intelligence artificielle au service de l'apprentissage.",
      emoji: "🤖",
      color: "rgba(16, 185, 129, 0.8)", // emerald-600
    },
    {
      id: 3,
      title: "Accompagnement Humain",
      description: "Un suivi personnalisé pour chaque élève et enseignant.",
      emoji: "❤️",
      color: "rgba(59, 130, 246, 0.8)", // blue-600
    },
  ];

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    gsap.fromTo(container,
      { opacity: 0 },
      {
        opacity: 1,
        duration: 1.2,
        ease: "power2.out"
      }
    );
  }, []);

  return (
    <section ref={containerRef} id="methode" className="relative overflow-hidden scroll-mt-20" style={{ background: '#0a0a0a' }}>
      {/* Hero Section */}
      <div style={{
        minHeight: '70vh',
        width: '100%',
        display: 'grid',
        placeContent: 'center',
        position: 'relative',
        color: '#ffffff',
        padding: '4rem 2rem'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `
            linear-gradient(to right, rgba(79, 79, 79, 0.18) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(79, 79, 79, 0.18) 1px, transparent 1px)
          `,
          backgroundSize: '54px 54px',
          maskImage: 'radial-gradient(ellipse 60% 50% at 50% 0%, #000 70%, transparent 100%)'
        }} />
        
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <h2 style={{
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            fontWeight: 'bold',
            lineHeight: '1.2',
            marginBottom: '1.5rem'
          }}>
            Méthode Pédagogique
          </h2>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{ width: '3rem', height: '4px', background: '#3B82F6', borderRadius: '9999px' }} />
            <Sparkles style={{ width: '1.5rem', height: '1.5rem', color: '#3B82F6' }} />
            <div style={{ width: '3rem', height: '4px', background: '#3B82F6', borderRadius: '9999px' }} />
          </div>
          <p style={{
            fontSize: 'clamp(1.125rem, 2vw, 1.5rem)',
            fontWeight: '600',
            maxWidth: '48rem',
            margin: '0 auto',
            lineHeight: '1.6',
            color: 'rgba(255, 255, 255, 0.9)'
          }}>
            Une pédagogie moderne propulsée par la technologie et l'intelligence humaine
          </p>
        </div>
      </div>

      {/* Stacked Cards Section */}
      <div style={{ color: '#ffffff', width: '100%' }}>
        {pillars.map((card, index) => (
          <GlassCard
            key={card.id}
            id={card.id}
            title={card.title}
            description={card.description}
            emoji={card.emoji}
            index={index}
            totalCards={pillars.length}
            color={card.color}
          />
        ))}
      </div>

      {/* CTA Section */}
      <div style={{
        minHeight: '50vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4rem 2rem'
      }}>
        <Button 
          size="lg" 
          className="gap-3 text-base px-8 py-5 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 group font-medium"
        >
          Découvrir notre méthode
          <ArrowRight className="h-5 w-5 group-hover:translate-x-2 transition-transform duration-300" />
        </Button>
      </div>
    </section>
  );
};

export default MethodeSection;
