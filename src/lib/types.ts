export type Role = "owner" | "admin" | "manager" | "sales_rep" | "viewer";
export type EntityType = "lead" | "contact" | "company" | "deal";

export type Permission =
  | "workspace:manage"
  | "members:manage"
  | "pipeline:configure"
  | "records:read_all"
  | "records:create"
  | "records:update"
  | "records:assign"
  | "records:archive"
  | "reports:view"
  | "audit:view"
  | "apikeys:manage"
  | "billing:manage";

export interface WorkspaceSummary {
  id: string;
  name: string;
  industry: string;
  currency: string;
  isDemo: boolean;
  role: Role;
  timezone?: string;
}

export interface Session {
  user: { id: string; name: string; email: string };
  workspaces: WorkspaceSummary[];
  activeWorkspace: WorkspaceSummary | null;
  permissions: Permission[];
}

export interface UserRef {
  _id: string;
  name: string;
  email?: string;
}

export interface Lead {
  _id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  companyName: string;
  jobTitle: string;
  source: string;
  status: string;
  ownerId: UserRef;
  estimatedValue: number;
  currency: string;
  tags: string[];
  city: string;
  country: string;
  lastContactedAt: string | null;
  nextFollowUpAt: string | null;
  convertedAt: string | null;
  convertedContactId: string | null;
  convertedCompanyId: string | null;
  convertedDealId: string | null;
  archivedAt: string | null;
  createdAt: string;
}

export interface Company {
  _id: string;
  name: string;
  domain: string;
  industry: string;
  size: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  ownerId: UserRef;
  archivedAt: string | null;
  createdAt: string;
  contactCount?: number;
  dealCount?: number;
  openDealValue?: number;
}

export interface Contact {
  _id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  jobTitle: string;
  companyId: { _id: string; name: string; domain?: string; industry?: string } | null;
  ownerId: UserRef;
  tags: string[];
  city: string;
  country: string;
  archivedAt: string | null;
  createdAt: string;
}

export interface Stage {
  _id: string;
  name: string;
  order: number;
  probability: number;
  type: "open" | "won" | "lost";
  color: string;
}

export interface Pipeline {
  _id: string;
  name: string;
  isDefault: boolean;
  stages: Stage[];
}

export interface Deal {
  _id: string;
  title: string;
  pipelineId: string;
  stageId: string;
  ownerId: UserRef;
  companyId: { _id: string; name: string; domain?: string } | null;
  contactId: { _id: string; firstName: string; lastName: string; email?: string; phone?: string } | null;
  value: number;
  currency: string;
  probability: number;
  expectedCloseDate: string | null;
  status: "open" | "won" | "lost";
  finalAmount: number | null;
  closedAt: string | null;
  lostReason: string | null;
  stageChangedAt: string;
  createdAt: string;
}

export interface Task {
  _id: string;
  title: string;
  description: string;
  type: "call" | "email" | "meeting" | "follow_up" | "general";
  priority: "low" | "medium" | "high";
  dueAt: string;
  status: "open" | "completed";
  completedAt: string | null;
  assignedTo: UserRef;
  relatedType: EntityType | null;
  relatedId: string | null;
  relatedName: string;
  createdBy: string;
}

export interface Activity {
  _id: string;
  type: string;
  links: Array<{ entityType: EntityType; entityId: string }>;
  actorId: UserRef | null;
  summary: string;
  body: string;
  isSystem: boolean;
  occurredAt: string;
}

export interface Member {
  userId: string;
  name: string;
  email: string;
  role: Role;
  status: "active" | "deactivated";
  joinedAt: string;
}

export interface Notification {
  _id: string;
  type: string;
  title: string;
  body: string;
  link: string;
  readAt: string | null;
  createdAt: string;
}
