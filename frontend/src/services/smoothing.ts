/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Time-based majority vote with hysteresis.
 *
 * Counting votes over a fixed time window (instead of a fixed number of
 * frames) keeps the reaction time the same on fast and slow devices. The
 * displayed label only changes when a new label clearly dominates the
 * window, which prevents flickering between similar signs.
 */

export interface SmoothingOptions {
  windowMs: number;
  minShare: number;
  minVotes: number;
  resetAfterMs: number;
}

export interface SmoothedPrediction {
  label: string;
  confidence: number;
}

interface Vote {
  label: string;
  confidence: number;
  time: number;
}

export class PredictionSmoother {
  private votes: Vote[] = [];
  private current: SmoothedPrediction | null = null;
  private lastHandTime = -Infinity;

  constructor(private readonly options: SmoothingOptions) {}

  /**
   * Register one API prediction for a frame with a visible hand.
   * `label` is null when the model was not confident enough (it does not vote).
   */
  addPrediction(label: string | null, confidence: number, now: number): SmoothedPrediction | null {
    this.lastHandTime = now;
    if (label !== null) this.votes.push({ label, confidence, time: now });
    this.prune(now);

    const total = this.votes.length;
    if (total === 0) return this.current;

    const counts = new Map<string, number>();
    for (const v of this.votes) counts.set(v.label, (counts.get(v.label) ?? 0) + 1);

    let winner = '';
    let winnerVotes = 0;
    for (const [l, c] of counts) {
      if (c > winnerVotes) {
        winner = l;
        winnerVotes = c;
      }
    }

    const isNewLabel = winner !== this.current?.label;
    const dominates =
      winnerVotes >= this.options.minVotes && winnerVotes / total >= this.options.minShare;

    if (!isNewLabel || dominates) {
      this.current = { label: winner, confidence: this.averageConfidence(winner) };
    } else if (this.current) {
      // Keep showing the current label, but refresh its confidence.
      const stillVoted = counts.has(this.current.label);
      if (stillVoted) {
        this.current = { ...this.current, confidence: this.averageConfidence(this.current.label) };
      }
    }
    return this.current;
  }

  /** Register a frame without any hand; clears the result after a grace period. */
  markNoHand(now: number): SmoothedPrediction | null {
    if (now - this.lastHandTime > this.options.resetAfterMs) this.reset();
    return this.current;
  }

  reset(): void {
    this.votes = [];
    this.current = null;
  }

  private prune(now: number): void {
    const cutoff = now - this.options.windowMs;
    let i = 0;
    while (i < this.votes.length && this.votes[i].time < cutoff) i++;
    if (i > 0) this.votes.splice(0, i);
  }

  private averageConfidence(label: string): number {
    let sum = 0;
    let count = 0;
    for (const v of this.votes) {
      if (v.label === label) {
        sum += v.confidence;
        count++;
      }
    }
    return count > 0 ? sum / count : 0;
  }
}
