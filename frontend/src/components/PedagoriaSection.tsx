import StackedCards from "./StackedCards";
import logoPedagoria from "@/assets/logo-pedagoria.png";
import { useState, useEffect } from "react";

const PedagoriaSection = () => {
  const [displayedText, setDisplayedText] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const fullText = "transforme l'éducation en rendant l'apprentissage plus accessible, interactif et personnalisé pour chaque élève.";

  useEffect(() => {
    // Observer to detect when the section is visible
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isVisible) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.5 }
    );

    const element = document.getElementById("pedagoria-statement");
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [isVisible]);

  useEffect(() => {
    if (isVisible && displayedText.length < fullText.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(fullText.slice(0, displayedText.length + 1));
      }, 30); // Speed of typing (30ms per character)

      return () => clearTimeout(timeout);
    }
  }, [isVisible, displayedText, fullText]);
  return (
    <section className="py-20 relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      <div className="container mx-auto px-6 relative z-10">
        {/* Main content */}
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center space-y-4 mb-16 animate-fade-in">
            <div className="space-y-2">
              <h2 className="text-4xl lg:text-5xl font-bold text-blue-600 leading-tight">
                Propulsé par Pedagoria
              </h2>
              <div className="flex items-center justify-center gap-3 my-6">
                <div className="w-16 h-1 bg-gradient-to-r from-blue-600 to-blue-400" />
                <div className="w-3 h-3 bg-emerald-500 rotate-45" />
                <div className="w-16 h-1 bg-gradient-to-l from-emerald-500 to-emerald-400" />
              </div>
              <p className="text-base lg:text-lg text-blue-500 max-w-3xl mx-auto leading-relaxed font-medium pt-2">
                Une plateforme innovante qui révolutionne l&apos;apprentissage en combinant 
                pédagogie moderne, intelligence artificielle et accompagnement humain.
              </p>
            </div>
          </div>

          {/* Stacked Cards Display */}
          <div className="flex justify-center items-center min-h-[600px] mb-16 px-4">
            <StackedCards />
          </div>

          {/* Bottom statement */}
          <div 
            id="pedagoria-statement"
            className="text-center animate-fade-in bg-gradient-to-r from-blue-600 to-emerald-500 text-white rounded-2xl p-10 lg:p-12 shadow-xl border-2 border-blue-200" 
            style={{ animationDelay: "0.6s" }}
          >
            <p className="text-2xl lg:text-3xl font-bold leading-relaxed">
              <span className="text-emerald-100">Pedagoria</span>{" "}
              {displayedText}
              <span className="animate-pulse">|</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PedagoriaSection;
