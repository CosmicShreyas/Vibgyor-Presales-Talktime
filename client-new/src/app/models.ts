export type UserRole = 'admin' | 'sales' | 'mapping';

export interface AuthUser {
  id: string;
  name: string;
  email?: string;
  role: UserRole;
  isSystemAdmin?: boolean;
  isActive?: boolean;
  employeeId?: string;
  mappingId?: string;
}

export interface AssignedToRef {
  _id: string;
  name: string;
}

export interface Client {
  _id: string;
  uniqueId?: string;
  name: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  company?: string;
  assignedTo?: AssignedToRef | null;
  status: string;
  priority?: string;
  notes?: string;
  address?: string;
  city?: string;
  state?: string;
  description?: string;
  source?: string;
  budget?: string;
  tags?: string;
  importMethod?: string;
  csvFileName?: string;
  csvImportId?: string;
  importedAt?: string;
  createdAt?: string;
  isUnassigned?: boolean;
  metadata?: { brandPartnerName?: string; brandPartnerCode?: string; facebookCampaignId?: string; facebookCampaignName?: string };
}

export interface ProjectSource {
  _id: string;
  name: string;
  description?: string;
}

export interface EmployeeUser {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  employeeId?: string;
  mappingId?: string;
  isSystemAdmin?: boolean;
}

export interface HierarchicalSubCategory {
  name: string;
  children: Record<string, Client[]>;
}

export interface HierarchicalParentGroup {
  type: 'parent';
  name: string;
  subCategories: Record<string, HierarchicalSubCategory>;
}

export interface HierarchicalSingleGroup {
  type: 'single';
  leads: Client[];
}

export type HierarchicalGroup = HierarchicalParentGroup | HierarchicalSingleGroup;
