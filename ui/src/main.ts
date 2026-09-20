import { mount } from 'svelte';
import './app.css';
import '@xyflow/svelte/dist/style.css';
import './flow.css';
import App from './App.svelte';

const app = mount(App, { target: document.getElementById('app')! });

export default app;
