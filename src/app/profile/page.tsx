import { Suspense } from "react";
import { ProfileEntryContent } from "./profile-entry-content";

export default function ProfileEntryPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">טוען...</div>}>
      <ProfileEntryContent />
    </Suspense>
  );
}
