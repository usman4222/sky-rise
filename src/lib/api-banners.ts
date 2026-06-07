import { api } from "./api";

export interface Banner {
  _id: string;
  imageUrl: string;
  publicId: string;
  title?: string;
  link?: string;
  isActive: boolean;
  order: number;
  createdAt: string;
}

export const bannersApi = {
  getBanners: () => 
    api.get<{ success: boolean; message: string; banners: Banner[] }>("/banners"),
  
  createBanner: (formData: FormData) => 
    api.post<{ success: boolean; message: string; banner: Banner }>("/banners", formData),
    
  updateBanner: (id: string, formData: FormData | Partial<Banner>) => 
    api.put<{ success: boolean; message: string; banner: Banner }>(`/banners/${id}`, formData),
    
  deleteBanner: (id: string) => 
    api.delete<{ success: boolean; message: string }>(`/banners/${id}`),
};
