import { api } from "./api";

export interface PackageData {
  _id: string;
  name: string;
  minAmount: number;
  maxAmount?: number;
  startRoi: number;
  maxRoi: number;
  durationMonths: number;
  earlyWithdrawalPenaltyMonths: number;
  earlyWithdrawalPenaltyPercent: number;
  isActive: boolean;
  isHidden: boolean;
}

export const packagesApi = {
  // === USER ENDPOINTS ===
  getPublicPackages: () => 
    api.get<{ packages: PackageData[] }>("/investments/packages"),
    
  purchasePackage: (packageId: string, amount: number, useSignupBonus: boolean = true, roiClaimMode: 'auto' | 'manual' = 'auto') => 
    api.post("/investments/purchase", { packageId, amount, useSignupBonus, roiClaimMode }),

  // === ADMIN ENDPOINTS ===
  getAdminPackages: () => 
    api.get<{ packages: PackageData[] }>("/admin/packages"),

  createPackage: (data: Partial<PackageData>) => 
    api.post("/admin/packages", data),

  updatePackage: (id: string, data: Partial<PackageData>) => 
    api.put(`/admin/packages/${id}`, data),
};
