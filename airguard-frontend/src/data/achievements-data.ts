import { Zap, Leaf, FileBarChart, LucideIcon } from "lucide-react";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  value: string;
  unit: string;
  progress: number; // 0-100 (progress to next level)
  currentLevel: number;
  maxLevel: number;
  icon: LucideIcon;
  variant: "electricity" | "carbon" | "esg";
  nextLevelTarget?: string;
  levelBenefits?: string[];
}

export const achievements: Achievement[] = [
  {
    id: "electricity-saved",
    title: "Power Saver",
    description: "Electricity conserved through smart monitoring",
    value: "2,847",
    unit: "kWh",
    progress: 85,
    currentLevel: 3,
    maxLevel: 5,
    icon: Zap,
    variant: "electricity",
    nextLevelTarget: "3,000 kWh for Level 4",
    levelBenefits: [
      "Advanced energy analytics",
      "Custom reporting",
      "Priority support",
    ],
  },
  {
    id: "carbon-reduced",
    title: "Carbon Crusher",
    description: "CO₂ emissions prevented from entering atmosphere",
    value: "1.2",
    unit: "tons",
    progress: 73,
    currentLevel: 2,
    maxLevel: 4,
    icon: Leaf,
    variant: "carbon",
    nextLevelTarget: "1.5 tons for Level 3",
    levelBenefits: [
      "Carbon offset programs",
      "Sustainability badges",
      "Green certifications",
    ],
  },
  {
    id: "esg-reporting",
    title: "ESG Excellence",
    description:
      "Comprehensive sustainability reporting and compliance tracking",
    value: "94",
    unit: "score",
    progress: 78,
    currentLevel: 4,
    maxLevel: 5,
    icon: FileBarChart,
    variant: "esg",
    nextLevelTarget: "100 score for Level 5",
    levelBenefits: [
      "Executive dashboards",
      "Compliance automation",
      "Regulatory reporting",
    ],
  },
];
