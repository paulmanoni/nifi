<script lang="ts">
  import { router, href } from './lib/router.svelte';
  import { theme } from './lib/stores/theme.svelte';
  import { auth } from './lib/stores/auth.svelte';
  import Toasts from './lib/components/Toasts.svelte';
  import ConfirmDialog from './lib/components/ConfirmDialog.svelte';
  import FlowsPage from './routes/FlowsPage.svelte';
  import ConnectionsPage from './routes/ConnectionsPage.svelte';
  import ParametersPage from './routes/ParametersPage.svelte';
  import RunPage from './routes/RunPage.svelte';
  import CanvasPage from './routes/CanvasPage.svelte';
  import LoginPage from './lib/components/LoginPage.svelte';
  import { Moon, Sun, Workflow, Plug, SlidersHorizontal, UserRound, LogIn, LoaderCircle, ShieldX, LogOut, ChevronDown } from 'lucide-svelte';

  $effect(() => {
    document.documentElement.dataset.theme = theme.resolved;
  });

  auth.load();

  let r = $derived(router.route);
  let menuOpen = $state(false);
  let gated = $derived(auth.signInRequired || !auth.loaded || auth.needsLogin);

  async function signOut() {
    menuOpen = false;
    await auth.logout();
  }
  let section = $derived(r.name === 'connections' ? 'connections' : r.name === 'parameters' ? 'parameters' : 'flows');
</script>

<div class="shell">
  <nav class="topbar">
    <a class="brand" href={href('/flows')}>
      <svg viewBox="0 0 32 32" width="20" height="20" aria-hidden="true">
        <rect width="32" height="32" rx="7" fill="var(--accent)" />
        <circle cx="9" cy="10" r="3.2" fill="#fff" /><circle cx="9" cy="22" r="3.2" fill="#fff" /><circle cx="23" cy="16" r="3.6" fill="#fff" />
        <path d="M11.5 11.5 20 15M11.5 20.5 20 17" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" />
      </svg>
      <span>{auth.meta?.title ?? 'Data Flows'}</span>
    </a>
    {#if !gated}
      <a class="nav" class:active={section === 'flows'} href={href('/flows')}><Workflow size={14} /> Flows</a>
      <a class="nav" class:active={section === 'connections'} href={href('/connections')}><Plug size={14} /> Connections</a>
      <a class="nav" class:active={section === 'parameters'} href={href('/parameters')}><SlidersHorizontal size={14} /> Parameters</a>
    {/if}
    <span class="spacer"></span>
    {#if auth.meta?.version}<span class="ver">v{auth.meta.version}</span>{/if}
    {#if auth.mode === 'builtin' && auth.user && !auth.needsLogin}
      <div class="umenu">
        <button class="user btnlike" onclick={() => (menuOpen = !menuOpen)} aria-haspopup="menu" aria-expanded={menuOpen}>
          <UserRound size={13} /> {auth.user} <ChevronDown size={12} />
        </button>
        {#if menuOpen}
          <button class="scrim" aria-label="Close menu" onclick={() => (menuOpen = false)}></button>
          <div class="menu" role="menu">
            <div class="mh">Signed in as <strong>{auth.user}</strong></div>
            <button role="menuitem" onclick={signOut}><LogOut size={13} /> Sign out</button>
          </div>
        {/if}
      </div>
    {:else if auth.mode !== 'none' && auth.user}
      <span class="user" title="Signed in as {auth.user}"><UserRound size={13} /> {auth.user}</span>
    {/if}
    <button class="btn ghost icon" title="Toggle theme" onclick={() => theme.cycle()}>
      {#if theme.resolved === 'dark'}<Sun size={15} />{:else}<Moon size={15} />{/if}
    </button>
  </nav>
  <main>
    {#if auth.signInRequired}
      <div class="gate">
        <LogIn size={30} />
        <h2>Sign in required</h2>
        <p>Your session has expired or you are not signed in. Sign in through the application that hosts this page, then retry.</p>
        {#if auth.signInMessage}<p class="small muted">{auth.signInMessage}</p>{/if}
        <button class="btn primary" onclick={() => auth.retry()}>Retry</button>
      </div>
    {:else if auth.loaded && auth.needsLogin}
      <LoginPage />
    {:else if !auth.loaded}
      <div class="gate">
        {#if auth.loadError}
          <h2>Could not reach the server</h2>
          <p>{auth.loadError}</p>
          <button class="btn" onclick={() => auth.load()}>Retry</button>
        {:else}
          <LoaderCircle size={22} class="spin" />
        {/if}
      </div>
    {:else if !auth.can.view}
      <div class="gate">
        <ShieldX size={30} />
        <h2>No access</h2>
        <p>You don't have permission to view data flows.</p>
      </div>
    {:else if r.name === 'flows'}
      <FlowsPage />
    {:else if r.name === 'flow'}
      {#key r.id}<CanvasPage id={r.id} />{/key}
    {:else if r.name === 'connections'}
      <ConnectionsPage />
    {:else if r.name === 'parameters'}
      <ParametersPage />
    {:else if r.name === 'run'}
      {#key r.id}<RunPage id={r.id} />{/key}
    {:else}
      <div class="empty"><h3>Not found</h3><a href={href('/flows')}>Back to flows</a></div>
    {/if}
  </main>
</div>

<Toasts />
<ConfirmDialog />

<style>
  .shell {
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  .topbar {
    height: var(--topbar-h);
    flex: none;
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 0 12px;
    background: var(--bg-elev);
    border-bottom: 1px solid var(--border);
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 650;
    font-size: 14px;
    color: var(--text);
    margin-right: 16px;
    text-decoration: none;
  }
  .nav {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 28px;
    padding: 0 10px;
    border-radius: var(--radius);
    color: var(--text-2);
    font-weight: 500;
    text-decoration: none;
  }
  .nav:hover {
    background: var(--bg-hover);
    color: var(--text);
  }
  .nav.active {
    background: var(--accent-soft);
    color: var(--accent-text);
  }
  .user {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    height: 24px;
    padding: 0 9px;
    margin-right: 4px;
    border-radius: 999px;
    background: var(--bg-sunken);
    color: var(--text-2);
    font-size: 12px;
    font-weight: 500;
  }
  .umenu {
    position: relative;
  }
  .btnlike {
    border: none;
    cursor: pointer;
    font: inherit;
    font-size: 12px;
  }
  .btnlike:hover {
    background: var(--bg-hover);
  }
  .scrim {
    position: fixed;
    inset: 0;
    z-index: 40;
    background: transparent;
    border: none;
  }
  .menu {
    position: absolute;
    right: 0;
    top: calc(100% + 4px);
    z-index: 41;
    min-width: 180px;
    padding: 4px;
    background: var(--bg-elev);
    border: 1px solid var(--border-strong);
    border-radius: var(--radius);
    box-shadow: var(--shadow-lg);
  }
  .menu .mh {
    padding: 6px 8px 8px;
    font-size: 12px;
    color: var(--text-3);
    border-bottom: 1px solid var(--border);
    margin-bottom: 4px;
  }
  .menu button {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 6px 8px;
    border: none;
    background: none;
    border-radius: var(--radius-sm);
    color: var(--text);
    font: inherit;
    cursor: pointer;
    text-align: left;
  }
  .menu button:hover {
    background: var(--bg-hover);
  }
  .gate {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 24px;
    text-align: center;
    color: var(--text-3);
  }
  .gate h2 {
    color: var(--text);
    font-size: 16px;
  }
  .gate p {
    max-width: 420px;
    margin: 0;
    color: var(--text-2);
  }
  .ver {
    font-size: 11px;
    color: var(--text-3);
    margin-right: 6px;
  }
  main {
    flex: 1;
    min-height: 0;
    overflow: auto;
    position: relative;
  }
</style>
