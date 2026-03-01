"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Link2, ScanBarcode } from "lucide-react";
import { CopyLinkButton } from "@/app/(dashboard)/dashboard/copy-link-button";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

interface QuickRequestCardForUserProps {
  personalLink: string;
  barcode?: string | null;
  role: "soldier" | "dept_commander";
}

export function QuickRequestCardForUser({
  personalLink,
  barcode,
  role,
}: QuickRequestCardForUserProps) {
  const isDeptCommander = role === "dept_commander";

  return (
    <Card className="border-emerald-200 bg-emerald-50/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-emerald-800">
          <Link2 className="w-5 h-5" />
          השאלה מהירה
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-slate-600">
          {isDeptCommander
            ? "שתף את הלינק האישי שלך עם החיילים – הם יוכלו לבקש ציוד רק ממחלקתך"
            : "שתף את הלינק עם החיילים כדי שיוכלו להגיש השאלה מהטלפון"}
        </p>

        <div>
          <p className="text-sm font-medium text-slate-700 mb-1">לינק אישי</p>
          <div className="flex flex-wrap items-center gap-2">
            <code className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm truncate">
              {personalLink}
            </code>
            <CopyLinkButton url={personalLink} />
            <a href={personalLink} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="gap-1.5">
                <ExternalLink className="w-4 h-4" />
                פתח
              </Button>
            </a>
          </div>
        </div>

        {role === "soldier" && (
          <div className="pt-3 border-t border-emerald-200">
            <p className="text-sm font-medium text-slate-700 mb-1 flex items-center gap-1.5">
              <ScanBarcode className="w-4 h-4" />
              ברקוד
            </p>
            {barcode ? (
              <>
                <div className="flex items-center gap-2">
                  <code className="px-3 py-2 rounded-lg bg-white border border-slate-200 font-mono text-lg">
                    {barcode}
                  </code>
                  <CopyLinkButton url={barcode} label="העתק ברקוד" />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  סרוק את הברקוד או הזן טלפון בדף ההשאלה המהירה
                </p>
              </>
            ) : (
              <p className="text-xs text-slate-500">
                להגדרת ברקוד – הזן למעלה בשדה ברקוד ושמור
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
