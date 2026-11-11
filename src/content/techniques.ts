import type { Technique } from '@/engine/types';

/** The scammer's playbook (A3). Keys resolve in src/i18n/*.json. */
export const TECHNIQUES: Record<Technique, { nameKey: string; descKey: string; icon: string }> = {
  urgency: { nameKey: 'tech.urgency.name', descKey: 'tech.urgency.desc', icon: '⏱' },
  authority: { nameKey: 'tech.authority.name', descKey: 'tech.authority.desc', icon: '🏛' },
  reward: { nameKey: 'tech.reward.name', descKey: 'tech.reward.desc', icon: '🎁' },
  fear: { nameKey: 'tech.fear.name', descKey: 'tech.fear.desc', icon: '⚠' },
  secrecy: { nameKey: 'tech.secrecy.name', descKey: 'tech.secrecy.desc', icon: '🤫' },
  'new-channel': { nameKey: 'tech.new-channel.name', descKey: 'tech.new-channel.desc', icon: '📲' },
  familiarity: { nameKey: 'tech.familiarity.name', descKey: 'tech.familiarity.desc', icon: '🫂' },
  'small-fee': { nameKey: 'tech.small-fee.name', descKey: 'tech.small-fee.desc', icon: '🪙' },
  'leaked-details': { nameKey: 'tech.leaked-details.name', descKey: 'tech.leaked-details.desc', icon: '🧩' },
  'otp-request': { nameKey: 'tech.otp-request.name', descKey: 'tech.otp-request.desc', icon: '🔐' },
  lookalike: { nameKey: 'tech.lookalike.name', descKey: 'tech.lookalike.desc', icon: '🪞' },
};

export const ALL_TECHNIQUES = Object.keys(TECHNIQUES) as Technique[];
