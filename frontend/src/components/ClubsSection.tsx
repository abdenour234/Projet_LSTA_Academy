import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Code, Bot, MessageCircle, BookText, Palette, ArrowRight, Sparkles } from "lucide-react";
import clubDev from "@/assets/club-developpement.png";
import clubRobot from "@/assets/club-robotique.png";
import clubSoft from "@/assets/club-softskills.png";
import clubLit from "@/assets/club-litterature.png";
import clubDesign from "@/assets/club-design.png";

const ClubsSection = () => {
  const clubs = [
    {
      icon: Code,
      title: "Développement Informatique",
      description: "Le Club Développement Informatique ouvre les portes du monde du code et de la création numérique. Les élèves y apprennent à concevoir des sites web, des applications et des jeux interactifs à l'aide de langages simples et adaptés à leur niveau. À travers des projets concrets, ils développent leur logique, leur autonomie et leur esprit d'innovation, tout en découvrant comment les technologies façonnent le monde moderne.",
      color: "hsl(var(--edu-blue))",
      emoji: "💻",
      image: clubDev,
    },
    {
      icon: Bot,
      title: "Robotique & Innovation",
      description: "Le Club Robotique invite les élèves à explorer le monde fascinant des machines intelligentes. En assemblant des robots, en les programmant et en les testant, ils découvrent comment la science, la technologie et la créativité peuvent s'unir pour résoudre des problèmes réels. Le club valorise la coopération, la pensée critique et l'expérimentation, tout en rendant l'apprentissage scientifique amusant et concret.",
      color: "hsl(var(--edu-mint))",
      emoji: "🤖",
      image: clubRobot,
    },
    {
      icon: MessageCircle,
      title: "Soft Skills & Leadership",
      description: "Ce club aide les élèves à mieux se connaître, à collaborer efficacement et à communiquer avec confiance. À travers des activités ludiques, des jeux de rôle et des mini-projets collectifs, ils développent des compétences essentielles : travail d'équipe, empathie, gestion du stress, prise de parole et créativité. Le club prépare les élèves à devenir des citoyens responsables, ouverts et capables de s'adapter à toutes les situations.",
      color: "hsl(var(--edu-yellow))",
      emoji: "🗣️",
      image: clubSoft,
    },
    {
      icon: BookText,
      title: "Littérature & Théâtre",
      description: "Le Club Littérature et Théâtre célèbre la magie des mots et des émotions. Les élèves y lisent, interprètent et mettent en scène des textes issus de la littérature marocaine et universelle. À travers des ateliers d'écriture, de lecture expressive et de jeu théâtral, ils renforcent leur maîtrise du langage, leur confiance en soi et leur sens artistique. Le club transforme la lecture en une aventure vivante et collective.",
      color: "hsl(var(--edu-orange))",
      emoji: "📖",
      image: clubLit,
    },
    {
      icon: Palette,
      title: "Design Graphique & Dessin",
      description: "Ce club est un espace d'expression artistique et numérique. Les élèves y apprennent à créer des affiches, logos, illustrations et bandes dessinées à l'aide d'outils modernes comme Canva. Ils découvrent les bases du design graphique, de la couleur et de la mise en page tout en développant leur sens esthétique et leur imagination. Le club favorise la créativité et l'attention au détail.",
      color: "hsl(var(--edu-coral))",
      emoji: "🎨",
      image: clubDesign,
    },
  ];

  return (
    <section id="clubs" className="py-16 relative overflow-hidden scroll-mt-20 bg-[hsl(var(--cream))]">
      {/* Playful background elements - simple colored shapes */}
      <div className="absolute inset-0 overflow-hidden opacity-30">
        <div className="absolute top-20 left-10 w-32 h-32 bg-[hsl(var(--edu-blue))] rounded-full animate-float" />
        <div className="absolute top-1/3 right-20 w-40 h-40 bg-[hsl(var(--edu-yellow))] rounded-full animate-float" style={{ animationDelay: "1s" }} />
        <div className="absolute bottom-32 left-1/4 w-36 h-36 bg-[hsl(var(--edu-mint))] rounded-full animate-float" style={{ animationDelay: "2s" }} />
        <div className="absolute bottom-40 right-1/3 w-28 h-28 bg-[hsl(var(--edu-coral))] rounded-full animate-float" style={{ animationDelay: "1.5s" }} />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="text-center space-y-4 mb-12 animate-fade-in">
          <h2 className="text-4xl lg:text-5xl font-bold text-[hsl(var(--edu-blue))] leading-tight">
            Clubs Éducatifs
          </h2>
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-1 bg-[hsl(var(--edu-blue))] rounded-full" />
            <Sparkles className="w-6 h-6 text-[hsl(var(--edu-yellow))] animate-pulse-glow" />
            <div className="w-12 h-1 bg-[hsl(var(--edu-mint))] rounded-full" />
          </div>
          <p className="text-lg lg:text-xl text-foreground font-semibold max-w-3xl mx-auto leading-relaxed">
            Apprendre, créer et s'amuser ensemble ! 🚀
          </p>
        </div>

        {/* Clubs Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto mb-10">
          {clubs.map((club, index) => {
            const Icon = club.icon;
            return (
              <div
                key={index}
                className="group animate-fade-in-scale"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <Card
                  className="h-full border-4 hover:border-white bg-white shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-all duration-500 hover:scale-105 hover:-translate-y-2 cursor-pointer rounded-[2rem] overflow-hidden relative"
                  style={{ borderColor: club.color }}
                >
                  <CardContent className="p-0 space-y-0 relative">
                    {/* Image Container */}
                    <div className="relative h-40 lg:h-48 overflow-hidden rounded-t-[2rem]">
                      <div 
                        className="absolute inset-0 opacity-20"
                        style={{ backgroundColor: club.color }}
                      />
                      <img 
                        src={club.image} 
                        alt={club.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      
                      {/* Floating emoji on image */}
                      <div className="absolute top-3 right-3 text-4xl animate-bounce-soft drop-shadow-xl">
                        {club.emoji}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 lg:p-7 space-y-3">
                      <h3 
                        className="font-bold text-xl drop-shadow-sm group-hover:scale-105 transition-transform duration-300"
                        style={{ color: club.color }}
                      >
                        {club.title}
                      </h3>
                      
                      {/* Description */}
                      <p className="text-foreground/80 font-medium text-xs lg:text-sm leading-relaxed line-clamp-4">
                        {club.description}
                      </p>

                      {/* Decorative dots */}
                      <div className="flex justify-center gap-2 pt-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: club.color, opacity: 0.7 }} />
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: club.color, opacity: 0.5 }} />
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: club.color, opacity: 0.3 }} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center animate-fade-in" style={{ animationDelay: "0.8s" }}>
          <Button 
            size="lg" 
            className="gap-3 text-base px-8 py-5 rounded-full bg-[hsl(var(--edu-mint))] hover:bg-[hsl(165_75%_55%)] text-white shadow-[var(--shadow-button)] hover:shadow-[var(--shadow-card-hover)] hover:scale-105 transition-all duration-300 group font-bold"
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
