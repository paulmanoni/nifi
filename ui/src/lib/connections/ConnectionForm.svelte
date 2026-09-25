<script lang="ts">
  // Adding a connection here rather than in the application's code. The
  // password is write-only: it is sent, never returned, and left blank on an
  // edit it keeps whatever is already stored — so opening this dialog to
  // change a port cannot blank a credential by omission.
  import { api } from '../api/client';
  import type { Connection, ConnectionInput, Driver } from '../api/types';
  import Modal from '../components/Modal.svelte';
  import { toast } from '../stores/toast.svelte';
  import { Check, X, CircleX, Plug, LoaderCircle, CircleCheck } from 'lucide-svelte';

  let { existing, onclose, onsaved }: { existing?: Connection | null; onclose: () => void; onsaved: () => void } = $props();

  const defaults: Record<Driver, number> = { postgres: 5432, mysql: 3306 };

  // svelte-ignore state_referenced_locally
  let id = $state(existing?.id ?? '');
  // svelte-ignore state_referenced_locally
  let f = $state<ConnectionInput>({
    name: existing?.name ?? '',
    driver: existing?.driver ?? 'postgres',
    host: existing?.host ?? 'localhost',
    port: existing?.port ?? defaults[existing?.driver ?? 'postgres'],
    user: existing?.user ?? '',
    password: '',
    database: existing?.database ?? '',
    description: existing?.description ?? '',
  });
  let saving = $state(false);
  let error = $state('');
  let tested = $state<'ok' | 'fail' | 'pending' | null>(null);
  let testMsg = $state('');

  let isNew = $derived(!existing);
  let canSave = $derived(!!id.trim() && !!f.host.trim() && !!f.database.trim());

  function driverChanged(d: Driver) {
    if (f.port === defaults[f.driver]) f.port = defaults[d];
    f.driver = d;
  }

  async function save() {
    saving = true;
    error = '';
    try {
      await api.saveConnection(id.trim(), { ...f, name: f.name.trim() || id.trim() });
      toast.success(`Connection ${id.trim()} saved`);
      onsaved();
    } catch (e) {
      error = (e as Error).message;
    } finally {
      saving = false;
    }
  }

  // Testing needs the connection to exist, so it is saved first — the same
  // thing the operator would do by hand, without the round trip.
  async function saveAndTest() {
    tested = 'pending';
    testMsg = '';
    try {
      await api.saveConnection(id.trim(), { ...f, name: f.name.trim() || id.trim() });
      const r = await api.testConnection(id.trim());
      tested = r.ok ? 'ok' : 'fail';
      testMsg = r.ok ? `${r.serverVersion} · ${r.latencyMs} ms` : r.error;
      onsaved();
    } catch (e) {
      tested = 'fail';
      testMsg = (e as Error).message;
    }
  }
</script>

<Modal title={isNew ? 'New connection' : `Edit ${existing?.name || existing?.id}`} width="560px" {onclose}>
  <div class="grid">
    <div class="field">
      <label for="cf-id">Id</label>
      <input id="cf-id" class="input mono" bind:value={id} disabled={!isNew} placeholder="warehouse" />
      <span class="help">{isNew ? 'What flows refer to. It cannot be changed later.' : 'Fixed once created.'}</span>
    </div>
    <div class="field">
      <label for="cf-name">Name</label>
      <input id="cf-name" class="input" bind:value={f.name} placeholder={id || 'Warehouse'} />
    </div>
    <div class="field">
      <label for="cf-driver">Driver</label>
      <select id="cf-driver" class="select" value={f.driver} onchange={(e) => driverChanged(e.currentTarget.value as Driver)}>
        <option value="postgres">PostgreSQL</option>
        <option value="mysql">MySQL</option>
      </select>
    </div>
    <div class="field">
      <label for="cf-db">Database</label>
      <input id="cf-db" class="input mono" bind:value={f.database} placeholder="app" />
    </div>
    <div class="field">
      <label for="cf-host">Host</label>
      <input id="cf-host" class="input mono" bind:value={f.host} placeholder="localhost" />
    </div>
    <div class="field">
      <label for="cf-port">Port</label>
      <input id="cf-port" class="input mono num" type="number" bind:value={f.port} />
    </div>
    <div class="field">
      <label for="cf-user">User</label>
      <input id="cf-user" class="input mono" bind:value={f.user} autocomplete="off" />
    </div>
    <div class="field">
      <label for="cf-pw">Password</label>
      <input id="cf-pw" class="input mono" type="password" bind:value={f.password} autocomplete="new-password"
        placeholder={isNew ? '' : 'unchanged'} />
      <span class="help">Stored on the server and never sent back to the browser.</span>
    </div>
    <div class="field wide">
      <label for="cf-desc">Description</label>
      <input id="cf-desc" class="input" bind:value={f.description} placeholder="what this database is for" />
    </div>
  </div>

  {#if tested === 'ok'}
    <div class="callout ok"><CircleCheck size={15} /> <span>Connected · {testMsg}</span></div>
  {:else if tested === 'fail'}
    <div class="callout err"><CircleX size={15} /> <span>{testMsg}</span></div>
  {/if}
  {#if error}<div class="callout err"><CircleX size={15} /> <span>{error}</span></div>{/if}

  {#snippet footer()}
    <button class="btn" onclick={saveAndTest} disabled={!canSave || tested === 'pending'}>
      {#if tested === 'pending'}<LoaderCircle size={13} class="spin" />{:else}<Plug size={13} />{/if} Save and test
    </button>
    <span class="spacer"></span>
    <button class="btn" onclick={onclose}><X size={13} /> Cancel</button>
    <button class="btn primary" onclick={save} disabled={!canSave || saving}><Check size={13} /> Save</button>
  {/snippet}
</Modal>

<style>
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0 12px;
  }
  .wide {
    grid-column: 1 / -1;
  }
</style>
