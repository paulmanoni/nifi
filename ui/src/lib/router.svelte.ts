export type Route =
  | { name: 'flows' }
  | { name: 'flow'; id: string }
  | { name: 'connections' }
  | { name: 'parameters' }
  | { name: 'run'; id: string }
  | { name: 'notfound'; path: string };

function parse(hash: string): Route {
  const path = hash.replace(/^#/, '').replace(/\?.*$/, '') || '/flows';
  const parts = path.split('/').filter(Boolean).map(decodeURIComponent);
  if (parts.length === 0 || (parts[0] === 'flows' && parts.length === 1)) return { name: 'flows' };
  if (parts[0] === 'flows' && parts.length === 2) return { name: 'flow', id: parts[1] };
  if (parts[0] === 'connections') return { name: 'connections' };
  if (parts[0] === 'parameters') return { name: 'parameters' };
  if (parts[0] === 'runs' && parts.length === 2) return { name: 'run', id: parts[1] };
  return { name: 'notfound', path };
}

class Router {
  route = $state<Route>(parse(location.hash));
  constructor() {
    window.addEventListener('hashchange', () => (this.route = parse(location.hash)));
  }
}

export const router = new Router();

export function navigate(path: string) {
  const h = '#' + path;
  if (location.hash !== h) location.hash = h;
}

export const href = (path: string) => '#' + path;
