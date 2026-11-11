import { useCaseWorld } from '../useCaseWorld';
import { VerdictScreen } from './VerdictScreen';
import { DecisionScreen } from './DecisionScreen';
import { OutcomeScreen } from './OutcomeScreen';
import { DebriefScreen } from './DebriefScreen';

/** After the investigation, the phone screen is taken over by these steps in order. */
export function CaseFlow() {
  const w = useCaseWorld();
  if (!w) return null;
  switch (w.run.phase) {
    case 'verdict':
      return <VerdictScreen />;
    case 'decision':
      return <DecisionScreen />;
    case 'outcome':
      return <OutcomeScreen />;
    case 'debrief':
      return <DebriefScreen />;
    default:
      return null;
  }
}

/** Shared title bar for flow screens (no back button: the state machine only moves forward). */
export function FlowHeader({ title, step }: { title: string; step: string }) {
  return (
    <div className="flex h-12 shrink-0 items-center justify-between border-b border-border px-4">
      <h2 className="text-base font-bold text-accent-ink">{title}</h2>
      <span className="text-xs text-fg-muted">{step}</span>
    </div>
  );
}
