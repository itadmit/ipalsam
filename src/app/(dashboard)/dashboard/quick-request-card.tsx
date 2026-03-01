import { headers } from "next/headers";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, ScanBarcode } from "lucide-react";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { CopyLinkButton } from "./copy-link-button";

interface QuickRequestCardProps {
  userId: string;
}

export async function QuickRequestCard({ userId }: QuickRequestCardProps) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { barcode: true },
  });

  const barcode = user?.barcode || null;
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = headersList.get("x-forwarded-proto") || "http";
  const baseUrl = `${protocol}://${host}`;
  const requestUrl = `${baseUrl}/request`;

  return (
    <Card className="border-emerald-200 bg-emerald-50/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-emerald-800">
          <ScanBarcode className="w-5 h-5" />
          השאלה מהירה
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-slate-600">
          שתף את הלינק עם החיילים כדי שיוכלו להגיש השאלה מהטלפון
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <code className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm truncate">
            {requestUrl}
          </code>
          <CopyLinkButton url={requestUrl} />
          <Link href="/request" target="_blank">
            <Button variant="outline" size="sm" className="gap-1.5">
              <ExternalLink className="w-4 h-4" />
              פתח
            </Button>
          </Link>
        </div>

        {barcode ? (
          <div className="pt-3 border-t border-emerald-200">
            <p className="text-sm font-medium text-slate-700 mb-1">הברקוד שלך</p>
            <div className="flex items-center gap-2">
              <code className="px-3 py-2 rounded-lg bg-white border border-slate-200 font-mono text-lg">
                {barcode}
              </code>
              <CopyLinkButton url={barcode} label="העתק ברקוד" />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              סרוק את הברקוד או הזן טלפון בדף ההשאלה המהירה
            </p>
          </div>
        ) : (
          <p className="text-xs text-slate-500">
            להגדרת ברקוד אישי – פנה למנהל המערכת
          </p>
        )}
      </CardContent>
    </Card>
  );
}
