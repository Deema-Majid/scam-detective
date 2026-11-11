import { create } from 'zustand';

/**
 * Navigation state of the simulated phone. Not persisted: reopening the game
 * always lands on the home screen of the current case.
 */
export type AppId = 'home' | 'messages' | 'orders' | 'browser' | 'dialer' | 'chats' | 'notebook' | 'settings';

export type Sheet =
  | { kind: 'sender'; contactId: string }
  | { kind: 'link'; threadId: string; messageId: string; linkId: string }
  | null;

export type Toast = { id: number; titleKey: string; bodyKey: string; threadId?: string; app: AppId };

type PhoneState = {
  app: AppId;
  /** Per-app "where am I" (thread id, site/page, order id, number being called). */
  threadId?: string;
  site?: { siteId: string; pageId: string };
  orderId?: string;
  callNumber?: string;
  /** True while the call screen is open (the interrupt message waits). */
  inCall: boolean;
  /** Sites the player opened in this case (the dialer offers their official numbers). */
  visitedSites: string[];
  sheet: Sheet;
  toast: Toast | null;
  /** Evidence id currently flying to the notebook (for the GSAP animation). */
  flying: string | null;
  /** Preset chat replies already sent in this case. */
  sentReplies: string[];
  sendReply: (replyId: string) => void;
  /** Back to the home screen with all per-case navigation cleared. */
  resetForCase: () => void;
  openApp: (app: AppId) => void;
  openThread: (threadId: string) => void;
  openSite: (siteId: string, pageId: string) => void;
  closeSite: () => void;
  openOrder: (orderId?: string) => void;
  openCall: (number: string) => void;
  endCall: () => void;
  openSheet: (sheet: Sheet) => void;
  closeSheet: () => void;
  home: () => void;
  showToast: (t: Omit<Toast, 'id'>) => void;
  dismissToast: () => void;
  setFlying: (id: string | null) => void;
};

let toastSeq = 1;

export const usePhone = create<PhoneState>()((set) => ({
  app: 'home',
  inCall: false,
  visitedSites: [],
  sheet: null,
  toast: null,
  flying: null,
  sentReplies: [],
  sendReply: (id) => set((s) => (s.sentReplies.includes(id) ? {} : { sentReplies: [...s.sentReplies, id] })),
  resetForCase: () =>
    set({
      app: 'home',
      sheet: null,
      toast: null,
      flying: null,
      sentReplies: [],
      threadId: undefined,
      site: undefined,
      orderId: undefined,
      callNumber: undefined,
      inCall: false,
      visitedSites: [],
    }),
  openApp: (app) => set({ app, sheet: null }),
  openThread: (threadId) => set({ threadId, sheet: null }),
  openSite: (siteId, pageId) =>
    set((s) => ({
      app: 'browser',
      site: { siteId, pageId },
      sheet: null,
      visitedSites: s.visitedSites.includes(siteId) ? s.visitedSites : [...s.visitedSites, siteId],
    })),
  closeSite: () => set({ site: undefined }),
  openOrder: (orderId) => set({ orderId }),
  openCall: (number) => set({ app: 'dialer', callNumber: number, inCall: true, sheet: null }),
  endCall: () => set({ callNumber: undefined, inCall: false }),
  openSheet: (sheet) => set({ sheet }),
  closeSheet: () => set({ sheet: null }),
  home: () => set({ app: 'home', sheet: null, threadId: undefined, orderId: undefined, callNumber: undefined, inCall: false }),
  showToast: (t) => set({ toast: { ...t, id: toastSeq++ } }),
  dismissToast: () => set({ toast: null }),
  setFlying: (flying) => set({ flying }),
}));
