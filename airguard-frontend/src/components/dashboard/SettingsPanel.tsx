"use client";

import React, { useState, useEffect } from "react";
import { EyeIcon, EyeOffIcon, TrashIcon } from "lucide-react";
import { settingsApi } from "@/services/api";

interface UserSettings {
  id: string;
  userId: string;
  openaiApiKey: string | null;
  anthropicApiKey: string | null;
  theme: string;
  language: string;
  notifications: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  createdAt: Date;
  updatedAt: Date;
}

interface SettingsFormData {
  openaiApiKey: string;
  anthropicApiKey: string;
  theme: string;
  language: string;
  notifications: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
}

export default function SettingsPanel() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [formData, setFormData] = useState<SettingsFormData>({
    openaiApiKey: "",
    anthropicApiKey: "",
    theme: "dark",
    language: "en",
    notifications: true,
    emailNotifications: true,
    pushNotifications: true,
    timezone: "UTC",
    dateFormat: "MM/DD/YYYY",
    timeFormat: "12h",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showOpenAIKey, setShowOpenAIKey] = useState(false);
  const [showAnthropicKey, setShowAnthropicKey] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [testingKey, setTestingKey] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsApi.getUserSettings();
      setSettings(response.data);
      
      // Update form data with current settings
      if (response.data) {
        setFormData({
          openaiApiKey: response.data.openaiApiKey || "",
          anthropicApiKey: response.data.anthropicApiKey || "",
          theme: response.data.theme,
          language: response.data.language,
          notifications: response.data.notifications,
          emailNotifications: response.data.emailNotifications,
          pushNotifications: response.data.pushNotifications,
          timezone: response.data.timezone,
          dateFormat: response.data.dateFormat,
          timeFormat: response.data.timeFormat,
        });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await settingsApi.updateUserSettings(formData);
      setSettings(response.data);
      setMessage({ type: 'success', text: 'Settings saved successfully' });
      
      // Clear success message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestKey = async (keyType: 'openai' | 'anthropic') => {
    try {
      setTestingKey(keyType);
      const response = await settingsApi.testApiKey(keyType);
      
      if (response.data.isValid) {
        setMessage({ type: 'success', text: `${keyType.toUpperCase()} API key is valid` });
      } else {
        setMessage({ type: 'error', text: `${keyType.toUpperCase()} API key is invalid` });
      }
    } catch (error) {
      console.error(`Failed to test ${keyType} key:`, error);
      setMessage({ type: 'error', text: `Failed to test ${keyType.toUpperCase()} API key` });
    } finally {
      setTestingKey(null);
    }
  };

  const handleDeleteKey = async (keyType: 'openai' | 'anthropic') => {
    if (!confirm(`Are you sure you want to delete your ${keyType.toUpperCase()} API key?`)) {
      return;
    }

    try {
      const response = await settingsApi.deleteApiKey(keyType);
      setSettings(response.data);
      setFormData(prev => ({
        ...prev,
        [`${keyType}ApiKey`]: "",
      }));
      setMessage({ type: 'success', text: `${keyType.toUpperCase()} API key deleted` });
    } catch (error) {
      console.error(`Failed to delete ${keyType} key:`, error);
      setMessage({ type: 'error', text: `Failed to delete ${keyType.toUpperCase()} API key` });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-ag-white">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-ag-green/20 border border-ag-green/50 text-ag-green' 
            : 'bg-ag-red/20 border border-ag-red/50 text-ag-red'
        }`}>
          {message.text}
        </div>
      )}

      {/* API Keys Section */}
      <div className="bg-ag-black/50 backdrop-blur-sm border border-ag-green/20 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-ag-white mb-4">API Keys</h3>
        
        {/* OpenAI API Key */}
        <div className="mb-4">
          <label className="block text-ag-white/70 text-sm mb-2">OpenAI API Key</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type={showOpenAIKey ? "text" : "password"}
                name="openaiApiKey"
                value={formData.openaiApiKey}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-ag-black/40 border border-ag-white/20 rounded-lg text-ag-white focus:outline-none focus:border-ag-lime/50"
                placeholder="sk-..."
              />
              <button
                type="button"
                onClick={() => setShowOpenAIKey(!showOpenAIKey)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-ag-white/50 hover:text-ag-white"
              >
                {showOpenAIKey ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
              </button>
            </div>
            <button
              onClick={() => handleTestKey('openai')}
              disabled={testingKey === 'openai' || !formData.openaiApiKey}
              className="px-4 py-2 bg-ag-green text-ag-black rounded-lg hover:bg-ag-green/80 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {testingKey === 'openai' ? 'Testing...' : 'Test'}
            </button>
            <button
              onClick={() => handleDeleteKey('openai')}
              disabled={!formData.openaiApiKey}
              className="px-4 py-2 bg-ag-red text-ag-white rounded-lg hover:bg-ag-red/80 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <TrashIcon size={16} />
            </button>
          </div>
        </div>

        {/* Anthropic API Key */}
        <div className="mb-4">
          <label className="block text-ag-white/70 text-sm mb-2">Anthropic API Key</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type={showAnthropicKey ? "text" : "password"}
                name="anthropicApiKey"
                value={formData.anthropicApiKey}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-ag-black/40 border border-ag-white/20 rounded-lg text-ag-white focus:outline-none focus:border-ag-lime/50"
                placeholder="sk-ant-..."
              />
              <button
                type="button"
                onClick={() => setShowAnthropicKey(!showAnthropicKey)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-ag-white/50 hover:text-ag-white"
              >
                {showAnthropicKey ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
              </button>
            </div>
            <button
              onClick={() => handleTestKey('anthropic')}
              disabled={testingKey === 'anthropic' || !formData.anthropicApiKey}
              className="px-4 py-2 bg-ag-green text-ag-black rounded-lg hover:bg-ag-green/80 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {testingKey === 'anthropic' ? 'Testing...' : 'Test'}
            </button>
            <button
              onClick={() => handleDeleteKey('anthropic')}
              disabled={!formData.anthropicApiKey}
              className="px-4 py-2 bg-ag-red text-ag-white rounded-lg hover:bg-ag-red/80 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <TrashIcon size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Preferences Section */}
      <div className="bg-ag-black/50 backdrop-blur-sm border border-ag-green/20 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-ag-white mb-4">Preferences</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Theme */}
          <div>
            <label className="block text-ag-white/70 text-sm mb-2">Theme</label>
            <select
              name="theme"
              value={formData.theme}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-ag-black/40 border border-ag-white/20 rounded-lg text-ag-white focus:outline-none focus:border-ag-lime/50"
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
              <option value="auto">Auto</option>
            </select>
          </div>

          {/* Language */}
          <div>
            <label className="block text-ag-white/70 text-sm mb-2">Language</label>
            <select
              name="language"
              value={formData.language}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-ag-black/40 border border-ag-white/20 rounded-lg text-ag-white focus:outline-none focus:border-ag-lime/50"
            >
              <option value="en">English</option>
              <option value="ar">العربية</option>
              <option value="fr">Français</option>
              <option value="es">Español</option>
            </select>
          </div>

          {/* Timezone */}
          <div>
            <label className="block text-ag-white/70 text-sm mb-2">Timezone</label>
            <select
              name="timezone"
              value={formData.timezone}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-ag-black/40 border border-ag-white/20 rounded-lg text-ag-white focus:outline-none focus:border-ag-lime/50"
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
              <option value="Europe/London">London</option>
              <option value="Europe/Paris">Paris</option>
              <option value="Asia/Beirut">Beirut</option>
            </select>
          </div>

          {/* Time Format */}
          <div>
            <label className="block text-ag-white/70 text-sm mb-2">Time Format</label>
            <select
              name="timeFormat"
              value={formData.timeFormat}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-ag-black/40 border border-ag-white/20 rounded-lg text-ag-white focus:outline-none focus:border-ag-lime/50"
            >
              <option value="12h">12-hour</option>
              <option value="24h">24-hour</option>
            </select>
          </div>
        </div>

        {/* Notifications */}
        <div className="mt-6 space-y-3">
          <h4 className="text-md font-medium text-ag-white">Notifications</h4>
          
          <label className="flex items-center text-sm">
            <input
              type="checkbox"
              name="notifications"
              checked={formData.notifications}
              onChange={handleInputChange}
              className="mr-2 rounded border-ag-white/20 bg-ag-black/40 text-ag-green focus:ring-ag-green"
            />
            Enable notifications
          </label>

          <label className="flex items-center text-sm">
            <input
              type="checkbox"
              name="emailNotifications"
              checked={formData.emailNotifications}
              onChange={handleInputChange}
              className="mr-2 rounded border-ag-white/20 bg-ag-black/40 text-ag-green focus:ring-ag-green"
            />
            Email notifications
          </label>

          <label className="flex items-center text-sm">
            <input
              type="checkbox"
              name="pushNotifications"
              checked={formData.pushNotifications}
              onChange={handleInputChange}
              className="mr-2 rounded border-ag-white/20 bg-ag-black/40 text-ag-green focus:ring-ag-green"
            />
            Push notifications
          </label>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-ag-green text-ag-black font-semibold rounded-lg hover:bg-ag-green/80 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
} 