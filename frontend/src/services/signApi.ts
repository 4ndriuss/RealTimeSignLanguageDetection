/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { API_BASE_URL } from '../config';

/** Response of POST /predict/features (see 4_api.py). */
export interface ApiPrediction {
  status: 'ok' | 'uncertain' | 'no_hand';
  predicted_label: string | null;
  confidence: number;
}

/** Response of GET /health. */
export interface ApiHealth {
  status: string;
  num_features: number;
  classes: string[];
}

export async function predictFeatures(features: number[], signal?: AbortSignal): Promise<ApiPrediction> {
  const response = await fetch(`${API_BASE_URL}/predict/features`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ features }),
    signal,
  });
  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

export async function fetchHealth(signal?: AbortSignal): Promise<ApiHealth> {
  const response = await fetch(`${API_BASE_URL}/health`, { signal });
  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}
