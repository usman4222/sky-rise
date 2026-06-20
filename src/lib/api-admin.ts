import { api } from "./api";

export const adminApi = {
  getAdminDashboard: () => api.get("/admin/dashboard"),
  
  getDeposits: (status?: string, page?: number, limit?: number) => 
    api.get(`/admin/deposits?page=${page || 1}&limit=${limit || 10}${status ? `&status=${status}` : ''}`),
  getWithdrawals: (status?: string, page?: number, limit?: number) => 
    api.get(`/admin/withdrawals?page=${page || 1}&limit=${limit || 10}${status ? `&status=${status}` : ''}`),
  getKyc: (status?: string, page?: number, limit?: number) => 
    api.get(`/admin/kyc?page=${page || 1}&limit=${limit || 10}${status ? `&status=${status}` : ''}`),
  getUsers: (search?: string, page?: number, limit?: number) => 
    api.get(`/admin/users?page=${page || 1}&limit=${limit || 10}${search ? `&search=${encodeURIComponent(search)}` : ''}`),
  getUserDetail: (id: string) => 
    api.get(`/admin/users/${id}`),
  suspendUser: (id: string) => 
    api.post(`/admin/users/${id}/suspend`),
  activateUser: (id: string) => 
    api.post(`/admin/users/${id}/activate`),
  
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

  // Balance adjustments
  adjustUserBalance: (id: string, data: { balanceType: 'deposit' | 'adminAllocated'; action: 'add' | 'deduct'; amount: number; remarks?: string }) =>
    api.post(`/admin/users/${id}/balance/adjust`, data),
  
  getBalanceHistory: (search?: string, page?: number, limit?: number) =>
    api.get(`/admin/balance/history?page=${page || 1}&limit=${limit || 10}${search ? `&search=${encodeURIComponent(search)}` : ''}`),

  // Favor Account Condition System
  getUserFavorDetails: (id: string) =>
    api.get(`/admin/users/${id}/favor`),
  updateUserFavorSettings: (id: string, data: {
    favorConditionEnabled?: boolean;
    favorWithdrawalStatus?: 'active' | 'blocked';
    favorCycleStartDate?: string;
    favorCycleEndDate?: string;
    favorRequiredBusiness?: number;
    resetCycle?: boolean;
    extendDeadlineDays?: number;
  }) =>
    api.patch(`/admin/users/${id}/favor`, data),
};

