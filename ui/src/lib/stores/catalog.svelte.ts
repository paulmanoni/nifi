import { api } from '../api/client';
import type { Connection, ExprFunction, Option, ProcessorSpec } from '../api/types';

/** Shared, lazily loaded reference data (processor catalog, types, connections). */
class Catalog {
  processors = $state<ProcessorSpec[]>([]);
  processorsLoaded = $state(false);
  types = $state<Option[]>([]);
  functions = $state<ExprFunction[]>([]);
  connections = $state<Connection[]>([]);
  connectionsLoaded = $state(false);

  byType = $derived(new Map(this.processors.map((p) => [p.type, p])));

  private pProcessors?: Promise<void>;
  private pTypes?: Promise<void>;
  private pFunctions?: Promise<void>;
  private pConnections?: Promise<void>;

  loadProcessors() {
    return (this.pProcessors ??= api.processors().then((p) => {
      this.processors = p ?? [];
      this.processorsLoaded = true;
    }).catch((e) => {
      this.pProcessors = undefined;
      throw e;
    }));
  }
  loadTypes() {
    return (this.pTypes ??= api.types().then((t) => {
      this.types = t ?? [];
    }).catch(() => {
      this.pTypes = undefined;
    }));
  }
  loadFunctions() {
    return (this.pFunctions ??= api
      .functions()
      .then((f) => {
        this.functions = f ?? [];
      })
      .catch(() => {
        this.pFunctions = undefined;
      }));
  }
  loadConnections(force = false) {
    if (force) this.pConnections = undefined;
    return (this.pConnections ??= api.connections().then((c) => {
      this.connections = c ?? [];
      this.connectionsLoaded = true;
    }).catch((e) => {
      this.pConnections = undefined;
      throw e;
    }));
  }
}

export const catalog = new Catalog();
