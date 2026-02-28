import type { InferSelectModel } from "drizzle-orm";
import type {
  users,
  departments,
  bases,
  itemTypes,
  itemUnits,
  requests,
  movements,
  signatures,
  categories,
} from "@/db/schema";

// Base types from schema
export type User = InferSelectModel<typeof users>;
export type Department = InferSelectModel<typeof departments>;
export type Base = InferSelectModel<typeof bases>;
export type ItemType = InferSelectModel<typeof itemTypes>;
export type ItemUnit = InferSelectModel<typeof itemUnits>;
export type Request = InferSelectModel<typeof requests>;
export type Movement = InferSelectModel<typeof movements>;
export type Signature = InferSelectModel<typeof signatures>;
export type Category = InferSelectModel<typeof categories>;

// Extended types with relations
export type UserWithDepartment = User & {
  department?: Department | null;
};

export type DepartmentWithStats = Department & {
  totalItems?: number;
  availableItems?: number;
  inUseItems?: number;
  pendingRequests?: number;
};

export type ItemTypeWithUnits = ItemType & {
  units?: ItemUnit[];
  department?: Department;
  category?: Category | null;
};

export type RequestWithRelations = Request & {
  requester?: User;
  department?: Department;
  itemType?: ItemType;
  itemUnit?: ItemUnit | null;
  approvedBy?: User | null;
};

export type MovementWithRelations = Movement & {
  itemType?: ItemType;
  itemUnit?: ItemUnit | null;
  request?: Request | null;
  fromUser?: User | null;
  toUser?: User | null;
  executedBy?: User;
};

// Session user type
export type SessionUser = {
  id: string;
  phone: string;
  firstName: string;
  lastName: string;
  email: string | null;
  role: "super_admin" | "hq_commander" | "dept_commander" | "soldier";
  departmentId: string | null;
  baseId: string | null;
  mustChangePassword: boolean;
};

// Form types
export type LoginFormData = {
  phone: string;
  password: string;
};

export type ChangePasswordFormData = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export type CreateUserFormData = {
  phone: string;
  firstName: string;
  lastName: string;
  email?: string;
  role: "super_admin" | "hq_commander" | "dept_commander" | "soldier";
  departmentId?: string;
  baseId?: string;
};

export type CreateDepartmentFormData = {
  name: string;
  description?: string;
  baseId: string;
  operatingHoursStart?: string;
  operatingHoursEnd?: string;
  allowImmediate: boolean;
  allowScheduled: boolean;
};

export type CreateItemTypeFormData = {
  name: string;
  catalogNumber?: string;
  description?: string;
  notes?: string;
  departmentId: string;
  categoryId?: string;
  type: "quantity" | "serial";
  quantityTotal?: number;
  minimumAlert?: number;
  requiresDoubleApproval: boolean;
  maxLoanDays?: number;
};

export type CreateRequestFormData = {
  departmentId: string;
  itemTypeId: string;
  itemUnitId?: string;
  quantity: number;
  urgency: "immediate" | "scheduled";
  scheduledPickupAt?: Date;
  scheduledReturnAt?: Date;
  purpose?: string;
  notes?: string;
  recipientName: string;
  recipientPhone?: string;
  recipientSignature?: string;
};

// Dashboard stats
export type DashboardStats = {
  totalDepartments: number;
  totalItems: number;
  availableItems: number;
  inUseItems: number;
  pendingRequests: number;
  overdueItems: number;
  activeLoans: number;
};

export type DepartmentDashboardStats = {
  totalItems: number;
  availableItems: number;
  inUseItems: number;
  pendingRequests: number;
  overdueLoans: number;
  recentMovements: MovementWithRelations[];
};

