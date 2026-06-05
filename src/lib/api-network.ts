import { api } from "./api";

export const networkApi = {
  getUplines: () => api.get("/network/uplines"),
  getDownline: () => api.get("/network/downline"),
  unlockLevel: (data: { level: number }) => api.post("/network/unlock-level", data),
};
