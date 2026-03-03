import { Skeleton } from "@/components/ui/skeleton";
import { ProfileHeader } from "@/components/layout/profile-header";

export default function RequestLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50/30">
      <ProfileHeader transparent />
      <div className="pb-24">
        <div className="max-w-lg mx-auto w-full -mt-16">
        {/* פרופיל סקלטון */}
        <div className="bg-white rounded-b-xl shadow-sm overflow-hidden">
          <Skeleton className="h-48 sm:h-56 w-full rounded-none" />
          <div className="px-4 pb-6 -mt-14 relative">
            <Skeleton className="w-24 h-24 rounded-full border-4 border-white shadow-lg" />
            <Skeleton className="h-6 w-48 mt-4" />
            <Skeleton className="h-4 w-32 mt-2" />
            <Skeleton className="h-4 w-28 mt-2" />
          </div>
        </div>

        {/* כרטיס חנות סקלטון */}
        <div className="pt-4 px-3">
          <Skeleton className="h-12 w-full rounded-t-lg mb-4" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full mt-2" />
          <Skeleton className="h-24 w-full mt-2" />
        </div>
        </div>
      </div>
    </div>
  );
}
