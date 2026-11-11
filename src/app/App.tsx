import { useEffect } from 'react';
import { useGame, type Screen as ScreenId } from '@/store/gameStore';
import { useT } from '@/i18n/useT';
import { IntroScreen } from './IntroScreen';
import { CaseScreen } from './CaseScreen';
import { SummaryScreen } from './SummaryScreen';
import { TesterCodeScreen } from './TesterCodeScreen';
import { ConsentScreen } from './ConsentScreen';
import { TestScreen } from './TestScreen';
import { FeedbackScreen } from './FeedbackScreen';
import { ResultsCodeScreen } from './ResultsCodeScreen';
import { FamilyCardScreen } from './FamilyCardScreen';

/**
 * Screen router. There is no URL router: the game is a single page and the
 * mode comes from query params (?tester=1, ?mode=family&case=case1, ?lang=en).
 * Theme and language live in the in-phone Settings app (design §11.1); the only
 * control outside the phone is a small language button on the intro page.
 */
export function App() {
  const screen = useGame((s) => s.screen);
  const syncModeWithUrl = useGame((s) => s.syncModeWithUrl);
  const { t } = useT();

  // The URL decides the mode on every load. A different saved mode means a
  // clean new session; the same mode resumes where the player was.
  useEffect(() => {
    syncModeWithUrl(window.location.search);
  }, [syncModeWithUrl]);

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only no-print fixed start-3 top-3 z-50 rounded-full bg-accent px-3 py-1.5 text-sm text-accent-fg">
        {t('app.skipToContent')}
      </a>
      <Screen screen={screen} />
    </>
  );
}

function Screen({ screen }: { screen: ScreenId }) {
  switch (screen) {
    case 'case':
      return <CaseScreen />;
    case 'summary':
      return <SummaryScreen />;
    case 'tester-code':
      return <TesterCodeScreen />;
    case 'consent':
      return <ConsentScreen />;
    case 'pretest':
      return <TestScreen which="pre" />;
    case 'posttest':
      return <TestScreen which="post" />;
    case 'feedback':
      return <FeedbackScreen />;
    case 'results-code':
      return <ResultsCodeScreen />;
    case 'family-card':
      return <FamilyCardScreen />;
    default:
      return <IntroScreen />;
  }
}
