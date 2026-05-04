export interface CreateLeadDto {
  fullName: string;
  phoneNumber: string;
  email?: string;
  brokerId: string;
  campaignId?: number;
  leadStatusId: number;
  propertyType: string;
  purpose: string;
  totalAmount: number;
  paymentMethod: string;
  preferredLocation: string;
  notes: string;
}

export interface LeadResponseDto {
  id: number;
  fullName: string;
  phoneNumber: string;
  brokerName: string;
  statusId: number;
  statusName: string;
  campaignName: string;
  createdAt: Date;
  updatedAt: Date;
  generalFeedback: string;
}

export interface AdminDashboardDto {
  totalLeads: number;
  totalClosedDeals: number;
  totalExpectedRevenue: number;
  brokerPerformances: any[];
}

export interface BrokerDashboardDto {
  totalMyLeads: number;
  myClosedDeals: number;
  myExpectedRevenue: number;
  myPendingTasksToday: number;
  pendingTasksList: BrokerTaskDto[];
  pendingVisitsList: VisitResponseDto[];
}

export interface BrokerTaskDto {
  id: number;
  leadId: number;
  leadName: string;
  activityType: string;
  summary: string;
  dueDate: Date;
  isDone: boolean;
  status: string;
}

export interface WebsiteInquiryDto {
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  propertyId: number;
  message?: string;
}

export interface VisitResponseDto {
  id: number;
  leadId: number;
  leadName: string;
  leadPhone: string;
  propertyId?: number;
  visitDate: Date;
  location: string;
  feedback: string;
  status: string;
  isCompleted: boolean;
  notes: string;
}

export interface BrokerProfileDataDto {
  leads: LeadResponseDto[];
  visits: VisitResponseDto[];
  activities: BrokerTaskDto[];
  zones: LeadResponseDto[];
}

export interface CampaignDto {
  id: number;
  name: string;
  source: string; // Facebook, Google, Website, etc.
}