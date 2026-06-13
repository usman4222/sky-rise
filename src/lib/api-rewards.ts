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

export interface LeadershipRewardItem {
  _id: string;
  createdAt: string;
  downlineUser: {
    id: string;
    name: string;
    email: string;
  } | null;
  rewardName: string;
  amount: number;
  targetTier: number;
  status: "paid" | "missed" | "recovered";
  recoveredAt?: string;
}

export interface LeadershipStatusResponse {
  success: boolean;
  message: string;
  qualifiedTier: number;
  autoReinvestOn: boolean;
  totalSelfInvestment: number;
  activeDirectsCount: number;
  vipRank: number;
  achievementRank: number;
  history: LeadershipRewardItem[];
  pendingRecoveryTotal: number;
}

export const rewardsApi = {
  getVipStatus: () => api.get<VipStatusResponse>("/rewards/vip-status"),
  getAchievements: () => api.get<AchievementResponse>("/rewards/achievements"),
  getLeadershipStatus: () => api.get<LeadershipStatusResponse>("/rewards/leadership-status"),
  recoverLeadershipRewards: () => api.post<{ success: boolean; message: string; recoveredAmount: number }>("/rewards/recover-leadership-rewards", {}),
};
