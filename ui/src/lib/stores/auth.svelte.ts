import { api, authHooks, ApiError } from '../api/client';
import type { Meta, Permissions } from '../api/types';
import { toasts } from './toast.svelte';

const ALL: Permissions = { view: true, edit: true, run: true, data: true };

/** What a denied endpoint would have done, for the 403 toast. */
function describe(method: string, path: string): string {
  const p = path.replace(/\?.*$/, '');
  if (/\/connections\/test$/.test(p)) return 'test connections';
  if (/\/connections\/[^/]+\/tables/.test(p)) return 'browse table data';
  if (/\/flows\/(preview|schema)$/.test(p)) return 'preview data';
  if (/\/flows\/sink-plan$/.test(p)) return 'inspect target tables';
  if (/\/deadletters$/.test(p)) return 'view dead-lettered rows';
  if (/\/(script|expr)\/test$/.test(p)) return 'test scripts and expressions';
  if (/\/flows\/[^/]+\/runs$/.test(p) && method === 'POST') return 'run flows';
  if (/\/runs\/(all|stop-all)$/.test(p)) return 'run flows';
  if (/\/runs\/[^/]+\/(pause|resume|stop)$/.test(p)) return 'control runs';
  if (/\/flows\/wizard$/.test(p)) return 'create flows';
  if (/\/flows/.test(p) && method !== 'GET' && !/validate$/.test(p)) return 'edit flows';
  return 'do that';
}

/** Session identity + permissions from GET /api/meta, loaded once at startup. */
class Auth {
  meta = $state<Meta | null>(null);
  loaded = $state(false);
  signInRequired = $state(false);
  signInMessage = $state('');
  loadError = $state('');

  /** Missing fields (older engine) are treated as allowed; explicit false denies. */
  mode = $derived(this.meta?.auth ?? 'none');
  /** Built-in login is enabled and this browser has no valid session → show the login form. */
  needsLogin = $derived(this.mode === 'builtin' && this.meta?.authenticated === false);

  can = $derived<Permissions>({ ...ALL, ...(this.meta?.permissions ?? {}) });
  user = $derived(this.meta?.user ?? '');

  constructor() {
    authHooks.unauthorized = (msg) => {
      if (this.mode === 'builtin') {
        // session expired: drop back to the login form
        if (this.meta) this.meta = { ...this.meta, authenticated: false, user: '' };
        return;
      }
      this.signInRequired = true;
      this.signInMessage = msg;
    };
    authHooks.forbidden = (err: ApiError, method, path) => {
      err.handled = true;
      toasts.push('error', `You don't have permission to ${describe(method, path)}.`);
    };
  }

  async login(username: string, password: string) {
    await api.login(username, password);
    await this.load();
  }

  async logout() {
    try {
      await api.logout();
    } finally {
      await this.load();
    }
  }

  /** Retry after a host-owned sign-in (no form: the host app handles login). */
  async retry() {
    this.signInRequired = false;
    this.signInMessage = '';
    await this.load();
  }

  async load() {
    this.loadError = '';
    try {
      const m = await api.meta();
      this.meta = m;
      if (m?.title) document.title = m.title;
      // Anonymous caller the host won't even let view: that's a sign-in problem, not a permission one.
      if (m?.auth !== 'builtin' && m?.authenticated === false && m.permissions && !m.permissions.view) this.signInRequired = true;
      this.loaded = true;
    } catch (e) {
      if (!(e instanceof ApiError && e.status === 401)) this.loadError = (e as Error).message;
    }
  }
}

export const auth = new Auth();
