import type { Contact } from '@/engine/types';

const tones: Record<NonNullable<Contact['avatarTone']>, string> = {
  a: 'bg-[#4b6a8a] text-white',
  b: 'bg-[#8a6a3a] text-white',
  c: 'bg-[#5f7a4b] text-white',
  d: 'bg-[#7a4b6a] text-white',
  e: 'bg-surface-2 text-fg-muted border border-border',
};

export function Avatar({ contact, size = 'md' }: { contact: Contact; size?: 'sm' | 'md' | 'lg' }) {
  const dim = size === 'sm' ? 'h-8 w-8 text-sm' : size === 'lg' ? 'h-16 w-16 text-2xl' : 'h-11 w-11 text-base';
  return (
    <span aria-hidden className={`flex shrink-0 items-center justify-center rounded-full font-bold ${dim} ${tones[contact.avatarTone ?? 'e']}`}>
      {contact.avatar}
    </span>
  );
}
