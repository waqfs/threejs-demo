import { EditorState } from '@codemirror/state';
import { EditorView, drawSelection, highlightActiveLine, keymap, lineNumbers } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { HighlightStyle, indentOnInput, syntaxHighlighting } from '@codemirror/language';
import { javascript } from '@codemirror/lang-javascript';
import { tags } from '@lezer/highlight';
import { presets } from './presets.js';
import './style.css';

const byId = (id) => document.getElementById(id);
const preview = byId('preview');
const status = byId('status');
const workspace = byId('workspace');
const divider = byId('divider');
const expandButton = byId('expand');
const themeButton = byId('theme');
const previewError = byId('preview-error');
const resetCode = byId('reset-code');
const systemTheme = matchMedia('(prefers-color-scheme: dark)');
const storagePrefix = 'threejs-playground:';

function read(key) {
  try {
    return localStorage.getItem(storagePrefix + key);
  } catch {
    return null;
  }
}

function save(key, value) {
  try {
    if (value === null) localStorage.removeItem(storagePrefix + key);
    else localStorage.setItem(storagePrefix + key, value);
  } catch {
    // The open editor states still retain drafts if storage is unavailable.
  }
}

let theme = read('theme');
function applyTheme() {
  const current = theme ?? (systemTheme.matches ? 'dark' : 'light');
  document.documentElement.dataset.theme = current;
  const description = `Switch to ${current === 'dark' ? 'light' : 'dark'} mode`;
  themeButton.setAttribute('aria-label', description);
  themeButton.title = description;
}

themeButton.addEventListener('click', () => {
  theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  save('theme', theme);
  applyTheme();
});
systemTheme.addEventListener('change', applyTheme);
applyTheme();

function setStatus(state, message) {
  status.dataset.state = state;
  byId('message').textContent = message;
}

function postToPreview(message) {
  preview.contentWindow.postMessage(message, '*');
}

let activePreset = presetFromHash();
let ready = false;
let timer;
let runId = 0;

function runCode() {
  clearTimeout(timer);
  if (!ready) return;
  setStatus('loading', 'Updating preview…');
  postToPreview({
    type: 'run',
    id: ++runId,
    code: editor.state.doc.toString(),
    showGrid: activePreset.showGrid ?? true,
    wideView: activePreset.wideView ?? false,
  });
}

const highlighting = HighlightStyle.define([
  { tag: [tags.keyword, tags.bool], color: 'var(--syntax-keyword)' },
  { tag: [tags.number, tags.string], color: 'var(--syntax-literal)' },
  { tag: [tags.typeName, tags.className], color: 'var(--syntax-type)' },
  { tag: tags.comment, color: 'var(--syntax-comment)' },
  { tag: tags.function(tags.variableName), color: 'var(--syntax-type)' },
]);

const editorExtensions = [
  lineNumbers(),
  EditorView.lineWrapping,
  history(),
  drawSelection(),
  highlightActiveLine(),
  indentOnInput(),
  javascript(),
  syntaxHighlighting(highlighting),
  keymap.of([
    { key: 'Mod-Enter', run: () => { runCode(); return true; } },
    ...defaultKeymap,
    ...historyKeymap,
  ]),
  EditorView.contentAttributes.of({
    'aria-label': 'JavaScript code',
    autocapitalize: 'off',
    autocorrect: 'off',
    spellcheck: 'false',
  }),
  EditorView.updateListener.of((update) => {
    if (!update.docChanged) return;
    const code = update.state.doc.toString();
    const unchanged = code === activePreset.code;
    save(activePreset.id, unchanged ? null : code);
    resetCode.disabled = unchanged;
    if (ready) setStatus('loading', 'Updating preview…');
    clearTimeout(timer);
    timer = setTimeout(runCode, 480);
  }),
];

const drafts = new Map();

function stateFor(preset) {
  if (!drafts.has(preset.id)) {
    drafts.set(preset.id, EditorState.create({
      doc: read(preset.id) ?? preset.code,
      extensions: editorExtensions,
    }));
  }
  return drafts.get(preset.id);
}

const editor = new EditorView({ state: stateFor(activePreset), parent: byId('editor') });

function presetFromHash() {
  return presets.find(({ id }) => location.hash === `#${id}`) ?? presets[0];
}

const buttons = new Map(presets.map((preset) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = preset.label;
  button.addEventListener('click', () => {
    if (activePreset !== preset) location.hash = preset.id;
  });
  byId('presets').append(button);
  return [preset.id, button];
}));

function updatePresetButtons() {
  for (const [id, button] of buttons) {
    button.setAttribute('aria-pressed', String(id === activePreset.id));
  }
  resetCode.disabled = editor.state.doc.toString() === activePreset.code;
}
updatePresetButtons();

window.addEventListener('hashchange', () => {
  const next = presetFromHash();
  if (next === activePreset) return;
  drafts.set(activePreset.id, editor.state);
  activePreset = next;
  editor.setState(stateFor(next));
  updatePresetButtons();
  runCode();
});

byId('run').addEventListener('click', runCode);
resetCode.addEventListener('click', () => {
  editor.dispatch({
    changes: { from: 0, to: editor.state.doc.length, insert: activePreset.code },
  });
  runCode();
});

byId('reset-view').addEventListener('click', () => {
  if (ready) postToPreview({ type: 'reset-view' });
});

function setExpanded(expanded) {
  if (expanded) workspace.dataset.expanded = '';
  else delete workspace.dataset.expanded;
  byId('navigation').inert = expanded;
  byId('code-panel').inert = expanded;
  divider.inert = expanded;
  expandButton.setAttribute('aria-expanded', String(expanded));
  const label = expanded ? 'Close expanded preview' : 'Expand preview';
  expandButton.setAttribute('aria-label', label);
  expandButton.title = label;
  expandButton.focus();
}

expandButton.addEventListener('click', () => setExpanded(!workspace.hasAttribute('data-expanded')));
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && workspace.hasAttribute('data-expanded')) setExpanded(false);
});

function setSplit(percent) {
  const value = Math.min(70, Math.max(30, Math.round(percent)));
  workspace.style.setProperty('--split', `${value}%`);
  divider.setAttribute('aria-valuenow', value);
}

divider.addEventListener('pointerdown', (event) => {
  divider.setPointerCapture(event.pointerId);
  event.preventDefault();
});
divider.addEventListener('pointermove', (event) => {
  if (!divider.hasPointerCapture(event.pointerId)) return;
  const { left, width } = workspace.getBoundingClientRect();
  setSplit(100 * (event.clientX - left) / width);
});
divider.addEventListener('keydown', (event) => {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
  const current = Number(divider.getAttribute('aria-valuenow'));
  const values = { ArrowLeft: current - 2, ArrowRight: current + 2, Home: 30, End: 70 };
  setSplit(values[event.key]);
  event.preventDefault();
});
divider.addEventListener('dblclick', () => setSplit(50));

const startupTimeout = setTimeout(() => {
  showPreviewError('The preview could not load. Reload to try again.');
}, 10000);

function showPreviewError(message) {
  setStatus('error', message);
  previewError.textContent = message;
  previewError.hidden = false;
}

window.addEventListener('message', ({ source, data }) => {
  if (source !== preview.contentWindow) return;
  if (data?.type === 'ready') {
    clearTimeout(startupTimeout);
    previewError.hidden = true;
    ready = true;
    runCode();
  } else if (data?.type === 'unavailable') {
    clearTimeout(startupTimeout);
    showPreviewError(data.message);
  } else if (data?.type === 'escape' && workspace.hasAttribute('data-expanded')) {
    setExpanded(false);
  } else if (data?.id === runId) {
    if (data.type === 'running') setStatus('live', 'Live');
    if (data.type === 'error') setStatus('error', data.message);
  }
});

preview.src = new URL('./runner.html', location.href);
