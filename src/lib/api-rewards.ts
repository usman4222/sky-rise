import { api } from "./api";

export interface LegInfo {
  leg: number;
  legUser: {
    id: string;
    name: string;
    email: string;
  };
  volume: number;
}

export interface VipRankConfig {
  rank: string;
  level: number;
  leg: number;
  weekly: number;
  monthly: number;
}

export interface SalaryHistoryItem {
  week: string;
  rank: string;
  amount: number;
  status: string;
  date: string;
}

export interface NextRankTarget {
  name: string;
  level: number;
  requiredBusinessPerLeg: number;
  requiredActiveLegs: number;
  weeklySalary: number;
}

export interface VipStatusResponse {
  success: boolean;
  message: string;
  currentVipRank: number;
  weeklySalary: number;
  activeLegsCount: number;
  legs: LegInfo[];
  vipRanks: VipRankConfig[];
  salaryHistory: SalaryHistoryItem[];
  nextRankTarget: NextRankTarget | null;
}

export interface AchievementItem {
  name: string;
  stage: number;
  business: number;
  reward: number;
  status: "achieved" | "progress" | "locked";
}

export interface AchievementResponse {
  success: boolean;
  message: string;
  currentBusiness: number;
  currentRank: string;
  currentRankStage: number;
  achievements: AchievementItem[];
  nextTarget: AchievementItem | null;
}

export const rewardsApi = {
  getVipStatus: () => api.get<VipStatusResponse>("/rewards/vip-status"),
  getAchievements: () => api.get<AchievementResponse>("/rewards/achievements"),
};
