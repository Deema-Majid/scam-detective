import { usePhone } from '@/store/phoneStore';
import { useCaseWorld } from './useCaseWorld';
import { HomeScreen } from './HomeScreen';
import { MessagesApp } from './apps/MessagesApp';
import { NotebookApp } from './apps/NotebookApp';
import { OrdersApp } from './apps/OrdersApp';
import { BrowserApp } from './apps/BrowserApp';
import { DialerApp } from './apps/DialerApp';
import { SettingsApp } from './apps/SettingsApp';
import { SheetHost } from './sheets/Sheets';
import { Toast } from './Toast';
import { CaseFlow } from './flow/CaseFlow';

/**
 * Routes the simulated phone. During investigation it shows the open app;
 * from the verdict onwards the flow screens take over the whole phone screen.
 */
export function PhoneScreen() {
  const app = usePhone((s) => s.app);
  const w = useCaseWorld();
  const phase = w?.run.phase;
  const inFlow = phase === 'verdict' || phase === 'decision' || phase === 'outcome' || phase === 'debrief';

  if (inFlow) {
    return (
      <>
        <CaseFlow />
        <Toast />
      </>
    );
  }

  return (
    <>
      {app === 'home' && <HomeScreen />}
      {app === 'messages' && <MessagesApp app="messages" />}
      {app === 'chats' && <MessagesApp app="chats" />}
      {app === 'notebook' && <NotebookApp />}
      {app === 'orders' && <OrdersApp />}
      {app === 'browser' && <BrowserApp />}
      {app === 'dialer' && <DialerApp />}
      {app === 'settings' && <SettingsApp />}
      <SheetHost />
      <Toast />
    </>
  );
}
