import { connectPlatform, disconnectPlatform } from '../services/api';
import { Platform } from '../types';

export function usePlatformAuth() {
  return {
    connect: (platform: Platform) => connectPlatform(platform),
    disconnect: (platform: Platform) => disconnectPlatform(platform),
  };
}
