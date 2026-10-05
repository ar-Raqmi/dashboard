import { useSyncExternalStore } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/** Holds the browser's deferred install prompt, which fires once and early, before React has mounted. */
class InstallPromptService {
  private deferred: BeforeInstallPromptEvent | null = null;
  private installed = window.matchMedia('(display-mode: standalone)').matches;
  private readonly listeners = new Set<() => void>();
  private snapshot = this.read();

  constructor() {
    window.addEventListener('beforeinstallprompt', event => {
      event.preventDefault();
      this.deferred = event as BeforeInstallPromptEvent;
      this.publish();
    });
    window.addEventListener('appinstalled', () => {
      this.deferred = null;
      this.installed = true;
      this.publish();
    });
  }

  readonly subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };
  readonly getSnapshot = () => this.snapshot;

  async install() {
    if (!this.deferred) return;
    await this.deferred.prompt();
    await this.deferred.userChoice;
    this.deferred = null;
    this.publish();
  }

  private read() {
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
    return { canInstall: !!this.deferred, installed: this.installed, ios };
  }

  private publish() {
    this.snapshot = this.read();
    this.listeners.forEach(listener => listener());
  }
}

const service = new InstallPromptService();

export function useInstallPrompt() {
  const state = useSyncExternalStore(service.subscribe, service.getSnapshot);
  return { ...state, install: () => service.install() };
}
