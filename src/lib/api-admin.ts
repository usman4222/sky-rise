import { api } from "./api";

export const adminApi = {
  getAdminDashboard: () => api.get("/admin/dashboard"),
  
  getDeposits: (status?: string) => api.get(`/admin/deposits${status ? `?status=${status}` : ''}`),
  getWithdrawals: (status?: string) => api.get(`/admin/withdrawals${status ? `?status=${status}` : ''}`),
  getKyc: (status?: string) => api.get(`/admin/kyc${status ? `?status=${status}` : ''}`),
  
  // Action handles both approve and reject
  processDeposit: (id: string, data: { action: "approve" | "reject"; adminNotes?: string }) => 
    api.post(`/admin/deposits/${id}/action`, data),
    
  processWithdrawal: (id: string, data: { action: "approve" | "reject"; adminNotes?: string; txHash?: string }) => 
    api.post(`/admin/withdrawals/${id}/action`, data),
    
  processKyc: (id: string, data: { action: "approve" | "reject"; adminNotes?: string }) => 
    api.post(`/admin/kyc/${id}/action`, data),
    
  // Payment Methods
  getPaymentMethods: () => api.get("/admin/payment-methods"),
  createPaymentMethod: (data: any) => api.post("/admin/payment-methods", data),
  updatePaymentMethod: (id: string, data: any) => api.put(`/admin/payment-methods/${id}`, data),
  
  // System Settings
  updateExchangeRate: (data: { currency: string; rate: number }) => api.post("/admin/exchange-rate", data),
};
