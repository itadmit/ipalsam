import { Heart, MessageCircle } from "lucide-react";
import { ProfileHeader } from "@/components/layout/profile-header";

export default function AboutPage() {
  const whatsappNumber = "972542284283";
  const message = encodeURIComponent("היי, יש לי שאלה לגבי iPalsam");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50/30 flex flex-col">
      <ProfileHeader />
      <div className="max-w-lg mx-auto px-6 py-12 flex flex-col items-center">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center max-w-md">
        <div className="flex justify-center mb-6">
          <Heart className="w-16 h-16 text-red-500 fill-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-4">
         פותח מכל הלב
        </h1>
        <p className="text-slate-600 mb-6">
          מערכת iPalsam לניהול ציוד בבסיס צבאי
        </p>
        <p className="text-slate-500 text-sm mb-6">
          פותח על ידי יוגב אביטן
        </p>
        <p className="text-slate-600 text-sm mb-4">
          אם יש בעיה או תקלה, תעדכנו אותי:
        </p>
        <a
          href="tel:0542284283"
          className="text-emerald-600 font-medium block mb-2"
        >
          054-228-4283
        </a>
        <a
          href={`https://wa.me/${whatsappNumber}?text=${message}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium"
        >
          <MessageCircle className="w-5 h-5" />
          שלח הודעה בוואטסאפ
        </a>
        </div>
      </div>
      <footer className="mt-auto px-4 pb-8 pt-6 border-t border-slate-200 bg-white/50 rounded-t-2xl text-center">
        <p className="text-xs text-slate-400">
          iPalsam – פותח על ידי יוגב אביטן
        </p>
      </footer>
    </div>
  );
}
