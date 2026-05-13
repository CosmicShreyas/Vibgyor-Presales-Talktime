export interface BrandPartner {
  _id: string;
  name: string;
  email: string;
  businessName: string;
  primaryPhone: string;
  isActive: boolean;
}

export interface LeadStatistics {
  totalLeads: number;
  yetToContact: number;
  followUp: number;
  qualified: number;
  disqualified: number;
  lost: number;
  won: number;
}
