"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CopyLinkButton } from "./copy-link-button";
import { QuickRequestSettingsModal } from "./quick-request-settings-modal";
import { ExternalLink, Download } from "lucide-react";

interface QuickRequestActionsProps {
  requestUrl: string;
  qrDataUrl1080: string | null;
  isDeptCommander: boolean;
  departmentId?: string;
  autoApproveRequests?: boolean;
  storeDepartmentIds?: string[];
  departments?: { id: string; name: string }[];
}

export function QuickRequestActions({
  requestUrl,
  qrDataUrl1080,
  isDeptCommander,
  departmentId,
  autoApproveRequests = false,
  storeDepartmentIds = [],
  departments = [],
}: QuickRequestActionsProps) {
  const handleDownload = () => {
    if (!qrDataUrl1080) return;
    const a = document.createElement("a");
    a.href = qrDataUrl1080;
    a.download = "qr-request.png";
    a.click();
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <code className="flex-1 min-w-[120px] max-w-[280px] truncate px-2 py-1.5 rounded bg-white border text-xs">
        {requestUrl}
      </code>
      <CopyLinkButton url={requestUrl} label="העתק" />
      <Link href={requestUrl} target="_blank">
        <Button variant="outline" size="sm" className="gap-1 h-8">
          <ExternalLink className="w-3.5 h-3.5" />
          פתח
        </Button>
      </Link>
      <Button
        variant="outline"
        size="sm"
        className="gap-1 h-8"
        onClick={handleDownload}
        disabled={!qrDataUrl1080}
      >
        <Download className="w-3.5 h-3.5" />
        הורד 1080
      </Button>
      {isDeptCommander && departmentId && (
        <QuickRequestSettingsModal
          departmentId={departmentId}
          autoApproveRequests={autoApproveRequests}
          storeDepartmentIds={storeDepartmentIds}
          departments={departments}
        />
      )}
    </div>
  );
}
