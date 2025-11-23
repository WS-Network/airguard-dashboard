/**
 * API Service - Frontend API Communication
 *
 * Uses Next.js API routes with cookie-based authentication
 * Tokens are stored in httpOnly cookies for security
 */

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  fullName: string;
  email: string;
  password: string;
  country: string;
  phoneNumber: string;
  nonGovernmentEndUser: boolean;
  companyName: string;
  industry: string;
  businessType: string;
  hearAboutUs: string;
  acceptTerms: boolean;
  newsPromotions: boolean;
}

export interface AuthResponse {
  message: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    organizationId?: string;
    organizationName?: string;
  };
}

export interface ApiError {
  error: string;
}

class ApiService {
  /**
   * Make an authenticated request to Next.js API routes
   * Credentials: 'include' ensures cookies are sent
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Important: Send cookies with request
      ...options,
    };

    try {
      const response = await fetch(endpoint, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error occurred');
    }
  }

  // Authentication methods
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async signup(userData: SignupRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getProfile(): Promise<any> {
    return this.request('/api/auth/profile', {
      method: 'GET',
    });
  }

  async refreshToken(): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/auth/refresh', {
      method: 'POST',
    });
  }

  async logout(): Promise<any> {
    return this.request('/api/auth/logout', {
      method: 'POST',
    });
  }

  // Dashboard methods (to be implemented)
  async getDashboardMetrics(): Promise<any> {
    return this.request('/api/dashboard/metrics', {
      method: 'GET',
    });
  }

  // Device methods (to be implemented)
  async getDevices(): Promise<any> {
    return this.request('/api/devices', {
      method: 'GET',
    });
  }

  async createDevice(deviceData: any): Promise<any> {
    return this.request('/api/devices', {
      method: 'POST',
      body: JSON.stringify(deviceData),
    });
  }

  // Simulation methods (to be implemented)
  async startSimulation(intervalMs: number = 30000): Promise<any> {
    return this.request('/api/simulation/start', {
      method: 'POST',
      body: JSON.stringify({ intervalMs }),
    });
  }

  async stopSimulation(): Promise<any> {
    return this.request('/api/simulation/stop', {
      method: 'POST',
    });
  }

  // Device Pairing methods
  async startPairing(deviceId?: string): Promise<{ sessionId: string; status: string }> {
    return this.request('/api/devices/pair/start', {
      method: 'POST',
      body: JSON.stringify({ deviceId: deviceId || null }),
    });
  }

  async getPairingStatus(sessionId: string): Promise<any> {
    return this.request(`/api/devices/pair/status/${sessionId}`, {
      method: 'GET',
    });
  }

  async syncGps(deviceId: string, gpsData: any): Promise<any> {
    return this.request(`/api/devices/${deviceId}/gps-sync`, {
      method: 'POST',
      body: JSON.stringify(gpsData),
    });
  }

  async testDongle(): Promise<any> {
    return this.request('/api/devices/test-dongle', {
      method: 'POST',
    });
  }
}

// Create and export a singleton instance
export const apiService = new ApiService();

// Settings API methods (to be implemented)
export const settingsApi = {
  getUserSettings: async () => {
    const response = await fetch('/api/settings', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get user settings');
    }

    return response.json();
  },

  updateUserSettings: async (settings: any) => {
    const response = await fetch('/api/settings', {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update user settings');
    }

    return response.json();
  },

  testApiKey: async (keyType: 'openai' | 'anthropic') => {
    const response = await fetch(`/api/settings/test-key/${keyType}`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to test API key');
    }

    return response.json();
  },

  deleteApiKey: async (keyType: 'openai' | 'anthropic') => {
    const response = await fetch(`/api/settings/delete-key/${keyType}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete API key');
    }

    return response.json();
  },
};

/**
 * Authentication utilities
 * Note: Tokens are now stored in httpOnly cookies
 * No localStorage access needed
 */
export const auth = {
  /**
   * Check if user is authenticated by calling the profile endpoint
   * If successful, user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      await apiService.getProfile();
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Logout and clear authentication
   */
  async logout(): Promise<void> {
    try {
      await apiService.logout();
    } catch (error) {
      // Even if logout fails, cookies will be cleared client-side
      console.error('Logout error:', error);
    }
  },
}; 