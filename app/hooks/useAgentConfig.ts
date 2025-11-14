'use client';

import { useState, useEffect } from 'react';
import { AgentConfig, DEFAULT_CONFIG } from '@/app/types/config';

const CONFIG_STORAGE_KEY = 'agent_config';

export function useAgentConfig() {
  const [config, setConfig] = useState<AgentConfig>(DEFAULT_CONFIG);

  // 从 localStorage 加载配置
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setConfig({ ...DEFAULT_CONFIG, ...parsed });
      }
    } catch (error) {
      console.error('Failed to load config from localStorage:', error);
    }
  }, []);

  // 更新配置并保存到 localStorage
  const updateConfig = (updates: Partial<AgentConfig>) => {
    setConfig((prev) => {
      const newConfig = { ...prev, ...updates };
      try {
        localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(newConfig));
      } catch (error) {
        console.error('Failed to save config to localStorage:', error);
      }
      return newConfig;
    });
  };

  // 重置为默认配置
  const resetConfig = () => {
    setConfig(DEFAULT_CONFIG);
    try {
      localStorage.removeItem(CONFIG_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to remove config from localStorage:', error);
    }
  };

  return {
    config,
    updateConfig,
    resetConfig,
  };
}
