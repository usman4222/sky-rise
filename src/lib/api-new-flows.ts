import { api } from "./api";

export const newFlowsApi = {
  // 1. User Payment Methods
  addPaymentMethod: (data: {
    methodType: string;
    accountTitle: string;
    accountNumber: string;
    walletAddress?: string;
    bankName?: string;
    iban?: string;
    phoneNumber?: string;
    network?: string;
    isDefault?: boolean;
  }) => api.post("/payment-methods", data),

  getMyPaymentMethods: () => api.get<{ paymentMethods: any[] }>("/payment-methods/my"),

  updatePaymentMethod: (id: string, data: any) => api.put(`/payment-methods/${id}`, data),

  deletePaymentMethod: (id: string) => api.delete(`/payment-methods/${id}`),

  setDefaultPaymentMethod: (id: string) => api.patch(`/payment-methods/${id}/default`),

  // 2. Weekly Salary Requests
  getSalaryEligibility: () => api.get<{ eligibility: any }>("/weekly-salary/eligibility"),

  requestWeeklySalary: (data?: { notes?: string }) => api.post("/weekly-salary/request", data),

  getMySalaryRequests: (page?: number, limit?: number) =>
    api.get<{ requests: any[]; pagination?: any }>(`/weekly-salary/my-requests?page=${page || 1}&limit=${limit || 10}`),

  // 3. User Withdrawals
  requestWithdrawal: (data: {
    amount: number;
    walletType: string;
    paymentMethodId: string;
  }) => api.post("/withdrawals/request", data),

  getMyWithdrawals: (page?: number, limit?: number) =>
    api.get<{ withdrawals: any[]; pagination?: any }>(`/withdrawals/my?page=${page || 1}&limit=${limit || 10}`),

  getWithdrawalDetails: (id: string) => api.get<{ withdrawal: any }>(`/withdrawals/${id}`),

  cancelWithdrawal: (id: string) => api.patch(`/withdrawals/${id}/cancel`),

  // 4. Admin Actions
  getAdminSalaryRequests: (status?: string, page?: number, limit?: number) =>
    api.get<{ requests: any[]; pagination?: any }>(`/admin/weekly-salary/requests?page=${page || 1}&limit=${limit || 10}${status ? `&status=${status}` : ""}`),

  getAdminSalaryRequestDetails: (id: string) =>
    api.get<{ request: any }>(`/admin/weekly-salary/requests/${id}`),

  approveSalaryRequest: (id: string) =>
    api.patch(`/admin/weekly-salary/requests/${id}/approve`),

  rejectSalaryRequest: (id: string, reason: string) =>
    api.patch(`/admin/weekly-salary/requests/${id}/reject`, { rejectionReason: reason }),

  getAdminWithdrawals: (status?: string, page?: number, limit?: number) =>
    api.get<{ withdrawals: any[]; pagination?: any }>(`/admin/withdrawals?page=${page || 1}&limit=${limit || 10}${status ? `&status=${status}` : ""}`),

  getAdminWithdrawalDetails: (id: string) =>
    api.get<{ withdrawal: any }>(`/admin/withdrawals/${id}`),

  approveWithdrawal: (id: string, data?: { adminNote?: string }) =>
    api.patch(`/admin/withdrawals/${id}/approve`, data),

  rejectWithdrawal: (id: string, data: { rejectionReason: string; adminNote?: string }) =>
    api.patch(`/admin/withdrawals/${id}/reject`, data),

  markPaidWithdrawal: (id: string, data: { transactionId: string; adminNote?: string }) =>
    api.patch(`/admin/withdrawals/${id}/mark-paid`, data)
};
