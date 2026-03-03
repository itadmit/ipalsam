"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Bell, Menu, User, Send, Package, Info, LogIn } from "lucide-react";
import { getProfileNotifications, getUnreadNotificationCount } from "@/actions/notifications";
import type { ProfileNotification } from "@/actions/notifications";

interface ProfileHeaderProps {
  showNotifications?: boolean;
  transparent?: boolean;
  handoverPhone?: string;
  showOpenRequestButton?: boolean;
}

export function ProfileHeader({
  showNotifications = false,
  transparent = false,
  handoverPhone,
  showOpenRequestButton = false,
}: ProfileHeaderProps) {
  const [notifications, setNotifications] = useState<ProfileNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuExiting, setMenuExiting] = useState(false);
  const [dropdownExiting, setDropdownExiting] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!transparent) return;
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [transparent]);

  const showSolid = !transparent || scrolled;

  const closeMenu = () => {
    setMenuExiting(true);
  };

  const closeDropdown = () => {
    setDropdownExiting(true);
  };

  useEffect(() => {
    if (showNotifications) {
      getProfileNotifications().then(setNotifications);
      getUnreadNotificationCount().then(setUnreadCount);
    }
  }, [showNotifications]);


  useEffect(() => {
    if (!menuExiting) return;
    const t = setTimeout(() => {
      setMenuOpen(false);
      setMenuExiting(false);
    }, 150);
    return () => clearTimeout(t);
  }, [menuExiting]);

  useEffect(() => {
    if (!dropdownExiting) return;
    const t = setTimeout(() => {
      setOpen(false);
      setDropdownExiting(false);
    }, 150);
    return () => clearTimeout(t);
  }, [dropdownExiting]);

  return (
    <header
      className={`sticky top-0 z-[100] w-full border-b transition-all duration-300 ${
        showSolid
          ? "bg-white/95 backdrop-blur-sm border-slate-200"
          : "bg-transparent border-transparent"
      }`}
    >
      <div className="max-w-lg mx-auto grid grid-cols-3 items-center h-16 px-4">
        <div className="flex justify-start">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setMenuOpen(true);
            }}
            className={`flex items-center justify-center w-10 h-10 rounded-full cursor-pointer transition-colors duration-300 ${
              showSolid
                ? "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                : "text-white hover:bg-white/20 [filter:drop-shadow(0_1px_2px_rgba(0,0,0,0.5))]"
            }`}
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
        <Link href={handoverPhone ? `/profile/${handoverPhone}` : "/profile"} className="flex justify-center">
          <span
            className={`text-2xl font-bold transition-colors duration-300 ${showSolid ? "text-emerald-700" : "text-white drop-shadow-md [text-shadow:0_1px_2px_rgba(0,0,0,0.5)]"}`}
            style={{ fontFamily: "var(--font-smooch-sans), system-ui, sans-serif" }}
          >
            iPalsam
          </span>
        </Link>
        <div className="flex justify-end">
          {(showNotifications || transparent || handoverPhone) && (
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  if (open || dropdownExiting) {
                    closeDropdown();
                  } else {
                    setMenuOpen(false);
                    setOpen(true);
                  }
                }}
                className={`flex items-center justify-center w-10 h-10 rounded-full cursor-pointer transition-colors duration-300 ${
                  showSolid
                    ? "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    : "text-white hover:bg-white/20 [filter:drop-shadow(0_1px_2px_rgba(0,0,0,0.5))]"
                }`}
              >
                <Bell className="w-5 h-5" />
                {showNotifications && unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* פאנל התראות מצד שמאל - מוצג ב-Portal מעל הכל */}
      {(open || dropdownExiting) && typeof document !== "undefined" &&
        createPortal(
          <>
            <div
              className={`fixed inset-0 bg-black/50 z-[9999] cursor-pointer ${
                dropdownExiting ? "animate-out fade-out-0" : "animate-in fade-in-0"
              }`}
              onClick={closeDropdown}
              onKeyDown={(e) => e.key === "Escape" && closeDropdown()}
              role="button"
              tabIndex={0}
              aria-label="סגור התראות"
            />
            <div
              ref={dropdownRef}
              className={`fixed top-0 end-0 bottom-0 w-72 max-w-[85vw] bg-white shadow-xl z-[9999] flex flex-col ${
                dropdownExiting ? "animate-out slide-out-to-end-rtl" : "animate-in slide-in-from-end-rtl"
              }`}
            >
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">התראות</h2>
              <button
                type="button"
                onClick={closeDropdown}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {!showNotifications ? (
                <Link
                  href="/login"
                  onClick={() => closeDropdown()}
                  className="flex items-center justify-center gap-2 py-6 text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  <LogIn className="w-5 h-5 shrink-0" />
                  התחבר כדי להמשיך
                </Link>
              ) : notifications.length === 0 ? (
                <div className="py-6 text-center text-slate-500 text-sm">
                  אין התראות חדשות
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {notifications.map((n) => (
                    <Link
                      key={n.id}
                      href="/dashboard/open-requests"
                      onClick={() => closeDropdown()}
                      className={`block py-3 text-right hover:bg-slate-50 rounded-lg px-2 -mx-2 ${!n.readAt ? "bg-emerald-50/50" : ""}`}
                    >
                      <p className="font-medium text-slate-900 text-sm">{n.title}</p>
                      {n.body && (
                        <p className="text-slate-600 text-xs mt-0.5 line-clamp-2">{n.body}</p>
                      )}
                      <p className="text-slate-400 text-xs mt-1">
                        {new Date(n.createdAt).toLocaleDateString("he-IL", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
          </>,
          document.body
        )}

      {/* תפריט צד - מוצג ב-Portal מעל הכל */}
      {(menuOpen || menuExiting) && typeof document !== "undefined" &&
        createPortal(
          <>
            <div
              className={`fixed inset-0 bg-black/50 z-[9999] cursor-pointer ${
                menuExiting ? "animate-out fade-out-0" : "animate-in fade-in-0"
              }`}
              onClick={closeMenu}
              onKeyDown={(e) => e.key === "Escape" && closeMenu()}
              role="button"
              tabIndex={0}
              aria-label="סגור תפריט"
            />
            <div
              className={`fixed top-0 start-0 bottom-0 w-72 max-w-[85vw] shadow-xl z-[9999] flex flex-col overflow-hidden bg-white/95 backdrop-blur-md ${
                menuExiting ? "animate-out slide-out-to-end" : "animate-in slide-in-from-end"
              }`}
            >
              <div className="p-4 border-b border-slate-200 flex items-center justify-between shrink-0 bg-white/95 backdrop-blur-md">
                <h2 className="font-semibold text-slate-900">תפריט</h2>
                <button
                  type="button"
                  onClick={closeMenu}
                  className="p-2 rounded-full hover:bg-slate-100 text-slate-600 text-2xl leading-none"
                >
                  ×
                </button>
              </div>
              <nav className="flex-1 p-4 flex flex-col gap-1 overflow-auto bg-white/95 backdrop-blur-md">
                {handoverPhone && (
                  <>
                    <Link
                      href={`/profile/${handoverPhone}`}
                      onClick={closeMenu}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-50 text-slate-700"
                    >
                      <User className="w-5 h-5 text-slate-500 shrink-0" />
                      פרופיל
                    </Link>
                    {showOpenRequestButton && (
                      <Link
                        href={`/profile/${handoverPhone}/open-request`}
                        onClick={closeMenu}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-50 text-slate-700"
                      >
                        <Send className="w-5 h-5 text-slate-500 shrink-0" />
                        בקשה חדשה
                      </Link>
                    )}
                    <Link
                      href={`/profile/${handoverPhone}`}
                      onClick={closeMenu}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-50 text-slate-700"
                    >
                      <Package className="w-5 h-5 text-slate-500 shrink-0" />
                      השאלה חדשה
                    </Link>
                  </>
                )}
                <Link
                  href="/about"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-50 text-slate-700"
                >
                  <Info className="w-5 h-5 text-slate-500 shrink-0" />
                  אודות מערכת
                </Link>
              </nav>
            </div>
          </>,
          document.body
        )}
    </header>
  );
}
