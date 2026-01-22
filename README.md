# ipalsam - מערכת ניהול ציוד

מערכת לניהול ציוד בבסיס צבאי בזמן אמת, לפי מחלקות.

## 🚀 התקנה מהירה

### 1. התקנת תלויות
```bash
npm install
```

### 2. הגדרת משתני סביבה
```bash
cp .env.example .env
```
ערוך את קובץ `.env` עם פרטי החיבור ל-Neon PostgreSQL.

### 3. יצירת מסד הנתונים
```bash
npm run db:push
npm run db:seed
```

### 4. הפעלת השרת
```bash
npm run dev
```

גש ל-[http://localhost:3000](http://localhost:3000)

## 👥 משתמשי ברירת מחדל

| תפקיד | טלפון | סיסמה |
|-------|-------|-------|
| סופר אדמין | 0542284283 | 0542284283 |
| מפקד מפקדה | 0527320191 | 0527320191 |
| מפקד מחלקה (קשר) | 0541234567 | 0541234567 |
| חייל | 0545556677 | 0545556677 |

> ⚠️ חיילים יידרשו לשנות סיסמה בהתחברות ראשונה

## 🏗️ ארכיטקטורה

### Stack טכנולוגי
- **Framework**: Next.js 16 (App Router)
- **Database**: Neon PostgreSQL
- **ORM**: Drizzle ORM
- **Auth**: NextAuth.js v5
- **Styling**: Tailwind CSS 4
- **UI Components**: Custom components

### עקרונות
- **80%+ Server Components** - טעינה מהירה
- **Server Actions** - כתיבה ללא API routes
- **Streaming** - תוכן נטען בחלקים
- **Optimistic UI** - תגובה מיידית

## 📁 מבנה הפרויקט

```
src/
├── app/
│   ├── (auth)/          # דפי אימות (login, change-password)
│   ├── (dashboard)/     # דפים מוגנים
│   │   ├── dashboard/   # דשבורדים לפי תפקיד
│   │   └── super-admin/ # אזור ניהול
│   └── api/             # API routes
├── actions/             # Server Actions
├── components/
│   ├── layout/          # Sidebar, Header
│   ├── forms/           # טפסים
│   └── ui/              # קומפוננטות בסיסיות
├── db/
│   ├── schema.ts        # Drizzle schema
│   ├── index.ts         # DB connection
│   └── seed.ts          # נתוני ברירת מחדל
├── lib/
│   ├── auth.ts          # NextAuth config
│   └── utils.ts         # פונקציות עזר
└── types/               # TypeScript types
```

## 🔐 הרשאות

| תפקיד | יכולות |
|-------|--------|
| **סופר אדמין** | הכל - ניהול משתמשים, מחלקות, הגדרות |
| **מפקד מפקדה** | גישה רוחבית + דוחות + ניהול מפקדי מחלקות |
| **מפקד מחלקה** | ניהול מלאי + אישור בקשות במחלקה שלו |
| **חייל** | הגשת בקשות + צפייה בבקשות שלו |

## 🗄️ פקודות מסד נתונים

```bash
# יצירת migration
npm run db:generate

# הפעלת migration
npm run db:migrate

# דחיפה ישירה (development)
npm run db:push

# פתיחת Drizzle Studio
npm run db:studio

# טעינת נתוני דוגמה
npm run db:seed
```

## 📱 תכונות עיקריות

- ✅ התחברות לפי מספר טלפון
- ✅ ניהול משתמשים והרשאות
- ✅ ניהול מחלקות
- ✅ ניהול ציוד (כמותי וסריאלי)
- ✅ מערכת בקשות והשאלות
- ✅ חתימות דיגיטליות
- ✅ דשבורדים לפי תפקיד
- ✅ אזור סופר אדמין
- ✅ Audit Log מלא

## 🌐 RTL Support

המערכת תומכת בעברית מלאה עם RTL.

## 📄 License

MIT
