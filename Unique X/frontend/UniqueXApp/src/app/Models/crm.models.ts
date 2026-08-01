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
  isDuplicate: boolean;
  isApprovedDuplicate: boolean;
  closedDealsCount: number;
}

export interface AdminDashboardDto {
  totalLeads: number;
  totalClosedDeals: number;
  totalExpectedRevenue: number;
  totalVisits: number;
  totalActivities: number;
  totalRequests: number;
  totalCalendarEvents: number;
  totalClosingLeads: number;
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

// "Visit Now" في كارت الوحدة - العميل بيحدد ميعاد بنفسه
export interface RequestVisitDto {
  propertyId: number;
  clientName: string;
  clientPhone: string; // 👈 رقم الحساب المسجل بيه اليوزر - ده اللي بيتحدد بيه هل العميل موجود كـ Lead قبل كده ولا لأ
  contactPhone?: string; // 👈 الرقم اللي كتبه في المودال - رقم تواصل بس لزيارة دي تحديدًا، مالوش علاقة بتحديد هوية العميل
  clientEmail?: string;
  visitDate: Date | string;
  visitType: string; // 'Broker' أو 'Client'
  notes?: string;
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
  isClientInitiated?: boolean;
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