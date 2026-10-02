// nifi.js — the UI's only script outside the canvas island. Pages are
// rendered on the server; this keeps them current and makes their controls
// work:
//
//   live      body[data-live]: "instance" follows /api/live, "run:<id>" a
//             run's event stream; each event re-fetches the page's live
//             regions (X-Nifi-Partial, ETag) and morphs them in place.
//   actions   [data-post] buttons and form[data-json] call the JSON API,
//             with [data-confirm] confirmations and toasts.
//   lists     ?q= search, [data-param] selects and same-page links swap the
//             page in place; flow selection survives every refresh.
//   islands   [data-island] elements mount the canvas bundle's components.
//
// Nothing here owns state the server doesn't: a refresh is always safe.
(() => {
  'use strict'
  const $ = (sel, root = document) => root.querySelector(sel)
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)]
  const base = (window.__NIFI__ && window.__NIFI__.base) || ''
  const api = (p) => base + '/api' + p
  const ls = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v) } catch { return d } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)) } catch {} },
  }

  // Old links used the hash router: #/flows/x → /flows/x.
  if (location.hash.startsWith('#/')) location.replace(base + location.hash.slice(1).replace(/\?.*$/, ''))

  // ---------- theme ----------
  document.addEventListener('click', (e) => {
    if (!e.target.closest('[data-theme-toggle]')) return
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    try { localStorage.setItem('nifi.theme', next) } catch {}
  })

  // ---------- toasts ----------
  const ICON = { info: 'ℹ', success: '✓', error: '✕', warn: '!' }
  function toast(kind, message, ttl, details) {
    const box = $('#nf-toasts')
    if (!box) return
    const el = document.createElement('div')
    el.className = 'nf-toast'
    el.dataset.kind = kind
    el.setAttribute('role', kind === 'error' ? 'alert' : 'status')
    const icon = document.createElement('b')
    icon.textContent = ICON[kind] || ''
    icon.style.color = kind === 'success' ? 'var(--nf-ok)' : kind === 'error' ? 'var(--nf-err)' : kind === 'warn' ? 'var(--nf-warn)' : 'var(--nf-accent)'
    const body = document.createElement('div')
    body.style.flex = '1'
    body.style.minWidth = '0'
    const msg = document.createElement('div')
    msg.textContent = message
    body.appendChild(msg)
    if (details && details.lines && details.lines.length) {
      const more = document.createElement('details')
      const sum = document.createElement('summary')
      sum.textContent = '▸ ' + details.title
      sum.style.cursor = 'pointer'
      sum.style.color = 'var(--nf-text-3)'
      more.appendChild(sum)
      const ul = document.createElement('ul')
      ul.style.cssText = 'max-height:180px;overflow:auto;margin:4px 0 0;padding-left:16px'
      for (const line of details.lines) {
        const li = document.createElement('li')
        li.textContent = line
        ul.appendChild(li)
      }
      more.appendChild(ul)
      body.appendChild(more)
    }
    const x = document.createElement('button')
    x.type = 'button'
    x.textContent = '×'
    x.title = 'Dismiss'
    x.style.cssText = 'border:0;background:none;cursor:pointer;color:var(--nf-text-3);font-size:15px;line-height:1'
    x.onclick = () => el.remove()
    el.append(icon, body, x)
    box.appendChild(el)
    setTimeout(() => el.remove(), ttl || (kind === 'error' ? 7000 : 3500))
  }
  window.nifiToast = toast
  // A toast announcing a navigation is shown on the page it leads to.
  function toastThen(kind, message, href) {
    try { sessionStorage.setItem('nifi.toast', JSON.stringify([kind, message])) } catch {}
    location.href = href
  }
  try {
    const pending = sessionStorage.getItem('nifi.toast')
    if (pending) {
      sessionStorage.removeItem('nifi.toast')
      const [kind, message] = JSON.parse(pending)
      document.addEventListener('DOMContentLoaded', () => toast(kind, message))
    }
  } catch {}

  // ---------- confirm ----------
  function confirmDialog({ title, message, label, danger }) {
    const dlg = $('#nf-confirm')
    if (!dlg) return Promise.resolve(window.confirm(message))
    $('[data-confirm-title]', dlg).textContent = title || 'Confirm'
    $('[data-confirm-message]', dlg).textContent = message
    const yes = $('[data-confirm-yes]', dlg)
    yes.textContent = label || 'Confirm'
    yes.classList.toggle('!bg-destructive', !!danger)
    yes.classList.toggle('!border-destructive', !!danger)
    return new Promise((resolve) => {
      const no = $('[data-confirm-no]', dlg)
      const done = (ok) => { cleanup(); dlg.close(); resolve(ok) }
      const onYes = () => done(true)
      const onNo = () => done(false)
      const onClose = () => { cleanup(); resolve(false) }
      const cleanup = () => {
        yes.removeEventListener('click', onYes)
        no.removeEventListener('click', onNo)
        dlg.removeEventListener('close', onClose)
      }
      yes.addEventListener('click', onYes)
      no.addEventListener('click', onNo)
      dlg.addEventListener('close', onClose)
      dlg.showModal()
      yes.focus()
    })
  }
  window.nifiConfirm = confirmDialog

  // ---------- dialogs and menus ----------
  document.addEventListener('click', (e) => {
    const open = e.target.closest('[data-open]')
    if (open && !open.disabled) {
      const dlg = document.getElementById(open.dataset.open)
      if (dlg) {
        dlg.dispatchEvent(new CustomEvent('nifi:open', { detail: open }))
        dlg.showModal()
        const first = $('[autofocus]', dlg)
        if (first) first.focus()
      }
      return
    }
    const close = e.target.closest('[data-close]')
    if (close) {
      const dlg = close.closest('dialog')
      if (dlg) dlg.close()
      return
    }
    // A click on a dialog's backdrop closes it.
    if (e.target.tagName === 'DIALOG' && e.target.id !== 'nf-confirm') e.target.close()
    // A click outside an open menu closes it.
    for (const m of $$('details[data-menu][open]')) if (!m.contains(e.target)) m.open = false
  })
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') for (const m of $$('details[data-menu][open]')) m.open = false
  })

  // ---------- relative times ----------
  // <time data-ago|data-clock|data-when datetime=…> render as a fixed stamp
  // on the server; here they read in the browser's locale and keep counting.
  function relative(t, now) {
    const sec = (now - t) / 1000
    const a = Math.abs(sec)
    let x
    if (a < 45) return sec >= 0 ? 'just now' : 'in a moment'
    else if (a < 3600) x = Math.round(a / 60) + 'm'
    else if (a < 86400) x = Math.round(a / 3600) + 'h'
    else if (a < 86400 * 30) x = Math.round(a / 86400) + 'd'
    else return new Date(t).toLocaleDateString()
    return sec >= 0 ? x + ' ago' : 'in ' + x
  }
  function tick() {
    const now = Date.now()
    for (const el of $$('time[datetime]')) {
      const t = Date.parse(el.getAttribute('datetime'))
      if (isNaN(t)) continue
      let text
      if (el.hasAttribute('data-ago')) text = relative(t, now)
      else if (el.hasAttribute('data-clock')) text = new Date(t).toLocaleTimeString(undefined, { hour12: false })
      else if (el.hasAttribute('data-when')) text = new Date(t).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })
      else continue
      if (el.textContent !== text) el.textContent = text
    }
  }
  setInterval(tick, 15000)

  // ---------- morph ----------
  // Patch `from` to look like `to`, keeping what the user is doing: the
  // focused field, <details> they opened, checkbox state, anything marked
  // data-keep, and mounted islands (which are handed their new props).
  function morph(from, to) {
    if (from.nodeType !== to.nodeType || from.nodeName !== to.nodeName ||
        (from.nodeType === 1 && (from.id || '') !== (to.id || ''))) {
      from.replaceWith(to.cloneNode(true))
      return
    }
    if (from.nodeType !== 1) {
      if (from.nodeValue !== to.nodeValue) from.nodeValue = to.nodeValue
      return
    }
    if (from.hasAttribute('data-keep')) return
    if (from.hasAttribute('data-island') && from.hasAttribute('data-mounted')) {
      const props = to.getAttribute('data-props')
      if (props !== from.getAttribute('data-props')) {
        from.setAttribute('data-props', props)
        from.dispatchEvent(new CustomEvent('nifi:props', { detail: JSON.parse(props || 'null') }))
      }
      return
    }
    if (from.tagName === 'TIME' && from.getAttribute('datetime') === to.getAttribute('datetime')) return
    if (from.tagName === 'DIALOG' && from.open) return
    const focused = from === document.activeElement
    for (const a of [...from.attributes]) {
      if (to.hasAttribute(a.name)) continue
      if (a.name === 'open' && from.tagName === 'DETAILS') continue
      if (a.name === 'data-filtered-out') continue
      from.removeAttribute(a.name)
    }
    for (const a of [...to.attributes]) {
      if (a.name === 'open' && from.tagName === 'DETAILS') continue
      if (focused && a.name === 'value') continue
      if (from.getAttribute(a.name) !== a.value) from.setAttribute(a.name, a.value)
    }
    if (from.tagName === 'INPUT' || from.tagName === 'TEXTAREA') return
    if (from.tagName === 'SELECT') {
      if (!focused) from.value = to.value
      return
    }
    const a = [...from.childNodes]
    const b = [...to.childNodes]
    for (let i = 0; i < b.length; i++) {
      if (i < a.length) morph(a[i], b[i])
      else from.appendChild(b[i].cloneNode(true))
    }
    for (let i = b.length; i < a.length; i++) a[i].remove()
  }

  // ---------- refresh ----------
  let inflight = null
  let queued = false
  let last = 0
  let etag = ''
  let etagURL = ''
  const MIN_GAP = 1000

  function refresh(now) {
    if (inflight) { queued = true; return }
    const wait = now ? 0 : last + MIN_GAP - Date.now()
    if (wait > 0) { queued = true; setTimeout(flush, wait); return }
    last = Date.now()
    const href = location.href
    const headers = { 'X-Nifi-Partial': '1' }
    if (etag && etagURL === href) headers['If-None-Match'] = etag
    inflight = fetch(href, { headers, credentials: 'same-origin', cache: 'no-store' })
      .then((r) => {
        setLive(true)
        if (r.status === 304) return
        if (r.status === 401 || r.status === 403) { location.reload(); return }
        etag = r.headers.get('ETag') || ''
        etagURL = href
        return r.text().then((html) => {
          if (href !== location.href) return
          const doc = new DOMParser().parseFromString('<body>' + html + '</body>', 'text/html')
          const status = doc.getElementById('nf-status')
          if (status && $('#nf-status')) morph($('#nf-status'), status)
          const main = $('#nf-main')
          const next = doc.getElementById('nf-main')
          if (main && next && !main.hasAttribute('data-static')) {
            morph(main, next)
            if (next.dataset.title) document.title = next.dataset.title + ' · ' + ((window.__NIFI__ && window.__NIFI__.title) || 'Data Flows')
          }
          afterRender()
        })
      })
      .catch(() => setLive(false))
      .finally(() => { inflight = null; if (queued) flush() })
  }
  function flush() { queued = false; refresh() }
  window.nifiRefresh = () => refresh(true)

  function setLive(ok) {
    const dot = $('[data-live-dot]')
    const label = $('[data-live-label]')
    if (dot) dot.style.background = ok ? '' : 'var(--nf-warn)'
    if (label) label.textContent = ok ? 'live' : 'reconnecting…'
  }

  function stream(url, events, onEvent) {
    let retry = 0
    let closed = false
    const open = () => {
      const es = new EventSource(url)
      es.onopen = () => { retry = 0; setLive(true) }
      for (const name of events) {
        es.addEventListener(name, () => {
          if (onEvent(name) === 'close') { closed = true; es.close() }
        })
      }
      es.onerror = () => {
        es.close()
        if (closed) return
        setLive(false)
        setTimeout(open, Math.min(10000, 500 * 2 ** retry++))
      }
    }
    open()
  }

  const live = document.body.dataset.live || ''
  if (live === 'instance') {
    stream(api('/live'), ['flows', 'runs'], () => { if (!document.hidden) refresh() })
  } else if (live.startsWith('run:')) {
    const id = live.slice(4)
    stream(api('/runs/' + encodeURIComponent(id) + '/events'), ['detail', 'bulletin', 'end'], (name) => {
      refresh(name === 'end')
      if (name === 'end') return 'close'
    })
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden && live) refresh(true) })

  // ---------- navigation within a page ----------
  // Links that stay on this page (views, sort, folders, tabs, paging)
  // swap the page in place instead of reloading it.
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]')
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || a.target) return
    const main = $('#nf-main')
    if (!main || main.hasAttribute('data-static') || !main.contains(a)) return
    const url = new URL(a.href, location.href)
    if (url.origin !== location.origin || url.pathname !== location.pathname) return
    e.preventDefault()
    go(url)
  })
  window.addEventListener('popstate', () => refresh(true))

  function go(url, replace) {
    replace ? history.replaceState(null, '', url) : history.pushState(null, '', url)
    remember()
    refresh(true)
  }

  // ?q= search: type, and the page re-renders on the server.
  let searchTimer = 0
  document.addEventListener('input', (e) => {
    const input = e.target.closest('input[data-query]')
    if (!input) return
    clearTimeout(searchTimer)
    searchTimer = setTimeout(() => {
      const url = new URL(location.href)
      const q = input.value.trim()
      q ? url.searchParams.set(input.dataset.query || 'q', q) : url.searchParams.delete(input.dataset.query || 'q')
      url.searchParams.delete('offset')
      go(url, true)
    }, 220)
  })
  // A [data-param] select sets that query param.
  document.addEventListener('change', (e) => {
    const sel = e.target.closest('select[data-param]')
    if (!sel) return
    const url = new URL(location.href)
    sel.value ? url.searchParams.set(sel.dataset.param, sel.value) : url.searchParams.delete(sel.dataset.param)
    url.searchParams.delete('offset')
    go(url)
  })

  // The flow list remembers its view, sort and folder.
  const REMEMBER = ['view', 'sort', 'folder']
  function remember() {
    if (!$('[data-flows-page]')) return
    const url = new URL(location.href)
    const keep = {}
    for (const k of REMEMBER) if (url.searchParams.has(k)) keep[k] = url.searchParams.get(k)
    ls.set('nifi.flowsQuery', keep)
  }
  function restoreFlows() {
    if (!$('[data-flows-page]') || location.search) return
    const keep = ls.get('nifi.flowsQuery', {})
    const url = new URL(location.href)
    for (const k of REMEMBER) if (keep[k]) url.searchParams.set(k, keep[k])
    if (url.search) go(url, true)
  }

  // ---------- rows ----------
  document.addEventListener('click', (e) => {
    const row = e.target.closest('[data-href]')
    if (!row || e.target.closest('a,button,input,textarea,select,summary,label,details,dialog')) return
    if (e.metaKey || e.ctrlKey) window.open(row.dataset.href, '_blank')
    else location.href = row.dataset.href
  })

  // ---------- selection ----------
  const selected = new Set()
  function applySelection() {
    const boxes = $$('input[data-select]')
    const present = new Set(boxes.map((b) => b.value))
    for (const id of [...selected]) if (!present.has(id)) selected.delete(id)
    for (const b of boxes) b.checked = selected.has(b.value)
    const all = $('input[data-select-all]')
    if (all) {
      const n = boxes.filter((b) => b.checked).length
      all.checked = boxes.length > 0 && n === boxes.length
      all.indeterminate = n > 0 && n < boxes.length
    }
    for (const el of $$('[data-needs-selection]')) el.disabled = selected.size === 0
    for (const el of $$('[data-selection-label]')) el.textContent = 'Run selected' + (selected.size ? ' (' + selected.size + ')' : '')
  }
  document.addEventListener('change', (e) => {
    const box = e.target.closest('input[data-select]')
    if (box) {
      box.checked ? selected.add(box.value) : selected.delete(box.value)
      applySelection()
      return
    }
    const all = e.target.closest('input[data-select-all]')
    if (all) {
      for (const b of $$('input[data-select]')) all.checked ? selected.add(b.value) : selected.delete(b.value)
      applySelection()
    }
  })

  // ---------- folders ----------
  document.addEventListener('toggle', (e) => {
    const d = e.target
    if (!(d instanceof HTMLDetailsElement) || !d.dataset.folder) return
    const open = new Set(ls.get('nifi.folderOpen', []))
    d.open ? open.add(d.dataset.folder) : open.delete(d.dataset.folder)
    ls.set('nifi.folderOpen', [...open])
  }, true)
  function restoreFolders() {
    const open = new Set(ls.get('nifi.folderOpen', []))
    for (const d of $$('details[data-folder]')) if (open.has(d.dataset.folder)) d.open = true
  }

  // ---------- API calls ----------
  async function request(method, url, body) {
    let res
    try {
      res = await fetch(url, {
        method,
        credentials: 'same-origin',
        headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      })
    } catch (err) {
      throw Object.assign(new Error('Network error: ' + err.message), { status: 0 })
    }
    const text = await res.text()
    let data = null
    try { data = text ? JSON.parse(text) : null } catch {
      if (!res.ok) throw Object.assign(new Error(text.slice(0, 300) || res.statusText), { status: res.status })
    }
    if (!res.ok || (data && typeof data === 'object' && !Array.isArray(data) && Object.keys(data).length === 1 && typeof data.error === 'string')) {
      throw Object.assign(new Error((data && data.error) || res.status + ' ' + res.statusText), { status: res.status })
    }
    return data
  }
  window.nifiRequest = request

  // fill substitutes {field} from a response object.
  const fill = (tpl, data) => tpl.replace(/\{(\w+)\}/g, (_, k) => (data && data[k] != null ? data[k] : ''))

  function describe(method, path) {
    const p = path.replace(/\?.*$/, '')
    if (/\/connections\/test$/.test(p)) return 'test connections'
    if (/\/connections\/[^/]+\/tables/.test(p)) return 'browse table data'
    if (/\/deadletters/.test(p)) return 'view dead-lettered rows'
    if (/\/runs\/(all|stop-all)$/.test(p) || (/\/flows\/[^/]+\/runs$/.test(p) && method === 'POST')) return 'run flows'
    if (/\/runs\/[^/]+\/(pause|resume|stop)$/.test(p)) return 'control runs'
    if (/\/flows\/wizard$/.test(p)) return 'create flows'
    if (/\/flows/.test(p) && method !== 'GET') return 'edit flows'
    return 'do that'
  }

  function fail(err, prefix, method, url) {
    if (err.status === 401) { location.reload(); return }
    if (err.status === 403) { toast('error', "You don't have permission to " + describe(method, url) + '.'); return }
    toast('error', (prefix || '') + err.message, prefix ? 9000 : undefined)
  }

  function summarize(kind, r) {
    if (kind === 'runall') {
      const started = (r && r.started ? r.started.length : 0)
      const skipped = (r && r.skipped) || []
      toast(skipped.length ? (started ? 'warn' : 'error') : 'success',
        'Started ' + started + (skipped.length ? ' · skipped ' + skipped.length : ''),
        skipped.length ? 12000 : 4000,
        skipped.length ? { title: skipped.length + ' skipped', lines: skipped.map((s) => s.name + ': ' + s.reason) } : undefined)
    } else if (kind === 'stopall') {
      const n = (r && r.stopped ? r.stopped.length : 0)
      toast('info', 'Stopped ' + n + ' run' + (n === 1 ? '' : 's'))
    } else if (kind === 'dropped') {
      toast('info', 'Dropped ' + ((r && r.droppedRows) || 0).toLocaleString() + ' rows')
    }
  }

  function after(el, data) {
    if (el.dataset.result) summarize(el.dataset.result, data)
    if (el.dataset.then) {
      const href = fill(el.dataset.then, data)
      el.dataset.success ? toastThen('success', fill(el.dataset.success, data), href) : (location.href = href)
      return
    }
    if (el.dataset.success) toast('success', fill(el.dataset.success, data))
    if (el.dataset.reload !== undefined) { location.reload(); return }
    refresh(true)
  }

  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-post]')
    if (!btn || btn.disabled) return
    e.preventDefault()
    const menu = btn.closest('details[data-menu]')
    if (menu) menu.open = false
    if (btn.dataset.confirm && !(await confirmDialog({ title: btn.dataset.confirmTitle, message: btn.dataset.confirm, label: btn.dataset.confirmLabel, danger: btn.dataset.danger !== undefined }))) return
    const method = btn.dataset.method || 'POST'
    let body = btn.dataset.body ? JSON.parse(btn.dataset.body) : (method === 'POST' ? {} : undefined)
    if (btn.dataset.selection) body = Object.assign(body || {}, { [btn.dataset.selection]: [...selected] })
    btn.disabled = true
    btn.setAttribute('aria-busy', 'true')
    try {
      const data = await request(method, btn.dataset.post, body)
      if (btn.dataset.selection) selected.clear()
      after(btn, data)
    } catch (err) {
      fail(err, btn.dataset.errorPrefix, method, btn.dataset.post)
    } finally {
      btn.disabled = false
      btn.removeAttribute('aria-busy')
      applySelection()
    }
  })

  // [data-refuse] explains why an action can't be taken instead of taking it.
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-refuse]')
    if (!btn) return
    e.preventDefault()
    toast('error', btn.dataset.refuse, 9000)
  })

  // form[data-json] posts its fields as JSON.
  function formBody(form) {
    const body = {}
    for (const el of form.elements) {
      if (!el.name || el.disabled) continue
      if (el.type === 'radio' && !el.checked) continue
      if (el.type === 'checkbox') {
        if (el.dataset.type === 'set') {
          (body[el.name] = body[el.name] || [])
          if (el.checked) body[el.name].push(el.value)
        } else body[el.name] = el.checked
        continue
      }
      let v = el.value
      if (el.dataset.trim !== undefined) v = v.trim()
      if (el.dataset.type === 'number') v = v === '' ? 0 : Number(v)
      if (el.dataset.type === 'list') v = v.split(/[\s,]+/).filter(Boolean)
      if (el.dataset.or && v === '') v = el.dataset.or
      body[el.name] = v
    }
    if (form.dataset.extra) Object.assign(body, JSON.parse(form.dataset.extra))
    if (form.dataset.selection) body[form.dataset.selection] = [...selected]
    return body
  }

  function formError(form, msg, kind) {
    const box = $('[data-form-error]', form)
    if (!box) return false
    box.textContent = msg
    box.classList.toggle('hidden', !msg)
    box.dataset.kind = kind || 'error'
    return true
  }
  window.nifiFormError = formError
  window.nifiFormBody = formBody

  document.addEventListener('submit', async (e) => {
    const form = e.target.closest('form[data-json]')
    if (!form) return
    e.preventDefault()
    formError(form, '')
    const body = formBody(form)
    if (form.dataset.move !== undefined) {
      body.folder = normalizeFolder(body.fresh) || body.pick || ''
      delete body.fresh
      delete body.pick
    }
    const method = form.dataset.method || 'POST'
    const action = fill(form.dataset.action, body)
    const submit = e.submitter || $('[type=submit]', form)
    if (submit) submit.disabled = true
    try {
      const data = await request(method, action, body)
      if (form.dataset.selection) selected.clear()
      // A follow-up call (e.g. "Save and test") reports into the form.
      if (submit && submit.dataset.then === 'test') {
        const t = await request('POST', api('/connections/test'), { id: body.id || data.id })
        formError(form, t.ok ? 'Connected · ' + t.serverVersion + ' · ' + t.latencyMs + ' ms' : t.error, t.ok ? 'ok' : 'error')
        refresh(true)
        return
      }
      const dlg = form.closest('dialog')
      if (dlg) dlg.close()
      const merged = Object.assign({}, body, data && typeof data === 'object' ? data : {})
      if (form.dataset.then) {
        const href = fill(form.dataset.then, merged)
        form.dataset.success ? toastThen('success', fill(form.dataset.success, merged), href) : (location.href = href)
        return
      }
      if (form.dataset.successEmpty && !body.folder) toast('success', form.dataset.successEmpty)
      else if (form.dataset.success) toast('success', fill(form.dataset.success, merged))
      if (form.dataset.reload !== undefined) { location.reload(); return }
      refresh(true)
    } catch (err) {
      if (err.status === 401) { location.reload(); return }
      if (!formError(form, err.message)) fail(err, '', method, action)
    } finally {
      if (submit) submit.disabled = false
    }
  })

  function normalizeFolder(s) {
    return (s || '').split('/').map((p) => p.trim()).filter(Boolean).join('/')
  }
  // The move dialog says where the flows will go.
  const onMove = (e) => {
    const form = e.target.closest('form[data-move]')
    if (form) moveTarget(form)
  }
  document.addEventListener('input', onMove)
  document.addEventListener('change', onMove)
  function moveTarget(form) {
    const fresh = normalizeFolder(form.elements.fresh.value)
    const picked = $('input[name=pick]:checked', form)
    const target = fresh || (picked ? picked.value : '')
    const label = $('[data-move-target]', form)
    label.textContent = ''
    if (target) { label.append('Moving to '); const b = document.createElement('b'); b.textContent = target; label.append(b) }
    else label.textContent = 'Removing from any folder'
  }
  document.addEventListener('nifi:open', (e) => {
    const form = $('form[data-move]', e.target)
    if (!form) return
    const title = $('h2', e.target)
    if (title) title.textContent = 'Move ' + selected.size + ' flow' + (selected.size === 1 ? '' : 's')
    form.reset()
    // Preselect the folder of the first selected flow.
    const first = [...selected][0]
    const row = first && $('[data-row="' + CSS.escape(first) + '"]')
    const current = row ? normalizeFolder(row.dataset.folder || '') : ''
    for (const r of $$('input[name=pick]', form)) r.checked = r.value === current
    moveTarget(form)
  }, true)

  // ---------- connections ----------
  // Test shows its result on the card; it is kept across refreshes.
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-test-conn]')
    if (!btn) return
    const id = btn.dataset.testConn
    const box = $('[data-test-result="' + CSS.escape(id) + '"]')
    btn.disabled = true
    const show = (ok, text) => {
      if (!box) return
      box.textContent = text
      box.classList.remove('hidden')
      box.style.borderColor = ok ? 'color-mix(in srgb, var(--nf-ok) 35%, transparent)' : 'color-mix(in srgb, var(--nf-err) 35%, transparent)'
      box.style.background = ok ? 'var(--nf-ok-soft)' : 'var(--nf-err-soft)'
      box.style.color = ok ? 'var(--nf-ok)' : 'var(--nf-err)'
    }
    try {
      const r = await request('POST', btn.dataset.url, { id })
      r.ok ? show(true, '✓ Connected · ' + r.serverVersion + ' · ' + r.latencyMs + ' ms') : show(false, '✗ ' + r.error)
    } catch (err) {
      if (err.status === 403) toast('error', "You don't have permission to test connections.")
      else show(false, '✗ ' + err.message)
    } finally {
      btn.disabled = false
    }
  })
  // Switching driver moves the port to the new default, unless it was changed.
  const defaultPort = (d) => (d === 'mysql' ? 3306 : 5432)
  document.addEventListener('focusin', (e) => {
    const sel = e.target.closest('select[data-driver]')
    if (sel) sel.dataset.prev = sel.value
  })
  document.addEventListener('change', (e) => {
    const sel = e.target.closest('select[data-driver]')
    if (!sel) return
    const port = $('input[data-port]', sel.form)
    if (port && Number(port.value) === defaultPort(sel.dataset.prev || 'postgres')) port.value = defaultPort(sel.value)
    sel.dataset.prev = sel.value
  })

  // ---------- client-side filters ----------
  // input[data-filter=<selector>] hides the rows under it whose data-search
  // doesn't match (small lists only; big ones search on the server).
  function applyFilters() {
    for (const input of $$('input[data-filter]')) {
      const root = $(input.dataset.filter)
      if (!root) continue
      const words = input.value.trim().toLowerCase().split(/\s+/).filter(Boolean)
      for (const row of $$('[data-search]', root)) {
        const hit = words.every((w) => row.dataset.search.includes(w))
        row.toggleAttribute('data-filtered-out', !hit)
      }
    }
  }
  document.addEventListener('input', (e) => { if (e.target.closest('input[data-filter]')) applyFilters() })

  // ---------- migration wizard ----------
  function wizardCount(form) {
    const boxes = $$('input[name=t]', form)
    const on = boxes.filter((b) => b.checked)
    let rows = 0
    let bytes = 0
    for (const b of on) { rows += Number(b.dataset.rows || 0); bytes += Number(b.dataset.bytes || 0) }
    const count = $('[data-wizard-count]', form)
    if (count) count.textContent = on.length + ' / ' + boxes.length + ' tables · ~' + compact(rows) + ' rows · ' + humanBytes(bytes)
    const nopk = on.filter((b) => b.hasAttribute('data-nopk')).length
    const warn = $('[data-wizard-nopk]', form)
    if (warn) {
      warn.textContent = nopk + ' selected table' + (nopk === 1 ? '' : 's') + ' without a primary key — streamed in one pass and not resumable.'
      warn.classList.toggle('hidden', nopk === 0)
    }
    const next = $('[type=submit]', form)
    if (next) next.disabled = on.length === 0
  }
  function compact(n) {
    const a = Math.abs(n)
    if (a >= 1e9) return (n / 1e9).toFixed(a >= 1e10 ? 0 : 1) + 'B'
    if (a >= 1e6) return (n / 1e6).toFixed(a >= 1e7 ? 0 : 1) + 'M'
    if (a >= 1e4) return (n / 1e3).toFixed(0) + 'k'
    if (a >= 1e3) return (n / 1e3).toFixed(1) + 'k'
    return String(Math.round(n))
  }
  function humanBytes(b) {
    const u = ['B', 'KB', 'MB', 'GB', 'TB']
    let i = 0
    while (b >= 1024 && i < u.length - 1) { b /= 1024; i++ }
    return (b >= 100 || i === 0 ? Math.round(b) : b.toFixed(1)) + ' ' + u[i]
  }
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-check]')
    if (!btn) return
    const form = btn.closest('form')
    for (const row of $$('tbody tr:not([data-filtered-out])', form)) {
      const b = $('input[name=t]', row)
      if (b) b.checked = btn.dataset.check === 'all'
    }
    wizardCount(form)
  })
  document.addEventListener('change', (e) => {
    const form = e.target.closest('form[data-wizard-tables]')
    if (form) wizardCount(form)
  })
  document.addEventListener('submit', (e) => {
    const form = e.target.closest('form[data-wizard-tables]')
    if (!form) return
    // Every table picked travels as ?all=1 rather than a name per table.
    const boxes = $$('input[name=t]', form)
    if (boxes.length && boxes.every((b) => b.checked)) {
      for (const b of boxes) b.disabled = true
      const all = document.createElement('input')
      all.type = 'hidden'
      all.name = 'all'
      all.value = '1'
      form.appendChild(all)
    }
  })

  // ---------- sign in / out ----------
  document.addEventListener('submit', async (e) => {
    const form = e.target.closest('form[data-login]')
    if (!form) return
    e.preventDefault()
    formError(form, '')
    const submit = $('[type=submit]', form)
    submit.disabled = true
    try {
      await request('POST', api('/auth/login'), { username: form.elements.username.value.trim(), password: form.elements.password.value })
      location.reload()
    } catch (err) {
      formError(form, err.message || 'invalid username or password')
      submit.disabled = false
    }
  })
  document.addEventListener('click', async (e) => {
    if (!e.target.closest('[data-logout]')) return
    try { await request('POST', api('/auth/logout'), {}) } finally { location.reload() }
  })

  // ---------- islands ----------
  // The canvas bundle is loaded once, and only on pages that mount it.
  let islands = null
  function mountIslands() {
    const els = $$('[data-island]:not([data-mounted])')
    if (!els.length) return
    const src = document.body.dataset.islands
    if (!src) return
    islands = islands || import(src)
    islands.then((m) => {
      for (const el of els) {
        if (el.hasAttribute('data-mounted')) continue
        el.setAttribute('data-mounted', '')
        m.mount(el, el.dataset.island, JSON.parse(el.dataset.props || '{}'))
      }
    }).catch((err) => toast('error', 'Could not load the editor: ' + err.message))
  }

  // ---------- after every render ----------
  function afterRender() {
    tick()
    applyFilters()
    for (const f of $$('form[data-wizard-tables]')) wizardCount(f)
    applySelection()
    restoreFolders()
    mountIslands()
  }
  const ready = () => { restoreFlows(); afterRender() }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready)
  else ready()
})()
