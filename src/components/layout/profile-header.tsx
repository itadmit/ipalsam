"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Bell, Menu, User, Send, Package, Info } from "lucide-react";
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
  const [dropdownPos, setDropdownPos] = useState<{ top: number; right: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const inButton = buttonRef.current?.contains(target);
      const inDropdown = dropdownRef.current?.contains(target);
      if (open && !inButton && !inDropdown) closeDropdown();
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

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
      className={`sticky top-0 z-[100] w-full border-b ${
        transparent
          ? "bg-transparent border-transparent"
          : "bg-white/95 backdrop-blur-sm border-slate-200"
      }`}
    >
      <div className="max-w-lg mx-auto grid grid-cols-3 items-center h-16 px-4">
        <div className="flex justify-start">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className={`flex items-center justify-center w-10 h-10 rounded-full cursor-pointer ${
              transparent
                ? "text-white hover:bg-white/20 [filter:drop-shadow(0_1px_2px_rgba(0,0,0,0.5))]"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
        <Link href="/request" className="flex justify-center">
          <span
            className={`text-2xl font-bold ${transparent ? "text-white drop-shadow-md [text-shadow:0_1px_2px_rgba(0,0,0,0.5)]" : "text-emerald-700"}`}
            style={{ fontFamily: "var(--font-smooch-sans), system-ui, sans-serif" }}
          >
            iPalsam
          </span>
        </Link>
        <div className="flex justify-end">
          {(showNotifications || transparent || handoverPhone) && (
            <div className="relative">
              <button
                ref={buttonRef}
                type="button"
                onClick={() => {
                  if (open || dropdownExiting) {
                    closeDropdown();
                  } else {
                    const rect = buttonRef.current?.getBoundingClientRect();
                    if (rect) {
                      setDropdownPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
                      setOpen(true);
                    }
                  }
                }}
                className={`flex items-center justify-center w-10 h-10 rounded-full cursor-pointer ${
                  transparent
                    ? "text-white hover:bg-white/20 [filter:drop-shadow(0_1px_2px_rgba(0,0,0,0.5))]"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Bell className="w-5 h-5" />
                {showNotifications && unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              {(open || dropdownExiting) && dropdownPos && typeof document !== "undefined" &&
                createPortal(
                  <div
                    ref={dropdownRef}
                    className={`fixed w-72 max-h-80 overflow-auto bg-white border border-slate-200 rounded-lg shadow-xl py-1 z-[110] ${
                      dropdownExiting ? "animate-out fade-out-0" : "animate-in zoom-in-95"
                    }`}
                    style={{ top: dropdownPos.top, right: dropdownPos.right }}
                  >
                    <div className="px-4 py-2 border-b border-slate-100">
                      <h3 className="font-semibold text-slate-900 text-sm">התראות</h3>
                    </div>
                    {!showNotifications ? (
                      <div className="px-4 py-6 text-center text-slate-500 text-sm">
                        התחבר כדי לראות התראות
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-slate-500 text-sm">
                        אין התראות חדשות
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {notifications.map((n) => (
                          <Link
                            key={n.id}
                            href="/dashboard/open-requests"
                            onClick={() => closeDropdown()}
                            className={`block px-4 py-3 text-right hover:bg-slate-50 ${!n.readAt ? "bg-emerald-50/50" : ""}`}
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
                  </div>,
                  document.body
                )}
            </div>
          )}
        </div>
      </div>

      {/* תפריט צד */}
      {(menuOpen || menuExiting) && (
        <>
          <div
            className={`fixed inset-0 bg-black/50 z-[110] ${
              menuExiting ? "animate-out fade-out-0" : "animate-in fade-in-0"
            }`}
            onClick={closeMenu}
            aria-hidden
          />
          <div
            className={`fixed top-0 start-0 bottom-0 w-72 max-w-[85vw] bg-white shadow-xl z-[110] flex flex-col ${
              menuExiting ? "animate-out slide-out-to-end" : "animate-in slide-in-from-end"
            }`}
          >
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">תפריט</h2>
              <button
                type="button"
                onClick={closeMenu}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <nav className="p-4 flex flex-col gap-1">
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
        </>
      )}
    </header>
  );
}
