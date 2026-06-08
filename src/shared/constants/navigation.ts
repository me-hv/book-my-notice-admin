import {
  BookOpenText,
  LayoutDashboard,
  Newspaper,
  Settings,
  Tags,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

export type AppRoute = {
  title: string;
  href: string;
  icon: LucideIcon;
};

export const sidebarRoutes: AppRoute[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Bookings",
    href: "/bookings",
    icon: BookOpenText,
  },
  {
    title: "Customers",
    href: "/customers",
    icon: UsersRound,
  },
  {
    title: "Newspapers",
    href: "/newspapers",
    icon: Newspaper,
  },
  {
    title: "Pricing Rules",
    href: "/pricing",
    icon: Tags,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
];
