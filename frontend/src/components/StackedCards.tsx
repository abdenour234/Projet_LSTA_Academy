import { cn } from "@/lib/utils";
import { Target, Users, Lightbulb } from "lucide-react";

interface FeatureBoxProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  subtitle: string;
  className: string;
  delay?: string;
}

interface StackedCardsProps {
  title?: string;
  features?: Array<{
    icon: React.ReactNode;
    title: string;
    description: string;
    subtitle: string;
    className: string;
    delay?: string;
  }>;
}

const FeatureBox = ({ icon, title, description, subtitle, className, delay }: FeatureBoxProps) => (
  <div className={`feature-box ${className}`} style={{ transitionDelay: delay }}>
    <div className="flex items-center gap-3 mb-2">
      <span className="icon-circle bg-blue-600 rounded-full p-2 text-white">
        {icon}
      </span>
      <h3 className="text-xl font-bold text-blue-600">{title}</h3>
    </div>
    <p className="text-lg font-medium text-blue-500 ml-11">{description}</p>
    <p className="text-base text-blue-400 ml-11 mt-1">{subtitle}</p>
  </div>
);

const StackedCards = ({
  title = "Innovation",
  features = [
    {
      icon: <Target className="size-5 text-white" />,
      title: "Approche Ciblée",
      description: "Solutions pédagogiques adaptées",
      subtitle: "À chaque besoin",
      className: "box1",
    },
    {
      icon: <Users className="size-5 text-white" />,
      title: "Collaboration",
      description: "Communauté éducative connectée",
      subtitle: "Ensemble pour réussir",
      className: "box2",
      delay: "0.15s",
    },
    {
      icon: <Lightbulb className="size-5 text-white" />,
      title: "Innovation",
      description: "Technologies au service de l'éducation",
      subtitle: "Apprentissage moderne",
      className: "box3",
      delay: "0.3s",
    },
  ],
}: StackedCardsProps) => (
  <div className="stacked-card">
    <div className="card-background" />
    <div className="card-logo text-2xl font-bold text-blue-600">{title}</div>

    {features.map((feature, index) => (
      <FeatureBox
        key={index}
        icon={feature.icon}
        title={feature.title}
        description={feature.description}
        subtitle={feature.subtitle}
        className={feature.className}
        delay={feature.delay}
      />
    ))}

    <div className="feature-box box4" style={{ transitionDelay: "0.45s" }} />
  </div>
);

export default StackedCards;
