import { Suspense } from "react";
import { RequestEntryContent } from "./request-entry-content";

export default function RequestEntryPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">טוען...</div>}>
      <RequestEntryContent />
    </Suspense>
  );
}
