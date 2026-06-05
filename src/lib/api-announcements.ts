import { api } from "./api";

export interface Announcement {
  id: string;
  imageUrl: string;
  title?: string;
  link?: string;
  createdAt: string;
}

const LOCAL_STORAGE_KEY = "sky-rise-announcements";

// Highly professional default slides matching the Forest Green/Gold dashboard theme
const DEFAULT_ANNOUNCEMENTS: Announcement[] = [
  {
    id: "default-1",
    imageUrl: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=800&q=80",
    title: "Invest in Stock Markets & Earn Daily stable yields",
    link: "/dashboard/packages",
    createdAt: new Date().toISOString()
  },
  {
    id: "default-2",
    imageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80",
    title: "Referral Rewards: Invite downlines for 10% direct commission",
    link: "/dashboard/team",
    createdAt: new Date().toISOString()
  },
  {
    id: "default-3",
    imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
    title: "VIP Leaderboard Rankings: Claim weekly salaries and bonuses",
    link: "/dashboard/weekly-salary",
    createdAt: new Date().toISOString()
  }
];

export const announcementsApi = {
  getAnnouncements: async (): Promise<Announcement[]> => {
    try {
      const res = await api.get<{ announcements: Announcement[] }>("/announcements");
      return res.announcements && res.announcements.length > 0 
        ? res.announcements 
        : announcementsApi.getLocalAnnouncements();
    } catch (e) {
      return announcementsApi.getLocalAnnouncements();
    }
  },

  getLocalAnnouncements: (): Announcement[] => {
    if (typeof window === "undefined") return DEFAULT_ANNOUNCEMENTS;
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {}
    return DEFAULT_ANNOUNCEMENTS;
  },

  saveLocalAnnouncements: (announcements: Announcement[]) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(announcements));
    } catch (e) {}
  },

  createAnnouncement: async (data: { imageUrl: string; title?: string; link?: string }): Promise<Announcement> => {
    const newAnnouncement: Announcement = {
      id: "ann-" + Date.now(),
      imageUrl: data.imageUrl,
      title: data.title,
      link: data.link,
      createdAt: new Date().toISOString()
    };

    try {
      const res = await api.post<{ announcement: Announcement }>("/announcements", data);
      if (res.announcement) {
        return res.announcement;
      }
    } catch (e) {
      // Fallback
    }

    const current = announcementsApi.getLocalAnnouncements();
    const updated = [...current, newAnnouncement];
    announcementsApi.saveLocalAnnouncements(updated);
    return newAnnouncement;
  },

  deleteAnnouncement: async (id: string): Promise<boolean> => {
    try {
      await api.delete(`/announcements/${id}`);
    } catch (e) {
      // Fallback
    }

    const current = announcementsApi.getLocalAnnouncements();
    const updated = current.filter(a => a.id !== id);
    announcementsApi.saveLocalAnnouncements(updated);
    return true;
  }
};
