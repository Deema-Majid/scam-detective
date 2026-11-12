import type { Case } from '@/engine/types';
import { case1 } from './case1';
import { case2 } from './case2';
import { case3 } from './case3';
import { case4 } from './case4';

/** Ordered list of playable cases. Add a case here and the engine picks it up. */
export const CASES: Case[] = [case1, case2, case4, case3];

export function caseById(id: string): Case | undefined {
  return CASES.find((c) => c.id === id);
}
