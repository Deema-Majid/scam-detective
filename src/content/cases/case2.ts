import type { Case } from '@/engine/types';

/**
 * Case 2 — Impersonating someone you know (انتحال شخص تعرفينه). Truth: scam.
 * Source: build-plan.md §7. The interrupt is a DISTRACTOR (a real bank alert
 * with no bearing on the case) to teach that not every message is evidence.
 * Registered in ./index.ts in phase 2.
 */
export const case2: Case = {
  id: 'case2',
  titleKey: 'case2.title',
  introKey: 'case2.intro',
  setupKey: 'case2.setup',
  tools: ['chats', 'call', 'sender', 'interrupt'],
  truth: 'scam',
  incoming: { threadId: 't-newnum', messageIds: ['m-new-1', 'm-new-2'] },
  interrupt: {
    trigger: { kind: 'time', seconds: 60 },
    threadId: 't-bank',
    relevant: false,
    message: { id: 'm-bank-2', from: 'contact', bodyKey: 'case2.msg.bank2', timeKey: 'time.now' },
  },
  evidence: [
    { id: 'E1', tool: 'sender', titleKey: 'case2.E1.title', bodyKey: 'case2.E1.body', supports: 'legit', strength: 'weak', misleading: true },
    { id: 'E2', tool: 'chats', titleKey: 'case2.E2.title', bodyKey: 'case2.E2.body', supports: 'scam', strength: 'weak', techniques: ['familiarity'] },
    { id: 'E3', tool: 'chats', titleKey: 'case2.E3.title', bodyKey: 'case2.E3.body', supports: 'scam', strength: 'medium', techniques: ['new-channel'] },
    { id: 'E4', tool: 'chats', titleKey: 'case2.E4.title', bodyKey: 'case2.E4.body', supports: 'scam', strength: 'weak', techniques: ['urgency', 'secrecy', 'new-channel'] },
    { id: 'E5', tool: 'call', titleKey: 'case2.E5.title', bodyKey: 'case2.E5.body', supports: 'scam', strength: 'medium', techniques: ['familiarity', 'new-channel'] },
    { id: 'E6', tool: 'chats', titleKey: 'case2.E6.title', bodyKey: 'case2.E6.body', supports: 'scam', strength: 'weak', techniques: ['secrecy', 'familiarity'] },
  ],
  deductions: [
    { id: 'D1', pair: ['E3', 'E2'], conclusionKey: 'case2.D1', proves: 'scam' },
    { id: 'D2', pair: ['E5', 'E1'], conclusionKey: 'case2.D2', proves: 'scam' },
    { id: 'D3', pair: ['E4', 'E6'], conclusionKey: 'case2.D3', proves: 'scam' },
  ],
  decisions: [
    {
      id: 'transfer',
      textKey: 'case2.dec.transfer',
      rating: 'harmful',
      usesOtherChannel: false,
      outcomeKey: 'case2.out.transfer',
      altTimelineKey: 'case2.alt.transfer',
      effects: { money: -850, exposure: 'none', trust: -2 },
    },
    {
      id: 'ask-personal',
      textKey: 'case2.dec.askPersonal',
      rating: 'acceptable',
      usesOtherChannel: false,
      outcomeKey: 'case2.out.askPersonal',
      altTimelineKey: 'case2.alt.askPersonal',
      effects: { exposure: 'none', trust: 0 },
    },
    {
      id: 'call-old-tell-family',
      textKey: 'case2.dec.callOldTellFamily',
      rating: 'best',
      usesOtherChannel: true,
      outcomeKey: 'case2.out.callOldTellFamily',
      altTimelineKey: 'case2.alt.callOldTellFamily',
      effects: { exposure: 'none', trust: 2 },
    },
    {
      id: 'block-only',
      textKey: 'case2.dec.blockOnly',
      rating: 'acceptable',
      usesOtherChannel: false,
      outcomeKey: 'case2.out.blockOnly',
      altTimelineKey: 'case2.alt.blockOnly',
      effects: { exposure: 'none', trust: 0 },
    },
  ],
  techniques: ['familiarity', 'secrecy', 'urgency', 'new-channel'],
  planKey: 'case2.plan',
  familyQuestionKeys: ['case2.family.q1', 'case2.family.q2', 'case2.family.q3'],
  world: {
    contacts: [
      {
        id: 'c-reema',
        nameKey: 'case2.contact.reema.name',
        number: '05 0000 0021',
        avatar: 'ر',
        avatarTone: 'd',
        saved: true,
        facts: [
          { labelKey: 'sender.fact.type', valueKey: 'sender.value.savedContact' },
          { labelKey: 'sender.fact.saved', valueKey: 'common.yes' },
        ],
      },
      {
        id: 'c-newnum',
        nameKey: 'case2.contact.newnum.name',
        number: '05 0000 0087',
        avatar: 'ر',
        avatarTone: 'd',
        saved: false,
        facts: [
          { labelKey: 'sender.fact.type', valueKey: 'sender.value.mobileNumber' },
          { labelKey: 'sender.fact.photo', valueKey: 'case2.sender.photoMatches' },
          { labelKey: 'sender.fact.saved', valueKey: 'common.no' },
        ],
        evidence: ['E1'],
      },
      {
        id: 'c-bank',
        nameKey: 'brand.ofuq',
        avatar: 'أ',
        avatarTone: 'a',
        saved: false,
        facts: [
          { labelKey: 'sender.fact.type', valueKey: 'sender.value.senderId' },
          { labelKey: 'sender.fact.officialId', valueKey: 'common.yes' },
        ],
      },
    ],
    threads: [
      {
        id: 't-newnum',
        app: 'chats',
        contactId: 'c-newnum',
        messages: [
          { id: 'm-new-1', from: 'contact', bodyKey: 'case2.msg.new1', timeKey: 'time.now' },
          { id: 'm-new-2', from: 'contact', bodyKey: 'case2.msg.new2', timeKey: 'time.now', evidence: ['E4'] },
        ],
        replies: [
          { id: 'r-cat', textKey: 'case2.reply.cat', responseKey: 'case2.reply.cat.response', evidence: ['E6'] },
          { id: 'r-call', textKey: 'case2.reply.call', responseKey: 'case2.reply.call.response' },
          { id: 'r-later', textKey: 'case2.reply.later', responseKey: 'case2.reply.later.response' },
        ],
      },
      {
        id: 't-reema',
        app: 'chats',
        contactId: 'c-reema',
        evidence: ['E2'],
        messages: [
          { id: 'm-reema-1', from: 'contact', bodyKey: 'case2.msg.reema1', timeKey: 'time.lastWeek' },
          { id: 'm-reema-2', from: 'me', bodyKey: 'case2.msg.reema2', timeKey: 'time.lastWeek' },
          { id: 'm-reema-3', from: 'contact', bodyKey: 'case2.msg.reema3', timeKey: 'time.lastWeek', voiceNote: true },
          { id: 'm-reema-4', from: 'contact', bodyKey: 'case2.msg.reema4', timeKey: 'time.yesterday' },
          { id: 'm-reema-5', from: 'contact', bodyKey: 'case2.msg.reema5', timeKey: 'time.2hoursAgo', evidence: ['E3'] },
        ],
      },
      {
        id: 't-bank',
        app: 'messages',
        contactId: 'c-bank',
        messages: [{ id: 'm-bank-1', from: 'contact', bodyKey: 'case2.msg.bank1', timeKey: 'time.3daysAgo' }],
      },
    ],
    orders: [],
    participations: [],
    sites: [],
    calls: [
      {
        id: 'call-reema-old',
        number: '05 0000 0021',
        calleeKey: 'case2.contact.reema.name',
        lines: [
          { who: 'them', textKey: 'case2.call.reema.l1' },
          { who: 'me', textKey: 'case2.call.reema.l2' },
          { who: 'them', textKey: 'case2.call.reema.l3' },
          { who: 'me', textKey: 'case2.call.reema.l4' },
          { who: 'them', textKey: 'case2.call.reema.l5' },
        ],
        evidence: ['E5'],
      },
    ],
  },
};
