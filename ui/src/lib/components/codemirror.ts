// Loaded via dynamic import so CodeMirror lands in its own chunk.
import { basicSetup } from 'codemirror';
import { EditorView, Decoration, keymap, type DecorationSet } from '@codemirror/view';
import { EditorState, StateEffect, StateField, Compartment, Prec } from '@codemirror/state';
import { indentWithTab } from '@codemirror/commands';
import { indentUnit } from '@codemirror/language';
import { python } from '@codemirror/lang-python';

const setErrorLine = StateEffect.define<number | null>();

const errorLineField = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(deco, tr) {
    deco = deco.map(tr.changes);
    for (const e of tr.effects) {
      if (e.is(setErrorLine)) {
        const line = e.value;
        if (line == null || line < 1 || line > tr.state.doc.lines) deco = Decoration.none;
        else {
          const l = tr.state.doc.line(line);
          deco = Decoration.set([Decoration.line({ class: 'cm-error-line' }).range(l.from)]);
        }
      }
    }
    if (tr.docChanged) deco = Decoration.none;
    return deco;
  },
  provide: (f) => EditorView.decorations.from(f),
});

const baseTheme = EditorView.theme({
  '&': {
    height: '100%',
    fontSize: '12.5px',
    backgroundColor: 'var(--bg-elev)',
    color: 'var(--text)',
  },
  '.cm-scroller': { fontFamily: 'var(--mono)', lineHeight: '1.55' },
  '.cm-gutters': {
    backgroundColor: 'var(--bg-sunken)',
    color: 'var(--text-3)',
    borderRight: '1px solid var(--border)',
  },
  '.cm-activeLine': { backgroundColor: 'color-mix(in srgb, var(--accent-soft) 45%, transparent)' },
  '.cm-activeLineGutter': { backgroundColor: 'var(--bg-hover)' },
  '.cm-cursor': { borderLeftColor: 'var(--text)' },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection': {
    backgroundColor: 'color-mix(in srgb, var(--accent) 28%, transparent) !important',
  },
  '.cm-error-line': { backgroundColor: 'var(--err-soft)', boxShadow: 'inset 3px 0 0 var(--err)' },
  '&.cm-focused': { outline: 'none' },
  '.cm-tooltip': { backgroundColor: 'var(--bg-elev)', border: '1px solid var(--border-strong)' },
});

export type EditorHandle = {
  setDoc: (s: string) => void;
  getDoc: () => string;
  setErrorLine: (line: number | null) => void;
  setDark: (dark: boolean) => void;
  focus: () => void;
  destroy: () => void;
};

export function createEditor(
  parent: HTMLElement,
  opts: { doc: string; language: 'python' | 'plain'; dark: boolean; onChange: (s: string) => void; onRun?: () => void; readOnly?: boolean },
): EditorHandle {
  const darkC = new Compartment();
  const exts = [
    basicSetup,
    baseTheme,
    errorLineField,
    indentUnit.of('    '),
    Prec.highest(keymap.of(opts.onRun ? [{ key: 'Mod-Enter', run: () => (opts.onRun!(), true) }] : [])),
    keymap.of([indentWithTab]),
    darkC.of(EditorView.theme({}, { dark: opts.dark })),
    EditorView.updateListener.of((u) => {
      if (u.docChanged) opts.onChange(u.state.doc.toString());
    }),
  ];
  if (opts.language === 'python') exts.push(python());
  if (opts.readOnly) exts.push(EditorState.readOnly.of(true), EditorView.editable.of(false));
  const view = new EditorView({ state: EditorState.create({ doc: opts.doc, extensions: exts }), parent });
  return {
    setDoc(s) {
      if (s === view.state.doc.toString()) return;
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: s } });
    },
    getDoc: () => view.state.doc.toString(),
    setErrorLine(line) {
      view.dispatch({ effects: setErrorLine.of(line) });
      if (line && line <= view.state.doc.lines) {
        view.dispatch({ effects: EditorView.scrollIntoView(view.state.doc.line(line).from, { y: 'center' }) });
      }
    },
    setDark(dark) {
      view.dispatch({ effects: darkC.reconfigure(EditorView.theme({}, { dark })) });
    },
    focus: () => view.focus(),
    destroy: () => view.destroy(),
  };
}
