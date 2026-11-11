import { useState } from 'react';
import type { Truth } from '@/engine/types';
import { isProofSufficient } from '@/engine/scoring';
import { useT } from '@/i18n/useT';
import { useGame } from '@/store/gameStore';
import { useCaseWorld } from '../useCaseWorld';
import { FlowHeader } from './CaseFlow';
import { Button } from '@/ui/Button';
import { ConfidenceSlider } from '@/ui/ConfidenceSlider';
import { Stamp } from '@/ui/Stamp';
import { IconLink, IconShield, IconWarning } from '@/ui/Icons';

/**
 * Verdict (A1): scam/legit -> proof (one deduction or two evidence; fewer is
 * allowed and yields a "partial" result) -> confidence 50..100 (must be moved)
 * -> stamp. The stamp animation plays here, then the store moves to 'decision'.
 */
export function VerdictScreen() {
  const { t } = useT();
  const w = useCaseWorld();
  const submitVerdict = useGame((s) => s.submitVerdict);
  const [truth, setTruth] = useState<Truth | null>(null);
  const [proof, setProof] = useState<string[]>([]);
  const [confidence, setConfidence] = useState(75);
  const [moved, setMoved] = useState(false);
  const [stamping, setStamping] = useState(false);
  if (!w) return null;
  const { c, run } = w;

  const deductions = run.deductions.map((id) => c.deductions.find((d) => d.id === id)!).filter(Boolean);
  const evidence = run.collected.map((id) => c.evidence.find((e) => e.id === id)!).filter(Boolean);
  const sufficient = truth ? isProofSufficient(c, truth, proof) : false;
  const canStamp = !!truth && moved && !stamping;

  const toggleProof = (id: string) => setProof((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const stamp = () => {
    if (!truth) return;
    setStamping(true);
    setTimeout(() => submitVerdict({ truth, confidence: confidence / 100, proof }), 650);
  };

  return (
    <div className="relative flex min-h-0 flex-1 flex-col" data-testid="verdict-screen">
      <FlowHeader title={t('verdict.title')} step={t('flow.step', { n: 1, total: 4 })} />
      {/* Ghost stamp behind the content, becomes the real stamp on confirm. */}
      {truth && (
        <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center" aria-hidden>
          {stamping ? <Stamp truth={truth} animate /> : <Stamp truth={truth} ghost />}
        </div>
      )}
      <div className="phone-scroll relative z-10 flex-1 px-4 py-4" role="region" tabIndex={0} aria-label={t('phone.scrollRegion')}>
        <h3 className="mb-3 text-lg font-bold leading-snug">{t('verdict.question')}</h3>
        <div className="mb-5 grid grid-cols-2 gap-3">
          <VerdictCard kind="scam" selected={truth === 'scam'} onClick={() => setTruth('scam')} />
          <VerdictCard kind="legit" selected={truth === 'legit'} onClick={() => setTruth('legit')} />
        </div>

        <h4 className="mb-1 text-base font-semibold">{t('verdict.proofQuestion')}</h4>
        <p className="mb-2 text-xs text-fg-muted">{t('verdict.proofHint')}</p>
        <div className="mb-2 flex flex-wrap gap-2" data-testid="proof-chips">
          {deductions.map((d) => (
            <Chip key={d.id} id={d.id} label={t(d.conclusionKey)} icon={<IconLink className="h-4 w-4" />} selected={proof.includes(d.id)} onClick={() => toggleProof(d.id)} />
          ))}
          {evidence.map((e) => (
            <Chip key={e.id} id={e.id} label={t(e.titleKey)} selected={proof.includes(e.id)} onClick={() => toggleProof(e.id)} />
          ))}
        </div>
        <p className={`mb-5 text-sm font-semibold ${sufficient ? 'text-legit' : 'text-warn'}`} data-testid={sufficient ? 'proof-ok' : 'proof-missing'} aria-live="polite">
          {truth ? (sufficient ? t('verdict.proofOk') : t('verdict.proofMissing')) : t('verdict.pickFirst')}
        </p>

        <ConfidenceSlider
          value={confidence}
          onChange={(v) => {
            setConfidence(v);
            setMoved(true);
          }}
        />
        {!moved && <p className="mt-1 text-xs text-fg-muted">{t('verdict.moveSlider')}</p>}
      </div>
      <div className="relative z-10 shrink-0 border-t border-border bg-bg p-3">
        <Button className="w-full" disabled={!canStamp} onClick={stamp} data-testid="stamp-verdict">
          {t('verdict.stamp')}
        </Button>
      </div>
    </div>
  );
}

function VerdictCard({ kind, selected, onClick }: { kind: Truth; selected: boolean; onClick: () => void }) {
  const { t } = useT();
  const tone = kind === 'scam' ? 'border-scam bg-scam-soft text-scam' : 'border-legit bg-legit-soft text-legit';
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      data-testid={`verdict-${kind}`}
      className={`flex min-h-[88px] flex-col items-center justify-center gap-1 rounded-2xl border-2 text-lg font-bold transition ${selected ? tone : 'border-border bg-surface text-fg hover:bg-surface-2'}`}
    >
      {kind === 'scam' ? <IconWarning className="h-7 w-7" /> : <IconShield className="h-7 w-7" />}
      {t(kind === 'scam' ? 'verdict.scam' : 'verdict.legit')}
    </button>
  );
}

function Chip({ id, label, icon, selected, onClick }: { id: string; label: string; icon?: React.ReactNode; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      data-testid={`proof-${id}`}
      className={`flex min-h-11 max-w-full items-center gap-1.5 rounded-full border px-3 text-start text-sm transition ${selected ? 'border-accent bg-accent-soft text-accent-ink' : 'border-border bg-surface text-fg'}`}
    >
      {icon}
      <span className="line-clamp-2">{label}</span>
    </button>
  );
}
