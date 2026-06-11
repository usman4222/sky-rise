export const packages = [
  { id: "A", name: "Starter Share Investment", range: "$10 - $100", min: 10, max: 100, startRoi: 0.7, maxRoi: 1.5, tag: "Starter" },
  { id: "B", name: "Growth Share Investment", range: "$101 - $500", min: 101, max: 500, startRoi: 0.8, maxRoi: 1.8, tag: "Popular" },
  { id: "C", name: "Premium Share Investment", range: "$501 - $1,500", min: 501, max: 1500, startRoi: 0.9, maxRoi: 2.0, tag: "Premium" },
  { id: "D", name: "Elite Share Investment", range: "$1,501+", min: 1501, max: 100000, startRoi: 1.0, maxRoi: 2.5, tag: "Elite" },
];

export const incomeModules = [
  { title: "Free Registration Bonus", desc: "New users receive a $5 signup bonus for first investment usage." },
  { title: "Free Registration Team Bonus", desc: "Earn $1 from every new member up to 5 levels during the first 10 days." },
  { title: "Daily ROI Income", desc: "Earn package-based daily ROI with growth over time." },
  { title: "Direct Referral Income", desc: "Earn 8% from direct referral investments based on real deposited amount." },
  { title: "Level Income", desc: "Unlock up to 10 levels and earn from team ROI distribution." },
  { title: "Weekly Salary Program", desc: "Achieve VIP ranks and receive weekly salary rewards." },
  { title: "Achievement & Rank Rewards", desc: "Unlock rank rewards based on 5-level team business volume." },
  { title: "Global Free Team", desc: "Reserved module for future global team opportunities." },
];

export const vipRanks = [
  { rank: "VIP 1", leg: 1000, weekly: 50, monthly: 200 },
  { rank: "VIP 2", leg: 2000, weekly: 100, monthly: 400 },
  { rank: "VIP 3", leg: 4000, weekly: 200, monthly: 800 },
  { rank: "VIP 4", leg: 8000, weekly: 400, monthly: 1600 },
  { rank: "VIP 5", leg: 16000, weekly: 800, monthly: 3200 },
];

export const achievements = [
  { name: "Bronze Spark", business: 2500, reward: 75 },
  { name: "Silver Spark", business: 5000, reward: 150 },
  { name: "Golden Spark", business: 10000, reward: 300 },
  { name: "Platinum Spark", business: 20000, reward: 600 },
  { name: "Crystal Spark", business: 40000, reward: 1200 },
  { name: "Titanium Spark", business: 80000, reward: 2400 },
  { name: "Quantum Spark", business: 160000, reward: 4800 },
  { name: "Infinity Spark", business: 320000, reward: 9600 },
  { name: "Galactic Spark", business: 640000, reward: 19200 },
  { name: "Supreme Spark", business: 1280000, reward: 38400 },
];

export const faqs = [
  { q: "What is SkyRise Future?", a: "SkyRise Future is a global investment-style platform where you can register, choose investment packages starting from $10, track daily ROI, and build a referral team — all from one smart dashboard." },
  { q: "What is the minimum investment amount?", a: "You can start investing with as little as $10 using the Starter Share Investment package." },
  { q: "How does daily ROI work?", a: "Each package distributes a daily ROI percentage based on your active investment. ROI grows over time according to package rules." },
  { q: "What is auto reinvest?", a: "Auto reinvest automatically routes your daily ROI back into your active investment, compounding your position." },
  { q: "What happens if I do not claim daily ROI within 6 hours?", a: "Manual ROI must be claimed within 6 hours or it may expire as per platform rules." },
  { q: "How does direct referral income work?", a: "You earn 8% from direct referral investments based on the real deposited amount." },
  { q: "How do I unlock level income?", a: "Higher levels are unlocked by sponsoring active direct members and paying a small activation fee." },
  { q: "What are VIP salary rewards?", a: "VIP salary rewards are weekly payouts based on your VIP rank and 5-leg team business." },
  { q: "Can I withdraw my capital?", a: "Yes, but early capital withdrawal may deduct 15% and reset prior ROI profits depending on holding period." },
  { q: "Are bonuses withdrawable?", a: "Registration and team bonuses are not withdrawable but can be used for investments or level activation per platform rules." },
];

export const levels = [
  { level: 1, income: 8, unlocked: true, requirement: "Automatically open" },
  { level: 2, income: 4, unlocked: false, requirement: "1 direct active member + $5 activation fee" },
  { level: 3, income: 4, unlocked: false, requirement: "1 additional direct active member + $5 activation fee" },
  { level: 4, income: 3, unlocked: false, requirement: "2 direct active members + $5 fee" },
  { level: 5, income: 2, unlocked: false, requirement: "3 direct active members + $5 fee" },
  { level: 6, income: 2, unlocked: false, requirement: "3 direct active members + $5 fee" },
  { level: 7, income: 2, unlocked: false, requirement: "4 direct active members + $5 fee" },
  { level: 8, income: 2, unlocked: false, requirement: "4 direct active members + $5 fee" },
  { level: 9, income: 2, unlocked: false, requirement: "5 direct active members + $5 fee" },
  { level: 10, income: 2, unlocked: false, requirement: "5 direct active members + $5 fee" },
];

export const user = {
  name: "Alex Morgan",
  userId: "SKY-48721",
  sponsorId: "SKY-10001",
  email: "alex@example.com",
  phone: "+1 555 0123",
  walletBalance: 245.8,
  currentRank: "VIP 2",
  achievementRank: "Golden Spark",
  referralLink: "https://skyrisefuture.com/r/SKY-48721",
};

export const stats = {
  totalInvestment: 1250,
  todayRoi: 18.5,
  withdrawalBalance: 245.8,
  directReferralIncome: 96,
  teamBonus: 120,
  vipRank: "VIP 2",
};

export const roiHistory = Array.from({ length: 14 }).map((_, i) => ({
  day: `Day ${i + 1}`,
  amount: +(12 + Math.sin(i / 2) * 4 + i * 0.4).toFixed(2),
}));

export const directReferrals = [
  { id: "SKY-49810", name: "Maria Lopez", join: "2025-03-12", status: "Active", invested: 500, income: 40 },
  { id: "SKY-49911", name: "John Patel", join: "2025-03-18", status: "Active", invested: 250, income: 20 },
  { id: "SKY-50022", name: "Sara Chen", join: "2025-04-02", status: "Inactive", invested: 0, income: 0 },
  { id: "SKY-50190", name: "Liam Brown", join: "2025-04-15", status: "Active", invested: 1200, income: 96 },
];

export const transactions = [
  { date: "2025-05-22", type: "ROI", amount: 18.5, wallet: "Withdrawal", status: "Completed", notes: "Daily ROI" },
  { date: "2025-05-22", type: "Referral", amount: 12.0, wallet: "Withdrawal", status: "Completed", notes: "Direct referral" },
  { date: "2025-05-21", type: "Investment", amount: -250, wallet: "Main", status: "Active", notes: "Package B" },
  { date: "2025-05-20", type: "VIP Salary", amount: 100, wallet: "Withdrawal", status: "Completed", notes: "Weekly" },
  { date: "2025-05-19", type: "Bonus", amount: 5, wallet: "Registration", status: "Issued", notes: "Signup bonus" },
  { date: "2025-05-18", type: "Withdrawal", amount: -120, wallet: "Withdrawal", status: "Pending", notes: "USDT" },
];

export const vipLegs = [
  { leg: 1, current: 4200, target: 4000 },
  { leg: 2, current: 3600, target: 4000 },
  { leg: 3, current: 2900, target: 4000 },
  { leg: 4, current: 4100, target: 4000 },
  { leg: 5, current: 2400, target: 4000 },
];
