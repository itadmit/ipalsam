export const VISIBLE_FEATURE_KEYS = [
  "dashboard",
  "inventory",
  "requests",
  "handover",
  "loans",
  "open-requests",
  "my-open-requests",
  "profile",
  "profile-edit",
  "schedule",
  "departments",
  "users",
  "super-admin-area",
  "base",
  "categories",
  "reports",
  "audit-log",
  "settings",
] as const;

export type VisibleFeatureKey = (typeof VISIBLE_FEATURE_KEYS)[number];

export const VISIBLE_FEATURE_LABELS: Record<VisibleFeatureKey, string> = {
  dashboard: "דשבורד",
  inventory: "מלאי",
  requests: "השאלות",
  handover: "מסירה/החזרה",
  loans: "השאלות פעילות",
  "open-requests": "בקשות פתוחות",
  "my-open-requests": "הבקשות שלי",
  profile: "פרופיל שלי",
  "profile-edit": "הגדרות פרופיל",
  schedule: "לוח תורים",
  departments: "מחלקות",
  users: "משתמשים",
  "super-admin-area": "אזור ניהול",
  base: "ניהול בסיס",
  categories: "קטגוריות",
  reports: "דוחות",
  "audit-log": "יומן פעילות",
  settings: "הגדרות",
};

export const FEATURE_TO_HREF: Record<VisibleFeatureKey, string> = {
  dashboard: "/dashboard",
  inventory: "/dashboard/inventory",
  requests: "/dashboard/requests",
  handover: "/dashboard/handover",
  loans: "/dashboard/loans",
  "open-requests": "/dashboard/open-requests",
  "my-open-requests": "/dashboard/my-open-requests",
  profile: "/dashboard/profile",
  "profile-edit": "/dashboard/profile/edit",
  schedule: "/dashboard/schedule",
  departments: "/dashboard/departments",
  users: "/dashboard/users",
  "super-admin-area": "/super-admin",
  base: "/super-admin/base",
  categories: "/super-admin/categories",
  reports: "/super-admin/reports",
  "audit-log": "/super-admin/audit-log",
  settings: "/super-admin/settings",
};

export type VisibleFeatures = Partial<Record<VisibleFeatureKey, boolean>>;

/** הרשאה איזה בקשות פתוחות המשתמש רואה */
export const OPEN_REQUESTS_FILTER_OPTIONS = [
  { value: "all", label: "הכל" },
  { value: "pending_only", label: "רק ממתינות" },
  { value: "processed_only", label: "רק שטופלו" },
] as const;

export type OpenRequestsFilterValue = (typeof OPEN_REQUESTS_FILTER_OPTIONS)[number]["value"];

/** הרחבה לשמירת open-requests-filter + הגדרות פרופיל */
export type ExtendedVisibleFeatures = VisibleFeatures & {
  "open-requests-filter"?: OpenRequestsFilterValue;
  /** חנות בפרופיל – ברירת מחדל: חיילים לא, מפקדים כן */
  "profile-store"?: boolean;
  /** בקשה פתוחה בפרופיל – ברירת מחדל: חיילים לא, מפקדים כן */
  "profile-open-request"?: boolean;
};

/** ברירת מחדל לחנות ובקשה פתוחה בפרופיל לפי תפקיד */
export function getProfileStoreOpenRequestDefault(role: string): { store: boolean; openRequest: boolean } {
  return role === "soldier" ? { store: false, openRequest: false } : { store: true, openRequest: true };
}
