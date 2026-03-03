"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/layout/page-header";
import { updateProfile } from "@/actions/profile";
import { ImageCropDialog } from "@/components/profile/image-crop-dialog";
import { ArrowRight, User, Camera } from "lucide-react";

export default function ProfileEditPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [cropType, setCropType] = useState<"avatar" | "cover">("avatar");
  const [cropImageSrc, setCropImageSrc] = useState("");
  const [fetching, setFetching] = useState(true);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        setFirstName(data.firstName || "");
        setLastName(data.lastName || "");
        setPhone(data.phone || "");
        setBio(data.bio || "");
        setAvatarUrl(data.avatarUrl || null);
        setCoverUrl(data.coverUrl || null);
      })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, []);

  const handleImageSelect = (type: "avatar" | "cover") => {
    const input = type === "avatar" ? avatarInputRef : coverInputRef;
    setCropType(type);
    input.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "avatar" | "cover") => {
    const file = e.target.files?.[0];
    if (!file?.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCropImageSrc(reader.result as string);
      setCropOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleCropComplete = (croppedImage: string) => {
    if (cropType === "avatar") {
      setAvatarUrl(croppedImage);
    } else {
      setCoverUrl(croppedImage);
    }
    setCropOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        bio: bio.trim() || undefined,
        avatarUrl: avatarUrl ?? undefined,
        coverUrl: coverUrl ?? undefined,
      });
      if ("error" in result) {
        setError(result.error || "שגיאה");
      } else {
        router.push("/dashboard/profile");
      }
    } catch {
      setError("אירעה שגיאה");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="space-y-6">
        <PageHeader title="עריכת פרופיל" />
        <div className="h-64 bg-slate-200 animate-pulse rounded-lg" />
        <div className="h-8 bg-slate-200 animate-pulse rounded w-1/3" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="עריכת פרופיל"
        description="כל השדות ניתנים לעריכה"
        actions={
          <Link href="/dashboard/profile">
            <Button variant="outline" className="gap-2">
              <ArrowRight className="w-4 h-4 rotate-180" />
              חזרה
            </Button>
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* תמונות */}
        <div className="rounded-lg border border-slate-200 p-4 space-y-4">
          <h3 className="font-medium text-slate-900">תמונות</h3>
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="flex flex-col items-center gap-2">
              <div
                className="w-24 h-24 rounded-full border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden cursor-pointer hover:border-emerald-400 transition-colors"
                onClick={() => handleImageSelect("avatar")}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="פרופיל" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-slate-400" />
                )}
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => handleImageSelect("avatar")} className="gap-1.5">
                <Camera className="w-4 h-4" />
                תמונת פרופיל
              </Button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileChange(e, "avatar")}
              />
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <div
                className="h-28 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden cursor-pointer hover:border-emerald-400 transition-colors"
                onClick={() => handleImageSelect("cover")}
              >
                {coverUrl ? (
                  <img src={coverUrl} alt="כיסוי" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-slate-400 text-sm">תמונת כיסוי</span>
                )}
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => handleImageSelect("cover")} className="gap-1.5 self-start">
                <Camera className="w-4 h-4" />
                תמונת כיסוי
              </Button>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileChange(e, "cover")}
              />
            </div>
          </div>
        </div>

        {/* פרטים */}
        <div className="rounded-lg border border-slate-200 p-4 space-y-4">
          <h3 className="font-medium text-slate-900">פרטים</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="שם פרטי"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="שם פרטי"
              required
            />
            <Input
              label="שם משפחה"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="שם משפחה"
              required
            />
          </div>
          <Input
            label="טלפון"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="טלפון"
            dir="ltr"
            required
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">ביו</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="טקסט קצר עליך..."
              rows={4}
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button type="submit" loading={loading}>
            שמור שינויים
          </Button>
          <Link href="/dashboard/profile">
            <Button type="button" variant="outline">
              ביטול
            </Button>
          </Link>
        </div>
      </form>

      <ImageCropDialog
        open={cropOpen}
        onOpenChange={setCropOpen}
        imageSrc={cropImageSrc}
        onCropComplete={handleCropComplete}
        cropType={cropType}
      />
    </div>
  );
}
