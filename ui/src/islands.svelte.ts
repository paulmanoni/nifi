// The islands: the parts of the UI that are interactive diagrams, mounted
// into server-rendered pages by nifi.js (mount(el, name, props)). Built by
// `npm run build` into internal/web/assets/islands and embedded.
import { mount as svelteMount } from 'svelte';
import './app.css';
import '@xyflow/svelte/dist/style.css';
import './flow.css';
import Canvas from './islands/Canvas.svelte';
import DepGraph from './islands/DepGraph.svelte';

const components = { canvas: Canvas, depgraph: DepGraph } as const;

// The stylesheet is one file beside this module; a page that never mounts an
// island never loads it.
let styled = false;
function style() {
  if (styled) return;
  styled = true;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = new URL(/* @vite-ignore */ './islands.css', import.meta.url).href;
  document.head.appendChild(link);
}

export function mount(el: HTMLElement, name: keyof typeof components, initial: Record<string, unknown>) {
  const component = components[name];
  if (!component) throw new Error(`no island named ${name}`);
  style();
  el.classList.add('nifi-island');
  // Props are reactive: a server re-render hands the island its new props.
  const props = $state({ ...initial });
  el.addEventListener('nifi:props', (e) => Object.assign(props, (e as CustomEvent).detail));
  svelteMount(component as never, { target: el, props });
}
