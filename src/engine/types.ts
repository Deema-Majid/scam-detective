/**
 * Data model for the whole game. The engine knows nothing about a specific case:
 * every case in src/content/cases/*.ts is just data that satisfies these types.
 * Any field ending in `Key` is an i18n key (src/i18n/ar.json, en.json); the
 * code never contains player-facing text.
 */

export type Truth = 'scam' | 'legit';

export type Technique =
  | 'urgency'
  | 'authority'
  | 'reward'
  | 'fear'
  | 'secrecy'
  | 'new-channel'
  | 'familiarity'
  | 'small-fee'
  | 'leaked-details'
  | 'otp-request'
  | 'lookalike';

/** Investigation tools. A case activates only the tools it lists. */
export type ToolId =
  | 'sender' // sender details sheet (number / handle / account age)
  | 'link' // link inspector (full URL with domain highlighted) + opening the page inside the sim
  | 'site' // the fictional company's official website inside the in-game browser
  | 'orders' // "my orders" app (orders + contest participations)
  | 'call' // in-game call to a number (scripted, text only)
  | 'chats' // old chats with a saved contact
  | 'interrupt'; // a message that arrives mid-investigation

export type Strength = 'weak' | 'medium'; // no "decisive": cases are only settled by linking evidence

export type Evidence = {
  id: string;
  tool: ToolId;
  titleKey: string;
  bodyKey: string;
  supports: Truth | 'neutral';
  strength: Strength;
  /** Evidence that points the wrong way on purpose (e.g. a real order does exist). */
  misleading?: boolean;
  techniques?: Technique[];
};

export type Deduction = {
  id: string;
  /** Linking exactly these two evidence ids (any order) unlocks the deduction. */
  pair: [string, string];
  conclusionKey: string;
  proves: Truth;
};

export type DecisionRating = 'best' | 'acceptable' | 'risky' | 'harmful';

export type Decision = {
  id: string;
  textKey: string;
  rating: DecisionRating;
  /** Counts toward the "verified through another channel" habit counter. */
  usesOtherChannel: boolean;
  outcomeKey: string;
  altTimelineKey: string;
  effects: { money?: number; exposure?: 'none' | 'card' | 'identity' | 'otp'; trust?: number };
};

/* ------------------------------------------------------------------ */
/* The simulated phone's world for one case                            */
/* ------------------------------------------------------------------ */

export type Contact = {
  id: string;
  nameKey: string;
  /** Written in an obviously fake pattern, e.g. "05 0000 0011". */
  number?: string;
  /** Social handle for DMs, e.g. "Lamha.Rewards". */
  handle?: string;
  /** Short display avatar: initials or emoji. Never a real brand logo. */
  avatar: string;
  avatarTone?: 'a' | 'b' | 'c' | 'd' | 'e';
  /** Saved in the phone's contacts before the case starts. */
  saved: boolean;
  /** Sender-sheet facts (official id? account age? verified?). */
  facts?: { labelKey: string; valueKey: string }[];
  /** Evidence offered on the sender sheet. */
  evidence?: string[];
};

export type Link = {
  id: string;
  url: string; // must end in .example (validated)
  /** The real domain of the impersonated company, shown by the inspector for comparison. */
  officialUrl?: string;
  /** Site page opened inside the sim when the player taps the link. */
  opens?: { siteId: string; pageId: string };
  /** Evidence offered by the link inspector. */
  evidence?: string[];
};

export type Message = {
  id: string;
  from: 'contact' | 'me';
  bodyKey: string;
  timeKey: string;
  links?: Link[];
  /** Evidence offered by "analyze this message" (e.g. money + urgency + secrecy). */
  evidence?: string[];
  /** Rendered as a voice-note bubble (content is still the text in bodyKey). */
  voiceNote?: boolean;
};

/** A preset reply the player can send in a chat; the other side answers with a scripted line. */
export type Reply = {
  id: string;
  textKey: string;
  responseKey: string;
  evidence?: string[];
};

export type Thread = {
  id: string;
  app: 'messages' | 'chats';
  contactId: string;
  messages: Message[];
  replies?: Reply[];
  /** Evidence offered by reading the thread as a whole (e.g. "she calls you Dodo and sends voice notes"). */
  evidence?: string[];
};

export type Order = {
  id: string;
  titleKey: string;
  storeKey: string;
  statusKey: string;
  dateKey: string;
  carrierKey: string;
  paymentKey: string;
  /** Evidence on the summary row vs. inside the details. */
  evidence?: { summary?: string[]; details?: string[] };
};

export type Participation = {
  id: string;
  contestKey: string;
  organizerKey: string;
  dateKey: string;
  evidence?: string[];
};

export type SiteBlock =
  | { type: 'text'; titleKey?: string; bodyKey: string; evidence?: string[] }
  | { type: 'contact'; labelKey: string; number: string; evidence?: string[] }
  | {
      type: 'list';
      titleKey?: string;
      itemKeys: string[];
      /** Page ids the items navigate to (same order as itemKeys). Falls back to matching the key's last segment to a page id. */
      pageIds?: string[];
      evidence?: string[];
    }
  /** A fake payment/OTP form. Fields never store or send anything; a "fill fake data" button is used. */
  | {
      type: 'fake-form';
      titleKey: string;
      fieldKeys: string[];
      submitKey: string;
      warningKey: string;
      evidence?: string[];
    };

export type SitePage = {
  id: string;
  path: string; // e.g. "/policy"
  titleKey: string;
  blocks: SiteBlock[];
};

export type Site = {
  id: string;
  domain: string; // must end in .example
  nameKey: string;
  official: boolean;
  pages: SitePage[];
};

export type CallLine = { who: 'me' | 'them'; textKey: string };

export type CallScript = {
  id: string;
  number: string;
  /** Who answers (shown on the call screen). */
  calleeKey: string;
  lines: CallLine[];
  evidence?: string[];
  /** Calling this number is itself a risky move (e.g. the number from the scam message). */
  risky?: boolean;
};

export type World = {
  contacts: Contact[];
  threads: Thread[];
  orders: Order[];
  participations: Participation[];
  sites: Site[];
  calls: CallScript[];
};

/* ------------------------------------------------------------------ */
/* Case                                                                 */
/* ------------------------------------------------------------------ */

export type InterruptTrigger =
  | { kind: 'time'; seconds: number }
  | { kind: 'event'; event: 'open-link' | 'open-app'; id: string };

export type Interrupt = {
  trigger: InterruptTrigger;
  threadId: string;
  message: Message;
  /** False = distractor with no bearing on the case. */
  relevant: boolean;
  /** Evidence offered by the interrupt message (only when relevant). */
  evidence?: string[];
};

export type Case = {
  id: string;
  titleKey: string;
  introKey: string;
  /** Short line shown while the first message arrives (what the player did before). */
  setupKey: string;
  tools: ToolId[];
  /** The thread + message ids that arrive when the case starts. */
  incoming: { threadId: string; messageIds: string[] };
  interrupt?: Interrupt;
  evidence: Evidence[];
  deductions: Deduction[];
  truth: Truth;
  decisions: Decision[];
  techniques: Technique[];
  /** One-paragraph "the scammer's plan" shown in the debrief. */
  planKey: string;
  /** Three questions for the printable family card. */
  familyQuestionKeys: [string, string, string];
  world: World;
  /** Optional story arc (DECISIONS.md #2). Unused until Deema decides. */
  arc?: unknown;
};

/* ------------------------------------------------------------------ */
/* Pre/post test bank                                                   */
/* ------------------------------------------------------------------ */

export type TestForm = 'A' | 'B';

export type FirstAction = {
  id: string;
  textKey: string;
  otherChannel: boolean;
};

export type TestItem = {
  id: string;
  form: TestForm;
  truth: Truth;
  /** Polished (well-written) vs sloppy (typos, slang). Measures "looks deceive". */
  polished: boolean;
  senderKey: string;
  savedContact: boolean;
  textKey: string;
  firstActions: FirstAction[]; // exactly 4, exactly one with otherChannel: true
};

/* ------------------------------------------------------------------ */
/* Runtime state of one case                                            */
/* ------------------------------------------------------------------ */

export type CasePhase = 'incoming' | 'investigating' | 'verdict' | 'decision' | 'outcome' | 'debrief';

export type Verdict = {
  truth: Truth;
  /** 0.5 .. 1.0 */
  confidence: number;
  /** Evidence and/or deduction ids the player built the verdict on. */
  proof: string[];
};

export type CaseRun = {
  caseId: string;
  phase: CasePhase;
  startedAt: number;
  finishedAt?: number;
  collected: string[]; // evidence ids in the notebook
  deductions: string[]; // unlocked deduction ids
  toolsUsed: ToolId[];
  openedLinks: string[];
  interruptFired: boolean;
  verdict?: Verdict;
  decisionId?: string;
  /** Tool the previous case noticed the player ignored (A6 adaptivity). */
  adaptiveHint?: ToolId;
};
