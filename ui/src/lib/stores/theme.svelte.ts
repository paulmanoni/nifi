export type ThemeChoice = 'light' | 'dark' | 'system';

const KEY = 'nifi.theme';

function load(): ThemeChoice {
  try {
    const v = localStorage.getItem(KEY);
    if (v === 'light' || v === 'dark' || v === 'system') return v;
  } catch {}
  return 'system';
}

const media = window.matchMedia('(prefers-color-scheme: dark)');

class Theme {
  choice = $state<ThemeChoice>(load());
  systemDark = $state(media.matches);
  resolved = $derived<'light' | 'dark'>(this.choice === 'system' ? (this.systemDark ? 'dark' : 'light') : this.choice);

  constructor() {
    media.addEventListener('change', (e) => (this.systemDark = e.matches));
  }
  set(c: ThemeChoice) {
    this.choice = c;
    try {
      localStorage.setItem(KEY, c);
    } catch {}
  }
  cycle() {
    this.set(this.resolved === 'dark' ? 'light' : 'dark');
  }
}

export const theme = new Theme();
