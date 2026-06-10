import { api } from "./api";

export interface Announcement {
  id: string;
  imageUrl: string;
  title?: string;
  link?: string;
  isActive?: boolean;
  order?: number;
  createdAt: string;
}

export const announcementsApi = {
  getAnnouncements: async (): Promise<Announcement[]> => {
    try {
      const res = await api.get<{ banners: any[] }>("/banners");
      if (res.banners) {
        return res.banners.map((b: any) => ({
          id: b._id,
          imageUrl: b.imageUrl,
          title: b.title,
          link: b.link,
          isActive: b.isActive,
          order: b.order,
          createdAt: b.createdAt
        }));
      }
      return [];
    } catch (e) {
      console.error("Failed to fetch banners from backend:", e);
      return [];
    }
  },

  createAnnouncement: async (data: {
    imageUrl?: string;
    title?: string;
    link?: string;
    order?: number;
    isActive?: boolean;
    imageFile?: File | null;
  }): Promise<Announcement> => {
    if (data.imageFile) {
      const formData = new FormData();
      formData.append("image", data.imageFile);
      if (data.title) formData.append("title", data.title);
      if (data.link) formData.append("link", data.link);
      if (data.order !== undefined) formData.append("order", String(data.order));
      if (data.isActive !== undefined) formData.append("isActive", String(data.isActive));

      const res = await api.post<{ banner: any }>("/banners", formData);
      return {
        id: res.banner._id,
        imageUrl: res.banner.imageUrl,
        title: res.banner.title,
        link: res.banner.link,
        isActive: res.banner.isActive,
        order: res.banner.order,
        createdAt: res.banner.createdAt
      };
    } else {
      const res = await api.post<{ banner: any }>("/banners", {
        imageUrl: data.imageUrl,
        title: data.title,
        link: data.link,
        order: data.order,
        isActive: data.isActive
      });
      return {
        id: res.banner._id,
        imageUrl: res.banner.imageUrl,
        title: res.banner.title,
        link: res.banner.link,
        isActive: res.banner.isActive,
        order: res.banner.order,
        createdAt: res.banner.createdAt
      };
    }
  },

  updateAnnouncement: async (
    id: string,
    data: {
      imageUrl?: string;
      title?: string;
      link?: string;
      order?: number;
      isActive?: boolean;
      imageFile?: File | null;
    }
  ): Promise<Announcement> => {
    if (data.imageFile) {
      const formData = new FormData();
      formData.append("image", data.imageFile);
      if (data.title !== undefined) formData.append("title", data.title);
      if (data.link !== undefined) formData.append("link", data.link);
      if (data.order !== undefined) formData.append("order", String(data.order));
      if (data.isActive !== undefined) formData.append("isActive", String(data.isActive));

      const res = await api.put<{ banner: any }>(`/banners/${id}`, formData);
      return {
        id: res.banner._id,
        imageUrl: res.banner.imageUrl,
        title: res.banner.title,
        link: res.banner.link,
        isActive: res.banner.isActive,
        order: res.banner.order,
        createdAt: res.banner.createdAt
      };
    } else {
      const res = await api.put<{ banner: any }>(`/banners/${id}`, {
        imageUrl: data.imageUrl,
        title: data.title,
        link: data.link,
        order: data.order,
        isActive: data.isActive
      });
      return {
        id: res.banner._id,
        imageUrl: res.banner.imageUrl,
        title: res.banner.title,
        link: res.banner.link,
        isActive: res.banner.isActive,
        order: res.banner.order,
        createdAt: res.banner.createdAt
      };
    }
  },

  deleteAnnouncement: async (id: string): Promise<boolean> => {
    await api.delete(`/banners/${id}`);
    return true;
  }
};
