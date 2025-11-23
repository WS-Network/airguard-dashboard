import { prisma } from '@/config/database';
import { EncryptionService } from '@/utils/encryption';
import type { UserSettings, CreateUserSettingsData, UpdateUserSettingsData } from '@/types';

export class SettingsService {
  async getUserSettings(userId: string): Promise<UserSettings | null> {
    try {
      const settings = await prisma.userSettings.findUnique({
        where: { userId }
      });

      if (!settings) {
        return null;
      }

      // Mask API keys for security
      return {
        ...settings,
        openaiApiKey: settings.openaiApiKey ? EncryptionService.maskApiKey(settings.openaiApiKey) : null,
        anthropicApiKey: settings.anthropicApiKey ? EncryptionService.maskApiKey(settings.anthropicApiKey) : null
      };
    } catch (error) {
      throw new Error('Failed to get user settings');
    }
  }

  async createUserSettings(userId: string, data: CreateUserSettingsData): Promise<UserSettings> {
    try {
      const settings = await prisma.userSettings.create({
        data: {
          userId,
          openaiApiKey: data.openaiApiKey ? EncryptionService.encrypt(data.openaiApiKey) : null,
          anthropicApiKey: data.anthropicApiKey ? EncryptionService.encrypt(data.anthropicApiKey) : null,
          theme: data.theme || 'dark',
          language: data.language || 'en',
          notifications: data.notifications ?? true,
          emailNotifications: data.emailNotifications ?? true,
          pushNotifications: data.pushNotifications ?? true,
          timezone: data.timezone || 'UTC',
          dateFormat: data.dateFormat || 'MM/DD/YYYY',
          timeFormat: data.timeFormat || '12h'
        }
      });

      // Return masked version
      return {
        ...settings,
        openaiApiKey: settings.openaiApiKey ? EncryptionService.maskApiKey(settings.openaiApiKey) : null,
        anthropicApiKey: settings.anthropicApiKey ? EncryptionService.maskApiKey(settings.anthropicApiKey) : null
      };
    } catch (error) {
      throw new Error('Failed to create user settings');
    }
  }

  async updateUserSettings(userId: string, data: UpdateUserSettingsData): Promise<UserSettings> {
    try {
      const updateData: any = {};

      // Only update provided fields
      if (data.theme !== undefined) updateData.theme = data.theme;
      if (data.language !== undefined) updateData.language = data.language;
      if (data.notifications !== undefined) updateData.notifications = data.notifications;
      if (data.emailNotifications !== undefined) updateData.emailNotifications = data.emailNotifications;
      if (data.pushNotifications !== undefined) updateData.pushNotifications = data.pushNotifications;
      if (data.timezone !== undefined) updateData.timezone = data.timezone;
      if (data.dateFormat !== undefined) updateData.dateFormat = data.dateFormat;
      if (data.timeFormat !== undefined) updateData.timeFormat = data.timeFormat;

      // Handle API keys separately for encryption
      if (data.openaiApiKey !== undefined) {
        updateData.openaiApiKey = data.openaiApiKey ? EncryptionService.encrypt(data.openaiApiKey) : null;
      }
      if (data.anthropicApiKey !== undefined) {
        updateData.anthropicApiKey = data.anthropicApiKey ? EncryptionService.encrypt(data.anthropicApiKey) : null;
      }

      const settings = await prisma.userSettings.upsert({
        where: { userId },
        update: updateData,
        create: {
          userId,
          openaiApiKey: data.openaiApiKey ? EncryptionService.encrypt(data.openaiApiKey) : null,
          anthropicApiKey: data.anthropicApiKey ? EncryptionService.encrypt(data.anthropicApiKey) : null,
          theme: data.theme || 'dark',
          language: data.language || 'en',
          notifications: data.notifications ?? true,
          emailNotifications: data.emailNotifications ?? true,
          pushNotifications: data.pushNotifications ?? true,
          timezone: data.timezone || 'UTC',
          dateFormat: data.dateFormat || 'MM/DD/YYYY',
          timeFormat: data.timeFormat || '12h'
        }
      });

      // Return masked version
      return {
        ...settings,
        openaiApiKey: settings.openaiApiKey ? EncryptionService.maskApiKey(settings.openaiApiKey) : null,
        anthropicApiKey: settings.anthropicApiKey ? EncryptionService.maskApiKey(settings.anthropicApiKey) : null
      };
    } catch (error) {
      throw new Error('Failed to update user settings');
    }
  }

  async deleteApiKey(userId: string, keyType: 'openai' | 'anthropic'): Promise<UserSettings> {
    try {
      const updateData = keyType === 'openai' 
        ? { openaiApiKey: null }
        : { anthropicApiKey: null };

      const settings = await prisma.userSettings.update({
        where: { userId },
        data: updateData
      });

      // Return masked version
      return {
        ...settings,
        openaiApiKey: settings.openaiApiKey ? EncryptionService.maskApiKey(settings.openaiApiKey) : null,
        anthropicApiKey: settings.anthropicApiKey ? EncryptionService.maskApiKey(settings.anthropicApiKey) : null
      };
    } catch (error) {
      throw new Error('Failed to delete API key');
    }
  }

  async testApiKey(userId: string, keyType: 'openai' | 'anthropic'): Promise<boolean> {
    try {
      const settings = await prisma.userSettings.findUnique({
        where: { userId }
      });

      if (!settings) {
        return false;
      }

      const apiKey = keyType === 'openai' ? settings.openaiApiKey : settings.anthropicApiKey;
      
      if (!apiKey) {
        return false;
      }

      // Decrypt the API key
      const decryptedKey = EncryptionService.decrypt(apiKey);

      // Test the API key (this is a placeholder - you would implement actual API testing)
      if (keyType === 'openai') {
        // Test OpenAI API
        return await this.testOpenAIKey(decryptedKey);
      } else {
        // Test Anthropic API
        return await this.testAnthropicKey(decryptedKey);
      }
    } catch (error) {
      return false;
    }
  }

  private async testOpenAIKey(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  private async testAnthropicKey(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'test' }]
        })
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

export const settingsService = new SettingsService(); 