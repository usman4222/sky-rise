import { api } from "./api";

export interface RoiHistoryItem {
  _id: string;
  user: string;
  userInvestment: {
    _id: string;
    amount: number;
    currentRoi: number;
    package: {
      _id: string;
      name: string;
      autoReinvest: boolean;
    };
  };
  amount: number;
  roiPercent: number;
  isCompounded: boolean;
  status: string;
  createdAt: string;
}

export interface RoiHistoryResponse {
  success: boolean;
  message: string;
  roiHistory: RoiHistoryItem[];
  pagination?: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  };
}

export const investmentsApi = {
  getMyInvestments: (page?: number, limit?: number) =>
    api.get(`/investments/my-investments?page=${page || 1}&limit=${limit || 10}`),
  withdrawCapital: (data: { investmentId: string }) => api.post("/investments/withdraw-capital", data),
  getRoiHistory: (page?: number, limit?: number) =>
    api.get<RoiHistoryResponse>(`/investments/roi-history?page=${page || 1}&limit=${limit || 10}`),
  toggleAutoReinvest: (id: string) => api.post(`/investments/${id}/toggle-reinvest`),
  claimRoi: (id: string) => api.post(`/investments/${id}/claim-roi`),
};
