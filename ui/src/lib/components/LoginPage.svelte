<script lang="ts">
  import { auth } from '../stores/auth.svelte';
  import { LoaderCircle } from 'lucide-svelte';

  let username = $state('');
  let password = $state('');
  let error = $state('');
  let busy = $state(false);

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    if (!username || !password) return;
    busy = true;
    error = '';
    try {
      await auth.login(username.trim(), password);
      password = '';
    } catch (err) {
      error = (err as Error).message || 'invalid username or password';
    } finally {
      busy = false;
    }
  }
</script>

<div class="wrap">
  <form class="card login" onsubmit={submit}>
    <div class="brand">
      <svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true">
        <rect width="32" height="32" rx="7" fill="var(--accent)" />
        <circle cx="9" cy="10" r="3.2" fill="#fff" /><circle cx="9" cy="22" r="3.2" fill="#fff" /><circle cx="23" cy="16" r="3.6" fill="#fff" />
        <path d="M11.5 11.5 20 15M11.5 20.5 20 17" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" />
      </svg>
      <h1>{auth.meta?.title ?? 'Data Flows'}</h1>
    </div>
    <p class="sub">Sign in to continue</p>
    <div class="field">
      <label for="lg-user">Username</label>
      <!-- svelte-ignore a11y_autofocus -->
      <input id="lg-user" class="input" autocomplete="username" bind:value={username} autofocus />
    </div>
    <div class="field">
      <label for="lg-pass">Password</label>
      <input id="lg-pass" class="input" type="password" autocomplete="current-password" bind:value={password} />
    </div>
    {#if error}<div class="err" role="alert">{error}</div>{/if}
    <button class="btn primary full" type="submit" disabled={busy || !username || !password}>
      {#if busy}<LoaderCircle size={14} class="spin" />{/if} Sign in
    </button>
  </form>
</div>

<style>
  .wrap {
    height: 100%;
    display: grid;
    place-items: center;
    padding: 24px;
  }
  .login {
    width: 340px;
    max-width: 100%;
    padding: 28px 26px 24px;
    box-shadow: var(--shadow-lg);
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  h1 {
    font-size: 17px;
  }
  .sub {
    margin: 6px 0 20px;
    color: var(--text-3);
  }
  .err {
    margin: -2px 0 12px;
    padding: 6px 9px;
    border-radius: var(--radius);
    background: var(--err-soft);
    color: var(--err);
    font-size: 12px;
  }
  .full {
    width: 100%;
    justify-content: center;
    height: 32px;
  }
</style>
