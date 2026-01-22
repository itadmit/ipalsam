import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("he-IL", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(date: Date | string | null): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("he-IL", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatPhone(phone: string): string {
  if (phone.length === 10) {
    return `${phone.slice(0, 3)}-${phone.slice(3, 6)}-${phone.slice(6)}`;
  }
  return phone;
}

export function getRoleLabel(
  role: "super_admin" | "hq_commander" | "dept_commander" | "soldier"
): string {
  const labels = {
    super_admin: "סופר אדמין",
    hq_commander: "מפקד מפקדה",
    dept_commander: "מפקד מחלקה",
    soldier: "חייל",
  };
  return labels[role] || role;
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: "טיוטה",
    submitted: "הוגש",
    approved: "אושר",
    rejected: "נדחה",
    ready_for_pickup: "מוכן לאיסוף",
    handed_over: "נמסר",
    returned: "הוחזר",
    closed: "סגור",
    overdue: "באיחור",
    available: "זמין",
    in_use: "בשימוש",
    maintenance: "בתחזוקה",
    lost: "אבד",
    damaged: "פגום",
    destroyed: "הושמד",
    active: "פעיל",
    folding: "בקיפול",
  };
  return labels[status] || status;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-800",
    submitted: "bg-blue-100 text-blue-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    ready_for_pickup: "bg-yellow-100 text-yellow-800",
    handed_over: "bg-purple-100 text-purple-800",
    returned: "bg-teal-100 text-teal-800",
    closed: "bg-gray-100 text-gray-800",
    overdue: "bg-red-100 text-red-800",
    available: "bg-green-100 text-green-800",
    in_use: "bg-blue-100 text-blue-800",
    maintenance: "bg-yellow-100 text-yellow-800",
    lost: "bg-red-100 text-red-800",
    damaged: "bg-orange-100 text-orange-800",
    active: "bg-green-100 text-green-800",
    folding: "bg-yellow-100 text-yellow-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}

