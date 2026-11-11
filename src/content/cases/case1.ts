import type { Case } from '@/engine/types';

/**
 * Case 1 — The stalled shipment (الشحنة المتوقفة). Truth: scam.
 * Source: build-plan.md §7. All names, numbers and domains are fictional
 * (docs/brand-check.md). Player-facing text lives in src/i18n/*.json under "case1.*".
 */
export const case1: Case = {
  id: 'case1',
  titleKey: 'case1.title',
  introKey: 'case1.intro',
  setupKey: 'case1.setup',
  tools: ['sender', 'link', 'orders', 'site', 'call', 'interrupt'],
  truth: 'scam',
  incoming: { threadId: 't-rafeef', messageIds: ['m-rafeef-1'] },
  interrupt: {
    trigger: { kind: 'time', seconds: 45 },
    threadId: 't-wathba',
    relevant: true,
    evidence: ['E8'],
    message: {
      id: 'm-wathba-2',
      from: 'contact',
      bodyKey: 'case1.msg.wathba2',
      timeKey: 'time.now',
      evidence: ['E8'],
    },
  },
  evidence: [
    { id: 'E1', tool: 'sender', titleKey: 'case1.E1.title', bodyKey: 'case1.E1.body', supports: 'scam', strength: 'weak', techniques: ['authority'] },
    { id: 'E2', tool: 'link', titleKey: 'case1.E2.title', bodyKey: 'case1.E2.body', supports: 'scam', strength: 'weak', techniques: ['lookalike'] },
    { id: 'E3', tool: 'orders', titleKey: 'case1.E3.title', bodyKey: 'case1.E3.body', supports: 'legit', strength: 'weak', misleading: true },
    { id: 'E4', tool: 'orders', titleKey: 'case1.E4.title', bodyKey: 'case1.E4.body', supports: 'scam', strength: 'medium', techniques: ['authority'] },
    { id: 'E5', tool: 'site', titleKey: 'case1.E5.title', bodyKey: 'case1.E5.body', supports: 'scam', strength: 'medium', techniques: ['small-fee', 'urgency'] },
    { id: 'E6', tool: 'call', titleKey: 'case1.E6.title', bodyKey: 'case1.E6.body', supports: 'scam', strength: 'medium', techniques: ['authority'] },
    { id: 'E7', tool: 'link', titleKey: 'case1.E7.title', bodyKey: 'case1.E7.body', supports: 'scam', strength: 'weak', techniques: ['otp-request', 'lookalike'] },
    { id: 'E8', tool: 'interrupt', titleKey: 'case1.E8.title', bodyKey: 'case1.E8.body', supports: 'scam', strength: 'medium', techniques: ['fear', 'small-fee'] },
  ],
  deductions: [
    { id: 'D1', pair: ['E3', 'E4'], conclusionKey: 'case1.D1', proves: 'scam' },
    { id: 'D2', pair: ['E2', 'E5'], conclusionKey: 'case1.D2', proves: 'scam' },
    { id: 'D3', pair: ['E4', 'E6'], conclusionKey: 'case1.D3', proves: 'scam' },
    { id: 'D4', pair: ['E4', 'E8'], conclusionKey: 'case1.D4', proves: 'scam' },
  ],
  decisions: [
    {
      id: 'pay',
      textKey: 'case1.dec.pay',
      rating: 'harmful',
      usesOtherChannel: false,
      outcomeKey: 'case1.out.pay',
      altTimelineKey: 'case1.alt.pay',
      effects: { money: -2300, exposure: 'card', trust: -2 },
    },
    {
      id: 'call-msg-number',
      textKey: 'case1.dec.callMsgNumber',
      rating: 'risky',
      usesOtherChannel: false,
      outcomeKey: 'case1.out.callMsgNumber',
      altTimelineKey: 'case1.alt.callMsgNumber',
      effects: { exposure: 'otp', trust: -1 },
    },
    {
      id: 'ignore',
      textKey: 'case1.dec.ignore',
      rating: 'acceptable',
      usesOtherChannel: false,
      outcomeKey: 'case1.out.ignore',
      altTimelineKey: 'case1.alt.ignore',
      effects: { exposure: 'none', trust: 0 },
    },
    {
      id: 'official-app-report',
      textKey: 'case1.dec.officialAppReport',
      rating: 'best',
      usesOtherChannel: true,
      outcomeKey: 'case1.out.officialAppReport',
      altTimelineKey: 'case1.alt.officialAppReport',
      effects: { exposure: 'none', trust: 2 },
    },
  ],
  techniques: ['urgency', 'fear', 'small-fee', 'authority', 'lookalike'],
  planKey: 'case1.plan',
  familyQuestionKeys: ['case1.family.q1', 'case1.family.q2', 'case1.family.q3'],
  world: {
    contacts: [
      {
        id: 'c-rafeef-sms',
        nameKey: 'case1.contact.rafeefSms.name',
        number: '05 0000 0011',
        avatar: '؟',
        avatarTone: 'e',
        saved: false,
        facts: [
          { labelKey: 'sender.fact.type', valueKey: 'sender.value.mobileNumber' },
          { labelKey: 'sender.fact.officialId', valueKey: 'common.no' },
          { labelKey: 'sender.fact.saved', valueKey: 'common.no' },
        ],
        evidence: ['E1'],
      },
      {
        id: 'c-wathba',
        nameKey: 'case1.contact.wathba.name',
        avatar: 'خ',
        avatarTone: 'b',
        saved: false,
        facts: [
          { labelKey: 'sender.fact.type', valueKey: 'sender.value.senderId' },
          { labelKey: 'sender.fact.officialId', valueKey: 'common.yes' },
        ],
      },
      {
        id: 'c-mama',
        nameKey: 'contact.mama',
        number: '05 0000 0001',
        avatar: 'م',
        avatarTone: 'a',
        saved: true,
      },
    ],
    threads: [
      {
        id: 't-rafeef',
        app: 'messages',
        contactId: 'c-rafeef-sms',
        messages: [
          {
            id: 'm-rafeef-1',
            from: 'contact',
            bodyKey: 'case1.msg.rafeef1',
            timeKey: 'time.now',
            links: [
              {
                id: 'L1',
                url: 'https://rafeef-express-pay.example/f/7XQ2',
                officialUrl: 'https://rafeef-express.example',
                opens: { siteId: 'rafeef-fake', pageId: 'pay' },
                evidence: ['E2'],
              },
            ],
          },
        ],
      },
      {
        id: 't-wathba',
        app: 'messages',
        contactId: 'c-wathba',
        messages: [
          { id: 'm-wathba-1', from: 'contact', bodyKey: 'case1.msg.wathba1', timeKey: 'time.3daysAgo' },
        ],
      },
      {
        id: 't-mama',
        app: 'messages',
        contactId: 'c-mama',
        messages: [{ id: 'm-mama-1', from: 'contact', bodyKey: 'case1.msg.mama1', timeKey: 'time.yesterday' }],
      },
    ],
    orders: [
      {
        id: 'o-zahw-1',
        titleKey: 'case1.order1.title',
        storeKey: 'brand.zahw',
        statusKey: 'order.status.onTheWay',
        dateKey: 'time.3daysAgo',
        carrierKey: 'brand.wathba',
        paymentKey: 'order.payment.paidCard',
        evidence: { summary: ['E3'], details: ['E4'] },
      },
      {
        id: 'o-zahw-0',
        titleKey: 'case1.order0.title',
        storeKey: 'brand.zahw',
        statusKey: 'order.status.delivered',
        dateKey: 'time.lastMonth',
        carrierKey: 'brand.wathba',
        paymentKey: 'order.payment.paidCard',
      },
    ],
    participations: [],
    sites: [
      {
        id: 'rafeef-official',
        domain: 'rafeef-express.example',
        nameKey: 'brand.rafeef',
        official: true,
        pages: [
          {
            id: 'home',
            path: '/',
            titleKey: 'case1.site.rafeef.home.title',
            blocks: [
              { type: 'text', bodyKey: 'case1.site.rafeef.home.body' },
              { type: 'list', titleKey: 'site.nav', itemKeys: ['case1.site.rafeef.nav.policy', 'case1.site.rafeef.nav.contact'], pageIds: ['policy', 'contact'] },
            ],
          },
          {
            id: 'policy',
            path: '/policy',
            titleKey: 'case1.site.rafeef.policy.title',
            blocks: [{ type: 'text', bodyKey: 'case1.site.rafeef.policy.body', evidence: ['E5'] }],
          },
          {
            id: 'contact',
            path: '/contact',
            titleKey: 'case1.site.rafeef.contact.title',
            blocks: [{ type: 'contact', labelKey: 'site.officialNumber', number: '9200 00011' }],
          },
        ],
      },
      {
        id: 'rafeef-fake',
        domain: 'rafeef-express-pay.example',
        nameKey: 'case1.site.fake.name',
        official: false,
        pages: [
          {
            id: 'pay',
            path: '/f/7XQ2',
            titleKey: 'case1.site.fake.pay.title',
            blocks: [
              { type: 'text', bodyKey: 'case1.site.fake.pay.body' },
              {
                type: 'fake-form',
                titleKey: 'case1.site.fake.form.title',
                fieldKeys: ['form.cardNumber', 'form.expiry', 'form.cvv', 'form.otp'],
                submitKey: 'case1.site.fake.form.submit',
                warningKey: 'form.simWarning',
                evidence: ['E7'],
              },
            ],
          },
        ],
      },
    ],
    calls: [
      {
        id: 'call-rafeef-official',
        number: '9200 00011',
        calleeKey: 'case1.call.official.callee',
        lines: [
          { who: 'them', textKey: 'case1.call.official.l1' },
          { who: 'me', textKey: 'case1.call.official.l2' },
          { who: 'them', textKey: 'case1.call.official.l3' },
          { who: 'me', textKey: 'case1.call.official.l4' },
          { who: 'them', textKey: 'case1.call.official.l5' },
        ],
        evidence: ['E6'],
      },
      {
        id: 'call-scam-number',
        number: '05 0000 0011',
        calleeKey: 'case1.call.scam.callee',
        risky: true,
        lines: [
          { who: 'them', textKey: 'case1.call.scam.l1' },
          { who: 'me', textKey: 'case1.call.scam.l2' },
          { who: 'them', textKey: 'case1.call.scam.l3' },
        ],
      },
    ],
  },
};
