/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SignStandard = 'BISINDO' | 'SIBI' | 'Keduanya';

export interface DetectionResult {
  signText: string;
  signLabel: string;
  confidence: number; // 0.0 - 1.0
  standard: 'BISINDO' | 'SIBI';
  handDetected: boolean;
  landmarks?: Array<{ x: number; y: number; z?: number }>;
  timestamp: number;
  category?: string;
  culturalNote?: string;
}

export interface HistoryEntry {
  id: string;
  text: string;
  timestamp: number;
  confidence: number;
  standard: 'BISINDO' | 'SIBI';
}

export type CameraStatus = 
  | 'idle' 
  | 'requesting' 
  | 'active' 
  | 'denied' 
  | 'error' 
  | 'simulation';

export interface TechItem {
  name: string;
  role: string;
  description: string;
  badge: string;
}

export interface UseCaseItem {
  title: string;
  tagline: string;
  description: string;
  impact: string;
  iconName: string;
  quote?: string;
}

export type Language = 'id' | 'en';
