import { Request, Response } from 'express';
import { settingsService } from '@/services/settingsService';
import { validateSettingsUpdate } from '@/utils/validation';
import logger from '@/config/logger';

export const settingsController = {
  // Get user settings
  async getUserSettings(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const settings = await settingsService.getUserSettings(userId);

      if (!settings) {
        return res.status(404).json({
          success: false,
          error: 'Settings not found'
        });
      }

      res.json({
        success: true,
        data: settings
      });
    } catch (error) {
      logger.error('Error getting user settings:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get user settings'
      });
    }
  },

  // Update user settings
  async updateUserSettings(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const updateData = req.body;

      // Validate the update data
      const validation = validateSettingsUpdate(updateData);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: validation.errors[0]?.message || 'Validation failed'
        });
      }

      const settings = await settingsService.updateUserSettings(userId, updateData);

      res.json({
        success: true,
        data: settings,
        message: 'Settings updated successfully'
      });
    } catch (error) {
      logger.error('Error updating user settings:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update user settings'
      });
    }
  },

  // Test API key
  async testApiKey(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { keyType } = req.params;

      if (!keyType || !['openai', 'anthropic'].includes(keyType)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid key type. Must be "openai" or "anthropic"'
        });
      }

      const isValid = await settingsService.testApiKey(userId, keyType as 'openai' | 'anthropic');

      res.json({
        success: true,
        data: {
          keyType,
          isValid
        },
        message: isValid ? 'API key is valid' : 'API key is invalid'
      });
    } catch (error) {
      logger.error('Error testing API key:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to test API key'
      });
    }
  },

  // Delete API key
  async deleteApiKey(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { keyType } = req.params;

      if (!keyType || !['openai', 'anthropic'].includes(keyType)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid key type. Must be "openai" or "anthropic"'
        });
      }

      const settings = await settingsService.deleteApiKey(userId, keyType as 'openai' | 'anthropic');

      res.json({
        success: true,
        data: settings,
        message: `${keyType} API key deleted successfully`
      });
    } catch (error) {
      logger.error('Error deleting API key:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete API key'
      });
    }
  }
}; 