import { api } from "./api";

export interface TicketReply {
  sender: string;
  message: string;
  createdAt: string;
}

export interface SupportTicketItem {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
  } | string;
  subject: string;
  message: string;
  priority: "low" | "medium" | "high";
  status: "open" | "answered" | "closed";
  replies: TicketReply[];
  createdAt: string;
  updatedAt: string;
}

export interface TicketResponse {
  success: boolean;
  message: string;
  ticket: SupportTicketItem;
}

export interface TicketsListResponse {
  success: boolean;
  message: string;
  tickets: SupportTicketItem[];
}

export const supportApi = {
  submitTicket: (data: { subject: string; message: string; priority?: string }) => 
    api.post<TicketResponse>("/support/tickets", data),
  getTickets: () => api.get<TicketsListResponse>("/support/tickets"),
  replyTicket: (ticketId: string, data: { message: string }) =>
    api.post<TicketResponse>(`/support/tickets/${ticketId}/reply`, data),
  updateTicketStatus: (ticketId: string, data: { status: string }) =>
    api.put<TicketResponse>(`/support/tickets/${ticketId}/status`, data),
};
