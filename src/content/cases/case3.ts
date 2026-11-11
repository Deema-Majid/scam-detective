import type { Case } from '@/engine/types';

/**
 * Case 3 — The fake prize (الجائزة الوهمية). Truth: scam.
 * Source: build-plan.md §7. The interrupt is EVENT-triggered: opening the claim
 * link inside the simulation makes a bank OTP arrive for 2,950 SAR (not 350).
 * Registered in ./index.ts in phase 3.
 */
export const case3: Case = {
  id: 'case3',
  titleKey: 'case3.title',
  introKey: 'case3.intro',
  setupKey: 'case3.setup',
  tools: ['sender', 'link', 'site', 'orders', 'call', 'interrupt'],
  truth: 'scam',
  incoming: { threadId: 't-rewards', messageIds: ['m-rew-1'] },
  interrupt: {
    trigger: { kind: 'event', event: 'open-link', id: 'L1' },
    threadId: 't-bank',
    relevant: true,
    evidence: ['E6'],
    message: { id: 'm-bank-otp', from: 'contact', bodyKey: 'case3.msg.bankOtp', timeKey: 'time.now', evidence: ['E6'] },
  },
  evidence: [
    { id: 'E1', tool: 'sender', titleKey: 'case3.E1.title', bodyKey: 'case3.E1.body', supports: 'scam', strength: 'weak', techniques: ['new-channel', 'authority'] },
    { id: 'E2', tool: 'link', titleKey: 'case3.E2.title', bodyKey: 'case3.E2.body', supports: 'scam', strength: 'weak', techniques: ['lookalike'] },
    { id: 'E3', tool: 'site', titleKey: 'case3.E3.title', bodyKey: 'case3.E3.body', supports: 'scam', strength: 'medium', techniques: ['reward', 'small-fee'] },
    { id: 'E4', tool: 'orders', titleKey: 'case3.E4.title', bodyKey: 'case3.E4.body', supports: 'scam', strength: 'weak', techniques: ['reward', 'leaked-details'] },
    { id: 'E5', tool: 'call', titleKey: 'case3.E5.title', bodyKey: 'case3.E5.body', supports: 'scam', strength: 'medium', techniques: ['authority'] },
    { id: 'E6', tool: 'interrupt', titleKey: 'case3.E6.title', bodyKey: 'case3.E6.body', supports: 'scam', strength: 'medium', techniques: ['otp-request', 'small-fee', 'urgency'] },
  ],
  deductions: [
    { id: 'D1', pair: ['E3', 'E4'], conclusionKey: 'case3.D1', proves: 'scam' },
    { id: 'D2', pair: ['E5', 'E3'], conclusionKey: 'case3.D2', proves: 'scam' },
    { id: 'D3', pair: ['E6', 'E2'], conclusionKey: 'case3.D3', proves: 'scam' },
  ],
  decisions: [
    {
      id: 'share-otp',
      textKey: 'case3.dec.shareOtp',
      rating: 'harmful',
      usesOtherChannel: false,
      outcomeKey: 'case3.out.shareOtp',
      altTimelineKey: 'case3.alt.shareOtp',
      effects: { money: -2950, exposure: 'otp', trust: -2 },
    },
    {
      id: 'pay-fee',
      textKey: 'case3.dec.payFee',
      rating: 'harmful',
      usesOtherChannel: false,
      outcomeKey: 'case3.out.payFee',
      altTimelineKey: 'case3.alt.payFee',
      effects: { money: -350, exposure: 'card', trust: -2 },
    },
    {
      id: 'ignore',
      textKey: 'case3.dec.ignore',
      rating: 'acceptable',
      usesOtherChannel: false,
      outcomeKey: 'case3.out.ignore',
      altTimelineKey: 'case3.alt.ignore',
      effects: { exposure: 'none', trust: 0 },
    },
    {
      id: 'refuse-freeze-report',
      textKey: 'case3.dec.refuseFreezeReport',
      rating: 'best',
      usesOtherChannel: true,
      outcomeKey: 'case3.out.refuseFreezeReport',
      altTimelineKey: 'case3.alt.refuseFreezeReport',
      effects: { exposure: 'none', trust: 2 },
    },
  ],
  techniques: ['reward', 'urgency', 'small-fee', 'authority', 'otp-request'],
  planKey: 'case3.plan',
  familyQuestionKeys: ['case3.family.q1', 'case3.family.q2', 'case3.family.q3'],
  world: {
    contacts: [
      {
        id: 'c-rewards',
        nameKey: 'case3.contact.rewards.name',
        handle: 'Lamha.Rewards',
        avatar: 'L',
        avatarTone: 'e',
        saved: false,
        facts: [
          { labelKey: 'sender.fact.accountAge', valueKey: 'case3.sender.age' },
          { labelKey: 'sender.fact.posts', valueKey: 'case3.sender.posts' },
          { labelKey: 'sender.fact.verified', valueKey: 'common.no' },
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
        id: 't-rewards',
        app: 'messages',
        contactId: 'c-rewards',
        messages: [
          {
            id: 'm-rew-1',
            from: 'contact',
            bodyKey: 'case3.msg.rew1',
            timeKey: 'time.now',
            links: [
              {
                id: 'L1',
                url: 'https://lamha-rewards-claim.example',
                officialUrl: 'https://lamha-store.example',
                opens: { siteId: 'lamha-fake', pageId: 'claim' },
                evidence: ['E2'],
              },
            ],
          },
        ],
      },
      {
        id: 't-bank',
        app: 'messages',
        contactId: 'c-bank',
        messages: [{ id: 'm-bank-1', from: 'contact', bodyKey: 'case3.msg.bank1', timeKey: 'time.yesterday' }],
      },
    ],
    orders: [
      {
        id: 'o-lamha-1',
        titleKey: 'case3.order1.title',
        storeKey: 'brand.lamha',
        statusKey: 'order.status.delivered',
        dateKey: 'time.lastMonth',
        carrierKey: 'brand.wathba',
        paymentKey: 'order.payment.paidCard',
      },
    ],
    participations: [
      {
        id: 'p-winter',
        contestKey: 'case3.contest.winter',
        organizerKey: 'brand.lamha',
        dateKey: 'time.2monthsAgo',
        evidence: ['E4'],
      },
    ],
    sites: [
      {
        id: 'lamha-official',
        domain: 'lamha-store.example',
        nameKey: 'brand.lamha',
        official: true,
        pages: [
          {
            id: 'home',
            path: '/',
            titleKey: 'case3.site.lamha.home.title',
            blocks: [
              { type: 'text', bodyKey: 'case3.site.lamha.home.body' },
              { type: 'list', titleKey: 'site.nav', itemKeys: ['case3.site.lamha.nav.contests', 'case3.site.lamha.nav.contact'] },
            ],
          },
          {
            id: 'contests',
            path: '/contests',
            titleKey: 'case3.site.lamha.contests.title',
            blocks: [{ type: 'text', bodyKey: 'case3.site.lamha.contests.body', evidence: ['E3'] }],
          },
          {
            id: 'contact',
            path: '/contact',
            titleKey: 'case3.site.lamha.contact.title',
            blocks: [{ type: 'contact', labelKey: 'site.officialNumber', number: '9200 00022' }],
          },
        ],
      },
      {
        id: 'lamha-fake',
        domain: 'lamha-rewards-claim.example',
        nameKey: 'case3.site.fake.name',
        official: false,
        pages: [
          {
            id: 'claim',
            path: '/',
            titleKey: 'case3.site.fake.claim.title',
            blocks: [
              { type: 'text', bodyKey: 'case3.site.fake.claim.body' },
              {
                type: 'fake-form',
                titleKey: 'case3.site.fake.form.title',
                fieldKeys: ['form.cardNumber', 'form.expiry', 'form.cvv', 'form.otp'],
                submitKey: 'case3.site.fake.form.submit',
                warningKey: 'form.simWarning',
              },
            ],
          },
        ],
      },
    ],
    calls: [
      {
        id: 'call-lamha-support',
        number: '9200 00022',
        calleeKey: 'case3.call.support.callee',
        lines: [
          { who: 'them', textKey: 'case3.call.support.l1' },
          { who: 'me', textKey: 'case3.call.support.l2' },
          { who: 'them', textKey: 'case3.call.support.l3' },
          { who: 'me', textKey: 'case3.call.support.l4' },
          { who: 'them', textKey: 'case3.call.support.l5' },
        ],
        evidence: ['E5'],
      },
    ],
  },
};
