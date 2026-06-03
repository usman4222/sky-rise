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
}

export const investmentsApi = {
  getMyInvestments: () => api.get("/investments/my-investments"),
  withdrawCapital: (data: { investmentId: string }) => api.post("/investments/withdraw-capital", data),
  getRoiHistory: () => api.get<RoiHistoryResponse>("/investments/roi-history"),
};
