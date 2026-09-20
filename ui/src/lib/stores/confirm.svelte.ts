export type ConfirmRequest = {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  resolve: (ok: boolean) => void;
};

class ConfirmStore {
  current = $state<ConfirmRequest | null>(null);
  ask(opts: Omit<ConfirmRequest, 'resolve'>): Promise<boolean> {
    return new Promise((resolve) => {
      this.current = { ...opts, resolve };
    });
  }
  answer(ok: boolean) {
    const c = this.current;
    this.current = null;
    c?.resolve(ok);
  }
}

export const confirmStore = new ConfirmStore();
export const confirm = (opts: Omit<ConfirmRequest, 'resolve'>) => confirmStore.ask(opts);
