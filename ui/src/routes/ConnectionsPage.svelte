<script lang="ts">
  import { api } from '../lib/api/client';
  import type { Connection, ConnectionTestResult } from '../lib/api/types';
  import { catalog } from '../lib/stores/catalog.svelte';
  import { auth } from '../lib/stores/auth.svelte';
  import { toast } from '../lib/stores/toast.svelte';
  import Skeleton from '../lib/components/Skeleton.svelte';
  import Modal from '../lib/components/Modal.svelte';
  import TableBrowser from '../lib/connections/TableBrowser.svelte';
  import { Plug, Table2, CircleCheck, CircleX, LoaderCircle, Database, Code } from 'lucide-svelte';

  let browsing = $state<Connection | null>(null);
  let tests = $state<Record<string, ConnectionTestResult | 'pending'>>({});

  catalog.loadConnections(true).catch(toast.error);

  async function test(c: Connection) {
    tests[c.id] = 'pending';
    try {
      tests[c.id] = await api.testConnection(c.id);
    } catch (e) {
      tests[c.id] = { ok: false, error: (e as Error).message };
    }
  }

  const snippet = `nifi.New(nifi.Config{
    DataPath: "var/nifi.db",
    Connections: []nifi.Connection{
        {ID: "legacy", Driver: "mysql", Host: "10.0.0.5", User: "ro",
         Password: os.Getenv("LEGACY_PW"), Database: "app"},
        {ID: "main", Driver: "postgres", Host: "localhost", User: "app",
         Password: os.Getenv("PG_PW"), Database: "app",
         Description: "primary Postgres"},
    },
})`;
</script>

<div class="page">
  <div class="page-head">
    <h1>Connections</h1>
    <span class="badge">{catalog.connections.length}</span>
    <span class="spacer"></span>
    <span class="muted small"><Code size={12} /> Declared by the host application in code · read-only</span>
  </div>

  {#if !catalog.connectionsLoaded}
    <div class="card"><Skeleton rows={4} /></div>
  {:else if catalog.connections.length === 0}
    <div class="card empty-conn">
      <Plug size={30} />
      <h3>No connections configured</h3>
      <p>
        Connections are declared in Go by the application that embeds this engine — credentials stay in the host's
        config and never reach the browser. Add them to <code>nifi.Config</code>:
      </p>
      <pre>{snippet}</pre>
    </div>
  {:else}
    <div class="grid">
      {#each catalog.connections as c (c.id)}
        {@const t = tests[c.id]}
        <div class="card conn">
          <div class="top">
            <span class="dbic {c.driver}"><Database size={16} /></span>
            <div class="names">
              <div class="name">{c.name || c.id}</div>
              <div class="mono tiny muted">id: {c.id}</div>
            </div>
            <span class="badge {c.driver === 'postgres' ? 'info' : 'warn'}">{c.driver}</span>
          </div>
          <div class="ep mono">{c.user ? `${c.user}@` : ''}{c.host}{c.port ? `:${c.port}` : ''}/{c.database}</div>
          {#if c.description}<p class="desc">{c.description}</p>{/if}
          {#if t && t !== 'pending'}
            {#if t.ok}
              <div class="res ok"><CircleCheck size={14} /> Connected · <span class="mono">{t.serverVersion}</span> · {t.latencyMs} ms</div>
            {:else}
              <div class="res err"><CircleX size={14} /> <span>{t.error}</span></div>
            {/if}
          {/if}
          {#if auth.can.data}
            <div class="actions">
              <button class="btn sm" onclick={() => test(c)} disabled={t === 'pending'}>
                {#if t === 'pending'}<LoaderCircle size={13} class="spin" />{:else}<Plug size={13} />{/if} Test
              </button>
              <button class="btn sm" onclick={() => (browsing = c)}><Table2 size={13} /> Browse tables</button>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>

{#if browsing}
  <Modal title="{browsing.name || browsing.id} · {browsing.database}" width="min(1100px, 96vw)" height="min(720px, 90vh)" onclose={() => (browsing = null)}>
    <div class="browse"><TableBrowser conn={browsing} /></div>
  </Modal>
{/if}

<style>
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 12px;
  }
  .conn {
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .top {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .dbic {
    width: 32px;
    height: 32px;
    display: grid;
    place-items: center;
    border-radius: var(--radius);
    background: var(--info-soft);
    color: var(--info);
  }
  .dbic.mysql {
    background: var(--warn-soft);
    color: var(--warn);
  }
  .names {
    flex: 1;
    min-width: 0;
  }
  .name {
    font-weight: 600;
    font-size: 14px;
  }
  .ep {
    color: var(--text-2);
    word-break: break-all;
  }
  .desc {
    margin: 0;
    color: var(--text-2);
  }
  .actions {
    display: flex;
    gap: 6px;
    margin-top: 2px;
  }
  .res {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    padding: 6px 8px;
    border-radius: var(--radius);
    font-size: 12px;
    word-break: break-word;
  }
  .res :global(svg) {
    flex: none;
    margin-top: 1px;
  }
  .res.ok {
    background: var(--ok-soft);
    color: var(--ok);
  }
  .res.err {
    background: var(--err-soft);
    color: var(--err);
  }
  .empty-conn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 40px 24px;
    text-align: center;
    color: var(--text-3);
  }
  .empty-conn h3 {
    color: var(--text);
    font-size: 15px;
  }
  .empty-conn p {
    max-width: 560px;
    margin: 0;
    color: var(--text-2);
  }
  .empty-conn pre {
    text-align: left;
    margin: 6px 0 0;
    padding: 12px 14px;
    background: var(--bg-sunken);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    font-family: var(--mono);
    font-size: 12px;
    color: var(--text);
    overflow: auto;
    max-width: 100%;
  }
  .browse {
    height: calc(min(720px, 90vh) - 90px);
    margin: -16px;
  }
</style>
