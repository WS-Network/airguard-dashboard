import {
  PencilRulerIcon,
  SettingsIcon,
  UnlockIcon,
  SmartphoneIcon,
  HomeIcon,
  LucideIcon,
  TestTubeIcon,
  MessageSquareIcon,
} from "lucide-react";

// Sidebar navigation item interface
export interface SidebarItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
}

// Sidebar navigation items
export const sidebarItems: SidebarItem[] = [
  {
    id: "home",
    label: "Home",
    icon: HomeIcon,
    href: "/dashboard/home",
  },
  {
    id: "design",
    label: "Design",
    icon: PencilRulerIcon,
    href: "/dashboard/design",
  },
  {
    id: "manage",
    label: "Manage",
    icon: SettingsIcon,
    href: "/dashboard/manage",
  },
  {
    id: "unlock",
    label: "Unlock",
    icon: UnlockIcon,
    href: "/dashboard/unlock",
  },
  {
    id: "setup",
    label: "Setup Device",
    icon: SmartphoneIcon,
    href: "/dashboard/setup",
  },
  {
    id: "ai-chat",
    label: "AI Chat",
    icon: MessageSquareIcon,
    href: "/dashboard/ai-chat",
  },
  {
    id: "api-test",
    label: "API Test",
    icon: TestTubeIcon,
    href: "/dashboard/api-test",
  },
];
