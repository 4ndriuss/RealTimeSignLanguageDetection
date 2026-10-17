/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type CameraStatus =
  | 'idle'
  | 'loading'
  | 'active'
  | 'denied'
  | 'error';

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
