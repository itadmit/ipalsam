"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Edit, Trash2 } from "lucide-react";

interface CategoryActionsProps {
  departments: { id: string; name: string }[];
}

export function AddCategoryButton({ departments }: CategoryActionsProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [departmentId, setDepartmentId] = useState("");

  const handleSubmit = async () => {
    if (!name.trim() || !departmentId) return;
    setLoading(true);
    try {
      // TODO: Call server action
      // await createCategory({ name, departmentId });
      await new Promise((r) => setTimeout(r, 1000));
      setOpen(false);
      setName("");
      setDepartmentId("");
      router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="w-4 h-4" />
        קטגוריה חדשה
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>הוספת קטגוריה חדשה</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <Select
              id="department"
              label="מחלקה"
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              options={departments.map((d) => ({ value: d.id, label: d.name }))}
              placeholder="בחר מחלקה"
            />
            <Input
              id="name"
              label="שם הקטגוריה"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="למשל: מכשירי קשר"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              ביטול
            </Button>
            <Button onClick={handleSubmit} loading={loading} disabled={!name.trim() || !departmentId}>
              הוסף קטגוריה
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface CategoryRowActionsProps {
  category: { id: string; name: string };
  departmentName: string;
}

export function CategoryRowActions({ category, departmentName }: CategoryRowActionsProps) {
  const router = useRouter();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(category.name);

  const handleEdit = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      // TODO: Call server action
      // await updateCategory(category.id, { name });
      await new Promise((r) => setTimeout(r, 1000));
      setShowEditDialog(false);
      router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      // TODO: Call server action
      // await deleteCategory(category.id);
      await new Promise((r) => setTimeout(r, 1000));
      setShowDeleteDialog(false);
      router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={() => setShowEditDialog(true)}>
          <Edit className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-red-500 hover:text-red-600 hover:bg-red-50"
          onClick={() => setShowDeleteDialog(true)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>עריכת קטגוריה</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              id="name"
              label="שם הקטגוריה"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              ביטול
            </Button>
            <Button onClick={handleEdit} loading={loading} disabled={!name.trim()}>
              שמור
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">מחיקת קטגוריה</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-slate-600">
              האם אתה בטוח שברצונך למחוק את הקטגוריה <strong>{category.name}</strong>?
            </p>
            <p className="text-sm text-slate-500 mt-2">
              פעולה זו לא תמחק פריטים קיימים, רק תסיר את הקטגוריה.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              ביטול
            </Button>
            <Button variant="destructive" onClick={handleDelete} loading={loading}>
              <Trash2 className="w-4 h-4" />
              מחק
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface AddCategoryToDeptButtonProps {
  departmentId: string;
  departmentName: string;
}

export function AddCategoryToDeptButton({ departmentId, departmentName }: AddCategoryToDeptButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      // TODO: Call server action
      // await createCategory({ name, departmentId });
      await new Promise((r) => setTimeout(r, 1000));
      setOpen(false);
      setName("");
      router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button variant="outline" className="w-full mt-2" onClick={() => setOpen(true)}>
        <Plus className="w-4 h-4" />
        הוסף קטגוריה ל{departmentName}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>הוספת קטגוריה ל{departmentName}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              id="name"
              label="שם הקטגוריה"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="למשל: אנטנות"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              ביטול
            </Button>
            <Button onClick={handleSubmit} loading={loading} disabled={!name.trim()}>
              הוסף קטגוריה
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

