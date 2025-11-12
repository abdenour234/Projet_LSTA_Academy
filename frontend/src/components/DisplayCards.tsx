import { cn } from "@/lib/utils";
import { Sparkles, Target, Users, Lightbulb } from "lucide-react";

interface DisplayCardProps {
  className?: string;
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  date?: string;
  iconClassName?: string;
  titleClassName?: string;
}

function DisplayCard({
  className,
  icon = <Sparkles className="size-4 text-blue-300" />,
  title = "Featured",
  description = "Discover amazing content",
  date = "Just now",
  iconClassName = "text-blue-500",
  titleClassName = "text-blue-500",
}: DisplayCardProps) {
  return (
    <div
      className={cn(
        "relative flex h-48 w-full max-w-4xl -skew-y-[8deg] select-none flex-col justify-between rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50/70 to-white/70 backdrop-blur-sm px-8 py-6 transition-all duration-700 after:absolute after:-right-1 after:top-[-5%] after:h-[110%] after:w-full after:bg-gradient-to-l after:from-white after:to-transparent after:content-[''] hover:border-emerald-400 hover:bg-gradient-to-br hover:from-emerald-50/70 hover:to-blue-50/70 [&>*]:flex [&>*]:items-center [&>*]:gap-3",
        className
      )}
    >
      <div>
        <span className="relative inline-block rounded-full bg-blue-600 p-2">
          {icon}
        </span>
        <p className={cn("text-2xl font-bold", titleClassName)}>{title}</p>
      </div>
      <p className="whitespace-nowrap text-xl font-medium text-blue-500">{description}</p>
      <p className="text-lg text-blue-400">{date}</p>
    </div>
  );
}

interface DisplayCardsProps {
  cards?: DisplayCardProps[];
}

export default function DisplayCards({ cards }: DisplayCardsProps) {
  const defaultCards = [
    {
      icon: <Target className="size-6 text-white" />,
      title: "Approche Ciblée",
      description: "Solutions pédagogiques adaptées",
      date: "À chaque besoin",
      titleClassName: "text-blue-600",
      className: "[grid-area:stack] hover:-translate-y-10 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-white/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
    },
    {
      icon: <Users className="size-6 text-white" />,
      title: "Collaboration",
      description: "Communauté éducative connectée",
      date: "Ensemble pour réussir",
      titleClassName: "text-blue-600",
      className: "[grid-area:stack] translate-y-14 hover:-translate-y-1 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-white/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
    },
    {
      icon: <Lightbulb className="size-6 text-white" />,
      title: "Innovation",
      description: "Technologies au service de l'éducation",
      date: "Apprentissage moderne",
      titleClassName: "text-blue-600",
      className: "[grid-area:stack] translate-y-28 hover:translate-y-14",
    },
  ];

  const displayCards = cards || defaultCards;

  return (
    <div className="w-full max-w-5xl mx-auto grid [grid-template-areas:'stack'] place-items-center opacity-100 animate-in fade-in-0 duration-700">
      {displayCards.map((cardProps, index) => (
        <DisplayCard key={index} {...cardProps} />
      ))}
    </div>
  );
}
