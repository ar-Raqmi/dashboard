import { Icon } from '@/components/Icon';
import { useInstallPrompt } from '@/pwa/installPrompt';
import { Row } from './fields';

export function AppGroup() {
  const { canInstall, installed, ios, install } = useInstallPrompt();
  const hint = installed ? 'Running as an installed app.'
    : canInstall ? 'Add it to your home screen or desktop.'
    : ios ? 'In Safari, tap Share, then Add to Home Screen.'
    : 'Use your browser menu and choose Install app.';

  return <div className="settings-group"><span className="eyebrow">APP</span>
    <Row title="Install app" hint={hint}>
      {canInstall && <button className="button" type="button" onClick={() => void install()}><Icon name="download" size={14}/>Install</button>}
    </Row>
  </div>;
}
