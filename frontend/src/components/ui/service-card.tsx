import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils"; // Your shadcn/ui utils file

// CVA for card variants
const cardVariants = cva(
  "relative flex flex-col justify-between w-full p-6 overflow-hidden rounded-xl shadow-sm transition-shadow duration-300 ease-in-out group hover:shadow-lg",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground",
        red: "bg-red-500/90 text-primary-foreground",
        blue: "bg-blue-500/90 text-primary-foreground",
        emerald: "bg-emerald-500/90 text-primary-foreground",
        gray: "bg-secondary text-secondary-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface ServiceCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  /**
   * The main title of the card.
   */
  title: string;
  /**
   * The description text for the card.
   */
  description: string;
  /**
   * The URL the card's link should point to.
   */
  href: string;
  /**
   * The icon component to display.
   */
  icon: React.ReactNode;
}

const ServiceCard = React.forwardRef<HTMLDivElement, ServiceCardProps>(
  ({ className, variant, title, description, href, icon, ...props }, ref) => {
    
    // Animation variants for Framer Motion
    const cardAnimation = {
      hover: {
        scale: 1.02,
        transition: { duration: 0.3 },
      },
    };

    const iconAnimation = {
      hover: {
        scale: 1.1,
        rotate: 3,
        x: 10,
        transition: { duration: 0.4, ease: "easeInOut" },
      },
    };
    
    const arrowAnimation = {
        hover: {
            x: 5,
            transition: { duration: 0.3, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" as const },
        }
    }

    return (
      <motion.div
        className={cn(cardVariants({ variant, className }))}
        ref={ref}
        variants={cardAnimation}
        whileHover="hover"
        {...props}
      >
        <div className="relative z-10 flex flex-col h-full">
          <div className="mb-4">
            {icon}
          </div>
          <h3 className="text-2xl font-bold tracking-tight mb-2">{title}</h3>
          <p className="text-sm opacity-90 mb-4">{description}</p>
          <a
            href={href}
            aria-label={`Learn more about ${title}`}
            className="mt-auto flex items-center text-sm font-semibold group-hover:underline"
          >
            EN SAVOIR PLUS
            <motion.div variants={arrowAnimation}>
                <ArrowRight className="ml-2 h-4 w-4" />
            </motion.div>
          </a>
        </div>
        
        <motion.div
          className="absolute -right-8 -bottom-8 w-32 h-32 opacity-20 group-hover:opacity-30"
          variants={iconAnimation}
        >
          {icon}
        </motion.div>
      </motion.div>
    );
  }
);
ServiceCard.displayName = "ServiceCard";

export { ServiceCard };
