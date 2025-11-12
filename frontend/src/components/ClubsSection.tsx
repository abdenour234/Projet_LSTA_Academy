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
      emoji: "💻",
      image: clubDev,
    },
    {
      icon: Bot,
      title: "Robotique & Innovation",
      description: "Le Club Robotique invite les élèves à explorer le monde fascinant des machines intelligentes. En assemblant des robots, en les programmant et en les testant, ils découvrent comment la science, la technologie et la créativité peuvent s'unir pour résoudre des problèmes réels. Le club valorise la coopération, la pensée critique et l'expérimentation, tout en rendant l'apprentissage scientifique amusant et concret.",
      emoji: "🤖",
      image: clubRobot,
    },
    {
      icon: MessageCircle,
      title: "Soft Skills & Leadership",
      description: "Ce club aide les élèves à mieux se connaître, à collaborer efficacement et à communiquer avec confiance. À travers des activités ludiques, des jeux de rôle et des mini-projets collectifs, ils développent des compétences essentielles : travail d'équipe, empathie, gestion du stress, prise de parole et créativité. Le club prépare les élèves à devenir des citoyens responsables, ouverts et capables de s'adapter à toutes les situations.",
      emoji: "🗣️",
      image: clubSoft,
    },
    {
      icon: BookText,
      title: "Littérature & Théâtre",
      description: "Le Club Littérature et Théâtre célèbre la magie des mots et des émotions. Les élèves y lisent, interprètent et mettent en scène des textes issus de la littérature marocaine et universelle. À travers des ateliers d'écriture, de lecture expressive et de jeu théâtral, ils renforcent leur maîtrise du langage, leur confiance en soi et leur sens artistique. Le club transforme la lecture en une aventure vivante et collective.",
      emoji: "📖",
      image: clubLit,
    },
    {
      icon: Palette,
      title: "Design Graphique & Dessin",
      description: "Ce club est un espace d'expression artistique et numérique. Les élèves y apprennent à créer des affiches, logos, illustrations et bandes dessinées à l'aide d'outils modernes comme Canva. Ils découvrent les bases du design graphique, de la couleur et de la mise en page tout en développant leur sens esthétique et leur imagination. Le club favorise la créativité et l'attention au détail.",
      emoji: "🎨",
      image: clubDesign,
    },
  ];

  return (
    <section id="clubs" className="py-16 relative overflow-hidden scroll-mt-20 bg-slate-50">
      <div className="container mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="text-center space-y-4 mb-12 animate-fade-in">
          <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 leading-tight">
            Clubs Éducatifs
          </h2>
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-1 bg-blue-600 rounded-full" />
            <Sparkles className="w-6 h-6 text-blue-500" />
            <div className="w-12 h-1 bg-blue-600 rounded-full" />
          </div>
          <p className="text-lg lg:text-xl text-slate-700 font-semibold max-w-3xl mx-auto leading-relaxed">
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
                  className="h-full border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all duration-500 hover:scale-105 cursor-pointer rounded-lg overflow-hidden relative"
                >
                  <CardContent className="p-0 space-y-0 relative">
                    {/* Image Container */}
                    <div className="relative h-40 lg:h-48 overflow-hidden rounded-t-lg">
                      <div className="absolute inset-0 bg-slate-900 opacity-5" />
                      <img 
                        src={club.image} 
                        alt={club.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      
                      {/* Floating emoji on image */}
                      <div className="absolute top-3 right-3 text-4xl drop-shadow-xl">
                        {club.emoji}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 lg:p-7 space-y-3">
                      <h3 className="font-bold text-xl text-slate-900 group-hover:scale-105 transition-transform duration-300">
                        {club.title}
                      </h3>
                      
                      {/* Description */}
                      <p className="text-slate-700 font-medium text-xs lg:text-sm leading-relaxed line-clamp-4">
                        {club.description}
                      </p>
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
            className="gap-3 text-base px-8 py-5 rounded-full bg-slate-900 hover:bg-slate-800 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 group font-medium"
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
