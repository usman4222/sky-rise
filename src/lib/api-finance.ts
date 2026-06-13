import { api } from "./api";

export const financeApi = {
  // Payment Methods
  getPaymentMethods: () => api.get("/finance/payment-methods"),
  
  // Deposits
  submitDeposit: (data: { amount: number; paymentMethodId: string; transactionHash: string }) => 
    api.post("/finance/deposit", data),
    
  createPkrDeposit: (data: { amountPKR: number }) =>
    api.post<{ deposit: any }>("/payments/pkr/deposit/create", data),

  createUsdtDeposit: (data: { amountUSDT: number }) =>
    api.post<{ deposit: any }>("/payments/usdt/deposit/create", data),
    
  getUsdtDepositStatus: (depositId: string) =>
    api.get<{ deposit: any }>(`/payments/usdt/deposit/status/${depositId}`),
    
  // Withdrawals
  addWithdrawalAccount: (data: { 
    name: string; 
    channel: string; 
    accountTitle: string; 
    accountNumber: string; 
    bankDetails?: any; 
    walletAddress?: string; 
    raastId?: string; 
  }) => api.post("/finance/withdrawal-accounts", data),
  getWithdrawalAccounts: () => api.get("/finance/withdrawal-accounts"),
  withdrawPkr: (data: { amountUSDT: number; sourceWallet: string; withdrawalAccountId: string }) => 
    api.post("/payments/pkr/withdraw", data),
  withdrawUsdt: (data: { amountUSDT: number; sourceWallet: string; withdrawalAccountId: string }) => 
    api.post("/payments/usdt/withdraw", data),
    
  // Transfers & Ledger
  transferTeamBonus: (data: { recipientIdOrCode: string; amount: number }) => api.post("/finance/transfer-bonus", data),
  getWallets: () => api.get("/finance/wallets"),
  getLedgerHistory: (page?: number, limit?: number) =>
    api.get(`/finance/history?page=${page || 1}&limit=${limit || 10}`),
};
