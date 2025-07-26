// frontend/src/lib/api.ts
import type { Post } from "@personal-website/shared/types/post.types";

// Detectar el entorno y configurar la URL base
const getApiBaseUrl = (): string => {
  // En desarrollo con emulators
  if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_EMULATOR === 'true') {
    return 'http://127.0.0.1:5001/portfolio-website-668ce/us-central1/api';
  }
  
  // En producción o cuando se usa hosting emulator
  return '/api';
};

class ApiClient {
  private baseURL: string;

  constructor() {
    this.baseURL = getApiBaseUrl();
    console.log('🔗 API Base URL:', this.baseURL);
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    console.log('🚀 API Request:', url, { method: config.method || 'GET' });

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('✅ API Response:', data);
      return data;
    } catch (error) {
      console.error('💥 API request failed:', error);
      
      // Mejorar el mensaje de error
      if (error instanceof TypeError && error.message.includes('fetch failed')) {
        throw new Error('No se pudo conectar al servidor. Asegúrate de que Firebase Emulators esté ejecutándose.');
      }
      
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    return this.request<{ status: string; timestamp: string }>('/health');
  }

  // Posts endpoints
  async getPosts(filters?: { published?: boolean; tag?: string; authorId?: string }) {
    const params = new URLSearchParams();
    
    if (filters?.published !== undefined) {
      params.append('published', filters.published.toString());
    }
    if (filters?.tag) {
      params.append('tag', filters.tag);
    }
    if (filters?.authorId) {
      params.append('authorId', filters.authorId);
    }
    
    const query = params.toString() ? `?${params}` : '';
    return this.request<{ posts: Post[]; total: number }>(`/posts${query}`);
  }

  async getPost(id: string) {
    if (!id) {
      throw new Error('ID de post es requerido');
    }
    return this.request<{ post: Post }>(`/posts/${id}`);
  }

  async createPost(postData: Omit<Post, 'id' | 'createdAt' | 'updatedAt'>) {
    return this.request<{ post: Post }>('/posts', {
      method: 'POST',
      body: JSON.stringify(postData),
    });
  }

  async updatePost(id: string, postData: Partial<Post>) {
    return this.request<{ post: Post }>(`/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(postData),
    });
  }

  async deletePost(id: string) {
    return this.request<void>(`/posts/${id}`, {
      method: 'DELETE',
    });
  }
}

// Singleton instance
export const apiClient = new ApiClient();

// Export para testing
export { getApiBaseUrl };