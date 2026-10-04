import { AuthenticatorView } from './AuthenticatorView';

export function AuthenticatorPage({ notify, adding, setAdding }: { notify: (message: string) => void; adding: boolean; setAdding: (open: boolean) => void }) {
  return <AuthenticatorView notify={notify} adding={adding} setAdding={setAdding}/>;
}
