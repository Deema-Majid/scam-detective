import type { Case } from '@/engine/types';

/**
 * Case 4 — The sloppy message that is real (الرسالة الركيكة). Truth: LEGIT.
 * Breaks the "every case is a scam" pattern: the message looks suspicious
 * (sloppy spelling, unsaved number, a little urgency) but asks for nothing and
 * every detail checks out. Misleading evidence here points to "scam".
 * Registered in ./index.ts together with the legit-case UI changes.
 */
export const case4: Case = {
  id: 'case4',
  titleKey: 'case4.title',
  introKey: 'case4.intro',
  setupKey: 'case4.setup',
  tools: ['sender', 'orders', 'site', 'call'],
  truth: 'legit',
  incoming: { threadId: 't-driver', messageIds: ['m-driver-1'] },
  evidence: [
    { id: 'E1', tool: 'sender', titleKey: 'case4.E1.title', bodyKey: 'case4.E1.body', supports: 'scam', strength: 'weak', misleading: true },
    { id: 'E2', tool: 'orders', titleKey: 'case4.E2.title', bodyKey: 'case4.E2.body', supports: 'legit', strength: 'weak' },
    { id: 'E3', tool: 'orders', titleKey: 'case4.E3.title', bodyKey: 'case4.E3.body', supports: 'legit', strength: 'medium' },
    { id: 'E4', tool: 'site', titleKey: 'case4.E4.title', bodyKey: 'case4.E4.body', supports: 'legit', strength: 'medium' },
    { id: 'E5', tool: 'call', titleKey: 'case4.E5.title', bodyKey: 'case4.E5.body', supports: 'legit', strength: 'medium' },
    { id: 'E6', tool: 'sender', titleKey: 'case4.E6.title', bodyKey: 'case4.E6.body', supports: 'scam', strength: 'weak', misleading: true },
  ],
  deductions: [
    { id: 'D1', pair: ['E2', 'E3'], conclusionKey: 'case4.D1', proves: 'legit' },
    { id: 'D2', pair: ['E3', 'E5'], conclusionKey: 'case4.D2', proves: 'legit' },
    { id: 'D3', pair: ['E4', 'E6'], conclusionKey: 'case4.D3', proves: 'legit' },
  ],
  decisions: [
    {
      id: 'check-app-then-door',
      textKey: 'case4.dec.checkAppThenDoor',
      rating: 'best',
      usesOtherChannel: true,
      outcomeKey: 'case4.out.checkAppThenDoor',
      altTimelineKey: 'case4.alt.checkAppThenDoor',
      effects: { exposure: 'none', trust: 2 },
    },
    {
      id: 'go-door',
      textKey: 'case4.dec.goDoor',
      rating: 'acceptable',
      usesOtherChannel: false,
      outcomeKey: 'case4.out.goDoor',
      altTimelineKey: 'case4.alt.goDoor',
      effects: { exposure: 'none', trust: 0 },
    },
    {
      id: 'ignore',
      textKey: 'case4.dec.ignore',
      rating: 'risky',
      usesOtherChannel: false,
      outcomeKey: 'case4.out.ignore',
      altTimelineKey: 'case4.alt.ignore',
      effects: { exposure: 'none', trust: -1 },
    },
    {
      id: 'block-report',
      textKey: 'case4.dec.blockReport',
      rating: 'risky',
      usesOtherChannel: false,
      outcomeKey: 'case4.out.blockReport',
      altTimelineKey: 'case4.alt.blockReport',
      effects: { exposure: 'none', trust: -1 },
    },
  ],
  techniques: [],
  planKey: 'case4.plan',
  familyQuestionKeys: ['case4.family.q1', 'case4.family.q2', 'case4.family.q3'],
  world: {
    contacts: [
      {
        id: 'c-driver',
        nameKey: 'case4.contact.driver.name',
        number: '05 0000 0092',
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
    ],
    threads: [
      {
        id: 't-driver',
        app: 'messages',
        contactId: 'c-driver',
        messages: [{ id: 'm-driver-1', from: 'contact', bodyKey: 'case4.msg.driver1', timeKey: 'time.now', evidence: ['E6'] }],
      },
    ],
    orders: [
      {
        id: 'o-zahw-3',
        titleKey: 'case4.order.title',
        storeKey: 'brand.zahw',
        statusKey: 'case4.order.status',
        dateKey: 'time.today',
        carrierKey: 'brand.wathba',
        paymentKey: 'order.payment.paidCard',
        evidence: { summary: ['E2'], details: ['E3'] },
      },
    ],
    participations: [],
    sites: [
      {
        id: 'wathba-official',
        domain: 'wathba-delivery.example',
        nameKey: 'brand.wathba',
        official: true,
        pages: [
          {
            id: 'home',
            path: '/',
            titleKey: 'case4.site.home.title',
            blocks: [
              { type: 'text', bodyKey: 'case4.site.home.body' },
              { type: 'list', titleKey: 'site.nav', itemKeys: ['case4.site.nav.drivers', 'case4.site.nav.contact'] },
            ],
          },
          {
            id: 'drivers',
            path: '/drivers',
            titleKey: 'case4.site.drivers.title',
            blocks: [{ type: 'text', bodyKey: 'case4.site.drivers.body', evidence: ['E4'] }],
          },
          {
            id: 'contact',
            path: '/contact',
            titleKey: 'case4.site.contact.title',
            blocks: [{ type: 'contact', labelKey: 'site.officialNumber', number: '9200 00033' }],
          },
        ],
      },
    ],
    calls: [
      {
        id: 'call-wathba-support',
        number: '9200 00033',
        calleeKey: 'case4.call.support.callee',
        lines: [
          { who: 'them', textKey: 'case4.call.support.l1' },
          { who: 'me', textKey: 'case4.call.support.l2' },
          { who: 'them', textKey: 'case4.call.support.l3' },
          { who: 'me', textKey: 'case4.call.support.l4' },
          { who: 'them', textKey: 'case4.call.support.l5' },
        ],
        evidence: ['E5'],
      },
    ],
  },
};
