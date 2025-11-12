import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { ClubsCarousel } from "./ClubsCarousel";

const ClubsSection = () => {
  return (
    <section id="clubs" className="py-16 relative overflow-hidden scroll-mt-20 bg-white">
      <div className="container mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="text-center space-y-4 mb-12 animate-fade-in">
          <h2 className="text-4xl lg:text-5xl font-bold text-blue-600 leading-tight">
            Clubs Éducatifs
          </h2>
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-1 bg-blue-600 rounded-full" />
            <Sparkles className="w-6 h-6 text-emerald-500" />
            <div className="w-12 h-1 bg-emerald-500 rounded-full" />
          </div>
          <p className="text-lg lg:text-xl text-blue-500 font-semibold max-w-3xl mx-auto leading-relaxed">
            Apprendre, créer et s'amuser ensemble ! 🚀
          </p>
        </div>

        {/* Clubs Carousel */}
        <div className="mb-10">
          <ClubsCarousel />
        </div>

        {/* CTA */}
        <div className="text-center animate-fade-in" style={{ animationDelay: "0.8s" }}>
          <Button 
            size="lg" 
            className="gap-3 text-base px-8 py-5 rounded-full bg-blue-600 hover:bg-emerald-500 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 group font-medium"
          >
            <Sparkles className="h-5 w-5 group-hover:rotate-180 transition-transform duration-500" />
            Rejoindre un club
            <ArrowRight className="h-5 w-5 group-hover:translate-x-2 transition-transform duration-300" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ClubsSection;
