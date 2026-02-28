"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/types";
import {
  LayoutDashboard,
  Package,
  FileText,
  Users,
  Building2,
  Settings,
  Shield,
  LogOut,
  Menu,
  X,
  Boxes,
  ClipboardList,
  ArrowLeftRight,
  Clock,
  Database,
  History,
  Calendar,
} from "lucide-react";
import { useState } from "react";
import { signOut } from "next-auth/react";

interface SidebarProps {
  user: SessionUser;
}

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  show: boolean;
}

function NavContent({
  user,
  mainNavItems,
  adminNavItems,
  canAccessAdmin,
  pathname,
  onLinkClick,
}: {
  user: SessionUser;
  mainNavItems: NavItem[];
  adminNavItems: NavItem[];
  canAccessAdmin: boolean;
  pathname: string;
  onLinkClick: () => void;
}) {
  return (
    <>
      {/* Logo */}
      <div className="p-6 border-b border-slate-700">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
            <Package className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">ipalsam</h1>
            <p className="text-xs text-slate-400">ניהול ציוד</p>
          </div>
        </Link>
      </div>

      {/* User info */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <span className="text-emerald-400 font-semibold">
              {user.firstName[0]}
              {user.lastName[0]}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-slate-400">
              {user.role === "super_admin" && "סופר אדמין"}
              {user.role === "hq_commander" && "מפקד מפקדה"}
              {user.role === "dept_commander" && "מפקד מחלקה"}
              {user.role === "soldier" && "חייל"}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <p className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          ראשי
        </p>
        {mainNavItems
          .filter((item) => item.show)
          .map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onLinkClick}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}

        {canAccessAdmin && (
          <>
            <p className="px-3 py-2 mt-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              ניהול
            </p>
            {adminNavItems
              .filter((item) => item.show)
              .map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onLinkClick}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                );
              })}
          </>
        )}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-slate-700">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-slate-300 hover:bg-red-500/20 hover:text-red-400 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          התנתק
        </button>
      </div>
    </>
  );
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const isSuperAdmin = user.role === "super_admin";
  const isHQCommander = user.role === "hq_commander";
  const isDeptCommander = user.role === "dept_commander";
  const canAccessAdmin = isSuperAdmin || isHQCommander;

  const mainNavItems: NavItem[] = [
    {
      href: "/dashboard",
      label: "דשבורד",
      icon: LayoutDashboard,
      show: true,
    },
    {
      href: "/dashboard/inventory",
      label: "מלאי",
      icon: Package,
      show: true,
    },
    {
      href: "/dashboard/requests",
      label: "השאלות",
      icon: FileText,
      show: true,
    },
    {
      href: "/dashboard/handover",
      label: "מסירה/החזרה",
      icon: ArrowLeftRight,
      show: canAccessAdmin || isDeptCommander,
    },
    {
      href: "/dashboard/loans",
      label: "השאלות פעילות",
      icon: Clock,
      show: canAccessAdmin || isDeptCommander,
    },
    {
      href: "/dashboard/schedule",
      label: "לוח תורים",
      icon: Calendar,
      show: canAccessAdmin || isDeptCommander,
    },
    {
      href: "/dashboard/departments",
      label: "מחלקות",
      icon: Building2,
      show: canAccessAdmin || isDeptCommander,
    },
    {
      href: "/dashboard/users",
      label: "משתמשים",
      icon: Users,
      show: canAccessAdmin || isDeptCommander,
    },
  ];

  const adminNavItems: NavItem[] = [
    {
      href: "/super-admin",
      label: "אזור ניהול",
      icon: Shield,
      show: canAccessAdmin,
    },
    {
      href: "/super-admin/base",
      label: "ניהול בסיס",
      icon: Database,
      show: isSuperAdmin,
    },
    {
      href: "/super-admin/categories",
      label: "קטגוריות",
      icon: Boxes,
      show: canAccessAdmin,
    },
    {
      href: "/super-admin/reports",
      label: "דוחות",
      icon: ClipboardList,
      show: canAccessAdmin,
    },
    {
      href: "/super-admin/audit-log",
      label: "יומן פעילות",
      icon: History,
      show: canAccessAdmin,
    },
    {
      href: "/super-admin/settings",
      label: "הגדרות",
      icon: Settings,
      show: isSuperAdmin,
    },
  ];

  const handleLinkClick = () => setIsMobileOpen(false);

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 right-4 z-40 p-2 rounded-lg bg-slate-800 text-white shadow-lg"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "lg:hidden fixed inset-y-0 right-0 z-50 w-72 bg-slate-800 transform transition-transform duration-300",
          isMobileOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <button
          onClick={() => setIsMobileOpen(false)}
          className="absolute top-4 left-4 p-2 rounded-lg hover:bg-slate-700 text-slate-400"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex flex-col h-full">
          <NavContent
            user={user}
            mainNavItems={mainNavItems}
            adminNavItems={adminNavItems}
            canAccessAdmin={canAccessAdmin}
            pathname={pathname}
            onLinkClick={handleLinkClick}
          />
        </div>
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 right-0 z-30 w-72 flex-col bg-slate-800">
        <NavContent
          user={user}
          mainNavItems={mainNavItems}
          adminNavItems={adminNavItems}
          canAccessAdmin={canAccessAdmin}
          pathname={pathname}
          onLinkClick={handleLinkClick}
        />
      </aside>
    </>
  );
}
