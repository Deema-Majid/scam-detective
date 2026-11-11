import type { DecisionRating, TestForm, ToolId, Truth } from '@/engine/types';
import { durationSec } from '@/engine/caseMachine';
import { evaluateVerdict, scoreTest } from '@/engine/scoring';
import { caseById } from '@/content/cases';
import { itemsForForm } from '@/content/test-bank';
import type { AgeBand, GameState } from './gameStore';

/**
 * Results export (docs/results-schema.md, version 1). buildResults() turns the
 * game state into the JSON object; encodeResults() turns that into a short
 * text code "SD1.<base64url of deflate-raw JSON>" (or "SD0.<base64url JSON>"
 * when the browser has no CompressionStream). analysis/analyze.py reads both.
 * No name, email or any personal identifier is ever included (free text is scrubbed by sanitizeFreeText).
 */

export type ResultsTestItem = {
  id: string;
  truth: Truth;
  polished: boolean;
  verdict: Truth;
  confidence: number;
  correct: boolean;
  brier: number;
  firstAction: string;
  otherChannel: boolean;
};

export type ResultsCase = {
  id: string;
  truth: Truth;
  verdict: Truth;
  correct: boolean;
  proven: boolean;
  outcome: 'full' | 'partial' | 'wrong';
  confidence: number;
  brier: number;
  proof: string[];
  evidenceCollected: string[];
  deductions: string[];
  toolsUsed: ToolId[];
  openedLinks: string[];
  interruptFired: boolean;
  decision: { id: string; rating: DecisionRating; usesOtherChannel: boolean };
  durationSec: number;
};

export type Results = {
  v: 1;
  tester?: string;
  age?: AgeBand;
  lang: 'ar' | 'en';
  gender: 'f' | 'm';
  startedAt: number;
  finishedAt: number;
  pre?: { form: TestForm; items: ResultsTestItem[] };
  post?: { form: TestForm; items: ResultsTestItem[] };
  cases: ResultsCase[];
  summary: { otherChannelCount: number; brierCases: number | null };
  feedback?: { open: string[]; likert: number[] };
  /** Only set on generated sample files (analysis/sample-data). */
  synthetic?: boolean;
};

type StateSlice = Pick<GameState, 'tester' | 'pre' | 'post' | 'feedback' | 'runs' | 'caseOrder' | 'startedAt'>;

function testSection(session: GameState['pre']): Results['pre'] {
  if (!session) return undefined;
  const items = itemsForForm(session.form);
  const scored = scoreTest(items, session.answers);
  const byId = new Map(session.answers.map((a) => [a.itemId, a]));
  return {
    form: session.form,
    items: scored.items.map((it) => ({
      id: it.itemId,
      truth: it.truth,
      polished: it.polished,
      verdict: byId.get(it.itemId)!.verdict,
      confidence: it.confidence,
      correct: it.correct,
      brier: round(it.brier),
      firstAction: byId.get(it.itemId)!.firstActionId,
      otherChannel: it.otherChannel,
    })),
  };
}

const EMAIL_RE = /[^\s@<>()]+@[^\s@<>()]+\.[^\s@<>()]+/g;
const LONG_NUMBER_RE = /[0-9٠-٩۰-۹](?:[ .-]?[0-9٠-٩۰-۹]){6,}/g;

/**
 * Free text is the one place a tester could type something personal.
 * Emails become [email]; any run of 7+ digits (Latin or Arabic-Indic, with
 * optional single spaces/dashes between them) becomes [number].
 */
export function sanitizeFreeText(text: string): string {
  return text.replace(EMAIL_RE, '[email]').replace(LONG_NUMBER_RE, '[number]');
}

export function buildResults(s: StateSlice, opts: { lang: 'ar' | 'en'; gender: 'f' | 'm'; now?: number }): Results {
  const now = opts.now ?? Date.now();
  const cases: ResultsCase[] = [];
  for (const id of s.caseOrder) {
    const run = s.runs[id];
    const c = caseById(id);
    if (!run?.verdict || !run.decisionId || !c) continue;
    const res = evaluateVerdict(c, run.verdict);
    const d = c.decisions.find((x) => x.id === run.decisionId);
    if (!d) continue;
    cases.push({
      id,
      truth: c.truth,
      verdict: run.verdict.truth,
      correct: res.correct,
      proven: res.proven,
      outcome: res.outcome,
      confidence: run.verdict.confidence,
      brier: round(res.brier),
      proof: run.verdict.proof,
      evidenceCollected: run.collected,
      deductions: run.deductions,
      toolsUsed: run.toolsUsed,
      openedLinks: run.openedLinks,
      interruptFired: run.interruptFired,
      decision: { id: d.id, rating: d.rating, usesOtherChannel: d.usesOtherChannel },
      durationSec: durationSec(run, now),
    });
  }
  const brierCases = cases.length ? round(cases.reduce((a, c) => a + c.brier, 0) / cases.length) : null;
  const out: Results = {
    v: 1,
    lang: opts.lang,
    gender: opts.gender,
    startedAt: s.startedAt,
    finishedAt: now,
    cases,
    summary: { otherChannelCount: cases.filter((c) => c.decision.usesOtherChannel).length, brierCases },
  };
  if (s.tester) {
    out.tester = s.tester.code;
    if (s.tester.age) out.age = s.tester.age;
  }
  const pre = testSection(s.pre);
  const post = testSection(s.post);
  if (pre) out.pre = pre;
  if (post) out.post = post;
  if (s.feedback) out.feedback = { open: s.feedback.open.map(sanitizeFreeText), likert: s.feedback.likert };
  return out;
}

function round(n: number): number {
  return Math.round(n * 10000) / 10000;
}

/* ---------- base64url helpers ---------- */

export function bytesToBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function base64UrlToBytes(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function pipeThrough(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const src = new Blob([bytes as BlobPart]).stream().pipeThrough(stream as unknown as ReadableWritablePair<Uint8Array, Uint8Array>);
  return new Uint8Array(await new Response(src).arrayBuffer());
}

/** JSON -> "SD1.<base64url deflate-raw>" (falls back to "SD0.<base64url>" without compression). */
export async function encodeResults(results: Results): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(results));
  if (typeof CompressionStream !== 'undefined') {
    try {
      const packed = await pipeThrough(json, new CompressionStream('deflate-raw'));
      return 'SD1.' + bytesToBase64Url(packed);
    } catch {
      /* fall through to SD0 */
    }
  }
  return 'SD0.' + bytesToBase64Url(json);
}

/** Inverse of encodeResults. Throws on an unknown prefix or malformed payload. */
export async function decodeResults(code: string): Promise<Results> {
  const trimmed = code.trim();
  const m = trimmed.match(/^SD([01])\.([A-Za-z0-9_-]+)$/);
  if (!m) throw new Error('Not a results code');
  const bytes = base64UrlToBytes(m[2]);
  const raw = m[1] === '1' ? await pipeThrough(bytes, new DecompressionStream('deflate-raw')) : bytes;
  return JSON.parse(new TextDecoder().decode(raw)) as Results;
}

export function resultsFileName(results: Results): string {
  return `results-${results.tester ?? 'anon'}.json`;
}
