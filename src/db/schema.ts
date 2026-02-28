import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  uuid,
  pgEnum,
  json,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// =============== ENUMS ===============

export const userRoleEnum = pgEnum("user_role", [
  "super_admin",
  "hq_commander",
  "dept_commander",
  "soldier",
]);

export const baseStatusEnum = pgEnum("base_status", [
  "active",
  "folding",
  "closed",
]);

export const itemTypeEnum = pgEnum("item_type", ["quantity", "serial"]);

export const requestStatusEnum = pgEnum("request_status", [
  "draft",
  "submitted",
  "approved",
  "rejected",
  "ready_for_pickup",
  "handed_over",
  "returned",
  "closed",
  "overdue",
]);

export const requestUrgencyEnum = pgEnum("request_urgency", [
  "immediate",
  "scheduled",
]);

export const movementTypeEnum = pgEnum("movement_type", [
  "intake",
  "allocation",
  "return",
  "transfer",
  "loss",
  "damage",
  "destruction",
]);

export const unitStatusEnum = pgEnum("unit_status", [
  "available",
  "in_use",
  "maintenance",
  "lost",
  "damaged",
  "destroyed",
]);

// =============== TABLES ===============

// בסיסים
export const bases = pgTable("bases", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  status: baseStatusEnum("status").default("active").notNull(),
  commanderName: text("commander_name"),
  commanderPhone: text("commander_phone"),
  openDate: timestamp("open_date").defaultNow(),
  closeDate: timestamp("close_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// תקופות תפעוליות
export const operationalPeriods = pgTable("operational_periods", {
  id: uuid("id").defaultRandom().primaryKey(),
  baseId: uuid("base_id")
    .references(() => bases.id)
    .notNull(),
  name: text("name").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  isActive: boolean("is_active").default(true).notNull(),
  openingSnapshot: json("opening_snapshot"),
  closingSnapshot: json("closing_snapshot"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// מחלקות
export const departments = pgTable("departments", {
  id: uuid("id").defaultRandom().primaryKey(),
  baseId: uuid("base_id")
    .references(() => bases.id)
    .notNull(),
  name: text("name").notNull(),
  description: text("description"),
  operatingHoursStart: text("operating_hours_start"), // "08:00"
  operatingHoursEnd: text("operating_hours_end"), // "17:00"
  allowImmediate: boolean("allow_immediate").default(true).notNull(),
  allowScheduled: boolean("allow_scheduled").default(true).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// משתמשים
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  phone: text("phone").unique().notNull(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  role: userRoleEnum("role").default("soldier").notNull(),
  departmentId: uuid("department_id").references(() => departments.id),
  baseId: uuid("base_id").references(() => bases.id),
  isActive: boolean("is_active").default(true).notNull(),
  mustChangePassword: boolean("must_change_password").default(true).notNull(),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// קטגוריות
export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  departmentId: uuid("department_id")
    .references(() => departments.id)
    .notNull(),
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// סוגי ציוד (ItemType)
export const itemTypes = pgTable("item_types", {
  id: uuid("id").defaultRandom().primaryKey(),
  departmentId: uuid("department_id")
    .references(() => departments.id)
    .notNull(),
  categoryId: uuid("category_id").references(() => categories.id),
  name: text("name").notNull(),
  catalogNumber: text("catalog_number"), // מק״ט/מס״ב/צ׳
  description: text("description"),
  notes: text("notes"),
  type: itemTypeEnum("type").default("quantity").notNull(),
  // לציוד כמותי:
  quantityTotal: integer("quantity_total").default(0),
  quantityAvailable: integer("quantity_available").default(0),
  quantityInUse: integer("quantity_in_use").default(0),
  // הגדרות נוספות:
  minimumAlert: integer("minimum_alert").default(0),
  requiresDoubleApproval: boolean("requires_double_approval")
    .default(false)
    .notNull(),
  maxLoanDays: integer("max_loan_days"), // מקסימום ימי השאלה
  isActive: boolean("is_active").default(true).notNull(),
  createdById: uuid("created_by_id").references(() => users.id), // חייל קולט - מי שהזין את הפריט
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// יחידות ציוד סריאליות (ItemUnit)
export const itemUnits = pgTable("item_units", {
  id: uuid("id").defaultRandom().primaryKey(),
  itemTypeId: uuid("item_type_id")
    .references(() => itemTypes.id)
    .notNull(),
  serialNumber: text("serial_number").notNull(),
  assetTag: text("asset_tag"),
  status: unitStatusEnum("status").default("available").notNull(),
  currentHolderId: uuid("current_holder_id").references(() => users.id),
  notes: text("notes"),
  acquiredAt: timestamp("acquired_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// בקשות
export const requests = pgTable("requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  requestGroupId: uuid("request_group_id"), // קישור בקשות מאותה הגשה
  requesterId: uuid("requester_id")
    .references(() => users.id)
    .notNull(),
  departmentId: uuid("department_id")
    .references(() => departments.id)
    .notNull(),
  itemTypeId: uuid("item_type_id")
    .references(() => itemTypes.id)
    .notNull(),
  itemUnitId: uuid("item_unit_id").references(() => itemUnits.id), // לציוד סריאלי
  quantity: integer("quantity").default(1).notNull(),
  urgency: requestUrgencyEnum("urgency").default("immediate").notNull(),
  scheduledPickupAt: timestamp("scheduled_pickup_at"),
  scheduledReturnAt: timestamp("scheduled_return_at"),
  purpose: text("purpose"),
  notes: text("notes"),
  recipientName: text("recipient_name"), // שם החייל המקבל (חובה)
  recipientPhone: text("recipient_phone"),
  recipientSignature: text("recipient_signature"), // חתימה דיגיטלית (data URL)
  status: requestStatusEnum("status").default("draft").notNull(),
  approvedById: uuid("approved_by_id").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),
  handedOverById: uuid("handed_over_by_id").references(() => users.id),
  handedOverAt: timestamp("handed_over_at"),
  returnedAt: timestamp("returned_at"),
  receivedById: uuid("received_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// תנועות (היסטוריה / Audit)
export const movements = pgTable("movements", {
  id: uuid("id").defaultRandom().primaryKey(),
  itemTypeId: uuid("item_type_id")
    .references(() => itemTypes.id)
    .notNull(),
  itemUnitId: uuid("item_unit_id").references(() => itemUnits.id),
  requestId: uuid("request_id").references(() => requests.id),
  type: movementTypeEnum("type").notNull(),
  quantity: integer("quantity").default(1).notNull(),
  fromDepartmentId: uuid("from_department_id").references(() => departments.id),
  toDepartmentId: uuid("to_department_id").references(() => departments.id),
  fromUserId: uuid("from_user_id").references(() => users.id),
  toUserId: uuid("to_user_id").references(() => users.id),
  executedById: uuid("executed_by_id")
    .references(() => users.id)
    .notNull(),
  notes: text("notes"),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// חתימות
export const signatures = pgTable("signatures", {
  id: uuid("id").defaultRandom().primaryKey(),
  movementId: uuid("movement_id")
    .references(() => movements.id)
    .notNull(),
  requestId: uuid("request_id").references(() => requests.id),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  signatureType: text("signature_type").notNull(), // "handover" | "return" | "approval"
  signedAt: timestamp("signed_at").defaultNow().notNull(),
  deviceInfo: text("device_info"),
  ipAddress: text("ip_address"),
  confirmed: boolean("confirmed").default(false).notNull(),
  pin: text("pin"), // PIN קצר אם נדרש
});

// הגדרות מערכת (key-value)
export const systemSettings = pgTable("system_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  key: text("key").unique().notNull(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Audit Log
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: uuid("entity_id"),
  oldValues: json("old_values"),
  newValues: json("new_values"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Snapshots - לתמיכה בפתיחה/סגירה של תקופות
export const inventorySnapshots = pgTable("inventory_snapshots", {
  id: uuid("id").defaultRandom().primaryKey(),
  periodId: uuid("period_id")
    .references(() => operationalPeriods.id)
    .notNull(),
  departmentId: uuid("department_id")
    .references(() => departments.id)
    .notNull(),
  snapshotType: text("snapshot_type").notNull(), // "opening" | "closing"
  data: json("data").notNull(), // { itemTypeId, quantity, units: [...] }
  createdById: uuid("created_by_id")
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// =============== RELATIONS ===============

export const basesRelations = relations(bases, ({ many }) => ({
  departments: many(departments),
  users: many(users),
  operationalPeriods: many(operationalPeriods),
}));

export const departmentsRelations = relations(departments, ({ one, many }) => ({
  base: one(bases, {
    fields: [departments.baseId],
    references: [bases.id],
  }),
  users: many(users),
  categories: many(categories),
  itemTypes: many(itemTypes),
  requests: many(requests),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  department: one(departments, {
    fields: [users.departmentId],
    references: [departments.id],
  }),
  base: one(bases, {
    fields: [users.baseId],
    references: [bases.id],
  }),
  requests: many(requests),
  signatures: many(signatures),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  department: one(departments, {
    fields: [categories.departmentId],
    references: [departments.id],
  }),
  itemTypes: many(itemTypes),
}));

export const itemTypesRelations = relations(itemTypes, ({ one, many }) => ({
  department: one(departments, {
    fields: [itemTypes.departmentId],
    references: [departments.id],
  }),
  category: one(categories, {
    fields: [itemTypes.categoryId],
    references: [categories.id],
  }),
  createdBy: one(users, {
    fields: [itemTypes.createdById],
    references: [users.id],
  }),
  units: many(itemUnits),
  movements: many(movements),
  requests: many(requests),
}));

export const itemUnitsRelations = relations(itemUnits, ({ one, many }) => ({
  itemType: one(itemTypes, {
    fields: [itemUnits.itemTypeId],
    references: [itemTypes.id],
  }),
  currentHolder: one(users, {
    fields: [itemUnits.currentHolderId],
    references: [users.id],
  }),
  movements: many(movements),
}));

export const requestsRelations = relations(requests, ({ one, many }) => ({
  requester: one(users, {
    fields: [requests.requesterId],
    references: [users.id],
  }),
  department: one(departments, {
    fields: [requests.departmentId],
    references: [departments.id],
  }),
  itemType: one(itemTypes, {
    fields: [requests.itemTypeId],
    references: [itemTypes.id],
  }),
  itemUnit: one(itemUnits, {
    fields: [requests.itemUnitId],
    references: [itemUnits.id],
  }),
  approvedBy: one(users, {
    fields: [requests.approvedById],
    references: [users.id],
  }),
  handedOverBy: one(users, {
    fields: [requests.handedOverById],
    references: [users.id],
  }),
  receivedBy: one(users, {
    fields: [requests.receivedById],
    references: [users.id],
  }),
  movements: many(movements),
  signatures: many(signatures),
}));

export const movementsRelations = relations(movements, ({ one, many }) => ({
  itemType: one(itemTypes, {
    fields: [movements.itemTypeId],
    references: [itemTypes.id],
  }),
  itemUnit: one(itemUnits, {
    fields: [movements.itemUnitId],
    references: [itemUnits.id],
  }),
  request: one(requests, {
    fields: [movements.requestId],
    references: [requests.id],
  }),
  fromDepartment: one(departments, {
    fields: [movements.fromDepartmentId],
    references: [departments.id],
  }),
  toDepartment: one(departments, {
    fields: [movements.toDepartmentId],
    references: [departments.id],
  }),
  fromUser: one(users, {
    fields: [movements.fromUserId],
    references: [users.id],
  }),
  toUser: one(users, {
    fields: [movements.toUserId],
    references: [users.id],
  }),
  executedBy: one(users, {
    fields: [movements.executedById],
    references: [users.id],
  }),
  signatures: many(signatures),
}));

export const signaturesRelations = relations(signatures, ({ one }) => ({
  movement: one(movements, {
    fields: [signatures.movementId],
    references: [movements.id],
  }),
  request: one(requests, {
    fields: [signatures.requestId],
    references: [requests.id],
  }),
  user: one(users, {
    fields: [signatures.userId],
    references: [users.id],
  }),
}));

