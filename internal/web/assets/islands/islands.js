//#region node_modules/svelte/src/constants.js
var e = {}, t = Symbol("uninitialized"), n = "http://www.w3.org/1999/xhtml", r = "http://www.w3.org/2000/svg", i = Array.isArray, a = Array.prototype.indexOf, o = Array.prototype.includes, s = Array.from, c = Object.defineProperty, l = Object.getOwnPropertyDescriptor, u = Object.getOwnPropertyDescriptors, d = Object.prototype, f = Array.prototype, p = Object.getPrototypeOf, m = Object.isExtensible;
function h(e) {
	return typeof e == "function";
}
var g = () => {};
function _(e) {
	return e();
}
function v(e) {
	for (var t = 0; t < e.length; t++) e[t]();
}
function y() {
	var e, t;
	return {
		promise: new Promise((n, r) => {
			e = n, t = r;
		}),
		resolve: e,
		reject: t
	};
}
function b(e, t, n = !1) {
	return e === void 0 ? n ? t() : t : e;
}
function x(e, t) {
	if (Array.isArray(e)) return e;
	if (t === void 0 || !(Symbol.iterator in e)) return Array.from(e);
	let n = [];
	for (let r of e) if (n.push(r), n.length === t) break;
	return n;
}
function S(e, t) {
	var n = {};
	for (var r in e) t.includes(r) || (n[r] = e[r]);
	for (var i of Object.getOwnPropertySymbols(e)) Object.propertyIsEnumerable.call(e, i) && !t.includes(i) && (n[i] = e[i]);
	return n;
}
//#endregion
//#region node_modules/svelte/src/internal/client/constants.js
var C = 1 << 24, w = 1024, T = 2048, ee = 4096, te = 8192, ne = 16384, re = 32768, ie = 1 << 25, ae = 65536, oe = 1 << 19, se = 1 << 20, ce = 1 << 25, le = 1 << 21, ue = 1 << 22, de = 1 << 23, fe = Symbol("$state"), pe = Symbol("component"), me = Symbol("legacy props"), he = Symbol(""), ge = Symbol("attributes"), _e = Symbol("class"), ve = Symbol("style"), ye = Symbol("text"), be = Symbol("form reset"), xe = new class extends Error {
	name = "StaleReactionError";
	message = "The reaction that called `getAbortSignal()` was re-run or destroyed";
}(), Se = !!globalThis.document?.contentType && /* @__PURE__ */ globalThis.document.contentType.includes("xml");
function Ce() {
	console.warn("https://svelte.dev/e/derived_inert");
}
function we(e) {
	console.warn("https://svelte.dev/e/hydration_mismatch");
}
function Te() {
	console.warn("https://svelte.dev/e/select_multiple_invalid_value");
}
function Ee() {
	console.warn("https://svelte.dev/e/svelte_boundary_reset_noop");
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/hydration.js
var E = !1;
function De(e) {
	E = e;
}
var Oe;
function ke(t) {
	if (t === null) throw we(), e;
	return Oe = t;
}
function Ae() {
	return ke(/* @__PURE__ */ Cn(Oe));
}
function D(t) {
	if (E) {
		if (/* @__PURE__ */ Cn(Oe) !== null) throw we(), e;
		Oe = t;
	}
}
function O(e = 1) {
	if (E) {
		for (var t = e, n = Oe; t--;) n = /* @__PURE__ */ Cn(n);
		Oe = n;
	}
}
function je(e = !0) {
	for (var t = 0, n = Oe;;) {
		if (n.nodeType === 8) {
			var r = n.data;
			if (r === "]") {
				if (t === 0) return n;
				--t;
			} else (r === "[" || r === "[!" || r[0] === "[" && !isNaN(Number(r.slice(1)))) && (t += 1);
		}
		var i = /* @__PURE__ */ Cn(n);
		e && n.remove(), n = i;
	}
}
function Me(t) {
	if (!t || t.nodeType !== 8) throw we(), e;
	return t.data;
}
//#endregion
//#region node_modules/svelte/src/internal/client/reactivity/equality.js
function Ne(e) {
	return e === this.v;
}
function Pe(e, t) {
	return e == e ? e !== t || typeof e == "object" && !!e || typeof e == "function" : t == t;
}
function Fe(e) {
	return !Pe(e, this.v);
}
function Ie(e) {
	throw Error("https://svelte.dev/e/lifecycle_outside_component");
}
//#endregion
//#region node_modules/svelte/src/internal/client/errors.js
function Le() {
	throw Error("https://svelte.dev/e/async_derived_orphan");
}
function Re(e, t, n) {
	throw Error("https://svelte.dev/e/each_key_duplicate");
}
function ze(e) {
	throw Error("https://svelte.dev/e/effect_in_teardown");
}
function Be() {
	throw Error("https://svelte.dev/e/effect_in_unowned_derived");
}
function Ve(e) {
	throw Error("https://svelte.dev/e/effect_orphan");
}
function He() {
	throw Error("https://svelte.dev/e/effect_update_depth_exceeded");
}
function Ue(e) {
	throw Error("https://svelte.dev/e/props_invalid_value");
}
function We() {
	throw Error("https://svelte.dev/e/state_descriptors_fixed");
}
function Ge() {
	throw Error("https://svelte.dev/e/state_prototype_fixed");
}
function Ke() {
	throw Error("https://svelte.dev/e/state_unsafe_mutation");
}
function qe() {
	throw Error("https://svelte.dev/e/svelte_boundary_reset_onerror");
}
//#endregion
//#region node_modules/svelte/src/internal/flags/index.js
var Je = !1;
function Ye() {
	Je = !0;
}
//#endregion
//#region node_modules/svelte/src/internal/shared/clone.js
var Xe = [];
function Ze(e, t = !1, n = !1) {
	return Qe(e, /* @__PURE__ */ new Map(), "", Xe, null, n);
}
function Qe(e, t, n, r, a = null, o = !1) {
	if (typeof e == "object" && e) {
		var s = t.get(e);
		if (s !== void 0) return s;
		if (e instanceof Map) return new Map(e);
		if (e instanceof Set) return new Set(e);
		if (i(e)) {
			var c = Array(e.length);
			t.set(e, c), a !== null && t.set(a, c);
			for (var l = 0; l < e.length; l += 1) {
				var u = e[l];
				l in e && (c[l] = Qe(u, t, n, r, null, o));
			}
			return c;
		}
		if (p(e) === d) {
			c = {}, t.set(e, c), a !== null && t.set(a, c);
			for (var f of Object.keys(e)) c[f] = Qe(e[f], t, n, r, null, o);
			return c;
		}
		if (e instanceof Date) return e.getTime(), structuredClone(e);
		if (typeof e.toJSON == "function" && !o) return Qe(e.toJSON(), t, n, r, e);
	}
	if (e instanceof EventTarget) return e;
	try {
		return structuredClone(e);
	} catch {
		return e;
	}
}
//#endregion
//#region node_modules/svelte/src/internal/shared/context.js
function $e(e) {
	let t = e.p;
	for (; t !== null && t.c === null;) t = t.p;
	return t?.c ?? null;
}
function et(e, t) {
	return e === null && Ie(t), e.c ??= new Map($e(e) || void 0);
}
//#endregion
//#region node_modules/svelte/src/internal/client/context.js
var tt = null;
function nt(e) {
	tt = e;
}
function rt(e) {
	return et(tt, "getContext").get(e);
}
function it(e, t) {
	return et(tt, "setContext").set(e, t), t;
}
function at(e) {
	return et(tt, "hasContext").has(e);
}
function k(e, t = !1, n) {
	tt = {
		p: tt,
		i: !1,
		c: null,
		e: null,
		s: e,
		x: null,
		r: ur,
		l: Je && !t ? {
			s: null,
			u: null,
			$: []
		} : null
	};
}
function A(e) {
	var t = tt, n = t.e;
	if (n !== null) {
		t.e = null;
		for (var r of n) In(r);
	}
	return e !== void 0 && (t.x = e), t.i = !0, tt = t.p, ot(e);
}
function ot(e = {}) {
	return c(e, pe, { value: !0 }), e;
}
function st() {
	return !Je || tt !== null && tt.l === null;
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/task.js
var ct = [];
function lt() {
	var e = ct;
	ct = [], v(e);
}
function ut(e) {
	if (ct.length === 0 && !Bt) {
		var t = ct;
		queueMicrotask(() => {
			t === ct && lt();
		});
	}
	ct.push(e);
}
function dt() {
	for (; ct.length > 0;) lt();
}
//#endregion
//#region node_modules/svelte/src/internal/client/reactivity/status.js
var ft = ~(T | ee | w);
function pt(e, t) {
	e.f = e.f & ft | t;
}
function mt(e) {
	e.f & 512 || e.deps === null ? pt(e, w) : pt(e, ee);
}
//#endregion
//#region node_modules/svelte/src/internal/client/reactivity/utils.js
function ht(e, t, n) {
	e.f & 2048 ? t.add(e) : e.f & 4096 && n.add(e), pt(e, w);
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/elements/misc.js
function gt(e, t) {
	if (t) {
		let t = document.body;
		e.autofocus = !0, ut(() => {
			document.activeElement === t && e.focus();
		});
	}
}
function _t(e) {
	E && /* @__PURE__ */ Sn(e) !== null && wn(e);
}
var vt = !1;
function yt() {
	vt || (vt = !0, document.addEventListener("reset", (e) => {
		Promise.resolve().then(() => {
			if (!e.defaultPrevented) for (let t of e.target.elements) t[be]?.();
		});
	}, { capture: !0 }));
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/elements/bindings/shared.js
function bt(e) {
	var t = sr, n = ur;
	lr(null), dr(null);
	try {
		return e();
	} finally {
		lr(t), dr(n);
	}
}
function xt(e, t, n, r = n) {
	e.addEventListener(t, () => bt(n));
	let i = e[be];
	e[be] = i ? () => {
		i(), r(!0);
	} : () => r(!0), yt();
}
//#endregion
//#region node_modules/svelte/src/internal/client/reactivity/async.js
function St(e, t, n, r) {
	let i = st() ? Et : kt;
	var a = e.filter((e) => !e.settled), o = t.map(i);
	if (n.length === 0 && a.length === 0) {
		r(o);
		return;
	}
	var s = ur, c = Ct(), l = a.length === 1 ? a[0].promise : a.length > 1 ? Promise.all(a.map((e) => e.promise)) : null;
	function u(e) {
		if (!(s.f & 16384)) {
			c();
			try {
				r([...o, ...e]);
			} catch (e) {
				kn(e, s);
			}
			wt();
		}
	}
	var d = Tt();
	if (n.length === 0) {
		l.then(() => u([])).finally(d);
		return;
	}
	function f() {
		Promise.all(n.map((e) => /* @__PURE__ */ Ot(e))).then(u).catch((e) => kn(e, s)).finally(d);
	}
	l ? l.then(() => {
		c(), f(), wt();
	}) : f();
}
function Ct() {
	var e = ur, t = sr, n = tt, r = It;
	return function(i = !0) {
		dr(e), lr(t), nt(n), i && !(e.f & 16384) && (r?.activate(), r?.apply());
	};
}
function wt(e = !0) {
	dr(null), lr(null), nt(null), e && It?.deactivate();
}
function Tt() {
	var e = ur, t = e.b, n = It, r = !!t?.is_rendered();
	return t?.update_pending_count(1, n), n.increment(r, e), () => {
		t?.update_pending_count(-1, n), n.decrement(r, e);
	};
}
/*#__NO_SIDE_EFFECTS__*/
function Et(e) {
	var n = 2 | T;
	return ur !== null && (ur.f |= oe), {
		ctx: tt,
		deps: null,
		effects: null,
		equals: Ne,
		f: n,
		fn: e,
		reactions: null,
		rv: 0,
		v: t,
		wv: 0,
		parent: ur,
		ac: null
	};
}
var Dt = Symbol("obsolete");
/*#__NO_SIDE_EFFECTS__*/
function Ot(e, n, r) {
	let i = ur;
	i === null && Le();
	var a = void 0, o = rn(t), s = !sr, c = /* @__PURE__ */ new Set();
	return Vn(() => {
		var t = ur, n = y();
		a = n.promise;
		try {
			Promise.resolve(e()).then(n.resolve, (e) => {
				e !== xe && n.reject(e);
			}).finally(wt);
		} catch (e) {
			n.reject(e), wt();
		}
		var r = It;
		if (s) {
			if (t.f & 32768) var l = Tt();
			if (i.b?.is_rendered()) r.async_deriveds.get(t)?.reject(Dt);
			else for (let e of c.values()) e.reject(Dt);
			c.add(n), r.async_deriveds.set(t, n);
		}
		let u = (e, t = void 0) => {
			l?.(), c.delete(n), t !== Dt && (r.activate(), t ? (o.f |= de, cn(o, t)) : (o.f & 8388608 && (o.f ^= de), cn(o, e)), r.deactivate());
		};
		n.promise.then(u, (e) => u(null, e || "unknown"));
	}), Pn(() => {
		for (let e of c) e.reject(Dt);
	}), new Promise((e) => {
		function t(n) {
			function r() {
				n === a ? e(o) : t(a);
			}
			n.then(r, r);
		}
		t(a);
	});
}
/*#__NO_SIDE_EFFECTS__*/
function j(e) {
	let t = /* @__PURE__ */ Et(e);
	return pr(t), t;
}
/*#__NO_SIDE_EFFECTS__*/
function kt(e) {
	let t = /* @__PURE__ */ Et(e);
	return t.equals = Fe, t;
}
function At(e) {
	var t = e.effects;
	if (t !== null) {
		e.effects = null;
		for (var n = 0; n < t.length; n += 1) Yn(t[n]);
	}
}
function jt(e) {
	var n, r = ur, i = e.parent;
	if (!ar && i !== null && e.v !== t && i.f & 24576) return Ce(), e.v;
	dr(i);
	try {
		At(e), n = Tr(e);
	} finally {
		dr(r);
	}
	return n;
}
function Mt(e) {
	var t = jt(e);
	if (!e.equals(t) && (e.wv = Sr(), (!It?.is_fork || e.deps === null) && (It === null ? e.v = t : (It.capture(e, t, !0), Lt?.capture(e, t, !0)), e.deps === null))) {
		pt(e, w);
		return;
	}
	ar || (Rt === null ? mt(e) : (Nn() || It?.is_fork) && Rt.set(e, t));
}
function Nt(e) {
	if (e.effects !== null) for (let t of e.effects) (t.teardown || t.ac) && (t.teardown?.(), t.ac !== null && bt(() => {
		t.ac.abort(xe), t.ac = null;
	}), t.fn !== null && (t.teardown = g), Or(t, 0), qn(t));
}
function Pt(e) {
	if (e.effects !== null) for (let t of e.effects) t.teardown && t.fn !== null && kr(t);
}
//#endregion
//#region node_modules/svelte/src/internal/client/reactivity/batch.js
var Ft = null, It = null, Lt = null, Rt = null, zt = null, Bt = !1, Vt = !1, Ht = null, Ut = null, Wt = 0, Gt = 1, Kt = class e {
	id = Gt++;
	#e = !1;
	linked = !0;
	#t = null;
	#n = null;
	async_deriveds = /* @__PURE__ */ new Map();
	current = /* @__PURE__ */ new Map();
	previous = /* @__PURE__ */ new Map();
	#r = /* @__PURE__ */ new Set();
	#i = /* @__PURE__ */ new Set();
	#a = 0;
	#o = /* @__PURE__ */ new Map();
	#s = null;
	#c = [];
	#l = [];
	#u = /* @__PURE__ */ new Set();
	#d = /* @__PURE__ */ new Set();
	#f = /* @__PURE__ */ new Map();
	#p = /* @__PURE__ */ new Set();
	is_fork = !1;
	#m = !1;
	constructor() {
		Ft === null ? Ft = this : (Ft.#n = this, this.#t = Ft), Ft = this;
	}
	#h() {
		if (this.is_fork) return !0;
		for (let n of this.#o.keys()) {
			for (var e = n, t = !1; e.parent !== null;) {
				if (this.#f.has(e)) {
					t = !0;
					break;
				}
				e = e.parent;
			}
			if (!t) return !0;
		}
		return !1;
	}
	skip_effect(e) {
		this.#f.has(e) || this.#f.set(e, {
			d: [],
			m: []
		}), this.#p.delete(e);
	}
	unskip_effect(e, t = (e) => this.schedule(e)) {
		var n = this.#f.get(e);
		if (n) {
			this.#f.delete(e);
			for (var r of n.d) pt(r, T), t(r);
			for (r of n.m) pt(r, ee), t(r);
		}
		this.#p.add(e);
	}
	#g() {
		var e = [];
		for (let i of this.#c) if (!(i.f & 16384 || !(i.f & 6144))) {
			for (var t = i, n = !1; t.parent !== null;) {
				t = t.parent;
				var r = t.f;
				if (r & 96) {
					if (!(r & 1024)) {
						n = !0;
						break;
					}
					t.f ^= w;
				}
			}
			n || e.push(t);
		}
		return this.#c = [], e;
	}
	#_() {
		this.#e = !0;
		for (let e of this.#u) this.#d.delete(e), pt(e, T), this.schedule(e);
		for (let e of this.#d) pt(e, ee), this.schedule(e);
		this.apply();
		for (var t = Ht = [], n = [], r = Ut = []; this.#c.length > 0;) {
			Wt++ > 1e3 && (this.#S(), Jt());
			for (let e of this.#g()) try {
				this.#v(e, t, n);
			} catch (t) {
				throw $t(e), this.#h() || this.discard(), t;
			}
		}
		if (It = null, r.length > 0) {
			var i = e.ensure();
			for (let e of r) i.schedule(e);
		}
		if (Ht = null, Ut = null, this.#h()) {
			this.#x(n), this.#x(t);
			for (let [e, t] of this.#f) Qt(e, t);
			r.length > 0 && It.#_();
			return;
		}
		let a = this.#y();
		if (a) {
			this.#x(n), this.#x(t), a.#b(this);
			return;
		}
		this.#u.clear(), this.#d.clear();
		for (let e of this.#r) e(this);
		this.#r.clear(), Lt = this, Xt(n), Xt(t), Lt = null, this.#s?.resolve();
		var o = It;
		if (this.#a === 0 && (this.#c.length === 0 || o !== null) && this.#S(), this.#c.length > 0) {
			if (o !== null) {
				for (let e of this.#c) o.#c.push(e);
				this.#c = [];
			} else o = this;
		}
		o !== null && (tn.clear(), o.#_());
	}
	#v(e, t, n) {
		e.f ^= w;
		for (var r = e.first; r !== null;) {
			var i = r.f, a = !!(i & 96);
			if (!(a && i & 1024 || i & 8192 || this.#f.has(r)) && r.fn !== null) {
				a ? r.f ^= w : i & 4 ? t.push(r) : Cr(r) && (i & 16 && this.#d.add(r), kr(r));
				var o = r.first;
				if (o !== null) {
					r = o;
					continue;
				}
			}
			for (; r !== null;) {
				var s = r.next;
				if (s !== null) {
					r = s;
					break;
				}
				r = r.parent;
			}
		}
	}
	#y() {
		for (var e = this.#t; e !== null;) {
			if (!e.is_fork) {
				for (let [t, [, n]] of this.current) if (e.current.has(t) && !n) return e;
			}
			e = e.#t;
		}
		return null;
	}
	#b(e) {
		for (let [t, n] of e.current) !this.previous.has(t) && e.previous.has(t) && this.previous.set(t, e.previous.get(t)), this.current.set(t, n);
		for (let [t, n] of e.async_deriveds) {
			let e = this.async_deriveds.get(t);
			e && n.promise.then(e.resolve).catch(e.reject);
		}
		e.async_deriveds.clear(), this.transfer_effects(e.#u, e.#d);
		let t = (e) => {
			var n = e.reactions;
			if (n !== null && !(e.f & 2 && !(e.f & 6144))) for (let e of n) {
				var r = e.f;
				if (r & 2) t(e);
				else {
					var i = e;
					r & 4194320 && !this.async_deriveds.has(i) && (this.#d.delete(i), pt(i, T), this.schedule(i));
				}
			}
		};
		for (let e of this.current.keys()) t(e);
		this.oncommit(() => e.discard()), e.#S(), It = this, this.#_();
	}
	#x(e) {
		for (var t = 0; t < e.length; t += 1) ht(e[t], this.#u, this.#d);
	}
	capture(e, n, r = !1) {
		e.v !== t && !this.previous.has(e) && this.previous.set(e, e.v), e.f & 8388608 || (this.current.set(e, [n, r]), Rt?.set(e, n)), this.is_fork || (e.v = n);
	}
	activate() {
		It = this;
	}
	deactivate() {
		It = null, Rt = null;
	}
	flush() {
		try {
			Vt = !0, It = this, this.#_();
		} finally {
			Wt = 0, zt = null, Ht = null, Ut = null, Vt = !1, It = null, Rt = null, tn.clear();
		}
	}
	discard() {
		for (let e of this.#i) e(this);
		this.#i.clear();
		for (let e of this.async_deriveds.values()) e.reject(Dt);
		this.#S(), this.#s?.resolve();
	}
	register_created_effect(e) {
		this.#l.push(e);
	}
	increment(e, t) {
		if (this.#a += 1, e) {
			let e = this.#o.get(t) ?? 0;
			this.#o.set(t, e + 1);
		}
	}
	decrement(e, t) {
		if (--this.#a, e) {
			let e = this.#o.get(t) ?? 0;
			e === 1 ? this.#o.delete(t) : this.#o.set(t, e - 1);
		}
		this.#m || (this.#m = !0, ut(() => {
			this.#m = !1, this.linked && this.flush();
		}));
	}
	transfer_effects(e, t) {
		for (let t of e) this.#u.add(t);
		for (let e of t) this.#d.add(e);
		e.clear(), t.clear();
	}
	oncommit(e) {
		this.#r.add(e);
	}
	ondiscard(e) {
		this.#i.add(e);
	}
	settled() {
		return (this.#s ??= y()).promise;
	}
	static ensure() {
		if (It === null) {
			let t = It = new e();
			!Vt && !Bt && ut(() => {
				t.#e || t.flush();
			});
		}
		return It;
	}
	apply() {
		Rt = null;
	}
	schedule(e) {
		if (zt = e, e.b?.is_pending && e.f & 16777228 && !(e.f & 32768)) {
			e.b.defer_effect(e);
			return;
		}
		this.#c.push(e);
	}
	#S() {
		if (this.linked) {
			var e = this.#t, t = this.#n;
			e === null || (e.#n = t), t === null ? Ft = e : t.#t = e, this.linked = !1;
		}
	}
};
function qt(e) {
	var t = Bt;
	Bt = !0;
	try {
		var n;
		for (e && (It !== null && !It.is_fork && It.flush(), n = e());;) {
			if (dt(), It === null) return n;
			It.flush();
		}
	} finally {
		Bt = t;
	}
}
function Jt() {
	try {
		He();
	} catch (e) {
		kn(e, zt);
	}
}
var Yt = null;
function Xt(e) {
	var t = e.length;
	if (t !== 0) {
		for (var n = 0; n < t;) {
			var r = e[n++];
			if (!(r.f & 24576) && Cr(r) && (Yt = /* @__PURE__ */ new Set(), kr(r), r.deps === null && r.first === null && r.nodes === null && r.teardown === null && r.ac === null && Zn(r), Yt?.size > 0)) {
				tn.clear();
				for (let e of Yt) {
					if (e.f & 24576) continue;
					let t = [e], n = e.parent;
					for (; n !== null;) Yt.has(n) && (Yt.delete(n), t.push(n)), n = n.parent;
					for (let e = t.length - 1; e >= 0; e--) {
						let n = t[e];
						n.f & 24576 || kr(n);
					}
				}
				Yt.clear();
			}
		}
		Yt = null;
	}
}
function Zt(e) {
	It.schedule(e);
}
function Qt(e, t) {
	if (!(e.f & 32 && e.f & 1024)) {
		e.f & 2048 ? t.d.push(e) : e.f & 4096 && t.m.push(e), pt(e, w);
		for (var n = e.first; n !== null;) Qt(n, t), n = n.next;
	}
}
function $t(e) {
	pt(e, w);
	for (var t = e.first; t !== null;) $t(t), t = t.next;
}
//#endregion
//#region node_modules/svelte/src/internal/client/reactivity/sources.js
var en = /* @__PURE__ */ new Set(), tn = /* @__PURE__ */ new Map(), nn = !1;
function rn(e, t) {
	return {
		f: 0,
		v: e,
		reactions: null,
		equals: Ne,
		rv: 0,
		wv: 0
	};
}
/*#__NO_SIDE_EFFECTS__*/
function M(e, t) {
	let n = rn(e, t);
	return pr(n), n;
}
/*#__NO_SIDE_EFFECTS__*/
function an(e, t = !1, n = !0) {
	let r = rn(e);
	return t || (r.equals = Fe), Je && n && tt !== null && tt.l !== null && (tt.l.s ??= []).push(r), r;
}
function N(e, t, n = !1) {
	return sr !== null && (!cr || sr.f & 131072) && st() && sr.f & 4325394 && (fr === null || !fr.has(e)) && Ke(), cn(e, n ? pn(t) : t, Ut);
}
var on = null, sn = 0;
function cn(e, t, n = null) {
	if (!e.equals(t)) {
		ar ? tn.set(e, t) : tn.has(e) || tn.set(e, e.v);
		var r = Kt.ensure();
		if (r.capture(e, t), e.f & 2) {
			let t = e;
			e.f & 2048 && jt(t), Rt === null && mt(t);
		}
		e.wv = Sr(), on = null, sn = 0, fn(e, T, n), on = null, st() && ur !== null && ur.f & 1024 && !(ur.f & 96) && (gr === null ? _r([e]) : gr.push(e)), !r.is_fork && en.size > 0 && !nn && ln();
	}
	return t;
}
function ln() {
	nn = !1;
	for (let e of en) {
		e.f & 1024 && pt(e, ee);
		let t;
		try {
			t = Cr(e);
		} catch {
			t = !0;
		}
		t && kr(e);
	}
	en.clear();
}
function un(e, t = 1) {
	var n = z(e), r = t === 1 ? n++ : n--;
	return N(e, n), r;
}
function dn(e) {
	N(e, e.v + 1);
}
function fn(e, t, n) {
	var r = e.reactions;
	if (r !== null) {
		var i = st(), a = r.length;
		if (sn += a, sn > 1e5 && on === null && (on = /* @__PURE__ */ new Set()), on !== null) {
			if (on.has(e)) return;
			on.add(e);
		}
		for (var o = 0; o < a; o++) {
			var s = r[o], c = s.f;
			if (i || s !== ur) {
				var l = (c & T) === 0;
				if (l && pt(s, t), c & 131072) en.add(s);
				else if (c & 2) {
					var u = s;
					Rt?.delete(u), fn(u, ee, n);
				} else if (l) {
					var d = s;
					c & 16 && Yt !== null && Yt.add(d), n === null ? Zt(d) : n.push(d);
				}
			}
		}
	}
}
function pn(e) {
	if (typeof e != "object" || !e || fe in e || pe in e) return e;
	let n = p(e);
	if (n !== d && n !== f) return e;
	var r = /* @__PURE__ */ new Map(), a = i(e), o = /* @__PURE__ */ M(0), s = null, c = br, u = (e) => {
		if (br === c) return e();
		var t = sr, n = br;
		lr(null), xr(c);
		var r = e();
		return lr(t), xr(n), r;
	};
	return a && r.set("length", /* @__PURE__ */ M(e.length, s)), new Proxy(e, {
		defineProperty(e, t, n) {
			(!("value" in n) || n.configurable === !1 || n.enumerable === !1 || n.writable === !1) && We();
			var i = r.get(t);
			return i === void 0 ? u(() => {
				var e = /* @__PURE__ */ M(n.value, s);
				return r.set(t, e), e;
			}) : N(i, n.value, !0), !0;
		},
		deleteProperty(e, n) {
			var i = r.get(n);
			if (i === void 0) {
				if (n in e) {
					let e = u(() => /* @__PURE__ */ M(t, s));
					r.set(n, e), dn(o);
				}
			} else N(i, t), dn(o);
			return !0;
		},
		get(n, i, a) {
			if (i === fe) return e;
			var o = r.get(i), c = i in n;
			if (o === void 0 && (!c || l(n, i)?.writable) && (o = u(() => /* @__PURE__ */ M(pn(c ? n[i] : t), s)), r.set(i, o)), o !== void 0) {
				var d = z(o);
				return d === t ? void 0 : d;
			}
			return Reflect.get(n, i, a);
		},
		getOwnPropertyDescriptor(e, n) {
			this.has?.(e, n);
			var i = Reflect.getOwnPropertyDescriptor(e, n), a = r.get(n);
			if (a !== void 0) {
				var o = z(a);
				if (o === t) return;
				if (i && "value" in i) i.value = o;
				else return {
					enumerable: !0,
					configurable: !0,
					value: o,
					writable: !0
				};
			}
			return i;
		},
		has(e, n) {
			if (n === fe) return !0;
			var i = r.get(n), a = i !== void 0 && i.v !== t || Reflect.has(e, n);
			return (i !== void 0 || ur !== null && (!a || l(e, n)?.writable)) && (i === void 0 && (i = u(() => /* @__PURE__ */ M(a ? pn(e[n]) : t, s)), r.set(n, i)), z(i) === t) ? !1 : a;
		},
		set(e, n, i, c) {
			var d = r.get(n), f = n in e;
			if (a && n === "length") for (var p = i; p < d.v; p += 1) {
				var m = r.get(p + "");
				m === void 0 ? p in e && (m = u(() => /* @__PURE__ */ M(t, s)), r.set(p + "", m)) : N(m, t);
			}
			if (d === void 0) (!f || l(e, n)?.writable) && (d = u(() => /* @__PURE__ */ M(void 0, s)), N(d, pn(i)), r.set(n, d));
			else {
				f = d.v !== t;
				var h = u(() => pn(i));
				N(d, h);
			}
			var g = Reflect.getOwnPropertyDescriptor(e, n);
			if (g?.set && g.set.call(c, i), !f) {
				if (a && typeof n == "string") {
					var _ = r.get("length"), v = Number(n);
					Number.isInteger(v) && v >= _.v && N(_, v + 1);
				}
				dn(o);
			}
			return !0;
		},
		ownKeys(e) {
			z(o);
			var n = Reflect.ownKeys(e).filter((e) => {
				var n = r.get(e);
				return n === void 0 || n.v !== t;
			});
			for (var [i, a] of r) a.v !== t && !(i in e) && n.push(i);
			return n;
		},
		setPrototypeOf() {
			Ge();
		}
	});
}
function mn(e) {
	try {
		if (typeof e == "object" && e && fe in e) return e[fe];
	} catch {}
	return e;
}
function hn(e, t) {
	return Object.is(mn(e), mn(t));
}
var gn, _n, vn, yn;
function bn() {
	if (gn === void 0) {
		gn = window, _n = /Firefox/.test(navigator.userAgent);
		var e = Element.prototype, t = Node.prototype, n = Text.prototype;
		vn = l(t, "firstChild").get, yn = l(t, "nextSibling").get, m(e) && (e[_e] = void 0, e[ge] = null, e[ve] = void 0, e.__e = void 0), m(n) && (n[ye] = void 0);
	}
}
function xn(e = "") {
	return document.createTextNode(e);
}
/*@__NO_SIDE_EFFECTS__*/
function Sn(e) {
	return vn.call(e);
}
/*@__NO_SIDE_EFFECTS__*/
function Cn(e) {
	return yn.call(e);
}
function P(e, t) {
	if (!E) return /* @__PURE__ */ Sn(e);
	var n = /* @__PURE__ */ Sn(Oe);
	if (n === null) n = Oe.appendChild(xn());
	else if (t && n.nodeType !== 3) {
		var r = xn();
		return n?.before(r), ke(r), r;
	}
	return t && Dn(n), ke(n), n;
}
function F(e, t = !1) {
	if (!E) {
		var n = /* @__PURE__ */ Sn(e);
		return n instanceof Comment && n.data === "" ? /* @__PURE__ */ Cn(n) : n;
	}
	if (t) {
		if (Oe?.nodeType !== 3) {
			var r = xn();
			return Oe?.before(r), ke(r), r;
		}
		Dn(Oe);
	}
	return Oe;
}
function I(e, t = !1) {
	if (!E) return /* @__PURE__ */ Sn(e);
	var n = P(e, t);
	return D(e), n;
}
function L(e, t = 1, n = !1) {
	let r = E ? Oe : e;
	for (var i; t--;) i = r, r = /* @__PURE__ */ Cn(r);
	if (!E) return r;
	if (n) {
		if (r?.nodeType !== 3) {
			var a = xn();
			return r === null ? i?.after(a) : r.before(a), ke(a), a;
		}
		Dn(r);
	}
	return ke(r), r;
}
function wn(e) {
	e.textContent = "";
}
function Tn() {
	return !1;
}
function En(e, t, n) {
	return t == null || t === "http://www.w3.org/1999/xhtml" ? n ? document.createElement(e, { is: n }) : document.createElement(e) : n ? document.createElementNS(t, e, { is: n }) : document.createElementNS(t, e);
}
function Dn(e) {
	if (e.nodeValue.length < 65536) return;
	let t = e.nextSibling;
	for (; t !== null && t.nodeType === 3;) t.remove(), e.nodeValue += t.nodeValue, t = e.nextSibling;
}
function On(e) {
	var t = ur;
	if (t === null) return sr.f |= de, e;
	if (!(t.f & 32768) && !(t.f & 4)) throw e;
	kn(e, t);
}
function kn(e, t) {
	if (!(t !== null && t.f & 16384)) {
		for (; t !== null;) {
			if (t.f & 128 && !(t.f & 33570816)) {
				if (!(t.f & 32768)) throw e;
				try {
					t.b.error(e);
					return;
				} catch (t) {
					e = t;
				}
			}
			t = t.parent;
		}
		throw e;
	}
}
//#endregion
//#region node_modules/svelte/src/internal/client/reactivity/effects.js
function An(e) {
	ur === null && (sr === null && Ve(e), Be()), ar && ze(e);
}
function jn(e, t) {
	var n = t.last;
	n === null ? t.last = t.first = e : (n.next = e, e.prev = n, t.last = e);
}
function Mn(e, t) {
	var n = ur;
	n !== null && n.f & 8192 && (e |= te);
	var r = {
		ctx: tt,
		deps: null,
		nodes: null,
		f: e | T | 512,
		first: null,
		fn: t,
		last: null,
		next: null,
		parent: n,
		b: n && n.b,
		prev: null,
		teardown: null,
		wv: 0,
		ac: null
	};
	It?.register_created_effect(r);
	var i = r;
	if (e & 4) Ht === null ? Kt.ensure().schedule(r) : Ht.push(r);
	else if (t !== null) {
		try {
			kr(r);
		} catch (e) {
			throw Yn(r), e;
		}
		i.deps === null && i.teardown === null && i.nodes === null && i.first === i.last && !(i.f & 524288) && (i = i.first, e & 16 && e & 65536 && i !== null && (i.f |= ae));
	}
	if (i !== null && (i.parent = n, n !== null && jn(i, n), sr !== null && sr.f & 2 && !(e & 64))) {
		var a = sr;
		(a.effects ??= []).push(i);
	}
	return r;
}
function Nn() {
	return sr !== null && !cr;
}
function Pn(e) {
	let t = Mn(8, null);
	return pt(t, w), t.teardown = e, t;
}
function Fn(e) {
	An("$effect");
	var t = ur.f;
	if (!sr && t & 32 && tt !== null && !tt.i) {
		var n = tt;
		(n.e ??= []).push(e);
	} else return In(e);
}
function In(e) {
	return Mn(4 | se, e);
}
function Ln(e) {
	return An("$effect.pre"), Mn(8 | se, e);
}
function Rn(e) {
	Kt.ensure();
	let t = Mn(64 | oe, e);
	return () => {
		Yn(t);
	};
}
function zn(e) {
	Kt.ensure();
	let t = Mn(64 | oe, e);
	return (e = {}) => new Promise((n) => {
		e.outro ? Qn(t, () => {
			Yn(t), n(void 0);
		}) : (Yn(t), n(void 0));
	});
}
function Bn(e) {
	return Mn(4, e);
}
function Vn(e) {
	return Mn(ue | oe, e);
}
function Hn(e, t = 0) {
	return Mn(8 | t, e);
}
function R(e, t = [], n = [], r = []) {
	St(r, t, n, (t) => {
		Mn(8, () => {
			e(...t.map(z));
		});
	});
}
function Un(e, t = 0) {
	return Mn(16 | t, e);
}
function Wn(e, t = 0) {
	return Mn(C | t, e);
}
function Gn(e) {
	return Mn(32 | oe, e);
}
function Kn(e) {
	var t = e.teardown;
	if (t !== null) {
		let n = ar, r = sr;
		or(!0), lr(null);
		try {
			t.call(null);
		} catch (t) {
			kn(t, e.parent);
		} finally {
			or(n), lr(r);
		}
	}
}
function qn(e, t = !1) {
	var n = e.first;
	for (e.first = e.last = null; n !== null;) {
		let e = n.ac;
		e !== null && bt(() => {
			e.abort(xe);
		});
		var r = n.next;
		n.f & 64 ? n.parent = null : Yn(n, t), n = r;
	}
}
function Jn(e) {
	for (var t = e.first; t !== null;) {
		var n = t.next;
		t.f & 32 || Yn(t), t = n;
	}
}
function Yn(e, t = !0) {
	var n = !1;
	(t || e.f & 262144) && e.nodes !== null && e.nodes.end !== null && (Xn(e.nodes.start, e.nodes.end), n = !0), e.f |= ie, qn(e, t && !n), Or(e, 0);
	var r = e.nodes && e.nodes.t;
	if (r !== null) for (let e of r) e.stop();
	Kn(e), e.f ^= ie, e.f |= ne;
	var i = e.parent;
	i !== null && i.first !== null && Zn(e), e.next = e.prev = e.teardown = e.ctx = e.deps = e.fn = e.nodes = e.ac = e.b = null;
}
function Xn(e, t) {
	for (; e !== null;) {
		var n = e === t ? null : /* @__PURE__ */ Cn(e);
		e.remove(), e = n;
	}
}
function Zn(e) {
	var t = e.parent, n = e.prev, r = e.next;
	n !== null && (n.next = r), r !== null && (r.prev = n), t !== null && (t.first === e && (t.first = r), t.last === e && (t.last = n));
}
function Qn(e, t, n = !0) {
	var r = [];
	e.f |= 256, $n(e, r, !0);
	var i = () => {
		n && Yn(e), t && t();
	}, a = r.length;
	if (a > 0) {
		var o = () => --a || i();
		for (var s of r) s.out(o);
	} else i();
}
function $n(e, t, n) {
	if (!(e.f & 8192)) {
		e.f ^= te;
		var r = e.nodes && e.nodes.t;
		if (r !== null) for (let e of r) (e.is_global || n) && t.push(e);
		for (var i = e.first; i !== null;) {
			var a = i.next;
			if (!(i.f & 64)) {
				var o = !!(i.f & 65536) || !!(i.f & 32) && !!(e.f & 16);
				$n(i, t, o ? n : !1);
			}
			i = a;
		}
	}
}
function er(e) {
	e.f &= -257, tr(e, !0);
}
function tr(e, t) {
	if (!(e.f & 256) && e.f & 8192) {
		e.f ^= te, e.f & 1024 || (pt(e, T), Kt.ensure().schedule(e));
		for (var n = e.first; n !== null;) {
			var r = n.next, i = !!(n.f & 65536) || !!(n.f & 32);
			tr(n, i ? t : !1), n = r;
		}
		var a = e.nodes && e.nodes.t;
		if (a !== null) for (let e of a) (e.is_global || t) && e.in();
	}
}
function nr(e, t) {
	if (e.nodes) for (var n = e.nodes.start, r = e.nodes.end; n !== null;) {
		var i = n === r ? null : /* @__PURE__ */ Cn(n);
		t.append(n), n = i;
	}
}
//#endregion
//#region node_modules/svelte/src/internal/client/legacy.js
var rr = null, ir = !1, ar = !1;
function or(e) {
	ar = e;
}
var sr = null, cr = !1;
function lr(e) {
	sr = e;
}
var ur = null;
function dr(e) {
	ur = e;
}
var fr = null;
function pr(e) {
	sr !== null && (sr.f & 2097152 || sr.f & 2) && (fr ??= /* @__PURE__ */ new Set()).add(e);
}
var mr = null, hr = 0, gr = null;
function _r(e) {
	gr = e;
}
var vr = 1, yr = 0, br = yr;
function xr(e) {
	br = e;
}
function Sr() {
	return ++vr;
}
function Cr(e) {
	var t = e.f;
	if (t & 2048) return !0;
	if (t & 4096) {
		for (var n = e.deps, r = n.length, i = 0; i < r; i++) {
			var a = n[i];
			if (Cr(a) && Mt(a), a.wv > e.wv) return !0;
		}
		t & 512 && Rt === null && pt(e, w);
	}
	return !1;
}
function wr(e, t, n = !0) {
	var r = e.reactions;
	if (r !== null && !(fr !== null && fr.has(e))) for (var i = 0; i < r.length; i++) {
		var a = r[i];
		a.f & 2 ? wr(a, t, !1) : t === a && (n ? pt(a, T) : a.f & 1024 && pt(a, ee), Zt(a));
	}
}
function Tr(e) {
	var t = mr, n = hr, r = gr, i = sr, a = fr, o = tt, s = cr, c = br, l = e.f;
	mr = null, hr = 0, gr = null, sr = l & 96 ? null : e, fr = null, nt(e.ctx), cr = !1, br = ++yr, e.ac !== null && (bt(() => {
		e.ac.abort(xe);
	}), e.ac = null);
	try {
		e.f |= le;
		var u = e.fn, d = u();
		e.f |= re;
		var f = Er(e);
		if (st() && gr !== null && !cr && f !== null && !(e.f & 6146)) for (var p = 0; p < gr.length; p++) wr(gr[p], e);
		if (i !== null && i !== e) {
			if (yr++, i.deps !== null) for (let e = 0; e < n; e += 1) i.deps[e].rv = yr;
			if (t !== null) for (let e of t) e.rv = yr;
			gr !== null && (r === null ? r = gr : r.push(...gr));
		}
		return e.f & 8388608 && (e.f ^= de), d;
	} catch (t) {
		return Er(e), On(t);
	} finally {
		e.f ^= le, mr = t, hr = n, gr = r, sr = i, fr = a, nt(o), cr = s, br = c;
	}
}
function Er(e) {
	var t = e.deps, n = It?.is_fork;
	if (mr !== null) {
		var r;
		if (n || Or(e, hr), t !== null && hr > 0) for (t.length = hr + mr.length, r = 0; r < mr.length; r++) t[hr + r] = mr[r];
		else e.deps = t = mr;
		if (Nn() && e.f & 512) for (r = hr; r < t.length; r++) (t[r].reactions ??= []).push(e);
	} else !n && t !== null && hr < t.length && (Or(e, hr), t.length = hr);
	return t;
}
function Dr(e, n) {
	let r = n.reactions;
	if (r !== null) {
		var i = a.call(r, e);
		if (i !== -1) {
			var s = r.length - 1;
			s === 0 ? r = n.reactions = null : (r[i] = r[s], r.pop());
		}
	}
	if (r === null && n.f & 2 && (mr === null || !o.call(mr, n))) {
		var c = n;
		c.f & 512 && (c.f ^= 512), c.v !== t && mt(c), c.ac !== null && bt(() => {
			c.ac.abort(xe), c.ac = null, pt(c, T);
		}), Nt(c), Or(c, 0);
	}
}
function Or(e, t) {
	var n = e.deps;
	if (n !== null) for (var r = t; r < n.length; r++) Dr(e, n[r]);
}
function kr(e) {
	var t = e.f;
	if (!(t & 16384)) {
		pt(e, w);
		var n = ur, r = ir;
		ur = e, ir = !(t & 96);
		try {
			t & 16777232 ? Jn(e) : qn(e), Kn(e);
			var i = Tr(e);
			e.teardown = typeof i == "function" ? i : null, e.wv = vr;
		} finally {
			ir = r, ur = n;
		}
	}
}
async function Ar() {
	await Promise.resolve(), qt();
}
function z(e) {
	var t = !!(e.f & 2);
	if (rr?.add(e), sr !== null && !cr && !(ur !== null && ur.f & 16384) && (fr === null || !fr.has(e))) {
		var n = sr.deps;
		if (sr.f & 2097152) e.rv < yr && (e.rv = yr, mr === null && n !== null && n[hr] === e ? hr++ : mr === null ? mr = [e] : mr.push(e));
		else {
			sr.deps ??= [], o.call(sr.deps, e) || sr.deps.push(e);
			var r = e.reactions;
			r === null ? e.reactions = [sr] : o.call(r, sr) || r.push(sr);
		}
	}
	if (ar && tn.has(e)) return tn.get(e);
	if (t) {
		var i = e;
		if (ar) {
			var a = i.v;
			return (!(i.f & 1024) && i.reactions !== null || Mr(i)) && (a = jt(i)), tn.set(i, a), a;
		}
		var s = !(i.f & 512) && !cr && sr !== null && (ir || !!(sr.f & 512)), c = (i.f & re) === 0;
		Cr(i) && (s && (i.f |= 512), Mt(i)), s && !c && (Pt(i), jr(i));
	}
	if (Rt?.has(e)) return Rt.get(e);
	if (e.f & 8388608) throw e.v;
	return e.v;
}
function jr(e) {
	if (e.f |= 512, e.deps !== null) for (let t of e.deps) (t.reactions ??= []).push(e), t.f & 2 && !(t.f & 512) && (Pt(t), jr(t));
}
function Mr(e) {
	if (e.v === t) return !0;
	if (e.deps === null) return !1;
	for (let t of e.deps) if (tn.has(t) || t.f & 2 && Mr(t)) return !0;
	return !1;
}
function Nr(e) {
	var t = cr;
	try {
		return cr = !0, e();
	} finally {
		cr = t;
	}
}
function Pr(e) {
	if (!(typeof e != "object" || !e || e instanceof EventTarget)) {
		if (fe in e) Fr(e);
		else if (!Array.isArray(e)) for (let t in e) {
			let n = e[t];
			typeof n == "object" && n && fe in n && Fr(n);
		}
	}
}
function Fr(e, t = /* @__PURE__ */ new Set()) {
	if (typeof e == "object" && e && !(e instanceof EventTarget) && !t.has(e)) {
		t.add(e), e instanceof Date && e.getTime();
		for (let n in e) try {
			Fr(e[n], t);
		} catch {}
		let n = p(e);
		if (n !== Object.prototype && n !== Array.prototype && n !== Map.prototype && n !== Set.prototype && n !== Date.prototype) {
			let t = u(n);
			for (let n in t) {
				let r = t[n].get;
				if (r) try {
					r.call(e);
				} catch {}
			}
		}
	}
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/elements/events.js
var Ir = Symbol("events"), Lr = /* @__PURE__ */ new Set(), Rr = /* @__PURE__ */ new Set();
function zr(e, t, n, r = {}) {
	function i(e) {
		if (r.capture || Gr.call(t, e), !e.cancelBubble) return bt(() => n?.call(this, e));
	}
	return e.startsWith("pointer") || e.startsWith("touch") || e === "wheel" ? (i.__removed = !1, ut(() => {
		i.__removed || t.addEventListener(e, i, r);
	})) : t.addEventListener(e, i, r), i;
}
function Br(e, t, n, r = {}) {
	var i = zr(t, e, n, r);
	return () => {
		i.__removed = !0, e.removeEventListener(t, i, r);
	};
}
function Vr(e, t, n, r, i) {
	var a = {
		capture: r,
		passive: i
	}, o = zr(e, t, n, a);
	(t === document.body || t === window || t === document || t instanceof HTMLMediaElement) && Pn(() => {
		o.__removed = !0, t.removeEventListener(e, o, a);
	});
}
function B(e, t, n) {
	(t[Ir] ??= {})[e] = n;
}
function Hr(e) {
	for (var t = 0; t < e.length; t++) Lr.add(e[t]);
	for (var n of Rr) n(e);
}
var Ur = null, Wr = !1;
function Gr(e) {
	var t = this, n = t.ownerDocument, r = e.type, i = e.composedPath?.() || [], a = i[0] || e.target;
	Ur = e, Wr || (Wr = !0, setTimeout(() => {
		Wr = !1, Ur = null;
	}));
	var o = 0, s = Ur === e && e[Ir];
	if (s) {
		var l = i.indexOf(s);
		if (l !== -1 && (t === document || t === window)) {
			e[Ir] = t;
			return;
		}
		var u = i.indexOf(t);
		if (u === -1) return;
		l <= u && (o = l);
	}
	if (a = i[o] || e.target, a !== t) {
		c(e, "currentTarget", {
			configurable: !0,
			get() {
				return a || n;
			}
		});
		var d = sr, f = ur;
		lr(null), dr(null);
		try {
			for (var p, m = []; a !== null && a !== t;) {
				try {
					var h = a[Ir]?.[r];
					h != null && (!a.disabled || e.target === a) && h.call(a, e);
				} catch (e) {
					p ? m.push(e) : p = e;
				}
				if (e.cancelBubble) break;
				o++, a = o < i.length ? i[o] : null;
			}
			if (p) {
				for (let e of m) queueMicrotask(() => {
					throw e;
				});
				throw p;
			}
		} finally {
			e[Ir] = t, delete e.currentTarget, lr(d), dr(f);
		}
	}
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/reconciler.js
var Kr = globalThis?.window?.trustedTypes && /* @__PURE__ */ globalThis.window.trustedTypes.createPolicy("svelte-trusted-html", { createHTML: (e) => e });
function qr(e) {
	return Kr?.createHTML(e) ?? e;
}
function Jr(e) {
	var t = En("template");
	return t.innerHTML = qr(e.replaceAll("<!>", "<!---->")), t.content;
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/template.js
function Yr(e, t) {
	var n = ur;
	n.nodes === null && (n.nodes = {
		start: e,
		end: t,
		a: null,
		t: null
	});
}
/*#__NO_SIDE_EFFECTS__*/
function V(e, t) {
	var n = !!(t & 1), r = !!(t & 2), i, a = !e.startsWith("<!>");
	return () => {
		if (E) return Yr(Oe, null), Oe;
		i === void 0 && (i = Jr(a ? e : "<!>" + e), n || (i = /* @__PURE__ */ Sn(i)));
		var t = r || _n ? document.importNode(i, !0) : i.cloneNode(!0);
		if (n) {
			var o = /* @__PURE__ */ Sn(t), s = t.lastChild;
			Yr(o, s);
		} else Yr(t, t);
		return t;
	};
}
/*#__NO_SIDE_EFFECTS__*/
function Xr(e, t, n = "svg") {
	var r = !e.startsWith("<!>"), i = !!(t & 1), a = `<${n}>${r ? e : "<!>" + e}</${n}>`, o;
	return () => {
		if (E) return Yr(Oe, null), Oe;
		if (!o) {
			var e = /* @__PURE__ */ Sn(Jr(a));
			if (i) for (o = document.createDocumentFragment(); /* @__PURE__ */ Sn(e);) o.appendChild(/* @__PURE__ */ Sn(e));
			else o = /* @__PURE__ */ Sn(e);
		}
		var t = o.cloneNode(!0);
		if (i) {
			var n = /* @__PURE__ */ Sn(t), r = t.lastChild;
			Yr(n, r);
		} else Yr(t, t);
		return t;
	};
}
/*#__NO_SIDE_EFFECTS__*/
function Zr(e, t) {
	return /* @__PURE__ */ Xr(e, t, "svg");
}
function Qr(e = "") {
	if (!E) {
		var t = xn(e + "");
		return Yr(t, t), t;
	}
	var n = Oe;
	return n.nodeType === 3 ? Dn(n) : (n.before(n = xn()), ke(n)), Yr(n, n), n;
}
function H() {
	if (E) return Yr(Oe, null), Oe;
	var e = document.createDocumentFragment(), t = document.createComment(""), n = xn();
	return e.append(t, n), Yr(t, n), e;
}
function U(e, t) {
	if (E) {
		var n = ur;
		(!(n.f & 32768) || n.nodes.end === null) && (n.nodes.end = Oe), Ae();
		return;
	}
	e !== null && e.before(t);
}
//#endregion
//#region node_modules/svelte/src/utils.js
function $r(e) {
	return e.endsWith("capture") && e !== "gotpointercapture" && e !== "lostpointercapture";
}
var ei = [
	"beforeinput",
	"click",
	"change",
	"dblclick",
	"contextmenu",
	"focusin",
	"focusout",
	"input",
	"keydown",
	"keyup",
	"mousedown",
	"mousemove",
	"mouseout",
	"mouseover",
	"mouseup",
	"pointerdown",
	"pointermove",
	"pointerout",
	"pointerover",
	"pointerup",
	"touchend",
	"touchmove",
	"touchstart"
];
function ti(e) {
	return ei.includes(e);
}
var ni = /* @__PURE__ */ "allowfullscreen.async.autofocus.autoplay.checked.controls.default.disabled.formnovalidate.indeterminate.inert.ismap.loop.multiple.muted.nomodule.novalidate.open.playsinline.readonly.required.reversed.seamless.selected.webkitdirectory.defer.disablepictureinpicture.disableremoteplayback".split("."), ri = {
	formnovalidate: "formNoValidate",
	ismap: "isMap",
	nomodule: "noModule",
	playsinline: "playsInline",
	readonly: "readOnly",
	defaultvalue: "defaultValue",
	defaultchecked: "defaultChecked",
	srcobject: "srcObject",
	novalidate: "noValidate",
	allowfullscreen: "allowFullscreen",
	disablepictureinpicture: "disablePictureInPicture",
	disableremoteplayback: "disableRemotePlayback"
};
function ii(e) {
	return e = e.toLowerCase(), ri[e] ?? e;
}
[...ni];
var ai = ["touchstart", "touchmove"];
function oi(e) {
	return ai.includes(e);
}
var si = [
	"textarea",
	"script",
	"style",
	"title"
];
function ci(e) {
	return si.includes(e);
}
//#endregion
//#region node_modules/svelte/src/reactivity/create-subscriber.js
function li(e) {
	let t = 0, n = rn(0), r;
	return () => {
		Nn() && (z(n), Hn(() => (t === 0 && (r = Nr(() => e(() => dn(n)))), t += 1, () => {
			ut(() => {
				--t, t === 0 && (r?.(), r = void 0, dn(n));
			});
		})));
	};
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/blocks/boundary.js
var ui = ae | oe;
function di(e, t, n, r) {
	new fi(e, t, n, r);
}
var fi = class {
	parent;
	is_pending = !1;
	transform_error;
	#e;
	#t = E ? Oe : null;
	#n;
	#r;
	#i;
	#a = null;
	#o = null;
	#s = null;
	#c = null;
	#l = 0;
	#u = 0;
	#d = !1;
	#f = /* @__PURE__ */ new Set();
	#p = /* @__PURE__ */ new Set();
	#m = null;
	#h = li(() => (this.#m = rn(this.#l), () => {
		this.#m = null;
	}));
	constructor(e, t, n, r) {
		this.#e = e, this.#n = t, this.#r = (e) => {
			var t = ur;
			t.b = this, t.f |= 128, n(e);
		}, this.parent = ur.b, this.transform_error = r ?? this.parent?.transform_error ?? ((e) => e), this.#i = Un(() => {
			if (E) {
				let e = this.#t;
				Ae();
				let t = e.data === "[!";
				if (e.data.startsWith("[?")) {
					let t = JSON.parse(e.data.slice(2));
					this.#_(t);
				} else t ? this.#y() : this.#g();
			} else this.#b();
		}, ui), E && (this.#e = Oe);
	}
	#g() {
		try {
			this.#a = Gn(() => this.#r(this.#e));
		} catch (e) {
			this.error(e);
		}
	}
	#_(e) {
		let t = this.#n.failed, { reset: n, invoke_onerror: r } = this.#v(e);
		ut(r), t && (this.#s = Gn(() => {
			t(this.#e, () => e, () => n);
		}));
	}
	#v(e) {
		var t = !1, n = !1;
		let r = () => {
			if (t) {
				Ee();
				return;
			}
			t = !0, n && qe(), this.#s !== null && Qn(this.#s, () => {
				this.#s = null;
			}), this.#S(() => {
				this.#b();
			});
		};
		return {
			reset: r,
			invoke_onerror: () => {
				try {
					n = !0, this.#n.onerror?.(e, r), n = !1;
				} catch (e) {
					kn(e, this.#i && this.#i.parent);
				}
			}
		};
	}
	#y() {
		let e = this.#n.pending;
		e && (this.is_pending = !0, this.#o = Gn(() => e(this.#e)), ut(() => {
			var e = this.#c = document.createDocumentFragment(), t = xn(), n = !1;
			if (e.append(t), this.#a = this.#S(() => {
				try {
					return Gn(() => this.#r(t));
				} catch (e) {
					try {
						this.error(e), n = !0;
					} catch (e) {
						kn(e, this.#i.parent);
					}
					return null;
				}
			}), this.#a === null) {
				this.#c = null, n && this.#x(It);
				return;
			}
			this.#u === 0 && (this.#e.before(e), this.#c = null, Qn(this.#o, () => {
				this.#o = null;
			}), this.#x(It));
		}));
	}
	#b() {
		try {
			if (this.is_pending = this.has_pending_snippet(), this.#u = 0, this.#l = 0, this.#a = Gn(() => {
				this.#r(this.#e);
			}), this.#u > 0) {
				var e = this.#c = document.createDocumentFragment();
				nr(this.#a, e);
				let t = this.#n.pending;
				this.#o = Gn(() => t(this.#e));
			} else this.#x(It);
		} catch (e) {
			this.error(e);
		}
	}
	#x(e) {
		this.is_pending = !1, e.transfer_effects(this.#f, this.#p);
	}
	defer_effect(e) {
		ht(e, this.#f, this.#p);
	}
	is_rendered() {
		return !this.is_pending && (!this.parent || this.parent.is_rendered());
	}
	has_pending_snippet() {
		return !!this.#n.pending;
	}
	#S(e) {
		var t = ur, n = sr, r = tt;
		dr(this.#i), lr(this.#i), nt(this.#i.ctx);
		try {
			return Kt.ensure(), e();
		} finally {
			dr(t), lr(n), nt(r);
		}
	}
	#C(e, t) {
		if (!this.has_pending_snippet()) {
			this.parent && this.parent.#C(e, t);
			return;
		}
		this.#u += e, this.#u === 0 && (this.#x(t), this.#o && Qn(this.#o, () => {
			this.#o = null;
		}), this.#c &&= (this.#e.before(this.#c), null));
	}
	update_pending_count(e, t) {
		this.#C(e, t), this.#l += e, !(!this.#m || this.#d) && (this.#d = !0, ut(() => {
			this.#d = !1, this.#m && cn(this.#m, this.#l);
		}));
	}
	get_effect_pending() {
		return this.#h(), z(this.#m);
	}
	error(e) {
		if (!this.#n.onerror && !this.#n.failed) throw e;
		It?.is_fork ? (this.#a && It.skip_effect(this.#a), this.#o && It.skip_effect(this.#o), this.#s && It.skip_effect(this.#s), It.oncommit(() => {
			this.#w(e);
		})) : this.#w(e);
	}
	#w(e) {
		this.#a &&= (Yn(this.#a), null), this.#o &&= (Yn(this.#o), null), this.#s &&= (Yn(this.#s), null), E && (ke(this.#t), O(), ke(je()));
		let t = this.#n.failed, n = (e) => {
			let { reset: n, invoke_onerror: r } = this.#v(e);
			r(), t && (this.#s = this.#S(() => {
				try {
					return Gn(() => {
						var r = ur;
						r.b = this, r.f |= 128, t(this.#e, () => e, () => n);
					});
				} catch (e) {
					return kn(e, this.#i.parent), null;
				}
			}));
		};
		ut(() => {
			var t;
			try {
				t = this.transform_error(e);
			} catch (e) {
				kn(e, this.#i && this.#i.parent);
				return;
			}
			typeof t == "object" && t && typeof t.then == "function" ? t.then(n, (e) => kn(e, this.#i && this.#i.parent)) : n(t);
		});
	}
};
function W(e, t) {
	var n = t == null ? "" : typeof t == "object" ? `${t}` : t;
	n !== (e[ye] ??= e.nodeValue) && (e[ye] = n, e.nodeValue = `${n}`);
}
function pi(e, t) {
	return hi(e, t);
}
var mi = /* @__PURE__ */ new Map();
function hi(t, { target: n, anchor: r, props: i = {}, events: a, context: o, intro: c = !0, transformError: l }) {
	bn();
	var u = void 0, d = zn(() => {
		var c = r ?? n.appendChild(xn());
		di(c, { pending: () => {} }, (n) => {
			k({});
			var r = tt;
			if (o && (r.c = o), a && (i.$$events = a), E && Yr(n, null), u = t(n, i) || ot(), E && (ur.nodes.end = Oe, Oe === null || Oe.nodeType !== 8 || Oe.data !== "]")) throw we(), e;
			A();
		}, l);
		var d = /* @__PURE__ */ new Set(), f = (e) => {
			for (var t = 0; t < e.length; t++) {
				var r = e[t];
				if (!d.has(r)) {
					d.add(r);
					var i = oi(r);
					for (let e of [n, document]) {
						var a = mi.get(e);
						a === void 0 && (a = /* @__PURE__ */ new Map(), mi.set(e, a));
						var o = a.get(r);
						o === void 0 ? (e.addEventListener(r, Gr, { passive: i }), a.set(r, 1)) : a.set(r, o + 1);
					}
				}
			}
		};
		return f(s(Lr)), Rr.add(f), () => {
			for (var e of d) for (let r of [n, document]) {
				var t = mi.get(r), i = t.get(e);
				--i == 0 ? (r.removeEventListener(e, Gr), t.delete(e), t.size === 0 && mi.delete(r)) : t.set(e, i);
			}
			Rr.delete(f), c !== r && c.parentNode?.removeChild(c);
		};
	});
	return gi.set(u, d), u;
}
var gi = /* @__PURE__ */ new WeakMap(), _i = class {
	anchor;
	#e = /* @__PURE__ */ new Map();
	#t = /* @__PURE__ */ new Map();
	#n = /* @__PURE__ */ new Map();
	#r = /* @__PURE__ */ new Set();
	#i = !0;
	constructor(e, t = !0) {
		this.anchor = e, this.#i = t;
	}
	#a = (e) => {
		if (this.#e.has(e)) {
			var t = this.#e.get(e), n = this.#t.get(t);
			if (n) er(n), this.#r.delete(t);
			else {
				var r = this.#n.get(t);
				r && (er(r.effect), this.#t.set(t, r.effect), this.#n.delete(t), r.fragment.lastChild.remove(), this.anchor.before(r.fragment), n = r.effect);
			}
			for (let [t, n] of this.#e) {
				if (this.#e.delete(t), t === e) break;
				let r = this.#n.get(n);
				r && (Yn(r.effect), this.#n.delete(n));
			}
			for (let [e, r] of this.#t) {
				if (e === t || this.#r.has(e)) continue;
				let i = () => {
					if (Array.from(this.#e.values()).includes(e)) {
						var t = document.createDocumentFragment();
						nr(r, t), t.append(xn()), this.#n.set(e, {
							effect: r,
							fragment: t
						});
					} else Yn(r);
					this.#r.delete(e), this.#t.delete(e);
				};
				this.#i || !n ? (this.#r.add(e), Qn(r, i, !1)) : i();
			}
		}
	};
	#o = (e) => {
		this.#e.delete(e);
		let t = Array.from(this.#e.values());
		for (let [e, n] of this.#n) t.includes(e) || (Yn(n.effect), this.#n.delete(e));
	};
	ensure(e, t) {
		var n = It, r = Tn();
		if (t && !this.#t.has(e) && !this.#n.has(e)) {
			if (r) {
				var i = document.createDocumentFragment(), a = xn();
				i.append(a), this.#n.set(e, {
					effect: Gn(() => t(a)),
					fragment: i
				});
			} else this.#t.set(e, Gn(() => t(this.anchor)));
		}
		if (this.#e.set(n, e), r) {
			for (let [t, r] of this.#t) t === e ? n.unskip_effect(r) : n.skip_effect(r);
			for (let [t, r] of this.#n) t === e ? n.unskip_effect(r.effect) : n.skip_effect(r.effect);
			n.oncommit(this.#a), n.ondiscard(this.#o);
		} else E && (this.anchor = Oe), this.#a(n);
	}
};
//#endregion
//#region node_modules/svelte/src/internal/client/dom/blocks/snippet.js
function vi(e, t, ...n) {
	var r = new _i(e);
	Un(() => {
		let e = t() ?? null;
		r.ensure(e, e && ((t) => e(t, ...n)));
	}, ae);
}
function yi(e) {
	tt === null && Ie("onMount"), Je && tt.l !== null ? xi(tt).m.push(e) : Fn(() => {
		let t = Nr(e);
		if (typeof t == "function") return t;
	});
}
function bi(e) {
	tt === null && Ie("onDestroy"), yi(() => () => Nr(e));
}
function xi(e) {
	var t = e.l;
	return t.u ??= {
		a: [],
		b: [],
		m: []
	};
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/blocks/if.js
function G(e, t, n = !1) {
	var r;
	E && (r = Oe, Ae());
	var i = new _i(e), a = n ? ae : 0;
	function o(e, t) {
		if (E) {
			var n = Me(r);
			if (e !== parseInt(n.substring(1))) {
				var a = je();
				ke(a), i.anchor = a, De(!1), i.ensure(e, t), De(!0);
				return;
			}
		}
		i.ensure(e, t);
	}
	Un(() => {
		var e = !1;
		t((t, n = 0) => {
			e = !0, o(n, t);
		}), e || o(-1, null);
	}, a);
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/blocks/key.js
var Si = Symbol("NaN");
function Ci(e, t, n) {
	E && Ae();
	var r = new _i(e), i = !st();
	Un(() => {
		var e = t();
		e !== e && (e = Si), i && typeof e == "object" && e && (e = {}), r.ensure(e, n);
	});
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/blocks/css-props.js
function wi(e, t) {
	E && ke(/* @__PURE__ */ Sn(e)), Hn(() => {
		var n = t();
		for (var r in n) {
			var i = n[r];
			i == null || i === "" ? e.style.removeProperty(r) : e.style.setProperty(r, i);
		}
	});
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/blocks/each.js
function Ti(e, t) {
	return t;
}
function Ei(e, t, n) {
	for (var r = [], i = t.length, a, o = t.length, c = 0; c < i; c++) {
		let n = t[c];
		Qn(n, () => {
			if (a) {
				if (a.pending.delete(n), a.done.add(n), a.pending.size === 0) {
					var t = e.outrogroups;
					Di(e, s(a.done)), t.delete(a), t.size === 0 && (e.outrogroups = null);
				}
			} else --o;
		}, !1);
	}
	if (o === 0) {
		var l = r.length === 0 && n !== null && e.pending.size === 0;
		if (l) {
			var u = n, d = u.parentNode;
			wn(d), d.append(u), e.items.clear();
		}
		Di(e, t, !l);
	} else a = {
		pending: new Set(t),
		done: /* @__PURE__ */ new Set()
	}, (e.outrogroups ??= /* @__PURE__ */ new Set()).add(a);
}
function Di(e, t, n = !0) {
	var r;
	if (e.pending.size > 0) {
		r = /* @__PURE__ */ new Set();
		for (let t of e.pending.values()) for (let n of t) r.add(e.items.get(n).e);
	}
	for (var i = 0; i < t.length; i++) {
		var a = t[i];
		r?.has(a) ? (a.f |= ce, nr(a, document.createDocumentFragment())) : Yn(t[i], n);
	}
}
var Oi;
function K(e, t, n, r, a, o = null) {
	var c = e, l = /* @__PURE__ */ new Map();
	if (t & 4) {
		var u = e;
		c = E ? ke(/* @__PURE__ */ Sn(u)) : u.appendChild(xn());
	}
	E && Ae();
	var d = null, f = /* @__PURE__ */ kt(() => {
		var e = n();
		return i(e) ? e : e == null ? [] : s(e);
	}), p, m = /* @__PURE__ */ new Map(), h = !0;
	function g(e) {
		v.effect.f & 16384 || (v.pending.delete(e), v.fallback = d, Ai(v, p, c, t, r), d !== null && (p.length === 0 ? d.f & 33554432 ? (d.f ^= ce, Mi(d, null, c)) : er(d) : Qn(d, () => {
			d = null;
		})));
	}
	function _(e) {
		v.pending.delete(e);
	}
	var v = {
		effect: Un(() => {
			p = z(f);
			var e = p.length;
			let i = !1;
			E && Me(c) === "[!" != (e === 0) && (c = je(), ke(c), De(!1), i = !0);
			for (var s = /* @__PURE__ */ new Set(), u = It, v = Tn(), y = 0; y < e; y += 1) {
				E && Oe.nodeType === 8 && Oe.data === "]" && (c = Oe, i = !0, De(!1));
				var b = p[y], x = r(b, y), S = h ? null : l.get(x);
				S ? (S.v && cn(S.v, b), S.i && cn(S.i, y), v && u.unskip_effect(S.e)) : (S = ji(l, h ? c : Oi ??= xn(), b, x, y, a, t, n), h || (S.e.f |= ce), l.set(x, S)), s.add(x);
			}
			if (e === 0 && o && !d && (h ? d = Gn(() => o(c)) : (d = Gn(() => o(Oi ??= xn())), d.f |= ce)), e > s.size && Re("", "", ""), E && e > 0 && ke(je()), !h) {
				if (m.set(u, s), v) {
					for (let [e, t] of l) s.has(e) || u.skip_effect(t.e);
					u.oncommit(g), u.ondiscard(_);
				} else g(u);
			}
			i && De(!0), z(f);
		}),
		flags: t,
		items: l,
		pending: m,
		outrogroups: null,
		fallback: d
	};
	h = !1, E && (c = Oe);
}
function ki(e) {
	for (; e !== null && !(e.f & 32);) e = e.next;
	return e;
}
function Ai(e, t, n, r, i) {
	var a = !!(r & 8), o = t.length, c = e.items, l = ki(e.effect.first), u, d = null, f, p = [], m = [], h, g, _, v;
	if (a) for (v = 0; v < o; v += 1) h = t[v], g = i(h, v), _ = c.get(g).e, _.f & 33554432 || (_.nodes?.a?.measure(), (f ??= /* @__PURE__ */ new Set()).add(_));
	for (v = 0; v < o; v += 1) {
		if (h = t[v], g = i(h, v), _ = c.get(g).e, e.outrogroups !== null) for (let t of e.outrogroups) t.pending.delete(_), t.done.delete(_);
		if (_.f & 8192 && (er(_), a && (_.nodes?.a?.unfix(), (f ??= /* @__PURE__ */ new Set()).delete(_))), _.f & 33554432) {
			if (_.f ^= ce, _ === l) Mi(_, null, n);
			else {
				var y = d ? d.next : l;
				_ === e.effect.last && (e.effect.last = _.prev), _.prev && (_.prev.next = _.next), _.next && (_.next.prev = _.prev), Ni(e, d, _), Ni(e, _, y), Mi(_, y, n), d = _, p = [], m = [], l = ki(d.next);
				continue;
			}
		}
		if (_ !== l) {
			if (u !== void 0 && u.has(_)) {
				if (p.length < m.length) {
					var b = m[0], x;
					d = b.prev;
					var S = p[0], C = p[p.length - 1];
					for (x = 0; x < p.length; x += 1) Mi(p[x], b, n);
					for (x = 0; x < m.length; x += 1) u.delete(m[x]);
					Ni(e, S.prev, C.next), Ni(e, d, S), Ni(e, C, b), l = b, d = C, --v, p = [], m = [];
				} else u.delete(_), Mi(_, l, n), Ni(e, _.prev, _.next), Ni(e, _, d === null ? e.effect.first : d.next), Ni(e, d, _), d = _;
				continue;
			}
			for (p = [], m = []; l !== null && l !== _;) (u ??= /* @__PURE__ */ new Set()).add(l), m.push(l), l = ki(l.next);
			if (l === null) continue;
		}
		_.f & 33554432 || p.push(_), d = _, l = ki(_.next);
	}
	if (e.outrogroups !== null) {
		for (let t of e.outrogroups) t.pending.size === 0 && (Di(e, s(t.done)), e.outrogroups?.delete(t));
		e.outrogroups.size === 0 && (e.outrogroups = null);
	}
	if (l !== null || u !== void 0) {
		var w = [];
		if (u !== void 0) for (_ of u) _.f & 8192 || w.push(_);
		for (; l !== null;) !(l.f & 8192) && l !== e.fallback && w.push(l), l = ki(l.next);
		var T = w.length;
		if (T > 0) {
			var ee = r & 4 && o === 0 ? n : null;
			if (a) {
				for (v = 0; v < T; v += 1) w[v].nodes?.a?.measure();
				for (v = 0; v < T; v += 1) w[v].nodes?.a?.fix();
			}
			Ei(e, w, ee);
		}
	}
	a && ut(() => {
		if (f !== void 0) for (_ of f) _.nodes?.a?.apply();
	});
}
function ji(e, t, n, r, i, a, o, s) {
	var c = o & 1 ? o & 16 ? rn(n) : /* @__PURE__ */ an(n, !1, !1) : null, l = o & 2 ? rn(i) : null;
	return {
		v: c,
		i: l,
		e: Gn(() => (a(t, c ?? n, l ?? i, s), () => {
			e.delete(r);
		}))
	};
}
function Mi(e, t, n) {
	if (e.nodes) for (var r = e.nodes.start, i = e.nodes.end, a = t && !(t.f & 33554432) ? t.nodes.start : n; r !== null;) {
		var o = /* @__PURE__ */ Cn(r);
		if (a.before(r), r === i) return;
		r = o;
	}
}
function Ni(e, t, n) {
	t === null ? e.effect.first = n : t.next = n, n === null ? e.effect.last = t : n.prev = t;
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/blocks/slot.js
function q(e, t, n, r, i) {
	if (E && Ae(), t.$$host?.$$shadowRoot) {
		let t = En("slot");
		if (n !== "default" && (t.name = n), U(e, t), i !== null) {
			let e = xn();
			t.append(e), i(e);
		}
		return;
	}
	var a = t.$$slots?.[n], o = !1;
	a === !0 && (a = t[n === "default" ? "children" : n], o = !0), a === void 0 ? i !== null && i(e) : a(e, o ? () => r : r);
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/blocks/svelte-component.js
function Pi(e, t, n) {
	var r;
	E && (r = Oe, Ae());
	var i = new _i(e);
	Un(() => {
		var e = t() ?? null;
		if (E && Me(r) === "[" != (e !== null)) {
			var a = je();
			ke(a), i.anchor = a, De(!1), i.ensure(e, e && ((t) => n(t, e))), De(!0);
			return;
		}
		i.ensure(e, e && ((t) => n(t, e)));
	}, ae);
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/blocks/svelte-element.js
function Fi(e, t, n, i, a, o) {
	let s = E;
	E && Ae();
	var c = null;
	E && Oe.nodeType === 1 && (c = Oe, Ae());
	var l = E ? Oe : e, u = new _i(l, !1);
	Un(() => {
		let e = t() || null;
		var o = a ? a() : n || e === "svg" ? r : void 0;
		if (e === null) {
			u.ensure(null, null);
			return;
		}
		return u.ensure(e, (t) => {
			if (e) {
				if (c = E ? c : En(e, o), Yr(c, c), i) {
					var n = null;
					E && ci(e) && c.append(n = document.createComment(""));
					var r = E ? /* @__PURE__ */ Sn(c) : c.appendChild(xn());
					E && (r === null ? De(!1) : ke(r)), i(c, r), n?.remove();
				}
				ur.nodes.end = c, t.before(c);
			}
			E && ke(t);
		}), () => {};
	}, ae), Pn(() => {}), s && (De(!0), ke(l));
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/elements/actions.js
function Ii(e, t, n) {
	Bn(() => {
		var r = Nr(() => t(e, n?.()) || {});
		if (n && r?.update) {
			var i = !1, a = {};
			Hn(() => {
				var e = n();
				Pr(e), i && Pe(a, e) && (a = e, r.update(e));
			}), i = !0;
		}
		if (r?.destroy) return () => r.destroy();
	});
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/elements/attachments.js
function Li(e, t) {
	var n = void 0, r;
	Wn(() => {
		n !== (n = t()) && (r &&= (Yn(r), null), n && (r = Gn(() => {
			Bn(() => n(e));
		})));
	});
}
//#endregion
//#region node_modules/clsx/dist/clsx.mjs
function Ri(e) {
	var t, n, r = "";
	if (typeof e == "string" || typeof e == "number") r += e;
	else if (typeof e == "object") {
		if (Array.isArray(e)) {
			var i = e.length;
			for (t = 0; t < i; t++) e[t] && (n = Ri(e[t])) && (r && (r += " "), r += n);
		} else for (n in e) e[n] && (r && (r += " "), r += n);
	}
	return r;
}
function zi() {
	for (var e, t, n = 0, r = "", i = arguments.length; n < i; n++) (e = arguments[n]) && (t = Ri(e)) && (r && (r += " "), r += t);
	return r;
}
//#endregion
//#region node_modules/svelte/src/internal/shared/attributes.js
function Bi(e) {
	return typeof e == "object" ? zi(e) : e ?? "";
}
var Vi = [..." 	\n\r\f\xA0\v﻿"];
function Hi(e, t, n) {
	var r = e == null ? "" : "" + e;
	if (t && (r = r ? r + " " + t : t), n) {
		for (var i of Object.keys(n)) if (n[i]) r = r ? r + " " + i : i;
		else if (r.length) for (var a = i.length, o = 0; (o = r.indexOf(i, o)) >= 0;) {
			var s = o + a;
			(o === 0 || Vi.includes(r[o - 1])) && (s === r.length || Vi.includes(r[s])) ? r = (o === 0 ? "" : r.substring(0, o)) + r.substring(s + 1) : o = s;
		}
	}
	return r === "" ? null : r;
}
function Ui(e, t = !1) {
	var n = t ? " !important;" : ";", r = "";
	for (var i of Object.keys(e)) {
		var a = e[i];
		a != null && a !== "" && (r += " " + i + ": " + a + n);
	}
	return r;
}
function Wi(e) {
	return e[0] !== "-" || e[1] !== "-" ? e.toLowerCase() : e;
}
function Gi(e, t) {
	if (t) {
		var n = "", r, i;
		if (Array.isArray(t) ? (r = t[0], i = t[1]) : r = t, e) {
			e = String(e).replaceAll(/\/\*.*?\*\//g, "").trim();
			var a = !1, o = 0, s = !1, c = [];
			r && c.push(...Object.keys(r).map(Wi)), i && c.push(...Object.keys(i).map(Wi));
			var l = 0, u = -1;
			let t = e.length;
			for (var d = 0; d < t; d++) {
				var f = e[d];
				if (s ? f === "/" && e[d - 1] === "*" && (s = !1) : a ? a === f && (a = !1) : f === "/" && e[d + 1] === "*" ? s = !0 : f === "\"" || f === "'" ? a = f : f === "(" ? o++ : f === ")" && o--, !s && a === !1 && o === 0) {
					if (f === ":" && u === -1) u = d;
					else if (f === ";" || d === t - 1) {
						if (u !== -1) {
							var p = Wi(e.substring(l, u).trim());
							if (!c.includes(p)) {
								f !== ";" && d++;
								var m = e.substring(l, d).trim();
								n += " " + m + ";";
							}
						}
						l = d + 1, u = -1;
					}
				}
			}
		}
		return r && (n += Ui(r)), i && (n += Ui(i, !0)), n = n.trim(), n === "" ? null : n;
	}
	return e == null ? null : String(e);
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/elements/class.js
function J(e, t, n, r, i, a) {
	var o = e[_e];
	if (E || o !== n || o === void 0) {
		var s = Hi(n, r, a);
		(!E || s !== e.getAttribute("class")) && (s == null ? e.removeAttribute("class") : t ? e.className = s : e.setAttribute("class", s)), e[_e] = n;
	} else if (a && i !== a) for (var c in a) {
		var l = !!a[c];
		(i == null || l !== !!i[c]) && e.classList.toggle(c, l);
	}
	return a;
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/elements/style.js
function Ki(e, t = {}, n, r) {
	for (var i in n) {
		var a = n[i];
		t[i] !== a && (n[i] == null ? e.style.removeProperty(i) : e.style.setProperty(i, a, r));
	}
}
function qi(e, t, n, r) {
	var i = e[ve];
	if (E || i !== t) {
		var a = Gi(t, r);
		(!E || a !== e.getAttribute("style")) && (a == null ? e.removeAttribute("style") : e.style.cssText = a), e[ve] = t;
	} else r && (Array.isArray(r) ? (Ki(e, n?.[0], r[0]), Ki(e, n?.[1], r[1], "important")) : Ki(e, n, r));
	return r;
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/elements/bindings/select.js
function Ji(e, t) {
	t ? e.hasAttribute("selected") || e.setAttribute("selected", "") : e.removeAttribute("selected");
}
function Yi(e, t) {
	var n = !("__defaultValue" in e);
	(n || e.__defaultValue !== t) && (e.__defaultValue = t, Xi(e, !n || "__value" in e));
}
function Xi(e, t) {
	var n = e.__defaultValue, r = e.multiple, a = r ? n ?? [] : null;
	if (!r || i(a)) {
		var o = e.selectedIndex, s = t && r ? new Set(e.selectedOptions) : null;
		for (var c of e.options) {
			var l = ea(c);
			Ji(c, r ? a.includes(l) : hn(l, n));
		}
		if (t) {
			if (s !== null) for (c of e.options) {
				var u = s.has(c);
				c.selected !== u && (c.selected = u);
			}
			else e.selectedIndex !== o && (e.selectedIndex = o);
		}
	}
}
function Zi(e, t, n = !1) {
	if (e.multiple) {
		if (t == null) return;
		if (!i(t)) return Te();
		for (var r of e.options) r.selected = t.includes(ea(r));
		return;
	}
	for (r of e.options) if (hn(ea(r), t)) {
		r.selected = !0;
		return;
	}
	(!n || t !== void 0) && (e.selectedIndex = -1);
}
function Qi(e) {
	var t = new MutationObserver((t) => {
		t.every(ta) || ("__defaultValue" in e && Xi(e, !1), "__value" in e && Zi(e, e.__value));
	});
	t.observe(e, {
		childList: !0,
		subtree: !0,
		attributes: !0,
		attributeFilter: ["value"]
	}), Pn(() => {
		t.disconnect();
	});
}
function $i(e, t, n = t) {
	var r = /* @__PURE__ */ new WeakSet(), i = !0;
	xt(e, "change", (t) => {
		var i = t ? "[selected]" : ":checked", a;
		if (e.multiple) a = [].map.call(e.querySelectorAll(i), ea);
		else {
			var o = e.querySelector(i) ?? e.querySelector("option:not([disabled])");
			a = o && ea(o);
		}
		n(a), e.__value = a, It !== null && r.add(It);
	}), Bn(() => {
		var a = t();
		if (e === document.activeElement) {
			var o = It;
			if (r.has(o)) return;
		}
		if (Zi(e, a, i), i && a === void 0) {
			var s = e.querySelector(":checked");
			s !== null && (a = ea(s), n(a));
		}
		e.__value = a, i = !1;
	});
}
function ea(e) {
	return "__value" in e ? e.__value : e.value;
}
function ta(e) {
	if (e.target.closest("selectedcontent") !== null) return !0;
	if (e.type === "childList") {
		var t = [...e.addedNodes, ...e.removedNodes];
		return t.length > 0 && t.every((e) => e.nodeName === "SELECTEDCONTENT");
	}
	return !1;
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/elements/attributes.js
var na = Symbol("class"), ra = Symbol("style"), ia = Symbol("is custom element"), aa = Symbol("is html"), oa = Se ? "link" : "LINK", sa = Se ? "input" : "INPUT", ca = Se ? "option" : "OPTION", la = Se ? "select" : "SELECT", ua = Se ? "progress" : "PROGRESS";
function da(e) {
	if (E) {
		var t = !1, n = () => {
			if (!t) {
				if (t = !0, e.hasAttribute("value")) {
					var n = e.value;
					Y(e, "value", null), e.value = n;
				}
				if (e.hasAttribute("checked")) {
					var r = e.checked;
					Y(e, "checked", null), e.checked = r;
				}
			}
		};
		e[be] = n, ut(n), yt();
	}
}
function fa(e, t) {
	var n = ga(e);
	n.value !== (n.value = t ?? void 0) && (e.value !== t || t === 0 && e.nodeName === ua) && (e.value = t ?? "");
}
function pa(e, t) {
	var n = ga(e);
	n.checked !== (n.checked = t ?? void 0) && (e.checked = t);
}
function Y(e, t, n, r) {
	var i = ga(e);
	E && (i[t] = e.getAttribute(t), t === "src" || t === "srcset" || t === "href" && e.nodeName === oa) || i[t] !== (i[t] = n) && (t === "loading" && (e[he] = n), n == null ? e.removeAttribute(t) : typeof n != "string" && va(e).has(t) ? e[t] = n : e.setAttribute(t, n));
}
function ma(e, n, r, i, a = !1, o = !1) {
	E && a && e.nodeName === sa && ("defaultValue" in r || "defaultChecked" in r || da(e));
	var s = ga(e), c = s[ia], l = !s[aa];
	let u = E && c;
	u && De(!1);
	var d = n || {}, f = e.nodeName === ca, p = e.nodeName === la;
	for (var m in n) !(m in r) && m[0] + m[1] !== "$$" && (r[m] = null);
	r.class ? r.class = Bi(r.class) : (i || r[na]) && (r.class = null), r[ra] && (r.style ??= null);
	var h = va(e);
	if (e.nodeName === sa && "type" in r && ("value" in r || "__value" in r)) {
		var g = r.type;
		(g !== d.type || g === void 0 && e.hasAttribute("type")) && (d.type = g, Y(e, "type", g, o));
	}
	for (let a in r) {
		let u = r[a];
		if (f && a === "value" && u == null) {
			e.value = e.__value = "", d[a] = u;
			continue;
		}
		if (a === "class") {
			J(e, e.namespaceURI === "http://www.w3.org/1999/xhtml", u, i, n?.[na], r[na]), d[a] = u, d[na] = r[na];
			continue;
		}
		if (a === "style") {
			qi(e, u, n?.[ra], r[ra]), d[a] = u, d[ra] = r[ra];
			continue;
		}
		var _ = d[a];
		if (u !== _ || u === void 0 && e.hasAttribute(a)) {
			d[a] = u;
			var v = a[0] + a[1];
			if (v !== "$$") {
				if (v === "on") {
					let t = {}, n = "$$" + a, r = a.slice(2);
					var y = ti(r);
					if ($r(r) && (r = r.slice(0, -7), t.capture = !0), !y && _) {
						if (u != null) continue;
						e.removeEventListener(r, d[n], t), d[n] = null;
					}
					if (y) B(r, e, u), Hr([r]);
					else if (u != null) {
						function i(e) {
							d[a].call(this, e);
						}
						d[n] = zr(r, e, i, t);
					}
				} else if (a === "style") Y(e, a, u);
				else if (a === "autofocus") gt(e, !!u);
				else if (!c && (a === "__value" || a === "value" && u != null)) e.value = e.__value = u;
				else if (a === "selected" && f) Ji(e, u);
				else {
					var b = a;
					l || (b = ii(b));
					var x = b === "defaultValue" || b === "defaultChecked";
					if (p && b === "defaultValue") continue;
					if (u == null && !c && !x) {
						if (s[a] = null, b === "value" || b === "checked") {
							let t = e, r = n === void 0;
							if (b === "value") {
								let e = t.defaultValue;
								t.removeAttribute(b), t.defaultValue = e, t.value = t.__value = r ? e : null;
							} else {
								let e = t.defaultChecked;
								t.removeAttribute(b), t.defaultChecked = e, t.checked = r ? e : !1;
							}
						} else e.removeAttribute(a);
					} else x || (c || typeof u != "string") && h.has(b) ? (e[b] = u, b in s && (s[b] = t)) : typeof u != "function" && Y(e, b, u, o);
				}
			}
		}
	}
	return u && De(!0), d;
}
function ha(e, t, n = [], r = [], i = [], a, o = !1, s = !1) {
	St(i, n, r, (n) => {
		var r = void 0, i = {}, c = e.nodeName === la, l = !1;
		if (Wn(() => {
			var u = t(...n.map(z)), d = ma(e, r, u, a, o, s);
			if (l && c) {
				var f = e;
				"defaultValue" in u && Yi(f, u.defaultValue), "value" in u && Zi(f, u.value);
			}
			for (let e of Object.getOwnPropertySymbols(i)) u[e] || Yn(i[e]);
			for (let t of Object.getOwnPropertySymbols(u)) {
				var p = u[t];
				t.description === "@attach" && (!r || p !== r[t]) && (i[t] && Yn(i[t]), i[t] = Gn(() => Li(e, () => p))), d[t] = p;
			}
			r = d;
		}), c) {
			var u = e;
			Bn(() => {
				var e = r;
				"defaultValue" in e && Yi(u, e.defaultValue), Zi(u, e.value, !0), Qi(u);
			});
		}
		l = !0;
	});
}
function ga(e) {
	return e[ge] ??= {
		[ia]: e.nodeName.includes("-"),
		[aa]: e.namespaceURI === n
	};
}
var _a = /* @__PURE__ */ new Map();
function va(e) {
	var t = e.getAttribute("is") || e.nodeName, n = _a.get(t);
	if (n) return n;
	_a.set(t, n = /* @__PURE__ */ new Set());
	for (var r, i = e, a = Element.prototype; a !== i;) {
		for (var o in r = u(i), r) r[o].set && o !== "innerHTML" && o !== "textContent" && o !== "innerText" && n.add(o);
		i = p(i);
	}
	return n;
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/elements/bindings/input.js
function ya(e, t, n = t) {
	var r = /* @__PURE__ */ new WeakSet();
	xt(e, "input", async (i) => {
		var a = i ? e.defaultValue : e.value;
		if (a = xa(e) ? Sa(a) : a, n(a), It !== null && r.add(It), await Ar(), a !== (a = t())) {
			var o = e.selectionStart, s = e.selectionEnd, c = e.value.length;
			if (e.value = a ?? "", s !== null) {
				var l = e.value.length;
				o === s && s === c && l > c ? (e.selectionStart = l, e.selectionEnd = l) : (e.selectionStart = o, e.selectionEnd = Math.min(s, l));
			}
		}
	}), (E && e.defaultValue !== e.value || Nr(t) == null && e.value) && (n(xa(e) ? Sa(e.value) : e.value), It !== null && r.add(It)), Hn(() => {
		var n = t();
		if (e === document.activeElement) {
			var i = It;
			if (r.has(i)) return;
		}
		xa(e) && n === Sa(e.value) || (e.type !== "date" || n || e.value) && n !== e.value && (e.value = n ?? "");
	});
}
function ba(e, t, n = t) {
	xt(e, "change", (t) => {
		n(t ? e.defaultChecked : e.checked);
	}), (E && e.defaultChecked !== e.checked || Nr(t) == null) && n(e.checked), Hn(() => {
		e.checked = !!t();
	});
}
function xa(e) {
	var t = e.type;
	return t === "number" || t === "range";
}
function Sa(e) {
	return e === "" ? null : +e;
}
var Ca = /* @__PURE__ */ new class e {
	#e = /* @__PURE__ */ new WeakMap();
	#t;
	#n;
	static entries = /* @__PURE__ */ new WeakMap();
	constructor(e) {
		this.#n = e;
	}
	observe(e, t) {
		var n = this.#e.get(e) || /* @__PURE__ */ new Set();
		return n.add(t), this.#e.set(e, n), this.#r().observe(e, this.#n), () => {
			var n = this.#e.get(e);
			n.delete(t), n.size === 0 && (this.#e.delete(e), this.#t.unobserve(e));
		};
	}
	#r() {
		return this.#t ??= new ResizeObserver((t) => {
			for (var n of t) {
				e.entries.set(n.target, n);
				for (var r of this.#e.get(n.target) || []) r(n);
			}
		});
	}
}({ box: "border-box" });
function wa(e, t, n) {
	var r = Ca.observe(e, () => n(e[t]));
	Bn(() => (Nr(() => n(e[t])), r));
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/elements/bindings/this.js
function Ta(e, t) {
	return e === t || e?.[fe] === t;
}
function Ea(e = ot(), t, n, r) {
	var i = tt.r, a = ur;
	return Bn(() => {
		var o, s;
		return Hn(() => {
			o = s, s = r?.() || [], Nr(() => {
				Ta(n(...s), e) || (t(e, ...s), o && Ta(n(...o), e) && t(null, ...o));
			});
		}), () => {
			let r = a;
			for (; r !== i && r.parent !== null && r.parent.f & 33554432;) r = r.parent;
			let o = () => {
				s && Ta(n(...s), e) && t(null, ...s);
			}, c = r.teardown;
			r.teardown = () => {
				o(), c?.();
			};
		};
	}), e;
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/legacy/lifecycle.js
function Da(e = !1) {
	let t = tt, n = t.l.u;
	if (!n) return;
	let r = () => Pr(t.s);
	if (e) {
		let e = 0, n = {}, i = /* @__PURE__ */ Et(() => {
			let r = !1, i = t.s;
			for (let e in i) i[e] !== n[e] && (n[e] = i[e], r = !0);
			return r && e++, e;
		});
		r = () => z(i);
	}
	n.b.length && Ln(() => {
		Oa(t, r), v(n.b);
	}), Fn(() => {
		let e = Nr(() => n.m.map(_));
		return () => {
			for (let t of e) typeof t == "function" && t();
		};
	}), n.a.length && Fn(() => {
		Oa(t, r), v(n.a);
	});
}
function Oa(e, t) {
	if (e.l.s) for (let t of e.l.s) z(t);
	t();
}
//#endregion
//#region node_modules/svelte/src/internal/client/reactivity/store.js
var ka = !1;
function Aa(e) {
	var t = ka;
	try {
		return ka = !1, [e(), ka];
	} finally {
		ka = t;
	}
}
//#endregion
//#region node_modules/svelte/src/internal/client/reactivity/props.js
var ja = {
	get(e, t) {
		if (!e.exclude.has(t)) return e.props[t];
	},
	set(e, t) {
		return !1;
	},
	getOwnPropertyDescriptor(e, t) {
		if (!e.exclude.has(t) && t in e.props) return {
			enumerable: !0,
			configurable: !0,
			value: e.props[t]
		};
	},
	has(e, t) {
		return !e.exclude.has(t) && t in e.props;
	},
	ownKeys(e) {
		return Reflect.ownKeys(e.props).filter((t) => !e.exclude.has(t));
	}
};
/*#__NO_SIDE_EFFECTS__*/
function Ma(e, t, n) {
	return new Proxy({
		props: e,
		exclude: t
	}, ja);
}
var Na = {
	get(e, t) {
		if (!e.exclude.includes(t)) return z(e.version), t in e.special ? e.special[t]() : e.props[t];
	},
	set(e, t, n) {
		if (!(t in e.special)) {
			var r = ur;
			try {
				dr(e.parent_effect), e.special[t] = Q({ get [t]() {
					return e.props[t];
				} }, t, 4);
			} finally {
				dr(r);
			}
		}
		return e.special[t](n), un(e.version), !0;
	},
	getOwnPropertyDescriptor(e, t) {
		if (!e.exclude.includes(t) && t in e.props) return {
			enumerable: !0,
			configurable: !0,
			value: e.props[t]
		};
	},
	deleteProperty(e, t) {
		return e.exclude.includes(t) ? !0 : (e.exclude.push(t), un(e.version), !0);
	},
	has(e, t) {
		return !e.exclude.includes(t) && t in e.props;
	},
	ownKeys(e) {
		return Reflect.ownKeys(e.props).filter((t) => !e.exclude.includes(t));
	}
};
function X(e, t) {
	return new Proxy({
		props: e,
		exclude: t,
		special: {},
		version: rn(0),
		parent_effect: ur
	}, Na);
}
var Pa = {
	get(e, t) {
		let n = e.props.length;
		for (; n--;) {
			let r = e.props[n];
			if (h(r) && (r = r()), typeof r == "object" && r && t in r) return r[t];
		}
	},
	set(e, t, n) {
		let r = e.props.length;
		for (; r--;) {
			let i = e.props[r];
			h(i) && (i = i());
			let a = l(i, t);
			if (a && a.set) return a.set(n), !0;
		}
		return !1;
	},
	getOwnPropertyDescriptor(e, t) {
		let n = e.props.length;
		for (; n--;) {
			let r = e.props[n];
			if (h(r) && (r = r()), typeof r == "object" && r && t in r) {
				let e = l(r, t);
				return e && !e.configurable && (e.configurable = !0), e;
			}
		}
	},
	has(e, t) {
		if (t === fe || t === me) return !1;
		for (let n of e.props) if (h(n) && (n = n()), n != null && t in n) return !0;
		return !1;
	},
	ownKeys(e) {
		let t = [];
		for (let n of e.props) if (h(n) && (n = n()), n) {
			for (let e in n) t.includes(e) || t.push(e);
			for (let e of Object.getOwnPropertySymbols(n)) t.includes(e) || t.push(e);
		}
		return t;
	}
};
function Z(...e) {
	return new Proxy({ props: e }, Pa);
}
function Q(e, t, n, r) {
	var i = !Je || !!(n & 2), a = !!(n & 8), o = !!(n & 16), s = r, c = !0, u = void 0, d = () => o && i ? (u ??= /* @__PURE__ */ Et(r), z(u)) : (c && (c = !1, s = o ? Nr(r) : r), s);
	let f;
	if (a) {
		var p = fe in e || me in e;
		f = l(e, t)?.set ?? (p && t in e ? (n) => e[t] = n : void 0);
	}
	var m, h = !1;
	a ? [m, h] = Aa(() => e[t]) : m = e[t], m === void 0 && r !== void 0 && (m = d(), f && (i && Ue(t), f(m)));
	var g = i ? () => {
		var n = e[t];
		return n === void 0 ? d() : (c = !0, n);
	} : () => {
		var n = e[t];
		return n !== void 0 && (s = void 0), n === void 0 ? s : n;
	};
	if (i && !(n & 4)) return g;
	if (f) {
		var _ = e.$$legacy;
		return (function(e, t) {
			return arguments.length > 0 ? ((!i || !t || _ || h) && f(t ? g() : e), e) : g();
		});
	}
	var v = !1, y = (n & 1 ? Et : kt)(() => (v = !1, g()));
	a && z(y);
	var b = ur;
	return (function(e, t) {
		if (arguments.length > 0) {
			let n = t ? z(y) : i && a ? pn(e) : e;
			return N(y, n), v = !0, s !== void 0 && (s = n), e;
		}
		return ar && v || b.f & 16384 ? y.v : z(y);
	});
}
//#endregion
//#region node_modules/svelte/src/internal/disclose-version.js
typeof window < "u" && ((window.__svelte ??= {}).v ??= /* @__PURE__ */ new Set()).add("5");
//#endregion
//#region node_modules/d3-dispatch/src/dispatch.js
var Fa = { value: () => {} };
function Ia() {
	for (var e = 0, t = arguments.length, n = {}, r; e < t; ++e) {
		if (!(r = arguments[e] + "") || r in n || /[\s.]/.test(r)) throw Error("illegal type: " + r);
		n[r] = [];
	}
	return new La(n);
}
function La(e) {
	this._ = e;
}
function Ra(e, t) {
	return e.trim().split(/^|\s+/).map(function(e) {
		var n = "", r = e.indexOf(".");
		if (r >= 0 && (n = e.slice(r + 1), e = e.slice(0, r)), e && !t.hasOwnProperty(e)) throw Error("unknown type: " + e);
		return {
			type: e,
			name: n
		};
	});
}
La.prototype = Ia.prototype = {
	constructor: La,
	on: function(e, t) {
		var n = this._, r = Ra(e + "", n), i, a = -1, o = r.length;
		if (arguments.length < 2) {
			for (; ++a < o;) if ((i = (e = r[a]).type) && (i = za(n[i], e.name))) return i;
			return;
		}
		if (t != null && typeof t != "function") throw Error("invalid callback: " + t);
		for (; ++a < o;) if (i = (e = r[a]).type) n[i] = Ba(n[i], e.name, t);
		else if (t == null) for (i in n) n[i] = Ba(n[i], e.name, null);
		return this;
	},
	copy: function() {
		var e = {}, t = this._;
		for (var n in t) e[n] = t[n].slice();
		return new La(e);
	},
	call: function(e, t) {
		if ((i = arguments.length - 2) > 0) for (var n = Array(i), r = 0, i, a; r < i; ++r) n[r] = arguments[r + 2];
		if (!this._.hasOwnProperty(e)) throw Error("unknown type: " + e);
		for (a = this._[e], r = 0, i = a.length; r < i; ++r) a[r].value.apply(t, n);
	},
	apply: function(e, t, n) {
		if (!this._.hasOwnProperty(e)) throw Error("unknown type: " + e);
		for (var r = this._[e], i = 0, a = r.length; i < a; ++i) r[i].value.apply(t, n);
	}
};
function za(e, t) {
	for (var n = 0, r = e.length, i; n < r; ++n) if ((i = e[n]).name === t) return i.value;
}
function Ba(e, t, n) {
	for (var r = 0, i = e.length; r < i; ++r) if (e[r].name === t) {
		e[r] = Fa, e = e.slice(0, r).concat(e.slice(r + 1));
		break;
	}
	return n != null && e.push({
		name: t,
		value: n
	}), e;
}
var Va = {
	svg: "http://www.w3.org/2000/svg",
	xhtml: "http://www.w3.org/1999/xhtml",
	xlink: "http://www.w3.org/1999/xlink",
	xml: "http://www.w3.org/XML/1998/namespace",
	xmlns: "http://www.w3.org/2000/xmlns/"
};
//#endregion
//#region node_modules/d3-selection/src/namespace.js
function Ha(e) {
	var t = e += "", n = t.indexOf(":");
	return n >= 0 && (t = e.slice(0, n)) !== "xmlns" && (e = e.slice(n + 1)), Va.hasOwnProperty(t) ? {
		space: Va[t],
		local: e
	} : e;
}
//#endregion
//#region node_modules/d3-selection/src/creator.js
function Ua(e) {
	return function() {
		var t = this.ownerDocument, n = this.namespaceURI;
		return n === "http://www.w3.org/1999/xhtml" && t.documentElement.namespaceURI === "http://www.w3.org/1999/xhtml" ? t.createElement(e) : t.createElementNS(n, e);
	};
}
function Wa(e) {
	return function() {
		return this.ownerDocument.createElementNS(e.space, e.local);
	};
}
function Ga(e) {
	var t = Ha(e);
	return (t.local ? Wa : Ua)(t);
}
//#endregion
//#region node_modules/d3-selection/src/selector.js
function Ka() {}
function qa(e) {
	return e == null ? Ka : function() {
		return this.querySelector(e);
	};
}
//#endregion
//#region node_modules/d3-selection/src/selection/select.js
function Ja(e) {
	typeof e != "function" && (e = qa(e));
	for (var t = this._groups, n = t.length, r = Array(n), i = 0; i < n; ++i) for (var a = t[i], o = a.length, s = r[i] = Array(o), c, l, u = 0; u < o; ++u) (c = a[u]) && (l = e.call(c, c.__data__, u, a)) && ("__data__" in c && (l.__data__ = c.__data__), s[u] = l);
	return new Ls(r, this._parents);
}
//#endregion
//#region node_modules/d3-selection/src/array.js
function Ya(e) {
	return e == null ? [] : Array.isArray(e) ? e : Array.from(e);
}
//#endregion
//#region node_modules/d3-selection/src/selectorAll.js
function Xa() {
	return [];
}
function Za(e) {
	return e == null ? Xa : function() {
		return this.querySelectorAll(e);
	};
}
//#endregion
//#region node_modules/d3-selection/src/selection/selectAll.js
function Qa(e) {
	return function() {
		return Ya(e.apply(this, arguments));
	};
}
function $a(e) {
	e = typeof e == "function" ? Qa(e) : Za(e);
	for (var t = this._groups, n = t.length, r = [], i = [], a = 0; a < n; ++a) for (var o = t[a], s = o.length, c, l = 0; l < s; ++l) (c = o[l]) && (r.push(e.call(c, c.__data__, l, o)), i.push(c));
	return new Ls(r, i);
}
//#endregion
//#region node_modules/d3-selection/src/matcher.js
function eo(e) {
	return function() {
		return this.matches(e);
	};
}
function to(e) {
	return function(t) {
		return t.matches(e);
	};
}
//#endregion
//#region node_modules/d3-selection/src/selection/selectChild.js
var no = Array.prototype.find;
function ro(e) {
	return function() {
		return no.call(this.children, e);
	};
}
function io() {
	return this.firstElementChild;
}
function ao(e) {
	return this.select(e == null ? io : ro(typeof e == "function" ? e : to(e)));
}
//#endregion
//#region node_modules/d3-selection/src/selection/selectChildren.js
var oo = Array.prototype.filter;
function so() {
	return Array.from(this.children);
}
function co(e) {
	return function() {
		return oo.call(this.children, e);
	};
}
function lo(e) {
	return this.selectAll(e == null ? so : co(typeof e == "function" ? e : to(e)));
}
//#endregion
//#region node_modules/d3-selection/src/selection/filter.js
function uo(e) {
	typeof e != "function" && (e = eo(e));
	for (var t = this._groups, n = t.length, r = Array(n), i = 0; i < n; ++i) for (var a = t[i], o = a.length, s = r[i] = [], c, l = 0; l < o; ++l) (c = a[l]) && e.call(c, c.__data__, l, a) && s.push(c);
	return new Ls(r, this._parents);
}
//#endregion
//#region node_modules/d3-selection/src/selection/sparse.js
function fo(e) {
	return Array(e.length);
}
//#endregion
//#region node_modules/d3-selection/src/selection/enter.js
function po() {
	return new Ls(this._enter || this._groups.map(fo), this._parents);
}
function mo(e, t) {
	this.ownerDocument = e.ownerDocument, this.namespaceURI = e.namespaceURI, this._next = null, this._parent = e, this.__data__ = t;
}
mo.prototype = {
	constructor: mo,
	appendChild: function(e) {
		return this._parent.insertBefore(e, this._next);
	},
	insertBefore: function(e, t) {
		return this._parent.insertBefore(e, t);
	},
	querySelector: function(e) {
		return this._parent.querySelector(e);
	},
	querySelectorAll: function(e) {
		return this._parent.querySelectorAll(e);
	}
};
//#endregion
//#region node_modules/d3-selection/src/constant.js
function ho(e) {
	return function() {
		return e;
	};
}
//#endregion
//#region node_modules/d3-selection/src/selection/data.js
function go(e, t, n, r, i, a) {
	for (var o = 0, s, c = t.length, l = a.length; o < l; ++o) (s = t[o]) ? (s.__data__ = a[o], r[o] = s) : n[o] = new mo(e, a[o]);
	for (; o < c; ++o) (s = t[o]) && (i[o] = s);
}
function _o(e, t, n, r, i, a, o) {
	var s, c, l = /* @__PURE__ */ new Map(), u = t.length, d = a.length, f = Array(u), p;
	for (s = 0; s < u; ++s) (c = t[s]) && (f[s] = p = o.call(c, c.__data__, s, t) + "", l.has(p) ? i[s] = c : l.set(p, c));
	for (s = 0; s < d; ++s) p = o.call(e, a[s], s, a) + "", (c = l.get(p)) ? (r[s] = c, c.__data__ = a[s], l.delete(p)) : n[s] = new mo(e, a[s]);
	for (s = 0; s < u; ++s) (c = t[s]) && l.get(f[s]) === c && (i[s] = c);
}
function vo(e) {
	return e.__data__;
}
function yo(e, t) {
	if (!arguments.length) return Array.from(this, vo);
	var n = t ? _o : go, r = this._parents, i = this._groups;
	typeof e != "function" && (e = ho(e));
	for (var a = i.length, o = Array(a), s = Array(a), c = Array(a), l = 0; l < a; ++l) {
		var u = r[l], d = i[l], f = d.length, p = bo(e.call(u, u && u.__data__, l, r)), m = p.length, h = s[l] = Array(m), g = o[l] = Array(m);
		n(u, d, h, g, c[l] = Array(f), p, t);
		for (var _ = 0, v = 0, y, b; _ < m; ++_) if (y = h[_]) {
			for (_ >= v && (v = _ + 1); !(b = g[v]) && ++v < m;);
			y._next = b || null;
		}
	}
	return o = new Ls(o, r), o._enter = s, o._exit = c, o;
}
function bo(e) {
	return typeof e == "object" && "length" in e ? e : Array.from(e);
}
//#endregion
//#region node_modules/d3-selection/src/selection/exit.js
function xo() {
	return new Ls(this._exit || this._groups.map(fo), this._parents);
}
//#endregion
//#region node_modules/d3-selection/src/selection/join.js
function So(e, t, n) {
	var r = this.enter(), i = this, a = this.exit();
	return typeof e == "function" ? (r = e(r), r &&= r.selection()) : r = r.append(e + ""), t != null && (i = t(i), i &&= i.selection()), n == null ? a.remove() : n(a), r && i ? r.merge(i).order() : i;
}
//#endregion
//#region node_modules/d3-selection/src/selection/merge.js
function Co(e) {
	for (var t = e.selection ? e.selection() : e, n = this._groups, r = t._groups, i = n.length, a = r.length, o = Math.min(i, a), s = Array(i), c = 0; c < o; ++c) for (var l = n[c], u = r[c], d = l.length, f = s[c] = Array(d), p, m = 0; m < d; ++m) (p = l[m] || u[m]) && (f[m] = p);
	for (; c < i; ++c) s[c] = n[c];
	return new Ls(s, this._parents);
}
//#endregion
//#region node_modules/d3-selection/src/selection/order.js
function wo() {
	for (var e = this._groups, t = -1, n = e.length; ++t < n;) for (var r = e[t], i = r.length - 1, a = r[i], o; --i >= 0;) (o = r[i]) && (a && o.compareDocumentPosition(a) ^ 4 && a.parentNode.insertBefore(o, a), a = o);
	return this;
}
//#endregion
//#region node_modules/d3-selection/src/selection/sort.js
function To(e) {
	e ||= Eo;
	function t(t, n) {
		return t && n ? e(t.__data__, n.__data__) : !t - !n;
	}
	for (var n = this._groups, r = n.length, i = Array(r), a = 0; a < r; ++a) {
		for (var o = n[a], s = o.length, c = i[a] = Array(s), l, u = 0; u < s; ++u) (l = o[u]) && (c[u] = l);
		c.sort(t);
	}
	return new Ls(i, this._parents).order();
}
function Eo(e, t) {
	return e < t ? -1 : e > t ? 1 : e >= t ? 0 : NaN;
}
//#endregion
//#region node_modules/d3-selection/src/selection/call.js
function Do() {
	var e = arguments[0];
	return arguments[0] = this, e.apply(null, arguments), this;
}
//#endregion
//#region node_modules/d3-selection/src/selection/nodes.js
function Oo() {
	return Array.from(this);
}
//#endregion
//#region node_modules/d3-selection/src/selection/node.js
function ko() {
	for (var e = this._groups, t = 0, n = e.length; t < n; ++t) for (var r = e[t], i = 0, a = r.length; i < a; ++i) {
		var o = r[i];
		if (o) return o;
	}
	return null;
}
//#endregion
//#region node_modules/d3-selection/src/selection/size.js
function Ao() {
	let e = 0;
	for (let t of this) ++e;
	return e;
}
//#endregion
//#region node_modules/d3-selection/src/selection/empty.js
function jo() {
	return !this.node();
}
//#endregion
//#region node_modules/d3-selection/src/selection/each.js
function Mo(e) {
	for (var t = this._groups, n = 0, r = t.length; n < r; ++n) for (var i = t[n], a = 0, o = i.length, s; a < o; ++a) (s = i[a]) && e.call(s, s.__data__, a, i);
	return this;
}
//#endregion
//#region node_modules/d3-selection/src/selection/attr.js
function No(e) {
	return function() {
		this.removeAttribute(e);
	};
}
function Po(e) {
	return function() {
		this.removeAttributeNS(e.space, e.local);
	};
}
function Fo(e, t) {
	return function() {
		this.setAttribute(e, t);
	};
}
function Io(e, t) {
	return function() {
		this.setAttributeNS(e.space, e.local, t);
	};
}
function Lo(e, t) {
	return function() {
		var n = t.apply(this, arguments);
		n == null ? this.removeAttribute(e) : this.setAttribute(e, n);
	};
}
function Ro(e, t) {
	return function() {
		var n = t.apply(this, arguments);
		n == null ? this.removeAttributeNS(e.space, e.local) : this.setAttributeNS(e.space, e.local, n);
	};
}
function zo(e, t) {
	var n = Ha(e);
	if (arguments.length < 2) {
		var r = this.node();
		return n.local ? r.getAttributeNS(n.space, n.local) : r.getAttribute(n);
	}
	return this.each((t == null ? n.local ? Po : No : typeof t == "function" ? n.local ? Ro : Lo : n.local ? Io : Fo)(n, t));
}
//#endregion
//#region node_modules/d3-selection/src/window.js
function Bo(e) {
	return e.ownerDocument && e.ownerDocument.defaultView || e.document && e || e.defaultView;
}
//#endregion
//#region node_modules/d3-selection/src/selection/style.js
function Vo(e) {
	return function() {
		this.style.removeProperty(e);
	};
}
function Ho(e, t, n) {
	return function() {
		this.style.setProperty(e, t, n);
	};
}
function Uo(e, t, n) {
	return function() {
		var r = t.apply(this, arguments);
		r == null ? this.style.removeProperty(e) : this.style.setProperty(e, r, n);
	};
}
function Wo(e, t, n) {
	return arguments.length > 1 ? this.each((t == null ? Vo : typeof t == "function" ? Uo : Ho)(e, t, n ?? "")) : Go(this.node(), e);
}
function Go(e, t) {
	return e.style.getPropertyValue(t) || Bo(e).getComputedStyle(e, null).getPropertyValue(t);
}
//#endregion
//#region node_modules/d3-selection/src/selection/property.js
function Ko(e) {
	return function() {
		delete this[e];
	};
}
function qo(e, t) {
	return function() {
		this[e] = t;
	};
}
function Jo(e, t) {
	return function() {
		var n = t.apply(this, arguments);
		n == null ? delete this[e] : this[e] = n;
	};
}
function Yo(e, t) {
	return arguments.length > 1 ? this.each((t == null ? Ko : typeof t == "function" ? Jo : qo)(e, t)) : this.node()[e];
}
//#endregion
//#region node_modules/d3-selection/src/selection/classed.js
function Xo(e) {
	return e.trim().split(/^|\s+/);
}
function Zo(e) {
	return e.classList || new Qo(e);
}
function Qo(e) {
	this._node = e, this._names = Xo(e.getAttribute("class") || "");
}
Qo.prototype = {
	add: function(e) {
		this._names.indexOf(e) < 0 && (this._names.push(e), this._node.setAttribute("class", this._names.join(" ")));
	},
	remove: function(e) {
		var t = this._names.indexOf(e);
		t >= 0 && (this._names.splice(t, 1), this._node.setAttribute("class", this._names.join(" ")));
	},
	contains: function(e) {
		return this._names.indexOf(e) >= 0;
	}
};
function $o(e, t) {
	for (var n = Zo(e), r = -1, i = t.length; ++r < i;) n.add(t[r]);
}
function es(e, t) {
	for (var n = Zo(e), r = -1, i = t.length; ++r < i;) n.remove(t[r]);
}
function ts(e) {
	return function() {
		$o(this, e);
	};
}
function ns(e) {
	return function() {
		es(this, e);
	};
}
function rs(e, t) {
	return function() {
		(t.apply(this, arguments) ? $o : es)(this, e);
	};
}
function is(e, t) {
	var n = Xo(e + "");
	if (arguments.length < 2) {
		for (var r = Zo(this.node()), i = -1, a = n.length; ++i < a;) if (!r.contains(n[i])) return !1;
		return !0;
	}
	return this.each((typeof t == "function" ? rs : t ? ts : ns)(n, t));
}
//#endregion
//#region node_modules/d3-selection/src/selection/text.js
function as() {
	this.textContent = "";
}
function os(e) {
	return function() {
		this.textContent = e;
	};
}
function ss(e) {
	return function() {
		var t = e.apply(this, arguments);
		this.textContent = t ?? "";
	};
}
function cs(e) {
	return arguments.length ? this.each(e == null ? as : (typeof e == "function" ? ss : os)(e)) : this.node().textContent;
}
//#endregion
//#region node_modules/d3-selection/src/selection/html.js
function ls() {
	this.innerHTML = "";
}
function us(e) {
	return function() {
		this.innerHTML = e;
	};
}
function ds(e) {
	return function() {
		var t = e.apply(this, arguments);
		this.innerHTML = t ?? "";
	};
}
function fs(e) {
	return arguments.length ? this.each(e == null ? ls : (typeof e == "function" ? ds : us)(e)) : this.node().innerHTML;
}
//#endregion
//#region node_modules/d3-selection/src/selection/raise.js
function ps() {
	this.nextSibling && this.parentNode.appendChild(this);
}
function ms() {
	return this.each(ps);
}
//#endregion
//#region node_modules/d3-selection/src/selection/lower.js
function hs() {
	this.previousSibling && this.parentNode.insertBefore(this, this.parentNode.firstChild);
}
function gs() {
	return this.each(hs);
}
//#endregion
//#region node_modules/d3-selection/src/selection/append.js
function _s(e) {
	var t = typeof e == "function" ? e : Ga(e);
	return this.select(function() {
		return this.appendChild(t.apply(this, arguments));
	});
}
//#endregion
//#region node_modules/d3-selection/src/selection/insert.js
function vs() {
	return null;
}
function ys(e, t) {
	var n = typeof e == "function" ? e : Ga(e), r = t == null ? vs : typeof t == "function" ? t : qa(t);
	return this.select(function() {
		return this.insertBefore(n.apply(this, arguments), r.apply(this, arguments) || null);
	});
}
//#endregion
//#region node_modules/d3-selection/src/selection/remove.js
function bs() {
	var e = this.parentNode;
	e && e.removeChild(this);
}
function xs() {
	return this.each(bs);
}
//#endregion
//#region node_modules/d3-selection/src/selection/clone.js
function Ss() {
	var e = this.cloneNode(!1), t = this.parentNode;
	return t ? t.insertBefore(e, this.nextSibling) : e;
}
function Cs() {
	var e = this.cloneNode(!0), t = this.parentNode;
	return t ? t.insertBefore(e, this.nextSibling) : e;
}
function ws(e) {
	return this.select(e ? Cs : Ss);
}
//#endregion
//#region node_modules/d3-selection/src/selection/datum.js
function Ts(e) {
	return arguments.length ? this.property("__data__", e) : this.node().__data__;
}
//#endregion
//#region node_modules/d3-selection/src/selection/on.js
function Es(e) {
	return function(t) {
		e.call(this, t, this.__data__);
	};
}
function Ds(e) {
	return e.trim().split(/^|\s+/).map(function(e) {
		var t = "", n = e.indexOf(".");
		return n >= 0 && (t = e.slice(n + 1), e = e.slice(0, n)), {
			type: e,
			name: t
		};
	});
}
function Os(e) {
	return function() {
		var t = this.__on;
		if (t) {
			for (var n = 0, r = -1, i = t.length, a; n < i; ++n) a = t[n], (!e.type || a.type === e.type) && a.name === e.name ? this.removeEventListener(a.type, a.listener, a.options) : t[++r] = a;
			++r ? t.length = r : delete this.__on;
		}
	};
}
function ks(e, t, n) {
	return function() {
		var r = this.__on, i, a = Es(t);
		if (r) {
			for (var o = 0, s = r.length; o < s; ++o) if ((i = r[o]).type === e.type && i.name === e.name) {
				this.removeEventListener(i.type, i.listener, i.options), this.addEventListener(i.type, i.listener = a, i.options = n), i.value = t;
				return;
			}
		}
		this.addEventListener(e.type, a, n), i = {
			type: e.type,
			name: e.name,
			value: t,
			listener: a,
			options: n
		}, r ? r.push(i) : this.__on = [i];
	};
}
function As(e, t, n) {
	var r = Ds(e + ""), i, a = r.length, o;
	if (arguments.length < 2) {
		var s = this.node().__on;
		if (s) {
			for (var c = 0, l = s.length, u; c < l; ++c) for (i = 0, u = s[c]; i < a; ++i) if ((o = r[i]).type === u.type && o.name === u.name) return u.value;
		}
		return;
	}
	for (s = t ? ks : Os, i = 0; i < a; ++i) this.each(s(r[i], t, n));
	return this;
}
//#endregion
//#region node_modules/d3-selection/src/selection/dispatch.js
function js(e, t, n) {
	var r = Bo(e), i = r.CustomEvent;
	typeof i == "function" ? i = new i(t, n) : (i = r.document.createEvent("Event"), n ? (i.initEvent(t, n.bubbles, n.cancelable), i.detail = n.detail) : i.initEvent(t, !1, !1)), e.dispatchEvent(i);
}
function Ms(e, t) {
	return function() {
		return js(this, e, t);
	};
}
function Ns(e, t) {
	return function() {
		return js(this, e, t.apply(this, arguments));
	};
}
function Ps(e, t) {
	return this.each((typeof t == "function" ? Ns : Ms)(e, t));
}
//#endregion
//#region node_modules/d3-selection/src/selection/iterator.js
function* Fs() {
	for (var e = this._groups, t = 0, n = e.length; t < n; ++t) for (var r = e[t], i = 0, a = r.length, o; i < a; ++i) (o = r[i]) && (yield o);
}
//#endregion
//#region node_modules/d3-selection/src/selection/index.js
var Is = [null];
function Ls(e, t) {
	this._groups = e, this._parents = t;
}
function Rs() {
	return new Ls([[document.documentElement]], Is);
}
function zs() {
	return this;
}
Ls.prototype = Rs.prototype = {
	constructor: Ls,
	select: Ja,
	selectAll: $a,
	selectChild: ao,
	selectChildren: lo,
	filter: uo,
	data: yo,
	enter: po,
	exit: xo,
	join: So,
	merge: Co,
	selection: zs,
	order: wo,
	sort: To,
	call: Do,
	nodes: Oo,
	node: ko,
	size: Ao,
	empty: jo,
	each: Mo,
	attr: zo,
	style: Wo,
	property: Yo,
	classed: is,
	text: cs,
	html: fs,
	raise: ms,
	lower: gs,
	append: _s,
	insert: ys,
	remove: xs,
	clone: ws,
	datum: Ts,
	on: As,
	dispatch: Ps,
	[Symbol.iterator]: Fs
};
//#endregion
//#region node_modules/d3-selection/src/select.js
function Bs(e) {
	return typeof e == "string" ? new Ls([[document.querySelector(e)]], [document.documentElement]) : new Ls([[e]], Is);
}
//#endregion
//#region node_modules/d3-selection/src/sourceEvent.js
function Vs(e) {
	let t;
	for (; t = e.sourceEvent;) e = t;
	return e;
}
//#endregion
//#region node_modules/d3-selection/src/pointer.js
function Hs(e, t) {
	if (e = Vs(e), t === void 0 && (t = e.currentTarget), t) {
		var n = t.ownerSVGElement || t;
		if (n.createSVGPoint) {
			var r = n.createSVGPoint();
			return r.x = e.clientX, r.y = e.clientY, r = r.matrixTransform(t.getScreenCTM().inverse()), [r.x, r.y];
		}
		if (t.getBoundingClientRect) {
			var i = t.getBoundingClientRect();
			return [e.clientX - i.left - t.clientLeft, e.clientY - i.top - t.clientTop];
		}
	}
	return [e.pageX, e.pageY];
}
//#endregion
//#region node_modules/d3-drag/src/noevent.js
var Us = { passive: !1 }, Ws = {
	capture: !0,
	passive: !1
};
function Gs(e) {
	e.stopImmediatePropagation();
}
function Ks(e) {
	e.preventDefault(), e.stopImmediatePropagation();
}
//#endregion
//#region node_modules/d3-drag/src/nodrag.js
function qs(e) {
	var t = e.document.documentElement, n = Bs(e).on("dragstart.drag", Ks, Ws);
	"onselectstart" in t ? n.on("selectstart.drag", Ks, Ws) : (t.__noselect = t.style.MozUserSelect, t.style.MozUserSelect = "none");
}
function Js(e, t) {
	var n = e.document.documentElement, r = Bs(e).on("dragstart.drag", null);
	t && (r.on("click.drag", Ks, Ws), setTimeout(function() {
		r.on("click.drag", null);
	}, 0)), "onselectstart" in n ? r.on("selectstart.drag", null) : (n.style.MozUserSelect = n.__noselect, delete n.__noselect);
}
//#endregion
//#region node_modules/d3-drag/src/constant.js
var Ys = (e) => () => e;
//#endregion
//#region node_modules/d3-drag/src/event.js
function Xs(e, { sourceEvent: t, subject: n, target: r, identifier: i, active: a, x: o, y: s, dx: c, dy: l, dispatch: u }) {
	Object.defineProperties(this, {
		type: {
			value: e,
			enumerable: !0,
			configurable: !0
		},
		sourceEvent: {
			value: t,
			enumerable: !0,
			configurable: !0
		},
		subject: {
			value: n,
			enumerable: !0,
			configurable: !0
		},
		target: {
			value: r,
			enumerable: !0,
			configurable: !0
		},
		identifier: {
			value: i,
			enumerable: !0,
			configurable: !0
		},
		active: {
			value: a,
			enumerable: !0,
			configurable: !0
		},
		x: {
			value: o,
			enumerable: !0,
			configurable: !0
		},
		y: {
			value: s,
			enumerable: !0,
			configurable: !0
		},
		dx: {
			value: c,
			enumerable: !0,
			configurable: !0
		},
		dy: {
			value: l,
			enumerable: !0,
			configurable: !0
		},
		_: { value: u }
	});
}
Xs.prototype.on = function() {
	var e = this._.on.apply(this._, arguments);
	return e === this._ ? this : e;
};
//#endregion
//#region node_modules/d3-drag/src/drag.js
function Zs(e) {
	return !e.ctrlKey && !e.button;
}
function Qs() {
	return this.parentNode;
}
function $s(e, t) {
	return t ?? {
		x: e.x,
		y: e.y
	};
}
function ec() {
	return navigator.maxTouchPoints || "ontouchstart" in this;
}
function tc() {
	var e = Zs, t = Qs, n = $s, r = ec, i = {}, a = Ia("start", "drag", "end"), o = 0, s, c, l, u, d = 0;
	function f(e) {
		e.on("mousedown.drag", p).filter(r).on("touchstart.drag", g).on("touchmove.drag", _, Us).on("touchend.drag touchcancel.drag", v).style("touch-action", "none").style("-webkit-tap-highlight-color", "rgba(0,0,0,0)");
	}
	function p(n, r) {
		if (!u && e.call(this, n, r)) {
			var i = y(this, t.call(this, n, r), n, r, "mouse");
			i && (Bs(n.view).on("mousemove.drag", m, Ws).on("mouseup.drag", h, Ws), qs(n.view), Gs(n), l = !1, s = n.clientX, c = n.clientY, i("start", n));
		}
	}
	function m(e) {
		if (Ks(e), !l) {
			var t = e.clientX - s, n = e.clientY - c;
			l = t * t + n * n > d;
		}
		i.mouse("drag", e);
	}
	function h(e) {
		Bs(e.view).on("mousemove.drag mouseup.drag", null), Js(e.view, l), Ks(e), i.mouse("end", e);
	}
	function g(n, r) {
		if (e.call(this, n, r)) for (var i = n.changedTouches, a = t.call(this, n, r), o = i.length, s = 0, c; s < o; ++s) (c = y(this, a, n, r, i[s].identifier, i[s])) && (Gs(n), c("start", n, i[s]));
	}
	function _(e) {
		for (var t = e.changedTouches, n = t.length, r = 0, a; r < n; ++r) (a = i[t[r].identifier]) && (Ks(e), a("drag", e, t[r]));
	}
	function v(e) {
		var t = e.changedTouches, n = t.length, r, a;
		for (u && clearTimeout(u), u = setTimeout(function() {
			u = null;
		}, 500), r = 0; r < n; ++r) (a = i[t[r].identifier]) && (Gs(e), a("end", e, t[r]));
	}
	function y(e, t, r, s, c, l) {
		var u = a.copy(), d = Hs(l || r, t), p, m, h;
		if ((h = n.call(e, new Xs("beforestart", {
			sourceEvent: r,
			target: f,
			identifier: c,
			active: o,
			x: d[0],
			y: d[1],
			dx: 0,
			dy: 0,
			dispatch: u
		}), s)) != null) return p = h.x - d[0] || 0, m = h.y - d[1] || 0, function n(r, a, l) {
			var g = d, _;
			switch (r) {
				case "start":
					i[c] = n, _ = o++;
					break;
				case "end": delete i[c], --o;
				case "drag": d = Hs(l || a, t), _ = o;
			}
			u.call(r, e, new Xs(r, {
				sourceEvent: a,
				subject: h,
				target: f,
				identifier: c,
				active: _,
				x: d[0] + p,
				y: d[1] + m,
				dx: d[0] - g[0],
				dy: d[1] - g[1],
				dispatch: u
			}), s);
		};
	}
	return f.filter = function(t) {
		return arguments.length ? (e = typeof t == "function" ? t : Ys(!!t), f) : e;
	}, f.container = function(e) {
		return arguments.length ? (t = typeof e == "function" ? e : Ys(e), f) : t;
	}, f.subject = function(e) {
		return arguments.length ? (n = typeof e == "function" ? e : Ys(e), f) : n;
	}, f.touchable = function(e) {
		return arguments.length ? (r = typeof e == "function" ? e : Ys(!!e), f) : r;
	}, f.on = function() {
		var e = a.on.apply(a, arguments);
		return e === a ? f : e;
	}, f.clickDistance = function(e) {
		return arguments.length ? (d = (e = +e) * e, f) : Math.sqrt(d);
	}, f;
}
//#endregion
//#region node_modules/d3-color/src/define.js
function nc(e, t, n) {
	e.prototype = t.prototype = n, n.constructor = e;
}
function rc(e, t) {
	var n = Object.create(e.prototype);
	for (var r in t) n[r] = t[r];
	return n;
}
//#endregion
//#region node_modules/d3-color/src/color.js
function ic() {}
var ac = .7, oc = 1 / ac, sc = "\\s*([+-]?\\d+)\\s*", cc = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)\\s*", lc = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)%\\s*", uc = /^#([0-9a-f]{3,8})$/, dc = RegExp(`^rgb\\(${sc},${sc},${sc}\\)$`), fc = RegExp(`^rgb\\(${lc},${lc},${lc}\\)$`), pc = RegExp(`^rgba\\(${sc},${sc},${sc},${cc}\\)$`), mc = RegExp(`^rgba\\(${lc},${lc},${lc},${cc}\\)$`), hc = RegExp(`^hsl\\(${cc},${lc},${lc}\\)$`), gc = RegExp(`^hsla\\(${cc},${lc},${lc},${cc}\\)$`), _c = {
	aliceblue: 15792383,
	antiquewhite: 16444375,
	aqua: 65535,
	aquamarine: 8388564,
	azure: 15794175,
	beige: 16119260,
	bisque: 16770244,
	black: 0,
	blanchedalmond: 16772045,
	blue: 255,
	blueviolet: 9055202,
	brown: 10824234,
	burlywood: 14596231,
	cadetblue: 6266528,
	chartreuse: 8388352,
	chocolate: 13789470,
	coral: 16744272,
	cornflowerblue: 6591981,
	cornsilk: 16775388,
	crimson: 14423100,
	cyan: 65535,
	darkblue: 139,
	darkcyan: 35723,
	darkgoldenrod: 12092939,
	darkgray: 11119017,
	darkgreen: 25600,
	darkgrey: 11119017,
	darkkhaki: 12433259,
	darkmagenta: 9109643,
	darkolivegreen: 5597999,
	darkorange: 16747520,
	darkorchid: 10040012,
	darkred: 9109504,
	darksalmon: 15308410,
	darkseagreen: 9419919,
	darkslateblue: 4734347,
	darkslategray: 3100495,
	darkslategrey: 3100495,
	darkturquoise: 52945,
	darkviolet: 9699539,
	deeppink: 16716947,
	deepskyblue: 49151,
	dimgray: 6908265,
	dimgrey: 6908265,
	dodgerblue: 2003199,
	firebrick: 11674146,
	floralwhite: 16775920,
	forestgreen: 2263842,
	fuchsia: 16711935,
	gainsboro: 14474460,
	ghostwhite: 16316671,
	gold: 16766720,
	goldenrod: 14329120,
	gray: 8421504,
	green: 32768,
	greenyellow: 11403055,
	grey: 8421504,
	honeydew: 15794160,
	hotpink: 16738740,
	indianred: 13458524,
	indigo: 4915330,
	ivory: 16777200,
	khaki: 15787660,
	lavender: 15132410,
	lavenderblush: 16773365,
	lawngreen: 8190976,
	lemonchiffon: 16775885,
	lightblue: 11393254,
	lightcoral: 15761536,
	lightcyan: 14745599,
	lightgoldenrodyellow: 16448210,
	lightgray: 13882323,
	lightgreen: 9498256,
	lightgrey: 13882323,
	lightpink: 16758465,
	lightsalmon: 16752762,
	lightseagreen: 2142890,
	lightskyblue: 8900346,
	lightslategray: 7833753,
	lightslategrey: 7833753,
	lightsteelblue: 11584734,
	lightyellow: 16777184,
	lime: 65280,
	limegreen: 3329330,
	linen: 16445670,
	magenta: 16711935,
	maroon: 8388608,
	mediumaquamarine: 6737322,
	mediumblue: 205,
	mediumorchid: 12211667,
	mediumpurple: 9662683,
	mediumseagreen: 3978097,
	mediumslateblue: 8087790,
	mediumspringgreen: 64154,
	mediumturquoise: 4772300,
	mediumvioletred: 13047173,
	midnightblue: 1644912,
	mintcream: 16121850,
	mistyrose: 16770273,
	moccasin: 16770229,
	navajowhite: 16768685,
	navy: 128,
	oldlace: 16643558,
	olive: 8421376,
	olivedrab: 7048739,
	orange: 16753920,
	orangered: 16729344,
	orchid: 14315734,
	palegoldenrod: 15657130,
	palegreen: 10025880,
	paleturquoise: 11529966,
	palevioletred: 14381203,
	papayawhip: 16773077,
	peachpuff: 16767673,
	peru: 13468991,
	pink: 16761035,
	plum: 14524637,
	powderblue: 11591910,
	purple: 8388736,
	rebeccapurple: 6697881,
	red: 16711680,
	rosybrown: 12357519,
	royalblue: 4286945,
	saddlebrown: 9127187,
	salmon: 16416882,
	sandybrown: 16032864,
	seagreen: 3050327,
	seashell: 16774638,
	sienna: 10506797,
	silver: 12632256,
	skyblue: 8900331,
	slateblue: 6970061,
	slategray: 7372944,
	slategrey: 7372944,
	snow: 16775930,
	springgreen: 65407,
	steelblue: 4620980,
	tan: 13808780,
	teal: 32896,
	thistle: 14204888,
	tomato: 16737095,
	turquoise: 4251856,
	violet: 15631086,
	wheat: 16113331,
	white: 16777215,
	whitesmoke: 16119285,
	yellow: 16776960,
	yellowgreen: 10145074
};
nc(ic, Sc, {
	copy(e) {
		return Object.assign(new this.constructor(), this, e);
	},
	displayable() {
		return this.rgb().displayable();
	},
	hex: vc,
	formatHex: vc,
	formatHex8: yc,
	formatHsl: bc,
	formatRgb: xc,
	toString: xc
});
function vc() {
	return this.rgb().formatHex();
}
function yc() {
	return this.rgb().formatHex8();
}
function bc() {
	return Fc(this).formatHsl();
}
function xc() {
	return this.rgb().formatRgb();
}
function Sc(e) {
	var t, n;
	return e = (e + "").trim().toLowerCase(), (t = uc.exec(e)) ? (n = t[1].length, t = parseInt(t[1], 16), n === 6 ? Cc(t) : n === 3 ? new Dc(t >> 8 & 15 | t >> 4 & 240, t >> 4 & 15 | t & 240, (t & 15) << 4 | t & 15, 1) : n === 8 ? wc(t >> 24 & 255, t >> 16 & 255, t >> 8 & 255, (t & 255) / 255) : n === 4 ? wc(t >> 12 & 15 | t >> 8 & 240, t >> 8 & 15 | t >> 4 & 240, t >> 4 & 15 | t & 240, ((t & 15) << 4 | t & 15) / 255) : null) : (t = dc.exec(e)) ? new Dc(t[1], t[2], t[3], 1) : (t = fc.exec(e)) ? new Dc(t[1] * 255 / 100, t[2] * 255 / 100, t[3] * 255 / 100, 1) : (t = pc.exec(e)) ? wc(t[1], t[2], t[3], t[4]) : (t = mc.exec(e)) ? wc(t[1] * 255 / 100, t[2] * 255 / 100, t[3] * 255 / 100, t[4]) : (t = hc.exec(e)) ? Pc(t[1], t[2] / 100, t[3] / 100, 1) : (t = gc.exec(e)) ? Pc(t[1], t[2] / 100, t[3] / 100, t[4]) : _c.hasOwnProperty(e) ? Cc(_c[e]) : e === "transparent" ? new Dc(NaN, NaN, NaN, 0) : null;
}
function Cc(e) {
	return new Dc(e >> 16 & 255, e >> 8 & 255, e & 255, 1);
}
function wc(e, t, n, r) {
	return r <= 0 && (e = t = n = NaN), new Dc(e, t, n, r);
}
function Tc(e) {
	return e instanceof ic || (e = Sc(e)), e ? (e = e.rgb(), new Dc(e.r, e.g, e.b, e.opacity)) : new Dc();
}
function Ec(e, t, n, r) {
	return arguments.length === 1 ? Tc(e) : new Dc(e, t, n, r ?? 1);
}
function Dc(e, t, n, r) {
	this.r = +e, this.g = +t, this.b = +n, this.opacity = +r;
}
nc(Dc, Ec, rc(ic, {
	brighter(e) {
		return e = e == null ? oc : oc ** +e, new Dc(this.r * e, this.g * e, this.b * e, this.opacity);
	},
	darker(e) {
		return e = e == null ? ac : ac ** +e, new Dc(this.r * e, this.g * e, this.b * e, this.opacity);
	},
	rgb() {
		return this;
	},
	clamp() {
		return new Dc(Mc(this.r), Mc(this.g), Mc(this.b), jc(this.opacity));
	},
	displayable() {
		return -.5 <= this.r && this.r < 255.5 && -.5 <= this.g && this.g < 255.5 && -.5 <= this.b && this.b < 255.5 && 0 <= this.opacity && this.opacity <= 1;
	},
	hex: Oc,
	formatHex: Oc,
	formatHex8: kc,
	formatRgb: Ac,
	toString: Ac
}));
function Oc() {
	return `#${Nc(this.r)}${Nc(this.g)}${Nc(this.b)}`;
}
function kc() {
	return `#${Nc(this.r)}${Nc(this.g)}${Nc(this.b)}${Nc((isNaN(this.opacity) ? 1 : this.opacity) * 255)}`;
}
function Ac() {
	let e = jc(this.opacity);
	return `${e === 1 ? "rgb(" : "rgba("}${Mc(this.r)}, ${Mc(this.g)}, ${Mc(this.b)}${e === 1 ? ")" : `, ${e})`}`;
}
function jc(e) {
	return isNaN(e) ? 1 : Math.max(0, Math.min(1, e));
}
function Mc(e) {
	return Math.max(0, Math.min(255, Math.round(e) || 0));
}
function Nc(e) {
	return e = Mc(e), (e < 16 ? "0" : "") + e.toString(16);
}
function Pc(e, t, n, r) {
	return r <= 0 ? e = t = n = NaN : n <= 0 || n >= 1 ? e = t = NaN : t <= 0 && (e = NaN), new Lc(e, t, n, r);
}
function Fc(e) {
	if (e instanceof Lc) return new Lc(e.h, e.s, e.l, e.opacity);
	if (e instanceof ic || (e = Sc(e)), !e) return new Lc();
	if (e instanceof Lc) return e;
	e = e.rgb();
	var t = e.r / 255, n = e.g / 255, r = e.b / 255, i = Math.min(t, n, r), a = Math.max(t, n, r), o = NaN, s = a - i, c = (a + i) / 2;
	return s ? (o = t === a ? (n - r) / s + (n < r) * 6 : n === a ? (r - t) / s + 2 : (t - n) / s + 4, s /= c < .5 ? a + i : 2 - a - i, o *= 60) : s = c > 0 && c < 1 ? 0 : o, new Lc(o, s, c, e.opacity);
}
function Ic(e, t, n, r) {
	return arguments.length === 1 ? Fc(e) : new Lc(e, t, n, r ?? 1);
}
function Lc(e, t, n, r) {
	this.h = +e, this.s = +t, this.l = +n, this.opacity = +r;
}
nc(Lc, Ic, rc(ic, {
	brighter(e) {
		return e = e == null ? oc : oc ** +e, new Lc(this.h, this.s, this.l * e, this.opacity);
	},
	darker(e) {
		return e = e == null ? ac : ac ** +e, new Lc(this.h, this.s, this.l * e, this.opacity);
	},
	rgb() {
		var e = this.h % 360 + (this.h < 0) * 360, t = isNaN(e) || isNaN(this.s) ? 0 : this.s, n = this.l, r = n + (n < .5 ? n : 1 - n) * t, i = 2 * n - r;
		return new Dc(Bc(e >= 240 ? e - 240 : e + 120, i, r), Bc(e, i, r), Bc(e < 120 ? e + 240 : e - 120, i, r), this.opacity);
	},
	clamp() {
		return new Lc(Rc(this.h), zc(this.s), zc(this.l), jc(this.opacity));
	},
	displayable() {
		return (0 <= this.s && this.s <= 1 || isNaN(this.s)) && 0 <= this.l && this.l <= 1 && 0 <= this.opacity && this.opacity <= 1;
	},
	formatHsl() {
		let e = jc(this.opacity);
		return `${e === 1 ? "hsl(" : "hsla("}${Rc(this.h)}, ${zc(this.s) * 100}%, ${zc(this.l) * 100}%${e === 1 ? ")" : `, ${e})`}`;
	}
}));
function Rc(e) {
	return e = (e || 0) % 360, e < 0 ? e + 360 : e;
}
function zc(e) {
	return Math.max(0, Math.min(1, e || 0));
}
function Bc(e, t, n) {
	return (e < 60 ? t + (n - t) * e / 60 : e < 180 ? n : e < 240 ? t + (n - t) * (240 - e) / 60 : t) * 255;
}
//#endregion
//#region node_modules/d3-interpolate/src/constant.js
var Vc = (e) => () => e;
//#endregion
//#region node_modules/d3-interpolate/src/color.js
function Hc(e, t) {
	return function(n) {
		return e + n * t;
	};
}
function Uc(e, t, n) {
	return e **= +n, t = t ** +n - e, n = 1 / n, function(r) {
		return (e + r * t) ** +n;
	};
}
function Wc(e) {
	return (e = +e) == 1 ? Gc : function(t, n) {
		return n - t ? Uc(t, n, e) : Vc(isNaN(t) ? n : t);
	};
}
function Gc(e, t) {
	var n = t - e;
	return n ? Hc(e, n) : Vc(isNaN(e) ? t : e);
}
//#endregion
//#region node_modules/d3-interpolate/src/rgb.js
var Kc = (function e(t) {
	var n = Wc(t);
	function r(e, t) {
		var r = n((e = Ec(e)).r, (t = Ec(t)).r), i = n(e.g, t.g), a = n(e.b, t.b), o = Gc(e.opacity, t.opacity);
		return function(t) {
			return e.r = r(t), e.g = i(t), e.b = a(t), e.opacity = o(t), e + "";
		};
	}
	return r.gamma = e, r;
})(1);
//#endregion
//#region node_modules/d3-interpolate/src/numberArray.js
function qc(e, t) {
	t ||= [];
	var n = e ? Math.min(t.length, e.length) : 0, r = t.slice(), i;
	return function(a) {
		for (i = 0; i < n; ++i) r[i] = e[i] * (1 - a) + t[i] * a;
		return r;
	};
}
function Jc(e) {
	return ArrayBuffer.isView(e) && !(e instanceof DataView);
}
//#endregion
//#region node_modules/d3-interpolate/src/array.js
function Yc(e, t) {
	for (var n = t ? t.length : 0, r = e ? Math.min(n, e.length) : 0, i = Array(r), a = Array(n), o = 0; o < r; ++o) i[o] = il(e[o], t[o]);
	for (; o < n; ++o) a[o] = t[o];
	return function(e) {
		for (o = 0; o < r; ++o) a[o] = i[o](e);
		return a;
	};
}
//#endregion
//#region node_modules/d3-interpolate/src/date.js
function Xc(e, t) {
	var n = /* @__PURE__ */ new Date();
	return e = +e, t = +t, function(r) {
		return n.setTime(e * (1 - r) + t * r), n;
	};
}
//#endregion
//#region node_modules/d3-interpolate/src/number.js
function Zc(e, t) {
	return e = +e, t = +t, function(n) {
		return e * (1 - n) + t * n;
	};
}
//#endregion
//#region node_modules/d3-interpolate/src/object.js
function Qc(e, t) {
	var n = {}, r = {}, i;
	for (i in (typeof e != "object" || !e) && (e = {}), (typeof t != "object" || !t) && (t = {}), t) i in e ? n[i] = il(e[i], t[i]) : r[i] = t[i];
	return function(e) {
		for (i in n) r[i] = n[i](e);
		return r;
	};
}
//#endregion
//#region node_modules/d3-interpolate/src/string.js
var $c = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g, el = new RegExp($c.source, "g");
function tl(e) {
	return function() {
		return e;
	};
}
function nl(e) {
	return function(t) {
		return e(t) + "";
	};
}
function rl(e, t) {
	var n = $c.lastIndex = el.lastIndex = 0, r, i, a, o = -1, s = [], c = [];
	for (e += "", t += ""; (r = $c.exec(e)) && (i = el.exec(t));) (a = i.index) > n && (a = t.slice(n, a), s[o] ? s[o] += a : s[++o] = a), (r = r[0]) === (i = i[0]) ? s[o] ? s[o] += i : s[++o] = i : (s[++o] = null, c.push({
		i: o,
		x: Zc(r, i)
	})), n = el.lastIndex;
	return n < t.length && (a = t.slice(n), s[o] ? s[o] += a : s[++o] = a), s.length < 2 ? c[0] ? nl(c[0].x) : tl(t) : (t = c.length, function(e) {
		for (var n = 0, r; n < t; ++n) s[(r = c[n]).i] = r.x(e);
		return s.join("");
	});
}
//#endregion
//#region node_modules/d3-interpolate/src/value.js
function il(e, t) {
	var n = typeof t, r;
	return t == null || n === "boolean" ? Vc(t) : (n === "number" ? Zc : n === "string" ? (r = Sc(t)) ? (t = r, Kc) : rl : t instanceof Sc ? Kc : t instanceof Date ? Xc : Jc(t) ? qc : Array.isArray(t) ? Yc : typeof t.valueOf != "function" && typeof t.toString != "function" || isNaN(t) ? Qc : Zc)(e, t);
}
//#endregion
//#region node_modules/d3-interpolate/src/transform/decompose.js
var al = 180 / Math.PI, ol = {
	translateX: 0,
	translateY: 0,
	rotate: 0,
	skewX: 0,
	scaleX: 1,
	scaleY: 1
};
function sl(e, t, n, r, i, a) {
	var o, s, c;
	return (o = Math.sqrt(e * e + t * t)) && (e /= o, t /= o), (c = e * n + t * r) && (n -= e * c, r -= t * c), (s = Math.sqrt(n * n + r * r)) && (n /= s, r /= s, c /= s), e * r < t * n && (e = -e, t = -t, c = -c, o = -o), {
		translateX: i,
		translateY: a,
		rotate: Math.atan2(t, e) * al,
		skewX: Math.atan(c) * al,
		scaleX: o,
		scaleY: s
	};
}
//#endregion
//#region node_modules/d3-interpolate/src/transform/parse.js
var cl;
function ll(e) {
	let t = new (typeof DOMMatrix == "function" ? DOMMatrix : WebKitCSSMatrix)(e + "");
	return t.isIdentity ? ol : sl(t.a, t.b, t.c, t.d, t.e, t.f);
}
function ul(e) {
	return e == null || (cl ||= document.createElementNS("http://www.w3.org/2000/svg", "g"), cl.setAttribute("transform", e), !(e = cl.transform.baseVal.consolidate())) ? ol : (e = e.matrix, sl(e.a, e.b, e.c, e.d, e.e, e.f));
}
//#endregion
//#region node_modules/d3-interpolate/src/transform/index.js
function dl(e, t, n, r) {
	function i(e) {
		return e.length ? e.pop() + " " : "";
	}
	function a(e, r, i, a, o, s) {
		if (e !== i || r !== a) {
			var c = o.push("translate(", null, t, null, n);
			s.push({
				i: c - 4,
				x: Zc(e, i)
			}, {
				i: c - 2,
				x: Zc(r, a)
			});
		} else (i || a) && o.push("translate(" + i + t + a + n);
	}
	function o(e, t, n, a) {
		e === t ? t && n.push(i(n) + "rotate(" + t + r) : (e - t > 180 ? t += 360 : t - e > 180 && (e += 360), a.push({
			i: n.push(i(n) + "rotate(", null, r) - 2,
			x: Zc(e, t)
		}));
	}
	function s(e, t, n, a) {
		e === t ? t && n.push(i(n) + "skewX(" + t + r) : a.push({
			i: n.push(i(n) + "skewX(", null, r) - 2,
			x: Zc(e, t)
		});
	}
	function c(e, t, n, r, a, o) {
		if (e !== n || t !== r) {
			var s = a.push(i(a) + "scale(", null, ",", null, ")");
			o.push({
				i: s - 4,
				x: Zc(e, n)
			}, {
				i: s - 2,
				x: Zc(t, r)
			});
		} else (n !== 1 || r !== 1) && a.push(i(a) + "scale(" + n + "," + r + ")");
	}
	return function(t, n) {
		var r = [], i = [];
		return t = e(t), n = e(n), a(t.translateX, t.translateY, n.translateX, n.translateY, r, i), o(t.rotate, n.rotate, r, i), s(t.skewX, n.skewX, r, i), c(t.scaleX, t.scaleY, n.scaleX, n.scaleY, r, i), t = n = null, function(e) {
			for (var t = -1, n = i.length, a; ++t < n;) r[(a = i[t]).i] = a.x(e);
			return r.join("");
		};
	};
}
var fl = dl(ll, "px, ", "px)", "deg)"), pl = dl(ul, ", ", ")", ")"), ml = 1e-12;
function hl(e) {
	return ((e = Math.exp(e)) + 1 / e) / 2;
}
function gl(e) {
	return ((e = Math.exp(e)) - 1 / e) / 2;
}
function _l(e) {
	return ((e = Math.exp(2 * e)) - 1) / (e + 1);
}
var vl = (function e(t, n, r) {
	function i(e, i) {
		var a = e[0], o = e[1], s = e[2], c = i[0], l = i[1], u = i[2], d = c - a, f = l - o, p = d * d + f * f, m, h;
		if (p < ml) h = Math.log(u / s) / t, m = function(e) {
			return [
				a + e * d,
				o + e * f,
				s * Math.exp(t * e * h)
			];
		};
		else {
			var g = Math.sqrt(p), _ = (u * u - s * s + r * p) / (2 * s * n * g), v = (u * u - s * s - r * p) / (2 * u * n * g), y = Math.log(Math.sqrt(_ * _ + 1) - _);
			h = (Math.log(Math.sqrt(v * v + 1) - v) - y) / t, m = function(e) {
				var r = e * h, i = hl(y), c = s / (n * g) * (i * _l(t * r + y) - gl(y));
				return [
					a + c * d,
					o + c * f,
					s * i / hl(t * r + y)
				];
			};
		}
		return m.duration = h * 1e3 * t / Math.SQRT2, m;
	}
	return i.rho = function(t) {
		var n = Math.max(.001, +t), r = n * n;
		return e(n, r, r * r);
	}, i;
})(Math.SQRT2, 2, 4), yl = 0, bl = 0, xl = 0, Sl = 1e3, Cl, wl, Tl = 0, El = 0, Dl = 0, Ol = typeof performance == "object" && performance.now ? performance : Date, kl = typeof window == "object" && window.requestAnimationFrame ? window.requestAnimationFrame.bind(window) : function(e) {
	setTimeout(e, 17);
};
function Al() {
	return El ||= (kl(jl), Ol.now() + Dl);
}
function jl() {
	El = 0;
}
function Ml() {
	this._call = this._time = this._next = null;
}
Ml.prototype = Nl.prototype = {
	constructor: Ml,
	restart: function(e, t, n) {
		if (typeof e != "function") throw TypeError("callback is not a function");
		n = (n == null ? Al() : +n) + (t == null ? 0 : +t), !this._next && wl !== this && (wl ? wl._next = this : Cl = this, wl = this), this._call = e, this._time = n, Rl();
	},
	stop: function() {
		this._call && (this._call = null, this._time = Infinity, Rl());
	}
};
function Nl(e, t, n) {
	var r = new Ml();
	return r.restart(e, t, n), r;
}
function Pl() {
	Al(), ++yl;
	for (var e = Cl, t; e;) (t = El - e._time) >= 0 && e._call.call(void 0, t), e = e._next;
	--yl;
}
function Fl() {
	El = (Tl = Ol.now()) + Dl, yl = bl = 0;
	try {
		Pl();
	} finally {
		yl = 0, Ll(), El = 0;
	}
}
function Il() {
	var e = Ol.now(), t = e - Tl;
	t > Sl && (Dl -= t, Tl = e);
}
function Ll() {
	for (var e, t = Cl, n, r = Infinity; t;) t._call ? (r > t._time && (r = t._time), e = t, t = t._next) : (n = t._next, t._next = null, t = e ? e._next = n : Cl = n);
	wl = e, Rl(r);
}
function Rl(e) {
	yl || (bl &&= clearTimeout(bl), e - El > 24 ? (e < Infinity && (bl = setTimeout(Fl, e - Ol.now() - Dl)), xl &&= clearInterval(xl)) : (xl ||= (Tl = Ol.now(), setInterval(Il, Sl)), yl = 1, kl(Fl)));
}
//#endregion
//#region node_modules/d3-timer/src/timeout.js
function zl(e, t, n) {
	var r = new Ml();
	return t = t == null ? 0 : +t, r.restart((n) => {
		r.stop(), e(n + t);
	}, t, n), r;
}
//#endregion
//#region node_modules/d3-transition/src/transition/schedule.js
var Bl = Ia("start", "end", "cancel", "interrupt"), Vl = [];
function Hl(e, t, n, r, i, a) {
	var o = e.__transition;
	if (!o) e.__transition = {};
	else if (n in o) return;
	Kl(e, n, {
		name: t,
		index: r,
		group: i,
		on: Bl,
		tween: Vl,
		time: a.time,
		delay: a.delay,
		duration: a.duration,
		ease: a.ease,
		timer: null,
		state: 0
	});
}
function Ul(e, t) {
	var n = Gl(e, t);
	if (n.state > 0) throw Error("too late; already scheduled");
	return n;
}
function Wl(e, t) {
	var n = Gl(e, t);
	if (n.state > 3) throw Error("too late; already running");
	return n;
}
function Gl(e, t) {
	var n = e.__transition;
	if (!n || !(n = n[t])) throw Error("transition not found");
	return n;
}
function Kl(e, t, n) {
	var r = e.__transition, i;
	r[t] = n, n.timer = Nl(a, 0, n.time);
	function a(e) {
		n.state = 1, n.timer.restart(o, n.delay, n.time), n.delay <= e && o(e - n.delay);
	}
	function o(a) {
		var l, u, d, f;
		if (n.state !== 1) return c();
		for (l in r) if (f = r[l], f.name === n.name) {
			if (f.state === 3) return zl(o);
			f.state === 4 ? (f.state = 6, f.timer.stop(), f.on.call("interrupt", e, e.__data__, f.index, f.group), delete r[l]) : +l < t && (f.state = 6, f.timer.stop(), f.on.call("cancel", e, e.__data__, f.index, f.group), delete r[l]);
		}
		if (zl(function() {
			n.state === 3 && (n.state = 4, n.timer.restart(s, n.delay, n.time), s(a));
		}), n.state = 2, n.on.call("start", e, e.__data__, n.index, n.group), n.state === 2) {
			for (n.state = 3, i = Array(d = n.tween.length), l = 0, u = -1; l < d; ++l) (f = n.tween[l].value.call(e, e.__data__, n.index, n.group)) && (i[++u] = f);
			i.length = u + 1;
		}
	}
	function s(t) {
		for (var r = t < n.duration ? n.ease.call(null, t / n.duration) : (n.timer.restart(c), n.state = 5, 1), a = -1, o = i.length; ++a < o;) i[a].call(e, r);
		n.state === 5 && (n.on.call("end", e, e.__data__, n.index, n.group), c());
	}
	function c() {
		for (var i in n.state = 6, n.timer.stop(), delete r[t], r) return;
		delete e.__transition;
	}
}
//#endregion
//#region node_modules/d3-transition/src/interrupt.js
function ql(e, t) {
	var n = e.__transition, r, i, a = !0, o;
	if (n) {
		for (o in t = t == null ? null : t + "", n) {
			if ((r = n[o]).name !== t) {
				a = !1;
				continue;
			}
			i = r.state > 2 && r.state < 5, r.state = 6, r.timer.stop(), r.on.call(i ? "interrupt" : "cancel", e, e.__data__, r.index, r.group), delete n[o];
		}
		a && delete e.__transition;
	}
}
//#endregion
//#region node_modules/d3-transition/src/selection/interrupt.js
function Jl(e) {
	return this.each(function() {
		ql(this, e);
	});
}
//#endregion
//#region node_modules/d3-transition/src/transition/tween.js
function Yl(e, t) {
	var n, r;
	return function() {
		var i = Wl(this, e), a = i.tween;
		if (a !== n) {
			r = n = a;
			for (var o = 0, s = r.length; o < s; ++o) if (r[o].name === t) {
				r = r.slice(), r.splice(o, 1);
				break;
			}
		}
		i.tween = r;
	};
}
function Xl(e, t, n) {
	var r, i;
	if (typeof n != "function") throw Error();
	return function() {
		var a = Wl(this, e), o = a.tween;
		if (o !== r) {
			i = (r = o).slice();
			for (var s = {
				name: t,
				value: n
			}, c = 0, l = i.length; c < l; ++c) if (i[c].name === t) {
				i[c] = s;
				break;
			}
			c === l && i.push(s);
		}
		a.tween = i;
	};
}
function Zl(e, t) {
	var n = this._id;
	if (e += "", arguments.length < 2) {
		for (var r = Gl(this.node(), n).tween, i = 0, a = r.length, o; i < a; ++i) if ((o = r[i]).name === e) return o.value;
		return null;
	}
	return this.each((t == null ? Yl : Xl)(n, e, t));
}
function Ql(e, t, n) {
	var r = e._id;
	return e.each(function() {
		var e = Wl(this, r);
		(e.value ||= {})[t] = n.apply(this, arguments);
	}), function(e) {
		return Gl(e, r).value[t];
	};
}
//#endregion
//#region node_modules/d3-transition/src/transition/interpolate.js
function $l(e, t) {
	var n;
	return (typeof t == "number" ? Zc : t instanceof Sc ? Kc : (n = Sc(t)) ? (t = n, Kc) : rl)(e, t);
}
//#endregion
//#region node_modules/d3-transition/src/transition/attr.js
function eu(e) {
	return function() {
		this.removeAttribute(e);
	};
}
function tu(e) {
	return function() {
		this.removeAttributeNS(e.space, e.local);
	};
}
function nu(e, t, n) {
	var r, i = n + "", a;
	return function() {
		var o = this.getAttribute(e);
		return o === i ? null : o === r ? a : a = t(r = o, n);
	};
}
function ru(e, t, n) {
	var r, i = n + "", a;
	return function() {
		var o = this.getAttributeNS(e.space, e.local);
		return o === i ? null : o === r ? a : a = t(r = o, n);
	};
}
function iu(e, t, n) {
	var r, i, a;
	return function() {
		var o, s = n(this), c;
		return s == null ? void this.removeAttribute(e) : (o = this.getAttribute(e), c = s + "", o === c ? null : o === r && c === i ? a : (i = c, a = t(r = o, s)));
	};
}
function au(e, t, n) {
	var r, i, a;
	return function() {
		var o, s = n(this), c;
		return s == null ? void this.removeAttributeNS(e.space, e.local) : (o = this.getAttributeNS(e.space, e.local), c = s + "", o === c ? null : o === r && c === i ? a : (i = c, a = t(r = o, s)));
	};
}
function ou(e, t) {
	var n = Ha(e), r = n === "transform" ? pl : $l;
	return this.attrTween(e, typeof t == "function" ? (n.local ? au : iu)(n, r, Ql(this, "attr." + e, t)) : t == null ? (n.local ? tu : eu)(n) : (n.local ? ru : nu)(n, r, t));
}
//#endregion
//#region node_modules/d3-transition/src/transition/attrTween.js
function su(e, t) {
	return function(n) {
		this.setAttribute(e, t.call(this, n));
	};
}
function cu(e, t) {
	return function(n) {
		this.setAttributeNS(e.space, e.local, t.call(this, n));
	};
}
function lu(e, t) {
	var n, r;
	function i() {
		var i = t.apply(this, arguments);
		return i !== r && (n = (r = i) && cu(e, i)), n;
	}
	return i._value = t, i;
}
function uu(e, t) {
	var n, r;
	function i() {
		var i = t.apply(this, arguments);
		return i !== r && (n = (r = i) && su(e, i)), n;
	}
	return i._value = t, i;
}
function du(e, t) {
	var n = "attr." + e;
	if (arguments.length < 2) return (n = this.tween(n)) && n._value;
	if (t == null) return this.tween(n, null);
	if (typeof t != "function") throw Error();
	var r = Ha(e);
	return this.tween(n, (r.local ? lu : uu)(r, t));
}
//#endregion
//#region node_modules/d3-transition/src/transition/delay.js
function fu(e, t) {
	return function() {
		Ul(this, e).delay = +t.apply(this, arguments);
	};
}
function pu(e, t) {
	return t = +t, function() {
		Ul(this, e).delay = t;
	};
}
function mu(e) {
	var t = this._id;
	return arguments.length ? this.each((typeof e == "function" ? fu : pu)(t, e)) : Gl(this.node(), t).delay;
}
//#endregion
//#region node_modules/d3-transition/src/transition/duration.js
function hu(e, t) {
	return function() {
		Wl(this, e).duration = +t.apply(this, arguments);
	};
}
function gu(e, t) {
	return t = +t, function() {
		Wl(this, e).duration = t;
	};
}
function _u(e) {
	var t = this._id;
	return arguments.length ? this.each((typeof e == "function" ? hu : gu)(t, e)) : Gl(this.node(), t).duration;
}
//#endregion
//#region node_modules/d3-transition/src/transition/ease.js
function vu(e, t) {
	if (typeof t != "function") throw Error();
	return function() {
		Wl(this, e).ease = t;
	};
}
function yu(e) {
	var t = this._id;
	return arguments.length ? this.each(vu(t, e)) : Gl(this.node(), t).ease;
}
//#endregion
//#region node_modules/d3-transition/src/transition/easeVarying.js
function bu(e, t) {
	return function() {
		var n = t.apply(this, arguments);
		if (typeof n != "function") throw Error();
		Wl(this, e).ease = n;
	};
}
function xu(e) {
	if (typeof e != "function") throw Error();
	return this.each(bu(this._id, e));
}
//#endregion
//#region node_modules/d3-transition/src/transition/filter.js
function Su(e) {
	typeof e != "function" && (e = eo(e));
	for (var t = this._groups, n = t.length, r = Array(n), i = 0; i < n; ++i) for (var a = t[i], o = a.length, s = r[i] = [], c, l = 0; l < o; ++l) (c = a[l]) && e.call(c, c.__data__, l, a) && s.push(c);
	return new Zu(r, this._parents, this._name, this._id);
}
//#endregion
//#region node_modules/d3-transition/src/transition/merge.js
function Cu(e) {
	if (e._id !== this._id) throw Error();
	for (var t = this._groups, n = e._groups, r = t.length, i = n.length, a = Math.min(r, i), o = Array(r), s = 0; s < a; ++s) for (var c = t[s], l = n[s], u = c.length, d = o[s] = Array(u), f, p = 0; p < u; ++p) (f = c[p] || l[p]) && (d[p] = f);
	for (; s < r; ++s) o[s] = t[s];
	return new Zu(o, this._parents, this._name, this._id);
}
//#endregion
//#region node_modules/d3-transition/src/transition/on.js
function wu(e) {
	return (e + "").trim().split(/^|\s+/).every(function(e) {
		var t = e.indexOf(".");
		return t >= 0 && (e = e.slice(0, t)), !e || e === "start";
	});
}
function Tu(e, t, n) {
	var r, i, a = wu(t) ? Ul : Wl;
	return function() {
		var o = a(this, e), s = o.on;
		s !== r && (i = (r = s).copy()).on(t, n), o.on = i;
	};
}
function Eu(e, t) {
	var n = this._id;
	return arguments.length < 2 ? Gl(this.node(), n).on.on(e) : this.each(Tu(n, e, t));
}
//#endregion
//#region node_modules/d3-transition/src/transition/remove.js
function Du(e) {
	return function() {
		var t = this.parentNode;
		for (var n in this.__transition) if (+n !== e) return;
		t && t.removeChild(this);
	};
}
function Ou() {
	return this.on("end.remove", Du(this._id));
}
//#endregion
//#region node_modules/d3-transition/src/transition/select.js
function ku(e) {
	var t = this._name, n = this._id;
	typeof e != "function" && (e = qa(e));
	for (var r = this._groups, i = r.length, a = Array(i), o = 0; o < i; ++o) for (var s = r[o], c = s.length, l = a[o] = Array(c), u, d, f = 0; f < c; ++f) (u = s[f]) && (d = e.call(u, u.__data__, f, s)) && ("__data__" in u && (d.__data__ = u.__data__), l[f] = d, Hl(l[f], t, n, f, l, Gl(u, n)));
	return new Zu(a, this._parents, t, n);
}
//#endregion
//#region node_modules/d3-transition/src/transition/selectAll.js
function Au(e) {
	var t = this._name, n = this._id;
	typeof e != "function" && (e = Za(e));
	for (var r = this._groups, i = r.length, a = [], o = [], s = 0; s < i; ++s) for (var c = r[s], l = c.length, u, d = 0; d < l; ++d) if (u = c[d]) {
		for (var f = e.call(u, u.__data__, d, c), p, m = Gl(u, n), h = 0, g = f.length; h < g; ++h) (p = f[h]) && Hl(p, t, n, h, f, m);
		a.push(f), o.push(u);
	}
	return new Zu(a, o, t, n);
}
//#endregion
//#region node_modules/d3-transition/src/transition/selection.js
var ju = Rs.prototype.constructor;
function Mu() {
	return new ju(this._groups, this._parents);
}
//#endregion
//#region node_modules/d3-transition/src/transition/style.js
function Nu(e, t) {
	var n, r, i;
	return function() {
		var a = Go(this, e), o = (this.style.removeProperty(e), Go(this, e));
		return a === o ? null : a === n && o === r ? i : i = t(n = a, r = o);
	};
}
function Pu(e) {
	return function() {
		this.style.removeProperty(e);
	};
}
function Fu(e, t, n) {
	var r, i = n + "", a;
	return function() {
		var o = Go(this, e);
		return o === i ? null : o === r ? a : a = t(r = o, n);
	};
}
function Iu(e, t, n) {
	var r, i, a;
	return function() {
		var o = Go(this, e), s = n(this), c = s + "";
		return s ?? (c = s = (this.style.removeProperty(e), Go(this, e))), o === c ? null : o === r && c === i ? a : (i = c, a = t(r = o, s));
	};
}
function Lu(e, t) {
	var n, r, i, a = "style." + t, o = "end." + a, s;
	return function() {
		var c = Wl(this, e), l = c.on, u = c.value[a] == null ? s ||= Pu(t) : void 0;
		(l !== n || i !== u) && (r = (n = l).copy()).on(o, i = u), c.on = r;
	};
}
function Ru(e, t, n) {
	var r = (e += "") == "transform" ? fl : $l;
	return t == null ? this.styleTween(e, Nu(e, r)).on("end.style." + e, Pu(e)) : typeof t == "function" ? this.styleTween(e, Iu(e, r, Ql(this, "style." + e, t))).each(Lu(this._id, e)) : this.styleTween(e, Fu(e, r, t), n).on("end.style." + e, null);
}
//#endregion
//#region node_modules/d3-transition/src/transition/styleTween.js
function zu(e, t, n) {
	return function(r) {
		this.style.setProperty(e, t.call(this, r), n);
	};
}
function Bu(e, t, n) {
	var r, i;
	function a() {
		var a = t.apply(this, arguments);
		return a !== i && (r = (i = a) && zu(e, a, n)), r;
	}
	return a._value = t, a;
}
function Vu(e, t, n) {
	var r = "style." + (e += "");
	if (arguments.length < 2) return (r = this.tween(r)) && r._value;
	if (t == null) return this.tween(r, null);
	if (typeof t != "function") throw Error();
	return this.tween(r, Bu(e, t, n ?? ""));
}
//#endregion
//#region node_modules/d3-transition/src/transition/text.js
function Hu(e) {
	return function() {
		this.textContent = e;
	};
}
function Uu(e) {
	return function() {
		var t = e(this);
		this.textContent = t ?? "";
	};
}
function Wu(e) {
	return this.tween("text", typeof e == "function" ? Uu(Ql(this, "text", e)) : Hu(e == null ? "" : e + ""));
}
//#endregion
//#region node_modules/d3-transition/src/transition/textTween.js
function Gu(e) {
	return function(t) {
		this.textContent = e.call(this, t);
	};
}
function Ku(e) {
	var t, n;
	function r() {
		var r = e.apply(this, arguments);
		return r !== n && (t = (n = r) && Gu(r)), t;
	}
	return r._value = e, r;
}
function qu(e) {
	var t = "text";
	if (arguments.length < 1) return (t = this.tween(t)) && t._value;
	if (e == null) return this.tween(t, null);
	if (typeof e != "function") throw Error();
	return this.tween(t, Ku(e));
}
//#endregion
//#region node_modules/d3-transition/src/transition/transition.js
function Ju() {
	for (var e = this._name, t = this._id, n = Qu(), r = this._groups, i = r.length, a = 0; a < i; ++a) for (var o = r[a], s = o.length, c, l = 0; l < s; ++l) if (c = o[l]) {
		var u = Gl(c, t);
		Hl(c, e, n, l, o, {
			time: u.time + u.delay + u.duration,
			delay: 0,
			duration: u.duration,
			ease: u.ease
		});
	}
	return new Zu(r, this._parents, e, n);
}
//#endregion
//#region node_modules/d3-transition/src/transition/end.js
function Yu() {
	var e, t, n = this, r = n._id, i = n.size();
	return new Promise(function(a, o) {
		var s = { value: o }, c = { value: function() {
			--i === 0 && a();
		} };
		n.each(function() {
			var n = Wl(this, r), i = n.on;
			i !== e && (t = (e = i).copy(), t._.cancel.push(s), t._.interrupt.push(s), t._.end.push(c)), n.on = t;
		}), i === 0 && a();
	});
}
//#endregion
//#region node_modules/d3-transition/src/transition/index.js
var Xu = 0;
function Zu(e, t, n, r) {
	this._groups = e, this._parents = t, this._name = n, this._id = r;
}
function Qu() {
	return ++Xu;
}
var $u = Rs.prototype;
Zu.prototype = {
	constructor: Zu,
	select: ku,
	selectAll: Au,
	selectChild: $u.selectChild,
	selectChildren: $u.selectChildren,
	filter: Su,
	merge: Cu,
	selection: Mu,
	transition: Ju,
	call: $u.call,
	nodes: $u.nodes,
	node: $u.node,
	size: $u.size,
	empty: $u.empty,
	each: $u.each,
	on: Eu,
	attr: ou,
	attrTween: du,
	style: Ru,
	styleTween: Vu,
	text: Wu,
	textTween: qu,
	remove: Ou,
	tween: Zl,
	delay: mu,
	duration: _u,
	ease: yu,
	easeVarying: xu,
	end: Yu,
	[Symbol.iterator]: $u[Symbol.iterator]
};
//#endregion
//#region node_modules/d3-ease/src/cubic.js
function ed(e) {
	return ((e *= 2) <= 1 ? e * e * e : (e -= 2) * e * e + 2) / 2;
}
//#endregion
//#region node_modules/d3-transition/src/selection/transition.js
var td = {
	time: null,
	delay: 0,
	duration: 250,
	ease: ed
};
function nd(e, t) {
	for (var n; !(n = e.__transition) || !(n = n[t]);) if (!(e = e.parentNode)) throw Error(`transition ${t} not found`);
	return n;
}
function rd(e) {
	var t, n;
	e instanceof Zu ? (t = e._id, e = e._name) : (t = Qu(), (n = td).time = Al(), e = e == null ? null : e + "");
	for (var r = this._groups, i = r.length, a = 0; a < i; ++a) for (var o = r[a], s = o.length, c, l = 0; l < s; ++l) (c = o[l]) && Hl(c, e, t, l, o, n || nd(c, t));
	return new Zu(r, this._parents, e, t);
}
Rs.prototype.interrupt = Jl, Rs.prototype.transition = rd;
//#endregion
//#region node_modules/d3-zoom/src/constant.js
var id = (e) => () => e;
//#endregion
//#region node_modules/d3-zoom/src/event.js
function ad(e, { sourceEvent: t, target: n, transform: r, dispatch: i }) {
	Object.defineProperties(this, {
		type: {
			value: e,
			enumerable: !0,
			configurable: !0
		},
		sourceEvent: {
			value: t,
			enumerable: !0,
			configurable: !0
		},
		target: {
			value: n,
			enumerable: !0,
			configurable: !0
		},
		transform: {
			value: r,
			enumerable: !0,
			configurable: !0
		},
		_: { value: i }
	});
}
//#endregion
//#region node_modules/d3-zoom/src/transform.js
function od(e, t, n) {
	this.k = e, this.x = t, this.y = n;
}
od.prototype = {
	constructor: od,
	scale: function(e) {
		return e === 1 ? this : new od(this.k * e, this.x, this.y);
	},
	translate: function(e, t) {
		return e === 0 & t === 0 ? this : new od(this.k, this.x + this.k * e, this.y + this.k * t);
	},
	apply: function(e) {
		return [e[0] * this.k + this.x, e[1] * this.k + this.y];
	},
	applyX: function(e) {
		return e * this.k + this.x;
	},
	applyY: function(e) {
		return e * this.k + this.y;
	},
	invert: function(e) {
		return [(e[0] - this.x) / this.k, (e[1] - this.y) / this.k];
	},
	invertX: function(e) {
		return (e - this.x) / this.k;
	},
	invertY: function(e) {
		return (e - this.y) / this.k;
	},
	rescaleX: function(e) {
		return e.copy().domain(e.range().map(this.invertX, this).map(e.invert, e));
	},
	rescaleY: function(e) {
		return e.copy().domain(e.range().map(this.invertY, this).map(e.invert, e));
	},
	toString: function() {
		return "translate(" + this.x + "," + this.y + ") scale(" + this.k + ")";
	}
};
var sd = new od(1, 0, 0);
cd.prototype = od.prototype;
function cd(e) {
	for (; !e.__zoom;) if (!(e = e.parentNode)) return sd;
	return e.__zoom;
}
//#endregion
//#region node_modules/d3-zoom/src/noevent.js
function ld(e) {
	e.stopImmediatePropagation();
}
function ud(e) {
	e.preventDefault(), e.stopImmediatePropagation();
}
//#endregion
//#region node_modules/d3-zoom/src/zoom.js
function dd(e) {
	return (!e.ctrlKey || e.type === "wheel") && !e.button;
}
function fd() {
	var e = this;
	return e instanceof SVGElement ? (e = e.ownerSVGElement || e, e.hasAttribute("viewBox") ? (e = e.viewBox.baseVal, [[e.x, e.y], [e.x + e.width, e.y + e.height]]) : [[0, 0], [e.width.baseVal.value, e.height.baseVal.value]]) : [[0, 0], [e.clientWidth, e.clientHeight]];
}
function pd() {
	return this.__zoom || sd;
}
function md(e) {
	return -e.deltaY * (e.deltaMode === 1 ? .05 : e.deltaMode ? 1 : .002) * (e.ctrlKey ? 10 : 1);
}
function hd() {
	return navigator.maxTouchPoints || "ontouchstart" in this;
}
function gd(e, t, n) {
	var r = e.invertX(t[0][0]) - n[0][0], i = e.invertX(t[1][0]) - n[1][0], a = e.invertY(t[0][1]) - n[0][1], o = e.invertY(t[1][1]) - n[1][1];
	return e.translate(i > r ? (r + i) / 2 : Math.min(0, r) || Math.max(0, i), o > a ? (a + o) / 2 : Math.min(0, a) || Math.max(0, o));
}
function _d() {
	var e = dd, t = fd, n = gd, r = md, i = hd, a = [0, Infinity], o = [[-Infinity, -Infinity], [Infinity, Infinity]], s = 250, c = vl, l = Ia("start", "zoom", "end"), u, d, f, p = 500, m = 150, h = 0, g = 10;
	function _(e) {
		e.property("__zoom", pd).on("wheel.zoom", w, { passive: !1 }).on("mousedown.zoom", T).on("dblclick.zoom", ee).filter(i).on("touchstart.zoom", te).on("touchmove.zoom", ne).on("touchend.zoom touchcancel.zoom", re).style("-webkit-tap-highlight-color", "rgba(0,0,0,0)");
	}
	_.transform = function(e, t, n, r) {
		var i = e.selection ? e.selection() : e;
		i.property("__zoom", pd), e === i ? i.interrupt().each(function() {
			S(this, arguments).event(r).start().zoom(null, typeof t == "function" ? t.apply(this, arguments) : t).end();
		}) : x(e, t, n, r);
	}, _.scaleBy = function(e, t, n, r) {
		_.scaleTo(e, function() {
			return this.__zoom.k * (typeof t == "function" ? t.apply(this, arguments) : t);
		}, n, r);
	}, _.scaleTo = function(e, r, i, a) {
		_.transform(e, function() {
			var e = t.apply(this, arguments), a = this.__zoom, s = i == null ? b(e) : typeof i == "function" ? i.apply(this, arguments) : i, c = a.invert(s), l = typeof r == "function" ? r.apply(this, arguments) : r;
			return n(y(v(a, l), s, c), e, o);
		}, i, a);
	}, _.translateBy = function(e, r, i, a) {
		_.transform(e, function() {
			return n(this.__zoom.translate(typeof r == "function" ? r.apply(this, arguments) : r, typeof i == "function" ? i.apply(this, arguments) : i), t.apply(this, arguments), o);
		}, null, a);
	}, _.translateTo = function(e, r, i, a, s) {
		_.transform(e, function() {
			var e = t.apply(this, arguments), s = this.__zoom, c = a == null ? b(e) : typeof a == "function" ? a.apply(this, arguments) : a;
			return n(sd.translate(c[0], c[1]).scale(s.k).translate(typeof r == "function" ? -r.apply(this, arguments) : -r, typeof i == "function" ? -i.apply(this, arguments) : -i), e, o);
		}, a, s);
	};
	function v(e, t) {
		return t = Math.max(a[0], Math.min(a[1], t)), t === e.k ? e : new od(t, e.x, e.y);
	}
	function y(e, t, n) {
		var r = t[0] - n[0] * e.k, i = t[1] - n[1] * e.k;
		return r === e.x && i === e.y ? e : new od(e.k, r, i);
	}
	function b(e) {
		return [(+e[0][0] + +e[1][0]) / 2, (+e[0][1] + +e[1][1]) / 2];
	}
	function x(e, n, r, i) {
		e.on("start.zoom", function() {
			S(this, arguments).event(i).start();
		}).on("interrupt.zoom end.zoom", function() {
			S(this, arguments).event(i).end();
		}).tween("zoom", function() {
			var e = this, a = arguments, o = S(e, a).event(i), s = t.apply(e, a), l = r == null ? b(s) : typeof r == "function" ? r.apply(e, a) : r, u = Math.max(s[1][0] - s[0][0], s[1][1] - s[0][1]), d = e.__zoom, f = typeof n == "function" ? n.apply(e, a) : n, p = c(d.invert(l).concat(u / d.k), f.invert(l).concat(u / f.k));
			return function(e) {
				if (e === 1) e = f;
				else {
					var t = p(e), n = u / t[2];
					e = new od(n, l[0] - t[0] * n, l[1] - t[1] * n);
				}
				o.zoom(null, e);
			};
		});
	}
	function S(e, t, n) {
		return !n && e.__zooming || new C(e, t);
	}
	function C(e, n) {
		this.that = e, this.args = n, this.active = 0, this.sourceEvent = null, this.extent = t.apply(e, n), this.taps = 0;
	}
	C.prototype = {
		event: function(e) {
			return e && (this.sourceEvent = e), this;
		},
		start: function() {
			return ++this.active === 1 && (this.that.__zooming = this, this.emit("start")), this;
		},
		zoom: function(e, t) {
			return this.mouse && e !== "mouse" && (this.mouse[1] = t.invert(this.mouse[0])), this.touch0 && e !== "touch" && (this.touch0[1] = t.invert(this.touch0[0])), this.touch1 && e !== "touch" && (this.touch1[1] = t.invert(this.touch1[0])), this.that.__zoom = t, this.emit("zoom"), this;
		},
		end: function() {
			return --this.active === 0 && (delete this.that.__zooming, this.emit("end")), this;
		},
		emit: function(e) {
			var t = Bs(this.that).datum();
			l.call(e, this.that, new ad(e, {
				sourceEvent: this.sourceEvent,
				target: _,
				type: e,
				transform: this.that.__zoom,
				dispatch: l
			}), t);
		}
	};
	function w(t, ...i) {
		if (!e.apply(this, arguments)) return;
		var s = S(this, i).event(t), c = this.__zoom, l = Math.max(a[0], Math.min(a[1], c.k * 2 ** r.apply(this, arguments))), u = Hs(t);
		if (s.wheel) (s.mouse[0][0] !== u[0] || s.mouse[0][1] !== u[1]) && (s.mouse[1] = c.invert(s.mouse[0] = u)), clearTimeout(s.wheel);
		else if (c.k === l) return;
		else s.mouse = [u, c.invert(u)], ql(this), s.start();
		ud(t), s.wheel = setTimeout(d, m), s.zoom("mouse", n(y(v(c, l), s.mouse[0], s.mouse[1]), s.extent, o));
		function d() {
			s.wheel = null, s.end();
		}
	}
	function T(t, ...r) {
		if (f || !e.apply(this, arguments)) return;
		var i = t.currentTarget, a = S(this, r, !0).event(t), s = Bs(t.view).on("mousemove.zoom", d, !0).on("mouseup.zoom", p, !0), c = Hs(t, i), l = t.clientX, u = t.clientY;
		qs(t.view), ld(t), a.mouse = [c, this.__zoom.invert(c)], ql(this), a.start();
		function d(e) {
			if (ud(e), !a.moved) {
				var t = e.clientX - l, r = e.clientY - u;
				a.moved = t * t + r * r > h;
			}
			a.event(e).zoom("mouse", n(y(a.that.__zoom, a.mouse[0] = Hs(e, i), a.mouse[1]), a.extent, o));
		}
		function p(e) {
			s.on("mousemove.zoom mouseup.zoom", null), Js(e.view, a.moved), ud(e), a.event(e).end();
		}
	}
	function ee(r, ...i) {
		if (e.apply(this, arguments)) {
			var a = this.__zoom, c = Hs(r.changedTouches ? r.changedTouches[0] : r, this), l = a.invert(c), u = a.k * (r.shiftKey ? .5 : 2), d = n(y(v(a, u), c, l), t.apply(this, i), o);
			ud(r), s > 0 ? Bs(this).transition().duration(s).call(x, d, c, r) : Bs(this).call(_.transform, d, c, r);
		}
	}
	function te(t, ...n) {
		if (e.apply(this, arguments)) {
			var r = t.touches, i = r.length, a = S(this, n, t.changedTouches.length === i).event(t), o, s, c, l;
			for (ld(t), s = 0; s < i; ++s) c = r[s], l = Hs(c, this), l = [
				l,
				this.__zoom.invert(l),
				c.identifier
			], a.touch0 ? !a.touch1 && a.touch0[2] !== l[2] && (a.touch1 = l, a.taps = 0) : (a.touch0 = l, o = !0, a.taps = 1 + !!u);
			u &&= clearTimeout(u), o && (a.taps < 2 && (d = l[0], u = setTimeout(function() {
				u = null;
			}, p)), ql(this), a.start());
		}
	}
	function ne(e, ...t) {
		if (this.__zooming) {
			var r = S(this, t).event(e), i = e.changedTouches, a = i.length, s, c, l, u;
			for (ud(e), s = 0; s < a; ++s) c = i[s], l = Hs(c, this), r.touch0 && r.touch0[2] === c.identifier ? r.touch0[0] = l : r.touch1 && r.touch1[2] === c.identifier && (r.touch1[0] = l);
			if (c = r.that.__zoom, r.touch1) {
				var d = r.touch0[0], f = r.touch0[1], p = r.touch1[0], m = r.touch1[1], h = (h = p[0] - d[0]) * h + (h = p[1] - d[1]) * h, g = (g = m[0] - f[0]) * g + (g = m[1] - f[1]) * g;
				c = v(c, Math.sqrt(h / g)), l = [(d[0] + p[0]) / 2, (d[1] + p[1]) / 2], u = [(f[0] + m[0]) / 2, (f[1] + m[1]) / 2];
			} else if (r.touch0) l = r.touch0[0], u = r.touch0[1];
			else return;
			r.zoom("touch", n(y(c, l, u), r.extent, o));
		}
	}
	function re(e, ...t) {
		if (this.__zooming) {
			var n = S(this, t).event(e), r = e.changedTouches, i = r.length, a, o;
			for (ld(e), f && clearTimeout(f), f = setTimeout(function() {
				f = null;
			}, p), a = 0; a < i; ++a) o = r[a], n.touch0 && n.touch0[2] === o.identifier ? delete n.touch0 : n.touch1 && n.touch1[2] === o.identifier && delete n.touch1;
			if (n.touch1 && !n.touch0 && (n.touch0 = n.touch1, delete n.touch1), n.touch0) n.touch0[1] = this.__zoom.invert(n.touch0[0]);
			else if (n.end(), n.taps === 2 && (o = Hs(o, this), Math.hypot(d[0] - o[0], d[1] - o[1]) < g)) {
				var s = Bs(this).on("dblclick.zoom");
				s && s.apply(this, arguments);
			}
		}
	}
	return _.wheelDelta = function(e) {
		return arguments.length ? (r = typeof e == "function" ? e : id(+e), _) : r;
	}, _.filter = function(t) {
		return arguments.length ? (e = typeof t == "function" ? t : id(!!t), _) : e;
	}, _.touchable = function(e) {
		return arguments.length ? (i = typeof e == "function" ? e : id(!!e), _) : i;
	}, _.extent = function(e) {
		return arguments.length ? (t = typeof e == "function" ? e : id([[+e[0][0], +e[0][1]], [+e[1][0], +e[1][1]]]), _) : t;
	}, _.scaleExtent = function(e) {
		return arguments.length ? (a[0] = +e[0], a[1] = +e[1], _) : [a[0], a[1]];
	}, _.translateExtent = function(e) {
		return arguments.length ? (o[0][0] = +e[0][0], o[1][0] = +e[1][0], o[0][1] = +e[0][1], o[1][1] = +e[1][1], _) : [[o[0][0], o[0][1]], [o[1][0], o[1][1]]];
	}, _.constrain = function(e) {
		return arguments.length ? (n = e, _) : n;
	}, _.duration = function(e) {
		return arguments.length ? (s = +e, _) : s;
	}, _.interpolate = function(e) {
		return arguments.length ? (c = e, _) : c;
	}, _.on = function() {
		var e = l.on.apply(l, arguments);
		return e === l ? _ : e;
	}, _.clickDistance = function(e) {
		return arguments.length ? (h = (e = +e) * e, _) : Math.sqrt(h);
	}, _.tapDistance = function(e) {
		return arguments.length ? (g = +e, _) : g;
	}, _;
}
//#endregion
//#region node_modules/@xyflow/system/dist/esm/index.js
var vd = {
	error001: (e = "react") => `Seems like you have not used ${e === "svelte" ? "SvelteFlowProvider" : "ReactFlowProvider"} as an ancestor. Help: https://${e}flow.dev/error#001`,
	error002: () => "It looks like you've created a new nodeTypes or edgeTypes object. If this wasn't on purpose please define the nodeTypes/edgeTypes outside of the component or memoize them.",
	error003: (e) => `Node type "${e}" not found. Using fallback type "default".`,
	error004: () => "The parent container needs a width and a height to render the graph.",
	error005: () => "Only child nodes can use a parent extent.",
	error006: () => "Can't create edge. An edge needs a source and a target.",
	error007: (e) => `The old edge with id=${e} does not exist.`,
	error009: (e) => `Marker type "${e}" doesn't exist.`,
	error008: (e, { id: t, sourceHandle: n, targetHandle: r }) => `Couldn't create edge for ${e} handle id: "${e === "source" ? n : r}", edge id: ${t}.`,
	error010: () => "Handle: No node id found. Make sure to only use a Handle inside a custom Node.",
	error011: (e) => `Edge type "${e}" not found. Using fallback type "default".`,
	error012: (e) => `Node with id "${e}" does not exist, it may have been removed. This can happen when a node is deleted before the "onNodeClick" handler is called.`,
	error013: (e = "react") => `It seems that you haven't loaded the styles. Please import '@xyflow/${e}/dist/style.css' or base.css to make sure everything is working properly.`,
	error014: () => "useNodeConnections: No node ID found. Call useNodeConnections inside a custom Node or provide a node ID.",
	error015: () => "It seems that you are trying to drag a node that is not initialized. Please use onNodesChange as explained in the docs.",
	error016: (e) => `Edge with id "${e}" does not exist, it may have been removed. This can happen when an edge is deleted before the "onEdgeClick" handler is called.`
}, yd = [[-Infinity, -Infinity], [Infinity, Infinity]], bd = [
	"Enter",
	" ",
	"Escape"
], xd = {
	"node.a11yDescription.default": "Press enter or space to select a node. Press delete to remove it and escape to cancel.",
	"node.a11yDescription.keyboardDisabled": "Press enter or space to select a node. You can then use the arrow keys to move the node around. Press delete to remove it and escape to cancel.",
	"node.a11yDescription.ariaLiveMessage": ({ direction: e, x: t, y: n }) => `Moved selected node ${e}. New position, x: ${t}, y: ${n}`,
	"edge.a11yDescription.default": "Press enter or space to select an edge. You can then press delete to remove it or escape to cancel.",
	"controls.ariaLabel": "Control Panel",
	"controls.zoomIn.ariaLabel": "Zoom In",
	"controls.zoomOut.ariaLabel": "Zoom Out",
	"controls.fitView.ariaLabel": "Fit View",
	"controls.interactive.ariaLabel": "Toggle Interactivity",
	"minimap.ariaLabel": "Mini Map",
	"handle.ariaLabel": "Handle"
}, Sd;
(function(e) {
	e.Strict = "strict", e.Loose = "loose";
})(Sd ||= {});
var Cd;
(function(e) {
	e.Free = "free", e.Vertical = "vertical", e.Horizontal = "horizontal";
})(Cd ||= {});
var wd;
(function(e) {
	e.Partial = "partial", e.Full = "full";
})(wd ||= {});
var Td = {
	inProgress: !1,
	isValid: null,
	from: null,
	fromHandle: null,
	fromPosition: null,
	fromNode: null,
	to: null,
	toHandle: null,
	toPosition: null,
	toNode: null,
	pointer: null
}, Ed;
(function(e) {
	e.Bezier = "default", e.Straight = "straight", e.Step = "step", e.SmoothStep = "smoothstep", e.SimpleBezier = "simplebezier";
})(Ed ||= {});
var Dd;
(function(e) {
	e.Arrow = "arrow", e.ArrowClosed = "arrowclosed";
})(Dd ||= {});
var Od;
(function(e) {
	e.Left = "left", e.Top = "top", e.Right = "right", e.Bottom = "bottom";
})(Od ||= {});
var kd = {
	[Od.Left]: Od.Right,
	[Od.Right]: Od.Left,
	[Od.Top]: Od.Bottom,
	[Od.Bottom]: Od.Top
}, Ad = (e) => !!e && typeof e == "object" && "id" in e && "source" in e && "target" in e, jd = (e) => !!e && typeof e == "object" && "id" in e && "position" in e && !("source" in e) && !("target" in e), Md = (e) => !!e && typeof e == "object" && "id" in e && "internals" in e && !("source" in e) && !("target" in e), Nd = (e, t = [0, 0]) => {
	let { width: n, height: r } = mf(e), i = e.origin ?? t, a = n * i[0], o = r * i[1];
	return {
		x: e.position.x - a,
		y: e.position.y - o
	};
}, Pd = (e, t = { nodeOrigin: [0, 0] }) => {
	if (e.length === 0) return {
		x: 0,
		y: 0,
		width: 0,
		height: 0
	};
	let n = !1, r = e.reduce((e, r) => {
		let i = typeof r == "string", a = !t.nodeLookup && !i ? r : void 0;
		return t.nodeLookup && (a = i ? t.nodeLookup.get(r) : Md(r) ? r : t.nodeLookup.get(r.id)), a ? (n = !0, qd(e, Zd(a, t.nodeOrigin))) : e;
	}, {
		x: Infinity,
		y: Infinity,
		x2: -Infinity,
		y2: -Infinity
	});
	return n ? Yd(r) : {
		x: 0,
		y: 0,
		width: 0,
		height: 0
	};
}, Fd = (e, t = {}) => {
	let n = {
		x: Infinity,
		y: Infinity,
		x2: -Infinity,
		y2: -Infinity
	}, r = !1;
	return e.forEach((e) => {
		(t.filter === void 0 || t.filter(e)) && (n = qd(n, Zd(e)), r = !0);
	}), r ? Yd(n) : {
		x: 0,
		y: 0,
		width: 0,
		height: 0
	};
}, Id = (e, t, [n, r, i] = [
	0,
	0,
	1
], a = !1, o = !1) => {
	let s = (t.x - n) / i, c = (t.y - r) / i, l = t.width / i, u = t.height / i, d = [];
	for (let t of e.values()) {
		let { measured: e, selectable: n = !0, hidden: r = !1 } = t;
		if (o && !n || r) continue;
		let i = e.width ?? t.width ?? t.initialWidth ?? 0, f = e.height ?? t.height ?? t.initialHeight ?? 0, { x: p, y: m } = t.internals.positionAbsolute, h = $d(s, c, l, u, p, m, i, f), g = i * f, _ = a && h > 0;
		(!t.internals.handleBounds || _ || h >= g || t.dragging) && d.push(t);
	}
	return d;
}, Ld = (e, t) => {
	let n = /* @__PURE__ */ new Set();
	return e.forEach((e) => {
		n.add(e.id);
	}), t.filter((e) => n.has(e.source) || n.has(e.target));
};
function Rd(e, t) {
	let n = /* @__PURE__ */ new Map(), r = t?.nodes ? new Set(t.nodes.map((e) => e.id)) : null;
	return e.forEach((e) => {
		let i;
		if (t?.includeHiddenNodes) {
			let { width: t, height: n } = mf(e);
			i = t > 0 && n > 0;
		} else i = !!(e.measured.width && e.measured.height && !e.hidden);
		i && (!r || r.has(e.id)) && n.set(e.id, e);
	}), n;
}
async function zd({ nodes: e, width: t, height: n, panZoom: r, minZoom: i, maxZoom: a }, o) {
	if (e.size === 0) return !0;
	let s = df(Fd(Rd(e, o)), t, n, o?.minZoom ?? i, o?.maxZoom ?? a, o?.padding ?? .1);
	return await r.setViewport(s, {
		duration: o?.duration,
		ease: o?.ease,
		interpolate: o?.interpolate
	}), !0;
}
function Bd({ nodeId: e, nextPosition: t, nodeLookup: n, nodeOrigin: r = [0, 0], nodeExtent: i, onError: a }) {
	let o = n.get(e), s = o.parentId ? n.get(o.parentId) : void 0, { x: c, y: l } = s ? s.internals.positionAbsolute : {
		x: 0,
		y: 0
	}, u = o.origin ?? r, d = o.extent || i;
	if (o.extent === "parent" && !o.expandParent) {
		if (!s) a?.("005", vd.error005());
		else {
			let { width: e, height: t } = mf(s);
			e && t && (d = [[c, l], [c + e, l + t]]);
		}
	} else s && pf(o.extent) && (d = [[o.extent[0][0] + c, o.extent[0][1] + l], [o.extent[1][0] + c, o.extent[1][1] + l]]);
	let f = pf(d) ? Ud(t, d, o.measured) : t;
	return (o.measured.width === void 0 || o.measured.height === void 0) && a?.("015", vd.error015()), {
		position: {
			x: f.x - c + (o.measured.width ?? 0) * u[0],
			y: f.y - l + (o.measured.height ?? 0) * u[1]
		},
		positionAbsolute: f
	};
}
async function Vd({ nodesToRemove: e = [], edgesToRemove: t = [], nodes: n, edges: r, onBeforeDelete: i }) {
	let a = new Set(e.map((e) => e.id)), o = [];
	for (let e of n) {
		if (e.deletable === !1) continue;
		let t = a.has(e.id), n = !t && e.parentId && o.find((t) => t.id === e.parentId);
		(t || n) && o.push(e);
	}
	let s = new Set(t.map((e) => e.id)), c = r.filter((e) => e.deletable !== !1), l = Ld(o, c);
	for (let e of c) s.has(e.id) && !l.find((t) => t.id === e.id) && l.push(e);
	if (!i) return {
		edges: l,
		nodes: o
	};
	let u = await i({
		nodes: o,
		edges: l
	});
	return typeof u == "boolean" ? u ? {
		edges: l,
		nodes: o
	} : {
		edges: [],
		nodes: []
	} : u;
}
var Hd = (e, t = 0, n = 1) => Math.min(Math.max(e, t), n), Ud = (e = {
	x: 0,
	y: 0
}, t, n) => ({
	x: Hd(e.x, t[0][0], t[1][0] - (n?.width ?? 0)),
	y: Hd(e.y, t[0][1], t[1][1] - (n?.height ?? 0))
});
function Wd(e, t, n) {
	let { width: r, height: i } = mf(n), { x: a, y: o } = n.internals.positionAbsolute;
	return Ud(e, [[a, o], [a + r, o + i]], t);
}
var Gd = (e, t, n) => e < t ? Hd(Math.abs(e - t), 1, t) / t : e > n ? -Hd(Math.abs(e - n), 1, t) / t : 0, Kd = (e, t, n = 15, r = 40) => [Gd(e.x, r, t.width - r) * n, Gd(e.y, r, t.height - r) * n], qd = (e, t) => ({
	x: Math.min(e.x, t.x),
	y: Math.min(e.y, t.y),
	x2: Math.max(e.x2, t.x2),
	y2: Math.max(e.y2, t.y2)
}), Jd = ({ x: e, y: t, width: n, height: r }) => ({
	x: e,
	y: t,
	x2: e + n,
	y2: t + r
}), Yd = ({ x: e, y: t, x2: n, y2: r }) => ({
	x: e,
	y: t,
	width: n - e,
	height: r - t
}), Xd = (e, t = [0, 0]) => {
	let { x: n, y: r } = Md(e) ? e.internals.positionAbsolute : Nd(e, t);
	return {
		x: n,
		y: r,
		width: e.measured?.width ?? e.width ?? e.initialWidth ?? 0,
		height: e.measured?.height ?? e.height ?? e.initialHeight ?? 0
	};
}, Zd = (e, t = [0, 0]) => {
	let { x: n, y: r } = Md(e) ? e.internals.positionAbsolute : Nd(e, t);
	return {
		x: n,
		y: r,
		x2: n + (e.measured?.width ?? e.width ?? e.initialWidth ?? 0),
		y2: r + (e.measured?.height ?? e.height ?? e.initialHeight ?? 0)
	};
}, Qd = (e, t) => Yd(qd(Jd(e), Jd(t))), $d = (e, t, n, r, i, a, o, s) => {
	let c = Math.max(0, Math.min(e + n, i + o) - Math.max(e, i)), l = Math.max(0, Math.min(t + r, a + s) - Math.max(t, a));
	return Math.ceil(c * l);
}, ef = (e, t) => $d(e.x, e.y, e.width, e.height, t.x, t.y, t.width, t.height), tf = (e) => nf(e.width) && nf(e.height) && nf(e.x) && nf(e.y), nf = (e) => !isNaN(e) && isFinite(e), rf = (e, t) => (e, t) => {}, af = (e, t = [1, 1]) => ({
	x: t[0] * Math.round(e.x / t[0]),
	y: t[1] * Math.round(e.y / t[1])
}), of = ({ x: e, y: t }, [n, r, i], a = !1, o = [1, 1]) => {
	let s = {
		x: (e - n) / i,
		y: (t - r) / i
	};
	return a ? af(s, o) : s;
}, sf = ({ x: e, y: t }, [n, r, i]) => ({
	x: e * i + n,
	y: t * i + r
});
function cf(e, t) {
	if (typeof e == "number") return Math.floor((t - t / (1 + e)) * .5);
	if (typeof e == "string" && e.endsWith("px")) {
		let t = parseFloat(e);
		if (!Number.isNaN(t)) return Math.floor(t);
	}
	if (typeof e == "string" && e.endsWith("%")) {
		let n = parseFloat(e);
		if (!Number.isNaN(n)) return Math.floor(t * n * .01);
	}
	return console.error(`The padding value "${e}" is invalid. Please provide a number or a string with a valid unit (px or %).`), 0;
}
function lf(e, t, n) {
	if (typeof e == "string" || typeof e == "number") {
		let r = cf(e, n), i = cf(e, t);
		return {
			top: r,
			right: i,
			bottom: r,
			left: i,
			x: i * 2,
			y: r * 2
		};
	}
	if (typeof e == "object") {
		let r = cf(e.top ?? e.y ?? 0, n), i = cf(e.bottom ?? e.y ?? 0, n), a = cf(e.left ?? e.x ?? 0, t), o = cf(e.right ?? e.x ?? 0, t);
		return {
			top: r,
			right: o,
			bottom: i,
			left: a,
			x: a + o,
			y: r + i
		};
	}
	return {
		top: 0,
		right: 0,
		bottom: 0,
		left: 0,
		x: 0,
		y: 0
	};
}
function uf(e, t, n, r, i, a) {
	let { x: o, y: s } = sf(e, [
		t,
		n,
		r
	]), { x: c, y: l } = sf({
		x: e.x + e.width,
		y: e.y + e.height
	}, [
		t,
		n,
		r
	]), u = i - c, d = a - l;
	return {
		left: Math.floor(o),
		top: Math.floor(s),
		right: Math.floor(u),
		bottom: Math.floor(d)
	};
}
var df = (e, t, n, r, i, a) => {
	let o = lf(a, t, n), s = (t - o.x) / e.width, c = (n - o.y) / e.height, l = Hd(Math.min(s, c), r, i), u = e.x + e.width / 2, d = e.y + e.height / 2, f = t / 2 - u * l, p = n / 2 - d * l, m = uf(e, f, p, l, t, n), h = {
		left: Math.min(m.left - o.left, 0),
		top: Math.min(m.top - o.top, 0),
		right: Math.min(m.right - o.right, 0),
		bottom: Math.min(m.bottom - o.bottom, 0)
	};
	return {
		x: f - h.left + h.right,
		y: p - h.top + h.bottom,
		zoom: l
	};
}, ff = () => typeof navigator < "u" && navigator?.userAgent?.indexOf("Mac") >= 0;
function pf(e) {
	return e != null && e !== "parent";
}
function mf(e) {
	return {
		width: e.measured?.width ?? e.width ?? e.initialWidth ?? 0,
		height: e.measured?.height ?? e.height ?? e.initialHeight ?? 0
	};
}
function hf(e) {
	return (e.measured?.width ?? e.width ?? e.initialWidth) !== void 0 && (e.measured?.height ?? e.height ?? e.initialHeight) !== void 0;
}
function gf(e, t = {
	width: 0,
	height: 0
}, n, r, i) {
	let a = { ...e }, o = r.get(n);
	if (o) {
		let e = o.origin || i;
		a.x += o.internals.positionAbsolute.x - (t.width ?? 0) * e[0], a.y += o.internals.positionAbsolute.y - (t.height ?? 0) * e[1];
	}
	return a;
}
function _f(e) {
	return {
		...xd,
		...e || {}
	};
}
function vf(e, t) {
	if (!e && !t) return !0;
	if (!e || !t || e.size !== t.size) return !1;
	if (!e.size && !t.size) return !0;
	for (let n of e.keys()) if (!t.has(n)) return !1;
	return !0;
}
function yf(e, t, n) {
	if (!n) return;
	let r = [];
	e.forEach((e, n) => {
		t?.has(n) || r.push(e);
	}), r.length && n(r);
}
function bf(e) {
	return e === null ? null : e ? "valid" : "invalid";
}
function xf(e, { snapGrid: t = [0, 0], snapToGrid: n = !1, transform: r, containerBounds: i }) {
	let { x: a, y: o } = Df(e), s = of({
		x: a - (i?.left ?? 0),
		y: o - (i?.top ?? 0)
	}, r), { x: c, y: l } = n ? af(s, t) : s;
	return {
		xSnapped: c,
		ySnapped: l,
		...s
	};
}
var Sf = (e) => ({
	width: e.offsetWidth,
	height: e.offsetHeight
}), Cf = (e) => e?.getRootNode?.() || window?.document, wf = [
	"INPUT",
	"SELECT",
	"TEXTAREA"
];
function Tf(e) {
	let t = e.composedPath?.()?.[0] || e.target;
	return t?.nodeType === 1 ? wf.includes(t.nodeName) || t.hasAttribute("contenteditable") || !!t.closest(".nokey") : !1;
}
var Ef = (e) => "clientX" in e, Df = (e, t) => {
	let n = Ef(e), r = n ? e.clientX : e.touches?.[0].clientX, i = n ? e.clientY : e.touches?.[0].clientY;
	return {
		x: r - (t?.left ?? 0),
		y: i - (t?.top ?? 0)
	};
}, Of = (e, t, n, r, i) => {
	let a = t.querySelectorAll(`.${e}`);
	return !a || !a.length ? null : Array.from(a).map((t) => {
		let a = t.getBoundingClientRect();
		return {
			id: t.getAttribute("data-handleid"),
			type: e,
			nodeId: i,
			position: t.getAttribute("data-handlepos"),
			x: (a.left - n.left) / r,
			y: (a.top - n.top) / r,
			...Sf(t)
		};
	});
};
function kf({ sourceX: e, sourceY: t, targetX: n, targetY: r, sourceControlX: i, sourceControlY: a, targetControlX: o, targetControlY: s }) {
	let c = e * .125 + i * .375 + o * .375 + n * .125, l = t * .125 + a * .375 + s * .375 + r * .125;
	return [
		c,
		l,
		Math.abs(c - e),
		Math.abs(l - t)
	];
}
function Af(e, t) {
	return e >= 0 ? .5 * e : t * 25 * Math.sqrt(-e);
}
function jf({ pos: e, x1: t, y1: n, x2: r, y2: i, c: a }) {
	switch (e) {
		case Od.Left: return [t - Af(t - r, a), n];
		case Od.Right: return [t + Af(r - t, a), n];
		case Od.Top: return [t, n - Af(n - i, a)];
		case Od.Bottom: return [t, n + Af(i - n, a)];
	}
}
function Mf({ sourceX: e, sourceY: t, sourcePosition: n = Od.Bottom, targetX: r, targetY: i, targetPosition: a = Od.Top, curvature: o = .25 }) {
	let [s, c] = jf({
		pos: n,
		x1: e,
		y1: t,
		x2: r,
		y2: i,
		c: o
	}), [l, u] = jf({
		pos: a,
		x1: r,
		y1: i,
		x2: e,
		y2: t,
		c: o
	}), [d, f, p, m] = kf({
		sourceX: e,
		sourceY: t,
		targetX: r,
		targetY: i,
		sourceControlX: s,
		sourceControlY: c,
		targetControlX: l,
		targetControlY: u
	});
	return [
		`M${e},${t} C${s},${c} ${l},${u} ${r},${i}`,
		d,
		f,
		p,
		m
	];
}
function Nf({ sourceX: e, sourceY: t, targetX: n, targetY: r }) {
	let i = Math.abs(n - e) / 2, a = n < e ? n + i : n - i, o = Math.abs(r - t) / 2;
	return [
		a,
		r < t ? r + o : r - o,
		i,
		o
	];
}
function Pf({ sourceNode: e, targetNode: t, selected: n = !1, zIndex: r = 0, elevateOnSelect: i = !1, zIndexMode: a = "basic" }) {
	return a === "manual" ? r : (i && n ? r + 1e3 : r) + Math.max(e.parentId || i && e.selected ? e.internals.z : 0, t.parentId || i && t.selected ? t.internals.z : 0);
}
function Ff({ sourceNode: e, targetNode: t, width: n, height: r, transform: i }) {
	let a = qd(Zd(e), Zd(t));
	return a.x === a.x2 && (a.x2 += 1), a.y === a.y2 && (a.y2 += 1), ef({
		x: -i[0] / i[2],
		y: -i[1] / i[2],
		width: n / i[2],
		height: r / i[2]
	}, Yd(a)) > 0;
}
var If = ({ source: e, sourceHandle: t, target: n, targetHandle: r }) => `xy-edge__${e}${t || ""}-${n}${r || ""}`, Lf = (e, t) => t.some((t) => t.source === e.source && t.target === e.target && (t.sourceHandle === e.sourceHandle || !t.sourceHandle && !e.sourceHandle) && (t.targetHandle === e.targetHandle || !t.targetHandle && !e.targetHandle)), Rf = (e, t, n = {}) => {
	if (!e.source || !e.target) return n.onError?.("006", vd.error006()), t;
	let r = n.getEdgeId || If, i;
	return i = Ad(e) ? { ...e } : {
		...e,
		id: r(e)
	}, Lf(i, t) ? t : (i.sourceHandle === null && delete i.sourceHandle, i.targetHandle === null && delete i.targetHandle, t.concat(i));
};
function zf({ sourceX: e, sourceY: t, targetX: n, targetY: r }) {
	let [i, a, o, s] = Nf({
		sourceX: e,
		sourceY: t,
		targetX: n,
		targetY: r
	});
	return [
		`M ${e},${t}L ${n},${r}`,
		i,
		a,
		o,
		s
	];
}
var Bf = {
	[Od.Left]: {
		x: -1,
		y: 0
	},
	[Od.Right]: {
		x: 1,
		y: 0
	},
	[Od.Top]: {
		x: 0,
		y: -1
	},
	[Od.Bottom]: {
		x: 0,
		y: 1
	}
}, Vf = ({ source: e, sourcePosition: t = Od.Bottom, target: n }) => t === Od.Left || t === Od.Right ? e.x < n.x ? {
	x: 1,
	y: 0
} : {
	x: -1,
	y: 0
} : e.y < n.y ? {
	x: 0,
	y: 1
} : {
	x: 0,
	y: -1
}, Hf = (e, t) => Math.sqrt((t.x - e.x) ** 2 + (t.y - e.y) ** 2);
function Uf({ source: e, sourcePosition: t = Od.Bottom, target: n, targetPosition: r = Od.Top, center: i, offset: a, stepPosition: o }) {
	let s = Bf[t], c = Bf[r], l = {
		x: e.x + s.x * a,
		y: e.y + s.y * a
	}, u = {
		x: n.x + c.x * a,
		y: n.y + c.y * a
	}, d = Vf({
		source: l,
		sourcePosition: t,
		target: u
	}), f = d.x === 0 ? "y" : "x", p = d[f], m = [], h, g, _ = {
		x: 0,
		y: 0
	}, v = {
		x: 0,
		y: 0
	}, [, , y, b] = Nf({
		sourceX: e.x,
		sourceY: e.y,
		targetX: n.x,
		targetY: n.y
	});
	if (s[f] * c[f] === -1) {
		f === "x" ? (h = i.x ?? l.x + (u.x - l.x) * o, g = i.y ?? (l.y + u.y) / 2) : (h = i.x ?? (l.x + u.x) / 2, g = i.y ?? l.y + (u.y - l.y) * o);
		let e = [{
			x: h,
			y: l.y
		}, {
			x: h,
			y: u.y
		}], t = [{
			x: l.x,
			y: g
		}, {
			x: u.x,
			y: g
		}];
		m = s[f] === p ? f === "x" ? e : t : f === "x" ? t : e;
	} else {
		let i = [{
			x: l.x,
			y: u.y
		}], o = [{
			x: u.x,
			y: l.y
		}];
		if (m = f === "x" ? s.x === p ? o : i : s.y === p ? i : o, t === r) {
			let t = Math.abs(e[f] - n[f]);
			if (t <= a) {
				let r = Math.min(a - 1, a - t);
				s[f] === p ? _[f] = (l[f] > e[f] ? -1 : 1) * r : v[f] = (u[f] > n[f] ? -1 : 1) * r;
			}
		}
		if (t !== r) {
			let e = f === "x" ? "y" : "x", t = s[f] === c[e], n = l[e] > u[e], r = l[e] < u[e];
			(s[f] === 1 && (!t && n || t && r) || s[f] !== 1 && (!t && r || t && n)) && (m = f === "x" ? i : o);
		}
		let d = {
			x: l.x + _.x,
			y: l.y + _.y
		}, y = {
			x: u.x + v.x,
			y: u.y + v.y
		};
		Math.max(Math.abs(d.x - m[0].x), Math.abs(y.x - m[0].x)) >= Math.max(Math.abs(d.y - m[0].y), Math.abs(y.y - m[0].y)) ? (h = (d.x + y.x) / 2, g = m[0].y) : (h = m[0].x, g = (d.y + y.y) / 2);
	}
	let x = {
		x: l.x + _.x,
		y: l.y + _.y
	}, S = {
		x: u.x + v.x,
		y: u.y + v.y
	};
	return [
		[
			e,
			...x.x !== m[0].x || x.y !== m[0].y ? [x] : [],
			...m,
			...S.x !== m[m.length - 1].x || S.y !== m[m.length - 1].y ? [S] : [],
			n
		],
		h,
		g,
		y,
		b
	];
}
function Wf(e, t, n, r) {
	let i = Math.min(Hf(e, t) / 2, Hf(t, n) / 2, r), { x: a, y: o } = t;
	if (e.x === a && a === n.x || e.y === o && o === n.y) return `L${a} ${o}`;
	if (e.y === o) {
		let t = e.x < n.x ? -1 : 1, r = e.y < n.y ? 1 : -1;
		return `L ${a + i * t},${o}Q ${a},${o} ${a},${o + i * r}`;
	}
	let s = e.x < n.x ? 1 : -1;
	return `L ${a},${o + i * (e.y < n.y ? -1 : 1)}Q ${a},${o} ${a + i * s},${o}`;
}
function Gf({ sourceX: e, sourceY: t, sourcePosition: n = Od.Bottom, targetX: r, targetY: i, targetPosition: a = Od.Top, borderRadius: o = 5, centerX: s, centerY: c, offset: l = 20, stepPosition: u = .5 }) {
	let [d, f, p, m, h] = Uf({
		source: {
			x: e,
			y: t
		},
		sourcePosition: n,
		target: {
			x: r,
			y: i
		},
		targetPosition: a,
		center: {
			x: s,
			y: c
		},
		offset: l,
		stepPosition: u
	}), g = `M${d[0].x} ${d[0].y}`;
	for (let e = 1; e < d.length - 1; e++) g += Wf(d[e - 1], d[e], d[e + 1], o);
	return g += `L${d[d.length - 1].x} ${d[d.length - 1].y}`, [
		g,
		f,
		p,
		m,
		h
	];
}
function Kf(e) {
	return e && !!(e.internals.handleBounds || e.handles?.length) && !!(e.measured.width || e.width || e.initialWidth);
}
function qf(e) {
	let { sourceNode: t, targetNode: n } = e;
	if (!Kf(t) || !Kf(n)) return null;
	let r = t.internals.handleBounds || Jf(t.handles), i = n.internals.handleBounds || Jf(n.handles), a = Xf(r?.source ?? [], e.sourceHandle), o = Xf(e.connectionMode === Sd.Strict ? i?.target ?? [] : (i?.target ?? []).concat(i?.source ?? []), e.targetHandle);
	if (!a || !o) return e.onError?.("008", vd.error008(a ? "target" : "source", {
		id: e.id,
		sourceHandle: e.sourceHandle,
		targetHandle: e.targetHandle
	})), null;
	let s = a?.position || Od.Bottom, c = o?.position || Od.Top, l = Yf(t, a, s), u = Yf(n, o, c);
	return {
		sourceX: l.x,
		sourceY: l.y,
		targetX: u.x,
		targetY: u.y,
		sourcePosition: s,
		targetPosition: c
	};
}
function Jf(e) {
	if (!e) return null;
	let t = [], n = [];
	for (let r of e) r.width = r.width ?? 1, r.height = r.height ?? 1, r.type === "source" ? t.push(r) : r.type === "target" && n.push(r);
	return {
		source: t,
		target: n
	};
}
function Yf(e, t, n = Od.Left, r = !1) {
	let i = (t?.x ?? 0) + e.internals.positionAbsolute.x, a = (t?.y ?? 0) + e.internals.positionAbsolute.y, { width: o, height: s } = t ?? mf(e);
	if (r) return {
		x: i + o / 2,
		y: a + s / 2
	};
	switch (t?.position ?? n) {
		case Od.Top: return {
			x: i + o / 2,
			y: a
		};
		case Od.Right: return {
			x: i + o,
			y: a + s / 2
		};
		case Od.Bottom: return {
			x: i + o / 2,
			y: a + s
		};
		case Od.Left: return {
			x: i,
			y: a + s / 2
		};
	}
}
function Xf(e, t) {
	return e && (t ? e.find((e) => e.id === t) : e[0]) || null;
}
function Zf(e, t) {
	return e ? typeof e == "string" ? e : `${t ? `${t}__` : ""}${Object.keys(e).sort().map((t) => `${t}=${e[t]}`).join("&")}` : "";
}
function Qf(e, { id: t, defaultColor: n, defaultMarkerStart: r, defaultMarkerEnd: i }) {
	let a = /* @__PURE__ */ new Set();
	return e.reduce((e, o) => ([o.markerStart || r, o.markerEnd || i].forEach((r) => {
		if (r && typeof r == "object") {
			let i = Zf(r, t);
			a.has(i) || (e.push({
				id: i,
				color: r.color || n,
				...r
			}), a.add(i));
		}
	}), e), []).sort((e, t) => e.id.localeCompare(t.id));
}
var $f = 1e3, ep = 10, tp = {
	nodeOrigin: [0, 0],
	nodeExtent: yd,
	elevateNodesOnSelect: !0,
	zIndexMode: "basic",
	defaults: {}
}, np = {
	...tp,
	checkEquality: !0
};
function rp(e, t) {
	let n = { ...e };
	for (let e in t) t[e] !== void 0 && (n[e] = t[e]);
	return n;
}
function ip(e, t, n) {
	let r = rp(tp, n);
	for (let n of e.values()) if (n.parentId) lp(n, e, t, r);
	else {
		let e = Ud(Nd(n, r.nodeOrigin), pf(n.extent) ? n.extent : r.nodeExtent, mf(n));
		n.internals.positionAbsolute = e;
	}
}
function ap(e, t) {
	if (!e.handles) return e.measured ? t?.internals.handleBounds : void 0;
	let n = [], r = [];
	for (let t of e.handles) {
		let i = {
			id: t.id,
			width: t.width ?? 1,
			height: t.height ?? 1,
			nodeId: e.id,
			x: t.x,
			y: t.y,
			position: t.position,
			type: t.type
		};
		t.type === "source" ? n.push(i) : t.type === "target" && r.push(i);
	}
	return {
		source: n,
		target: r
	};
}
function op(e) {
	return e === "manual";
}
function sp(e, t, n, r = {}) {
	let i = rp(np, r), a = { i: 0 }, o = new Map(t), s = i?.elevateNodesOnSelect && !op(i.zIndexMode) ? $f : 0, c = e.length > 0, l = !1;
	t.clear(), n.clear();
	for (let u of e) {
		let e = o.get(u.id);
		if (i.checkEquality && u === e?.internals.userNode) t.set(u.id, e);
		else {
			let n = Ud(Nd(u, i.nodeOrigin), pf(u.extent) ? u.extent : i.nodeExtent, mf(u));
			e = {
				...i.defaults,
				...u,
				measured: {
					width: u.measured?.width,
					height: u.measured?.height
				},
				internals: {
					positionAbsolute: n,
					handleBounds: ap(u, e),
					z: up(u, s, i.zIndexMode),
					userNode: u
				}
			}, t.set(u.id, e);
		}
		(e.measured === void 0 || e.measured.width === void 0 || e.measured.height === void 0) && !e.hidden && (c = !1), u.parentId && lp(e, t, n, r, a), l ||= u.selected ?? !1;
	}
	return {
		nodesInitialized: c,
		hasSelectedNodes: l
	};
}
function cp(e, t) {
	if (!e.parentId) return;
	let n = t.get(e.parentId);
	n ? n.set(e.id, e) : t.set(e.parentId, /* @__PURE__ */ new Map([[e.id, e]]));
}
function lp(e, t, n, r, i) {
	let { elevateNodesOnSelect: a, nodeOrigin: o, nodeExtent: s, zIndexMode: c } = rp(tp, r), l = e.parentId, u = t.get(l);
	if (!u) {
		console.warn(`Parent node ${l} not found. Please make sure that parent nodes are in front of their child nodes in the nodes array.`);
		return;
	}
	cp(e, n), i && !u.parentId && u.internals.rootParentIndex === void 0 && c === "auto" && (u.internals.rootParentIndex = ++i.i, u.internals.z = u.internals.z + i.i * ep), i && u.internals.rootParentIndex !== void 0 && (i.i = u.internals.rootParentIndex);
	let { x: d, y: f, z: p } = dp(e, u, o, s, a && !op(c) ? $f : 0, c), { positionAbsolute: m } = e.internals, h = d !== m.x || f !== m.y;
	(h || p !== e.internals.z) && t.set(e.id, {
		...e,
		internals: {
			...e.internals,
			positionAbsolute: h ? {
				x: d,
				y: f
			} : m,
			z: p
		}
	});
}
function up(e, t, n) {
	let r = nf(e.zIndex) ? e.zIndex : 0;
	return op(n) ? r : r + (e.selected ? t : 0);
}
function dp(e, t, n, r, i, a) {
	let { x: o, y: s } = t.internals.positionAbsolute, c = mf(e), l = Nd(e, n), u = pf(e.extent) ? Ud(l, e.extent, c) : l, d = Ud({
		x: o + u.x,
		y: s + u.y
	}, r, c);
	e.extent === "parent" && (d = Wd(d, c, t));
	let f = up(e, i, a), p = t.internals.z ?? 0;
	return {
		x: d.x,
		y: d.y,
		z: p >= f ? p + 1 : f
	};
}
function fp(e, t, n, r = [0, 0]) {
	let i = [], a = /* @__PURE__ */ new Map();
	for (let n of e) {
		let e = t.get(n.parentId);
		if (!e) continue;
		let r = Qd(a.get(n.parentId)?.expandedRect ?? Xd(e), n.rect);
		a.set(n.parentId, {
			expandedRect: r,
			parent: e
		});
	}
	return a.size > 0 && a.forEach(({ expandedRect: t, parent: a }, o) => {
		let s = a.internals.positionAbsolute, c = mf(a), l = a.origin ?? r, u = t.x < s.x ? Math.round(Math.abs(s.x - t.x)) : 0, d = t.y < s.y ? Math.round(Math.abs(s.y - t.y)) : 0, f = Math.max(c.width, Math.round(t.width)), p = Math.max(c.height, Math.round(t.height)), m = (f - c.width) * l[0], h = (p - c.height) * l[1];
		(u > 0 || d > 0 || m || h) && (i.push({
			id: o,
			type: "position",
			position: {
				x: a.position.x - u + m,
				y: a.position.y - d + h
			}
		}), n.get(o)?.forEach((t) => {
			e.some((e) => e.id === t.id) || i.push({
				id: t.id,
				type: "position",
				position: {
					x: t.position.x + u,
					y: t.position.y + d
				}
			});
		})), (c.width < t.width || c.height < t.height || u || d) && i.push({
			id: o,
			type: "dimensions",
			setAttributes: !0,
			dimensions: {
				width: f + (u ? l[0] * u - m : 0),
				height: p + (d ? l[1] * d - h : 0)
			}
		});
	}), i;
}
function pp(e, t, n, r, i, a, o) {
	let s = r?.querySelector(".xyflow__viewport"), c = !1;
	if (!s) return {
		changes: [],
		updatedInternals: c
	};
	let l = [], u = window.getComputedStyle(s), { m22: d } = new window.DOMMatrixReadOnly(u.transform), f = [];
	for (let r of e.values()) {
		let e = t.get(r.id);
		if (!e) continue;
		if (e.hidden) {
			t.set(e.id, {
				...e,
				internals: {
					...e.internals,
					handleBounds: void 0
				}
			}), c = !0;
			continue;
		}
		let s = Sf(r.nodeElement), u = e.measured.width !== s.width || e.measured.height !== s.height;
		if (s.width && s.height && (u || !e.internals.handleBounds || r.force)) {
			let p = r.nodeElement.getBoundingClientRect(), m = pf(e.extent) ? e.extent : a, { positionAbsolute: h } = e.internals;
			if (e.parentId && e.extent === "parent") {
				let n = t.get(e.parentId);
				n && (h = Wd(h, s, n));
			} else m && (h = Ud(h, m, s));
			let g = {
				...e,
				measured: s,
				internals: {
					...e.internals,
					positionAbsolute: h,
					handleBounds: {
						source: Of("source", r.nodeElement, p, d, e.id),
						target: Of("target", r.nodeElement, p, d, e.id)
					}
				}
			};
			t.set(e.id, g), e.parentId && lp(g, t, n, {
				nodeOrigin: i,
				zIndexMode: o
			}), c = !0, u && (l.push({
				id: e.id,
				type: "dimensions",
				dimensions: s
			}), e.expandParent && e.parentId && f.push({
				id: e.id,
				parentId: e.parentId,
				rect: Xd(g, i)
			}));
		}
	}
	if (f.length > 0) {
		let e = fp(f, t, n, i);
		l.push(...e);
	}
	return {
		changes: l,
		updatedInternals: c
	};
}
async function mp({ delta: e, panZoom: t, transform: n, translateExtent: r, width: i, height: a }) {
	if (!t || !e.x && !e.y) return !1;
	let o = await t.setViewportConstrained({
		x: n[0] + e.x,
		y: n[1] + e.y,
		zoom: n[2]
	}, [[0, 0], [i, a]], r);
	return !!o && (o.x !== n[0] || o.y !== n[1] || o.k !== n[2]);
}
function hp(e, t, n, r, i, a) {
	let o = i, s = r.get(o) || /* @__PURE__ */ new Map();
	r.set(o, s.set(n, t)), o = `${i}-${e}`;
	let c = r.get(o) || /* @__PURE__ */ new Map();
	if (r.set(o, c.set(n, t)), a) {
		o = `${i}-${e}-${a}`;
		let s = r.get(o) || /* @__PURE__ */ new Map();
		r.set(o, s.set(n, t));
	}
}
function gp(e, t, n) {
	e.clear(), t.clear();
	for (let r of n) {
		let { source: n, target: i, sourceHandle: a = null, targetHandle: o = null } = r, s = {
			edgeId: r.id,
			source: n,
			target: i,
			sourceHandle: a,
			targetHandle: o
		}, c = `${n}-${a}--${i}-${o}`;
		hp("source", s, `${i}-${o}--${n}-${a}`, e, n, a), hp("target", s, c, e, i, o), t.set(r.id, r);
	}
}
function _p(e, t) {
	if (!e.parentId) return !1;
	let n = t.get(e.parentId);
	return n ? n.selected ? !0 : _p(n, t) : !1;
}
function vp(e, t, n) {
	let r = e;
	do {
		if (r?.matches?.(t)) return !0;
		if (r === n) return !1;
		r = r?.parentElement;
	} while (r);
	return !1;
}
function yp(e, t, n, r) {
	let i = /* @__PURE__ */ new Map();
	for (let [a, o] of e) if ((o.selected || o.id === r) && (!o.parentId || !_p(o, e)) && (o.draggable || t && o.draggable === void 0)) {
		let t = e.get(a);
		t && i.set(a, {
			id: a,
			position: t.position || {
				x: 0,
				y: 0
			},
			distance: {
				x: n.x - t.internals.positionAbsolute.x,
				y: n.y - t.internals.positionAbsolute.y
			},
			extent: t.extent,
			parentId: t.parentId,
			origin: t.origin,
			expandParent: t.expandParent,
			internals: { positionAbsolute: t.internals.positionAbsolute || {
				x: 0,
				y: 0
			} },
			measured: {
				width: t.measured.width ?? 0,
				height: t.measured.height ?? 0
			}
		});
	}
	return i;
}
function bp({ nodeId: e, dragItems: t, nodeLookup: n, dragging: r = !0 }) {
	let i = [];
	for (let [e, a] of t) {
		let t = n.get(e)?.internals.userNode;
		t && i.push({
			...t,
			position: a.position,
			dragging: r
		});
	}
	if (!e) return [i[0], i];
	let a = n.get(e)?.internals.userNode;
	return [a ? {
		...a,
		position: t.get(e)?.position || a.position,
		dragging: r
	} : i[0], i];
}
function xp({ dragItems: e, snapGrid: t, x: n, y: r }) {
	let i = e.values().next().value;
	if (!i) return null;
	let a = {
		x: n - i.distance.x,
		y: r - i.distance.y
	}, o = af(a, t);
	return {
		x: o.x - a.x,
		y: o.y - a.y
	};
}
function Sp({ onNodeMouseDown: e, getStoreItems: t, onDragStart: n, onDrag: r, onDragStop: i }) {
	let a = {
		x: null,
		y: null
	}, o = 0, s = /* @__PURE__ */ new Map(), c = !1, l = {
		x: 0,
		y: 0
	}, u = null, d = !1, f = null, p = !1, m = !1, h = null;
	function g({ noDragClassName: g, handleSelector: _, domNode: v, isSelectable: y, nodeId: b, nodeClickDistance: x = 0 }) {
		f = Bs(v);
		function S({ x: e, y: n }) {
			let { nodeLookup: i, nodeExtent: o, snapGrid: c, snapToGrid: l, nodeOrigin: u, onNodeDrag: d, onSelectionDrag: f, onError: p, updateNodePositions: g } = t();
			a = {
				x: e,
				y: n
			};
			let _ = !1, v = s.size > 1, y = v && o ? Jd(Fd(s)) : null, x = v && l ? xp({
				dragItems: s,
				snapGrid: c,
				x: e,
				y: n
			}) : null;
			for (let [t, r] of s) {
				if (!i.has(t)) continue;
				let a = {
					x: e - r.distance.x,
					y: n - r.distance.y
				};
				l && (a = x ? {
					x: Math.round(a.x + x.x),
					y: Math.round(a.y + x.y)
				} : af(a, c));
				let s = null;
				if (v && o && !r.extent && y) {
					let { positionAbsolute: e } = r.internals, t = e.x - y.x + o[0][0], n = e.x + r.measured.width - y.x2 + o[1][0], i = e.y - y.y + o[0][1], a = e.y + r.measured.height - y.y2 + o[1][1];
					s = [[t, i], [n, a]];
				}
				let { position: d, positionAbsolute: f } = Bd({
					nodeId: t,
					nextPosition: a,
					nodeLookup: i,
					nodeExtent: s || o,
					nodeOrigin: u,
					onError: p
				});
				_ = _ || r.position.x !== d.x || r.position.y !== d.y, r.position = d, r.internals.positionAbsolute = f;
			}
			if (m ||= _, _ && (g(s, !0), h && (r || d || !b && f))) {
				let [e, t] = bp({
					nodeId: b,
					dragItems: s,
					nodeLookup: i
				});
				r?.(h, s, e, t), d?.(h, e, t), b || f?.(h, t);
			}
		}
		async function C() {
			if (!u) return;
			let { transform: e, panBy: n, autoPanSpeed: r, autoPanOnNodeDrag: i } = t();
			if (!i) {
				c = !1, cancelAnimationFrame(o);
				return;
			}
			let [s, d] = Kd(l, u, r);
			(s !== 0 || d !== 0) && (a.x = (a.x ?? 0) - s / e[2], a.y = (a.y ?? 0) - d / e[2], await n({
				x: s,
				y: d
			}) && S(a)), o = requestAnimationFrame(C);
		}
		function w(r) {
			let { nodeLookup: i, multiSelectionActive: o, nodesDraggable: c, transform: l, snapGrid: f, snapToGrid: p, selectNodesOnDrag: m, onNodeDragStart: h, onSelectionDragStart: g, unselectNodesAndEdges: _ } = t();
			d = !0, (!m || !y) && !o && b && (i.get(b)?.selected || _()), y && m && b && e?.(b);
			let v = xf(r.sourceEvent, {
				transform: l,
				snapGrid: f,
				snapToGrid: p,
				containerBounds: u
			});
			if (a = v, s = yp(i, c, v, b), s.size > 0 && (n || h || !b && g)) {
				let [e, t] = bp({
					nodeId: b,
					dragItems: s,
					nodeLookup: i
				});
				n?.(r.sourceEvent, s, e, t), h?.(r.sourceEvent, e, t), b || g?.(r.sourceEvent, t);
			}
		}
		let T = tc().clickDistance(x).on("start", (e) => {
			let { domNode: n, nodeDragThreshold: r, transform: i, snapGrid: o, snapToGrid: s } = t();
			u = n?.getBoundingClientRect() || null, p = !1, m = !1, h = e.sourceEvent, r === 0 && w(e), a = xf(e.sourceEvent, {
				transform: i,
				snapGrid: o,
				snapToGrid: s,
				containerBounds: u
			}), l = Df(e.sourceEvent, u);
		}).on("drag", (e) => {
			let { autoPanOnNodeDrag: n, transform: r, snapGrid: i, snapToGrid: o, nodeDragThreshold: f, nodeLookup: m } = t(), g = xf(e.sourceEvent, {
				transform: r,
				snapGrid: i,
				snapToGrid: o,
				containerBounds: u
			});
			if (h = e.sourceEvent, (e.sourceEvent.type === "touchmove" && e.sourceEvent.touches.length > 1 || b && !m.has(b)) && (p = !0), !p) {
				if (!c && n && d && (c = !0, C()), !d) {
					let t = Df(e.sourceEvent, u), n = t.x - l.x, r = t.y - l.y;
					Math.sqrt(n * n + r * r) > f && w(e);
				}
				(a.x !== g.xSnapped || a.y !== g.ySnapped) && s && d && (l = Df(e.sourceEvent, u), S(g));
			}
		}).on("end", (e) => {
			if (!d || p) {
				p && s.size > 0 && t().updateNodePositions(s, !1);
				return;
			}
			if (c = !1, d = !1, cancelAnimationFrame(o), s.size > 0) {
				let { nodeLookup: n, updateNodePositions: r, onNodeDragStop: a, onSelectionDragStop: o } = t();
				if (m &&= (r(s, !1), !1), i || a || !b && o) {
					let [t, r] = bp({
						nodeId: b,
						dragItems: s,
						nodeLookup: n,
						dragging: !1
					});
					i?.(e.sourceEvent, s, t, r), a?.(e.sourceEvent, t, r), b || o?.(e.sourceEvent, r);
				}
			}
		}).filter((e) => {
			let t = e.target;
			return !e.button && (!g || !vp(t, `.${g}`, v)) && (!_ || vp(t, _, v));
		});
		f.call(T);
	}
	function _() {
		f?.on(".drag", null);
	}
	return {
		update: g,
		destroy: _
	};
}
function Cp(e, t, n) {
	let r = [], i = {
		x: e.x - n,
		y: e.y - n,
		width: n * 2,
		height: n * 2
	};
	for (let e of t.values()) ef(i, Xd(e)) > 0 && r.push(e);
	return r;
}
var wp = 250;
function Tp(e, t, n, r) {
	let i = [], a = Infinity, o = Cp(e, n, t + wp);
	for (let n of o) {
		let o = [...n.internals.handleBounds?.source ?? [], ...n.internals.handleBounds?.target ?? []];
		for (let s of o) {
			if (r.nodeId === s.nodeId && r.type === s.type && r.id === s.id) continue;
			let { x: o, y: c } = Yf(n, s, s.position, !0), l = Math.sqrt((o - e.x) ** 2 + (c - e.y) ** 2);
			l > t || (l < a ? (i = [{
				...s,
				x: o,
				y: c
			}], a = l) : l === a && i.push({
				...s,
				x: o,
				y: c
			}));
		}
	}
	if (!i.length) return null;
	if (i.length > 1) {
		let e = r.type === "source" ? "target" : "source";
		return i.find((t) => t.type === e) ?? i[0];
	}
	return i[0];
}
function Ep(e, t, n, r, i, a = !1) {
	let o = r.get(e);
	if (!o) return null;
	let s = i === "strict" ? o.internals.handleBounds?.[t] : [...o.internals.handleBounds?.source ?? [], ...o.internals.handleBounds?.target ?? []], c = (n ? s?.find((e) => e.id === n) : s?.[0]) ?? null;
	return c && a ? {
		...c,
		...Yf(o, c, c.position, !0)
	} : c;
}
function Dp(e, t) {
	return e || (t?.classList.contains("target") ? "target" : t?.classList.contains("source") ? "source" : null);
}
function Op(e, t) {
	let n = null;
	return t ? n = !0 : e && !t && (n = !1), n;
}
var kp = () => !0;
function Ap(e, { connectionMode: t, connectionRadius: n, handleId: r, nodeId: i, edgeUpdaterType: a, isTarget: o, domNode: s, nodeLookup: c, lib: l, autoPanOnConnect: u, flowId: d, panBy: f, cancelConnection: p, onConnectStart: m, onConnect: h, onConnectEnd: g, isValidConnection: _ = kp, onReconnectEnd: v, updateConnection: y, getTransform: b, getFromHandle: x, autoPanSpeed: S, dragThreshold: C = 1, handleDomNode: w }) {
	let T = Cf(e.target), ee = 0, te, { x: ne, y: re } = Df(e), ie = Dp(a, w), ae = s?.getBoundingClientRect(), oe = !1;
	if (!ae || !ie) return;
	let se = Ep(i, ie, r, c, t);
	if (!se) return;
	let ce = Df(e, ae), le = !1, ue = null, de = !1, fe = null;
	function pe() {
		if (!u || !ae) return;
		let [e, t] = Kd(ce, ae, S);
		f({
			x: e,
			y: t
		}), ee = requestAnimationFrame(pe);
	}
	let me = {
		...se,
		nodeId: i,
		type: ie,
		position: se.position
	}, he = c.get(i), ge = {
		inProgress: !0,
		isValid: null,
		from: Yf(he, me, Od.Left, !0),
		fromHandle: me,
		fromPosition: me.position,
		fromNode: he,
		to: ce,
		toHandle: null,
		toPosition: kd[me.position],
		toNode: null,
		pointer: ce
	};
	function _e() {
		oe = !0, y(ge), m?.(e, {
			nodeId: i,
			handleId: r,
			handleType: ie
		});
	}
	C === 0 && _e();
	function ve(e) {
		if (!oe) {
			let { x: t, y: n } = Df(e), r = t - ne, i = n - re;
			if (!(r * r + i * i > C * C)) return;
			_e();
		}
		if (!x() || !me) {
			ye(e);
			return;
		}
		let a = b();
		ce = Df(e, ae), te = Tp(of(ce, a, !1, [1, 1]), n, c, me), le ||= (pe(), !0);
		let s = jp(e, {
			handle: te,
			connectionMode: t,
			fromNodeId: i,
			fromHandleId: r,
			fromType: o ? "target" : "source",
			isValidConnection: _,
			doc: T,
			lib: l,
			flowId: d,
			nodeLookup: c
		});
		fe = s.handleDomNode, ue = s.connection, de = Op(!!te, s.isValid);
		let u = c.get(i), f = u ? Yf(u, me, Od.Left, !0) : ge.from, p = {
			...ge,
			from: f,
			isValid: de,
			to: s.toHandle && de ? sf({
				x: s.toHandle.x,
				y: s.toHandle.y
			}, a) : ce,
			toHandle: s.toHandle,
			toPosition: de && s.toHandle ? s.toHandle.position : kd[me.position],
			toNode: s.toHandle ? c.get(s.toHandle.nodeId) : null,
			pointer: ce
		};
		y(p), ge = p;
	}
	function ye(e) {
		if (!("touches" in e && e.touches.length > 0)) {
			if (oe) {
				(te || fe) && ue && de && h?.(ue);
				let { inProgress: t, ...n } = ge, r = {
					...n,
					toPosition: ge.toHandle ? ge.toPosition : null
				};
				g?.(e, r), a && v?.(e, r);
			}
			p(), cancelAnimationFrame(ee), le = !1, de = !1, ue = null, fe = null, T.removeEventListener("mousemove", ve), T.removeEventListener("mouseup", ye), T.removeEventListener("touchmove", ve), T.removeEventListener("touchend", ye);
		}
	}
	T.addEventListener("mousemove", ve), T.addEventListener("mouseup", ye), T.addEventListener("touchmove", ve), T.addEventListener("touchend", ye);
}
function jp(e, { handle: t, connectionMode: n, fromNodeId: r, fromHandleId: i, fromType: a, doc: o, lib: s, flowId: c, isValidConnection: l = kp, nodeLookup: u }) {
	let d = a === "target", f = t ? o.querySelector(`.${s}-flow__handle[data-id="${c}-${t?.nodeId}-${t?.id}-${t?.type}"]`) : null, { x: p, y: m } = Df(e), h = o.elementFromPoint(p, m), g = h?.classList.contains(`${s}-flow__handle`) ? h : f, _ = {
		handleDomNode: g,
		isValid: !1,
		connection: null,
		toHandle: null
	};
	if (g) {
		let e = Dp(void 0, g), t = g.getAttribute("data-nodeid"), a = g.getAttribute("data-handleid"), o = g.classList.contains("connectable"), s = g.classList.contains("connectableend");
		if (!t || !e) return _;
		let c = {
			source: d ? t : r,
			sourceHandle: d ? a : i,
			target: d ? r : t,
			targetHandle: d ? i : a
		};
		_.connection = c, _.isValid = o && s && (n === Sd.Strict ? d && e === "source" || !d && e === "target" : t !== r || a !== i) && l(c), _.toHandle = Ep(t, e, a, u, n, !0);
	}
	return _;
}
var Mp = {
	onPointerDown: Ap,
	isValid: jp
};
function Np({ domNode: e, panZoom: t, getTransform: n, getViewScale: r }) {
	let i = Bs(e);
	function a({ translateExtent: e, width: a, height: o, zoomStep: s = 1, pannable: c = !0, zoomable: l = !0, inversePan: u = !1 }) {
		let d = (e) => {
			if (e.sourceEvent.type !== "wheel" || !t) return;
			let r = n(), i = e.sourceEvent.ctrlKey && ff() ? 10 : 1, a = -e.sourceEvent.deltaY * (e.sourceEvent.deltaMode === 1 ? .05 : e.sourceEvent.deltaMode ? 1 : .002) * s, o = r[2] * 2 ** (a * i);
			t.scaleTo(o);
		}, f = [0, 0], p = _d().on("start", (e) => {
			(e.sourceEvent.type === "mousedown" || e.sourceEvent.type === "touchstart") && (f = [e.sourceEvent.clientX ?? e.sourceEvent.touches[0].clientX, e.sourceEvent.clientY ?? e.sourceEvent.touches[0].clientY]);
		}).on("zoom", c ? (i) => {
			let s = n();
			if (i.sourceEvent.type !== "mousemove" && i.sourceEvent.type !== "touchmove" || !t) return;
			let c = [i.sourceEvent.clientX ?? i.sourceEvent.touches[0].clientX, i.sourceEvent.clientY ?? i.sourceEvent.touches[0].clientY], l = [c[0] - f[0], c[1] - f[1]];
			f = c;
			let d = r() * Math.max(s[2], Math.log(s[2])) * (u ? -1 : 1), p = {
				x: s[0] - l[0] * d,
				y: s[1] - l[1] * d
			}, m = [[0, 0], [a, o]];
			t.setViewportConstrained({
				x: p.x,
				y: p.y,
				zoom: s[2]
			}, m, e);
		} : null).on("zoom.wheel", l ? d : null);
		i.call(p, {});
	}
	function o() {
		i.on("zoom", null);
	}
	return {
		update: a,
		destroy: o,
		pointer: Hs
	};
}
var Pp = (e) => ({
	x: e.x,
	y: e.y,
	zoom: e.k
}), Fp = ({ x: e, y: t, zoom: n }) => sd.translate(e, t).scale(n), Ip = (e, t) => e.target.closest(`.${t}`), Lp = (e, t) => t === 2 && Array.isArray(e) && e.includes(2), Rp = (e) => ((e *= 2) <= 1 ? e * e * e : (e -= 2) * e * e + 2) / 2, zp = (e, t = 0, n = Rp, r = () => {}) => {
	let i = typeof t == "number" && t > 0;
	return i || r(), i ? e.transition().duration(t).ease(n).on("end", r) : e;
}, Bp = (e) => {
	let t = e.ctrlKey && ff() ? 10 : 1;
	return -e.deltaY * (e.deltaMode === 1 ? .05 : e.deltaMode ? 1 : .002) * t;
};
function Vp({ zoomPanValues: e, noWheelClassName: t, d3Selection: n, d3Zoom: r, panOnScrollMode: i, panOnScrollSpeed: a, zoomOnPinch: o, onPanZoomStart: s, onPanZoom: c, onPanZoomEnd: l }) {
	return (u) => {
		if (Ip(u, t)) return u.ctrlKey && u.preventDefault(), !1;
		u.preventDefault(), u.stopImmediatePropagation();
		let d = n.property("__zoom").k || 1;
		if (u.ctrlKey && o) {
			let e = Hs(u), t = d * 2 ** Bp(u);
			r.scaleTo(n, t, e, u);
			return;
		}
		let f = u.deltaMode === 1 ? 20 : 1, p = i === Cd.Vertical ? 0 : u.deltaX * f, m = i === Cd.Horizontal ? 0 : u.deltaY * f;
		!ff() && u.shiftKey && i !== Cd.Vertical && (p = u.deltaY * f, m = 0), r.translateBy(n, -(p / d) * a, -(m / d) * a, { internal: !0 });
		let h = Pp(n.property("__zoom"));
		clearTimeout(e.panScrollTimeout), e.isPanScrolling ? c?.(u, h) : (e.isPanScrolling = !0, s?.(u, h)), e.panScrollTimeout = setTimeout(() => {
			l?.(u, h), e.isPanScrolling = !1;
		}, 150);
	};
}
function Hp({ noWheelClassName: e, preventScrolling: t, d3ZoomHandler: n }) {
	return function(r, i) {
		let a = r.type === "wheel", o = !t && a && !r.ctrlKey, s = Ip(r, e);
		if (r.ctrlKey && a && s && r.preventDefault(), o || s) return null;
		r.preventDefault(), n.call(this, r, i);
	};
}
function Up({ zoomPanValues: e, onDraggingChange: t, onPanZoomStart: n }) {
	return (r) => {
		if (r.sourceEvent?.internal) return;
		let i = Pp(r.transform);
		e.mouseButton = r.sourceEvent?.button || 0, e.isZoomingOrPanning = !0, e.prevViewport = i, r.sourceEvent?.type === "mousedown" && t(!0), n && n?.(r.sourceEvent, i);
	};
}
function Wp({ zoomPanValues: e, panOnDrag: t, onPaneContextMenu: n, onTransformChange: r, onPanZoom: i }) {
	return (a) => {
		e.usedRightMouseButton = !!(n && Lp(t, e.mouseButton ?? 0)), a.sourceEvent?.sync || r([
			a.transform.x,
			a.transform.y,
			a.transform.k
		]), i && !a.sourceEvent?.internal && i?.(a.sourceEvent, Pp(a.transform));
	};
}
function Gp({ zoomPanValues: e, panOnDrag: t, panOnScroll: n, onDraggingChange: r, onPanZoomEnd: i, onPaneContextMenu: a }) {
	return (o) => {
		if (!o.sourceEvent?.internal && (e.isZoomingOrPanning = !1, a && Lp(t, e.mouseButton ?? 0) && !e.usedRightMouseButton && o.sourceEvent && a(o.sourceEvent), e.usedRightMouseButton = !1, r(!1), i)) {
			let t = Pp(o.transform);
			e.prevViewport = t, clearTimeout(e.timerId), e.timerId = setTimeout(() => {
				i?.(o.sourceEvent, t);
			}, n ? 150 : 0);
		}
	};
}
function Kp({ panActivationKeyPressed: e, zoomActivationKeyPressed: t, zoomOnScroll: n, zoomOnPinch: r, panOnDrag: i, panOnScroll: a, zoomOnDoubleClick: o, userSelectionActive: s, noWheelClassName: c, noPanClassName: l, lib: u, connectionInProgress: d }) {
	return (f) => {
		let p = t || n, m = r && f.ctrlKey, h = f.type === "wheel";
		if (f.button === 1 && f.type === "mousedown" && (Ip(f, `${u}-flow__node`) || Ip(f, `${u}-flow__edge`) || Ip(f, `${u}-flow__selection`) || Ip(f, `${u}-flow__nodesselection`))) return !0;
		if (!i && !p && !a && !o && !r || s || d && !h || Ip(f, c) && h || Ip(f, l) && (!h || a && h && !t) || !r && f.ctrlKey && h) return !1;
		if (!r && f.type === "touchstart" && f.touches?.length > 1) return f.preventDefault(), !1;
		if (!p && !a && !m && h || !i && (f.type === "mousedown" || f.type === "touchstart") || Array.isArray(i) && !i.includes(f.button) && f.type === "mousedown") return !1;
		let g = Array.isArray(i) && i.includes(f.button) || !f.button || f.button <= 1;
		return (!f.ctrlKey || h || e) && g;
	};
}
function qp({ domNode: e, minZoom: t, maxZoom: n, translateExtent: r, viewport: i, onPanZoom: a, onPanZoomStart: o, onPanZoomEnd: s, onDraggingChange: c }) {
	let l = {
		isZoomingOrPanning: !1,
		usedRightMouseButton: !1,
		prevViewport: {},
		mouseButton: 0,
		timerId: void 0,
		panScrollTimeout: void 0,
		isPanScrolling: !1
	}, u = e.getBoundingClientRect(), d = [[0, 0], [u.width, u.height]];
	(typeof ResizeObserver < "u" ? new ResizeObserver((e) => {
		let t = e[0];
		t && (d = [[0, 0], [t.contentRect.width, t.contentRect.height]]);
	}) : null)?.observe(e);
	let f = _d().extent(() => d).scaleExtent([t, n]).translateExtent(r), p = Bs(e).call(f);
	y({
		x: i.x,
		y: i.y,
		zoom: Hd(i.zoom, t, n)
	}, [[0, 0], [u.width, u.height]], r);
	let m = p.on("wheel.zoom"), h = p.on("dblclick.zoom");
	f.wheelDelta(Bp);
	async function g(e, t) {
		return p ? new Promise((n) => {
			f?.interpolate(t?.interpolate === "linear" ? il : vl).transform(zp(p, t?.duration, t?.ease, () => n(!0)), e);
		}) : !1;
	}
	function _({ noWheelClassName: e, noPanClassName: t, onPaneContextMenu: n, userSelectionActive: r, panOnScroll: i, panOnDrag: u, panOnScrollMode: d, panOnScrollSpeed: g, preventScrolling: _, zoomOnPinch: y, zoomOnScroll: b, zoomOnDoubleClick: x, panActivationKeyPressed: S = !1, zoomActivationKeyPressed: C, lib: w, onTransformChange: T, connectionInProgress: ee, paneClickDistance: te, selectionOnDrag: ne }) {
		r && !l.isZoomingOrPanning && v();
		let re = i && !C && !r;
		f.clickDistance(ne ? Infinity : !nf(te) || te < 0 ? 0 : te);
		let ie = re ? Vp({
			zoomPanValues: l,
			noWheelClassName: e,
			d3Selection: p,
			d3Zoom: f,
			panOnScrollMode: d,
			panOnScrollSpeed: g,
			zoomOnPinch: y,
			onPanZoomStart: o,
			onPanZoom: a,
			onPanZoomEnd: s
		}) : Hp({
			noWheelClassName: e,
			preventScrolling: _,
			d3ZoomHandler: m
		});
		p.on("wheel.zoom", ie, { passive: !1 });
		let ae = Up({
			zoomPanValues: l,
			onDraggingChange: c,
			onPanZoomStart: o
		});
		f.on("start", ae);
		let oe = Wp({
			zoomPanValues: l,
			panOnDrag: u,
			onPaneContextMenu: !!n,
			onPanZoom: a,
			onTransformChange: T
		});
		f.on("zoom", oe);
		let se = Gp({
			zoomPanValues: l,
			panOnDrag: u,
			panOnScroll: i,
			onPaneContextMenu: n,
			onPanZoomEnd: s,
			onDraggingChange: c
		});
		f.on("end", se);
		let ce = Kp({
			panActivationKeyPressed: S,
			zoomActivationKeyPressed: C,
			panOnDrag: u,
			zoomOnScroll: b,
			panOnScroll: i,
			zoomOnDoubleClick: x,
			zoomOnPinch: y,
			userSelectionActive: r,
			noPanClassName: t,
			noWheelClassName: e,
			lib: w,
			connectionInProgress: ee
		});
		f.filter(ce), x ? p.on("dblclick.zoom", h) : p.on("dblclick.zoom", null);
	}
	function v() {
		f.on("zoom", null);
	}
	async function y(e, t, n) {
		let r = Fp(e), i = f?.constrain()(r, t, n);
		return i && await g(i), i;
	}
	async function b(e, t) {
		let n = Fp(e);
		return await g(n, t), n;
	}
	function x(e) {
		if (p) {
			let t = Fp(e), n = p.property("__zoom");
			(n.k !== e.zoom || n.x !== e.x || n.y !== e.y) && f?.transform(p, t, null, { sync: !0 });
		}
	}
	function S() {
		let e = p ? cd(p.node()) : {
			x: 0,
			y: 0,
			k: 1
		};
		return {
			x: e.x,
			y: e.y,
			zoom: e.k
		};
	}
	async function C(e, t) {
		return p ? new Promise((n) => {
			f?.interpolate(t?.interpolate === "linear" ? il : vl).scaleTo(zp(p, t?.duration, t?.ease, () => n(!0)), e);
		}) : !1;
	}
	async function w(e, t) {
		return p ? new Promise((n) => {
			f?.interpolate(t?.interpolate === "linear" ? il : vl).scaleBy(zp(p, t?.duration, t?.ease, () => n(!0)), e);
		}) : !1;
	}
	function T(e) {
		f?.scaleExtent(e);
	}
	function ee(e) {
		f?.translateExtent(e);
	}
	function te(e) {
		let t = !nf(e) || e < 0 ? 0 : e;
		f?.clickDistance(t);
	}
	return {
		update: _,
		destroy: v,
		setViewport: b,
		setViewportConstrained: y,
		getViewport: S,
		scaleTo: C,
		scaleBy: w,
		setScaleExtent: T,
		setTranslateExtent: ee,
		syncViewport: x,
		setClickDistance: te
	};
}
var Jp;
(function(e) {
	e.Line = "line", e.Handle = "handle";
})(Jp ||= {});
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/utils/edges.js
var Yp = rf("Svelte Flow", "https://svelteflow.dev/");
function Xp(e, t, n = {}) {
	return Rf(e, t, {
		...n,
		onError: n.onError ?? Yp
	});
}
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/store/context.js
function Zp() {
	let e = {};
	return [(t) => {
		if (t && !at(e)) throw Error(t);
		return rt(e);
	}, (t) => it(e, t)];
}
var [Qp, $p] = Zp(), [em, tm] = Zp(), [nm, rm] = Zp(), im = /* @__PURE__ */ new Set([
	"$$slots",
	"$$events",
	"$$legacy",
	"id",
	"type",
	"position",
	"style",
	"class",
	"isConnectable",
	"isConnectableStart",
	"isConnectableEnd",
	"isValidConnection",
	"onconnect",
	"ondisconnect",
	"children"
]), am = /* @__PURE__ */ V("<div><!></div>");
function om(e, t) {
	k(t, !0);
	let n = Q(t, "id", 3, null), r = Q(t, "type", 3, "source"), i = Q(t, "position", 19, () => Od.Top), a = Q(t, "isConnectableStart", 3, !0), o = Q(t, "isConnectableEnd", 3, !0), s = /* @__PURE__ */ Ma(t, im), c = Qp("Handle must be used within a Custom Node component"), l = em("Handle must be used within a Custom Node component"), u = /* @__PURE__ */ j(() => r() === "target"), d = /* @__PURE__ */ j(() => t.isConnectable === void 0 ? l.value : t.isConnectable), f = Wm(), p = /* @__PURE__ */ j(() => f.ariaLabelConfig), m = null;
	Ln(() => {
		if (t.onconnect || t.ondisconnect) {
			f.edges;
			let e = f.connectionLookup.get(`${c}-${r()}${n() ? `-${n()}` : ""}`);
			if (m && !vf(e, m)) {
				let n = e ?? /* @__PURE__ */ new Map();
				yf(m, n, t.ondisconnect), yf(n, m, t.onconnect);
			}
			m = new Map(e);
		}
	});
	let h = /* @__PURE__ */ j(() => {
		if (!f.connection.inProgress) return [
			!1,
			!1,
			!1,
			!1,
			null
		];
		let { fromHandle: e, toHandle: t, isValid: i } = f.connection, a = e && e.nodeId === c && e.type === r() && e.id === n(), o = t && t.nodeId === c && t.type === r() && t.id === n();
		return [
			!0,
			a,
			o,
			f.connectionMode === Sd.Strict ? e?.type !== r() : c !== e?.nodeId || n() !== e?.id,
			o && i
		];
	}), _ = /* @__PURE__ */ j(() => x(z(h), 5)), v = /* @__PURE__ */ j(() => z(_)[0]), y = /* @__PURE__ */ j(() => z(_)[1]), b = /* @__PURE__ */ j(() => z(_)[2]), S = /* @__PURE__ */ j(() => z(_)[3]), C = /* @__PURE__ */ j(() => z(_)[4]);
	function w(e) {
		let t = f.onbeforeconnect ? f.onbeforeconnect(e) : e;
		t && (f.addEdge(t), f.onconnect?.(e));
	}
	function T(e) {
		let r = Ef(e);
		e.currentTarget && (r && e.button === 0 || !r) && Mp.onPointerDown(e, {
			handleId: n(),
			nodeId: c,
			isTarget: z(u),
			connectionRadius: f.connectionRadius,
			domNode: f.domNode,
			nodeLookup: f.nodeLookup,
			connectionMode: f.connectionMode,
			lib: "svelte",
			autoPanOnConnect: f.autoPanOnConnect,
			autoPanSpeed: f.autoPanSpeed,
			flowId: f.flowId,
			isValidConnection: t.isValidConnection || ((...e) => f.isValidConnection?.(...e) ?? !0),
			updateConnection: f.updateConnection,
			cancelConnection: f.cancelConnection,
			panBy: f.panBy,
			onConnect: w,
			onConnectStart: f.onconnectstart,
			onConnectEnd: (...e) => f.onconnectend?.(...e),
			getTransform: () => [
				f.viewport.x,
				f.viewport.y,
				f.viewport.zoom
			],
			getFromHandle: () => f.connection.fromHandle,
			dragThreshold: f.connectionDragThreshold,
			handleDomNode: e.currentTarget
		});
	}
	function ee(e) {
		if (!c || !f.clickConnectStartHandle && !a()) return;
		if (!f.clickConnectStartHandle) {
			f.onclickconnectstart?.(e, {
				nodeId: c,
				handleId: n(),
				handleType: r()
			}), f.clickConnectStartHandle = {
				nodeId: c,
				type: r(),
				id: n()
			};
			return;
		}
		let i = Cf(e.target), o = t.isValidConnection ?? f.isValidConnection, { connectionMode: s, clickConnectStartHandle: l, flowId: u, nodeLookup: d } = f, { connection: p, isValid: m } = Mp.isValid(e, {
			handle: {
				nodeId: c,
				id: n(),
				type: r()
			},
			connectionMode: s,
			fromNodeId: l.nodeId,
			fromHandleId: l.id ?? null,
			fromType: l.type,
			isValidConnection: o,
			flowId: u,
			doc: i,
			lib: "svelte",
			nodeLookup: d
		});
		m && p && w(p);
		let h = structuredClone(Ze(f.connection));
		delete h.inProgress, h.toPosition = h.toHandle ? h.toHandle.position : null, f.onclickconnectend?.(e, h), f.clickConnectStartHandle = null;
	}
	var te = am(), ne = () => {};
	ha(te, () => ({
		"data-handleid": n(),
		"data-nodeid": c,
		"data-handlepos": i(),
		"data-id": `${f.flowId ?? ""}-${c ?? ""}-${n() ?? "null" ?? ""}-${r() ?? ""}`,
		class: [
			"svelte-flow__handle",
			`svelte-flow__handle-${i()}`,
			f.noDragClass,
			f.noPanClass,
			i(),
			t.class
		],
		onmousedown: T,
		ontouchstart: T,
		onclick: f.clickConnect ? ee : void 0,
		onkeypress: ne,
		style: t.style,
		role: "button",
		"aria-label": z(p)["handle.ariaLabel"],
		tabindex: "-1",
		...s,
		[na]: {
			valid: z(C),
			connectingto: z(b),
			connectingfrom: z(y),
			source: !z(u),
			target: z(u),
			connectablestart: a(),
			connectableend: o(),
			connectable: z(d),
			connectionindicator: z(d) && (!z(v) || z(S)) && (z(v) || f.clickConnectStartHandle ? o() : a())
		}
	})), vi(P(te), () => t.children ?? g), D(te), U(e, te), A();
}
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/components/nodes/DefaultNode.svelte
var sm = /* @__PURE__ */ V("<!> <!>", 1);
function cm(e, t) {
	k(t, !0);
	let n = Q(t, "targetPosition", 19, () => Od.Top), r = Q(t, "sourcePosition", 19, () => Od.Bottom);
	var i = sm(), a = F(i);
	om(a, {
		type: "target",
		get position() {
			return n();
		}
	});
	var o = L(a);
	om(L(o), {
		type: "source",
		get position() {
			return r();
		}
	}), R(() => W(o, ` ${t.data?.label ?? ""} `)), U(e, i), A();
}
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/components/nodes/InputNode.svelte
var lm = /* @__PURE__ */ V(" <!>", 1);
function um(e, t) {
	k(t, !0);
	let n = Q(t, "data", 19, () => ({ label: "Node" })), r = Q(t, "sourcePosition", 19, () => Od.Bottom);
	O();
	var i = lm(), a = F(i);
	om(L(a), {
		type: "source",
		get position() {
			return r();
		}
	}), R(() => W(a, `${n()?.label ?? ""} `)), U(e, i), A();
}
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/components/nodes/OutputNode.svelte
var dm = /* @__PURE__ */ V(" <!>", 1);
function fm(e, t) {
	k(t, !0);
	let n = Q(t, "data", 19, () => ({ label: "Node" })), r = Q(t, "targetPosition", 19, () => Od.Top);
	O();
	var i = dm(), a = F(i);
	om(L(a), {
		type: "target",
		get position() {
			return r();
		}
	}), R(() => W(a, `${n()?.label ?? ""} `)), U(e, i), A();
}
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/components/nodes/GroupNode.svelte
function pm(e, t) {}
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/actions/portal/portal.svelte.js
function mm(e, t, n) {
	if (!n || !t) return;
	let r = n === "root" ? t : t.querySelector(`.svelte-flow__${n}`);
	r && r.appendChild(e);
}
function hm(e, t) {
	let n = /* @__PURE__ */ j(Wm), r = /* @__PURE__ */ j(() => z(n).domNode), i;
	return z(r) ? mm(e, z(r), t) : i = Rn(() => {
		Fn(() => {
			mm(e, z(r), t), i?.();
		});
	}), {
		async update(t) {
			mm(e, z(r), t);
		},
		destroy() {
			e.parentNode && e.parentNode.removeChild(e), i?.();
		}
	};
}
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/actions/portal/utils.svelte.js
function gm() {
	let e = /* @__PURE__ */ M(typeof window > "u");
	if (z(e)) {
		let t = Rn(() => {
			Fn(() => {
				N(e, !1), t?.();
			});
		});
	}
	return { get value() {
		return z(e);
	} };
}
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/utils/index.js
var _m = (e) => jd(e), vm = (e) => Ad(e);
function ym(e) {
	return e === void 0 ? void 0 : `${e}px`;
}
var bm = {
	ArrowUp: {
		x: 0,
		y: -1
	},
	ArrowDown: {
		x: 0,
		y: 1
	},
	ArrowLeft: {
		x: -1,
		y: 0
	},
	ArrowRight: {
		x: 1,
		y: 0
	}
}, xm = /* @__PURE__ */ new Set([
	"$$slots",
	"$$events",
	"$$legacy",
	"x",
	"y",
	"width",
	"height",
	"selectEdgeOnClick",
	"transparent",
	"class",
	"children"
]), Sm = /* @__PURE__ */ V("<div><!></div>");
function Cm(e, t) {
	k(t, !0);
	let n = Q(t, "x", 3, 0), r = Q(t, "y", 3, 0), i = Q(t, "selectEdgeOnClick", 3, !1), a = Q(t, "transparent", 3, !1), o = /* @__PURE__ */ Ma(t, xm), s = Wm(), c = nm("EdgeLabel must be used within a Custom Edge component"), l = /* @__PURE__ */ j(() => s.visible.edges.get(c)?.zIndex);
	var u = Sm(), d = () => {
		i() && c && s.handleEdgeSelection(c);
	};
	ha(u, (e, s, c) => ({
		class: [
			"svelte-flow__edge-label",
			{ transparent: a() },
			t.class
		],
		tabindex: "-1",
		onclick: d,
		...o,
		[ra]: {
			display: e,
			cursor: i() ? "pointer" : void 0,
			transform: `translate(-50%, -50%) translate(${n() ?? ""}px,${r() ?? ""}px)`,
			"pointer-events": "all",
			width: s,
			height: c,
			"z-index": z(l)
		}
	}), [
		() => gm().value ? "none" : void 0,
		() => ym(t.width),
		() => ym(t.height)
	], void 0, void 0, "svelte-1wg91mu"), vi(P(u), () => t.children ?? g), D(u), Ii(u, (e, t) => hm?.(e, t), () => "edge-labels"), U(e, u), A();
}
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/components/edges/BaseEdge.svelte
var wm = /* @__PURE__ */ new Set([
	"$$slots",
	"$$events",
	"$$legacy",
	"id",
	"path",
	"label",
	"labelX",
	"labelY",
	"labelStyle",
	"markerStart",
	"markerEnd",
	"style",
	"interactionWidth",
	"class"
]), Tm = /* @__PURE__ */ Zr("<path></path>"), Em = /* @__PURE__ */ Zr("<path fill=\"none\"></path><!><!>", 1);
function Dm(e, t) {
	let n = Q(t, "interactionWidth", 3, 20), r = /* @__PURE__ */ Ma(t, wm);
	var i = Em(), a = F(i), o = L(a), s = (e) => {
		var i = Tm();
		ha(i, () => ({
			d: t.path,
			"stroke-opacity": 0,
			"stroke-width": n(),
			fill: "none",
			class: "svelte-flow__edge-interaction",
			...r
		})), U(e, i);
	};
	G(o, (e) => {
		n() > 0 && e(s);
	});
	var c = L(o), l = (e) => {
		Cm(e, {
			get x() {
				return t.labelX;
			},
			get y() {
				return t.labelY;
			},
			get style() {
				return t.labelStyle;
			},
			selectEdgeOnClick: !0,
			children: (e, n) => {
				O();
				var r = Qr();
				R(() => W(r, t.label)), U(e, r);
			},
			$$slots: { default: !0 }
		});
	};
	G(c, (e) => {
		t.label && e(l);
	}), R(() => {
		Y(a, "id", t.id), Y(a, "d", t.path), J(a, 0, Bi(["svelte-flow__edge-path", t.class])), Y(a, "marker-start", t.markerStart), Y(a, "marker-end", t.markerEnd), qi(a, t.style);
	}), U(e, i);
}
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/components/edges/BezierEdge.svelte
function Om(e, t) {
	k(t, !0);
	let n = /* @__PURE__ */ j(() => Mf({
		sourceX: t.sourceX,
		sourceY: t.sourceY,
		targetX: t.targetX,
		targetY: t.targetY,
		sourcePosition: t.sourcePosition,
		targetPosition: t.targetPosition,
		curvature: t.pathOptions?.curvature
	})), r = /* @__PURE__ */ j(() => x(z(n), 3)), i = /* @__PURE__ */ j(() => z(r)[0]), a = /* @__PURE__ */ j(() => z(r)[1]), o = /* @__PURE__ */ j(() => z(r)[2]);
	Dm(e, {
		get id() {
			return t.id;
		},
		get path() {
			return z(i);
		},
		get labelX() {
			return z(a);
		},
		get labelY() {
			return z(o);
		},
		get label() {
			return t.label;
		},
		get labelStyle() {
			return t.labelStyle;
		},
		get markerStart() {
			return t.markerStart;
		},
		get markerEnd() {
			return t.markerEnd;
		},
		get interactionWidth() {
			return t.interactionWidth;
		},
		get style() {
			return t.style;
		}
	}), A();
}
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/components/edges/SmoothStepEdgeInternal.svelte
function km(e, t) {
	k(t, !0);
	let n = /* @__PURE__ */ j(() => Gf({
		sourceX: t.sourceX,
		sourceY: t.sourceY,
		targetX: t.targetX,
		targetY: t.targetY,
		sourcePosition: t.sourcePosition,
		targetPosition: t.targetPosition
	})), r = /* @__PURE__ */ j(() => x(z(n), 3)), i = /* @__PURE__ */ j(() => z(r)[0]), a = /* @__PURE__ */ j(() => z(r)[1]), o = /* @__PURE__ */ j(() => z(r)[2]);
	Dm(e, {
		get path() {
			return z(i);
		},
		get labelX() {
			return z(a);
		},
		get labelY() {
			return z(o);
		},
		get label() {
			return t.label;
		},
		get labelStyle() {
			return t.labelStyle;
		},
		get markerStart() {
			return t.markerStart;
		},
		get markerEnd() {
			return t.markerEnd;
		},
		get interactionWidth() {
			return t.interactionWidth;
		},
		get style() {
			return t.style;
		}
	}), A();
}
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/components/edges/StraightEdgeInternal.svelte
function Am(e, t) {
	k(t, !0);
	let n = /* @__PURE__ */ j(() => zf({
		sourceX: t.sourceX,
		sourceY: t.sourceY,
		targetX: t.targetX,
		targetY: t.targetY
	})), r = /* @__PURE__ */ j(() => x(z(n), 3)), i = /* @__PURE__ */ j(() => z(r)[0]), a = /* @__PURE__ */ j(() => z(r)[1]), o = /* @__PURE__ */ j(() => z(r)[2]);
	Dm(e, {
		get path() {
			return z(i);
		},
		get labelX() {
			return z(a);
		},
		get labelY() {
			return z(o);
		},
		get label() {
			return t.label;
		},
		get labelStyle() {
			return t.labelStyle;
		},
		get markerStart() {
			return t.markerStart;
		},
		get markerEnd() {
			return t.markerEnd;
		},
		get interactionWidth() {
			return t.interactionWidth;
		},
		get style() {
			return t.style;
		}
	}), A();
}
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/components/edges/StepEdgeInternal.svelte
function jm(e, t) {
	k(t, !0);
	let n = /* @__PURE__ */ j(() => Gf({
		sourceX: t.sourceX,
		sourceY: t.sourceY,
		targetX: t.targetX,
		targetY: t.targetY,
		sourcePosition: t.sourcePosition,
		targetPosition: t.targetPosition,
		borderRadius: 0
	})), r = /* @__PURE__ */ j(() => x(z(n), 3)), i = /* @__PURE__ */ j(() => z(r)[0]), a = /* @__PURE__ */ j(() => z(r)[1]), o = /* @__PURE__ */ j(() => z(r)[2]);
	Dm(e, {
		get path() {
			return z(i);
		},
		get labelX() {
			return z(a);
		},
		get labelY() {
			return z(o);
		},
		get label() {
			return t.label;
		},
		get labelStyle() {
			return t.labelStyle;
		},
		get markerStart() {
			return t.markerStart;
		},
		get markerEnd() {
			return t.markerEnd;
		},
		get interactionWidth() {
			return t.interactionWidth;
		},
		get style() {
			return t.style;
		}
	}), A();
}
//#endregion
//#region node_modules/svelte/src/reactivity/reactive-value.js
var Mm = class {
	#e;
	#t;
	constructor(e, t) {
		this.#e = e, this.#t = li(t);
	}
	get current() {
		return this.#t(), this.#e();
	}
}, Nm = /\(.+\)/, Pm = /* @__PURE__ */ new Set([
	"all",
	"print",
	"screen",
	"and",
	"or",
	"not",
	"only"
]), Fm = class extends Mm {
	constructor(e, t) {
		let n = Nm.test(e) || e.split(/[\s,]+/).some((e) => Pm.has(e.trim())) ? e : `(${e})`, r = window.matchMedia(n);
		super(() => r.matches, (e) => Br(r, "change", e));
	}
};
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/store/visibleElements.js
function Im(e, t, n, r) {
	let i = /* @__PURE__ */ new Map();
	return Id(e, {
		x: 0,
		y: 0,
		width: n,
		height: r
	}, t, !0).forEach((e) => {
		i.set(e.id, e);
	}), i;
}
function Lm(e) {
	let { edges: t, defaultEdgeOptions: n, nodeLookup: r, previousEdges: i, connectionMode: a, onerror: o, onlyRenderVisible: s, elevateEdgesOnSelect: c, zIndexMode: l } = e, u = /* @__PURE__ */ new Map();
	for (let d of t) {
		let t = r.get(d.source), f = r.get(d.target);
		if (!t || !f || t.hidden || f.hidden) continue;
		if (s) {
			let { visibleNodes: n, transform: r, width: i, height: a } = e;
			if (Ff({
				sourceNode: t,
				targetNode: f,
				width: i,
				height: a,
				transform: r
			})) n.set(t.id, t), n.set(f.id, f);
			else continue;
		}
		let p = i.get(d.id);
		if (p && d === p.edge && t == p.sourceNode && f == p.targetNode) {
			u.set(d.id, p);
			continue;
		}
		let m = qf({
			id: d.id,
			sourceNode: t,
			targetNode: f,
			sourceHandle: d.sourceHandle || null,
			targetHandle: d.targetHandle || null,
			connectionMode: a,
			onError: o
		});
		m && u.set(d.id, {
			...n,
			...d,
			...m,
			zIndex: Pf({
				selected: d.selected,
				zIndex: d.zIndex ?? n.zIndex,
				sourceNode: t,
				targetNode: f,
				elevateOnSelect: c,
				zIndexMode: l
			}),
			sourceNode: t,
			targetNode: f,
			edge: d
		});
	}
	return u;
}
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/store/initial-store.svelte.js
var Rm = rf("Svelte Flow", "https://svelteflow.dev/"), zm = {
	input: um,
	output: fm,
	default: cm,
	group: pm
}, Bm = {
	straight: Am,
	smoothstep: km,
	default: Om,
	step: jm
};
function Vm(e, t, n, r, i, a) {
	return t && !n && r && i ? df(Fd(a, { filter: (e) => !(!e.width && !e.initialWidth || !e.height && !e.initialHeight) }), r, i, .5, 2, .1) : n ?? {
		x: 0,
		y: 0,
		zoom: 1
	};
}
function Hm(e) {
	class t {
		#e = /* @__PURE__ */ j(() => e.props.id ?? "1");
		get flowId() {
			return z(this.#e);
		}
		set flowId(e) {
			N(this.#e, e);
		}
		#t = /* @__PURE__ */ M(null);
		get domNode() {
			return z(this.#t);
		}
		set domNode(e) {
			N(this.#t, e);
		}
		#n = /* @__PURE__ */ M(null);
		get panZoom() {
			return z(this.#n);
		}
		set panZoom(e) {
			N(this.#n, e);
		}
		#r = /* @__PURE__ */ M(e.width ?? 0);
		get width() {
			return z(this.#r);
		}
		set width(e) {
			N(this.#r, e);
		}
		#i = /* @__PURE__ */ M(e.height ?? 0);
		get height() {
			return z(this.#i);
		}
		set height(e) {
			N(this.#i, e);
		}
		#a = /* @__PURE__ */ M(e.props.zIndexMode ?? "basic");
		get zIndexMode() {
			return z(this.#a);
		}
		set zIndexMode(e) {
			N(this.#a, e);
		}
		#o = /* @__PURE__ */ j(() => {
			let { nodesInitialized: t } = sp(e.nodes, this.nodeLookup, this.parentLookup, {
				nodeExtent: this.nodeExtent,
				nodeOrigin: this.nodeOrigin,
				elevateNodesOnSelect: e.props.elevateNodesOnSelect ?? !0,
				checkEquality: !0,
				zIndexMode: this.zIndexMode
			});
			return this.fitViewQueued && t && (this.fitViewOptions?.duration ? this.resolveFitView() : queueMicrotask(() => {
				this.resolveFitView();
			})), t;
		});
		get nodesInitialized() {
			return z(this.#o);
		}
		set nodesInitialized(e) {
			N(this.#o, e);
		}
		#s = /* @__PURE__ */ j(() => this.panZoom !== null);
		get viewportInitialized() {
			return z(this.#s);
		}
		set viewportInitialized(e) {
			N(this.#s, e);
		}
		#c = /* @__PURE__ */ j(() => (gp(this.connectionLookup, this.edgeLookup, e.edges), e.edges));
		get _edges() {
			return z(this.#c);
		}
		set _edges(e) {
			N(this.#c, e);
		}
		get nodes() {
			return this.nodesInitialized, e.nodes;
		}
		set nodes(t) {
			e.nodes = t;
		}
		get edges() {
			return this._edges;
		}
		set edges(t) {
			e.edges = t;
		}
		_prevSelectedNodes = [];
		_prevSelectedNodeIds = /* @__PURE__ */ new Set();
		#l = /* @__PURE__ */ j(() => {
			let e = this._prevSelectedNodeIds.size, t = /* @__PURE__ */ new Set(), n = this.nodes.filter((e) => (e.selected && (t.add(e.id), this._prevSelectedNodeIds.delete(e.id)), e.selected));
			return (e !== t.size || this._prevSelectedNodeIds.size > 0) && (this._prevSelectedNodes = n), this._prevSelectedNodeIds = t, this._prevSelectedNodes;
		});
		get selectedNodes() {
			return z(this.#l);
		}
		set selectedNodes(e) {
			N(this.#l, e);
		}
		_prevSelectedEdges = [];
		_prevSelectedEdgeIds = /* @__PURE__ */ new Set();
		#u = /* @__PURE__ */ j(() => {
			let e = this._prevSelectedEdgeIds.size, t = /* @__PURE__ */ new Set(), n = this.edges.filter((e) => (e.selected && (t.add(e.id), this._prevSelectedEdgeIds.delete(e.id)), e.selected));
			return (e !== t.size || this._prevSelectedEdgeIds.size > 0) && (this._prevSelectedEdges = n), this._prevSelectedEdgeIds = t, this._prevSelectedEdges;
		});
		get selectedEdges() {
			return z(this.#u);
		}
		set selectedEdges(e) {
			N(this.#u, e);
		}
		selectionChangeHandlers = /* @__PURE__ */ new Map();
		nodeLookup = /* @__PURE__ */ new Map();
		parentLookup = /* @__PURE__ */ new Map();
		connectionLookup = /* @__PURE__ */ new Map();
		edgeLookup = /* @__PURE__ */ new Map();
		_prevVisibleEdges = /* @__PURE__ */ new Map();
		#d = /* @__PURE__ */ j(() => {
			let { nodes: t, _edges: n, _prevVisibleEdges: r, nodeLookup: i, connectionMode: a, onerror: o, onlyRenderVisibleElements: s, defaultEdgeOptions: c, zIndexMode: l } = this, u, d, f = {
				edges: n,
				defaultEdgeOptions: c,
				previousEdges: r,
				nodeLookup: i,
				connectionMode: a,
				elevateEdgesOnSelect: e.props.elevateEdgesOnSelect ?? !0,
				zIndexMode: l,
				onerror: o
			};
			if (s) {
				let { viewport: e, width: t, height: n } = this, r = [
					e.x,
					e.y,
					e.zoom
				];
				u = Im(i, r, t, n), d = Lm({
					...f,
					onlyRenderVisible: !0,
					visibleNodes: u,
					transform: r,
					width: t,
					height: n
				});
			} else u = this.nodeLookup, d = Lm(f);
			return this._prevVisibleEdges = d, {
				nodes: u,
				edges: d
			};
		});
		get visible() {
			return z(this.#d);
		}
		set visible(e) {
			N(this.#d, e);
		}
		#f = /* @__PURE__ */ j(() => e.props.nodesDraggable ?? !0);
		get nodesDraggable() {
			return z(this.#f);
		}
		set nodesDraggable(e) {
			N(this.#f, e);
		}
		#p = /* @__PURE__ */ j(() => e.props.nodesConnectable ?? !0);
		get nodesConnectable() {
			return z(this.#p);
		}
		set nodesConnectable(e) {
			N(this.#p, e);
		}
		#m = /* @__PURE__ */ j(() => e.props.elementsSelectable ?? !0);
		get elementsSelectable() {
			return z(this.#m);
		}
		set elementsSelectable(e) {
			N(this.#m, e);
		}
		#h = /* @__PURE__ */ j(() => e.props.nodesFocusable ?? !0);
		get nodesFocusable() {
			return z(this.#h);
		}
		set nodesFocusable(e) {
			N(this.#h, e);
		}
		#g = /* @__PURE__ */ j(() => e.props.edgesFocusable ?? !0);
		get edgesFocusable() {
			return z(this.#g);
		}
		set edgesFocusable(e) {
			N(this.#g, e);
		}
		#_ = /* @__PURE__ */ j(() => e.props.disableKeyboardA11y ?? !1);
		get disableKeyboardA11y() {
			return z(this.#_);
		}
		set disableKeyboardA11y(e) {
			N(this.#_, e);
		}
		#v = /* @__PURE__ */ j(() => e.props.minZoom ?? .5);
		get minZoom() {
			return z(this.#v);
		}
		set minZoom(e) {
			N(this.#v, e);
		}
		#y = /* @__PURE__ */ j(() => e.props.maxZoom ?? 2);
		get maxZoom() {
			return z(this.#y);
		}
		set maxZoom(e) {
			N(this.#y, e);
		}
		#b = /* @__PURE__ */ j(() => e.props.nodeOrigin ?? [0, 0]);
		get nodeOrigin() {
			return z(this.#b);
		}
		set nodeOrigin(e) {
			N(this.#b, e);
		}
		#x = /* @__PURE__ */ j(() => e.props.nodeExtent ?? yd);
		get nodeExtent() {
			return z(this.#x);
		}
		set nodeExtent(e) {
			N(this.#x, e);
		}
		#S = /* @__PURE__ */ j(() => e.props.translateExtent ?? yd);
		get translateExtent() {
			return z(this.#S);
		}
		set translateExtent(e) {
			N(this.#S, e);
		}
		#C = /* @__PURE__ */ j(() => e.props.defaultEdgeOptions ?? {});
		get defaultEdgeOptions() {
			return z(this.#C);
		}
		set defaultEdgeOptions(e) {
			N(this.#C, e);
		}
		#w = /* @__PURE__ */ j(() => e.props.nodeDragThreshold ?? 1);
		get nodeDragThreshold() {
			return z(this.#w);
		}
		set nodeDragThreshold(e) {
			N(this.#w, e);
		}
		#T = /* @__PURE__ */ j(() => e.props.autoPanOnNodeDrag ?? !0);
		get autoPanOnNodeDrag() {
			return z(this.#T);
		}
		set autoPanOnNodeDrag(e) {
			N(this.#T, e);
		}
		#E = /* @__PURE__ */ j(() => e.props.autoPanOnConnect ?? !0);
		get autoPanOnConnect() {
			return z(this.#E);
		}
		set autoPanOnConnect(e) {
			N(this.#E, e);
		}
		#D = /* @__PURE__ */ j(() => e.props.autoPanOnNodeFocus ?? !0);
		get autoPanOnNodeFocus() {
			return z(this.#D);
		}
		set autoPanOnNodeFocus(e) {
			N(this.#D, e);
		}
		#O = /* @__PURE__ */ j(() => e.props.autoPanSpeed ?? 15);
		get autoPanSpeed() {
			return z(this.#O);
		}
		set autoPanSpeed(e) {
			N(this.#O, e);
		}
		#k = /* @__PURE__ */ j(() => e.props.connectionDragThreshold ?? 1);
		get connectionDragThreshold() {
			return z(this.#k);
		}
		set connectionDragThreshold(e) {
			N(this.#k, e);
		}
		fitViewQueued = e.props.fitView ?? !1;
		fitViewOptions = e.props.fitViewOptions;
		fitViewResolver = null;
		#A = /* @__PURE__ */ j(() => e.props.snapGrid ?? null);
		get snapGrid() {
			return z(this.#A);
		}
		set snapGrid(e) {
			N(this.#A, e);
		}
		#j = /* @__PURE__ */ M(!1);
		get dragging() {
			return z(this.#j);
		}
		set dragging(e) {
			N(this.#j, e);
		}
		#M = /* @__PURE__ */ M(null);
		get selectionRect() {
			return z(this.#M);
		}
		set selectionRect(e) {
			N(this.#M, e);
		}
		#N = /* @__PURE__ */ M(!1);
		get selectionKeyPressed() {
			return z(this.#N);
		}
		set selectionKeyPressed(e) {
			N(this.#N, e);
		}
		#P = /* @__PURE__ */ M(!1);
		get multiselectionKeyPressed() {
			return z(this.#P);
		}
		set multiselectionKeyPressed(e) {
			N(this.#P, e);
		}
		#F = /* @__PURE__ */ M(!1);
		get deleteKeyPressed() {
			return z(this.#F);
		}
		set deleteKeyPressed(e) {
			N(this.#F, e);
		}
		#I = /* @__PURE__ */ M(!1);
		get panActivationKeyPressed() {
			return z(this.#I);
		}
		set panActivationKeyPressed(e) {
			N(this.#I, e);
		}
		#L = /* @__PURE__ */ M(!1);
		get zoomActivationKeyPressed() {
			return z(this.#L);
		}
		set zoomActivationKeyPressed(e) {
			N(this.#L, e);
		}
		#R = /* @__PURE__ */ M(null);
		get selectionRectMode() {
			return z(this.#R);
		}
		set selectionRectMode(e) {
			N(this.#R, e);
		}
		#z = /* @__PURE__ */ M("");
		get ariaLiveMessage() {
			return z(this.#z);
		}
		set ariaLiveMessage(e) {
			N(this.#z, e);
		}
		#B = /* @__PURE__ */ j(() => e.props.selectionMode ?? wd.Partial);
		get selectionMode() {
			return z(this.#B);
		}
		set selectionMode(e) {
			N(this.#B, e);
		}
		#V = /* @__PURE__ */ j(() => ({
			...zm,
			...e.props.nodeTypes
		}));
		get nodeTypes() {
			return z(this.#V);
		}
		set nodeTypes(e) {
			N(this.#V, e);
		}
		#H = /* @__PURE__ */ j(() => ({
			...Bm,
			...e.props.edgeTypes
		}));
		get edgeTypes() {
			return z(this.#H);
		}
		set edgeTypes(e) {
			N(this.#H, e);
		}
		#U = /* @__PURE__ */ j(() => e.props.noPanClass ?? "nopan");
		get noPanClass() {
			return z(this.#U);
		}
		set noPanClass(e) {
			N(this.#U, e);
		}
		#W = /* @__PURE__ */ j(() => e.props.noDragClass ?? "nodrag");
		get noDragClass() {
			return z(this.#W);
		}
		set noDragClass(e) {
			N(this.#W, e);
		}
		#G = /* @__PURE__ */ j(() => e.props.noWheelClass ?? "nowheel");
		get noWheelClass() {
			return z(this.#G);
		}
		set noWheelClass(e) {
			N(this.#G, e);
		}
		#K = /* @__PURE__ */ j(() => _f(e.props.ariaLabelConfig));
		get ariaLabelConfig() {
			return z(this.#K);
		}
		set ariaLabelConfig(e) {
			N(this.#K, e);
		}
		#q = /* @__PURE__ */ M(Vm(this.nodesInitialized, e.props.fitView, e.props.initialViewport, this.width, this.height, this.nodeLookup));
		get _viewport() {
			return z(this.#q);
		}
		set _viewport(e) {
			N(this.#q, e);
		}
		get viewport() {
			return e.viewport ?? this._viewport;
		}
		set viewport(t) {
			e.viewport &&= t, this._viewport = t;
		}
		#J = /* @__PURE__ */ M(Td);
		get _connection() {
			return z(this.#J);
		}
		set _connection(e) {
			N(this.#J, e);
		}
		#Y = /* @__PURE__ */ j(() => this._connection.inProgress ? {
			...this._connection,
			to: of(this._connection.to, [
				this.viewport.x,
				this.viewport.y,
				this.viewport.zoom
			])
		} : this._connection);
		get connection() {
			return z(this.#Y);
		}
		set connection(e) {
			N(this.#Y, e);
		}
		#X = /* @__PURE__ */ j(() => e.props.connectionMode ?? Sd.Strict);
		get connectionMode() {
			return z(this.#X);
		}
		set connectionMode(e) {
			N(this.#X, e);
		}
		#Z = /* @__PURE__ */ j(() => e.props.connectionRadius ?? 20);
		get connectionRadius() {
			return z(this.#Z);
		}
		set connectionRadius(e) {
			N(this.#Z, e);
		}
		#Q = /* @__PURE__ */ j(() => e.props.isValidConnection ?? (() => !0));
		get isValidConnection() {
			return z(this.#Q);
		}
		set isValidConnection(e) {
			N(this.#Q, e);
		}
		#$ = /* @__PURE__ */ j(() => e.props.selectNodesOnDrag ?? !0);
		get selectNodesOnDrag() {
			return z(this.#$);
		}
		set selectNodesOnDrag(e) {
			N(this.#$, e);
		}
		#ee = /* @__PURE__ */ j(() => e.props.defaultMarkerColor === void 0 ? "#b1b1b7" : e.props.defaultMarkerColor);
		get defaultMarkerColor() {
			return z(this.#ee);
		}
		set defaultMarkerColor(e) {
			N(this.#ee, e);
		}
		#te = /* @__PURE__ */ j(() => Qf(e.edges, {
			defaultColor: this.defaultMarkerColor,
			id: this.flowId,
			defaultMarkerStart: this.defaultEdgeOptions.markerStart,
			defaultMarkerEnd: this.defaultEdgeOptions.markerEnd
		}));
		get markers() {
			return z(this.#te);
		}
		set markers(e) {
			N(this.#te, e);
		}
		#ne = /* @__PURE__ */ j(() => e.props.onlyRenderVisibleElements ?? !1);
		get onlyRenderVisibleElements() {
			return z(this.#ne);
		}
		set onlyRenderVisibleElements(e) {
			N(this.#ne, e);
		}
		#re = /* @__PURE__ */ j(() => e.props.onflowerror ?? Rm);
		get onerror() {
			return z(this.#re);
		}
		set onerror(e) {
			N(this.#re, e);
		}
		#ie = /* @__PURE__ */ j(() => e.props.ondelete);
		get ondelete() {
			return z(this.#ie);
		}
		set ondelete(e) {
			N(this.#ie, e);
		}
		#ae = /* @__PURE__ */ j(() => e.props.onbeforedelete);
		get onbeforedelete() {
			return z(this.#ae);
		}
		set onbeforedelete(e) {
			N(this.#ae, e);
		}
		#oe = /* @__PURE__ */ j(() => e.props.onbeforeconnect);
		get onbeforeconnect() {
			return z(this.#oe);
		}
		set onbeforeconnect(e) {
			N(this.#oe, e);
		}
		#se = /* @__PURE__ */ j(() => e.props.onconnect);
		get onconnect() {
			return z(this.#se);
		}
		set onconnect(e) {
			N(this.#se, e);
		}
		#ce = /* @__PURE__ */ j(() => e.props.onconnectstart);
		get onconnectstart() {
			return z(this.#ce);
		}
		set onconnectstart(e) {
			N(this.#ce, e);
		}
		#le = /* @__PURE__ */ j(() => e.props.onconnectend);
		get onconnectend() {
			return z(this.#le);
		}
		set onconnectend(e) {
			N(this.#le, e);
		}
		#ue = /* @__PURE__ */ j(() => e.props.onbeforereconnect);
		get onbeforereconnect() {
			return z(this.#ue);
		}
		set onbeforereconnect(e) {
			N(this.#ue, e);
		}
		#de = /* @__PURE__ */ j(() => e.props.onreconnect);
		get onreconnect() {
			return z(this.#de);
		}
		set onreconnect(e) {
			N(this.#de, e);
		}
		#fe = /* @__PURE__ */ j(() => e.props.onreconnectstart);
		get onreconnectstart() {
			return z(this.#fe);
		}
		set onreconnectstart(e) {
			N(this.#fe, e);
		}
		#pe = /* @__PURE__ */ j(() => e.props.onreconnectend);
		get onreconnectend() {
			return z(this.#pe);
		}
		set onreconnectend(e) {
			N(this.#pe, e);
		}
		#me = /* @__PURE__ */ j(() => e.props.clickConnect ?? !0);
		get clickConnect() {
			return z(this.#me);
		}
		set clickConnect(e) {
			N(this.#me, e);
		}
		#he = /* @__PURE__ */ j(() => e.props.onclickconnectstart);
		get onclickconnectstart() {
			return z(this.#he);
		}
		set onclickconnectstart(e) {
			N(this.#he, e);
		}
		#ge = /* @__PURE__ */ j(() => e.props.onclickconnectend);
		get onclickconnectend() {
			return z(this.#ge);
		}
		set onclickconnectend(e) {
			N(this.#ge, e);
		}
		#_e = /* @__PURE__ */ M(null);
		get clickConnectStartHandle() {
			return z(this.#_e);
		}
		set clickConnectStartHandle(e) {
			N(this.#_e, e);
		}
		#ve = /* @__PURE__ */ j(() => e.props.onselectiondrag);
		get onselectiondrag() {
			return z(this.#ve);
		}
		set onselectiondrag(e) {
			N(this.#ve, e);
		}
		#ye = /* @__PURE__ */ j(() => e.props.onselectiondragstart);
		get onselectiondragstart() {
			return z(this.#ye);
		}
		set onselectiondragstart(e) {
			N(this.#ye, e);
		}
		#be = /* @__PURE__ */ j(() => e.props.onselectiondragstop);
		get onselectiondragstop() {
			return z(this.#be);
		}
		set onselectiondragstop(e) {
			N(this.#be, e);
		}
		resolveFitView = async () => {
			this.panZoom && (await zd({
				nodes: this.nodeLookup,
				width: this.width,
				height: this.height,
				panZoom: this.panZoom,
				minZoom: this.minZoom,
				maxZoom: this.maxZoom
			}, this.fitViewOptions), this.fitViewResolver?.resolve(!0), this.fitViewQueued = !1, this.fitViewOptions = void 0, this.fitViewResolver = null);
		};
		_prefersDark = new Fm("(prefers-color-scheme: dark)", e.props.colorModeSSR === "dark");
		#xe = /* @__PURE__ */ j(() => e.props.colorMode === "system" ? this._prefersDark.current ? "dark" : "light" : e.props.colorMode ?? "light");
		get colorMode() {
			return z(this.#xe);
		}
		set colorMode(e) {
			N(this.#xe, e);
		}
		constructor() {}
		resetStoreValues() {
			this.dragging = !1, this.selectionRect = null, this.selectionRectMode = null, this.selectionKeyPressed = !1, this.multiselectionKeyPressed = !1, this.deleteKeyPressed = !1, this.panActivationKeyPressed = !1, this.zoomActivationKeyPressed = !1, this._connection = Td, this.clickConnectStartHandle = null, this.viewport = e.props.initialViewport ?? {
				x: 0,
				y: 0,
				zoom: 1
			}, this.ariaLiveMessage = "";
		}
	}
	return new t();
}
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/hooks/useStore.js
var Um = vd.error001("svelte");
function Wm() {
	let e = rt(Gm);
	if (!e) throw Error(Um);
	return e.getStore();
}
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/store/index.js
var Gm = Symbol();
function Km(e) {
	let t = Hm(e);
	function n(e) {
		t.nodeTypes = {
			...zm,
			...e
		};
	}
	function r(e) {
		t.edgeTypes = {
			...Bm,
			...e
		};
	}
	function i(e) {
		t.edges = Xp(e, t.edges, { onError: t.onerror });
	}
	let a = (e, n = !1) => {
		t.nodes = t.nodes.map((r) => {
			if (t.connection.inProgress && t.connection.fromNode.id === r.id) {
				let e = t.nodeLookup.get(r.id);
				e && (t.connection = {
					...t.connection,
					from: Yf(e, t.connection.fromHandle, Od.Left, !0)
				});
			}
			let i = e.get(r.id);
			return i ? {
				...r,
				position: i.position,
				dragging: n
			} : r;
		});
	};
	function o(e) {
		let { changes: n, updatedInternals: r } = pp(e, t.nodeLookup, t.parentLookup, t.domNode, t.nodeOrigin, t.nodeExtent, t.zIndexMode);
		if (!r) return;
		ip(t.nodeLookup, t.parentLookup, {
			nodeOrigin: t.nodeOrigin,
			nodeExtent: t.nodeExtent,
			zIndexMode: t.zIndexMode
		}), t.fitViewQueued && t.resolveFitView();
		let i = /* @__PURE__ */ new Map();
		for (let e of n) {
			let n = t.nodeLookup.get(e.id)?.internals.userNode;
			if (!n) continue;
			let r = { ...n };
			switch (e.type) {
				case "dimensions": {
					let t = {
						...r.measured,
						...e.dimensions
					};
					e.setAttributes && (r.width = e.dimensions?.width ?? r.width, r.height = e.dimensions?.height ?? r.height), r.measured = t;
					break;
				}
				case "position": r.position = e.position ?? r.position;
			}
			i.set(e.id, r);
		}
		t.nodes = t.nodes.map((e) => i.get(e.id) ?? e);
	}
	function s(e) {
		let n = t.fitViewResolver ?? Promise.withResolvers();
		return t.fitViewQueued = !0, t.fitViewOptions = e, t.fitViewResolver = n, t.nodes = [...t.nodes], n.promise;
	}
	async function c(e, n, r) {
		let i = r?.zoom === void 0 ? t.maxZoom : r.zoom, a = t.panZoom;
		return a ? (await a.setViewport({
			x: t.width / 2 - e * i,
			y: t.height / 2 - n * i,
			zoom: i
		}, {
			duration: r?.duration,
			ease: r?.ease,
			interpolate: r?.interpolate
		}), !0) : !1;
	}
	async function l(e, n) {
		let r = t.panZoom;
		return r ? r.scaleBy(e, n) : !1;
	}
	async function u(e) {
		return l(1.2, e);
	}
	function d(e) {
		return l(1 / 1.2, e);
	}
	function f(e) {
		let n = t.panZoom;
		n && (n.setScaleExtent([e, t.maxZoom]), t.minZoom = e);
	}
	function p(e) {
		let n = t.panZoom;
		n && (n.setScaleExtent([t.minZoom, e]), t.maxZoom = e);
	}
	function m(e) {
		let n = t.panZoom;
		n && (n.setTranslateExtent(e), t.translateExtent = e);
	}
	function h(e, t = null) {
		let n = !1, r = e.map((e) => (!t || t.has(e.id)) && e.selected ? (n = !0, {
			...e,
			selected: !1
		}) : e);
		return [n, r];
	}
	function g(e) {
		let n = e?.nodes ? new Set(e.nodes.map((e) => e.id)) : null, [r, i] = h(t.nodes, n);
		r && (t.nodes = i);
		let a = e?.edges ? new Set(e.edges.map((e) => e.id)) : null, [o, s] = h(t.edges, a);
		o && (t.edges = s);
	}
	function _(e) {
		let n = t.multiselectionKeyPressed;
		t.nodes = t.nodes.map((t) => {
			let r = e.includes(t.id), i = n && t.selected || r;
			return !!t.selected === i ? t : {
				...t,
				selected: i
			};
		}), n || g({ nodes: [] });
	}
	function v(e) {
		let n = t.multiselectionKeyPressed;
		t.edges = t.edges.map((t) => {
			let r = e.includes(t.id), i = n && t.selected || r;
			return !!t.selected === i ? t : {
				...t,
				selected: i
			};
		}), n || g({ edges: [] });
	}
	function y(e, n, r) {
		let i = t.nodeLookup.get(e);
		if (!i) {
			t.onerror("012", vd.error012(e));
			return;
		}
		t.selectionRect = null, t.selectionRectMode = null, i.selected ? (n || i.selected && t.multiselectionKeyPressed) && (g({
			nodes: [i.internals.userNode],
			edges: []
		}), requestAnimationFrame(() => r?.blur())) : _([e]);
	}
	function b(e) {
		let n = t.edgeLookup.get(e);
		if (!n) {
			t.onerror("016", vd.error016(e));
			return;
		}
		(n.selectable || t.elementsSelectable && n.selectable === void 0) && (t.selectionRect = null, t.selectionRectMode = null, n.selected ? n.selected && t.multiselectionKeyPressed && g({
			nodes: [],
			edges: [n]
		}) : v([e]));
	}
	function x(e, n) {
		let { nodeExtent: r, snapGrid: i, nodeOrigin: o, nodeLookup: s, nodesDraggable: c, onerror: l } = t, u = /* @__PURE__ */ new Map(), d = i?.[0] ?? 5, f = i?.[1] ?? 5, p = e.x * d * n, m = e.y * f * n;
		for (let e of s.values()) {
			if (!(e.selected && (e.draggable || c && e.draggable === void 0))) continue;
			let t = {
				x: e.internals.positionAbsolute.x + p,
				y: e.internals.positionAbsolute.y + m
			};
			i && (t = af(t, i));
			let { position: n, positionAbsolute: a } = Bd({
				nodeId: e.id,
				nextPosition: t,
				nodeLookup: s,
				nodeExtent: r,
				nodeOrigin: o,
				onError: l
			});
			e.position = n, e.internals.positionAbsolute = a, u.set(e.id, e);
		}
		a(u);
	}
	function S(e) {
		return mp({
			delta: e,
			panZoom: t.panZoom,
			transform: [
				t.viewport.x,
				t.viewport.y,
				t.viewport.zoom
			],
			translateExtent: t.translateExtent,
			width: t.width,
			height: t.height
		});
	}
	let C = (e) => {
		t._connection = { ...e };
	};
	function w() {
		t._connection = Td;
	}
	function T() {
		t.resetStoreValues(), g();
	}
	return Object.assign(t, {
		setNodeTypes: n,
		setEdgeTypes: r,
		addEdge: i,
		updateNodePositions: a,
		updateNodeInternals: o,
		zoomIn: u,
		zoomOut: d,
		fitView: s,
		setCenter: c,
		setMinZoom: f,
		setMaxZoom: p,
		setTranslateExtent: m,
		unselectNodesAndEdges: g,
		addSelectedNodes: _,
		addSelectedEdges: v,
		handleNodeSelection: y,
		handleEdgeSelection: b,
		moveSelectedNodes: x,
		panBy: S,
		updateConnection: C,
		cancelConnection: w,
		reset: T
	});
}
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/actions/zoom/index.js
function qm(e, t) {
	let { minZoom: n, maxZoom: r, initialViewport: i, onPanZoomStart: a, onPanZoom: o, onPanZoomEnd: s, translateExtent: c, setPanZoomInstance: l, onDraggingChange: u, onTransformChange: d } = t, f = qp({
		domNode: e,
		minZoom: n,
		maxZoom: r,
		translateExtent: c,
		viewport: i,
		onPanZoom: o,
		onPanZoomStart: a,
		onPanZoomEnd: s,
		onDraggingChange: u
	}), p = f.getViewport();
	return (i.x !== p.x || i.y !== p.y || i.zoom !== p.zoom) && d([
		p.x,
		p.y,
		p.zoom
	]), l(f), f.update(t), { update(e) {
		f.update(e);
	} };
}
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/container/Zoom/Zoom.svelte
var Jm = /* @__PURE__ */ V("<div class=\"svelte-flow__zoom svelte-flow__container\"><!></div>");
function Ym(e, t) {
	k(t, !0);
	let n = Q(t, "store", 15), r = /* @__PURE__ */ j(() => n().panActivationKeyPressed || t.panOnDrag), i = /* @__PURE__ */ j(() => n().panActivationKeyPressed || t.panOnScroll), { viewport: a } = n(), o = !1;
	Fn(() => {
		!o && n().viewportInitialized && (t.oninit?.(), o = !0);
	});
	var s = Jm();
	vi(P(s), () => t.children), D(s), Ii(s, (e, t) => qm?.(e, t), () => ({
		viewport: n().viewport,
		minZoom: n().minZoom,
		maxZoom: n().maxZoom,
		initialViewport: a,
		onDraggingChange: (e) => {
			n(n().dragging = e, !0);
		},
		setPanZoomInstance: (e) => {
			n(n().panZoom = e, !0);
		},
		onPanZoomStart: t.onmovestart,
		onPanZoom: t.onmove,
		onPanZoomEnd: t.onmoveend,
		zoomOnScroll: t.zoomOnScroll,
		zoomOnDoubleClick: t.zoomOnDoubleClick,
		zoomOnPinch: t.zoomOnPinch,
		panOnScroll: z(i),
		panOnDrag: z(r),
		panOnScrollSpeed: t.panOnScrollSpeed,
		panOnScrollMode: t.panOnScrollMode,
		panActivationKeyPressed: n().panActivationKeyPressed,
		zoomActivationKeyPressed: n().zoomActivationKeyPressed,
		preventScrolling: typeof t.preventScrolling != "boolean" || t.preventScrolling,
		noPanClassName: n().noPanClass,
		noWheelClassName: n().noWheelClass,
		userSelectionActive: !!n().selectionRect,
		translateExtent: n().translateExtent,
		lib: "svelte",
		paneClickDistance: t.paneClickDistance,
		selectionOnDrag: t.selectionOnDrag,
		onTransformChange: (e) => {
			n(n().viewport = {
				x: e[0],
				y: e[1],
				zoom: e[2]
			}, !0);
		},
		connectionInProgress: n().connection.inProgress
	})), U(e, s), A();
}
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/container/Pane/Pane.svelte
function Xm(e, t) {
	return (n) => {
		n.target === t && e?.(n);
	};
}
function Zm(e) {
	return (t) => {
		let n = e.has(t.id);
		return !!t.selected === n ? t : {
			...t,
			selected: n
		};
	};
}
function Qm(e, t) {
	if (e.size !== t.size) return !1;
	for (let n of e) if (!t.has(n)) return !1;
	return !0;
}
var $m = /* @__PURE__ */ V("<div><!></div>");
function eh(e, t) {
	k(t, !0);
	let n = Q(t, "store", 15), r = Q(t, "panOnDrag", 3, !0), i = Q(t, "paneClickDistance", 3, 1), a = Q(t, "autoPanOnSelection", 3, !0), o, s = null, c = !1, l = /* @__PURE__ */ new Set(), u = /* @__PURE__ */ new Set(), d = /* @__PURE__ */ j(() => n().panActivationKeyPressed || r()), f = /* @__PURE__ */ j(() => n().selectionKeyPressed || !!n().selectionRect || t.selectionOnDrag && z(d) !== !0), p = /* @__PURE__ */ j(() => n().elementsSelectable && (z(f) || n().selectionRectMode === "user")), m = !1, h = 0, g = {
		x: 0,
		y: 0
	}, _ = !1;
	function v(e) {
		if (e.pointerType === "touch" && z(d) !== !1 && !n().selectionKeyPressed || (s = o?.getBoundingClientRect(), !s)) return;
		let r = e.target === o, i = !r && !!e.target.closest(".nokey"), a = t.selectionOnDrag && r || n().selectionKeyPressed;
		if (i || !z(f) || !a || e.button !== 0 || !e.isPrimary) return;
		e.target?.setPointerCapture?.(e.pointerId), m = !1, _ = !1;
		let { x: c, y: l } = Df(e, s), u = of({
			x: c,
			y: l
		}, [
			n().viewport.x,
			n().viewport.y,
			n().viewport.zoom
		]);
		n(n().selectionRect = {
			width: 0,
			height: 0,
			startX: u.x,
			startY: u.y,
			x: c,
			y: l
		}, !0), r || (e.stopPropagation(), e.preventDefault());
	}
	function y(e, t) {
		if (n().selectionRect?.startX === void 0 || n().selectionRect.startY === void 0) return;
		let r = {
			x: n().selectionRect?.startX,
			y: n().selectionRect?.startY
		}, i = sf(r, [
			n().viewport.x,
			n().viewport.y,
			n().viewport.zoom
		]), a = {
			startX: r.x,
			startY: r.y,
			x: e < i.x ? e : i.x,
			y: t < i.y ? t : i.y,
			width: Math.abs(e - i.x),
			height: Math.abs(t - i.y)
		}, o = l, s = u;
		l = new Set(Id(n().nodeLookup, a, [
			n().viewport.x,
			n().viewport.y,
			n().viewport.zoom
		], n().selectionMode === wd.Partial, !0).map((e) => e.id));
		let c = n().defaultEdgeOptions.selectable ?? !0;
		u = /* @__PURE__ */ new Set();
		for (let e of l) {
			let t = n().connectionLookup.get(e);
			if (t) for (let { edgeId: e } of t.values()) {
				let t = n().edgeLookup.get(e);
				t && (t.selectable ?? c) && u.add(e);
			}
		}
		Qm(o, l) || n(n().nodes = n().nodes.map(Zm(l)), !0), Qm(s, u) || n(n().edges = n().edges.map(Zm(u)), !0), n(n().selectionRectMode = "user", !0), n(n().selectionRect = a, !0);
	}
	function b() {
		if (!a() || !s) return;
		let [e, t] = Kd(g, s, n().autoPanSpeed);
		n().panBy({
			x: e,
			y: t
		}).then((e) => {
			if (!m || !e) {
				h = requestAnimationFrame(b);
				return;
			}
			y(g.x, g.y), h = requestAnimationFrame(b);
		});
	}
	function x() {
		cancelAnimationFrame(h), h = 0, _ = !1;
	}
	bi(() => {
		typeof window < "u" && x();
	});
	function S(e) {
		if (!z(f) || !s || !n().selectionRect) return;
		let r = Df(e, s);
		g = {
			x: r.x,
			y: r.y
		};
		let a = sf({
			x: n().selectionRect.startX,
			y: n().selectionRect.startY
		}, [
			n().viewport.x,
			n().viewport.y,
			n().viewport.zoom
		]);
		if (!m) {
			let o = n().selectionKeyPressed ? 0 : i();
			if (Math.hypot(r.x - a.x, r.y - a.y) <= o) return;
			n().unselectNodesAndEdges(), t.onselectionstart?.(e);
		}
		m = !0, _ ||= (b(), !0), y(r.x, r.y);
	}
	function C(e) {
		if (!z(p)) {
			e.target === o && n().connection.inProgress && (c = !0);
			return;
		}
		e.button === 0 && (e.target?.releasePointerCapture?.(e.pointerId), !m && e.target === o && te?.(e), n(n().selectionRect = null, !0), m && n(n().selectionRectMode = l.size > 0 ? "nodes" : null, !0), m && t.onselectionend?.(e), x());
	}
	function w(e) {
		e.target?.releasePointerCapture?.(e.pointerId), x();
	}
	let T = (e) => {
		if (Array.isArray(z(d)) && z(d).includes(2)) {
			e.preventDefault();
			return;
		}
		t.onpanecontextmenu?.({ event: e });
	}, ee = (e) => {
		m &&= (e.stopPropagation(), !1);
	};
	function te(e) {
		if (m || n().connection.inProgress || c) {
			m = !1, c = !1;
			return;
		}
		t.onpaneclick?.({ event: e }), n().unselectNodesAndEdges(), n(n().selectionRectMode = null, !0), n(n().selectionRect = null, !0);
	}
	var ne = $m();
	let re;
	var ie = /* @__PURE__ */ j(() => z(p) ? void 0 : Xm(te, o)), ae = /* @__PURE__ */ j(() => Xm(T, o));
	vi(P(ne), () => t.children), D(ne), Ea(ne, (e) => o = e, () => o), R((e) => re = J(ne, 1, "svelte-flow__pane svelte-flow__container", null, re, {
		draggable: e,
		dragging: n().dragging,
		selection: z(f)
	}), [() => r() === !0 || Array.isArray(r()) && r().includes(0)]), B("click", ne, function(...e) {
		z(ie)?.apply(this, e);
	}), Vr("pointerdown", ne, function(...e) {
		(z(p) ? v : void 0)?.apply(this, e);
	}, !0), B("pointermove", ne, function(...e) {
		(z(p) ? S : void 0)?.apply(this, e);
	}), B("pointerup", ne, C), Vr("pointercancel", ne, function(...e) {
		(z(p) ? w : void 0)?.apply(this, e);
	}), B("contextmenu", ne, function(...e) {
		z(ae)?.apply(this, e);
	}), Vr("click", ne, function(...e) {
		(z(p) ? ee : void 0)?.apply(this, e);
	}, !0), U(e, ne), A();
}
Hr([
	"click",
	"pointermove",
	"pointerup",
	"contextmenu"
]);
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/container/Viewport/Viewport.svelte
var th = /* @__PURE__ */ V("<div class=\"svelte-flow__viewport xyflow__viewport svelte-flow__container\"><!></div>");
function nh(e, t) {
	k(t, !0);
	var n = th();
	let r;
	vi(P(n), () => t.children), D(n), R(() => r = qi(n, "", r, { transform: `translate(${t.store.viewport.x ?? ""}px, ${t.store.viewport.y ?? ""}px) scale(${t.store.viewport.zoom ?? ""})` })), U(e, n), A();
}
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/actions/drag/index.js
function rh(e, t) {
	let { store: n, onDrag: r, onDragStart: i, onDragStop: a, onNodeMouseDown: o } = t, s = Sp({
		onDrag: r,
		onDragStart: i,
		onDragStop: a,
		onNodeMouseDown: o,
		getStoreItems: () => {
			let { snapGrid: e, viewport: t } = n;
			return {
				nodes: n.nodes,
				nodeLookup: n.nodeLookup,
				edges: n.edges,
				nodeExtent: n.nodeExtent,
				snapGrid: e || [0, 0],
				snapToGrid: !!e,
				nodeOrigin: n.nodeOrigin,
				multiSelectionActive: n.multiselectionKeyPressed,
				domNode: n.domNode,
				transform: [
					t.x,
					t.y,
					t.zoom
				],
				autoPanOnNodeDrag: n.autoPanOnNodeDrag,
				nodesDraggable: n.nodesDraggable,
				selectNodesOnDrag: n.selectNodesOnDrag,
				nodeDragThreshold: n.nodeDragThreshold,
				unselectNodesAndEdges: n.unselectNodesAndEdges,
				updateNodePositions: n.updateNodePositions,
				onSelectionDrag: n.onselectiondrag,
				onSelectionDragStart: n.onselectiondragstart,
				onSelectionDragStop: n.onselectiondragstop,
				panBy: n.panBy
			};
		}
	});
	function c(e, t) {
		if (t.disabled) {
			s.destroy();
			return;
		}
		s.update({
			domNode: e,
			noDragClassName: t.noDragClass,
			handleSelector: t.handleSelector,
			nodeId: t.nodeId,
			isSelectable: t.isSelectable,
			nodeClickDistance: t.nodeClickDistance
		});
	}
	return c(e, t), {
		update(t) {
			c(e, t);
		},
		destroy() {
			s.destroy();
		}
	};
}
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/components/A11yDescriptions/A11yDescriptions.svelte
var ih = /* @__PURE__ */ V("<div aria-live=\"assertive\" aria-atomic=\"true\" class=\"a11y-live-msg svelte-13pq11u\"> </div>"), ah = /* @__PURE__ */ V("<div class=\"a11y-hidden svelte-13pq11u\"> </div> <div class=\"a11y-hidden svelte-13pq11u\"> </div> <!>", 1);
function oh(e, t) {
	k(t, !0);
	var n = ah(), r = F(n), i = I(r, !0), a = L(r, 2), o = I(a, !0), s = L(a, 2), c = (e) => {
		var n = ih(), r = I(n, !0);
		R(() => {
			Y(n, "id", `${lh}-${t.store.flowId}`), W(r, t.store.ariaLiveMessage);
		}), U(e, n);
	};
	G(s, (e) => {
		t.store.disableKeyboardA11y || e(c);
	}), R(() => {
		Y(r, "id", `${sh}-${t.store.flowId}`), W(i, t.store.disableKeyboardA11y ? t.store.ariaLabelConfig["node.a11yDescription.default"] : t.store.ariaLabelConfig["node.a11yDescription.keyboardDisabled"]), Y(a, "id", `${ch}-${t.store.flowId}`), W(o, t.store.ariaLabelConfig["edge.a11yDescription.default"]);
	}), U(e, n), A();
}
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/components/A11yDescriptions/index.js
var sh = "svelte-flow__node-desc", ch = "svelte-flow__edge-desc", lh = "svelte-flow__aria-live", uh = /* @__PURE__ */ V("<div><!></div>");
function dh(e, t) {
	k(t, !0);
	let n = Q(t, "store", 15), r = /* @__PURE__ */ j(() => b(t.node.data, () => ({}), !0)), i = /* @__PURE__ */ j(() => b(t.node.selected, !1)), a = /* @__PURE__ */ j(() => t.node.draggable), o = /* @__PURE__ */ j(() => t.node.selectable), s = /* @__PURE__ */ j(() => b(t.node.deletable, !0)), c = /* @__PURE__ */ j(() => t.node.connectable), l = /* @__PURE__ */ j(() => t.node.focusable), u = /* @__PURE__ */ j(() => b(t.node.hidden, !1)), d = /* @__PURE__ */ j(() => b(t.node.dragging, !1)), f = /* @__PURE__ */ j(() => b(t.node.style, "")), p = /* @__PURE__ */ j(() => t.node.class), m = /* @__PURE__ */ j(() => b(t.node.type, "default")), h = /* @__PURE__ */ j(() => t.node.parentId), g = /* @__PURE__ */ j(() => t.node.sourcePosition), _ = /* @__PURE__ */ j(() => t.node.targetPosition), v = /* @__PURE__ */ j(() => b(t.node.measured, () => ({
		width: 0,
		height: 0
	}), !0).width), y = /* @__PURE__ */ j(() => b(t.node.measured, () => ({
		width: 0,
		height: 0
	}), !0).height), x = /* @__PURE__ */ j(() => t.node.initialWidth), S = /* @__PURE__ */ j(() => t.node.initialHeight), C = /* @__PURE__ */ j(() => t.node.width), w = /* @__PURE__ */ j(() => t.node.height), T = /* @__PURE__ */ j(() => t.node.dragHandle), ee = /* @__PURE__ */ j(() => b(t.node.internals.z, 0)), te = /* @__PURE__ */ j(() => t.node.internals.positionAbsolute.x), ne = /* @__PURE__ */ j(() => t.node.internals.positionAbsolute.y), re = /* @__PURE__ */ j(() => t.node.internals.userNode), { id: ie } = t.node, ae = /* @__PURE__ */ j(() => z(a) ?? n().nodesDraggable), oe = /* @__PURE__ */ j(() => z(o) ?? n().elementsSelectable), se = /* @__PURE__ */ j(() => z(c) ?? n().nodesConnectable), ce = /* @__PURE__ */ j(() => hf(t.node)), le = /* @__PURE__ */ j(() => !!t.node.internals.handleBounds), ue = /* @__PURE__ */ j(() => z(ce) && z(le)), de = /* @__PURE__ */ j(() => z(l) ?? n().nodesFocusable);
	function fe(e) {
		return n().parentLookup.has(e);
	}
	let pe = /* @__PURE__ */ j(() => fe(ie)), me = /* @__PURE__ */ M(null), he = null, ge = z(m), _e = z(g), ve = z(_), ye = /* @__PURE__ */ j(() => n().nodeTypes[z(m)] ?? cm), be = /* @__PURE__ */ j(() => n().ariaLabelConfig);
	$p(ie), tm({ get value() {
		return z(se);
	} });
	let xe = /* @__PURE__ */ j(() => {
		let e = z(v) === void 0 ? z(C) ?? z(x) : z(C), t = z(y) === void 0 ? z(w) ?? z(S) : z(w);
		if (e !== void 0 || t !== void 0 || z(f) !== void 0) return `${z(f)};${e ? `width:${ym(e)};` : ""}${t ? `height:${ym(t)};` : ""}`;
	});
	Fn(() => {
		(z(m) !== ge || z(g) !== _e || z(_) !== ve) && z(me) !== null && requestAnimationFrame(() => {
			z(me) !== null && n().updateNodeInternals(/* @__PURE__ */ new Map([[ie, {
				id: ie,
				nodeElement: z(me),
				force: !0
			}]]));
		}), ge = z(m), _e = z(g), ve = z(_);
	}), Fn(() => {
		t.resizeObserver && (!z(ue) || z(me) !== he) && (he && t.resizeObserver.unobserve(he), z(me) && t.resizeObserver.observe(z(me)), he = z(me));
	}), bi(() => {
		he && t.resizeObserver?.unobserve(he);
	});
	function Se(e) {
		z(oe) && (!n().selectNodesOnDrag || !z(ae) || n().nodeDragThreshold > 0) && n().handleNodeSelection(ie), t.onnodeclick?.({
			node: z(re),
			event: e
		});
	}
	function Ce(e) {
		if (!(Tf(e) || n().disableKeyboardA11y)) {
			if (bd.includes(e.key) && z(oe)) {
				let t = e.key === "Escape";
				n().handleNodeSelection(ie, t, z(me));
			} else z(ae) && t.node.selected && Object.prototype.hasOwnProperty.call(bm, e.key) && (e.preventDefault(), n(n().ariaLiveMessage = z(be)["node.a11yDescription.ariaLiveMessage"]({
				direction: e.key.replace("Arrow", "").toLowerCase(),
				x: ~~t.node.internals.positionAbsolute.x,
				y: ~~t.node.internals.positionAbsolute.y
			}), !0), n().moveSelectedNodes(bm[e.key], e.shiftKey ? 4 : 1));
		}
	}
	let we = () => {
		if (n().disableKeyboardA11y || !n().autoPanOnNodeFocus || !z(me)?.matches(":focus-visible")) return;
		let { width: e, height: r, viewport: i } = n();
		Id(/* @__PURE__ */ new Map([[ie, t.node]]), {
			x: 0,
			y: 0,
			width: e,
			height: r
		}, [
			i.x,
			i.y,
			i.zoom
		], !0).length > 0 || n().setCenter(t.node.position.x + (t.node.measured.width ?? 0) / 2, t.node.position.y + (t.node.measured.height ?? 0) / 2, { zoom: i.zoom });
	};
	var Te = H(), Ee = F(Te), E = (e) => {
		var a = uh();
		ha(a, () => ({
			"data-id": ie,
			class: [
				"svelte-flow__node",
				`svelte-flow__node-${z(m)}`,
				z(p)
			],
			style: z(xe),
			onclick: Se,
			onpointerenter: t.onnodepointerenter ? (e) => t.onnodepointerenter({
				node: z(re),
				event: e
			}) : void 0,
			onpointerleave: t.onnodepointerleave ? (e) => t.onnodepointerleave({
				node: z(re),
				event: e
			}) : void 0,
			onpointermove: t.onnodepointermove ? (e) => t.onnodepointermove({
				node: z(re),
				event: e
			}) : void 0,
			oncontextmenu: t.onnodecontextmenu ? (e) => t.onnodecontextmenu({
				node: z(re),
				event: e
			}) : void 0,
			onkeydown: z(de) ? Ce : void 0,
			onfocus: z(de) ? we : void 0,
			tabIndex: z(de) ? 0 : void 0,
			role: t.node.ariaRole ?? (z(de) ? "group" : void 0),
			"aria-label": t.node.ariaLabel,
			"aria-roledescription": "node",
			"aria-describedby": n().disableKeyboardA11y ? void 0 : `${sh}-${n().flowId}`,
			...t.node.domAttributes,
			[na]: {
				dragging: z(d),
				selected: z(i),
				draggable: z(ae),
				connectable: z(se),
				selectable: z(oe),
				nopan: z(ae),
				parent: z(pe)
			},
			[ra]: {
				"z-index": z(ee),
				transform: `translate(${z(te) ?? ""}px, ${z(ne) ?? ""}px)`,
				visibility: z(ce) ? "visible" : "hidden"
			}
		})), Pi(P(a), () => z(ye), (e, t) => {
			t(e, {
				get data() {
					return z(r);
				},
				get id() {
					return ie;
				},
				get selected() {
					return z(i);
				},
				get selectable() {
					return z(oe);
				},
				get deletable() {
					return z(s);
				},
				get sourcePosition() {
					return z(g);
				},
				get targetPosition() {
					return z(_);
				},
				get zIndex() {
					return z(ee);
				},
				get dragging() {
					return z(d);
				},
				get draggable() {
					return z(ae);
				},
				get dragHandle() {
					return z(T);
				},
				get parentId() {
					return z(h);
				},
				get type() {
					return z(m);
				},
				get isConnectable() {
					return z(se);
				},
				get positionAbsoluteX() {
					return z(te);
				},
				get positionAbsoluteY() {
					return z(ne);
				},
				get width() {
					return z(C);
				},
				get height() {
					return z(w);
				}
			});
		}), D(a), Ii(a, (e, t) => rh?.(e, t), () => ({
			nodeId: ie,
			isSelectable: z(oe),
			disabled: !z(ae),
			handleSelector: z(T),
			noDragClass: n().noDragClass,
			nodeClickDistance: t.nodeClickDistance,
			onNodeMouseDown: n().handleNodeSelection,
			onDrag: (e, n, r, i) => {
				t.onnodedrag?.({
					event: e,
					targetNode: r,
					nodes: i
				});
			},
			onDragStart: (e, n, r, i) => {
				t.onnodedragstart?.({
					event: e,
					targetNode: r,
					nodes: i
				});
			},
			onDragStop: (e, n, r, i) => {
				t.onnodedragstop?.({
					event: e,
					targetNode: r,
					nodes: i
				});
			},
			store: n()
		})), Ea(a, (e) => N(me, e), () => z(me)), U(e, a);
	};
	G(Ee, (e) => {
		z(u) || e(E);
	}), U(e, Te), A();
}
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/container/NodeRenderer/NodeRenderer.svelte
var fh = /* @__PURE__ */ V("<div class=\"svelte-flow__nodes\"></div>");
function ph(e, t) {
	k(t, !0);
	let n = Q(t, "store", 15), r = typeof ResizeObserver > "u" ? null : new ResizeObserver((e) => {
		let t = /* @__PURE__ */ new Map();
		e.forEach((e) => {
			let n = e.target.getAttribute("data-id");
			t.set(n, {
				id: n,
				nodeElement: e.target,
				force: !0
			});
		}), n().updateNodeInternals(t);
	});
	bi(() => {
		r?.disconnect();
	});
	var i = fh();
	K(i, 21, () => n().visible.nodes.values(), (e) => e.id, (e, i) => {
		dh(e, {
			get node() {
				return z(i);
			},
			get resizeObserver() {
				return r;
			},
			get nodeClickDistance() {
				return t.nodeClickDistance;
			},
			get onnodeclick() {
				return t.onnodeclick;
			},
			get onnodepointerenter() {
				return t.onnodepointerenter;
			},
			get onnodepointermove() {
				return t.onnodepointermove;
			},
			get onnodepointerleave() {
				return t.onnodepointerleave;
			},
			get onnodedrag() {
				return t.onnodedrag;
			},
			get onnodedragstart() {
				return t.onnodedragstart;
			},
			get onnodedragstop() {
				return t.onnodedragstop;
			},
			get onnodecontextmenu() {
				return t.onnodecontextmenu;
			},
			get store() {
				return n();
			},
			set store(e) {
				n(e);
			}
		});
	}), D(i), U(e, i), A();
}
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/components/EdgeWrapper/EdgeWrapper.svelte
var mh = /* @__PURE__ */ Zr("<svg class=\"svelte-flow__edge-wrapper\"><g><!></g></svg>");
function hh(e, t) {
	k(t, !0);
	let n = /* @__PURE__ */ j(() => t.edge.id), r = /* @__PURE__ */ j(() => t.edge.source), i = /* @__PURE__ */ j(() => t.edge.target), a = /* @__PURE__ */ j(() => t.edge.sourceX), o = /* @__PURE__ */ j(() => t.edge.sourceY), s = /* @__PURE__ */ j(() => t.edge.targetX), c = /* @__PURE__ */ j(() => t.edge.targetY), l = /* @__PURE__ */ j(() => t.edge.sourcePosition), u = /* @__PURE__ */ j(() => t.edge.targetPosition), d = /* @__PURE__ */ j(() => b(t.edge.animated, !1)), f = /* @__PURE__ */ j(() => b(t.edge.selected, !1)), p = /* @__PURE__ */ j(() => t.edge.label), m = /* @__PURE__ */ j(() => t.edge.labelStyle), h = /* @__PURE__ */ j(() => b(t.edge.data, () => ({}), !0)), g = /* @__PURE__ */ j(() => t.edge.style), _ = /* @__PURE__ */ j(() => t.edge.interactionWidth), v = /* @__PURE__ */ j(() => b(t.edge.type, "default")), y = /* @__PURE__ */ j(() => t.edge.sourceHandle), x = /* @__PURE__ */ j(() => t.edge.targetHandle), S = /* @__PURE__ */ j(() => t.edge.markerStart), C = /* @__PURE__ */ j(() => t.edge.markerEnd), w = /* @__PURE__ */ j(() => t.edge.selectable), T = /* @__PURE__ */ j(() => t.edge.focusable), ee = /* @__PURE__ */ j(() => b(t.edge.deletable, !0)), te = /* @__PURE__ */ j(() => t.edge.hidden), ne = /* @__PURE__ */ j(() => t.edge.zIndex), re = /* @__PURE__ */ j(() => t.edge.class), ie = /* @__PURE__ */ j(() => t.edge.ariaLabel);
	rm(z(n));
	let ae = null, oe = /* @__PURE__ */ j(() => z(w) ?? t.store.elementsSelectable), se = /* @__PURE__ */ j(() => z(T) ?? t.store.edgesFocusable), ce = /* @__PURE__ */ j(() => t.store.edgeTypes[z(v)] ?? Om), le = /* @__PURE__ */ j(() => z(S) ? `url('#${Zf(z(S), t.store.flowId)}')` : void 0), ue = /* @__PURE__ */ j(() => z(C) ? `url('#${Zf(z(C), t.store.flowId)}')` : void 0);
	function de(e) {
		let r = t.store.edgeLookup.get(z(n));
		r && (z(oe) && t.store.handleEdgeSelection(z(n)), t.onedgeclick?.({
			event: e,
			edge: r
		}));
	}
	function fe(e, r) {
		let i = t.store.edgeLookup.get(z(n));
		i && r({
			event: e,
			edge: i
		});
	}
	function pe(e) {
		if (!t.store.disableKeyboardA11y && bd.includes(e.key) && z(oe)) {
			let { unselectNodesAndEdges: r, addSelectedEdges: i } = t.store;
			e.key === "Escape" ? (ae?.blur(), r({ edges: [t.edge] })) : i([z(n)]);
		}
	}
	var me = H(), he = F(me), ge = (e) => {
		var b = mh();
		let S;
		var C = P(b);
		ha(C, () => ({
			class: ["svelte-flow__edge", z(re)],
			"data-id": z(n),
			onclick: de,
			oncontextmenu: t.onedgecontextmenu ? (e) => {
				fe(e, t.onedgecontextmenu);
			} : void 0,
			onpointerenter: t.onedgepointerenter ? (e) => {
				fe(e, t.onedgepointerenter);
			} : void 0,
			onpointerleave: t.onedgepointerleave ? (e) => {
				fe(e, t.onedgepointerleave);
			} : void 0,
			"aria-label": z(ie) === null ? void 0 : z(ie) ? z(ie) : `Edge from ${z(r)} to ${z(i)}`,
			"aria-describedby": z(se) ? `${ch}-${t.store.flowId}` : void 0,
			role: t.edge.ariaRole ?? (z(se) ? "group" : "img"),
			"aria-roledescription": "edge",
			onkeydown: z(se) ? pe : void 0,
			tabindex: z(se) ? 0 : void 0,
			...t.edge.domAttributes,
			[na]: {
				animated: z(d),
				selected: z(f),
				selectable: z(oe)
			}
		})), Pi(P(C), () => z(ce), (e, t) => {
			t(e, {
				get id() {
					return z(n);
				},
				get source() {
					return z(r);
				},
				get target() {
					return z(i);
				},
				get sourceX() {
					return z(a);
				},
				get sourceY() {
					return z(o);
				},
				get targetX() {
					return z(s);
				},
				get targetY() {
					return z(c);
				},
				get sourcePosition() {
					return z(l);
				},
				get targetPosition() {
					return z(u);
				},
				get animated() {
					return z(d);
				},
				get selected() {
					return z(f);
				},
				get label() {
					return z(p);
				},
				get labelStyle() {
					return z(m);
				},
				get data() {
					return z(h);
				},
				get style() {
					return z(g);
				},
				get interactionWidth() {
					return z(_);
				},
				get selectable() {
					return z(oe);
				},
				get deletable() {
					return z(ee);
				},
				get type() {
					return z(v);
				},
				get sourceHandleId() {
					return z(y);
				},
				get targetHandleId() {
					return z(x);
				},
				get markerStart() {
					return z(le);
				},
				get markerEnd() {
					return z(ue);
				}
			});
		}), D(C), Ea(C, (e) => ae = e, () => ae), D(b), R(() => S = qi(b, "", S, { "z-index": z(ne) })), U(e, b);
	};
	G(he, (e) => {
		z(te) || e(ge);
	}), U(e, me), A();
}
//#endregion
//#region node_modules/svelte/src/internal/flags/legacy.js
Ye();
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/container/EdgeRenderer/MarkerDefinition/MarkerDefinition.svelte
var gh = /* @__PURE__ */ Zr("<defs></defs>");
function _h(e, t) {
	k(t, !1);
	let n = Wm();
	Da();
	var r = gh();
	K(r, 5, () => n.markers, (e) => e.id, (e, t) => {
		xh(e, Z(() => z(t)));
	}), D(r), U(e, r), A();
}
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/container/EdgeRenderer/MarkerDefinition/Marker.svelte
var vh = /* @__PURE__ */ Zr("<polyline class=\"arrow\" fill=\"none\" stroke-linecap=\"round\" stroke-linejoin=\"round\" points=\"-5,-4 0,0 -5,4\"></polyline>"), yh = /* @__PURE__ */ Zr("<polyline class=\"arrowclosed\" stroke-linecap=\"round\" stroke-linejoin=\"round\" points=\"-5,-4 0,0 -5,4 -5,-4\"></polyline>"), bh = /* @__PURE__ */ Zr("<marker class=\"svelte-flow__arrowhead\" viewBox=\"-10 -10 20 20\" refX=\"0\" refY=\"0\"><!></marker>");
function xh(e, t) {
	k(t, !0);
	let n = Q(t, "width", 3, 12.5), r = Q(t, "height", 3, 12.5), i = Q(t, "markerUnits", 3, "strokeWidth"), a = Q(t, "orient", 3, "auto-start-reverse"), o = Q(t, "color", 3, "none");
	var s = bh(), c = P(s), l = (e) => {
		var n = vh();
		let r;
		R(() => {
			Y(n, "stroke-width", t.strokeWidth), r = qi(n, "", r, { stroke: o() });
		}), U(e, n);
	}, u = (e) => {
		var n = yh();
		let r;
		R(() => {
			Y(n, "stroke-width", t.strokeWidth), r = qi(n, "", r, {
				stroke: o(),
				fill: o()
			});
		}), U(e, n);
	};
	G(c, (e) => {
		t.type === Dd.Arrow ? e(l) : t.type === Dd.ArrowClosed && e(u, 1);
	}), D(s), R(() => {
		Y(s, "id", t.id), Y(s, "markerWidth", `${n()}`), Y(s, "markerHeight", `${r()}`), Y(s, "markerUnits", i()), Y(s, "orient", a());
	}), U(e, s), A();
}
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/container/EdgeRenderer/EdgeRenderer.svelte
var Sh = /* @__PURE__ */ V("<div class=\"svelte-flow__edges\"><svg class=\"svelte-flow__marker\"><!></svg> <!></div>");
function Ch(e, t) {
	k(t, !0);
	let n = Q(t, "store", 15);
	var r = Sh(), i = P(r);
	_h(P(i), {}), D(i), K(L(i, 2), 17, () => n().visible.edges.values(), (e) => e.id, (e, r) => {
		hh(e, {
			get edge() {
				return z(r);
			},
			get onedgeclick() {
				return t.onedgeclick;
			},
			get onedgecontextmenu() {
				return t.onedgecontextmenu;
			},
			get onedgepointerenter() {
				return t.onedgepointerenter;
			},
			get onedgepointerleave() {
				return t.onedgepointerleave;
			},
			get store() {
				return n();
			},
			set store(e) {
				n(e);
			}
		});
	}), D(r), U(e, r), A();
}
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/components/Selection/Selection.svelte
var wh = /* @__PURE__ */ V("<div class=\"svelte-flow__selection svelte-1vr3gfi\"></div>");
function Th(e, t) {
	k(t, !0);
	let n = Q(t, "x", 3, 0), r = Q(t, "y", 3, 0), i = Q(t, "width", 3, 0), a = Q(t, "height", 3, 0), o = Q(t, "isVisible", 3, !0);
	var s = H(), c = F(s), l = (e) => {
		var t = wh();
		let o;
		R((e, i) => o = qi(t, "", o, {
			width: e,
			height: i,
			transform: `translate(${n()}px, ${r()}px)`
		}), [() => typeof i() == "string" ? i() : ym(i()), () => typeof a() == "string" ? a() : ym(a())]), U(e, t);
	};
	G(c, (e) => {
		o() && e(l);
	}), U(e, s), A();
}
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/components/NodeSelection/NodeSelection.svelte
var Eh = /* @__PURE__ */ V("<div><!></div>");
function Dh(e, t) {
	k(t, !0);
	let n = /* @__PURE__ */ M(void 0);
	Fn(() => {
		t.store.disableKeyboardA11y || z(n)?.focus({ preventScroll: !0 });
	});
	let r = /* @__PURE__ */ j(() => {
		if (t.store.selectionRectMode === "nodes") {
			t.store.nodes;
			let e = Fd(t.store.nodeLookup, { filter: (e) => !!e.selected });
			if (e.width > 0 && e.height > 0) return e;
		}
		return null;
	});
	function i(e) {
		let n = t.store.nodes.filter((e) => e.selected);
		t.onselectioncontextmenu?.({
			nodes: n,
			event: e
		});
	}
	function a(e) {
		let n = t.store.nodes.filter((e) => e.selected);
		t.onselectionclick?.({
			nodes: n,
			event: e
		});
	}
	function o(e) {
		Object.prototype.hasOwnProperty.call(bm, e.key) && (e.preventDefault(), t.store.moveSelectedNodes(bm[e.key], e.shiftKey ? 4 : 1));
	}
	var s = H(), c = F(s), l = (e) => {
		var s = Eh();
		let c;
		Th(P(s), {
			width: "100%",
			height: "100%",
			x: 0,
			y: 0
		}), D(s), Ii(s, (e, t) => rh?.(e, t), () => ({
			disabled: !1,
			store: t.store,
			onDrag: (e, n, r, i) => {
				t.onnodedrag?.({
					event: e,
					targetNode: null,
					nodes: i
				});
			},
			onDragStart: (e, n, r, i) => {
				t.onnodedragstart?.({
					event: e,
					targetNode: null,
					nodes: i
				});
			},
			onDragStop: (e, n, r, i) => {
				t.onnodedragstop?.({
					event: e,
					targetNode: null,
					nodes: i
				});
			}
		})), Ea(s, (e) => N(n, e), () => z(n)), R((e, n) => {
			J(s, 1, Bi(["svelte-flow__selection-wrapper", t.store.noPanClass]), "svelte-sf2y5e"), Y(s, "role", t.store.disableKeyboardA11y ? void 0 : "button"), Y(s, "tabindex", t.store.disableKeyboardA11y ? void 0 : -1), c = qi(s, "", c, {
				width: e,
				height: n,
				transform: `translate(${z(r).x ?? ""}px, ${z(r).y ?? ""}px)`
			});
		}, [() => ym(z(r).width), () => ym(z(r).height)]), B("contextmenu", s, i), B("click", s, a), B("keydown", s, function(...e) {
			(t.store.disableKeyboardA11y ? void 0 : o)?.apply(this, e);
		}), U(e, s);
	}, u = /* @__PURE__ */ j(() => t.store.selectionRectMode === "nodes" && z(r) && nf(z(r).x) && nf(z(r).y));
	G(c, (e) => {
		z(u) && e(l);
	}), U(e, s), A();
}
Hr([
	"contextmenu",
	"click",
	"keydown"
]);
//#endregion
//#region node_modules/@svelte-put/shortcut/src/shortcut.js
function Oh(e) {
	switch (e) {
		case "none": return 0;
		case "ctrl": return 8;
		case "shift": return 4;
		case "alt": return 2;
		case "meta": return 1;
	}
}
function kh(e, t) {
	let { enabled: n = !0, trigger: r, type: i = "keydown" } = t;
	function a(t) {
		let n = Array.isArray(r) ? r : [r], i = [
			t.metaKey,
			t.altKey,
			t.shiftKey,
			t.ctrlKey
		].reduce((e, t, n) => t ? e | 1 << n : e, 0);
		for (let r of n) {
			let n = {
				preventDefault: !1,
				enabled: !0,
				...r
			}, { modifier: a, key: o, code: s, callback: c, preventDefault: l, enabled: u } = n;
			if (!o && !s && console.warn("[svelte-put/shortcut] Trigger should have either `key` or `code`, a trigger missing both was detected! Check your configuration"), u && (o || s)) {
				if (s && t.code !== s || o && t.key !== o) continue;
				if (a === null || a === !1) {
					if (i !== 0) continue;
				} else if (a !== void 0 && a?.[0]?.length > 0) {
					let e = Array.isArray(a) ? a : [a], t = !1;
					for (let n of e) if ((Array.isArray(n) ? n : [n]).reduce((e, t) => e | Oh(t), 0) === i) {
						t = !0;
						break;
					}
					if (!t) continue;
				}
				l && t.preventDefault();
				let r = {
					node: e,
					trigger: n,
					originalEvent: t
				};
				e.dispatchEvent(new CustomEvent("shortcut", { detail: r })), c?.(r);
			}
		}
	}
	let o;
	return n && (o = Br(e, i, a)), {
		update: (t) => {
			let { enabled: s = !0, type: c = "keydown" } = t;
			n && (!s || i !== c) ? o?.() : !n && s && (o = Br(e, c, a)), n = s, i = c, r = t.trigger;
		},
		destroy: () => {
			o?.();
		}
	};
}
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/hooks/useSvelteFlow.svelte.js
function Ah() {
	let e = /* @__PURE__ */ j(Wm), t = (t) => {
		let n = _m(t) ? t : z(e).nodeLookup.get(t.id), r = n.parentId ? gf(n.position, n.measured, n.parentId, z(e).nodeLookup, z(e).nodeOrigin) : n.position;
		return Xd({
			...n,
			position: r,
			width: n.measured?.width ?? n.width,
			height: n.measured?.height ?? n.height
		});
	};
	function n(t, n, r = { replace: !1 }) {
		z(e).nodes = Nr(() => z(e).nodes).map((e) => {
			if (e.id === t) {
				let t = typeof n == "function" ? n(e) : n;
				return r?.replace && _m(t) ? t : {
					...e,
					...t
				};
			}
			return e;
		});
	}
	function r(t, n, r = { replace: !1 }) {
		z(e).edges = Nr(() => z(e).edges).map((e) => {
			if (e.id === t) {
				let t = typeof n == "function" ? n(e) : n;
				return r.replace && vm(t) ? t : {
					...e,
					...t
				};
			}
			return e;
		});
	}
	let i = (t) => z(e).nodeLookup.get(t);
	return {
		zoomIn: z(e).zoomIn,
		zoomOut: z(e).zoomOut,
		getInternalNode: i,
		getNode: (e) => i(e)?.internals.userNode,
		getNodes: (t) => t === void 0 ? z(e).nodes : jh(z(e).nodeLookup, t),
		getEdge: (t) => z(e).edgeLookup.get(t),
		getEdges: (t) => t === void 0 ? z(e).edges : jh(z(e).edgeLookup, t),
		setZoom: async (t, n) => {
			let r = z(e).panZoom;
			return r ? r.scaleTo(t, n) : !1;
		},
		getZoom: () => z(e).viewport.zoom,
		setViewport: async (t, n) => {
			let r = z(e).viewport;
			return z(e).panZoom ? (await z(e).panZoom.setViewport({
				x: t.x ?? r.x,
				y: t.y ?? r.y,
				zoom: t.zoom ?? r.zoom
			}, n), !0) : !1;
		},
		getViewport: () => Ze(z(e).viewport),
		setCenter: async (t, n, r) => z(e).setCenter(t, n, r),
		fitView: (t) => z(e).fitView(t),
		fitBounds: async (t, n) => {
			if (!z(e).panZoom) return !1;
			let r = df(t, z(e).width, z(e).height, z(e).minZoom, z(e).maxZoom, n?.padding ?? .1);
			return await z(e).panZoom.setViewport(r, {
				duration: n?.duration,
				ease: n?.ease,
				interpolate: n?.interpolate
			}), !0;
		},
		getIntersectingNodes: (n, r = !0, i) => {
			let a = tf(n), o = a ? n : t(n);
			return o ? (i || z(e).nodes).filter((t) => {
				let i = z(e).nodeLookup.get(t.id);
				if (!i || !a && t.id === n.id) return !1;
				let s = Xd(i), c = ef(s, o);
				return r && c > 0 || c >= s.width * s.height || c >= o.width * o.height;
			}) : [];
		},
		isNodeIntersecting: (e, n, r = !0) => {
			let i = tf(e) ? e : t(e);
			if (!i) return !1;
			let a = ef(i, n);
			return r && a > 0 || a >= n.width * n.height || a >= i.width * i.height;
		},
		deleteElements: async ({ nodes: t = [], edges: n = [] }) => {
			let { nodes: r, edges: i } = await Vd({
				nodesToRemove: t,
				edgesToRemove: n,
				nodes: z(e).nodes,
				edges: z(e).edges,
				onBeforeDelete: z(e).onbeforedelete
			});
			return r && (z(e).nodes = Nr(() => z(e).nodes).filter((e) => !r.some(({ id: t }) => t === e.id))), i && (z(e).edges = Nr(() => z(e).edges).filter((e) => !i.some(({ id: t }) => t === e.id))), (r.length > 0 || i.length > 0) && z(e).ondelete?.({
				nodes: r,
				edges: i
			}), {
				deletedNodes: r,
				deletedEdges: i
			};
		},
		screenToFlowPosition: (t, n = { snapToGrid: !0 }) => {
			if (!z(e).domNode) return t;
			let r = n.snapToGrid ? z(e).snapGrid : !1, { x: i, y: a, zoom: o } = z(e).viewport, { x: s, y: c } = z(e).domNode.getBoundingClientRect();
			return of({
				x: t.x - s,
				y: t.y - c
			}, [
				i,
				a,
				o
			], r !== null, r || [1, 1]);
		},
		flowToScreenPosition: (t) => {
			if (!z(e).domNode) return t;
			let { x: n, y: r, zoom: i } = z(e).viewport, { x: a, y: o } = z(e).domNode.getBoundingClientRect(), s = sf(t, [
				n,
				r,
				i
			]);
			return {
				x: s.x + a,
				y: s.y + o
			};
		},
		toObject: () => structuredClone({
			nodes: [...z(e).nodes],
			edges: [...z(e).edges],
			viewport: { ...z(e).viewport }
		}),
		updateNode: n,
		updateNodeData: (t, r, i) => {
			let a = z(e).nodeLookup.get(t)?.internals.userNode;
			if (!a) return;
			let o = typeof r == "function" ? r(a) : r;
			n(t, (e) => ({
				...e,
				data: i?.replace ? o : {
					...e.data,
					...o
				}
			}));
		},
		updateEdge: r,
		getNodesBounds: (t) => Pd(t, {
			nodeLookup: z(e).nodeLookup,
			nodeOrigin: z(e).nodeOrigin
		}),
		getHandleConnections: ({ type: t, id: n, nodeId: r }) => Array.from(z(e).connectionLookup.get(`${r}-${t}-${n ?? null}`)?.values() ?? [])
	};
}
function jh(e, t) {
	let n = [];
	for (let r of t) {
		let t = e.get(r);
		if (t) {
			let e = "internals" in t ? t.internals?.userNode : t;
			n.push(e);
		}
	}
	return n;
}
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/components/KeyHandler/KeyHandler.svelte
function Mh(e, t) {
	k(t, !0);
	let n = Q(t, "store", 15), r = Q(t, "selectionKey", 3, "Shift"), i = Q(t, "multiSelectionKey", 19, () => ff() ? "Meta" : "Control"), a = Q(t, "deleteKey", 3, "Backspace"), o = Q(t, "panActivationKey", 3, " "), s = Q(t, "zoomActivationKey", 19, () => ff() ? "Meta" : "Control"), { deleteElements: c } = Ah();
	function l(e) {
		return typeof e == "object" && !!e;
	}
	function u(e) {
		return l(e) && e.modifier || [];
	}
	function d(e) {
		return e == null ? "" : l(e) ? e.key : e;
	}
	function f(e, t) {
		return (Array.isArray(e) ? e : [e]).map((e) => {
			let n = d(e);
			return {
				key: n,
				modifier: u(e),
				enabled: n !== null,
				callback: t
			};
		});
	}
	function p() {
		n(n().selectionRect = null, !0), n(n().selectionKeyPressed = !1, !0), n(n().multiselectionKeyPressed = !1, !0), n(n().deleteKeyPressed = !1, !0), n(n().panActivationKeyPressed = !1, !0), n(n().zoomActivationKeyPressed = !1, !0);
	}
	function m() {
		let e = n().nodes.filter((e) => e.selected), t = n().edges.filter((e) => e.selected);
		c({
			nodes: e,
			edges: t
		});
	}
	Vr("blur", gn, p), Vr("contextmenu", gn, p), Ii(gn, (e, t) => kh?.(e, t), () => ({
		trigger: f(r(), () => n(n().selectionKeyPressed = !0, !0)),
		type: "keydown"
	})), Ii(gn, (e, t) => kh?.(e, t), () => ({
		trigger: f(r(), () => n(n().selectionKeyPressed = !1, !0)),
		type: "keyup"
	})), Ii(gn, (e, t) => kh?.(e, t), () => ({
		trigger: f(i(), () => {
			n(n().multiselectionKeyPressed = !0, !0);
		}),
		type: "keydown"
	})), Ii(gn, (e, t) => kh?.(e, t), () => ({
		trigger: f(i(), () => n(n().multiselectionKeyPressed = !1, !0)),
		type: "keyup"
	})), Ii(gn, (e, t) => kh?.(e, t), () => ({
		trigger: f(a(), (e) => {
			!(e.originalEvent.ctrlKey || e.originalEvent.metaKey || e.originalEvent.shiftKey) && !Tf(e.originalEvent) && (n(n().deleteKeyPressed = !0, !0), m());
		}),
		type: "keydown"
	})), Ii(gn, (e, t) => kh?.(e, t), () => ({
		trigger: f(a(), () => n(n().deleteKeyPressed = !1, !0)),
		type: "keyup"
	})), Ii(gn, (e, t) => kh?.(e, t), () => ({
		trigger: f(o(), () => n(n().panActivationKeyPressed = !0, !0)),
		type: "keydown"
	})), Ii(gn, (e, t) => kh?.(e, t), () => ({
		trigger: f(o(), () => n(n().panActivationKeyPressed = !1, !0)),
		type: "keyup"
	})), Ii(gn, (e, t) => kh?.(e, t), () => ({
		trigger: f(s(), () => n(n().zoomActivationKeyPressed = !0, !0)),
		type: "keydown"
	})), Ii(gn, (e, t) => kh?.(e, t), () => ({
		trigger: f(s(), () => n(n().zoomActivationKeyPressed = !1, !0)),
		type: "keyup"
	})), A();
}
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/components/ConnectionLine/ConnectionLine.svelte
var Nh = /* @__PURE__ */ Zr("<path fill=\"none\" class=\"svelte-flow__connection-path\"></path>"), Ph = /* @__PURE__ */ Zr("<svg class=\"svelte-flow__connectionline\"><g><!></g></svg>");
function Fh(e, t) {
	k(t, !0);
	let n = /* @__PURE__ */ j(() => {
		if (!t.store.connection.inProgress) return "";
		let e = {
			sourceX: t.store.connection.from.x,
			sourceY: t.store.connection.from.y,
			sourcePosition: t.store.connection.fromPosition,
			targetX: t.store.connection.to.x,
			targetY: t.store.connection.to.y,
			targetPosition: t.store.connection.toPosition
		};
		switch (t.type) {
			case Ed.Bezier: {
				let [t] = Mf(e);
				return t;
			}
			case Ed.Straight: {
				let [t] = zf(e);
				return t;
			}
			case Ed.Step:
			case Ed.SmoothStep: {
				let [n] = Gf({
					...e,
					borderRadius: t.type === Ed.Step ? 0 : void 0
				});
				return n;
			}
		}
	});
	var r = H(), i = F(r), a = (e) => {
		var r = Ph(), i = P(r), a = P(i), o = (e) => {
			var n = H();
			Pi(F(n), () => t.LineComponent, (e, t) => {
				t(e, {});
			}), U(e, n);
		}, s = (e) => {
			var r = Nh();
			R(() => {
				Y(r, "d", z(n)), qi(r, t.style);
			}), U(e, r);
		};
		G(a, (e) => {
			t.LineComponent ? e(o) : e(s, -1);
		}), D(i), D(r), R((e) => {
			Y(r, "width", t.store.width), Y(r, "height", t.store.height), qi(r, t.containerStyle), J(i, 0, e);
		}, [() => Bi(["svelte-flow__connection", bf(t.store.connection.isValid)])]), U(e, r);
	};
	G(i, (e) => {
		t.store.connection.inProgress && e(a);
	}), U(e, r), A();
}
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/container/Panel/Panel.svelte
var Ih = /* @__PURE__ */ new Set([
	"$$slots",
	"$$events",
	"$$legacy",
	"position",
	"style",
	"class",
	"children"
]), Lh = /* @__PURE__ */ V("<div><!></div>");
function Rh(e, t) {
	k(t, !0);
	let n = Q(t, "position", 3, "top-right"), r = /* @__PURE__ */ Ma(t, Ih), i = /* @__PURE__ */ j(() => `${n()}`.split("-"));
	var a = Lh();
	ha(a, (e) => ({
		class: e,
		style: t.style,
		...r
	}), [() => [
		"svelte-flow__panel",
		t.class,
		...z(i)
	]]), vi(P(a), () => t.children ?? g), D(a), U(e, a), A();
}
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/components/Attribution/Attribution.svelte
var zh = /* @__PURE__ */ V("<a target=\"_blank\" rel=\"noopener noreferrer\" aria-label=\"Svelte Flow attribution\">Svelte Flow</a>");
function Bh(e, t) {
	k(t, !0);
	let n = Q(t, "position", 3, "bottom-right"), r = "https://svelteflow.dev?utm_source=attribution";
	var i = H(), a = F(i), o = (e) => {
		{
			let t = /* @__PURE__ */ j(() => `Please only hide this attribution when you are subscribed to Svelte Flow Pro: ${r}`);
			Rh(e, {
				get position() {
					return n();
				},
				class: "svelte-flow__attribution",
				get "data-message"() {
					return z(t);
				},
				children: (e, t) => {
					var n = zh();
					R(() => Y(n, "href", r)), U(e, n);
				},
				$$slots: { default: !0 }
			});
		}
	};
	G(a, (e) => {
		t.proOptions?.hideAttribution || e(o);
	}), U(e, i), A();
}
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/container/SvelteFlow/Wrapper.svelte
var Vh = /* @__PURE__ */ V("<div><!></div>");
function Hh(e, t) {
	k(t, !0);
	let n = Q(t, "domNode", 15), r = Q(t, "clientWidth", 15), i = Q(t, "clientHeight", 15), a = /* @__PURE__ */ j(() => t.rest.class), o = /* @__PURE__ */ j(() => S(t.rest, /* @__PURE__ */ "id.class.nodeTypes.edgeTypes.colorMode.isValidConnection.onmove.onmovestart.onmoveend.onflowerror.ondelete.onbeforedelete.onbeforeconnect.onconnect.onconnectstart.onconnectend.onbeforereconnect.onreconnect.onreconnectstart.onreconnectend.onclickconnectstart.onclickconnectend.oninit.onselectionchange.onselectiondragstart.onselectiondrag.onselectiondragstop.onselectionstart.onselectionend.clickConnect.fitView.fitViewOptions.nodeOrigin.nodeDragThreshold.connectionDragThreshold.minZoom.maxZoom.initialViewport.connectionRadius.connectionMode.selectionMode.selectNodesOnDrag.snapGrid.defaultMarkerColor.translateExtent.nodeExtent.onlyRenderVisibleElements.autoPanOnConnect.autoPanOnNodeDrag.colorModeSSR.defaultEdgeOptions.elevateNodesOnSelect.elevateEdgesOnSelect.nodesDraggable.autoPanOnNodeFocus.nodesConnectable.elementsSelectable.nodesFocusable.edgesFocusable.disableKeyboardA11y.noDragClass.noPanClass.noWheelClass.ariaLabelConfig.autoPanSpeed.panOnScrollSpeed.zIndexMode.autoPanOnSelection".split(".")));
	function s(e) {
		e.currentTarget.scrollTo({
			top: 0,
			left: 0,
			behavior: "auto"
		}), t.rest.onscroll && t.rest.onscroll(e);
	}
	var c = Vh();
	ha(c, (e, n) => ({
		class: [
			"svelte-flow",
			"svelte-flow__container",
			t.colorMode,
			z(a)
		],
		"data-testid": "svelte-flow__wrapper",
		role: "application",
		onscroll: s,
		...z(o),
		[ra]: {
			width: e,
			height: n
		}
	}), [() => ym(t.width), () => ym(t.height)], void 0, void 0, "svelte-mkap6j"), vi(P(c), () => t.children ?? g), D(c), Ea(c, (e) => n(e), () => n()), wa(c, "clientHeight", i), wa(c, "clientWidth", r), U(e, c), A();
}
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/container/SvelteFlow/SvelteFlow.svelte
var Uh = /* @__PURE__ */ new Set(/* @__PURE__ */ "$$slots.$$events.$$legacy.width.height.proOptions.selectionKey.deleteKey.panActivationKey.multiSelectionKey.zoomActivationKey.paneClickDistance.nodeClickDistance.onmovestart.onmoveend.onmove.oninit.onnodeclick.onnodecontextmenu.onnodedrag.onnodedragstart.onnodedragstop.onnodepointerenter.onnodepointermove.onnodepointerleave.onselectionclick.onselectioncontextmenu.onselectionstart.onselectionend.onedgeclick.onedgecontextmenu.onedgepointerenter.onedgepointerleave.onpaneclick.onpanecontextmenu.panOnScrollMode.preventScrolling.zoomOnScroll.zoomOnDoubleClick.zoomOnPinch.panOnScroll.panOnScrollSpeed.panOnDrag.selectionOnDrag.autoPanOnSelection.connectionLineComponent.connectionLineStyle.connectionLineContainerStyle.connectionLineType.attributionPosition.children.nodes.edges.viewport".split(".")), Wh = /* @__PURE__ */ V("<div class=\"svelte-flow__viewport-back svelte-flow__container\"></div> <!> <div class=\"svelte-flow__edge-labels svelte-flow__container\"></div> <!> <!> <!> <div class=\"svelte-flow__viewport-front svelte-flow__container\"></div>", 1), Gh = /* @__PURE__ */ V("<!> <!>", 1), Kh = /* @__PURE__ */ V("<!> <!> <!> <!> <!>", 1);
function qh(e, t) {
	k(t, !0);
	let n = Q(t, "paneClickDistance", 3, 1), r = Q(t, "nodeClickDistance", 3, 1), i = Q(t, "panOnScrollMode", 19, () => Cd.Free), a = Q(t, "preventScrolling", 3, !0), o = Q(t, "zoomOnScroll", 3, !0), s = Q(t, "zoomOnDoubleClick", 3, !0), c = Q(t, "zoomOnPinch", 3, !0), l = Q(t, "panOnScroll", 3, !1), u = Q(t, "panOnScrollSpeed", 3, .5), d = Q(t, "panOnDrag", 3, !0), f = Q(t, "selectionOnDrag", 3, !1), p = Q(t, "autoPanOnSelection", 3, !0), m = Q(t, "connectionLineType", 19, () => Ed.Bezier), h = Q(t, "nodes", 31, () => pn([])), _ = Q(t, "edges", 31, () => pn([])), v = Q(t, "viewport", 15, void 0), y = /* @__PURE__ */ Ma(t, Uh), b = Km({
		props: y,
		width: t.width,
		height: t.height,
		get nodes() {
			return h();
		},
		set nodes(e) {
			h(e);
		},
		get edges() {
			return _();
		},
		set edges(e) {
			_(e);
		},
		get viewport() {
			return v();
		},
		set viewport(e) {
			v(e);
		}
	}), x = rt(Gm);
	x && x.setStore && x.setStore(b), it(Gm, {
		provider: !1,
		getStore() {
			return b;
		}
	}), Fn(() => {
		let e = {
			nodes: b.selectedNodes,
			edges: b.selectedEdges
		};
		Nr(() => t.onselectionchange)?.(e);
		for (let t of b.selectionChangeHandlers.values()) t(e);
	}), bi(() => {
		x?.setStore(Km({
			width: 0,
			height: 0,
			nodes: [],
			edges: [],
			props: {}
		}));
	}), Hh(e, {
		get colorMode() {
			return b.colorMode;
		},
		get width() {
			return t.width;
		},
		get height() {
			return t.height;
		},
		get rest() {
			return y;
		},
		get domNode() {
			return b.domNode;
		},
		set domNode(e) {
			b.domNode = e;
		},
		get clientWidth() {
			return b.width;
		},
		set clientWidth(e) {
			b.width = e;
		},
		get clientHeight() {
			return b.height;
		},
		set clientHeight(e) {
			b.height = e;
		},
		children: (e, h) => {
			var _ = Kh(), v = F(_);
			Mh(v, {
				get selectionKey() {
					return t.selectionKey;
				},
				get deleteKey() {
					return t.deleteKey;
				},
				get panActivationKey() {
					return t.panActivationKey;
				},
				get multiSelectionKey() {
					return t.multiSelectionKey;
				},
				get zoomActivationKey() {
					return t.zoomActivationKey;
				},
				get store() {
					return b;
				},
				set store(e) {
					b = e;
				}
			});
			var y = L(v, 2);
			Ym(y, {
				get panOnScrollMode() {
					return i();
				},
				get preventScrolling() {
					return a();
				},
				get zoomOnScroll() {
					return o();
				},
				get zoomOnDoubleClick() {
					return s();
				},
				get zoomOnPinch() {
					return c();
				},
				get panOnScroll() {
					return l();
				},
				get panOnScrollSpeed() {
					return u();
				},
				get panOnDrag() {
					return d();
				},
				get paneClickDistance() {
					return n();
				},
				get selectionOnDrag() {
					return f();
				},
				get onmovestart() {
					return t.onmovestart;
				},
				get onmove() {
					return t.onmove;
				},
				get onmoveend() {
					return t.onmoveend;
				},
				get oninit() {
					return t.oninit;
				},
				get store() {
					return b;
				},
				set store(e) {
					b = e;
				},
				children: (e, i) => {
					eh(e, {
						get onpaneclick() {
							return t.onpaneclick;
						},
						get onpanecontextmenu() {
							return t.onpanecontextmenu;
						},
						get onselectionstart() {
							return t.onselectionstart;
						},
						get onselectionend() {
							return t.onselectionend;
						},
						get panOnDrag() {
							return d();
						},
						get paneClickDistance() {
							return n();
						},
						get selectionOnDrag() {
							return f();
						},
						get autoPanOnSelection() {
							return p();
						},
						get store() {
							return b;
						},
						set store(e) {
							b = e;
						},
						children: (e, n) => {
							var i = Gh(), a = F(i);
							nh(a, {
								get store() {
									return b;
								},
								set store(e) {
									b = e;
								},
								children: (e, n) => {
									var i = Wh(), a = L(F(i), 2);
									Ch(a, {
										get onedgeclick() {
											return t.onedgeclick;
										},
										get onedgecontextmenu() {
											return t.onedgecontextmenu;
										},
										get onedgepointerenter() {
											return t.onedgepointerenter;
										},
										get onedgepointerleave() {
											return t.onedgepointerleave;
										},
										get store() {
											return b;
										},
										set store(e) {
											b = e;
										}
									});
									var o = L(a, 4);
									Fh(o, {
										get type() {
											return m();
										},
										get LineComponent() {
											return t.connectionLineComponent;
										},
										get containerStyle() {
											return t.connectionLineContainerStyle;
										},
										get style() {
											return t.connectionLineStyle;
										},
										get store() {
											return b;
										},
										set store(e) {
											b = e;
										}
									});
									var s = L(o, 2);
									ph(s, {
										get nodeClickDistance() {
											return r();
										},
										get onnodeclick() {
											return t.onnodeclick;
										},
										get onnodecontextmenu() {
											return t.onnodecontextmenu;
										},
										get onnodepointerenter() {
											return t.onnodepointerenter;
										},
										get onnodepointermove() {
											return t.onnodepointermove;
										},
										get onnodepointerleave() {
											return t.onnodepointerleave;
										},
										get onnodedrag() {
											return t.onnodedrag;
										},
										get onnodedragstart() {
											return t.onnodedragstart;
										},
										get onnodedragstop() {
											return t.onnodedragstop;
										},
										get store() {
											return b;
										},
										set store(e) {
											b = e;
										}
									}), Dh(L(s, 2), {
										get onselectionclick() {
											return t.onselectionclick;
										},
										get onselectioncontextmenu() {
											return t.onselectioncontextmenu;
										},
										get onnodedrag() {
											return t.onnodedrag;
										},
										get onnodedragstart() {
											return t.onnodedragstart;
										},
										get onnodedragstop() {
											return t.onnodedragstop;
										},
										get store() {
											return b;
										},
										set store(e) {
											b = e;
										}
									}), O(2), U(e, i);
								},
								$$slots: { default: !0 }
							});
							var o = L(a, 2);
							{
								let e = /* @__PURE__ */ j(() => !!(b.selectionRect && b.selectionRectMode === "user")), t = /* @__PURE__ */ j(() => b.selectionRect?.width), n = /* @__PURE__ */ j(() => b.selectionRect?.height), r = /* @__PURE__ */ j(() => b.selectionRect?.x), i = /* @__PURE__ */ j(() => b.selectionRect?.y);
								Th(o, {
									get isVisible() {
										return z(e);
									},
									get width() {
										return z(t);
									},
									get height() {
										return z(n);
									},
									get x() {
										return z(r);
									},
									get y() {
										return z(i);
									}
								});
							}
							U(e, i);
						},
						$$slots: { default: !0 }
					});
				},
				$$slots: { default: !0 }
			});
			var x = L(y, 2);
			Bh(x, {
				get proOptions() {
					return t.proOptions;
				},
				get position() {
					return t.attributionPosition;
				}
			});
			var S = L(x, 2);
			oh(S, { get store() {
				return b;
			} }), vi(L(S, 2), () => t.children ?? g), U(e, _);
		},
		$$slots: { default: !0 }
	}), A();
}
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/components/SvelteFlowProvider/SvelteFlowProvider.svelte
function Jh(e, t) {
	k(t, !0);
	let n = /* @__PURE__ */ M(Km({
		props: {},
		nodes: [],
		edges: []
	}));
	it(Gm, {
		provider: !0,
		getStore() {
			return z(n);
		},
		setStore: (e) => {
			N(n, e);
		}
	}), bi(() => {
		z(n).reset();
	});
	var r = H();
	vi(F(r), () => t.children ?? g), U(e, r), A();
}
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/plugins/Controls/ControlButton.svelte
var Yh = /* @__PURE__ */ new Set([
	"$$slots",
	"$$events",
	"$$legacy",
	"class",
	"bgColor",
	"bgColorHover",
	"color",
	"colorHover",
	"borderColor",
	"onclick",
	"children"
]), Xh = /* @__PURE__ */ V("<button><!></button>");
function Zh(e, t) {
	let n = /* @__PURE__ */ Ma(t, Yh);
	var r = Xh();
	ha(r, () => ({
		type: "button",
		onclick: t.onclick,
		class: ["svelte-flow__controls-button", t.class],
		...n,
		[ra]: {
			"--xy-controls-button-background-color-props": t.bgColor,
			"--xy-controls-button-background-color-hover-props": t.bgColorHover,
			"--xy-controls-button-color-props": t.color,
			"--xy-controls-button-color-hover-props": t.colorHover,
			"--xy-controls-button-border-color-props": t.borderColor
		}
	})), vi(P(r), () => t.children ?? g), D(r), U(e, r);
}
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/plugins/Controls/Icons/Plus.svelte
var Qh = /* @__PURE__ */ Zr("<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 32 32\"><path d=\"M32 18.133H18.133V32h-4.266V18.133H0v-4.266h13.867V0h4.266v13.867H32z\"></path></svg>");
function $h(e) {
	U(e, Qh());
}
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/plugins/Controls/Icons/Minus.svelte
var eg = /* @__PURE__ */ Zr("<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 32 5\"><path d=\"M0 0h32v4.2H0z\"></path></svg>");
function tg(e) {
	U(e, eg());
}
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/plugins/Controls/Icons/Fit.svelte
var ng = /* @__PURE__ */ Zr("<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 32 30\"><path d=\"M3.692 4.63c0-.53.4-.938.939-.938h5.215V0H4.708C2.13 0 0 2.054 0 4.63v5.216h3.692V4.631zM27.354 0h-5.2v3.692h5.17c.53 0 .984.4.984.939v5.215H32V4.631A4.624 4.624 0 0027.354 0zm.954 24.83c0 .532-.4.94-.939.94h-5.215v3.768h5.215c2.577 0 4.631-2.13 4.631-4.707v-5.139h-3.692v5.139zm-23.677.94c-.531 0-.939-.4-.939-.94v-5.138H0v5.139c0 2.577 2.13 4.707 4.708 4.707h5.138V25.77H4.631z\"></path></svg>");
function rg(e) {
	U(e, ng());
}
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/plugins/Controls/Icons/Lock.svelte
var ig = /* @__PURE__ */ Zr("<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 25 32\"><path d=\"M21.333 10.667H19.81V7.619C19.81 3.429 16.38 0 12.19 0 8 0 4.571 3.429 4.571 7.619v3.048H3.048A3.056 3.056 0 000 13.714v15.238A3.056 3.056 0 003.048 32h18.285a3.056 3.056 0 003.048-3.048V13.714a3.056 3.056 0 00-3.048-3.047zM12.19 24.533a3.056 3.056 0 01-3.047-3.047 3.056 3.056 0 013.047-3.048 3.056 3.056 0 013.048 3.048 3.056 3.056 0 01-3.048 3.047zm4.724-13.866H7.467V7.619c0-2.59 2.133-4.724 4.723-4.724 2.591 0 4.724 2.133 4.724 4.724v3.048z\"></path></svg>");
function ag(e) {
	U(e, ig());
}
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/plugins/Controls/Icons/Unlock.svelte
var og = /* @__PURE__ */ Zr("<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 25 32\"><path d=\"M21.333 10.667H19.81V7.619C19.81 3.429 16.38 0 12.19 0c-4.114 1.828-1.37 2.133.305 2.438 1.676.305 4.42 2.59 4.42 5.181v3.048H3.047A3.056 3.056 0 000 13.714v15.238A3.056 3.056 0 003.048 32h18.285a3.056 3.056 0 003.048-3.048V13.714a3.056 3.056 0 00-3.048-3.047zM12.19 24.533a3.056 3.056 0 01-3.047-3.047 3.056 3.056 0 013.047-3.048 3.056 3.056 0 013.048 3.048 3.056 3.056 0 01-3.048 3.047z\"></path></svg>");
function sg(e) {
	U(e, og());
}
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/plugins/Controls/Controls.svelte
var cg = /* @__PURE__ */ new Set([
	"$$slots",
	"$$events",
	"$$legacy",
	"position",
	"orientation",
	"showZoom",
	"showFitView",
	"showLock",
	"style",
	"class",
	"buttonBgColor",
	"buttonBgColorHover",
	"buttonColor",
	"buttonColorHover",
	"buttonBorderColor",
	"fitViewOptions",
	"children",
	"before",
	"after"
]), lg = /* @__PURE__ */ V("<!> <!>", 1), ug = /* @__PURE__ */ V("<!> <!> <!> <!> <!> <!>", 1);
function dg(e, t) {
	k(t, !0);
	let n = Q(t, "position", 3, "bottom-left"), r = Q(t, "orientation", 3, "vertical"), i = Q(t, "showZoom", 3, !0), a = Q(t, "showFitView", 3, !0), o = Q(t, "showLock", 3, !0), s = /* @__PURE__ */ Ma(t, cg), c = /* @__PURE__ */ j(Wm), l = /* @__PURE__ */ j(() => ({
		bgColor: t.buttonBgColor,
		bgColorHover: t.buttonBgColorHover,
		color: t.buttonColor,
		colorHover: t.buttonColorHover,
		borderColor: t.buttonBorderColor
	})), u = /* @__PURE__ */ j(() => z(c).nodesDraggable || z(c).nodesConnectable || z(c).elementsSelectable), d = /* @__PURE__ */ j(() => z(c).viewport.zoom <= z(c).minZoom), f = /* @__PURE__ */ j(() => z(c).viewport.zoom >= z(c).maxZoom), p = /* @__PURE__ */ j(() => z(c).ariaLabelConfig), m = /* @__PURE__ */ j(() => r() === "horizontal" ? "horizontal" : "vertical"), h = () => {
		z(c).zoomIn();
	}, g = () => {
		z(c).zoomOut();
	}, _ = () => {
		z(c).fitView(t.fitViewOptions);
	}, v = () => {
		let e = !z(u);
		z(c).nodesDraggable = e, z(c).nodesConnectable = e, z(c).elementsSelectable = e;
	};
	{
		let r = /* @__PURE__ */ j(() => [
			"svelte-flow__controls",
			z(m),
			t.class
		]);
		Rh(e, Z({
			get class() {
				return z(r);
			},
			get position() {
				return n();
			},
			"data-testid": "svelte-flow__controls",
			get "aria-label"() {
				return z(p)["controls.ariaLabel"];
			},
			get style() {
				return t.style;
			}
		}, () => s, {
			children: (e, n) => {
				var r = ug(), s = F(r), c = (e) => {
					var n = H();
					vi(F(n), () => t.before), U(e, n);
				};
				G(s, (e) => {
					t.before && e(c);
				});
				var m = L(s, 2), y = (e) => {
					var t = lg(), n = F(t);
					Zh(n, Z({
						onclick: h,
						class: "svelte-flow__controls-zoomin",
						get title() {
							return z(p)["controls.zoomIn.ariaLabel"];
						},
						get "aria-label"() {
							return z(p)["controls.zoomIn.ariaLabel"];
						},
						get disabled() {
							return z(f);
						}
					}, () => z(l), {
						children: (e, t) => {
							$h(e, {});
						},
						$$slots: { default: !0 }
					})), Zh(L(n, 2), Z({
						onclick: g,
						class: "svelte-flow__controls-zoomout",
						get title() {
							return z(p)["controls.zoomOut.ariaLabel"];
						},
						get "aria-label"() {
							return z(p)["controls.zoomOut.ariaLabel"];
						},
						get disabled() {
							return z(d);
						}
					}, () => z(l), {
						children: (e, t) => {
							tg(e, {});
						},
						$$slots: { default: !0 }
					})), U(e, t);
				};
				G(m, (e) => {
					i() && e(y);
				});
				var b = L(m, 2), x = (e) => {
					Zh(e, Z({
						class: "svelte-flow__controls-fitview",
						onclick: _,
						get title() {
							return z(p)["controls.fitView.ariaLabel"];
						},
						get "aria-label"() {
							return z(p)["controls.fitView.ariaLabel"];
						}
					}, () => z(l), {
						children: (e, t) => {
							rg(e, {});
						},
						$$slots: { default: !0 }
					}));
				};
				G(b, (e) => {
					a() && e(x);
				});
				var S = L(b, 2), C = (e) => {
					Zh(e, Z({
						class: "svelte-flow__controls-interactive",
						onclick: v,
						get title() {
							return z(p)["controls.interactive.ariaLabel"];
						},
						get "aria-label"() {
							return z(p)["controls.interactive.ariaLabel"];
						}
					}, () => z(l), {
						children: (e, t) => {
							var n = H(), r = F(n), i = (e) => {
								sg(e, {});
							}, a = (e) => {
								ag(e, {});
							};
							G(r, (e) => {
								z(u) ? e(i) : e(a, -1);
							}), U(e, n);
						},
						$$slots: { default: !0 }
					}));
				};
				G(S, (e) => {
					o() && e(C);
				});
				var w = L(S, 2), T = (e) => {
					var n = H();
					vi(F(n), () => t.children), U(e, n);
				};
				G(w, (e) => {
					t.children && e(T);
				});
				var ee = L(w, 2), te = (e) => {
					var n = H();
					vi(F(n), () => t.after), U(e, n);
				};
				G(ee, (e) => {
					t.after && e(te);
				}), U(e, r);
			},
			$$slots: { default: !0 }
		}));
	}
	A();
}
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/plugins/Background/types.js
var fg;
(function(e) {
	e.Lines = "lines", e.Dots = "dots", e.Cross = "cross";
})(fg ||= {});
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/plugins/Background/DotPattern.svelte
var pg = /* @__PURE__ */ Zr("<circle></circle>");
function mg(e, t) {
	var n = pg();
	R(() => {
		Y(n, "cx", t.radius), Y(n, "cy", t.radius), Y(n, "r", t.radius), J(n, 0, Bi([
			"svelte-flow__background-pattern",
			"dots",
			t.class
		]));
	}), U(e, n);
}
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/plugins/Background/LinePattern.svelte
var hg = /* @__PURE__ */ Zr("<path></path>");
function gg(e, t) {
	k(t, !0);
	var n = hg();
	R(() => {
		Y(n, "stroke-width", t.lineWidth), Y(n, "d", `M${t.dimensions[0] / 2} 0 V${t.dimensions[1]} M0 ${t.dimensions[1] / 2} H${t.dimensions[0]}`), J(n, 0, Bi([
			"svelte-flow__background-pattern",
			t.variant,
			t.class
		]));
	}), U(e, n), A();
}
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/plugins/Background/Background.svelte
var _g = {
	[fg.Dots]: 1,
	[fg.Lines]: 1,
	[fg.Cross]: 6
}, vg = /* @__PURE__ */ Zr("<svg data-testid=\"svelte-flow__background\"><pattern patternUnits=\"userSpaceOnUse\"><!></pattern><rect x=\"0\" y=\"0\" width=\"100%\" height=\"100%\"></rect></svg>");
function yg(e, t) {
	k(t, !0);
	let n = Q(t, "variant", 19, () => fg.Dots), r = Q(t, "gap", 3, 20), i = Q(t, "lineWidth", 3, 1), a = /* @__PURE__ */ j(Wm), o = /* @__PURE__ */ j(() => n() === fg.Dots), s = /* @__PURE__ */ j(() => n() === fg.Cross), c = /* @__PURE__ */ j(() => Array.isArray(r()) ? r() : [r(), r()]), l = /* @__PURE__ */ j(() => `background-pattern-${z(a).flowId}-${t.id ?? ""}`), u = /* @__PURE__ */ j(() => [z(c)[0] * z(a).viewport.zoom || 1, z(c)[1] * z(a).viewport.zoom || 1]), d = /* @__PURE__ */ j(() => (t.size ?? _g[n()]) * z(a).viewport.zoom), f = /* @__PURE__ */ j(() => z(s) ? [z(d), z(d)] : z(u)), p = /* @__PURE__ */ j(() => z(o) ? [z(d) / 2, z(d) / 2] : [z(f)[0] / 2, z(f)[1] / 2]);
	var m = vg();
	let h;
	var g = P(m), _ = P(g), v = (e) => {
		{
			let n = /* @__PURE__ */ j(() => z(d) / 2);
			mg(e, {
				get radius() {
					return z(n);
				},
				get class() {
					return t.patternClass;
				}
			});
		}
	}, y = (e) => {
		gg(e, {
			get dimensions() {
				return z(f);
			},
			get variant() {
				return n();
			},
			get lineWidth() {
				return i();
			},
			get class() {
				return t.patternClass;
			}
		});
	};
	G(_, (e) => {
		z(o) ? e(v) : e(y, -1);
	}), D(g);
	var b = L(g);
	D(m), R(() => {
		J(m, 0, Bi([
			"svelte-flow__background",
			"svelte-flow__container",
			t.class
		])), h = qi(m, "", h, {
			"--xy-background-color-props": t.bgColor,
			"--xy-background-pattern-color-props": t.patternColor
		}), Y(g, "id", z(l)), Y(g, "x", z(a).viewport.x % z(u)[0]), Y(g, "y", z(a).viewport.y % z(u)[1]), Y(g, "width", z(u)[0]), Y(g, "height", z(u)[1]), Y(g, "patternTransform", `translate(-${z(p)[0]},-${z(p)[1]})`), Y(b, "fill", `url(#${z(l)})`);
	}), U(e, m), A();
}
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/hooks/useInternalNode.svelte.js
function bg(e) {
	let t = /* @__PURE__ */ j(Wm), n = /* @__PURE__ */ j(() => z(t).nodeLookup), r = /* @__PURE__ */ j(() => z(t).nodes), i = /* @__PURE__ */ j(() => (z(r), z(n).get(e)));
	return { get current() {
		return z(i);
	} };
}
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/plugins/Minimap/MinimapNode.svelte
var xg = /* @__PURE__ */ Zr("<rect></rect>");
function Sg(e, t) {
	k(t, !0);
	let n = Q(t, "borderRadius", 3, 5), r = Q(t, "strokeWidth", 3, 2), i = /* @__PURE__ */ j(() => bg(t.id)), a = /* @__PURE__ */ j(() => {
		if (!z(i).current) return {
			width: 0,
			height: 0,
			x: 0,
			y: 0
		};
		let { width: e, height: n } = mf(z(i).current);
		return {
			width: t.width ?? e,
			height: t.height ?? n,
			x: t.x ?? z(i).current.internals.positionAbsolute.x,
			y: t.y ?? z(i).current.internals.positionAbsolute.y
		};
	}), o = /* @__PURE__ */ j(() => z(a).width), s = /* @__PURE__ */ j(() => z(a).height), c = /* @__PURE__ */ j(() => z(a).x), l = /* @__PURE__ */ j(() => z(a).y);
	var u = H(), d = F(u), f = (e) => {
		let i = /* @__PURE__ */ j(() => t.nodeComponent);
		var a = H();
		Pi(F(a), () => z(i), (e, i) => {
			i(e, {
				get id() {
					return t.id;
				},
				get x() {
					return z(c);
				},
				get y() {
					return z(l);
				},
				get width() {
					return z(o);
				},
				get height() {
					return z(s);
				},
				get borderRadius() {
					return n();
				},
				get class() {
					return t.class;
				},
				get color() {
					return t.color;
				},
				get shapeRendering() {
					return t.shapeRendering;
				},
				get strokeColor() {
					return t.strokeColor;
				},
				get strokeWidth() {
					return r();
				},
				get selected() {
					return t.selected;
				}
			});
		}), U(e, a);
	}, p = (e) => {
		var i = xg();
		let a, u;
		R(() => {
			a = J(i, 0, Bi(["svelte-flow__minimap-node", t.class]), null, a, { selected: t.selected }), Y(i, "x", z(c)), Y(i, "y", z(l)), Y(i, "rx", n()), Y(i, "ry", n()), Y(i, "width", z(o)), Y(i, "height", z(s)), Y(i, "shape-rendering", t.shapeRendering), u = qi(i, "", u, {
				fill: t.color,
				stroke: t.strokeColor,
				"stroke-width": r()
			});
		}), U(e, i);
	};
	G(d, (e) => {
		t.nodeComponent ? e(f) : e(p, -1);
	}), U(e, u), A();
}
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/plugins/Minimap/interactive.js
function Cg(e, t) {
	let n = Np({
		domNode: e,
		panZoom: t.panZoom,
		getTransform: () => {
			let { viewport: e } = t.store;
			return [
				e.x,
				e.y,
				e.zoom
			];
		},
		getViewScale: t.getViewScale
	});
	n.update({
		translateExtent: t.translateExtent,
		width: t.width,
		height: t.height,
		inversePan: t.inversePan,
		zoomStep: t.zoomStep,
		pannable: t.pannable,
		zoomable: t.zoomable
	});
	function r(e) {
		n.update({
			translateExtent: e.translateExtent,
			width: e.width,
			height: e.height,
			inversePan: e.inversePan,
			zoomStep: e.zoomStep,
			pannable: e.pannable,
			zoomable: e.zoomable
		});
	}
	return {
		update: r,
		destroy() {
			n.destroy();
		}
	};
}
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/plugins/Minimap/Minimap.svelte
var wg = (e) => e instanceof Function ? e : () => e, Tg = /* @__PURE__ */ new Set([
	"$$slots",
	"$$events",
	"$$legacy",
	"position",
	"ariaLabel",
	"nodeStrokeColor",
	"nodeColor",
	"nodeClass",
	"nodeBorderRadius",
	"nodeStrokeWidth",
	"nodeComponent",
	"bgColor",
	"maskColor",
	"maskStrokeColor",
	"maskStrokeWidth",
	"width",
	"height",
	"pannable",
	"zoomable",
	"inversePan",
	"zoomStep",
	"class"
]), Eg = /* @__PURE__ */ Zr("<title> </title>"), Dg = /* @__PURE__ */ Zr("<svg class=\"svelte-flow__minimap-svg\" role=\"img\"><!><!><path class=\"svelte-flow__minimap-mask\" fill-rule=\"evenodd\" pointer-events=\"none\"></path></svg>"), Og = /* @__PURE__ */ V("<svelte-css-wrapper style=\"display: contents\"><!></svelte-css-wrapper>", 1);
function kg(e, t) {
	k(t, !0);
	let n = Q(t, "position", 3, "bottom-right"), r = Q(t, "nodeStrokeColor", 3, "transparent"), i = Q(t, "nodeClass", 3, ""), a = Q(t, "nodeBorderRadius", 3, 5), o = Q(t, "nodeStrokeWidth", 3, 2), s = Q(t, "width", 3, 200), c = Q(t, "height", 3, 150), l = Q(t, "pannable", 3, !0), u = Q(t, "zoomable", 3, !0), d = /* @__PURE__ */ Ma(t, Tg), f = /* @__PURE__ */ j(Wm), p = /* @__PURE__ */ j(() => z(f).ariaLabelConfig), m = typeof window > "u" || window.chrome ? "crispEdges" : "geometricPrecision", h = /* @__PURE__ */ j(() => `svelte-flow__minimap-desc-${z(f).flowId}`), g = /* @__PURE__ */ j(() => ({
		x: -z(f).viewport.x / z(f).viewport.zoom,
		y: -z(f).viewport.y / z(f).viewport.zoom,
		width: z(f).width / z(f).viewport.zoom,
		height: z(f).height / z(f).viewport.zoom
	})), _ = /* @__PURE__ */ j(() => z(f).nodes.some((e) => !e.hidden)), v = /* @__PURE__ */ j(() => z(_) ? Qd(Fd(z(f).nodeLookup, { filter: (e) => !e.hidden }), z(g)) : z(g)), y = /* @__PURE__ */ j(() => z(v).width / s()), b = /* @__PURE__ */ j(() => z(v).height / c()), x = /* @__PURE__ */ j(() => Math.max(z(y), z(b))), S = /* @__PURE__ */ j(() => z(x) * s()), C = /* @__PURE__ */ j(() => z(x) * c()), w = /* @__PURE__ */ j(() => 5 * z(x)), T = /* @__PURE__ */ j(() => z(v).x - (z(S) - z(v).width) / 2 - z(w)), ee = /* @__PURE__ */ j(() => z(v).y - (z(C) - z(v).height) / 2 - z(w)), te = /* @__PURE__ */ j(() => z(S) + z(w) * 2), ne = /* @__PURE__ */ j(() => z(C) + z(w) * 2), re = () => z(x);
	var ie = Og(), ae = F(ie);
	{
		let e = /* @__PURE__ */ j(() => ["svelte-flow__minimap", t.class]);
		wi(ae, () => ({ "--xy-minimap-background-color-props": t.bgColor })), Rh(ae.lastChild, Z({
			get position() {
				return n();
			},
			get class() {
				return z(e);
			},
			"data-testid": "svelte-flow__minimap"
		}, () => d, {
			children: (e, n) => {
				var d = H(), _ = F(d), v = (e) => {
					var n = Dg();
					let d;
					var _ = P(n), v = (e) => {
						var n = Eg(), r = I(n, !0);
						R(() => {
							Y(n, "id", z(h)), W(r, t.ariaLabel ?? z(p)["minimap.ariaLabel"]);
						}), U(e, n);
					};
					G(_, (e) => {
						(t.ariaLabel ?? z(p)["minimap.ariaLabel"]) && e(v);
					});
					var y = L(_);
					K(y, 17, () => z(f).nodes, (e) => e.id, (e, n) => {
						let s = /* @__PURE__ */ j(() => z(f).nodeLookup.get(z(n).id));
						var c = H(), l = F(c), u = (e) => {
							{
								let c = /* @__PURE__ */ j(() => t.nodeColor === void 0 ? void 0 : wg(t.nodeColor)(z(n))), l = /* @__PURE__ */ j(() => wg(r())(z(n))), u = /* @__PURE__ */ j(() => wg(i())(z(n)));
								Sg(e, {
									get id() {
										return z(s).id;
									},
									get selected() {
										return z(s).selected;
									},
									get nodeComponent() {
										return t.nodeComponent;
									},
									get color() {
										return z(c);
									},
									get borderRadius() {
										return a();
									},
									get strokeColor() {
										return z(l);
									},
									get strokeWidth() {
										return o();
									},
									get shapeRendering() {
										return m;
									},
									get class() {
										return z(u);
									}
								});
							}
						}, d = /* @__PURE__ */ j(() => z(s) && hf(z(s)) && !z(s).hidden);
						G(l, (e) => {
							z(d) && e(u);
						}), U(e, c);
					});
					var b = L(y);
					D(n), Ii(n, (e, t) => Cg?.(e, t), () => ({
						store: z(f),
						panZoom: z(f).panZoom,
						getViewScale: re,
						translateExtent: z(f).translateExtent,
						width: z(f).width,
						height: z(f).height,
						inversePan: t.inversePan,
						zoomStep: t.zoomStep,
						pannable: l(),
						zoomable: u()
					})), R(() => {
						Y(n, "width", s()), Y(n, "height", c()), Y(n, "viewBox", `${z(T) ?? ""} ${z(ee) ?? ""} ${z(te) ?? ""} ${z(ne) ?? ""}`), Y(n, "aria-labelledby", z(h)), d = qi(n, "", d, {
							"--xy-minimap-mask-background-color-props": t.maskColor,
							"--xy-minimap-mask-stroke-color-props": t.maskStrokeColor,
							"--xy-minimap-mask-stroke-width-props": t.maskStrokeWidth ? t.maskStrokeWidth * z(x) : void 0
						}), Y(b, "d", `M${z(T) - z(w)},${z(ee) - z(w)}h${z(te) + z(w) * 2}v${z(ne) + z(w) * 2}h${-z(te) - z(w) * 2}z
      M${z(g).x ?? ""},${z(g).y ?? ""}h${z(g).width ?? ""}v${z(g).height ?? ""}h${-z(g).width}z`);
					}), U(e, n);
				};
				G(_, (e) => {
					z(f).panZoom && e(v);
				}), U(e, d);
			},
			$$slots: { default: !0 }
		})), D(ae);
	}
	U(e, ie), A();
}
//#endregion
//#region node_modules/@xyflow/svelte/dist/lib/hooks/useUpdateNodeInternals.svelte.js
function Ag() {
	let e = /* @__PURE__ */ j(Wm), t = /* @__PURE__ */ j(() => z(e).domNode), n = /* @__PURE__ */ j(() => z(e).updateNodeInternals), r = Qp();
	return (e) => {
		if (!e && !r) throw Error("When using outside of a node, you must provide an id.");
		let i = e ? Array.isArray(e) ? e : [e] : [r], a = /* @__PURE__ */ new Map();
		i.forEach((e) => {
			let n = z(t)?.querySelector(`.svelte-flow__node[data-id="${e}"]`);
			n && a.set(e, {
				id: e,
				nodeElement: n,
				force: !0
			});
		}), requestAnimationFrame(() => z(n)(a));
	};
}
//#endregion
//#region src/lib/api/client.ts
var jg = (window.__NIFI__?.base ?? "").replace(/\/+$/, ""), Mg = class extends Error {
	status;
	handled = !1;
	constructor(e, t) {
		super(e), this.status = t;
	}
}, Ng = {
	unauthorized: (e) => {},
	forbidden: (e, t, n) => {}
};
async function Pg(e, t, n, r) {
	let i;
	try {
		i = await fetch(`${jg}/api${t}`, {
			method: e,
			headers: n === void 0 ? void 0 : { "Content-Type": "application/json" },
			body: n === void 0 ? void 0 : JSON.stringify(n),
			signal: r
		});
	} catch (e) {
		throw e.name === "AbortError" ? e : new Mg(`Network error: ${e.message}`, 0);
	}
	let a = await i.text(), o = null;
	if (a) try {
		o = JSON.parse(a);
	} catch {
		throw i.ok ? new Mg("Invalid JSON from server", i.status) : new Mg(a.slice(0, 300) || i.statusText, i.status);
	}
	let s = o && typeof o == "object" && !Array.isArray(o) && typeof o.error == "string" && Object.keys(o).length === 1;
	if (!i.ok || s) {
		let n = new Mg(o?.error ?? `${i.status} ${i.statusText}`, i.status);
		throw t.startsWith("/auth/") || (i.status === 401 ? (n.handled = !0, Ng.unauthorized(n.message)) : i.status === 403 && Ng.forbidden(n, e, t)), n;
	}
	return o;
}
var Fg = (e, t) => Pg("GET", e, void 0, t), Ig = (e, t, n) => Pg("POST", e, t ?? {}, n), Lg = (e, t) => Pg("PUT", e, t), Rg = (e) => Pg("DELETE", e), zg = encodeURIComponent, Bg = {
	meta: () => Fg("/meta"),
	login: (e, t) => Ig("/auth/login", {
		username: e,
		password: t
	}),
	logout: () => Ig("/auth/logout"),
	processors: () => Fg("/processors"),
	types: () => Fg("/types"),
	functions: () => Fg("/functions"),
	parameters: () => Fg("/parameters"),
	saveParameter: (e, t) => Lg(`/parameters/${encodeURIComponent(e)}`, t),
	deleteParameter: (e) => Rg(`/parameters/${encodeURIComponent(e)}`),
	versions: (e) => Fg(`/flows/${e}/versions`),
	version: (e, t) => Fg(`/flows/${e}/versions/${t}`),
	restoreVersion: (e, t) => Ig(`/flows/${e}/versions/${t}/restore`, {}),
	setFolder: (e, t) => Ig("/flows/folder", {
		ids: e,
		folder: t
	}),
	queues: (e) => Fg(`/runs/${e}/queues`),
	emptyQueue: (e, t) => Ig(`/runs/${e}/queues/${encodeURIComponent(t)}/empty`, {}),
	replayDeadLetters: (e, t, n) => Ig(`/runs/${e}/deadletters/replay`, {
		nodeId: t,
		ids: n
	}),
	setSchedule: (e, t, n) => Lg(`/flows/${e}/schedule`, {
		schedule: t,
		enabled: n
	}),
	connections: () => Fg("/connections"),
	testConnection: (e) => Ig("/connections/test", { id: e }),
	saveConnection: (e, t) => Lg(`/connections/${zg(e)}`, t),
	deleteConnection: (e) => Rg(`/connections/${zg(e)}`),
	tables: (e, t) => Fg(`/connections/${zg(e)}/tables`, t),
	tableMeta: (e, t) => Fg(`/connections/${zg(e)}/tables/${zg(t)}`),
	flows: () => Fg("/flows"),
	flow: (e) => Fg(`/flows/${zg(e)}`),
	createFlow: (e) => Ig("/flows", e),
	updateFlow: (e, t) => Lg(`/flows/${zg(e)}`, t),
	deleteFlow: (e) => Rg(`/flows/${zg(e)}`),
	duplicateFlow: (e) => Ig(`/flows/${zg(e)}/duplicate`),
	validate: (e) => Ig("/flows/validate", { graph: e }),
	wizard: (e) => Ig("/flows/wizard", e),
	schema: (e, t, n) => Ig("/flows/schema", {
		graph: e,
		nodeId: t
	}, n),
	preview: (e, t, n, r, i) => Ig("/flows/preview", {
		graph: e,
		nodeId: t,
		table: n || void 0,
		limit: r
	}, i),
	sinkPlan: (e, t, n) => Ig("/flows/sink-plan", {
		graph: e,
		nodeId: t
	}, n),
	scriptTest: (e) => Ig("/script/test", e),
	exprTest: (e, t, n) => Ig("/expr/test", {
		expr: e,
		columns: t,
		row: n
	}),
	startRun: (e, t = !1, n = !0) => Ig(`/flows/${zg(e)}/runs`, {
		resume: t,
		withDependencies: n
	}),
	runAll: (e = [], t = !1) => Ig("/runs/all", {
		flowIds: e,
		resume: t
	}),
	stopAll: (e = []) => Ig("/runs/stop-all", { flowIds: e }),
	flowRuns: (e) => Fg(`/flows/${zg(e)}/runs`),
	run: (e) => Fg(`/runs/${zg(e)}`),
	pauseRun: (e) => Ig(`/runs/${zg(e)}/pause`),
	resumeRun: (e) => Ig(`/runs/${zg(e)}/resume`),
	stopRun: (e) => Ig(`/runs/${zg(e)}/stop`),
	bulletins: (e, t = 0) => Fg(`/runs/${zg(e)}/bulletins?after=${t}`),
	deadLetters: (e, t = "", n = 0, r = 50) => Fg(`/runs/${zg(e)}/deadletters?table=${zg(t)}&offset=${n}&limit=${r}`),
	activeRuns: () => Fg("/runs/active")
};
function Vg(e, t) {
	let n = null, r = !1, i = 0, a, o = (e) => {
		try {
			return JSON.parse(e.data);
		} catch {
			return null;
		}
	}, s = () => {
		r || (n = new EventSource(`${jg}/api/runs/${zg(e)}/events`), n.onopen = () => {
			i = 0, t.connection?.("open");
		}, n.addEventListener("detail", (e) => {
			let n = o(e);
			n && t.detail?.(n);
		}), n.addEventListener("bulletin", (e) => {
			let n = o(e);
			n && t.bulletin?.(n);
		}), n.addEventListener("end", (e) => {
			let i = o(e);
			r = !0, n?.close(), i && t.end?.(i);
		}), n.onerror = () => {
			if (r) return;
			n?.close(), t.connection?.("reconnecting");
			let e = Math.min(1e4, 500 * 2 ** i++);
			a = setTimeout(s, e);
		});
	};
	return s(), () => {
		r = !0, clearTimeout(a), n?.close();
	};
}
var Hg = new class {
	#e = /* @__PURE__ */ M(pn([]));
	get processors() {
		return z(this.#e);
	}
	set processors(e) {
		N(this.#e, e, !0);
	}
	#t = /* @__PURE__ */ M(!1);
	get processorsLoaded() {
		return z(this.#t);
	}
	set processorsLoaded(e) {
		N(this.#t, e, !0);
	}
	#n = /* @__PURE__ */ M(pn([]));
	get types() {
		return z(this.#n);
	}
	set types(e) {
		N(this.#n, e, !0);
	}
	#r = /* @__PURE__ */ M(pn([]));
	get functions() {
		return z(this.#r);
	}
	set functions(e) {
		N(this.#r, e, !0);
	}
	#i = /* @__PURE__ */ M(pn([]));
	get connections() {
		return z(this.#i);
	}
	set connections(e) {
		N(this.#i, e, !0);
	}
	#a = /* @__PURE__ */ M(!1);
	get connectionsLoaded() {
		return z(this.#a);
	}
	set connectionsLoaded(e) {
		N(this.#a, e, !0);
	}
	#o = /* @__PURE__ */ j(() => new Map(this.processors.map((e) => [e.type, e])));
	get byType() {
		return z(this.#o);
	}
	set byType(e) {
		N(this.#o, e);
	}
	pProcessors;
	pTypes;
	pFunctions;
	pConnections;
	loadProcessors() {
		return this.pProcessors ??= Bg.processors().then((e) => {
			this.processors = e ?? [], this.processorsLoaded = !0;
		}).catch((e) => {
			throw this.pProcessors = void 0, e;
		});
	}
	loadTypes() {
		return this.pTypes ??= Bg.types().then((e) => {
			this.types = e ?? [];
		}).catch(() => {
			this.pTypes = void 0;
		});
	}
	loadFunctions() {
		return this.pFunctions ??= Bg.functions().then((e) => {
			this.functions = e ?? [];
		}).catch(() => {
			this.pFunctions = void 0;
		});
	}
	loadConnections(e = !1) {
		return e && (this.pConnections = void 0), this.pConnections ??= Bg.connections().then((e) => {
			this.connections = e ?? [], this.connectionsLoaded = !0;
		}).catch((e) => {
			throw this.pConnections = void 0, e;
		});
	}
}(), Ug = 1, Wg = new class {
	#e = /* @__PURE__ */ M(pn([]));
	get items() {
		return z(this.#e);
	}
	set items(e) {
		N(this.#e, e, !0);
	}
	push(e, t, n = e === "error" ? 7e3 : 3500, r) {
		let i = Ug++;
		this.items.push({
			id: i,
			kind: e,
			message: t,
			details: r
		}), setTimeout(() => this.dismiss(i), n);
	}
	dismiss(e) {
		this.items = this.items.filter((t) => t.id !== e);
	}
}(), Gg = {
	info: (e) => Wg.push("info", e),
	success: (e) => Wg.push("success", e),
	warn: (e) => Wg.push("warn", e),
	error: (e) => {
		e && typeof e == "object" && e.handled || Wg.push("error", e instanceof Error ? e.message : String(e));
	}
};
//#endregion
//#region src/lib/router.svelte.ts
function Kg(e) {
	location.assign(jg + e);
}
var qg = (e) => jg + e, Jg = [
	"pending",
	"running",
	"paused",
	"stopping"
], Yg = (e) => !!e && Jg.includes(e), Xg = "nifi.theme";
function Zg() {
	try {
		let e = localStorage.getItem(Xg);
		if (e === "light" || e === "dark" || e === "system") return e;
	} catch {}
	return "system";
}
var Qg = window.matchMedia("(prefers-color-scheme: dark)"), $g = new class {
	#e = /* @__PURE__ */ M(pn(Zg()));
	get choice() {
		return z(this.#e);
	}
	set choice(e) {
		N(this.#e, e, !0);
	}
	#t = /* @__PURE__ */ M(pn(Qg.matches));
	get systemDark() {
		return z(this.#t);
	}
	set systemDark(e) {
		N(this.#t, e, !0);
	}
	#n = /* @__PURE__ */ j(() => this.choice === "system" ? this.systemDark ? "dark" : "light" : this.choice);
	get resolved() {
		return z(this.#n);
	}
	set resolved(e) {
		N(this.#n, e);
	}
	constructor() {
		Qg.addEventListener("change", (e) => this.systemDark = e.matches);
	}
	set(e) {
		this.choice = e;
		try {
			localStorage.setItem(Xg, e);
		} catch {}
	}
	cycle() {
		this.set(this.resolved === "dark" ? "light" : "dark");
	}
}(), e_ = {
	view: !0,
	edit: !0,
	run: !0,
	data: !0
};
function t_(e, t) {
	let n = t.replace(/\?.*$/, "");
	return /\/connections\/test$/.test(n) ? "test connections" : /\/connections\/[^/]+\/tables/.test(n) ? "browse table data" : /\/flows\/(preview|schema)$/.test(n) ? "preview data" : /\/flows\/sink-plan$/.test(n) ? "inspect target tables" : /\/deadletters$/.test(n) ? "view dead-lettered rows" : /\/(script|expr)\/test$/.test(n) ? "test scripts and expressions" : /\/flows\/[^/]+\/runs$/.test(n) && e === "POST" || /\/runs\/(all|stop-all)$/.test(n) ? "run flows" : /\/runs\/[^/]+\/(pause|resume|stop)$/.test(n) ? "control runs" : /\/flows\/wizard$/.test(n) ? "create flows" : /\/flows/.test(n) && e !== "GET" && !/validate$/.test(n) ? "edit flows" : "do that";
}
var n_ = new class {
	#e = /* @__PURE__ */ M(null);
	get meta() {
		return z(this.#e);
	}
	set meta(e) {
		N(this.#e, e, !0);
	}
	#t = /* @__PURE__ */ M(!1);
	get loaded() {
		return z(this.#t);
	}
	set loaded(e) {
		N(this.#t, e, !0);
	}
	#n = /* @__PURE__ */ M(!1);
	get signInRequired() {
		return z(this.#n);
	}
	set signInRequired(e) {
		N(this.#n, e, !0);
	}
	#r = /* @__PURE__ */ M("");
	get signInMessage() {
		return z(this.#r);
	}
	set signInMessage(e) {
		N(this.#r, e, !0);
	}
	#i = /* @__PURE__ */ M("");
	get loadError() {
		return z(this.#i);
	}
	set loadError(e) {
		N(this.#i, e, !0);
	}
	#a = /* @__PURE__ */ j(() => this.meta?.auth ?? "none");
	get mode() {
		return z(this.#a);
	}
	set mode(e) {
		N(this.#a, e);
	}
	#o = /* @__PURE__ */ j(() => this.mode === "builtin" && this.meta?.authenticated === !1);
	get needsLogin() {
		return z(this.#o);
	}
	set needsLogin(e) {
		N(this.#o, e);
	}
	#s = /* @__PURE__ */ j(() => ({
		...e_,
		...this.meta?.permissions ?? {}
	}));
	get can() {
		return z(this.#s);
	}
	set can(e) {
		N(this.#s, e);
	}
	#c = /* @__PURE__ */ j(() => this.meta?.user ?? "");
	get user() {
		return z(this.#c);
	}
	set user(e) {
		N(this.#c, e);
	}
	constructor() {
		Ng.unauthorized = (e) => {
			if (this.mode === "builtin") {
				this.meta &&= {
					...this.meta,
					authenticated: !1,
					user: ""
				};
				return;
			}
			this.signInRequired = !0, this.signInMessage = e;
		}, Ng.forbidden = (e, t, n) => {
			e.handled = !0, Wg.push("error", `You don't have permission to ${t_(t, n)}.`);
		};
	}
	async login(e, t) {
		await Bg.login(e, t), await this.load();
	}
	async logout() {
		try {
			await Bg.logout();
		} finally {
			await this.load();
		}
	}
	async retry() {
		this.signInRequired = !1, this.signInMessage = "", await this.load();
	}
	async load() {
		this.loadError = "";
		try {
			let e = await Bg.meta();
			this.meta = e, e?.auth !== "builtin" && e?.authenticated === !1 && e.permissions && !e.permissions.view && (this.signInRequired = !0), this.loaded = !0;
		} catch (e) {
			e instanceof Mg && e.status === 401 || (this.loadError = e.message);
		}
	}
}();
//#endregion
//#region src/lib/format.ts
function r_(e) {
	return e == null || !isFinite(e) ? "—" : e.toLocaleString();
}
function i_(e) {
	if (e == null || !isFinite(e)) return "—";
	let t = Math.abs(e);
	return t >= 1e9 ? (e / 1e9).toFixed(t >= 1e10 ? 0 : 1) + "B" : t >= 1e6 ? (e / 1e6).toFixed(t >= 1e7 ? 0 : 1) + "M" : t >= 1e4 ? (e / 1e3).toFixed(0) + "k" : t >= 1e3 ? (e / 1e3).toFixed(1) + "k" : String(Math.round(e));
}
function a_(e) {
	if (!e) return "—";
	let t = new Date(e);
	return isNaN(+t) ? e : t.toLocaleString(void 0, {
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit"
	});
}
function o_(e) {
	if (!e) return "";
	let t = new Date(e);
	return isNaN(+t) ? e : t.toLocaleTimeString(void 0, { hour12: !1 });
}
function s_(e) {
	if (!e) return "—";
	let t = new Date(e);
	if (isNaN(+t)) return e;
	let n = (Date.now() - +t) / 1e3, r = n < 0, i = Math.abs(n), a = (e) => r ? `in ${e}` : `${e} ago`;
	return i < 45 ? r ? "in a moment" : "just now" : i < 3600 ? a(`${Math.round(i / 60)}m`) : i < 86400 ? a(`${Math.round(i / 3600)}h`) : i < 2592e3 ? a(`${Math.round(i / 86400)}d`) : t.toLocaleDateString();
}
function c_(e, t) {
	if (!e) return "—";
	let n = +new Date(e), r = t ? +new Date(t) : Date.now();
	if (isNaN(n) || isNaN(r)) return "—";
	let i = Math.max(0, Math.round((r - n) / 1e3)), a = Math.floor(i / 3600);
	i -= a * 3600;
	let o = Math.floor(i / 60);
	return i -= o * 60, a ? `${a}h ${o}m` : o ? `${o}m ${i}s` : `${i}s`;
}
function l_(e, t) {
	return !t || t <= 0 ? e > 0 ? 100 : 0 : Math.max(0, Math.min(100, e / t * 100));
}
function u_(e) {
	return e == null ? {
		text: "NULL",
		kind: "null"
	} : typeof e == "boolean" ? {
		text: String(e),
		kind: "bool"
	} : typeof e == "number" || typeof e == "bigint" ? {
		text: String(e),
		kind: "num"
	} : typeof e == "object" ? {
		text: JSON.stringify(e),
		kind: "json"
	} : {
		text: String(e),
		kind: "str"
	};
}
function d_(e) {
	if (e == null) return "NULL";
	if (typeof e == "object") return JSON.stringify(e, null, 2);
	if (typeof e == "string") {
		let t = e.trim();
		if (t.startsWith("{") && t.endsWith("}") || t.startsWith("[") && t.endsWith("]")) try {
			return JSON.stringify(JSON.parse(t), null, 2);
		} catch {}
	}
	return String(e);
}
var f_ = (e = "n") => `${e}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-3)}`, p_ = (e) => e === void 0 ? e : JSON.parse(JSON.stringify(e)), m_ = 2e3, h_ = class {
	#e = /* @__PURE__ */ M(null);
	get runId() {
		return z(this.#e);
	}
	set runId(e) {
		N(this.#e, e, !0);
	}
	#t = /* @__PURE__ */ M(null);
	get detail() {
		return z(this.#t);
	}
	set detail(e) {
		N(this.#t, e, !0);
	}
	#n = /* @__PURE__ */ M(pn([]));
	get bulletins() {
		return z(this.#n);
	}
	set bulletins(e) {
		N(this.#n, e, !0);
	}
	#r = /* @__PURE__ */ M("idle");
	get connection() {
		return z(this.#r);
	}
	set connection(e) {
		N(this.#r, e, !0);
	}
	#i = /* @__PURE__ */ M("");
	get error() {
		return z(this.#i);
	}
	set error(e) {
		N(this.#i, e, !0);
	}
	#a = /* @__PURE__ */ j(() => Yg(this.detail?.status));
	get active() {
		return z(this.#a);
	}
	set active(e) {
		N(this.#a, e);
	}
	#o = /* @__PURE__ */ j(() => new Map((this.detail?.nodes ?? []).map((e) => [e.nodeId, e])));
	get nodeStats() {
		return z(this.#o);
	}
	set nodeStats(e) {
		N(this.#o, e);
	}
	#s = /* @__PURE__ */ j(() => new Map((this.detail?.edges ?? []).map((e) => [e.edgeId, e])));
	get edgeStats() {
		return z(this.#s);
	}
	set edgeStats(e) {
		N(this.#s, e);
	}
	close;
	lastSeq = 0;
	onEnd;
	async start(e) {
		this.stop(), this.runId = e, this.detail = null, this.bulletins = [], this.lastSeq = 0, this.error = "";
		try {
			let t = await Bg.run(e);
			if (this.runId !== e) return;
			this.detail = t;
		} catch (e) {
			this.error = e.message;
			return;
		}
		if (await this.fetchBulletins(e), this.runId === e) {
			if (!Yg(this.detail?.status)) {
				this.connection = "closed";
				return;
			}
			this.close = Vg(e, {
				detail: (t) => {
					this.runId === e && (this.detail = t);
				},
				bulletin: (e) => this.addBulletins([e]),
				end: (t) => {
					this.runId === e && (this.connection = "closed", this.detail &&= {
						...this.detail,
						...t
					}, Bg.run(e).then((t) => this.runId === e && (this.detail = t)).catch(() => {}), this.onEnd?.(t));
				},
				connection: (t) => {
					if (this.runId !== e) return;
					let n = this.connection;
					this.connection = t, t === "open" && n === "reconnecting" && this.fetchBulletins(e);
				}
			});
		}
	}
	async fetchBulletins(e) {
		try {
			let t = await Bg.bulletins(e, this.lastSeq);
			this.runId === e && this.addBulletins(t ?? []);
		} catch {}
	}
	addBulletins(e) {
		let t = e.filter((e) => e.seq > this.lastSeq);
		if (!t.length) return;
		this.lastSeq = Math.max(this.lastSeq, ...t.map((e) => e.seq));
		let n = this.bulletins.concat(t);
		this.bulletins = n.length > m_ ? n.slice(n.length - m_) : n;
	}
	patch(e) {
		this.detail && this.detail.id === e.id && (this.detail = {
			...this.detail,
			...e
		});
	}
	stop() {
		this.close?.(), this.close = void 0, this.connection = "idle";
	}
}, g_ = Symbol("canvas"), __ = (e) => it(g_, e), v_ = () => rt(g_), y_ = 2e4;
function b_(e) {
	return {
		id: e.id,
		type: "processor",
		position: { ...e.position },
		data: { node: e }
	};
}
function x_(e) {
	return {
		id: e.id,
		type: "flow",
		source: e.from,
		sourceHandle: e.fromPort,
		target: e.to,
		targetHandle: "in",
		data: { edge: e }
	};
}
function S_(e, t, n) {
	return {
		nodes: e.map((e) => ({
			...e.data.node,
			position: {
				x: Math.round(e.position.x),
				y: Math.round(e.position.y)
			}
		})),
		edges: t.map((e) => ({
			...e.data.edge,
			id: e.id,
			from: e.source,
			fromPort: e.sourceHandle ?? "success",
			to: e.target
		})),
		...n ? { viewport: n } : {}
	};
}
function C_(e, t) {
	if (!e.showIf) return !0;
	let n = t?.[e.showIf.key], r = e.showIf.equals;
	return Array.isArray(r) ? r.includes(n) : n === r || String(n ?? "") === String(r ?? "") || r === !1 && n == null;
}
function w_(e, t) {
	if (!e) return ["success"];
	let n = e.relationships ?? [], r = [];
	if (e.dynamicRelationships) {
		let i = t?.[e.dynamicRelationships];
		if (Array.isArray(i)) for (let e of i) {
			let t = typeof e == "string" ? e : e?.name;
			t && typeof t == "string" && !r.includes(t) && !n.includes(t) && r.push(t);
		}
	}
	return [
		...r,
		...n.filter((e) => e !== "failure"),
		...n.includes("failure") ? ["failure"] : []
	];
}
function T_(e) {
	let t = {};
	for (let n of e.properties ?? []) n.default !== void 0 && (t[n.key] = p_(n.default));
	return t;
}
function E_(e, t, n) {
	let r = e.label, i = 2;
	for (; n.includes(r);) r = `${e.label} ${i++}`;
	return {
		id: f_("n"),
		type: e.type,
		name: r,
		position: t,
		config: T_(e),
		...e.supportsConcurrency ? { concurrency: D_(e) } : {}
	};
}
function D_(e) {
	return e?.supportsConcurrency ? e.category === "Source" || e.category === "Sink" || e.category === "Script" ? 4 : 2 : 1;
}
function O_(e) {
	return JSON.stringify({
		n: e.nodes,
		e: e.edges
	});
}
//#endregion
//#region node_modules/lucide-svelte/dist/defaultAttributes.js
var k_ = {
	xmlns: "http://www.w3.org/2000/svg",
	width: 24,
	height: 24,
	viewBox: "0 0 24 24",
	fill: "none",
	stroke: "currentColor",
	"stroke-width": 2,
	"stroke-linecap": "round",
	"stroke-linejoin": "round"
}, A_ = (e) => {
	for (let t in e) if (t.startsWith("aria-") || t === "role" || t === "title") return !0;
	return !1;
}, j_ = (...e) => e.filter((e, t, n) => !!e && e.trim() !== "" && n.indexOf(e) === t).join(" ").trim(), M_ = /* @__PURE__ */ Zr("<svg><!><!></svg>");
function $(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = X(n, [
		"name",
		"color",
		"size",
		"strokeWidth",
		"absoluteStrokeWidth",
		"iconNode"
	]);
	k(t, !1);
	let i = Q(t, "name", 8, void 0), a = Q(t, "color", 8, "currentColor"), o = Q(t, "size", 8, 24), s = Q(t, "strokeWidth", 8, 2), c = Q(t, "absoluteStrokeWidth", 8, !1), l = Q(t, "iconNode", 24, () => []);
	Da();
	var u = M_();
	ha(u, (e, t, n) => ({
		...k_,
		...e,
		...r,
		width: o(),
		height: o(),
		stroke: a(),
		"stroke-width": t,
		class: n
	}), [
		() => A_(r) ? void 0 : { "aria-hidden": "true" },
		() => (Pr(c()), Pr(s()), Pr(o()), Nr(() => c() ? Number(s()) * 24 / Number(o()) : s())),
		() => (Pr(j_), Pr(i()), Pr(n), Nr(() => j_("lucide-icon", "lucide", i() ? `lucide-${i()}` : "", n.class)))
	]);
	var d = P(u);
	K(d, 1, l, Ti, (e, t) => {
		var n = /* @__PURE__ */ j(() => x(z(t), 2));
		let r = () => z(n)[0], i = () => z(n)[1];
		var a = H();
		Fi(F(a), r, !0, (e, t) => {
			ha(e, () => ({ ...i() }));
		}), U(e, a);
	}), q(L(d), t, "default", {}, null), D(u), U(e, u), A();
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/activity.svelte
function N_(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [["path", { d: "M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2" }]];
	$(e, Z({ name: "activity" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/arrow-down.svelte
function P_(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [["path", { d: "M12 5v14" }], ["path", { d: "m19 12-7 7-7-7" }]];
	$(e, Z({ name: "arrow-down" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/arrow-left.svelte
function F_(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [["path", { d: "m12 19-7-7 7-7" }], ["path", { d: "M19 12H5" }]];
	$(e, Z({ name: "arrow-left" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/arrow-right-left.svelte
function I_(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [
		["path", { d: "m16 3 4 4-4 4" }],
		["path", { d: "M20 7H4" }],
		["path", { d: "m8 21-4-4 4-4" }],
		["path", { d: "M4 17h16" }]
	];
	$(e, Z({ name: "arrow-right-left" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/arrow-right.svelte
function L_(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [["path", { d: "M5 12h14" }], ["path", { d: "m12 5 7 7-7 7" }]];
	$(e, Z({ name: "arrow-right" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/arrow-up-down.svelte
function R_(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [
		["path", { d: "m21 16-4 4-4-4" }],
		["path", { d: "M17 20V4" }],
		["path", { d: "m3 8 4-4 4 4" }],
		["path", { d: "M7 4v16" }]
	];
	$(e, Z({ name: "arrow-up-down" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/arrow-up.svelte
function z_(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [["path", { d: "m5 12 7-7 7 7" }], ["path", { d: "M12 19V5" }]];
	$(e, Z({ name: "arrow-up" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/ban.svelte
function B_(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [["circle", {
		cx: "12",
		cy: "12",
		r: "10"
	}], ["path", { d: "M4.929 4.929 19.07 19.071" }]];
	$(e, Z({ name: "ban" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/binary.svelte
function V_(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [
		["rect", {
			x: "14",
			y: "14",
			width: "4",
			height: "6",
			rx: "2"
		}],
		["rect", {
			x: "6",
			y: "4",
			width: "4",
			height: "6",
			rx: "2"
		}],
		["path", { d: "M6 20h4" }],
		["path", { d: "M14 10h4" }],
		["path", { d: "M6 14h2v6" }],
		["path", { d: "M14 4h2v6" }]
	];
	$(e, Z({ name: "binary" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/blocks.svelte
function H_(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [["path", { d: "M10 22V7a1 1 0 0 0-1-1H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5a1 1 0 0 0-1-1H2" }], ["rect", {
		x: "14",
		y: "2",
		width: "8",
		height: "8",
		rx: "1"
	}]];
	$(e, Z({ name: "blocks" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/box.svelte
function U_(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [
		["path", { d: "M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" }],
		["path", { d: "m3.3 7 8.7 5 8.7-5" }],
		["path", { d: "M12 22V12" }]
	];
	$(e, Z({ name: "box" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/braces.svelte
function W_(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [["path", { d: "M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1" }], ["path", { d: "M16 21h1a2 2 0 0 0 2-2v-5c0-1.1.9-2 2-2a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1" }]];
	$(e, Z({ name: "braces" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/cable.svelte
function G_(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [
		["path", { d: "M17 19a1 1 0 0 1-1-1v-2a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2a1 1 0 0 1-1 1z" }],
		["path", { d: "M17 21v-2" }],
		["path", { d: "M19 14V6.5a1 1 0 0 0-7 0v11a1 1 0 0 1-7 0V10" }],
		["path", { d: "M21 21v-2" }],
		["path", { d: "M3 5V3" }],
		["path", { d: "M4 10a2 2 0 0 1-2-2V6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2a2 2 0 0 1-2 2z" }],
		["path", { d: "M7 5V3" }]
	];
	$(e, Z({ name: "cable" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/calculator.svelte
function K_(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [
		["rect", {
			width: "16",
			height: "20",
			x: "4",
			y: "2",
			rx: "2"
		}],
		["line", {
			x1: "8",
			x2: "16",
			y1: "6",
			y2: "6"
		}],
		["line", {
			x1: "16",
			x2: "16",
			y1: "14",
			y2: "18"
		}],
		["path", { d: "M16 10h.01" }],
		["path", { d: "M12 10h.01" }],
		["path", { d: "M8 10h.01" }],
		["path", { d: "M12 14h.01" }],
		["path", { d: "M8 14h.01" }],
		["path", { d: "M12 18h.01" }],
		["path", { d: "M8 18h.01" }]
	];
	$(e, Z({ name: "calculator" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/calendar.svelte
function q_(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [
		["path", { d: "M8 2v4" }],
		["path", { d: "M16 2v4" }],
		["rect", {
			width: "18",
			height: "18",
			x: "3",
			y: "4",
			rx: "2"
		}],
		["path", { d: "M3 10h18" }]
	];
	$(e, Z({ name: "calendar" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/check.svelte
function J_(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [["path", { d: "M20 6 9 17l-5-5" }]];
	$(e, Z({ name: "check" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/chevron-down.svelte
function Y_(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [["path", { d: "m6 9 6 6 6-6" }]];
	$(e, Z({ name: "chevron-down" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/chevron-left.svelte
function X_(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [["path", { d: "m15 18-6-6 6-6" }]];
	$(e, Z({ name: "chevron-left" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/chevron-up.svelte
function Z_(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [["path", { d: "m18 15-6-6-6 6" }]];
	$(e, Z({ name: "chevron-up" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/chevron-right.svelte
function Q_(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [["path", { d: "m9 18 6-6-6-6" }]];
	$(e, Z({ name: "chevron-right" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/circle-alert.svelte
function $_(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [
		["circle", {
			cx: "12",
			cy: "12",
			r: "10"
		}],
		["line", {
			x1: "12",
			x2: "12",
			y1: "8",
			y2: "12"
		}],
		["line", {
			x1: "12",
			x2: "12.01",
			y1: "16",
			y2: "16"
		}]
	];
	$(e, Z({ name: "circle-alert" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/circle-check.svelte
function ev(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [["circle", {
		cx: "12",
		cy: "12",
		r: "10"
	}], ["path", { d: "m9 12 2 2 4-4" }]];
	$(e, Z({ name: "circle-check" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/circle-x.svelte
function tv(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [
		["circle", {
			cx: "12",
			cy: "12",
			r: "10"
		}],
		["path", { d: "m15 9-6 6" }],
		["path", { d: "m9 9 6 6" }]
	];
	$(e, Z({ name: "circle-x" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/clock.svelte
function nv(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [["circle", {
		cx: "12",
		cy: "12",
		r: "10"
	}], ["path", { d: "M12 6v6l4 2" }]];
	$(e, Z({ name: "clock" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/code-xml.svelte
function rv(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [
		["path", { d: "m18 16 4-4-4-4" }],
		["path", { d: "m6 8-4 4 4 4" }],
		["path", { d: "m14.5 4-5 16" }]
	];
	$(e, Z({ name: "code-xml" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/code.svelte
function iv(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [["path", { d: "m16 18 6-6-6-6" }], ["path", { d: "m8 6-6 6 6 6" }]];
	$(e, Z({ name: "code" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/columns-3.svelte
function av(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [
		["rect", {
			width: "18",
			height: "18",
			x: "3",
			y: "3",
			rx: "2"
		}],
		["path", { d: "M9 3v18" }],
		["path", { d: "M15 3v18" }]
	];
	$(e, Z({ name: "columns-3" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/copy.svelte
function ov(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [["rect", {
		width: "14",
		height: "14",
		x: "8",
		y: "8",
		rx: "2",
		ry: "2"
	}], ["path", { d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" }]];
	$(e, Z({ name: "copy" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/database-zap.svelte
function sv(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [
		["ellipse", {
			cx: "12",
			cy: "5",
			rx: "9",
			ry: "3"
		}],
		["path", { d: "M3 5V19A9 3 0 0 0 15 21.84" }],
		["path", { d: "M21 5V8" }],
		["path", { d: "M21 12L18 17H22L19 22" }],
		["path", { d: "M3 12A9 3 0 0 0 14.59 14.87" }]
	];
	$(e, Z({ name: "database-zap" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/database.svelte
function cv(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [
		["ellipse", {
			cx: "12",
			cy: "5",
			rx: "9",
			ry: "3"
		}],
		["path", { d: "M3 5V19A9 3 0 0 0 21 19V5" }],
		["path", { d: "M3 12A9 3 0 0 0 21 12" }]
	];
	$(e, Z({ name: "database" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/download.svelte
function lv(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [
		["path", { d: "M12 15V3" }],
		["path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }],
		["path", { d: "m7 10 5 5 5-5" }]
	];
	$(e, Z({ name: "download" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/external-link.svelte
function uv(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [
		["path", { d: "M15 3h6v6" }],
		["path", { d: "M10 14 21 3" }],
		["path", { d: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" }]
	];
	$(e, Z({ name: "external-link" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/eye-off.svelte
function dv(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [
		["path", { d: "M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" }],
		["path", { d: "M14.084 14.158a3 3 0 0 1-4.242-4.242" }],
		["path", { d: "M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" }],
		["path", { d: "m2 2 20 20" }]
	];
	$(e, Z({ name: "eye-off" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/eye.svelte
function fv(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [["path", { d: "M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" }], ["circle", {
		cx: "12",
		cy: "12",
		r: "3"
	}]];
	$(e, Z({ name: "eye" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/file-braces.svelte
function pv(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [
		["path", { d: "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" }],
		["path", { d: "M14 2v5a1 1 0 0 0 1 1h5" }],
		["path", { d: "M10 12a1 1 0 0 0-1 1v1a1 1 0 0 1-1 1 1 1 0 0 1 1 1v1a1 1 0 0 0 1 1" }],
		["path", { d: "M14 18a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1 1 1 0 0 1-1-1v-1a1 1 0 0 0-1-1" }]
	];
	$(e, Z({ name: "file-braces" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/file-code.svelte
function mv(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [
		["path", { d: "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" }],
		["path", { d: "M14 2v5a1 1 0 0 0 1 1h5" }],
		["path", { d: "M10 12.5 8 15l2 2.5" }],
		["path", { d: "m14 12.5 2 2.5-2 2.5" }]
	];
	$(e, Z({ name: "file-code" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/file-text.svelte
function hv(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [
		["path", { d: "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" }],
		["path", { d: "M14 2v5a1 1 0 0 0 1 1h5" }],
		["path", { d: "M10 9H8" }],
		["path", { d: "M16 13H8" }],
		["path", { d: "M16 17H8" }]
	];
	$(e, Z({ name: "file-text" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/flask-conical.svelte
function gv(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [
		["path", { d: "M14 2v6a2 2 0 0 0 .245.96l5.51 10.08A2 2 0 0 1 18 22H6a2 2 0 0 1-1.755-2.96l5.51-10.08A2 2 0 0 0 10 8V2" }],
		["path", { d: "M6.453 15h11.094" }],
		["path", { d: "M8.5 2h7" }]
	];
	$(e, Z({ name: "flask-conical" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/folder.svelte
function _v(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [["path", { d: "M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" }]];
	$(e, Z({ name: "folder" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/funnel.svelte
function vv(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [["path", { d: "M10 20a1 1 0 0 0 .553.895l2 1A1 1 0 0 0 14 21v-7a2 2 0 0 1 .517-1.341L21.74 4.67A1 1 0 0 0 21 3H3a1 1 0 0 0-.742 1.67l7.225 7.989A2 2 0 0 1 10 14z" }]];
	$(e, Z({ name: "funnel" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/git-branch.svelte
function yv(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [
		["path", { d: "M15 6a9 9 0 0 0-9 9V3" }],
		["circle", {
			cx: "18",
			cy: "6",
			r: "3"
		}],
		["circle", {
			cx: "6",
			cy: "18",
			r: "3"
		}]
	];
	$(e, Z({ name: "git-branch" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/git-fork.svelte
function bv(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [
		["circle", {
			cx: "12",
			cy: "18",
			r: "3"
		}],
		["circle", {
			cx: "6",
			cy: "6",
			r: "3"
		}],
		["circle", {
			cx: "18",
			cy: "6",
			r: "3"
		}],
		["path", { d: "M18 9v2c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V9" }],
		["path", { d: "M12 12v3" }]
	];
	$(e, Z({ name: "git-fork" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/git-merge.svelte
function xv(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [
		["circle", {
			cx: "18",
			cy: "18",
			r: "3"
		}],
		["circle", {
			cx: "6",
			cy: "6",
			r: "3"
		}],
		["path", { d: "M6 21V9a9 9 0 0 0 9 9" }]
	];
	$(e, Z({ name: "git-merge" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/globe.svelte
function Sv(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [
		["circle", {
			cx: "12",
			cy: "12",
			r: "10"
		}],
		["path", { d: "M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" }],
		["path", { d: "M2 12h20" }]
	];
	$(e, Z({ name: "globe" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/hard-drive-download.svelte
function Cv(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [
		["path", { d: "M12 2v8" }],
		["path", { d: "m16 6-4 4-4-4" }],
		["rect", {
			width: "20",
			height: "8",
			x: "2",
			y: "14",
			rx: "2"
		}],
		["path", { d: "M6 18h.01" }],
		["path", { d: "M10 18h.01" }]
	];
	$(e, Z({ name: "hard-drive-download" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/hard-drive-upload.svelte
function wv(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [
		["path", { d: "m16 6-4-4-4 4" }],
		["path", { d: "M12 2v8" }],
		["rect", {
			width: "20",
			height: "8",
			x: "2",
			y: "14",
			rx: "2"
		}],
		["path", { d: "M6 18h.01" }],
		["path", { d: "M10 18h.01" }]
	];
	$(e, Z({ name: "hard-drive-upload" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/hash.svelte
function Tv(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [
		["line", {
			x1: "4",
			x2: "20",
			y1: "9",
			y2: "9"
		}],
		["line", {
			x1: "4",
			x2: "20",
			y1: "15",
			y2: "15"
		}],
		["line", {
			x1: "10",
			x2: "8",
			y1: "3",
			y2: "21"
		}],
		["line", {
			x1: "16",
			x2: "14",
			y1: "3",
			y2: "21"
		}]
	];
	$(e, Z({ name: "hash" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/history.svelte
function Ev(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [
		["path", { d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" }],
		["path", { d: "M3 3v5h5" }],
		["path", { d: "M12 7v5l4 2" }]
	];
	$(e, Z({ name: "history" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/inbox.svelte
function Dv(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [["polyline", { points: "22 12 16 12 14 15 10 15 8 12 2 12" }], ["path", { d: "M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" }]];
	$(e, Z({ name: "inbox" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/info.svelte
function Ov(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [
		["circle", {
			cx: "12",
			cy: "12",
			r: "10"
		}],
		["path", { d: "M12 16v-4" }],
		["path", { d: "M12 8h.01" }]
	];
	$(e, Z({ name: "info" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/key-round.svelte
function kv(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [["path", { d: "M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z" }], ["circle", {
		cx: "16.5",
		cy: "7.5",
		r: ".5",
		fill: "currentColor"
	}]];
	$(e, Z({ name: "key-round" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/layers.svelte
function Av(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [
		["path", { d: "M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z" }],
		["path", { d: "M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12" }],
		["path", { d: "M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17" }]
	];
	$(e, Z({ name: "layers" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/layout-list.svelte
function jv(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [
		["rect", {
			width: "7",
			height: "7",
			x: "3",
			y: "3",
			rx: "1"
		}],
		["rect", {
			width: "7",
			height: "7",
			x: "3",
			y: "14",
			rx: "1"
		}],
		["path", { d: "M14 4h7" }],
		["path", { d: "M14 9h7" }],
		["path", { d: "M14 15h7" }],
		["path", { d: "M14 20h7" }]
	];
	$(e, Z({ name: "layout-list" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/link-2.svelte
function Mv(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [
		["path", { d: "M9 17H7A5 5 0 0 1 7 7h2" }],
		["path", { d: "M15 7h2a5 5 0 1 1 0 10h-2" }],
		["line", {
			x1: "8",
			x2: "16",
			y1: "12",
			y2: "12"
		}]
	];
	$(e, Z({ name: "link-2" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/link.svelte
function Nv(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [["path", { d: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" }], ["path", { d: "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" }]];
	$(e, Z({ name: "link" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/list-checks.svelte
function Pv(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [
		["path", { d: "M13 5h8" }],
		["path", { d: "M13 12h8" }],
		["path", { d: "M13 19h8" }],
		["path", { d: "m3 17 2 2 4-4" }],
		["path", { d: "m3 7 2 2 4-4" }]
	];
	$(e, Z({ name: "list-checks" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/list-filter.svelte
function Fv(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [
		["path", { d: "M2 5h20" }],
		["path", { d: "M6 12h12" }],
		["path", { d: "M9 19h6" }]
	];
	$(e, Z({ name: "list-filter" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/list-plus.svelte
function Iv(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [
		["path", { d: "M16 5H3" }],
		["path", { d: "M11 12H3" }],
		["path", { d: "M16 19H3" }],
		["path", { d: "M18 9v6" }],
		["path", { d: "M21 12h-6" }]
	];
	$(e, Z({ name: "list-plus" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/loader-circle.svelte
function Lv(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [["path", { d: "M21 12a9 9 0 1 1-6.219-8.56" }]];
	$(e, Z({ name: "loader-circle" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/lock.svelte
function Rv(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [["rect", {
		width: "18",
		height: "11",
		x: "3",
		y: "11",
		rx: "2",
		ry: "2"
	}], ["path", { d: "M7 11V7a5 5 0 0 1 10 0v4" }]];
	$(e, Z({ name: "lock" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/maximize-2.svelte
function zv(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [
		["path", { d: "M15 3h6v6" }],
		["path", { d: "m21 3-7 7" }],
		["path", { d: "m3 21 7-7" }],
		["path", { d: "M9 21H3v-6" }]
	];
	$(e, Z({ name: "maximize-2" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/maximize.svelte
function Bv(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [
		["path", { d: "M8 3H5a2 2 0 0 0-2 2v3" }],
		["path", { d: "M21 8V5a2 2 0 0 0-2-2h-3" }],
		["path", { d: "M3 16v3a2 2 0 0 0 2 2h3" }],
		["path", { d: "M16 21h3a2 2 0 0 0 2-2v-3" }]
	];
	$(e, Z({ name: "maximize" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/merge.svelte
function Vv(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [
		["path", { d: "m8 6 4-4 4 4" }],
		["path", { d: "M12 2v10.3a4 4 0 0 1-1.172 2.872L4 22" }],
		["path", { d: "m20 22-5-5" }]
	];
	$(e, Z({ name: "merge" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/minus.svelte
function Hv(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [["path", { d: "M5 12h14" }]];
	$(e, Z({ name: "minus" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/mouse-pointer-click.svelte
function Uv(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [
		["path", { d: "M14 4.1 12 6" }],
		["path", { d: "m5.1 8-2.9-.8" }],
		["path", { d: "m6 12-1.9 2" }],
		["path", { d: "M7.2 2.2 8 5.1" }],
		["path", { d: "M9.037 9.69a.498.498 0 0 1 .653-.653l11 4.5a.5.5 0 0 1-.074.949l-4.349 1.041a1 1 0 0 0-.74.739l-1.04 4.35a.5.5 0 0 1-.95.074z" }]
	];
	$(e, Z({ name: "mouse-pointer-click" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/pause.svelte
function Wv(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [["rect", {
		x: "14",
		y: "3",
		width: "5",
		height: "18",
		rx: "1"
	}], ["rect", {
		x: "5",
		y: "3",
		width: "5",
		height: "18",
		rx: "1"
	}]];
	$(e, Z({ name: "pause" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/pencil.svelte
function Gv(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [["path", { d: "M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" }], ["path", { d: "m15 5 4 4" }]];
	$(e, Z({ name: "pencil" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/play.svelte
function Kv(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [["path", { d: "M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z" }]];
	$(e, Z({ name: "play" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/plus.svelte
function qv(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [["path", { d: "M5 12h14" }], ["path", { d: "M12 5v14" }]];
	$(e, Z({ name: "plus" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/power.svelte
function Jv(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [["path", { d: "M12 2v10" }], ["path", { d: "M18.4 6.6a9 9 0 1 1-12.77.04" }]];
	$(e, Z({ name: "power" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/redo-2.svelte
function Yv(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [["path", { d: "m15 14 5-5-5-5" }], ["path", { d: "M20 9H9.5A5.5 5.5 0 0 0 4 14.5A5.5 5.5 0 0 0 9.5 20H13" }]];
	$(e, Z({ name: "redo-2" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/refresh-cw.svelte
function Xv(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [
		["path", { d: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" }],
		["path", { d: "M21 3v5h-5" }],
		["path", { d: "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" }],
		["path", { d: "M8 16H3v5" }]
	];
	$(e, Z({ name: "refresh-cw" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/replace.svelte
function Zv(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [
		["path", { d: "M14 4a1 1 0 0 1 1-1" }],
		["path", { d: "M15 10a1 1 0 0 1-1-1" }],
		["path", { d: "M21 4a1 1 0 0 0-1-1" }],
		["path", { d: "M21 9a1 1 0 0 1-1 1" }],
		["path", { d: "m3 7 3 3 3-3" }],
		["path", { d: "M6 10V5a2 2 0 0 1 2-2h2" }],
		["rect", {
			x: "3",
			y: "14",
			width: "7",
			height: "7",
			rx: "1"
		}]
	];
	$(e, Z({ name: "replace" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/rotate-ccw.svelte
function Qv(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [["path", { d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" }], ["path", { d: "M3 3v5h5" }]];
	$(e, Z({ name: "rotate-ccw" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/rotate-cw.svelte
function $v(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [["path", { d: "M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" }], ["path", { d: "M21 3v5h-5" }]];
	$(e, Z({ name: "rotate-cw" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/route.svelte
function ey(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [
		["circle", {
			cx: "6",
			cy: "19",
			r: "3"
		}],
		["path", { d: "M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" }],
		["circle", {
			cx: "18",
			cy: "5",
			r: "3"
		}]
	];
	$(e, Z({ name: "route" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/rows-3.svelte
function ty(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [
		["rect", {
			width: "18",
			height: "18",
			x: "3",
			y: "3",
			rx: "2"
		}],
		["path", { d: "M21 9H3" }],
		["path", { d: "M21 15H3" }]
	];
	$(e, Z({ name: "rows-3" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/save.svelte
function ny(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [
		["path", { d: "M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" }],
		["path", { d: "M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7" }],
		["path", { d: "M7 3v4a1 1 0 0 0 1 1h7" }]
	];
	$(e, Z({ name: "save" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/scan.svelte
function ry(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [
		["path", { d: "M3 7V5a2 2 0 0 1 2-2h2" }],
		["path", { d: "M17 3h2a2 2 0 0 1 2 2v2" }],
		["path", { d: "M21 17v2a2 2 0 0 1-2 2h-2" }],
		["path", { d: "M7 21H5a2 2 0 0 1-2-2v-2" }]
	];
	$(e, Z({ name: "scan" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/scissors.svelte
function iy(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [
		["circle", {
			cx: "6",
			cy: "6",
			r: "3"
		}],
		["path", { d: "M8.12 8.12 12 12" }],
		["path", { d: "M20 4 8.12 15.88" }],
		["circle", {
			cx: "6",
			cy: "18",
			r: "3"
		}],
		["path", { d: "M14.8 14.8 20 20" }]
	];
	$(e, Z({ name: "scissors" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/search.svelte
function ay(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [["path", { d: "m21 21-4.34-4.34" }], ["circle", {
		cx: "11",
		cy: "11",
		r: "8"
	}]];
	$(e, Z({ name: "search" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/server.svelte
function oy(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [
		["rect", {
			width: "20",
			height: "8",
			x: "2",
			y: "2",
			rx: "2",
			ry: "2"
		}],
		["rect", {
			width: "20",
			height: "8",
			x: "2",
			y: "14",
			rx: "2",
			ry: "2"
		}],
		["line", {
			x1: "6",
			x2: "6.01",
			y1: "6",
			y2: "6"
		}],
		["line", {
			x1: "6",
			x2: "6.01",
			y1: "18",
			y2: "18"
		}]
	];
	$(e, Z({ name: "server" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/shield-check.svelte
function sy(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [["path", { d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" }], ["path", { d: "m9 12 2 2 4-4" }]];
	$(e, Z({ name: "shield-check" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/shuffle.svelte
function cy(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [
		["path", { d: "m18 14 4 4-4 4" }],
		["path", { d: "m18 2 4 4-4 4" }],
		["path", { d: "M2 18h1.973a4 4 0 0 0 3.3-1.7l5.454-8.6a4 4 0 0 1 3.3-1.7H22" }],
		["path", { d: "M2 6h1.972a4 4 0 0 1 3.6 2.2" }],
		["path", { d: "M22 18h-6.041a4 4 0 0 1-3.3-1.8l-.359-.45" }]
	];
	$(e, Z({ name: "shuffle" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/sigma.svelte
function ly(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [["path", { d: "M18 7V5a1 1 0 0 0-1-1H6.5a.5.5 0 0 0-.4.8l4.5 6a2 2 0 0 1 0 2.4l-4.5 6a.5.5 0 0 0 .4.8H17a1 1 0 0 0 1-1v-2" }]];
	$(e, Z({ name: "sigma" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/signpost.svelte
function uy(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [
		["path", { d: "M12 13v8" }],
		["path", { d: "M12 3v3" }],
		["path", { d: "M18 6a2 2 0 0 1 1.387.56l2.307 2.22a1 1 0 0 1 0 1.44l-2.307 2.22A2 2 0 0 1 18 13H6a2 2 0 0 1-1.387-.56l-2.306-2.22a1 1 0 0 1 0-1.44l2.306-2.22A2 2 0 0 1 6 6z" }]
	];
	$(e, Z({ name: "signpost" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/sliders-horizontal.svelte
function dy(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [
		["path", { d: "M10 5H3" }],
		["path", { d: "M12 19H3" }],
		["path", { d: "M14 3v4" }],
		["path", { d: "M16 17v4" }],
		["path", { d: "M21 12h-9" }],
		["path", { d: "M21 19h-5" }],
		["path", { d: "M21 5h-7" }],
		["path", { d: "M8 10v4" }],
		["path", { d: "M8 12H3" }]
	];
	$(e, Z({ name: "sliders-horizontal" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/sparkles.svelte
function fy(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [
		["path", { d: "M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" }],
		["path", { d: "M20 2v4" }],
		["path", { d: "M22 4h-4" }],
		["circle", {
			cx: "4",
			cy: "20",
			r: "2"
		}]
	];
	$(e, Z({ name: "sparkles" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/spline.svelte
function py(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [
		["circle", {
			cx: "19",
			cy: "5",
			r: "2"
		}],
		["circle", {
			cx: "5",
			cy: "19",
			r: "2"
		}],
		["path", { d: "M5 17A12 12 0 0 1 17 5" }]
	];
	$(e, Z({ name: "spline" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/split.svelte
function my(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [
		["path", { d: "M16 3h5v5" }],
		["path", { d: "M8 3H3v5" }],
		["path", { d: "M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3" }],
		["path", { d: "m15 9 6-6" }]
	];
	$(e, Z({ name: "split" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/square-function.svelte
function hy(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [
		["rect", {
			width: "18",
			height: "18",
			x: "3",
			y: "3",
			rx: "2",
			ry: "2"
		}],
		["path", { d: "M9 17c2 0 2.8-1 2.8-2.8V10c0-2 1-3.3 3.2-3" }],
		["path", { d: "M9 11.2h5.7" }]
	];
	$(e, Z({ name: "square-function" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/square.svelte
function gy(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [["rect", {
		width: "18",
		height: "18",
		x: "3",
		y: "3",
		rx: "2"
	}]];
	$(e, Z({ name: "square" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/table-2.svelte
function _y(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [["path", { d: "M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18" }]];
	$(e, Z({ name: "table-2" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/table.svelte
function vy(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [
		["path", { d: "M12 3v18" }],
		["rect", {
			width: "18",
			height: "18",
			x: "3",
			y: "3",
			rx: "2"
		}],
		["path", { d: "M3 9h18" }],
		["path", { d: "M3 15h18" }]
	];
	$(e, Z({ name: "table" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/tag.svelte
function yy(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [["path", { d: "M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" }], ["circle", {
		cx: "7.5",
		cy: "7.5",
		r: ".5",
		fill: "currentColor"
	}]];
	$(e, Z({ name: "tag" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/tags.svelte
function by(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [
		["path", { d: "M13.172 2a2 2 0 0 1 1.414.586l6.71 6.71a2.4 2.4 0 0 1 0 3.408l-4.592 4.592a2.4 2.4 0 0 1-3.408 0l-6.71-6.71A2 2 0 0 1 6 9.172V3a1 1 0 0 1 1-1z" }],
		["path", { d: "M2 7v6.172a2 2 0 0 0 .586 1.414l6.71 6.71a2.4 2.4 0 0 0 3.191.193" }],
		["circle", {
			cx: "10.5",
			cy: "6.5",
			r: ".5",
			fill: "currentColor"
		}]
	];
	$(e, Z({ name: "tags" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/terminal.svelte
function xy(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [["path", { d: "M12 19h8" }], ["path", { d: "m4 17 6-6-6-6" }]];
	$(e, Z({ name: "terminal" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/text-cursor-input.svelte
function Sy(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [
		["path", { d: "M12 20h-1a2 2 0 0 1-2-2 2 2 0 0 1-2 2H6" }],
		["path", { d: "M13 8h7a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-7" }],
		["path", { d: "M5 16H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h1" }],
		["path", { d: "M6 4h1a2 2 0 0 1 2 2 2 2 0 0 1 2-2h1" }],
		["path", { d: "M9 6v12" }]
	];
	$(e, Z({ name: "text-cursor-input" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/trash-2.svelte
function Cy(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [
		["path", { d: "M10 11v6" }],
		["path", { d: "M14 11v6" }],
		["path", { d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" }],
		["path", { d: "M3 6h18" }],
		["path", { d: "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" }]
	];
	$(e, Z({ name: "trash-2" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/triangle-alert.svelte
function wy(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [
		["path", { d: "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" }],
		["path", { d: "M12 9v4" }],
		["path", { d: "M12 17h.01" }]
	];
	$(e, Z({ name: "triangle-alert" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/type.svelte
function Ty(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [
		["path", { d: "M12 4v16" }],
		["path", { d: "M4 7V5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2" }],
		["path", { d: "M9 20h6" }]
	];
	$(e, Z({ name: "type" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/undo-2.svelte
function Ey(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [["path", { d: "M9 14 4 9l5-5" }], ["path", { d: "M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11" }]];
	$(e, Z({ name: "undo-2" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/upload.svelte
function Dy(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [
		["path", { d: "M12 3v12" }],
		["path", { d: "m17 8-5-5-5 5" }],
		["path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }]
	];
	$(e, Z({ name: "upload" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/variable.svelte
function Oy(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [
		["path", { d: "M8 21s-4-3-4-9 4-9 4-9" }],
		["path", { d: "M16 3s4 3 4 9-4 9-4 9" }],
		["line", {
			x1: "15",
			x2: "9",
			y1: "9",
			y2: "15"
		}],
		["line", {
			x1: "9",
			x2: "15",
			y1: "9",
			y2: "15"
		}]
	];
	$(e, Z({ name: "variable" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/wand-sparkles.svelte
function ky(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [
		["path", { d: "m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72" }],
		["path", { d: "m14 7 3 3" }],
		["path", { d: "M5 6v4" }],
		["path", { d: "M19 14v4" }],
		["path", { d: "M10 2v2" }],
		["path", { d: "M7 8H3" }],
		["path", { d: "M21 16h-4" }],
		["path", { d: "M11 3H9" }]
	];
	$(e, Z({ name: "wand-sparkles" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/wifi-off.svelte
function Ay(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [
		["path", { d: "M12 20h.01" }],
		["path", { d: "M8.5 16.429a5 5 0 0 1 7 0" }],
		["path", { d: "M5 12.859a10 10 0 0 1 5.17-2.69" }],
		["path", { d: "M19 12.859a10 10 0 0 0-2.007-1.523" }],
		["path", { d: "M2 8.82a15 15 0 0 1 4.177-2.643" }],
		["path", { d: "M22 8.82a15 15 0 0 0-11.288-3.764" }],
		["path", { d: "m2 2 20 20" }]
	];
	$(e, Z({ name: "wifi-off" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/workflow.svelte
function jy(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [
		["rect", {
			width: "8",
			height: "8",
			x: "3",
			y: "3",
			rx: "2"
		}],
		["path", { d: "M7 11v4a2 2 0 0 0 2 2h4" }],
		["rect", {
			width: "8",
			height: "8",
			x: "13",
			y: "13",
			rx: "2"
		}]
	];
	$(e, Z({ name: "workflow" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/wrench.svelte
function My(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [["path", { d: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z" }]];
	$(e, Z({ name: "wrench" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/x.svelte
function Ny(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [["path", { d: "M18 6 6 18" }], ["path", { d: "m6 6 12 12" }]];
	$(e, Z({ name: "x" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/zap.svelte
function Py(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [["path", { d: "M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" }]];
	$(e, Z({ name: "zap" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/zoom-in.svelte
function Fy(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [
		["circle", {
			cx: "11",
			cy: "11",
			r: "8"
		}],
		["line", {
			x1: "21",
			x2: "16.65",
			y1: "21",
			y2: "16.65"
		}],
		["line", {
			x1: "11",
			x2: "11",
			y1: "8",
			y2: "14"
		}],
		["line", {
			x1: "8",
			x2: "14",
			y1: "11",
			y2: "11"
		}]
	];
	$(e, Z({ name: "zoom-in" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region node_modules/lucide-svelte/dist/icons/zoom-out.svelte
function Iy(e, t) {
	let n = X(t, [
		"children",
		"$$slots",
		"$$events",
		"$$legacy"
	]), r = [
		["circle", {
			cx: "11",
			cy: "11",
			r: "8"
		}],
		["line", {
			x1: "21",
			x2: "16.65",
			y1: "21",
			y2: "16.65"
		}],
		["line", {
			x1: "8",
			x2: "14",
			y1: "11",
			y2: "11"
		}]
	];
	$(e, Z({ name: "zoom-out" }, () => n, {
		get iconNode() {
			return r;
		},
		children: (e, n) => {
			var r = H();
			q(F(r), t, "default", {}, null), U(e, r);
		},
		$$slots: { default: !0 }
	}));
}
//#endregion
//#region src/lib/icons.ts
var Ly = {
	activity: N_,
	"arrow-right-left": I_,
	"arrow-up-down": R_,
	binary: V_,
	blocks: H_,
	box: U_,
	braces: W_,
	calculator: K_,
	calendar: q_,
	code: iv,
	"code-xml": rv,
	"code-2": rv,
	columns: av,
	"columns-3": av,
	copy: ov,
	database: cv,
	"database-zap": sv,
	"file-code": mv,
	"file-json": pv,
	"file-text": hv,
	filter: vv,
	funnel: vv,
	"git-branch": yv,
	"git-fork": bv,
	"git-merge": xv,
	hash: Tv,
	"hard-drive-download": Cv,
	"hard-drive-upload": wv,
	key: kv,
	"key-round": kv,
	layers: Av,
	link: Nv,
	"list-checks": Pv,
	"list-filter": Fv,
	merge: Vv,
	pencil: Gv,
	replace: Zv,
	route: ey,
	rows: ty,
	"rows-3": ty,
	scissors: iy,
	search: ay,
	server: oy,
	shuffle: cy,
	sigma: ly,
	signpost: uy,
	sparkles: fy,
	split: my,
	table: vy,
	"table-2": _y,
	tag: yy,
	tags: by,
	terminal: xy,
	"text-cursor-input": Sy,
	type: Ty,
	variable: Oy,
	"wand-sparkles": ky,
	wand: ky,
	wrench: My,
	zap: Py,
	ban: B_,
	eye: fv,
	"eye-off": dv,
	function: hy,
	"square-function": hy,
	"function-square": hy,
	trash: Cy,
	"trash-2": Cy,
	upload: Dy,
	download: lv,
	workflow: jy,
	cable: G_,
	clock: nv,
	globe: Sv,
	inbox: Dv
}, Ry = {
	Source: cv,
	Transform: ky,
	Route: yv,
	Script: iv,
	Sink: wv
};
function zy(e, t) {
	if (e) {
		let t = e.trim().toLowerCase().replace(/([a-z0-9])([A-Z])/g, "$1-$2").replace(/_/g, "-");
		if (Ly[t]) return Ly[t];
	}
	return t && Ry[t] || U_;
}
var By = [
	"Source",
	"Transform",
	"Route",
	"Script",
	"Sink"
], Vy = {
	Source: "var(--cat-source)",
	Transform: "var(--cat-transform)",
	Route: "var(--cat-route)",
	Script: "var(--cat-script)",
	Sink: "var(--cat-sink)"
}, Hy = /* @__PURE__ */ V("<span><!></span>"), Uy = /* @__PURE__ */ V("<span class=\"e svelte-qnigrw\"> </span>"), Wy = /* @__PURE__ */ V("<div class=\"port svelte-qnigrw\"><span> </span> <!></div>"), Gy = /* @__PURE__ */ V("<div class=\"ports svelte-qnigrw\"></div>"), Ky = /* @__PURE__ */ V("<div role=\"presentation\"><!> <div class=\"head svelte-qnigrw\"><span><!></span> <span class=\"ic svelte-qnigrw\"><!></span> <div class=\"titles svelte-qnigrw\"><div class=\"type svelte-qnigrw\"> </div> <div class=\"name svelte-qnigrw\"> </div></div></div> <div><div class=\"s svelte-qnigrw\"><span class=\"k svelte-qnigrw\">In</span><span class=\"v svelte-qnigrw\"> </span></div> <div class=\"s svelte-qnigrw\"><span class=\"k svelte-qnigrw\">Out</span><span class=\"v svelte-qnigrw\"> </span></div> <div class=\"s svelte-qnigrw\"><span class=\"k svelte-qnigrw\">Rate</span><span class=\"v svelte-qnigrw\"> </span></div> <div class=\"s svelte-qnigrw\"><span class=\"k svelte-qnigrw\">Tasks / Errors</span> <span class=\"v svelte-qnigrw\"> <!></span></div></div> <!> <!></div>");
function qy(e, t) {
	k(t, !0);
	let n = v_(), r = Ag(), i = /* @__PURE__ */ j(() => t.data.node), a = /* @__PURE__ */ j(() => n.specs().get(z(i).type)), o = /* @__PURE__ */ j(() => w_(z(a), z(i).config)), s = /* @__PURE__ */ j(() => (z(a)?.inputs ?? 1) > 0), c = /* @__PURE__ */ j(() => z(a)?.inputs === 0), l = /* @__PURE__ */ j(() => zy(z(a)?.icon, z(a)?.category)), u = /* @__PURE__ */ j(() => z(a) ? Vy[z(a).category] : "var(--text-3)"), d = /* @__PURE__ */ j(() => n.issues().get(t.id) ?? []), f = /* @__PURE__ */ j(() => !z(a) || z(d).some((e) => e.level === "error")), p = /* @__PURE__ */ j(() => n.showStats() ? n.live.nodeStats.get(t.id) : void 0), m = /* @__PURE__ */ j(() => n.showStats() ? n.live.bulletins.filter((e) => e.nodeId === t.id && (e.level === "warn" || e.level === "error")) : []), h = /* @__PURE__ */ j(() => [...z(d).map((e) => `${e.level === "error" ? "Error" : "Warning"}: ${e.message}`), ...z(m).slice(-5).map((e) => `${e.level === "error" ? "Error" : "Warning"}: ${e.table ? `[${e.table}] ` : ""}${e.message}`)]), g = /* @__PURE__ */ j(() => z(d).some((e) => e.level === "error") || z(m).some((e) => e.level === "error")), _ = /* @__PURE__ */ j(() => n.live.detail?.status === "running" && !!z(p) && !z(i).disabled), v = /* @__PURE__ */ j(() => z(i).disabled ? "disabled" : z(f) ? "invalid" : z(_) ? "running" : "stopped"), y = {
		disabled: "Disabled",
		invalid: "Invalid",
		running: "Running",
		stopped: "Stopped"
	}, b = /* @__PURE__ */ j(() => z(a)?.supportsConcurrency ? Math.max(1, z(i).concurrency || D_(z(a))) : 1), x = /* @__PURE__ */ j(() => z(p) ? z(c) ? "—" : i_(z(p).rowsIn) : "—"), S = /* @__PURE__ */ j(() => z(p) ? i_(z(p).rowsOut) : "—"), C = /* @__PURE__ */ j(() => z(p) ? `${i_(Math.round(z(p).rowsPerSec))}/s` : "—"), w = /* @__PURE__ */ j(() => z(p) ? `${z(p).active}/${z(b)}` : `${z(b)}`), T = /* @__PURE__ */ j(() => z(p)?.errors ?? 0), ee = /* @__PURE__ */ j(() => z(o).join("|") + (z(s) ? "1" : "0"));
	Fn(() => {
		z(ee), r(t.id);
	});
	var te = Ky();
	let ne, re;
	var ie = P(te), ae = (e) => {
		var t = Hy();
		let n;
		wy(P(t), {
			size: 11,
			strokeWidth: 2.4
		}), D(t), R((e) => {
			n = J(t, 1, "bul svelte-qnigrw", null, n, { err: z(g) }), Y(t, "title", e);
		}, [() => z(h).join("\n")]), U(e, t);
	};
	G(ie, (e) => {
		z(h).length && e(ae);
	});
	var oe = L(ie, 2), se = P(oe), ce = P(se), le = (e) => {
		Kv(e, {
			size: 11,
			fill: "currentColor",
			strokeWidth: 0
		});
	}, ue = (e) => {
		wy(e, {
			size: 11,
			strokeWidth: 2.4
		});
	}, de = (e) => {
		Wv(e, {
			size: 11,
			fill: "currentColor",
			strokeWidth: 0
		});
	}, fe = (e) => {
		gy(e, {
			size: 10,
			fill: "currentColor",
			strokeWidth: 0
		});
	};
	G(ce, (e) => {
		z(v) === "running" ? e(le) : z(v) === "invalid" ? e(ue, 1) : z(v) === "disabled" ? e(de, 2) : e(fe, -1);
	}), D(se);
	var pe = L(se, 2);
	Pi(P(pe), () => z(l), (e, t) => {
		t(e, {
			size: 13,
			strokeWidth: 1.9
		});
	}), D(pe);
	var me = L(pe, 2), he = P(me), ge = I(he, !0), _e = L(he, 2), ve = I(_e, !0);
	D(me), D(oe);
	var ye = L(oe, 2);
	let be;
	var xe = P(ye), Se = I(L(P(xe)), !0);
	D(xe);
	var Ce = L(xe, 2), we = I(L(P(Ce)), !0);
	D(Ce);
	var Te = L(Ce, 2), Ee = I(L(P(Te)), !0);
	D(Te);
	var E = L(Te, 2), De = L(P(E), 2), Oe = P(De, !0), ke = L(Oe), Ae = (e) => {
		var t = Uy(), n = I(t);
		R((e) => W(n, `· ${e ?? ""}`), [() => i_(z(T))]), U(e, t);
	};
	G(ke, (e) => {
		z(T) > 0 && e(Ae);
	}), D(De), D(E), D(ye);
	var O = L(ye, 2), je = (e) => {
		var t = Gy();
		K(t, 20, () => z(o), (e) => e, (e, t) => {
			var n = Wy(), r = P(n);
			let i;
			var a = I(r, !0), o = L(r, 2);
			{
				let e = /* @__PURE__ */ j(() => t === "failure" ? "h-fail" : "");
				om(o, {
					type: "source",
					get position() {
						return Od.Right;
					},
					get id() {
						return t;
					},
					get class() {
						return `h h-out ${z(e) ?? ""}`;
					}
				});
			}
			D(n), R(() => {
				i = J(r, 1, "pill svelte-qnigrw", null, i, { fail: t === "failure" }), W(a, t);
			}), U(e, n);
		}), D(t), U(e, t);
	};
	G(O, (e) => {
		z(o).length && e(je);
	});
	var Me = L(O, 2), Ne = (e) => {
		om(e, {
			type: "target",
			get position() {
				return Od.Left;
			},
			id: "in",
			class: "h h-in"
		});
	};
	G(Me, (e) => {
		z(s) && e(Ne);
	}), D(te), R((e) => {
		ne = J(te, 1, "pn svelte-qnigrw", null, ne, {
			selected: t.selected,
			disabled: z(i).disabled
		}), re = qi(te, "", re, { "--cat": z(u) }), J(se, 1, `st ${z(v) ?? ""}`, "svelte-qnigrw"), Y(se, "title", y[z(v)]), Y(he, "title", z(a)?.label ?? z(i).type), W(ge, z(a)?.label ?? `Unknown · ${z(i).type}`), Y(_e, "title", z(i).name), W(ve, z(i).name), be = J(ye, 1, "stats svelte-qnigrw", null, be, { idle: !z(p) }), Y(ye, "title", e), W(Se, z(x)), W(we, z(S)), W(Ee, z(C)), W(Oe, z(w));
	}, [() => z(p) ? `${r_(z(p).rowsIn)} in · ${r_(z(p).rowsOut)} out · ${r_(z(p).batchesIn)} batches` : "No run yet"]), B("dblclick", te, () => n.opennode(t.id)), U(e, te), A();
}
Hr(["dblclick"]);
//#endregion
//#region src/lib/canvas/FlowEdge.svelte
var Jy = /* @__PURE__ */ V("<span class=\"tb svelte-l3e637\"> </span>"), Yy = /* @__PURE__ */ V("<span class=\"bar svelte-l3e637\"><span></span></span>"), Xy = /* @__PURE__ */ V("<div><div class=\"r1 svelte-l3e637\"><span class=\"rel svelte-l3e637\"> </span> <!></div> <div class=\"r2 svelte-l3e637\"><span class=\"qk svelte-l3e637\">Queued</span> <span class=\"q svelte-l3e637\"> <span class=\"cap svelte-l3e637\"> </span></span> <!></div></div>"), Zy = /* @__PURE__ */ V("<!> <!>", 1);
function Qy(e, t) {
	k(t, !0);
	let n = v_(), r = /* @__PURE__ */ j(() => Gf({
		sourceX: t.sourceX,
		sourceY: t.sourceY,
		targetX: t.targetX,
		targetY: t.targetY,
		sourcePosition: t.sourcePosition,
		targetPosition: t.targetPosition,
		borderRadius: 8,
		offset: 20
	})), i = /* @__PURE__ */ j(() => t.sourceHandleId ?? t.data?.edge.fromPort ?? ""), a = /* @__PURE__ */ j(() => n.live.active && n.showStats()), o = /* @__PURE__ */ j(() => z(a) ? n.live.edgeStats.get(t.id) : void 0), s = /* @__PURE__ */ j(() => z(o)?.capacityRows || t.data?.edge.backPressureRows || 2e4), c = /* @__PURE__ */ j(() => z(o)?.queuedRows ?? 0), l = /* @__PURE__ */ j(() => l_(z(c), z(s))), u = /* @__PURE__ */ j(() => z(l) >= 90 ? "full" : z(l) >= 60 ? "warn" : "ok"), d = /* @__PURE__ */ j(() => n.edgeIssues().get(t.id) ?? []), f = /* @__PURE__ */ j(() => t.data?.edge.tables ?? []), p = /* @__PURE__ */ j(() => z(f).length <= 2 ? z(f).join(", ") : `${z(f).length} tables`), m = -1, h = /* @__PURE__ */ M(!1);
	Fn(() => {
		let e = z(o)?.rowsPassed ?? -1;
		N(h, !!z(o) && m >= 0 && e > m, !0), m = e;
	});
	var g = Zy(), _ = F(g);
	{
		let e = /* @__PURE__ */ j(() => [
			"fe",
			z(i) === "failure" && "fail",
			z(h) && "flowing",
			t.selected && "sel",
			z(d).length > 0 && "issue"
		].filter(Boolean).join(" "));
		Dm(_, {
			get id() {
				return t.id;
			},
			get path() {
				return z(r)[0];
			},
			get markerEnd() {
				return t.markerEnd;
			},
			get class() {
				return z(e);
			},
			interactionWidth: 16
		});
	}
	var v = L(_, 2), y = (e) => {
		Cm(e, {
			get x() {
				return z(r)[1];
			},
			get y() {
				return z(r)[2];
			},
			selectEdgeOnClick: !0,
			children: (e, n) => {
				var r = Xy();
				let a;
				var m = P(r), h = P(m), g = I(h, !0), _ = L(h, 2), v = (e) => {
					var t = Jy(), n = I(t);
					R((e) => {
						Y(t, "title", `Only these tables: ${e ?? ""}`), W(n, `▦ ${z(p) ?? ""}`);
					}, [() => z(f).join(", ")]), U(e, t);
				};
				G(_, (e) => {
					z(f).length && e(v);
				}), D(m);
				var y = L(m, 2), b = L(P(y), 2), x = P(b, !0), S = I(L(x));
				D(b);
				var C = L(b, 2), w = (e) => {
					var t = Yy(), n = P(t);
					let r;
					D(t), R((e) => {
						J(n, 1, Bi(z(u)), "svelte-l3e637"), r = qi(n, "", r, { width: e });
					}, [() => `${Math.max(z(l), z(c) > 0 ? 4 : 0)}%`]), U(e, t);
				};
				G(C, (e) => {
					z(o) && e(w);
				}), D(y), D(r), R((e, n, o) => {
					a = J(r, 1, "lbl svelte-l3e637", null, a, {
						sel: t.selected,
						fail: z(i) === "failure",
						issue: z(d).length > 0
					}), Y(r, "title", e), W(g, z(i)), W(x, n), W(S, `/${o ?? ""}`);
				}, [
					() => [
						`${z(i)}`,
						z(o) ? `queued ${r_(z(c))} / ${r_(z(s))} · ${r_(z(o).rowsPassed)} passed` : "",
						...z(d).map((e) => e.message)
					].filter(Boolean).join("\n"),
					() => i_(z(c)),
					() => i_(z(s))
				]), U(e, r);
			},
			$$slots: { default: !0 }
		});
	};
	G(v, (e) => {
		e(y);
	}), U(e, g), A();
}
//#endregion
//#region src/lib/components/Skeleton.svelte
var $y = /* @__PURE__ */ V("<div class=\"skeleton\"></div>"), eb = /* @__PURE__ */ V("<div class=\"sk svelte-x2cdj9\"></div>");
function tb(e, t) {
	let n = Q(t, "rows", 3, 5), r = Q(t, "height", 3, 14);
	var i = eb();
	K(i, 21, () => Array(n()), Ti, (e, t, n) => {
		var i = $y();
		let a;
		R(() => a = qi(i, "", a, {
			height: `${r() ?? ""}px`,
			width: `${90 - n * 17 % 35}%`
		})), U(e, i);
	}), D(i), U(e, i);
}
//#endregion
//#region src/lib/canvas/Palette.svelte
var nb = /* @__PURE__ */ V("<div class=\"item svelte-1v5grgn\" role=\"button\" tabindex=\"0\" draggable=\"true\"><span class=\"ic svelte-1v5grgn\"><!></span> <div class=\"txt svelte-1v5grgn\"><div class=\"lb ellipsis svelte-1v5grgn\"> </div> <div class=\"ds ellipsis svelte-1v5grgn\"> </div></div></div>"), rb = /* @__PURE__ */ V("<button class=\"gh svelte-1v5grgn\"><!> <span class=\"cdot svelte-1v5grgn\"></span> <span class=\"spacer\"></span> <span class=\"muted tiny\"> </span></button> <!>", 1), ib = /* @__PURE__ */ V("<div class=\"empty small\"> </div>"), ab = /* @__PURE__ */ V("<aside class=\"palette svelte-1v5grgn\"><div class=\"ph svelte-1v5grgn\"><div class=\"search svelte-1v5grgn\"><!> <input class=\"input svelte-1v5grgn\" placeholder=\"Search processors…\"/></div></div> <div class=\"groups scroll svelte-1v5grgn\"><!></div> <div class=\"hint tiny muted svelte-1v5grgn\">Drag onto the canvas · double-click to add</div></aside>");
function ob(e, t) {
	k(t, !0);
	let n = /* @__PURE__ */ M(""), r = pn({}), i = /* @__PURE__ */ j(() => {
		let e = z(n).trim().toLowerCase(), r = (t) => !e || t.label.toLowerCase().includes(e) || t.type.toLowerCase().includes(e) || t.description?.toLowerCase().includes(e);
		return [...By, ...new Set(t.processors.map((e) => e.category).filter((e) => !By.includes(e)))].map((e) => ({
			cat: e,
			items: t.processors.filter((t) => t.category === e && r(t))
		})).filter((e) => e.items.length);
	});
	function a(e, t) {
		e.dataTransfer?.setData("application/nifi-processor", t.type), e.dataTransfer?.setData("text/plain", t.type), e.dataTransfer && (e.dataTransfer.effectAllowed = "copy");
	}
	var o = ab(), s = P(o), c = P(s), l = P(c);
	ay(l, { size: 13 });
	var u = L(l, 2);
	da(u), D(c), D(s);
	var d = L(s, 2), f = P(d), p = (e) => {
		tb(e, {
			rows: 10,
			height: 22
		});
	}, m = (e) => {
		var o = H();
		K(F(o), 17, () => z(i), (e) => e.cat, (e, i) => {
			var o = rb(), s = F(o), c = P(s), l = (e) => {
				Q_(e, { size: 12 });
			}, u = (e) => {
				Y_(e, { size: 12 });
			};
			G(c, (e) => {
				r[z(i).cat] && !z(n) ? e(l) : e(u, -1);
			});
			var d = L(c, 2);
			let f;
			var p = L(d), m = I(L(p, 3), !0);
			D(s);
			var h = L(s, 2), g = (e) => {
				var n = H();
				K(F(n), 17, () => z(i).items, (e) => e.type, (e, n) => {
					let r = /* @__PURE__ */ j(() => zy(z(n).icon, z(n).category));
					var i = nb();
					let o;
					var s = P(i);
					Pi(P(s), () => z(r), (e, t) => {
						t(e, { size: 14 });
					}), D(s);
					var c = L(s, 2), l = P(c), u = I(l, !0), d = I(L(l, 2), !0);
					D(c), D(i), R(() => {
						Y(i, "title", `${z(n).description ?? ""}\\n\\nDrag onto the canvas (or double-click) to add.`), o = qi(i, "", o, { "--cat": Vy[z(n).category] }), W(u, z(n).label), W(d, z(n).description);
					}), Vr("dragstart", i, (e) => a(e, z(n))), B("dblclick", i, () => t.onadd(z(n).type)), B("keydown", i, (e) => e.key === "Enter" && t.onadd(z(n).type)), U(e, i);
				}), U(e, n);
			};
			G(h, (e) => {
				(!r[z(i).cat] || z(n)) && e(g);
			}), R(() => {
				f = qi(d, "", f, { background: Vy[z(i).cat] }), W(p, ` ${z(i).cat ?? ""} `), W(m, z(i).items.length);
			}), B("click", s, () => r[z(i).cat] = !r[z(i).cat]), U(e, o);
		}, (e) => {
			var n = ib(), r = I(n, !0);
			R(() => W(r, t.processors.length ? "No processors match." : "No processors available.")), U(e, n);
		}), U(e, o);
	};
	G(f, (e) => {
		t.loaded ? e(m, -1) : e(p);
	}), D(d), O(2), D(o), ya(u, () => z(n), (e) => N(n, e)), U(e, o), A();
}
Hr([
	"click",
	"dblclick",
	"keydown"
]);
//#endregion
//#region src/lib/canvas/fields/ColumnPicker.svelte
var sb = /* @__PURE__ */ V("<div class=\"gt mono svelte-l8d74y\"> </div>"), cb = /* @__PURE__ */ V("<button type=\"button\"><span class=\"mono\"> </span><span class=\"t svelte-l8d74y\"> </span></button>"), lb = /* @__PURE__ */ V("<!> <!>", 1), ub = /* @__PURE__ */ V("<div class=\"dd scroll svelte-l8d74y\"></div>"), db = /* @__PURE__ */ V("<div class=\"cp svelte-l8d74y\"><input class=\"input mono\" autocomplete=\"off\" spellcheck=\"false\"/> <!></div>");
function fb(e, t) {
	k(t, !0);
	let n = Q(t, "value", 15), r = Q(t, "groups", 19, () => []), i = Q(t, "placeholder", 3, "column"), a = Q(t, "clearOnPick", 3, !1), o = Q(t, "exclude", 19, () => []), s = /* @__PURE__ */ M(!1), c = /* @__PURE__ */ M(0), l = /* @__PURE__ */ j(() => {
		let e = (n() ?? "").toLowerCase(), t = !e || r().some((e) => e.columns.some((e) => e.name === n()));
		return r().map((n) => ({
			table: n.table,
			columns: n.columns.filter((n) => !o().includes(n.name) && (t || n.name.toLowerCase().includes(e)))
		})).filter((e) => e.columns.length);
	}), u = /* @__PURE__ */ j(() => z(l).flatMap((e) => e.columns.map((e) => e.name))), d = /* @__PURE__ */ j(() => r().length > 1);
	function f(e) {
		t.onpick?.(e), n(a() ? "" : e), N(s, !1);
	}
	function p(e) {
		e.key === "ArrowDown" ? (N(s, !0), N(c, Math.min(z(u).length - 1, z(c) + 1), !0), e.preventDefault()) : e.key === "ArrowUp" ? (N(c, Math.max(0, z(c) - 1), !0), e.preventDefault()) : e.key === "Enter" ? (e.preventDefault(), z(s) && z(u)[z(c)] ? f(z(u)[z(c)]) : n()?.trim() && f(n().trim())) : e.key === "Escape" && z(s) && (N(s, !1), e.stopPropagation());
	}
	var m = db(), h = P(m);
	da(h);
	var g = L(h, 2), _ = (e) => {
		var t = ub();
		K(t, 21, () => z(l), Ti, (e, t) => {
			var n = lb(), r = F(n), i = (e) => {
				var n = sb(), r = I(n, !0);
				R(() => W(r, z(t).table)), U(e, n);
			};
			G(r, (e) => {
				z(d) && e(i);
			}), K(L(r, 2), 17, () => z(t).columns, Ti, (e, t) => {
				let n = /* @__PURE__ */ j(() => z(u).indexOf(z(t).name));
				var r = cb();
				let i;
				var a = P(r), o = I(a, !0), s = I(L(a), !0);
				D(r), R(() => {
					i = J(r, 1, "opt svelte-l8d74y", null, i, { act: z(n) === z(c) }), W(o, z(t).name), W(s, z(t).type);
				}), B("mousedown", r, (e) => (e.preventDefault(), f(z(t).name))), U(e, r);
			}), U(e, n);
		}), D(t), U(e, t);
	};
	G(g, (e) => {
		z(s) && z(u).length && e(_);
	}), D(m), R(() => Y(h, "placeholder", i())), Vr("focus", h, () => (N(s, !0), N(c, 0))), Vr("blur", h, () => setTimeout(() => N(s, !1), 120)), B("input", h, () => (N(s, !0), N(c, 0))), B("keydown", h, p), ya(h, n), U(e, m), A();
}
Hr([
	"input",
	"keydown",
	"mousedown"
]);
//#endregion
//#region src/lib/canvas/fields/ColumnsField.svelte
var pb = /* @__PURE__ */ V("<span> <button type=\"button\" class=\"svelte-w49nlv\"><!></button></span>"), mb = /* @__PURE__ */ V("<div class=\"chips svelte-w49nlv\"></div>"), hb = /* @__PURE__ */ V("<button type=\"button\" class=\"link svelte-w49nlv\">clear</button>"), gb = /* @__PURE__ */ V("<div class=\"row tiny\"><button type=\"button\" class=\"link svelte-w49nlv\">add all</button> <!></div>"), _b = /* @__PURE__ */ V("<div class=\"cols svelte-w49nlv\"><!> <div class=\"row\"><!></div> <!></div>");
function vb(e, t) {
	k(t, !0);
	let n = Q(t, "value", 15), r = /* @__PURE__ */ M(""), i = /* @__PURE__ */ j(() => Array.isArray(n()) ? n() : []), a = /* @__PURE__ */ j(() => [...new Set(t.groups.flatMap((e) => e.columns.map((e) => e.name)))]);
	function o(e) {
		e = e.trim(), e && !z(i).includes(e) && n([...z(i), e]);
	}
	function s(e) {
		n(z(i).filter((t) => t !== e));
	}
	var c = _b(), l = P(c), u = (e) => {
		var t = mb();
		K(t, 20, () => z(i), (e) => e, (e, t) => {
			var n = pb();
			let r;
			var i = P(n, !0), o = L(i);
			Ny(P(o), { size: 11 }), D(o), D(n), R((e, a) => {
				r = J(n, 1, "chip mono svelte-w49nlv", null, r, { unknown: e }), Y(n, "title", a), W(i, t), Y(o, "aria-label", `Remove ${t ?? ""}`);
			}, [() => z(a).length > 0 && !z(a).includes(t), () => z(a).length && !z(a).includes(t) ? "Not in the input schema" : t]), B("click", o, () => s(t)), U(e, n);
		}), D(t), U(e, t);
	};
	G(l, (e) => {
		z(i).length && e(u);
	});
	var d = L(l, 2);
	fb(P(d), {
		get groups() {
			return t.groups;
		},
		clearOnPick: !0,
		get exclude() {
			return z(i);
		},
		placeholder: "Add column…",
		onpick: o,
		get value() {
			return z(r);
		},
		set value(e) {
			N(r, e, !0);
		}
	}), D(d);
	var f = L(d, 2), p = (e) => {
		var t = gb(), r = P(t), o = L(r, 2), s = (e) => {
			var t = hb();
			B("click", t, () => n([])), U(e, t);
		};
		G(o, (e) => {
			z(i).length && e(s);
		}), D(t), B("click", r, () => n([.../* @__PURE__ */ new Set([...z(i), ...z(a)])])), U(e, t);
	};
	G(f, (e) => {
		z(a).length && e(p);
	}), D(c), U(e, c), A();
}
Hr(["click"]);
//#endregion
//#region src/lib/tables.ts
function yb(e, t) {
	return !e.schema || t === "mysql" || t === "postgres" && e.schema === "public" ? e.name : t ? `${e.schema}.${e.name}` : e.name;
}
//#endregion
//#region src/lib/canvas/fields/TableField.svelte
var bb = /* @__PURE__ */ new Map(), xb = /* @__PURE__ */ V("<textarea class=\"textarea mono\" rows=\"3\" placeholder=\"customers, orders\"></textarea> <span class=\"help\">Comma-separated table names. Browsing tables needs the data permission.</span>", 1), Sb = /* @__PURE__ */ V("<input class=\"input mono\" placeholder=\"table\"/>"), Cb = /* @__PURE__ */ V("<div class=\"muted small\">Choose a connection first.</div>"), wb = /* @__PURE__ */ V("<option> </option>"), Tb = /* @__PURE__ */ V("<div class=\"errtxt small svelte-1mb1v6q\"> </div>"), Eb = /* @__PURE__ */ V("<div class=\"row\"><input class=\"input mono\"/> <button type=\"button\" class=\"btn icon\" title=\"Reload tables\"><!></button></div> <datalist></datalist> <!>", 1), Db = /* @__PURE__ */ V("<div class=\"muted small pad svelte-1mb1v6q\">Loading…</div>"), Ob = /* @__PURE__ */ V("<div class=\"errtxt small pad svelte-1mb1v6q\"> </div>"), kb = /* @__PURE__ */ V("<span class=\"warn svelte-1mb1v6q\" title=\"No primary key\"><!></span>"), Ab = /* @__PURE__ */ V("<label class=\"ti svelte-1mb1v6q\"><input type=\"checkbox\" class=\"svelte-1mb1v6q\"/> <span class=\"mono ellipsis\"> </span> <!> <span class=\"spacer\"></span> <span class=\"tiny muted num\"> </span></label>"), jb = /* @__PURE__ */ V("<div class=\"muted small pad svelte-1mb1v6q\">No tables.</div>"), Mb = /* @__PURE__ */ V("<div class=\"multi svelte-1mb1v6q\"><div class=\"mh svelte-1mb1v6q\"><div class=\"search svelte-1mb1v6q\"><!><input class=\"input svelte-1mb1v6q\" placeholder=\"Filter…\"/></div> <button type=\"button\" class=\"btn sm\">All</button> <button type=\"button\" class=\"btn sm\">None</button></div> <div class=\"tl scroll svelte-1mb1v6q\"><!></div> <div class=\"tiny muted\"> </div></div>");
function Nb(e, t) {
	k(t, !0);
	let n = Q(t, "value", 15), r = Q(t, "multi", 3, !1), i = /* @__PURE__ */ M(null), a = /* @__PURE__ */ M(""), o = /* @__PURE__ */ M(""), s = /* @__PURE__ */ j(() => Hg.connections.find((e) => e.id === t.connectionId));
	async function c(e, n = !1) {
		if (N(a, ""), !n && bb.has(e)) {
			N(i, bb.get(e), !0);
			return;
		}
		N(i, null);
		try {
			let n = (await Bg.tables(e) ?? []).sort((e, t) => e.name.localeCompare(t.name));
			bb.set(e, n), e === t.connectionId && N(i, n, !0);
		} catch (n) {
			e === t.connectionId && (N(a, n.message, !0), N(i, [], !0));
		}
	}
	let l = /* @__PURE__ */ j(() => n_.can.data), u = /* @__PURE__ */ M("");
	Fn(() => {
		!z(l) && r() && N(u, Array.isArray(n()) ? n().join(", ") : "", !0);
	}), Fn(() => {
		z(l) && (t.connectionId ? c(t.connectionId) : N(i, null));
	});
	let d = /* @__PURE__ */ j(() => (z(i) ?? []).map((e) => ({
		t: e,
		ref: yb(e, z(s)?.driver)
	}))), f = /* @__PURE__ */ j(() => z(d).filter((e) => !z(o) || e.ref.toLowerCase().includes(z(o).toLowerCase()))), p = /* @__PURE__ */ j(() => new Set(r() && Array.isArray(n()) ? n() : []));
	function m(e) {
		let t = new Set(z(p));
		t.has(e) ? t.delete(e) : t.add(e), n(z(d).map((e) => e.ref).filter((e) => t.has(e)).concat([...t].filter((e) => !z(d).some((t) => t.ref === e))));
	}
	var h = H(), g = F(h), _ = (e) => {
		var t = H(), i = F(t), a = (e) => {
			var t = xb(), r = F(t);
			_t(r), O(2), R(() => fa(r, z(u))), B("change", r, (e) => n(e.currentTarget.value.split(/[\s,]+/).map((e) => e.trim()).filter(Boolean))), U(e, t);
		}, o = (e) => {
			var t = Sb();
			da(t), R(() => fa(t, n() ?? "")), B("input", t, (e) => n(e.currentTarget.value)), U(e, t);
		};
		G(i, (e) => {
			r() ? e(a) : e(o, -1);
		}), U(e, t);
	}, v = (e) => {
		U(e, Cb());
	}, y = (e) => {
		var r = Eb(), o = F(r), s = P(o);
		da(s);
		var l = L(s, 2);
		Xv(P(l), { size: 13 }), D(l), D(o);
		var u = L(o, 2);
		K(u, 21, () => z(d), Ti, (e, t) => {
			var n = wb(), r = I(n), i = {};
			R((e) => {
				W(r, `~${e ?? ""} rows`), i !== (i = z(t).ref) && (n.value = (n.__value = i) ?? "");
			}, [() => i_(z(t).t.estimatedRows)]), U(e, n);
		}), D(u);
		var f = L(u, 2), p = (e) => {
			var t = Tb(), n = I(t, !0);
			R(() => W(n, z(a))), U(e, t);
		};
		G(f, (e) => {
			z(a) && e(p);
		}), R(() => {
			Y(s, "list", `tbl-${t.connectionId ?? ""}`), Y(s, "placeholder", z(i) === null ? "Loading tables…" : "table"), Y(u, "id", `tbl-${t.connectionId ?? ""}`);
		}), ya(s, n), B("click", l, () => t.connectionId && c(t.connectionId, !0)), U(e, r);
	}, b = (e) => {
		var t = Mb(), r = P(t), s = P(r), c = P(s);
		ay(c, { size: 12 });
		var l = L(c);
		da(l), D(s);
		var u = L(s, 2), d = L(u, 2);
		D(r);
		var h = L(r, 2), g = P(h), _ = (e) => {
			U(e, Db());
		}, v = (e) => {
			var t = Ob(), n = I(t, !0);
			R(() => W(n, z(a))), U(e, t);
		}, y = (e) => {
			var t = H();
			K(F(t), 17, () => z(f), (e) => e.ref, (e, t) => {
				var n = Ab(), r = P(n);
				da(r);
				var i = L(r, 2), a = I(i, !0), o = L(i, 2), s = (e) => {
					var t = kb();
					wy(P(t), { size: 11 }), D(t), U(e, t);
				};
				G(o, (e) => {
					z(t).t.hasPrimaryKey || e(s);
				});
				var c = I(L(o, 4), !0);
				D(n), R((e, n) => {
					pa(r, e), W(a, z(t).ref), W(c, n);
				}, [() => z(p).has(z(t).ref), () => i_(z(t).t.estimatedRows)]), B("change", r, () => m(z(t).ref)), U(e, n);
			}, (e) => {
				U(e, jb());
			}), U(e, t);
		};
		G(g, (e) => {
			z(i) === null ? e(_) : z(a) ? e(v, 1) : e(y, -1);
		}), D(h);
		var b = I(L(h, 2), !0);
		D(t), R(() => W(b, z(p).size ? `${z(p).size} selected` : "None selected = all tables")), ya(l, () => z(o), (e) => N(o, e)), B("click", u, () => n([.../* @__PURE__ */ new Set([...Array.isArray(n()) ? n() : [], ...z(f).map((e) => e.ref)])])), B("click", d, () => n([])), U(e, t);
	};
	G(g, (e) => {
		z(l) ? t.connectionId ? r() ? e(b, -1) : e(y, 2) : e(v, 1) : e(_);
	}), U(e, h), A();
}
Hr([
	"change",
	"input",
	"click"
]);
//#endregion
//#region src/lib/components/Modal.svelte
var Pb = /* @__PURE__ */ V("<footer class=\"svelte-ta60gp\"><!></footer>"), Fb = /* @__PURE__ */ V("<div class=\"backdrop svelte-ta60gp\" role=\"presentation\"><div class=\"modal svelte-ta60gp\" role=\"dialog\" aria-modal=\"true\"><header class=\"svelte-ta60gp\"><h2 class=\"svelte-ta60gp\"> </h2> <!> <span class=\"spacer\"></span> <button class=\"btn ghost icon\" aria-label=\"Close\"><!></button></header> <div class=\"body svelte-ta60gp\"><!></div> <!></div></div>");
function Ib(e, t) {
	k(t, !0);
	let n = Q(t, "width", 3, "560px");
	function r(e) {
		e.key === "Escape" && (e.stopPropagation(), t.onclose());
	}
	var i = Fb();
	Vr("keydown", gn, r);
	var a = P(i);
	let o;
	var s = P(a), c = P(s), l = I(c, !0), u = L(c, 2);
	vi(u, () => t.headerExtra ?? g);
	var d = L(u, 4);
	Ny(P(d), { size: 16 }), D(d), D(s);
	var f = L(s, 2);
	vi(P(f), () => t.children), D(f);
	var p = L(f, 2), m = (e) => {
		var n = Pb();
		vi(P(n), () => t.footer), D(n), U(e, n);
	};
	G(p, (e) => {
		t.footer && e(m);
	}), D(a), D(i), R(() => {
		Y(a, "aria-label", t.title), o = qi(a, "", o, {
			width: n(),
			height: t.height
		}), W(l, t.title);
	}), B("mousedown", i, (e) => e.target === e.currentTarget && t.onclose()), B("click", d, function(...e) {
		t.onclose?.apply(this, e);
	}), U(e, i), A();
}
Hr(["mousedown", "click"]);
//#endregion
//#region src/lib/canvas/fields/ExprField.svelte
var Lb = /* @__PURE__ */ V("<button type=\"button\" title=\"Evaluate against a sample row from preview\"><!> </button>"), Rb = /* @__PURE__ */ V("<span class=\"fhelp svelte-jdz90d\"> </span>"), zb = /* @__PURE__ */ V("<button type=\"button\" class=\"fn svelte-jdz90d\"><span class=\"mono fname svelte-jdz90d\"> <span class=\"args svelte-jdz90d\"> </span></span> <!></button>"), Bb = /* @__PURE__ */ V("<div class=\"fg tiny muted svelte-jdz90d\"> </div> <!>", 1), Vb = /* @__PURE__ */ V("<p class=\"tiny muted pad svelte-jdz90d\"> </p>"), Hb = /* @__PURE__ */ V("<button type=\"button\" class=\"scrim svelte-jdz90d\" aria-label=\"Close function list\"></button> <div class=\"fns svelte-jdz90d\" role=\"dialog\" aria-label=\"Functions\"><div class=\"fsearch svelte-jdz90d\"><!><input class=\"input sm svelte-jdz90d\" placeholder=\"Search functions\"/></div> <div class=\"flist svelte-jdz90d\"></div> <p class=\"tiny muted pad svelte-jdz90d\">Columns are variables: <span class=\"mono\">email</span>, or <span class=\"mono\">row[\"Name\"]</span> when the name is unusual. Click a function to insert it.</p></div>", 1), Ub = /* @__PURE__ */ V("<span class=\"mono\"> </span>"), Wb = /* @__PURE__ */ V("<span> </span> <span class=\"badge\"> </span>", 1), Gb = /* @__PURE__ */ V("<option></option>"), Kb = /* @__PURE__ */ V("<select class=\"rowsel svelte-jdz90d\" title=\"Sample row\"></select>"), qb = /* @__PURE__ */ V("<span class=\"tiny muted\"> </span>"), Jb = /* @__PURE__ */ V("<div><!> <span class=\"spacer\"></span> <!> <!></div>"), Yb = /* @__PURE__ */ V("<div><div class=\"row\"><input class=\"input mono svelte-jdz90d\" placeholder=\"e.g. lower(trim(email))\" spellcheck=\"false\"/> <button type=\"button\" title=\"Functions you can use here\"><!> </button> <!></div> <!> <!></div>");
function Xb(e, t) {
	k(t, !0);
	let n = Q(t, "value", 15), r = Q(t, "compact", 3, !1), i = v_(), a = /* @__PURE__ */ j(() => n_.can.edit && n_.can.data), o = /* @__PURE__ */ M(null), s = /* @__PURE__ */ M(!1), c = /* @__PURE__ */ M(""), l = /* @__PURE__ */ M(!1), u = {
		text: "Text",
		value: "Values & numbers",
		time: "Dates & times",
		hash: "Hashing & ids",
		go: "Go-compatible helpers",
		app: "This application"
	}, d = /* @__PURE__ */ j(() => Hg.functions.filter((e) => {
		let t = z(c).trim().toLowerCase();
		return !t || e.name.toLowerCase().includes(t) || (e.help ?? "").toLowerCase().includes(t);
	})), f = /* @__PURE__ */ j(() => [...new Set(z(d).map((e) => e.group ?? "other"))].map((e) => ({
		group: e,
		label: u[e] ?? e,
		items: z(d).filter((t) => (t.group ?? "other") === e)
	})));
	function p() {
		Hg.loadFunctions(), N(c, ""), N(s, !z(s));
	}
	function m(e) {
		let t = n() ?? "", r = z(o)?.selectionStart ?? t.length, i = z(o)?.selectionEnd ?? r, a = `${e}(`;
		n(t.slice(0, r) + a + t.slice(i) + ""), N(s, !1), queueMicrotask(() => {
			z(o)?.focus();
			let e = r + a.length;
			z(o)?.setSelectionRange(e, e);
		});
	}
	let h = /* @__PURE__ */ M(null), g = /* @__PURE__ */ M(0), _ = /* @__PURE__ */ M(0);
	async function v() {
		N(l, !0), N(h, null);
		try {
			let e = await i.sampleFor(t.nodeId), r = e?.columns ?? [], a = e?.rows ?? [];
			N(_, a.length, !0);
			let o = a[Math.min(z(g), Math.max(0, a.length - 1))] ?? [], s = await Bg.exprTest(n() ?? "", r, o);
			N(h, {
				...s,
				note: a.length ? `row ${Math.min(z(g), a.length - 1) + 1} of ${a.length}${e?.table ? ` · ${e.table}` : ""}` : "no sample row (empty input)"
			}, !0);
		} catch (e) {
			N(h, { error: e.message }, !0);
		} finally {
			N(l, !1);
		}
	}
	var y = Yb();
	let b;
	var x = P(y), S = P(x);
	da(S), Ea(S, (e) => N(o, e), () => z(o));
	var C = L(S, 2), w = P(C);
	hy(w, { size: 13 });
	var T = L(w, 1, !0);
	D(C);
	var ee = L(C, 2), te = (e) => {
		var t = Lb(), i = P(t), a = (e) => {
			Lv(e, {
				size: 13,
				class: "spin"
			});
		}, o = (e) => {
			gv(e, { size: 13 });
		};
		G(i, (e) => {
			z(l) ? e(a) : e(o, -1);
		});
		var s = L(i, 1, !0);
		D(t), R(() => {
			J(t, 1, `btn ${r() ? "sm icon" : ""}`), t.disabled = z(l) || !n(), W(s, r() ? "" : " Test");
		}), B("click", t, v), U(e, t);
	};
	G(ee, (e) => {
		z(a) && e(te);
	}), D(x);
	var ne = L(x, 2), re = (e) => {
		var t = Hb(), n = F(t), r = L(n, 2), i = P(r), a = P(i);
		ay(a, { size: 12 });
		var o = L(a);
		da(o), D(i);
		var l = L(i, 2);
		K(l, 21, () => z(f), (e) => e.group, (e, t) => {
			var n = Bb(), r = F(n), i = I(r, !0);
			K(L(r, 2), 17, () => z(t).items, (e) => e.name, (e, t) => {
				var n = zb(), r = P(n), i = P(r, !0), a = I(L(i));
				D(r);
				var o = L(r, 2), s = (e) => {
					var n = Rb(), r = I(n, !0);
					R(() => W(r, z(t).help)), U(e, n);
				};
				G(o, (e) => {
					z(t).help && e(s);
				}), D(n), R(() => {
					Y(n, "title", z(t).help), W(i, z(t).name), W(a, `(${z(t).args ?? "" ?? ""})`);
				}), B("click", n, () => m(z(t).name)), U(e, n);
			}), R(() => W(i, z(t).label)), U(e, n);
		}, (e) => {
			var t = Vb(), n = I(t);
			R(() => W(n, `No function matches “${z(c) ?? ""}”.`)), U(e, t);
		}), D(l), O(2), D(r), B("click", n, () => N(s, !1)), ya(o, () => z(c), (e) => N(c, e)), U(e, t);
	};
	G(ne, (e) => {
		z(s) && e(re);
	});
	var ie = L(ne, 2), ae = (e) => {
		var t = Jb();
		let n;
		var r = P(t), i = (e) => {
			var t = Ub(), n = I(t, !0);
			R(() => W(n, z(h).error)), U(e, t);
		}, a = (e) => {
			let t = /* @__PURE__ */ j(() => u_(z(h).value));
			var n = Wb(), r = F(n), i = I(r, !0), a = I(L(r, 2), !0);
			R(() => {
				J(r, 1, `mono val ${z(t).kind ?? ""}`, "svelte-jdz90d"), W(i, z(t).text), W(a, z(h).type);
			}), U(e, n);
		};
		G(r, (e) => {
			z(h).error ? e(i) : e(a, -1);
		});
		var o = L(r, 4), s = (e) => {
			var t = Kb();
			K(t, 21, () => Array(z(_)), Ti, (e, t, n) => {
				var r = Gb();
				r.textContent = `row ${n + 1}`, r.value = r.__value = n, U(e, r);
			}), D(t), Qi(t), B("change", t, v), $i(t, () => z(g), (e) => N(g, e)), U(e, t);
		};
		G(o, (e) => {
			z(_) > 1 && e(s);
		});
		var c = L(o, 2), l = (e) => {
			var t = qb(), n = I(t, !0);
			R(() => W(n, z(h).note)), U(e, t);
		};
		G(c, (e) => {
			z(h).note && e(l);
		}), D(t), R(() => n = J(t, 1, "res svelte-jdz90d", null, n, { err: !!z(h).error })), U(e, t);
	};
	G(ie, (e) => {
		z(h) && e(ae);
	}), D(y), R(() => {
		b = J(y, 1, "expr svelte-jdz90d", null, b, { compact: r() }), J(C, 1, `btn ${r() ? "sm icon" : ""}`), W(T, r() ? "" : " Functions");
	}), B("keydown", S, (e) => e.key === "Enter" && z(a) && (e.preventDefault(), v())), ya(S, n), B("click", C, p), U(e, y), A();
}
Hr([
	"keydown",
	"click",
	"change"
]);
//#endregion
//#region src/lib/canvas/fields/TableEditor.svelte
var Zb = /* @__PURE__ */ V("<span class=\"arr svelte-x4edql\">→</span>"), Qb = /* @__PURE__ */ V("<!> <span> </span>", 1), $b = /* @__PURE__ */ V("<div class=\"mr svelte-x4edql\"></div>"), ex = /* @__PURE__ */ V("<div class=\"more tiny muted svelte-x4edql\"> </div>"), tx = /* @__PURE__ */ V("<button type=\"button\" class=\"mini svelte-x4edql\" title=\"Open the table editor\"><!> <!></button>"), nx = /* @__PURE__ */ V("<p class=\"tiny muted\">No rows yet.</p>"), rx = /* @__PURE__ */ V("<span class=\"count tiny muted svelte-x4edql\"> </span>"), ix = /* @__PURE__ */ V("<span class=\"spacer\"></span> <button type=\"button\" class=\"btn\">Cancel</button> <button type=\"button\" class=\"btn primary\"><!> Apply</button>", 1), ax = /* @__PURE__ */ V("<div class=\"gt tiny muted svelte-x4edql\"> </div>"), ox = /* @__PURE__ */ V("<button type=\"button\"><!> <span class=\"mono svelte-x4edql\"> </span> <span class=\"t mono svelte-x4edql\"> </span></button>"), sx = /* @__PURE__ */ V("<!> <!>", 1), cx = /* @__PURE__ */ V("<p class=\"tiny muted\">No incoming columns (connect an input or run a preview).</p>"), lx = /* @__PURE__ */ V("<aside class=\"svelte-x4edql\"><div class=\"ah svelte-x4edql\"><b>Incoming columns</b> <button type=\"button\" class=\"btn ghost sm\" title=\"Add a row for every incoming column not used yet\"><!> All</button></div> <div class=\"search svelte-x4edql\"><!><input class=\"input sm svelte-x4edql\" placeholder=\"filter\"/></div> <div class=\"incoming svelte-x4edql\"></div></aside>"), ux = /* @__PURE__ */ V("<button type=\"button\" class=\"btn sm\"><!> Values from sample</button>"), dx = /* @__PURE__ */ V("<span> </span>"), fx = /* @__PURE__ */ V("<option> </option>"), px = /* @__PURE__ */ V("<select class=\"select svelte-x4edql\"></select>"), mx = /* @__PURE__ */ V("<select class=\"select mono svelte-x4edql\"><option>auto</option><!></select>"), hx = /* @__PURE__ */ V("<input class=\"input mono svelte-x4edql\"/>"), gx = /* @__PURE__ */ V("<div class=\"td svelte-x4edql\"><!></div>"), _x = /* @__PURE__ */ V("<div class=\"tr svelte-x4edql\"><span class=\"n svelte-x4edql\"><span class=\"tiny muted\"> </span> <span class=\"mvs svelte-x4edql\"><button type=\"button\" class=\"mv svelte-x4edql\" aria-label=\"Move up\"><!></button> <button type=\"button\" class=\"mv svelte-x4edql\" aria-label=\"Move down\"><!></button></span></span> <!> <button type=\"button\" class=\"btn ghost sm icon\" aria-label=\"Remove row\"><!></button></div>"), vx = /* @__PURE__ */ V("<p class=\"empty tiny muted svelte-x4edql\"> </p>"), yx = /* @__PURE__ */ V("<p class=\"help svelte-x4edql\"> </p>"), bx = /* @__PURE__ */ V("<div><!> <section class=\"main svelte-x4edql\"><div class=\"bar svelte-x4edql\"><div class=\"search grow svelte-x4edql\"><!><input class=\"input sm svelte-x4edql\" placeholder=\"Search rows\"/></div> <!> <button type=\"button\" class=\"btn sm primary\"><!> Add row</button></div> <div class=\"tbl svelte-x4edql\"><div class=\"th svelte-x4edql\"><span class=\"n svelte-x4edql\">#</span> <!> <span></span></div> <!></div> <!></section></div>"), xx = /* @__PURE__ */ V("<div class=\"summary svelte-x4edql\"><!> <button type=\"button\" class=\"btn sm\"><!> </button></div> <!>", 1);
function Sx(e, t) {
	k(t, !0);
	let n = Q(t, "value", 15), r = v_(), i = /* @__PURE__ */ j(() => t.spec.kind === "keyvalue"), a = /* @__PURE__ */ j(() => t.spec.columns?.length ? t.spec.columns : z(i) ? [{
		key: "key",
		label: "Key",
		kind: "column"
	}, {
		key: "value",
		label: "Value",
		kind: "string"
	}] : []);
	function o(e) {
		return Array.isArray(e) ? e.map((e) => ({ ...e })) : z(i) && e && typeof e == "object" ? Object.entries(e).map(([e, t]) => ({
			key: e,
			value: t
		})) : [];
	}
	let s = /* @__PURE__ */ j(() => o(n())), c = /* @__PURE__ */ M(!1), l = /* @__PURE__ */ M(pn([])), u = /* @__PURE__ */ M(""), d = /* @__PURE__ */ M(""), f = /* @__PURE__ */ M(!1);
	function p() {
		N(l, o(n()), !0), N(u, ""), N(c, !0), z(a).some((e) => e.kind === "type") && Hg.loadTypes();
	}
	function m() {
		n(z(i) ? z(l).map((e) => ({
			key: e.key ?? "",
			value: e.value ?? ""
		})) : z(l)), N(c, !1);
	}
	let h = /* @__PURE__ */ j(() => z(a).find((e) => e.kind === "column") ?? z(a).find((e) => e.kind === "string")), g = /* @__PURE__ */ j(() => z(a).find((e) => e.kind === "expr")), _ = /* @__PURE__ */ j(() => z(a).some((e) => e.kind === "column") || !!z(g) && !!z(h)), v = /* @__PURE__ */ j(() => new Set(z(l).map((e) => z(h) ? String(e[z(h).key] ?? "") : "").filter(Boolean)));
	function y() {
		let e = {};
		for (let t of z(a)) e[t.key] = t.kind === "select" ? t.options?.[0]?.value ?? "" : "";
		return e;
	}
	function b(e) {
		let t = y();
		e && (z(h) && (t[z(h).key] = e), z(g) && (t[z(g).key] = /^[a-z_][a-z0-9_]*$/.test(e) ? e : `row["${e}"]`)), N(l, [...z(l), t], !0);
	}
	function x() {
		let e = z(v);
		for (let n of t.groups) for (let t of n.columns) e.has(t.name) || b(t.name);
	}
	function S(e, t, n) {
		z(l)[e] = {
			...z(l)[e],
			[t]: n
		};
	}
	function C(e, t) {
		let n = e + t;
		if (n < 0 || n >= z(l).length) return;
		let r = [...z(l)];
		[r[e], r[n]] = [r[n], r[e]], N(l, r, !0);
	}
	function w(e) {
		N(l, z(l).filter((t, n) => n !== e), !0);
	}
	function T(e) {
		if (!z(u).trim()) return !0;
		let t = z(u).toLowerCase();
		return z(a).some((n) => String(e[n.key] ?? "").toLowerCase().includes(t));
	}
	let ee = /* @__PURE__ */ j(() => z(i) && t.spec.key === "mapping" && typeof t.config?.column == "string" ? t.config.column : "");
	async function te() {
		N(f, !0);
		try {
			let e = await r.sampleFor(t.nodeId), n = (e?.columns ?? []).findIndex((e) => e.name === z(ee));
			if (n < 0) return;
			let i = new Set(z(l).map((e) => String(e.key ?? ""))), a = [];
			for (let t of e?.rows ?? []) {
				let e = t[n];
				if (e == null) continue;
				let r = String(e);
				!i.has(r) && !a.includes(r) && a.push(r);
			}
			N(l, [...z(l), ...a.map((e) => ({
				key: e,
				value: ""
			}))], !0);
		} finally {
			N(f, !1);
		}
	}
	let ne = /* @__PURE__ */ j(() => t.groups.map((e) => ({
		table: e.table,
		columns: e.columns.filter((e) => !z(d).trim() || e.name.toLowerCase().includes(z(d).toLowerCase()))
	})).filter((e) => e.columns.length)), re = /* @__PURE__ */ j(() => z(l).map((e, t) => ({
		r: e,
		i: t
	})).filter(({ r: e }) => T(e))), ie = /* @__PURE__ */ j(() => z(s).slice(0, 6)), ae = /* @__PURE__ */ j(() => z(a).map((e) => e.kind === "expr" ? "minmax(260px, 3fr)" : e.kind === "type" || e.kind === "select" ? "minmax(110px, 0.8fr)" : "minmax(150px, 1.2fr)").join(" "));
	var oe = xx(), se = F(oe), ce = P(se), le = (e) => {
		var t = tx(), n = P(t);
		K(n, 17, () => z(ie), Ti, (e, t) => {
			var n = $b();
			K(n, 21, () => z(a).slice(0, 2), Ti, (e, n, r) => {
				var i = Qb(), a = F(i), o = (e) => {
					U(e, Zb());
				};
				G(a, (e) => {
					r > 0 && e(o);
				});
				var s = L(a, 2);
				let c;
				var l = I(s, !0);
				R(() => {
					c = J(s, 1, "mono cell svelte-x4edql", null, c, { dim: !z(t)[z(n).key] }), W(l, z(t)[z(n).key] || "—");
				}), U(e, i);
			}), D(n), U(e, n);
		});
		var r = L(n, 2), i = (e) => {
			var t = ex(), n = I(t);
			R(() => W(n, `+ ${z(s).length - z(ie).length} more`)), U(e, t);
		};
		G(r, (e) => {
			z(s).length > z(ie).length && e(i);
		}), D(t), B("click", t, p), U(e, t);
	}, ue = (e) => {
		U(e, nx());
	};
	G(ce, (e) => {
		z(s).length ? e(le) : e(ue, -1);
	});
	var de = L(ce, 2), fe = P(de);
	zv(fe, { size: 12 });
	var pe = L(fe);
	D(de), D(se);
	var me = L(se, 2), he = (e) => {
		Ib(e, {
			get title() {
				return `${t.nodeName ?? ""} · ${t.spec.label ?? ""}`;
			},
			onclose: () => N(c, !1),
			width: "min(1280px, 96vw)",
			height: "min(820px, 90vh)",
			headerExtra: (e) => {
				var t = rx(), n = I(t);
				R(() => W(n, `${z(l).length ?? ""} row${z(l).length === 1 ? "" : "s"}`)), U(e, t);
			},
			footer: (e) => {
				var t = ix(), n = L(F(t), 2), r = L(n, 2);
				J_(P(r), { size: 13 }), O(), D(r), B("click", n, () => N(c, !1)), B("click", r, m), U(e, t);
			},
			children: (e, n) => {
				var r = bx();
				let i;
				var o = P(r), s = (e) => {
					var n = lx(), r = P(n), i = L(P(r), 2);
					Iv(P(i), { size: 12 }), O(), D(i), D(r);
					var a = L(r, 2), o = P(a);
					ay(o, { size: 12 });
					var s = L(o);
					da(s), D(a);
					var c = L(a, 2);
					K(c, 21, () => z(ne), (e) => e.table, (e, n) => {
						var r = sx(), i = F(r), a = (e) => {
							var t = ax(), r = I(t, !0);
							R(() => W(r, z(n).table)), U(e, t);
						};
						G(i, (e) => {
							t.groups.length > 1 && e(a);
						}), K(L(i, 2), 17, () => z(n).columns, (e) => z(n).table + e.name, (e, t) => {
							var n = ox();
							let r;
							var i = P(n), a = (e) => {
								J_(e, { size: 11 });
							}, o = /* @__PURE__ */ j(() => z(v).has(z(t).name)), s = (e) => {
								qv(e, { size: 11 });
							};
							G(i, (e) => {
								z(o) ? e(a) : e(s, -1);
							});
							var c = L(i, 2), l = I(c, !0), u = I(L(c, 2), !0);
							D(n), R((e, i) => {
								r = J(n, 1, "ic svelte-x4edql", null, r, { on: e }), Y(n, "title", i), W(l, z(t).name), W(u, z(t).nativeType || z(t).type);
							}, [() => z(v).has(z(t).name), () => z(v).has(z(t).name) ? "Already used — click to add again" : "Add a row for this column"]), B("click", n, () => b(z(t).name)), U(e, n);
						}), U(e, r);
					}, (e) => {
						U(e, cx());
					}), D(c), D(n), B("click", i, x), ya(s, () => z(d), (e) => N(d, e)), U(e, n);
				};
				G(o, (e) => {
					z(_) && e(s);
				});
				var c = L(o, 2), p = P(c), m = P(p), h = P(m);
				ay(h, { size: 12 });
				var g = L(h);
				da(g), D(m);
				var y = L(m, 2), T = (e) => {
					var t = ux(), n = P(t), r = (e) => {
						Lv(e, {
							size: 12,
							class: "spin"
						});
					}, i = (e) => {
						fy(e, { size: 12 });
					};
					G(n, (e) => {
						z(f) ? e(r) : e(i, -1);
					}), O(), D(t), R(() => {
						t.disabled = z(f), Y(t, "title", `Add a row for each value of ${z(ee) ?? ""} seen in the preview sample`);
					}), B("click", t, te), U(e, t);
				};
				G(y, (e) => {
					z(ee) && e(T);
				});
				var ie = L(y, 2);
				qv(P(ie), { size: 12 }), O(), D(ie), D(p);
				var oe = L(p, 2);
				let se;
				var ce = P(oe);
				K(L(P(ce), 2), 17, () => z(a), (e) => e.key, (e, t) => {
					var n = dx(), r = I(n, !0);
					R(() => W(r, z(t).label)), U(e, n);
				}), O(2), D(ce), K(L(ce, 2), 17, () => z(re), ({ r: e, i: t }) => t, (e, n) => {
					let r = () => z(n).r, i = () => z(n).i;
					var o = _x(), s = P(o), c = P(s), d = I(c, !0), f = L(c, 2), p = P(f);
					Z_(P(p), { size: 11 }), D(p);
					var m = L(p, 2);
					Y_(P(m), { size: 11 }), D(m), D(f), D(s);
					var h = L(s, 2);
					K(h, 17, () => z(a), (e) => e.key, (e, n) => {
						var a = gx(), o = P(a), s = (e) => {
							{
								let a = /* @__PURE__ */ j(() => r()[z(n).key] ?? "");
								fb(e, {
									get value() {
										return z(a);
									},
									get groups() {
										return t.groups;
									},
									onpick: (e) => S(i(), z(n).key, e)
								});
							}
						}, c = (e) => {
							var a = () => r()[z(n).key] ?? "", o = (e) => S(i(), z(n).key, e);
							Xb(e, {
								compact: !0,
								get nodeId() {
									return t.nodeId;
								},
								get value() {
									return a();
								},
								set value(e) {
									o(e);
								}
							});
						}, l = (e) => {
							var t = px();
							K(t, 21, () => z(n).options ?? [], Ti, (e, t) => {
								var n = fx(), r = I(n, !0), i = {};
								R(() => {
									W(r, z(t).label), i !== (i = z(t).value) && (n.value = (n.__value = i) ?? "");
								}), U(e, n);
							}), D(t);
							var a;
							Qi(t), R(() => {
								a !== (a = r()[z(n).key] ?? "") && (t.value = (t.__value = a) ?? "", Zi(t, a));
							}), B("change", t, (e) => S(i(), z(n).key, e.currentTarget.value)), U(e, t);
						}, u = (e) => {
							var t = mx(), a = P(t);
							a.value = a.__value = "", K(L(a), 17, () => Hg.types, Ti, (e, t) => {
								var n = fx(), r = I(n, !0), i = {};
								R(() => {
									W(r, z(t).label), i !== (i = z(t).value) && (n.value = (n.__value = i) ?? "");
								}), U(e, n);
							}), D(t);
							var o;
							Qi(t), R(() => {
								o !== (o = r()[z(n).key] ?? "") && (t.value = (t.__value = o) ?? "", Zi(t, o));
							}), B("change", t, (e) => S(i(), z(n).key, e.currentTarget.value)), U(e, t);
						}, d = (e) => {
							var t = hx();
							da(t), R(() => fa(t, r()[z(n).key] ?? "")), B("input", t, (e) => S(i(), z(n).key, e.currentTarget.value)), U(e, t);
						};
						G(o, (e) => {
							z(n).kind === "column" ? e(s) : z(n).kind === "expr" ? e(c, 1) : z(n).kind === "select" ? e(l, 2) : z(n).kind === "type" ? e(u, 3) : e(d, -1);
						}), D(a), U(e, a);
					});
					var g = L(h, 2);
					Cy(P(g), { size: 13 }), D(g), D(o), R(() => {
						W(d, i() + 1), p.disabled = i() === 0 || !!z(u), m.disabled = i() === z(l).length - 1 || !!z(u);
					}), B("click", p, () => C(i(), -1)), B("click", m, () => C(i(), 1)), B("click", g, () => w(i())), U(e, o);
				}, (e) => {
					var t = vx(), n = I(t, !0);
					R(() => W(n, z(l).length ? "No row matches the search." : z(_) ? "Add rows, or click incoming columns on the left." : "Add a row to start.")), U(e, t);
				}), D(oe);
				var le = L(oe, 2), ue = (e) => {
					var n = yx(), r = I(n, !0);
					R(() => W(r, t.spec.help)), U(e, n);
				};
				G(le, (e) => {
					t.spec.help && e(ue);
				}), D(c), D(r), R(() => {
					i = J(r, 1, "ed svelte-x4edql", null, i, { noside: !z(_) }), se = qi(oe, "", se, { "--grid": z(ae) });
				}), ya(g, () => z(u), (e) => N(u, e)), B("click", ie, () => b()), U(e, r);
			},
			$$slots: {
				headerExtra: !0,
				footer: !0,
				default: !0
			}
		});
	};
	G(me, (e) => {
		z(c) && e(he);
	}), R(() => W(pe, ` ${z(s).length ? `Edit ${z(s).length} row${z(s).length === 1 ? "" : "s"}` : "Open table editor"}`)), B("click", de, p), U(e, oe), A();
}
Hr([
	"click",
	"change",
	"input"
]);
//#endregion
//#region src/lib/components/CodeEditor.svelte
var Cx = /* @__PURE__ */ V("<div class=\"loading skeleton svelte-c4vs74\"></div>"), wx = /* @__PURE__ */ V("<textarea class=\"textarea mono fallback svelte-c4vs74\"></textarea>"), Tx = /* @__PURE__ */ V("<div class=\"ed svelte-c4vs74\"><!> <!></div>");
function Ex(e, t) {
	k(t, !0);
	let n = Q(t, "value", 15), r = Q(t, "language", 3, "python"), i = Q(t, "errorLine", 3, null), a = Q(t, "readonly", 3, !1), o = /* @__PURE__ */ M(void 0), s = /* @__PURE__ */ M(null), c = /* @__PURE__ */ M(!1);
	yi(() => {
		let e = !1;
		return import("./codemirror-DkAaCMqP.js").then((i) => {
			!e && z(o) && (N(s, i.createEditor(z(o), {
				doc: n() ?? "",
				language: r(),
				dark: $g.resolved === "dark",
				onChange: (e) => n(e),
				onRun: () => t.onrun?.(),
				readOnly: a()
			}), !0), a() || z(s).focus());
		}).catch(() => N(c, !0)), () => {
			e = !0, z(s)?.destroy();
		};
	}), Fn(() => {
		z(s)?.setDoc(n() ?? "");
	}), Fn(() => {
		z(s)?.setErrorLine(i() ?? null);
	}), Fn(() => {
		z(s)?.setDark($g.resolved === "dark");
	});
	var l = Tx(), u = P(l), d = (e) => {
		U(e, Cx());
	};
	G(u, (e) => {
		!z(s) && !z(c) && e(d);
	});
	var f = L(u, 2), p = (e) => {
		var t = wx();
		_t(t), ya(t, n), U(e, t);
	};
	G(f, (e) => {
		z(c) && e(p);
	}), D(l), Ea(l, (e) => N(o, e), () => z(o)), U(e, l), A();
}
//#endregion
//#region src/lib/components/DataGrid.svelte
var Dx = /* @__PURE__ */ V("<th><div class=\"cname svelte-zxd2v4\"> </div> <div class=\"ctype svelte-zxd2v4\"> </div></th>"), Ox = /* @__PURE__ */ V("<td> </td>"), kx = /* @__PURE__ */ V("<tr class=\"errmsg svelte-zxd2v4\"><td class=\"svelte-zxd2v4\"></td><td class=\"svelte-zxd2v4\"> </td></tr>"), Ax = /* @__PURE__ */ V("<tr><td class=\"idx svelte-zxd2v4\"><!></td><!></tr> <!>", 1), jx = /* @__PURE__ */ V("<tr class=\"svelte-zxd2v4\"><td class=\"none svelte-zxd2v4\"> </td></tr>"), Mx = /* @__PURE__ */ V("<div class=\"inspect svelte-zxd2v4\"><div class=\"row\"><strong class=\"mono\"> </strong> <span class=\"spacer\"></span> <button class=\"btn ghost sm icon\" aria-label=\"Close\"><!></button></div> <pre class=\"svelte-zxd2v4\"> </pre></div>"), Nx = /* @__PURE__ */ V("<div class=\"grid-wrap svelte-zxd2v4\"><div class=\"grid scroll svelte-zxd2v4\"><table class=\"svelte-zxd2v4\"><thead><tr><th class=\"idx svelte-zxd2v4\">#</th><!></tr></thead><tbody class=\"svelte-zxd2v4\"></tbody></table></div> <!></div>");
function Px(e, t) {
	k(t, !0);
	let n = Q(t, "errors", 19, () => []), r = Q(t, "emptyText", 3, "No rows"), i = /* @__PURE__ */ j(() => {
		let e = /* @__PURE__ */ new Map();
		for (let t of n() ?? []) {
			let n = e.get(t.row) ?? [];
			n.push(t.message), e.set(t.row, n);
		}
		return e;
	}), a = /* @__PURE__ */ M(null);
	function o(e) {
		let t = e.type || e.nativeType;
		return e.length ? t += `(${e.length})` : e.precision && (t += `(${e.precision}${e.scale ? "," + e.scale : ""})`), t;
	}
	var s = Nx(), c = P(s), l = P(c), u = P(l), d = P(u);
	K(L(P(d)), 17, () => t.columns, Ti, (e, n) => {
		var r = Dx();
		let i;
		var a = P(r), s = I(a, !0), c = I(L(a, 2));
		D(r), R((e, t, a) => {
			Y(r, "title", `${z(n).name}\n${z(n).nativeType || z(n).type}${z(n).nullable ? " NULL" : " NOT NULL"}`), i = J(r, 1, "svelte-zxd2v4", null, i, {
				changed: e,
				added: t
			}), W(s, z(n).name), W(c, `${a ?? ""}${z(n).nullable ? "" : " ·NN"}`);
		}, [
			() => t.changed?.has(z(n).name),
			() => t.added?.has(z(n).name),
			() => o(z(n))
		]), U(e, r);
	}), D(d), D(u);
	var f = L(u);
	K(f, 21, () => t.rows, Ti, (e, n, r) => {
		let o = /* @__PURE__ */ j(() => z(i).get(r));
		var s = Ax(), c = F(s);
		let l;
		var u = P(c), d = P(u), f = (e) => {
			wy(e, { size: 12 });
		}, p = (e) => {
			var t = Qr();
			t.nodeValue = r + 1, U(e, t);
		};
		G(d, (e) => {
			z(o) ? e(f) : e(p, -1);
		}), D(u), K(L(u), 17, () => t.columns, Ti, (e, r, i) => {
			let o = /* @__PURE__ */ j(() => u_(z(n)?.[i]));
			var s = Ox();
			let c;
			var l = I(s, !0);
			R((e, t, n) => {
				c = J(s, 1, z(o).kind, "svelte-zxd2v4", c, { changed: e }), Y(s, "title", t), W(l, n);
			}, [
				() => t.changed?.has(z(r).name),
				() => z(o).kind === "null" ? "NULL" : z(o).text.length > 40 || z(o).kind === "json" ? d_(z(n)?.[i]) : void 0,
				() => z(o).text.length > 120 ? z(o).text.slice(0, 120) + "…" : z(o).text
			]), B("click", s, () => N(a, {
				col: z(r).name,
				value: z(n)?.[i]
			}, !0)), U(e, s);
		}), D(c);
		var m = L(c, 2), h = (e) => {
			var n = kx(), r = L(P(n)), i = I(r, !0);
			D(n), R((e) => {
				Y(r, "colspan", t.columns.length), W(i, e);
			}, [() => z(o).join(" · ")]), U(e, n);
		};
		G(m, (e) => {
			z(o) && e(h);
		}), R((e) => {
			l = J(c, 1, "svelte-zxd2v4", null, l, { err: !!z(o) }), Y(u, "title", e);
		}, [() => z(o)?.join("\n")]), U(e, s);
	}, (e) => {
		var n = jx(), i = P(n), a = I(i, !0);
		D(n), R(() => {
			Y(i, "colspan", t.columns.length + 1), W(a, r());
		}), U(e, n);
	}), D(f), D(l), D(c);
	var p = L(c, 2), m = (e) => {
		var t = Mx(), n = P(t), r = P(n), i = I(r, !0), o = L(r, 4);
		Ny(P(o), { size: 13 }), D(o), D(n);
		var s = I(L(n, 2), !0);
		D(t), R((e) => {
			W(i, z(a).col), W(s, e);
		}, [() => d_(z(a).value)]), B("click", o, () => N(a, null)), U(e, t);
	};
	G(p, (e) => {
		z(a) && e(m);
	}), D(s), U(e, s), A();
}
Hr(["click"]);
//#endregion
//#region src/lib/canvas/ScriptModal.svelte
var Fx = /* @__PURE__ */ V("<span class=\"badge accent\">Starlark (Python dialect)</span> <select class=\"select modesel svelte-1u95230\" title=\"Script mode\"><option> </option><option>mode: row — transform(row)</option><option>mode: batch — transform_batch(rows)</option></select>", 1), Ix = /* @__PURE__ */ V("<button class=\"btn primary\">Apply script</button>"), Lx = /* @__PURE__ */ V("<span class=\"muted small\"> </span> <span class=\"spacer\"></span> <button class=\"btn\"> </button> <!>", 1), Rx = /* @__PURE__ */ V("<button class=\"btn primary\"><!> Test on preview rows</button> <span class=\"kbd\">⌘/Ctrl ↵</span>", 1), zx = /* @__PURE__ */ V("<span class=\"muted small\">Testing scripts needs the edit and data permissions.</span>"), Bx = /* @__PURE__ */ V("<span class=\"muted small\"> </span>"), Vx = /* @__PURE__ */ V("<div class=\"msg err svelte-1u95230\"><!> </div>"), Hx = /* @__PURE__ */ V("<strong> </strong>"), Ux = /* @__PURE__ */ V("<div class=\"msg err svelte-1u95230\"><!> <div><!> <span class=\"mono\"> </span></div></div>"), Wx = /* @__PURE__ */ V("<div class=\"msg ok svelte-1u95230\"><!> </div>"), Gx = /* @__PURE__ */ V("<span class=\"muted\">print() output appears here</span>"), Kx = /* @__PURE__ */ V("<!> <div class=\"tabs\"><button>Output</button> <button>Input</button></div> <div class=\"grid svelte-1u95230\"><!></div> <div class=\"logs svelte-1u95230\"><div class=\"lh svelte-1u95230\">Logs <span class=\"muted\"> </span></div> <pre class=\"svelte-1u95230\"></pre></div>", 1), qx = /* @__PURE__ */ V("<div class=\"empty svelte-1u95230\"><!> <p class=\"svelte-1u95230\">Run the script against up to 20 rows arriving at this node — nothing is written.</p> <p class=\"small svelte-1u95230\"><code>def transform(row)</code> → dict, list of dicts (fan-out), or <code>None</code> (drop).<br/> <code>def transform_batch(rows)</code> → list of dicts.</p></div>"), Jx = /* @__PURE__ */ V("<div class=\"split svelte-1u95230\"><div class=\"edcol svelte-1u95230\"><!></div> <div class=\"out svelte-1u95230\"><div class=\"obar svelte-1u95230\"><!> <span class=\"spacer\"></span> <!></div> <!> <!></div></div>");
function Yx(e, t) {
	k(t, !0);
	let n = "# Python (Starlark dialect). Available imports: json, re, math, time, datetime, hashlib, uuid.\n# Not available: other modules, classes, try/except, with.\n\ndef transform(row):\n    # row is a dict of column -> value. Return a dict, a list of dicts (fan out),\n    # or None to drop the row. Set row[\"_table\"] = \"name\" to send it to another table.\n    return row\n", r = v_(), i = /* @__PURE__ */ j(() => r.readOnly()), a = /* @__PURE__ */ j(() => n_.can.edit && n_.can.data), o = /* @__PURE__ */ M(pn(t.value?.trim() ? t.value : n)), s = /* @__PURE__ */ M("auto"), c = /* @__PURE__ */ j(() => z(s) === "auto" ? /^\s*def\s+transform_batch\s*\(/m.test(z(o)) ? "batch" : "row" : z(s)), l = /* @__PURE__ */ M(!1), u = /* @__PURE__ */ M(null), d = /* @__PURE__ */ M(null), f = /* @__PURE__ */ M(""), p = /* @__PURE__ */ M("output"), m = /* @__PURE__ */ j(() => z(o) !== (t.value?.trim() ? t.value : n));
	async function h() {
		if (z(a)) {
			N(l, !0), N(f, "");
			try {
				if (N(u, await r.sampleFor(t.nodeId), !0), !z(u)) {
					N(f, "No input rows: connect an upstream node that produces rows (preview returned nothing)."), N(d, null);
					return;
				}
				N(d, await Bg.scriptTest({
					script: z(o),
					mode: z(c),
					columns: z(u).columns,
					rows: z(u).rows
				}), !0), N(p, "output");
			} catch (e) {
				N(f, e.message, !0);
			} finally {
				N(l, !1);
			}
		}
	}
	function g() {
		t.onsave(z(o));
	}
	function _(e) {
		(e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s" && (e.preventDefault(), e.stopPropagation(), z(i) || g());
	}
	Vr("keydown", gn, _, !0), Ib(e, {
		get title() {
			return `Script · ${t.title ?? ""}`;
		},
		width: "min(1280px, 96vw)",
		height: "min(860px, 94vh)",
		get onclose() {
			return t.onclose;
		},
		headerExtra: (e) => {
			var t = Fx(), n = L(F(t), 2), r = P(n), i = I(r);
			r.value = r.__value = "auto";
			var a = L(r);
			a.value = a.__value = "row";
			var o = L(a);
			o.value = o.__value = "batch", D(n), Qi(n), R(() => W(i, `mode: auto (${z(c) ?? ""})`)), $i(n, () => z(s), (e) => N(s, e)), U(e, t);
		},
		footer: (e) => {
			var n = Lx(), r = F(n), a = I(r, !0), o = L(r, 4), s = I(o, !0), c = L(o, 2), l = (e) => {
				var t = Ix();
				B("click", t, g), U(e, t);
			};
			G(c, (e) => {
				z(i) || e(l);
			}), R(() => {
				W(a, z(i) ? "Read-only" : z(m) ? "Unsaved script changes" : ""), W(s, z(i) ? "Close" : "Cancel");
			}), B("click", o, function(...e) {
				t.onclose?.apply(this, e);
			}), U(e, n);
		},
		children: (e, t) => {
			var n = Jx(), r = P(n), s = P(r);
			{
				let e = /* @__PURE__ */ j(() => z(d)?.error ? z(d).line ?? null : null);
				Ex(s, {
					language: "python",
					get readonly() {
						return z(i);
					},
					get errorLine() {
						return z(e);
					},
					onrun: h,
					get value() {
						return z(o);
					},
					set value(e) {
						N(o, e, !0);
					}
				});
			}
			D(r);
			var c = L(r, 2), m = P(c), g = P(m), _ = (e) => {
				var t = Rx(), n = F(t), r = P(n), i = (e) => {
					Lv(e, {
						size: 14,
						class: "spin"
					});
				}, a = (e) => {
					gv(e, { size: 14 });
				};
				G(r, (e) => {
					z(l) ? e(i) : e(a, -1);
				}), O(), D(n), O(2), R(() => n.disabled = z(l)), B("click", n, h), U(e, t);
			}, v = (e) => {
				U(e, zx());
			};
			G(g, (e) => {
				z(a) ? e(_) : e(v, -1);
			});
			var y = L(g, 4), b = (e) => {
				var t = Bx(), n = I(t);
				R(() => W(n, `${z(u).rows.length ?? ""} input rows${z(u).table ? ` · ${z(u).table}` : ""}`)), U(e, t);
			};
			G(y, (e) => {
				z(u) && e(b);
			}), D(m);
			var x = L(m, 2), S = (e) => {
				var t = Vx(), n = P(t);
				tv(n, { size: 14 });
				var r = L(n);
				D(t), R(() => W(r, ` ${z(f) ?? ""}`)), U(e, t);
			};
			G(x, (e) => {
				z(f) && e(S);
			});
			var C = L(x, 2), w = (e) => {
				var t = Kx(), n = F(t), r = (e) => {
					var t = Ux(), n = P(t);
					tv(n, { size: 14 });
					var r = L(n, 2), i = P(r), a = (e) => {
						var t = Hx(), n = I(t);
						R(() => W(n, `Line ${z(d).line ?? ""}:`)), U(e, t);
					};
					G(i, (e) => {
						z(d).line && e(a);
					});
					var o = I(L(i, 2), !0);
					D(r), D(t), R(() => W(o, z(d).error)), U(e, t);
				}, i = (e) => {
					var t = Wx(), n = P(t);
					J_(n, { size: 14 });
					var r = L(n);
					D(t), R(() => W(r, ` ${z(d).rows.length ?? ""} rows out · ${z(d).dropped ?? ""} dropped · ${z(u)?.rows.length ?? 0 ?? ""} in`)), U(e, t);
				};
				G(n, (e) => {
					z(d).error ? e(r) : e(i, -1);
				});
				var a = L(n, 2), o = P(a);
				let s;
				var c = L(o, 2);
				let l;
				D(a);
				var f = L(a, 2), m = P(f), h = (e) => {
					{
						let t = /* @__PURE__ */ j(() => z(d).columns ?? []), n = /* @__PURE__ */ j(() => z(d).rows ?? []), r = /* @__PURE__ */ j(() => z(d).error ? "Script failed" : "All rows dropped");
						Px(e, {
							get columns() {
								return z(t);
							},
							get rows() {
								return z(n);
							},
							get emptyText() {
								return z(r);
							}
						});
					}
				}, g = (e) => {
					Px(e, {
						get columns() {
							return z(u).columns;
						},
						get rows() {
							return z(u).rows;
						}
					});
				};
				G(m, (e) => {
					z(p) === "output" ? e(h) : z(u) && e(g, 1);
				}), D(f);
				var _ = L(f, 2), v = P(_), y = I(L(P(v)));
				D(v);
				var b = L(v, 2);
				K(b, 21, () => z(d).logs ?? [], Ti, (e, t) => {
					O();
					var n = Qr();
					R(() => W(n, `${z(t) ?? ""}
`)), U(e, n);
				}, (e) => {
					U(e, Gx());
				}), D(b), D(_), R(() => {
					s = J(o, 1, "tab", null, s, { active: z(p) === "output" }), l = J(c, 1, "tab", null, l, { active: z(p) === "input" }), W(y, `(${z(d).logs?.length ?? 0 ?? ""})`);
				}), B("click", o, () => N(p, "output")), B("click", c, () => N(p, "input")), U(e, t);
			}, T = (e) => {
				var t = qx();
				gv(P(t), { size: 28 }), O(4), D(t), U(e, t);
			};
			G(C, (e) => {
				z(d) ? e(w) : z(f) || e(T, 1);
			}), D(c), D(n), U(e, n);
		},
		$$slots: {
			headerExtra: !0,
			footer: !0,
			default: !0
		}
	}), A();
}
Hr(["click"]);
//#endregion
//#region src/lib/canvas/fields/ScriptField.svelte
var Xx = /* @__PURE__ */ V("<div class=\"more tiny muted\"> </div>"), Zx = /* @__PURE__ */ V("<pre class=\"svelte-rd00op\"> </pre> <!>", 1), Qx = /* @__PURE__ */ V("<div class=\"muted small\"> </div>"), $x = /* @__PURE__ */ V("<button type=\"button\" class=\"btn sm\" style=\"align-self:flex-start\"><!> Edit script</button>"), eS = /* @__PURE__ */ V("<div class=\"sf svelte-rd00op\" role=\"button\" tabindex=\"0\" title=\"Open script editor\"><!></div> <!> <!>", 1);
function tS(e, t) {
	k(t, !0);
	let n = Q(t, "value", 15), r = /* @__PURE__ */ M(!1), i = v_(), a = /* @__PURE__ */ j(() => i.readOnly()), o = /* @__PURE__ */ j(() => (n() ?? "").split("\n").slice(0, 8).join("\n")), s = /* @__PURE__ */ j(() => (n() ?? "").split("\n").length);
	var c = eS(), l = F(c), u = P(l), d = (e) => {
		var t = Zx(), n = F(t), r = I(n, !0), i = L(n, 2), a = (e) => {
			var t = Xx(), n = I(t);
			R(() => W(n, `… ${z(s) - 8} more lines`)), U(e, t);
		};
		G(i, (e) => {
			z(s) > 8 && e(a);
		}), R(() => W(r, z(o))), U(e, t);
	}, f = /* @__PURE__ */ j(() => n()?.trim()), p = (e) => {
		var t = Qx(), n = I(t);
		R(() => W(n, `No script yet${z(a) ? "." : " — click to write one."}`)), U(e, t);
	};
	G(u, (e) => {
		z(f) ? e(d) : e(p, -1);
	}), D(l);
	var m = L(l, 2), h = (e) => {
		var t = $x();
		iv(P(t), { size: 13 }), O(), D(t), B("click", t, () => N(r, !0)), U(e, t);
	};
	G(m, (e) => {
		z(a) || e(h);
	});
	var g = L(m, 2), _ = (e) => {
		{
			let i = /* @__PURE__ */ j(() => n() ?? "");
			Yx(e, {
				get value() {
					return z(i);
				},
				get nodeId() {
					return t.nodeId;
				},
				get title() {
					return t.title;
				},
				onclose: () => N(r, !1),
				onsave: (e) => {
					n(e), N(r, !1);
				}
			});
		}
	};
	G(g, (e) => {
		z(r) && e(_);
	}), B("click", l, () => N(r, !0)), B("keydown", l, (e) => (e.key === "Enter" || e.key === " ") && N(r, !0)), U(e, c), A();
}
Hr(["click", "keydown"]);
//#endregion
//#region src/lib/canvas/fields/PickerField.svelte
var nS = /* @__PURE__ */ V("<span class=\"desc ellipsis svelte-1ksih0k\"> </span>"), rS = /* @__PURE__ */ V("<span class=\"lbl svelte-1ksih0k\"> </span> <!>", 1), iS = /* @__PURE__ */ V("<span class=\"lbl muted svelte-1ksih0k\">Choose…</span>"), aS = /* @__PURE__ */ V("<button type=\"button\" class=\"clear svelte-1ksih0k\"><!> Clear</button>"), oS = /* @__PURE__ */ V("<span class=\"tiny muted count svelte-1ksih0k\"> </span>"), sS = /* @__PURE__ */ V("<span class=\"od svelte-1ksih0k\"> </span>"), cS = /* @__PURE__ */ V("<button type=\"button\"><span class=\"tick svelte-1ksih0k\"><!></span> <span class=\"body svelte-1ksih0k\"><span class=\"ol svelte-1ksih0k\"> </span> <!></span></button>"), lS = /* @__PURE__ */ V("<p class=\"muted small none svelte-1ksih0k\"> </p>"), uS = /* @__PURE__ */ V("<div class=\"search svelte-1ksih0k\"><!> <input class=\"input svelte-1ksih0k\" placeholder=\"Search…\"/></div> <div class=\"list scroll svelte-1ksih0k\"></div>", 1), dS = /* @__PURE__ */ V("<button type=\"button\"><span class=\"chosen svelte-1ksih0k\"><!></span> <!></button> <!> <!>", 1);
function fS(e, t) {
	k(t, !0);
	let n = Q(t, "value", 15), r = Q(t, "required", 3, !1), i = Q(t, "label", 3, "Choose"), a = /* @__PURE__ */ M(!1), o = /* @__PURE__ */ M(""), s = /* @__PURE__ */ j(() => t.options.find((e) => e.value === n())), c = /* @__PURE__ */ j(() => z(o).trim() ? t.options.filter((e) => {
		let t = z(o).toLowerCase();
		return e.value.toLowerCase().includes(t) || e.label.toLowerCase().includes(t) || (e.description ?? "").toLowerCase().includes(t);
	}) : t.options);
	function l(e) {
		n(e.value), N(a, !1), N(o, "");
	}
	var u = dS(), d = F(u);
	let f;
	var p = P(d), m = P(p), h = (e) => {
		var t = rS(), n = F(t), r = I(n, !0), i = L(n, 2), a = (e) => {
			var t = nS(), n = I(t, !0);
			R(() => W(n, z(s).description)), U(e, t);
		};
		G(i, (e) => {
			z(s).description && e(a);
		}), R(() => W(r, z(s).label)), U(e, t);
	}, g = (e) => {
		U(e, iS());
	};
	G(m, (e) => {
		z(s) ? e(h) : e(g, -1);
	}), D(p), Y_(L(p, 2), { size: 14 }), D(d);
	var _ = L(d, 2), v = (e) => {
		var t = aS();
		Ny(P(t), { size: 11 }), O(), D(t), B("click", t, () => n(void 0)), U(e, t);
	};
	G(_, (e) => {
		n() && !r() && e(v);
	});
	var y = L(_, 2), b = (e) => {
		Ib(e, {
			get title() {
				return i();
			},
			width: "min(680px, 96vw)",
			height: "min(560px, 82vh)",
			onclose: () => N(a, !1),
			headerExtra: (e) => {
				var n = oS(), r = I(n);
				R(() => W(r, `${z(c).length ?? ""} of ${t.options.length ?? ""}`)), U(e, n);
			},
			children: (e, t) => {
				var r = uS(), i = F(r), a = P(i);
				ay(a, { size: 14 });
				var s = L(a, 2);
				da(s), gt(s, !0), D(i);
				var u = L(i, 2);
				K(u, 21, () => z(c), (e) => e.value, (e, t) => {
					var r = cS();
					let i;
					var a = P(r), o = P(a), s = (e) => {
						J_(e, { size: 13 });
					};
					G(o, (e) => {
						z(t).value === n() && e(s);
					}), D(a);
					var c = L(a, 2), u = P(c), d = I(u, !0), f = L(u, 2), p = (e) => {
						var n = sS(), r = I(n, !0);
						R(() => W(r, z(t).description)), U(e, n);
					};
					G(f, (e) => {
						z(t).description && e(p);
					}), D(c), D(r), R(() => {
						i = J(r, 1, "opt svelte-1ksih0k", null, i, { on: z(t).value === n() }), W(d, z(t).label);
					}), B("click", r, () => l(z(t))), U(e, r);
				}, (e) => {
					var t = lS(), n = I(t);
					R(() => W(n, `Nothing matches “${z(o) ?? ""}”.`)), U(e, t);
				}), D(u), ya(s, () => z(o), (e) => N(o, e)), U(e, r);
			},
			$$slots: {
				headerExtra: !0,
				default: !0
			}
		});
	};
	G(y, (e) => {
		z(a) && e(b);
	}), R(() => f = J(d, 1, "picker svelte-1ksih0k", null, f, { unchosen: !z(s) })), B("click", d, () => (N(a, !0), N(o, ""))), U(e, u), A();
}
Hr(["click"]);
//#endregion
//#region src/lib/canvas/PropertyField.svelte
var pS = /* @__PURE__ */ V("<span class=\"req\">*</span>"), mS = /* @__PURE__ */ V("<label class=\"boolrow svelte-vbh8v7\"><span class=\"switch\"><input type=\"checkbox\"/><span></span></span> <span class=\"bl\"> <!></span></label>"), hS = /* @__PURE__ */ V("<input class=\"input\"/>"), gS = /* @__PURE__ */ V("<textarea class=\"textarea\" rows=\"3\"></textarea>"), _S = /* @__PURE__ */ V("<input class=\"input num\" type=\"number\" step=\"1\"/>"), vS = /* @__PURE__ */ V("<option>—</option>"), yS = /* @__PURE__ */ V("<option> </option>"), bS = /* @__PURE__ */ V("<select class=\"select\"><!><!></select>"), xS = /* @__PURE__ */ V("<div class=\"row\"><select class=\"select\"><option> </option><!><!></select> <button type=\"button\" class=\"btn icon\" title=\"Reload connections\"><!></button></div>"), SS = /* @__PURE__ */ V("<input class=\"input mono\"/> <span class=\"help\"> </span>", 1), CS = /* @__PURE__ */ V("<label> <!></label> <!>", 1), wS = /* @__PURE__ */ V("<span class=\"help\"> </span>"), TS = /* @__PURE__ */ V("<span class=\"help reqmsg svelte-vbh8v7\">Required</span>"), ES = /* @__PURE__ */ V("<div><!> <!> <!></div>");
function DS(e, t) {
	k(t, !0);
	let n = Q(t, "value", 15), r = /* @__PURE__ */ j(() => `pf-${t.nodeId}-${t.spec.key}`), i = /* @__PURE__ */ j(() => t.spec.required && (n() === void 0 || n() === null || n() === "" || Array.isArray(n()) && n().length === 0 && t.spec.kind !== "tables"));
	Fn(() => {
		t.spec.kind === "connection" && Hg.loadConnections().catch(() => {});
	});
	var a = ES();
	let o;
	var s = P(a), c = (e) => {
		var i = mS(), a = P(i), o = P(a);
		da(o), O(), D(a);
		var s = L(a, 2), c = P(s, !0), l = L(c), u = (e) => {
			U(e, pS());
		};
		G(l, (e) => {
			t.spec.required && e(u);
		}), D(s), D(i), R(() => {
			Y(i, "for", z(r)), Y(o, "id", z(r)), pa(o, !!n()), W(c, t.spec.label);
		}), B("change", o, (e) => n(e.currentTarget.checked)), U(e, i);
	}, l = (e) => {
		var i = CS(), a = F(i), o = P(a, !0), s = L(o), c = (e) => {
			U(e, pS());
		};
		G(s, (e) => {
			t.spec.required && e(c);
		}), D(a);
		var l = L(a, 2), u = (e) => {
			var i = hS();
			da(i), R((e) => {
				Y(i, "id", z(r)), fa(i, n() ?? ""), Y(i, "placeholder", e);
			}, [() => t.spec.default == null ? "" : String(t.spec.default)]), B("input", i, (e) => n(e.currentTarget.value)), U(e, i);
		}, d = (e) => {
			var t = gS();
			_t(t), R(() => {
				Y(t, "id", z(r)), fa(t, n() ?? "");
			}), B("input", t, (e) => n(e.currentTarget.value)), U(e, t);
		}, f = (e) => {
			var i = _S();
			da(i), R((e) => {
				Y(i, "id", z(r)), fa(i, n() ?? ""), Y(i, "placeholder", e);
			}, [() => t.spec.default == null ? "" : String(t.spec.default)]), B("input", i, (e) => {
				let t = e.currentTarget.value;
				n(t === "" ? void 0 : Math.trunc(Number(t)));
			}), U(e, i);
		}, p = (e) => {
			var i = bS(), a = P(i), o = (e) => {
				var t = vS();
				t.value = t.__value = "", U(e, t);
			};
			G(a, (e) => {
				(!t.spec.required || n() == null || n() === "") && e(o);
			}), K(L(a), 17, () => t.spec.options ?? [], Ti, (e, t) => {
				var n = yS(), r = I(n, !0), i = {};
				R(() => {
					W(r, z(t).label), i !== (i = z(t).value) && (n.value = (n.__value = i) ?? "");
				}), U(e, n);
			}), D(i);
			var s;
			Qi(i), R(() => {
				Y(i, "id", z(r)), s !== (s = n() ?? "") && (i.value = (i.__value = s) ?? "", Zi(i, s));
			}), B("change", i, (e) => n(e.currentTarget.value)), U(e, i);
		}, m = (e) => {
			{
				let r = /* @__PURE__ */ j(() => t.spec.options ?? []);
				fS(e, {
					get options() {
						return z(r);
					},
					get required() {
						return t.spec.required;
					},
					get label() {
						return t.spec.label;
					},
					get value() {
						return n();
					},
					set value(e) {
						n(e);
					}
				});
			}
		}, h = (e) => {
			var t = xS(), i = P(t), a = P(i), o = I(a, !0);
			a.value = a.__value = "";
			var s = L(a);
			K(s, 17, () => Hg.connections, Ti, (e, t) => {
				var n = yS(), r = I(n), i = {};
				R(() => {
					W(r, `${(z(t).name || z(t).id) ?? ""} · ${z(t).driver ?? ""}/${z(t).database ?? ""}`), i !== (i = z(t).id) && (n.value = (n.__value = i) ?? "");
				}), U(e, n);
			});
			var c = L(s), l = (e) => {
				var t = yS(), r = I(t), i = {};
				R(() => {
					W(r, `${n() ?? ""} (missing)`), i !== (i = n()) && (t.value = (t.__value = i) ?? "");
				}), U(e, t);
			}, u = /* @__PURE__ */ j(() => n() && Hg.connectionsLoaded && !Hg.connections.some((e) => e.id === n()));
			G(c, (e) => {
				z(u) && e(l);
			}), D(i);
			var d;
			Qi(i);
			var f = L(i, 2);
			Xv(P(f), { size: 13 }), D(f), D(t), R(() => {
				Y(i, "id", z(r)), W(o, Hg.connectionsLoaded ? "Select connection…" : "Loading…"), d !== (d = n() ?? "") && (i.value = (i.__value = d) ?? "", Zi(i, d));
			}), B("change", i, (e) => n(e.currentTarget.value)), B("click", f, () => Hg.loadConnections(!0)), U(e, t);
		}, g = (e) => {
			{
				let r = /* @__PURE__ */ j(() => t.spec.connectionKey ? t.config?.[t.spec.connectionKey] : void 0);
				Nb(e, {
					get connectionId() {
						return z(r);
					},
					get value() {
						return n();
					},
					set value(e) {
						n(e);
					}
				});
			}
		}, _ = (e) => {
			{
				let r = /* @__PURE__ */ j(() => t.spec.connectionKey ? t.config?.[t.spec.connectionKey] : void 0);
				Nb(e, {
					multi: !0,
					get connectionId() {
						return z(r);
					},
					get value() {
						return n();
					},
					set value(e) {
						n(e);
					}
				});
			}
		}, v = (e) => {
			vb(e, {
				get groups() {
					return t.groups;
				},
				get value() {
					return n();
				},
				set value(e) {
					n(e);
				}
			});
		}, y = (e) => {
			var r = () => n() ?? "", i = (e) => n(e);
			fb(e, {
				get value() {
					return r();
				},
				set value(e) {
					i(e);
				},
				get groups() {
					return t.groups;
				}
			});
		}, b = (e) => {
			Sx(e, {
				get spec() {
					return t.spec;
				},
				get groups() {
					return t.groups;
				},
				get nodeId() {
					return t.nodeId;
				},
				get nodeName() {
					return t.nodeName;
				},
				get config() {
					return t.config;
				},
				get value() {
					return n();
				},
				set value(e) {
					n(e);
				}
			});
		}, x = (e) => {
			var r = () => n() ?? "", i = (e) => n(e);
			Xb(e, {
				get value() {
					return r();
				},
				set value(e) {
					i(e);
				},
				get nodeId() {
					return t.nodeId;
				}
			});
		}, S = (e) => {
			var r = () => n() ?? "", i = (e) => n(e);
			tS(e, {
				get value() {
					return r();
				},
				set value(e) {
					i(e);
				},
				get nodeId() {
					return t.nodeId;
				},
				get title() {
					return t.nodeName;
				}
			});
		}, C = (e) => {
			var i = SS(), a = F(i);
			da(a);
			var o = I(L(a, 2));
			R((e) => {
				Y(a, "id", z(r)), fa(a, e), W(o, `Unsupported property kind “${t.spec.kind ?? ""}”.`);
			}, [() => typeof n() == "string" ? n() : JSON.stringify(n() ?? "")]), B("input", a, (e) => n(e.currentTarget.value)), U(e, i);
		};
		G(l, (e) => {
			t.spec.kind === "string" ? e(u) : t.spec.kind === "text" ? e(d, 1) : t.spec.kind === "int" ? e(f, 2) : t.spec.kind === "select" ? e(p, 3) : t.spec.kind === "picker" ? e(m, 4) : t.spec.kind === "connection" ? e(h, 5) : t.spec.kind === "table" ? e(g, 6) : t.spec.kind === "tables" ? e(_, 7) : t.spec.kind === "columns" ? e(v, 8) : t.spec.kind === "column" ? e(y, 9) : t.spec.kind === "keyvalue" || t.spec.kind === "list" ? e(b, 10) : t.spec.kind === "expr" ? e(x, 11) : t.spec.kind === "script" ? e(S, 12) : e(C, -1);
		}), R(() => {
			Y(a, "for", z(r)), W(o, t.spec.label);
		}), U(e, i);
	};
	G(s, (e) => {
		t.spec.kind === "bool" ? e(c) : e(l, -1);
	});
	var u = L(s, 2), d = (e) => {
		var n = wS(), r = I(n, !0);
		R(() => W(r, t.spec.help)), U(e, n);
	};
	G(u, (e) => {
		t.spec.help && e(d);
	});
	var f = L(u, 2), p = (e) => {
		U(e, TS());
	};
	G(f, (e) => {
		z(i) && e(p);
	}), D(a), R(() => o = J(a, 1, "field svelte-vbh8v7", null, o, { missing: z(i) })), U(e, a), A();
}
Hr([
	"change",
	"input",
	"click"
]);
//#endregion
//#region src/lib/canvas/LookupStep.svelte
var OS = /* @__PURE__ */ new Map(), kS = /* @__PURE__ */ V("<span class=\"tiny muted\"> </span>"), AS = /* @__PURE__ */ V("<button type=\"button\" class=\"btn ghost sm icon\" title=\"Apply earlier\"><!></button> <button type=\"button\" class=\"btn ghost sm icon\" title=\"Apply later\"><!></button>", 1), jS = /* @__PURE__ */ V("<button type=\"button\" class=\"btn ghost sm icon\" title=\"Remove this lookup table\"><!></button>"), MS = /* @__PURE__ */ V("<option> </option>"), NS = /* @__PURE__ */ V("<input class=\"input\" disabled=\"\" placeholder=\"choose a connection first\"/>"), PS = /* @__PURE__ */ V("<select class=\"input mono\"><option disabled=\"\">column…</option><!></select>"), FS = /* @__PURE__ */ V("<input class=\"input mono\" placeholder=\"e.g. user_id\"/>"), IS = /* @__PURE__ */ V("<p class=\"hint svelte-14balis\"> </p>"), LS = /* @__PURE__ */ V("<div class=\"field\"><label>Apply to incoming table</label> <select class=\"input\"><option> </option><!></select> <!></div>"), RS = /* @__PURE__ */ V("<p class=\"hint warn svelte-14balis\"> </p>"), zS = /* @__PURE__ */ V("<span class=\"spacer svelte-14balis\"></span> <button type=\"button\" class=\"btn ghost sm\">All</button> <button type=\"button\" class=\"btn ghost sm\">None</button>", 1), BS = /* @__PURE__ */ V("<p class=\"hint svelte-14balis\"><!> </p>"), VS = /* @__PURE__ */ V("<p class=\"hint err svelte-14balis\"> </p>"), HS = /* @__PURE__ */ V("<div class=\"search svelte-14balis\"><!><input class=\"input sm svelte-14balis\" placeholder=\"filter columns\"/></div>"), US = /* @__PURE__ */ V("<!> <input placeholder=\"save as\" class=\"input sm mono as svelte-14balis\" title=\"Name of the new column in the output\"/>", 1), WS = /* @__PURE__ */ V("<label><input type=\"checkbox\" class=\"svelte-14balis\"/> <span class=\"cn mono svelte-14balis\"><!> </span> <span class=\"ct mono svelte-14balis\"> </span> <!></label>"), GS = /* @__PURE__ */ V("<!> <div class=\"cols svelte-14balis\"></div> <p class=\"hint svelte-14balis\"> </p>", 1), KS = /* @__PURE__ */ V("<section class=\"advbody svelte-14balis\"><div class=\"field\"><label> </label> <input class=\"input mono\" placeholder=\"e.g. deleted = 0\"/> <p class=\"hint svelte-14balis\"> </p></div> <div class=\"field\"><label> </label> <select class=\"input\"><option>Use the first (lowest primary key)</option><option>Use the last (highest primary key)</option></select></div> <div class=\"field\"><label> </label> <select class=\"input\"><option>Treat it as no match</option><option>Keep the row unchanged</option></select></div></section>"), qS = /* @__PURE__ */ V("<div><div class=\"head svelte-14balis\"><span class=\"idx svelte-14balis\"> </span> <b class=\"mono\"> </b> <!> <span class=\"spacer svelte-14balis\"></span> <!> <!></div> <div class=\"summary svelte-14balis\"><!> <span> </span></div> <section class=\"svelte-14balis\"><h4 class=\"svelte-14balis\"><span class=\"n svelte-14balis\">1</span> Look up in</h4> <div class=\"stack svelte-14balis\"><div class=\"field\"><label>Connection</label> <select class=\"input\"><option disabled=\"\">Select…</option><!></select></div> <div class=\"field\"><span class=\"field-label\">Table</span> <!></div></div></section> <section class=\"svelte-14balis\"><h4 class=\"svelte-14balis\"><span class=\"n svelte-14balis\">2</span> Match rows where</h4> <div class=\"join svelte-14balis\"><div class=\"side svelte-14balis\"><span class=\"lbl svelte-14balis\"> </span> <!></div> <span class=\"eq svelte-14balis\">=</span> <div class=\"side svelte-14balis\"><span class=\"lbl svelte-14balis\"> </span> <!></div></div> <!> <!></section> <section class=\"svelte-14balis\"><h4 class=\"svelte-14balis\"><span class=\"n svelte-14balis\">3</span> Copy these columns <!></h4> <!></section> <section class=\"svelte-14balis\"><h4 class=\"svelte-14balis\"><span class=\"n svelte-14balis\">4</span> If the row already has a value</h4> <div class=\"seg svelte-14balis\"><label><input type=\"radio\" class=\"svelte-14balis\"/> <b>Overwrite it</b><span class=\"svelte-14balis\">the lookup value always wins</span></label> <label><input type=\"radio\" class=\"svelte-14balis\"/> <b>Keep it</b><span class=\"svelte-14balis\">only fill empty values — use on a 2nd lookup as a fallback</span></label></div></section> <section class=\"svelte-14balis\"><h4 class=\"svelte-14balis\"><span class=\"n svelte-14balis\">5</span> </h4> <div class=\"seg three svelte-14balis\"><label><input type=\"radio\" class=\"svelte-14balis\"/> <b>Keep the row</b><span class=\"svelte-14balis\">columns stay empty</span></label> <label><input type=\"radio\" class=\"svelte-14balis\"/> <b>Drop the row</b><span class=\"svelte-14balis\">like an inner join</span></label> <label><input type=\"radio\" class=\"svelte-14balis\"/> <b>Send to failure</b><span class=\"svelte-14balis\">review as dead letters</span></label></div></section> <button type=\"button\" class=\"adv svelte-14balis\"><!> Advanced</button> <!></div>");
function JS(e, t) {
	k(t, !0);
	let n = Q(t, "readOnly", 3, !1), r = Q(t, "canData", 3, !0), i = Q(t, "index", 3, 0), a = Q(t, "total", 3, 1), o = Math.random().toString(36).slice(2, 8);
	Fn(() => {
		Hg.loadConnections().catch(() => {});
	});
	let s = /* @__PURE__ */ j(() => t.config.connection ?? ""), c = /* @__PURE__ */ j(() => t.config.table ?? ""), l = /* @__PURE__ */ j(() => Hg.connections.find((e) => e.id === z(s))), u = /* @__PURE__ */ M(null), d = /* @__PURE__ */ M(""), f = /* @__PURE__ */ M(!1);
	Fn(() => {
		let e = z(s), t = z(c);
		if (N(u, null), N(d, ""), !e || !t || !r()) return;
		let n = `${e}|${t}`;
		OS.has(n) || OS.set(n, Bg.tableMeta(e, t)), N(f, !0), OS.get(n).then((n) => {
			e === z(s) && t === z(c) && N(u, n, !0);
		}).catch((r) => {
			OS.delete(n), e === z(s) && t === z(c) && N(d, r.message, !0);
		}).finally(() => N(f, !1));
	});
	let p = /* @__PURE__ */ j(() => z(u)?.columns ?? []), m = /* @__PURE__ */ j(() => new Set([...z(u)?.primaryKey ?? [], ...(z(u)?.indexes ?? []).map((e) => e.columns[0])].filter(Boolean))), h = /* @__PURE__ */ j(() => t.groups.map((e) => e.table)), g = /* @__PURE__ */ j(() => t.config.match ?? ""), _ = /* @__PURE__ */ j(() => {
		let e = z(g).lastIndexOf(".");
		if (e <= 0) return "";
		let t = z(g).slice(0, e);
		return z(h).some((e) => e.toLowerCase() === t.toLowerCase()) || z(h).length === 0 ? t : "";
	}), v = /* @__PURE__ */ j(() => z(_) ? z(g).slice(z(_).length + 1) : z(g)), y = /* @__PURE__ */ j(() => z(_) ? t.groups.filter((e) => e.table.toLowerCase() === z(_).toLowerCase()) : t.groups);
	function b(e, n) {
		t.onset("match", e && n ? `${e}.${n}` : n);
	}
	let x = /* @__PURE__ */ j(() => z(_) || (z(h).length === 1 ? z(h)[0] : "")), S = /* @__PURE__ */ j(() => z(_) ? z(h).filter((e) => e.toLowerCase() !== z(_).toLowerCase()) : t.groups.filter((e) => z(v) && !e.columns.some((e) => e.name === z(v))).map((e) => e.table)), C = /* @__PURE__ */ j(() => t.groups.flatMap((e) => e.columns.map((e) => e.name)));
	Fn(() => {
		if (n() || !z(u) || t.config.key) return;
		let e = z(u).columns.find((e) => /_id$/.test(e.name) && z(C).includes("id"));
		if (e && (t.onset("key", e.name), !t.config.match)) {
			let e = t.groups.find((e) => e.columns.some((e) => e.name === "id"));
			t.onset("match", t.groups.length > 1 && e ? `${e.table}.id` : "id");
		}
	});
	let w = /* @__PURE__ */ j(() => (Array.isArray(t.config.fields) ? t.config.fields : []).filter((e) => e && typeof e.key == "string" && e.key.trim() !== "")), T = /* @__PURE__ */ j(() => new Map(z(w).map((e) => [e.key, e.value]))), ee = /* @__PURE__ */ M(""), te = /* @__PURE__ */ j(() => z(p).filter((e) => e.name !== t.config.key && (!z(ee) || e.name.toLowerCase().includes(z(ee).toLowerCase()))));
	function ne(e) {
		let n = z(p).filter((t) => e.has(t.name)).map((t) => ({
			key: t.name,
			value: e.get(t.name) || t.name
		})), r = [...e].filter(([e]) => e.trim() !== "" && !z(p).some((t) => t.name === e)).map(([e, t]) => ({
			key: e,
			value: t
		}));
		t.onset("fields", [...n, ...r]);
	}
	function re(e, t) {
		let n = new Map(z(T));
		t ? n.set(e, n.get(e) || e) : n.delete(e), ne(n);
	}
	function ie(e, t) {
		let n = new Map(z(T));
		n.set(e, t), ne(n);
	}
	function ae(e) {
		let t = new Map(z(T));
		for (let n of z(te)) e ? t.set(n.name, t.get(n.name) || n.name) : t.delete(n.name);
		ne(t);
	}
	let oe = /* @__PURE__ */ j(() => t.config.existing || "overwrite"), se = /* @__PURE__ */ j(() => t.config.missing || "null"), ce = /* @__PURE__ */ M(!1);
	Fn(() => {
		(t.config.where || t.config.multiple === "last" || t.config.null_key === "keep") && N(ce, !0);
	});
	let le = /* @__PURE__ */ j(() => {
		if (!z(s) || !z(c)) return "Choose the table to look values up in.";
		if (!t.config.key || !z(v)) return `Choose how rows of ${z(c)} match incoming rows.`;
		if (!z(w).length) return `Choose which ${z(c)} columns to copy.`;
		let e = z(w).map((e) => e.value && e.value !== e.key ? `${e.key} as ${e.value}` : e.key).join(", "), n = z(oe) === "fill" ? " only where they are still empty" : "", r = z(se) === "drop" ? "Rows with no match are dropped." : z(se) === "fail" ? "Rows with no match go to failure." : "Rows with no match keep empty values.", i = z(x) ? `incoming ${z(x)} row` : "incoming row", a = z(x) ? `${z(x)}.${z(v)}` : z(v), o = z(S).length ? ` Other tables (${z(S).join(", ")}) pass through unchanged.` : "";
		return `For each ${i}, find the ${z(c)} row where ${z(c)}.${t.config.key} = ${a}, and copy ${e}${n}. ${r}${o}`;
	});
	var ue = qS();
	let de;
	var fe = P(ue), pe = P(fe), me = I(pe, !0), he = L(pe, 2), ge = I(he, !0), _e = L(he, 2), ve = (e) => {
		var t = kS(), n = I(t, !0);
		R(() => W(n, z(oe) === "fill" ? "fills what earlier lookups left empty" : "overwrites earlier lookups")), U(e, t);
	};
	G(_e, (e) => {
		i() > 0 && e(ve);
	});
	var ye = L(_e, 4), be = (e) => {
		var n = AS(), r = F(n);
		z_(P(r), { size: 12 }), D(r);
		var o = L(r, 2);
		P_(P(o), { size: 12 }), D(o), R(() => {
			r.disabled = i() === 0, o.disabled = i() === a() - 1;
		}), B("click", r, () => t.onmove?.(-1)), B("click", o, () => t.onmove?.(1)), U(e, n);
	};
	G(ye, (e) => {
		!n() && a() > 1 && e(be);
	});
	var xe = L(ye, 2), Se = (e) => {
		var n = jS();
		Ny(P(n), { size: 12 }), D(n), B("click", n, function(...e) {
			t.onremove?.apply(this, e);
		}), U(e, n);
	};
	G(xe, (e) => {
		!n() && t.onremove && e(Se);
	}), D(fe);
	var Ce = L(fe, 2), we = P(Ce);
	Ov(we, { size: 13 });
	var Te = I(L(we, 2), !0);
	D(Ce);
	var Ee = L(Ce, 2), E = L(P(Ee), 2), De = P(E), Oe = P(De), ke = L(Oe, 2), Ae = P(ke);
	Ae.value = Ae.__value = "", K(L(Ae), 17, () => Hg.connections, (e) => e.id, (e, t) => {
		var n = MS(), r = I(n), i = {};
		R(() => {
			W(r, `${(z(t).name || z(t).id) ?? ""} · ${z(t).driver ?? ""}`), i !== (i = z(t).id) && (n.value = (n.__value = i) ?? "");
		}), U(e, n);
	}), D(ke);
	var je;
	Qi(ke), D(De);
	var Me = L(De, 2), Ne = L(P(Me), 2), Pe = (e) => {
		var n = () => z(c), r = (e) => t.onset("table", e);
		Nb(e, {
			get connectionId() {
				return z(s);
			},
			get value() {
				return n();
			},
			set value(e) {
				r(e);
			}
		});
	}, Fe = (e) => {
		U(e, NS());
	};
	G(Ne, (e) => {
		z(s) ? e(Pe) : e(Fe, -1);
	}), D(Me), D(E), D(Ee);
	var Ie = L(Ee, 2), Le = L(P(Ie), 2), Re = P(Le), ze = P(Re), Be = I(ze), Ve = L(ze, 2), He = (e) => {
		var r = PS(), i = P(r);
		i.value = i.__value = "", K(L(i), 17, () => z(p), (e) => e.name, (e, t) => {
			var n = MS(), r = I(n, !0), i = {};
			R(() => {
				W(r, z(t).name), i !== (i = z(t).name) && (n.value = (n.__value = i) ?? "");
			}), U(e, n);
		}), D(r);
		var a;
		Qi(r), R(() => {
			r.disabled = n(), a !== (a = t.config.key ?? "") && (r.value = (r.__value = a) ?? "", Zi(r, a));
		}), B("change", r, (e) => t.onset("key", e.currentTarget.value)), U(e, r);
	}, Ue = (e) => {
		var r = FS();
		da(r), R(() => {
			fa(r, t.config.key ?? ""), r.disabled = n();
		}), B("input", r, (e) => t.onset("key", e.currentTarget.value)), U(e, r);
	};
	G(Ve, (e) => {
		z(p).length ? e(He) : e(Ue, -1);
	}), D(Re);
	var We = L(Re, 4), Ge = P(We), Ke = I(Ge), qe = L(Ge, 2), Je = () => z(v), Ye = (e) => b(z(_), e);
	fb(qe, {
		get groups() {
			return z(y);
		},
		placeholder: "e.g. id",
		get value() {
			return Je();
		},
		set value(e) {
			Ye(e);
		}
	}), D(We), D(Le);
	var Xe = L(Le, 2), Ze = (e) => {
		var t = LS(), r = P(t), i = L(r, 2), a = P(i), s = I(a);
		a.value = a.__value = "", K(L(a), 16, () => z(h), (e) => e, (e, t) => {
			var n = MS(), r = I(n), i = {};
			R(() => {
				W(r, `${t ?? ""} only`), i !== (i = t) && (n.value = (n.__value = i) ?? "");
			}), U(e, n);
		}), D(i);
		var c;
		Qi(i);
		var l = L(i, 2), u = (e) => {
			var t = IS(), n = I(t);
			R((e) => W(n, `Passed through unchanged: ${e ?? ""}`), [() => z(S).join(", ")]), U(e, t);
		};
		G(l, (e) => {
			z(S).length && e(u);
		}), D(t), R(() => {
			Y(r, "for", `lk-apply-${o ?? ""}`), Y(i, "id", `lk-apply-${o ?? ""}`), i.disabled = n(), W(s, `Every table that has “${(z(v) || "the column") ?? ""}”`), c !== (c = z(_)) && (i.value = (i.__value = c) ?? "", Zi(i, c));
		}), B("change", i, (e) => b(e.currentTarget.value, z(v))), U(e, t);
	};
	G(Xe, (e) => {
		z(h).length > 1 && e(Ze);
	});
	var Qe = L(Xe, 2), $e = (e) => {
		var n = RS(), r = I(n);
		R(() => W(r, `${z(c) ?? ""}.${t.config.key ?? ""} has no index — lookups will scan the table. Add one on the source for large tables.`)), U(e, n);
	}, et = /* @__PURE__ */ j(() => t.config.key && z(p).length && !z(m).has(t.config.key));
	G(Qe, (e) => {
		z(et) && e($e);
	}), D(Ie);
	var tt = L(Ie, 2), nt = P(tt), rt = L(P(nt), 2), it = (e) => {
		var t = zS(), n = L(F(t), 2), r = L(n, 2);
		B("click", n, () => ae(!0)), B("click", r, () => ae(!1)), U(e, t);
	};
	G(rt, (e) => {
		z(p).length && !n() && e(it);
	}), D(nt);
	var at = L(nt, 2), ot = (e) => {
		var t = BS(), n = P(t);
		Lv(n, {
			size: 12,
			class: "spin"
		});
		var r = L(n);
		D(t), R(() => W(r, ` loading ${z(c) ?? ""} columns…`)), U(e, t);
	}, st = (e) => {
		var t = VS(), n = I(t, !0);
		R(() => W(n, z(d))), U(e, t);
	}, ct = (e) => {
		var t = IS(), n = I(t, !0);
		R(() => W(n, r() ? "Pick a table to see its columns." : "You don't have permission to browse table columns.")), U(e, t);
	}, lt = (e) => {
		var r = GS(), i = F(r), a = (e) => {
			var t = HS(), n = P(t);
			ay(n, { size: 12 });
			var r = L(n);
			da(r), D(t), ya(r, () => z(ee), (e) => N(ee, e)), U(e, t);
		};
		G(i, (e) => {
			z(p).length > 8 && e(a);
		});
		var o = L(i, 2);
		K(o, 21, () => z(te), (e) => e.name, (e, t) => {
			let r = /* @__PURE__ */ j(() => z(T).has(z(t).name));
			var i = WS();
			let a;
			var o = P(i);
			da(o);
			var s = L(o, 2), c = P(s), l = (e) => {
				kv(e, { size: 10 });
			}, d = /* @__PURE__ */ j(() => z(u)?.primaryKey.includes(z(t).name));
			G(c, (e) => {
				z(d) && e(l);
			});
			var f = L(c, 1, !0);
			D(s);
			var p = L(s, 2), m = I(p, !0), h = L(p, 2), g = (e) => {
				var r = US(), i = F(r);
				L_(i, {
					size: 11,
					class: "arr"
				});
				var a = L(i, 2);
				da(a), R((e) => {
					fa(a, e), a.disabled = n();
				}, [() => z(T).get(z(t).name)]), B("click", a, (e) => e.preventDefault()), B("input", a, (e) => ie(z(t).name, e.currentTarget.value.trim() || z(t).name)), U(e, r);
			};
			G(h, (e) => {
				z(r) && e(g);
			}), D(i), R(() => {
				a = J(i, 1, "col svelte-14balis", null, a, { on: z(r) }), pa(o, z(r)), o.disabled = n(), W(f, z(t).name), W(m, z(t).nativeType || z(t).type);
			}), B("change", o, (e) => re(z(t).name, e.currentTarget.checked)), U(e, i);
		}), D(o);
		var s = I(L(o, 2));
		R(() => W(s, `${z(w).length ?? ""} of ${z(p).length - +!!t.config.key} columns copied. Edit the name under a column to rename it in the output; an existing column with that name is filled in place.`)), U(e, r);
	};
	G(at, (e) => {
		z(f) ? e(ot) : z(d) ? e(st, 1) : z(p).length ? e(lt, -1) : e(ct, 2);
	}), D(tt);
	var ut = L(tt, 2), dt = L(P(ut), 2), ft = P(dt);
	let pt;
	var mt = P(ft);
	da(mt), O(3), D(ft);
	var ht = L(ft, 2);
	let gt;
	var _t = P(ht);
	da(_t), O(3), D(ht), D(dt), D(ut);
	var vt = L(ut, 2), yt = P(vt), bt = L(P(yt));
	D(yt);
	var xt = L(yt, 2), St = P(xt);
	let Ct;
	var wt = P(St);
	da(wt), O(3), D(St);
	var Tt = L(St, 2);
	let Et;
	var Dt = P(Tt);
	da(Dt), O(3), D(Tt);
	var Ot = L(Tt, 2);
	let kt;
	var At = P(Ot);
	da(At), O(3), D(Ot), D(xt), D(vt);
	var jt = L(vt, 2), Mt = P(jt);
	{
		let e = /* @__PURE__ */ j(() => z(ce) ? "rot" : "");
		Q_(Mt, {
			size: 12,
			get class() {
				return z(e);
			}
		});
	}
	O(), D(jt);
	var Nt = L(jt, 2), Pt = (e) => {
		var r = KS(), i = P(r), a = P(i), s = I(a), u = L(a, 2);
		da(u);
		var d = I(L(u, 2));
		D(i);
		var f = L(i, 2), p = P(f), m = I(p), h = L(p, 2), g = P(h);
		g.value = g.__value = "first";
		var _ = L(g);
		_.value = _.__value = "last", D(h);
		var y;
		Qi(h), D(f);
		var b = L(f, 2), x = P(b), S = I(x), C = L(x, 2), w = P(C);
		w.value = w.__value = "missing";
		var T = L(w);
		T.value = T.__value = "keep", D(C);
		var ee;
		Qi(C), D(b), D(r), R(() => {
			Y(a, "for", `lk-where-${o ?? ""}`), W(s, `Only use ${(z(c) || "lookup") ?? ""} rows where`), Y(u, "id", `lk-where-${o ?? ""}`), fa(u, t.config.where ?? ""), u.disabled = n(), W(d, `SQL condition in the ${z(l)?.driver ?? "source" ?? ""} dialect.`), Y(p, "for", `lk-multi-${o ?? ""}`), W(m, `When several ${(z(c) || "lookup") ?? ""} rows match`), Y(h, "id", `lk-multi-${o ?? ""}`), h.disabled = n(), y !== (y = t.config.multiple || "first") && (h.value = (h.__value = y) ?? "", Zi(h, y)), Y(x, "for", `lk-null-${o ?? ""}`), W(S, `When the incoming ${(z(v) || "value") ?? ""} is empty (NULL)`), Y(C, "id", `lk-null-${o ?? ""}`), C.disabled = n(), ee !== (ee = t.config.null_key || "missing") && (C.value = (C.__value = ee) ?? "", Zi(C, ee));
		}), B("input", u, (e) => t.onset("where", e.currentTarget.value)), B("change", h, (e) => t.onset("multiple", e.currentTarget.value)), B("change", C, (e) => t.onset("null_key", e.currentTarget.value)), U(e, r);
	};
	G(Nt, (e) => {
		z(ce) && e(Pt);
	}), D(ue), R(() => {
		de = J(ue, 1, "lk card svelte-14balis", null, de, { ro: n() }), W(me, i() + 1), W(ge, z(c) || "New lookup"), W(Te, z(le)), Y(Oe, "for", `lk-conn-${o ?? ""}`), Y(ke, "id", `lk-conn-${o ?? ""}`), ke.disabled = n(), je !== (je = z(s)) && (ke.value = (ke.__value = je) ?? "", Zi(ke, je)), W(Be, `${(z(c) || "lookup table") ?? ""} column`), W(Ke, `incoming ${(z(x) || "") ?? ""} column`), pt = J(ft, 1, "svelte-14balis", null, pt, { on: z(oe) === "overwrite" }), Y(mt, "name", `lk-ex-${o ?? ""}`), pa(mt, z(oe) === "overwrite"), mt.disabled = n(), gt = J(ht, 1, "svelte-14balis", null, gt, { on: z(oe) === "fill" }), Y(_t, "name", `lk-ex-${o ?? ""}`), pa(_t, z(oe) === "fill"), _t.disabled = n(), W(bt, ` If no ${(z(c) || "lookup") ?? ""} row matches`), Ct = J(St, 1, "svelte-14balis", null, Ct, { on: z(se) === "null" }), Y(wt, "name", `lk-miss-${o ?? ""}`), pa(wt, z(se) === "null"), wt.disabled = n(), Et = J(Tt, 1, "svelte-14balis", null, Et, { on: z(se) === "drop" }), Y(Dt, "name", `lk-miss-${o ?? ""}`), pa(Dt, z(se) === "drop"), Dt.disabled = n(), kt = J(Ot, 1, "svelte-14balis", null, kt, { on: z(se) === "fail" }), Y(At, "name", `lk-miss-${o ?? ""}`), pa(At, z(se) === "fail"), At.disabled = n();
	}), B("change", ke, (e) => t.onset("connection", e.currentTarget.value)), B("change", mt, () => t.onset("existing", "overwrite")), B("change", _t, () => t.onset("existing", "fill")), B("change", wt, () => t.onset("missing", "null")), B("change", Dt, () => t.onset("missing", "drop")), B("change", At, () => t.onset("missing", "fail")), B("click", jt, () => N(ce, !z(ce))), U(e, ue), A();
}
Hr([
	"click",
	"change",
	"input"
]);
//#endregion
//#region src/lib/canvas/LookupEditor.svelte
var YS = /* @__PURE__ */ V("<div class=\"chain svelte-gue5yl\"><!> <span>Lookups run in order: <b class=\"mono\"> </b>. Each one sees the columns filled by the ones above it.</span></div>"), XS = /* @__PURE__ */ V("<button type=\"button\" class=\"btn addbtn svelte-gue5yl\"><!> Add another lookup table</button> <p class=\"hint svelte-gue5yl\">For example: names from <span class=\"mono\">applicant</span>, then — only where still empty — from <span class=\"mono\">employer_users</span>.</p>", 1), ZS = /* @__PURE__ */ V("<div class=\"advbody svelte-gue5yl\"><div class=\"field\"><label for=\"lke-only\">Only incoming tables</label> <input id=\"lke-only\" class=\"input\" placeholder=\"all tables\"/></div> <div class=\"field\"><label for=\"lke-cache\">Cache entries per lookup table</label> <input id=\"lke-cache\" class=\"input num\" type=\"number\" min=\"1000\"/></div></div>"), QS = /* @__PURE__ */ V("<div class=\"lke svelte-gue5yl\"><!> <!> <!> <button type=\"button\" class=\"adv svelte-gue5yl\"><!> Node options</button> <!></div>");
function $S(e, t) {
	k(t, !0);
	let n = Q(t, "readOnly", 3, !1), r = Q(t, "canData", 3, !0), i = [
		"connection",
		"table",
		"key",
		"match",
		"fields",
		"existing",
		"missing",
		"where"
	], a = /* @__PURE__ */ j(() => {
		if (Array.isArray(t.config.lookups) && t.config.lookups.length) return t.config.lookups;
		let e = {};
		for (let n of i) t.config[n] !== void 0 && (e[n] = t.config[n]);
		return [e];
	});
	function o(e) {
		t.onset("lookups", e);
		for (let e of i) t.config[e] !== void 0 && t.onset(e, void 0);
	}
	function s(e, t, n) {
		let r = z(a).map((r, i) => i === e ? {
			...r,
			[t]: n
		} : r);
		n === void 0 && delete r[e][t], o(r);
	}
	function c() {
		let e = z(a)[z(a).length - 1] ?? {};
		o([...z(a), {
			connection: e.connection,
			match: e.match,
			existing: "fill",
			missing: "null"
		}]);
	}
	function l(e) {
		o(z(a).filter((t, n) => n !== e));
	}
	function u(e, t) {
		let n = [...z(a)];
		[n[e], n[e + t]] = [n[e + t], n[e]], o(n);
	}
	let d = /* @__PURE__ */ j(() => z(a).map((e) => e.table || "…").join(" → ")), f = /* @__PURE__ */ M(!1);
	Fn(() => {
		(t.config.only_tables || t.config.cache_size && t.config.cache_size !== 2e5) && N(f, !0);
	});
	var p = QS(), m = P(p), h = (e) => {
		var t = YS(), n = P(t);
		Ov(n, { size: 13 });
		var r = L(n, 2), i = I(L(P(r)), !0);
		O(), D(r), D(t), R(() => W(i, z(d))), U(e, t);
	};
	G(m, (e) => {
		z(a).length > 1 && e(h);
	});
	var g = L(m, 2);
	K(g, 17, () => z(a), Ti, (e, i, o) => {
		{
			let c = /* @__PURE__ */ j(() => z(a).length > 1 ? () => l(o) : void 0);
			JS(e, {
				get config() {
					return z(i);
				},
				get groups() {
					return t.groups;
				},
				get readOnly() {
					return n();
				},
				get canData() {
					return r();
				},
				index: o,
				get total() {
					return z(a).length;
				},
				onset: (e, t) => s(o, e, t),
				get onremove() {
					return z(c);
				},
				onmove: (e) => u(o, e)
			});
		}
	});
	var _ = L(g, 2), v = (e) => {
		var t = XS(), n = F(t);
		qv(P(n), { size: 13 }), O(), D(n), O(2), B("click", n, c), U(e, t);
	};
	G(_, (e) => {
		n() || e(v);
	});
	var y = L(_, 2), b = P(y);
	{
		let e = /* @__PURE__ */ j(() => z(f) ? "rot" : "");
		Q_(b, {
			size: 12,
			get class() {
				return z(e);
			}
		});
	}
	O(), D(y);
	var x = L(y, 2), S = (e) => {
		var r = ZS(), i = P(r), a = L(P(i), 2);
		da(a), D(i);
		var o = L(i, 2), s = L(P(o), 2);
		da(s), D(o), D(r), R(() => {
			fa(a, t.config.only_tables ?? ""), a.disabled = n(), fa(s, t.config.cache_size ?? 2e5), s.disabled = n();
		}), B("input", a, (e) => t.onset("only_tables", e.currentTarget.value)), B("input", s, (e) => t.onset("cache_size", Number(e.currentTarget.value) || 2e5)), U(e, r);
	};
	G(x, (e) => {
		z(f) && e(S);
	}), D(p), B("click", y, () => N(f, !z(f))), U(e, p), A();
}
Hr(["click", "input"]);
//#endregion
//#region src/lib/canvas/ConfigPanel.svelte
var eC = /* @__PURE__ */ V("<button class=\"btn ghost sm icon\" title=\"Preview data at this node\"><!></button>"), tC = /* @__PURE__ */ V("<button class=\"btn ghost sm icon danger\" title=\"Delete node (Del)\"><!></button>"), nC = /* @__PURE__ */ V("<p class=\"desc svelte-wdtkxw\"> </p>"), rC = /* @__PURE__ */ V("<div><!> </div>"), iC = /* @__PURE__ */ V("<div class=\"issues svelte-wdtkxw\"></div>"), aC = /* @__PURE__ */ V("<button class=\"btn mapbtn svelte-wdtkxw\" title=\"See which tables will be created or loaded, and map them (also: double-click the node)\"><!> Table mapping…</button>"), oC = /* @__PURE__ */ V("<div class=\"ro svelte-wdtkxw\"><!> Read-only — your account can't edit flows.</div>"), sC = /* @__PURE__ */ V("<div class=\"field\"><label for=\"cfg-conc\">Concurrency</label> <input id=\"cfg-conc\" class=\"input num\" type=\"number\" min=\"1\" max=\"64\"/></div>"), cC = /* @__PURE__ */ V("<span class=\"tiny muted svelte-wdtkxw\"><!> schema…</span>"), lC = /* @__PURE__ */ V("<span class=\"tiny err svelte-wdtkxw\">schema unavailable</span>"), uC = /* @__PURE__ */ V("<span class=\"tiny muted svelte-wdtkxw\"> </span>"), dC = /* @__PURE__ */ V("<span class=\"spacer svelte-wdtkxw\"></span> <!> <button class=\"btn ghost sm icon\" title=\"Reload input schema\"><!></button>", 1), fC = /* @__PURE__ */ V("<p class=\"muted small\">Unknown processor type — its properties can't be edited.</p>"), pC = /* @__PURE__ */ V("<p class=\"muted small\">This processor has no properties.</p>"), mC = /* @__PURE__ */ V("<aside class=\"cfg svelte-wdtkxw\"><header class=\"svelte-wdtkxw\"><span class=\"ic svelte-wdtkxw\"><!></span> <div class=\"t svelte-wdtkxw\"><div class=\"tt ellipsis svelte-wdtkxw\"> </div> <div class=\"tiny muted mono ellipsis\"> </div></div> <!> <!> <button class=\"btn ghost sm icon\" title=\"Close (Esc)\"><!></button></header> <div class=\"body scroll svelte-wdtkxw\"><!> <!> <!> <!> <fieldset class=\"fs svelte-wdtkxw\"><div class=\"field\"><label for=\"cfg-name\">Name</label> <input id=\"cfg-name\" class=\"input\"/></div> <div class=\"grid2 svelte-wdtkxw\"><!> <div class=\"field\"><span class=\"field-label\">Enabled</span> <label class=\"row\" style=\"height:28px;cursor:pointer\"><span class=\"switch\"><input type=\"checkbox\"/><span></span></span> <span class=\"small dim\"> </span></label></div></div> <div class=\"sect svelte-wdtkxw\"><span class=\"svelte-wdtkxw\">Properties</span> <!></div> <!> <!> <div class=\"sect svelte-wdtkxw\"><span class=\"svelte-wdtkxw\">Notes</span></div> <textarea class=\"textarea\" rows=\"3\" placeholder=\"Notes for your team…\"></textarea></fieldset></div></aside>");
function hC(e, t) {
	k(t, !0);
	let n = Q(t, "issues", 19, () => []), r = Q(t, "readOnly", 3, !1), i = Q(t, "canData", 3, !0), a = /* @__PURE__ */ j(() => zy(t.spec?.icon, t.spec?.category)), o = /* @__PURE__ */ j(() => (t.spec?.properties ?? []).some((e) => e.kind === "columns" || e.kind === "column" || e.kind === "keyvalue" || e.kind === "list" && e.columns?.some((e) => e.kind === "column"))), s = /* @__PURE__ */ j(() => (t.spec?.properties ?? []).filter((e) => C_(e, t.node.config ?? {})));
	function c(e, n) {
		let r = { ...t.node.config ?? {} };
		n === void 0 ? delete r[e] : r[e] = n, t.onchange({ config: r });
	}
	var l = mC(), u = P(l);
	let d;
	var f = P(u);
	Pi(P(f), () => z(a), (e, t) => {
		t(e, { size: 15 });
	}), D(f);
	var p = L(f, 2), m = P(p), h = I(m, !0), g = I(L(m, 2));
	D(p);
	var _ = L(p, 2), v = (e) => {
		var n = eC();
		fv(P(n), { size: 14 }), D(n), B("click", n, function(...e) {
			t.onpreview?.apply(this, e);
		}), U(e, n);
	};
	G(_, (e) => {
		i() && e(v);
	});
	var y = L(_, 2), b = (e) => {
		var n = tC();
		Cy(P(n), { size: 14 }), D(n), B("click", n, function(...e) {
			t.ondelete?.apply(this, e);
		}), U(e, n);
	};
	G(y, (e) => {
		r() || e(b);
	});
	var x = L(y, 2);
	Ny(P(x), { size: 14 }), D(x), D(u);
	var S = L(u, 2), C = P(S), w = (e) => {
		var n = nC(), r = I(n, !0);
		R(() => W(r, t.spec.description)), U(e, n);
	};
	G(C, (e) => {
		t.spec?.description && e(w);
	});
	var T = L(C, 2), ee = (e) => {
		var t = iC();
		K(t, 21, n, Ti, (e, t) => {
			var n = rC(), r = P(n);
			wy(r, { size: 12 });
			var i = L(r);
			D(n), R(() => {
				J(n, 1, `iss ${z(t).level ?? ""}`, "svelte-wdtkxw"), W(i, ` ${z(t).message ?? ""}`);
			}), U(e, n);
		}), D(t), U(e, t);
	};
	G(T, (e) => {
		n().length && e(ee);
	});
	var te = L(T, 2), ne = (e) => {
		var n = aC();
		_y(P(n), { size: 14 }), O(), D(n), B("click", n, function(...e) {
			t.onmapping?.apply(this, e);
		}), U(e, n);
	};
	G(te, (e) => {
		t.onmapping && i() && e(ne);
	});
	var re = L(te, 2), ie = (e) => {
		var t = oC();
		Rv(P(t), { size: 12 }), O(), D(t), U(e, t);
	};
	G(re, (e) => {
		r() && e(ie);
	});
	var ae = L(re, 2), oe = P(ae), se = L(P(oe), 2);
	da(se), D(oe);
	var ce = L(oe, 2), le = P(ce), ue = (e) => {
		var n = sC(), r = L(P(n), 2);
		da(r), D(n), R((e) => fa(r, e), [() => t.node.concurrency || D_(t.spec)]), B("input", r, (e) => t.onchange({ concurrency: Math.max(1, Math.min(64, Math.trunc(Number(e.currentTarget.value)) || 1)) })), U(e, n);
	};
	G(le, (e) => {
		t.spec?.supportsConcurrency && e(ue);
	});
	var de = L(le, 2), fe = L(P(de), 2), pe = P(fe), me = P(pe);
	da(me), O(), D(pe);
	var he = I(L(pe, 2), !0);
	D(fe), D(de), D(ce);
	var ge = L(ce, 2), _e = L(P(ge), 2), ve = (e) => {
		var n = dC(), r = L(F(n), 2), i = (e) => {
			var t = cC();
			Lv(P(t), {
				size: 11,
				class: "spin"
			}), O(), D(t), U(e, t);
		}, a = (e) => {
			var n = lC();
			R(() => Y(n, "title", t.schemaState.error)), U(e, n);
		}, o = (e) => {
			var n = uC(), r = I(n);
			R((e) => W(r, `${e ?? ""} input columns`), [() => t.groups.reduce((e, t) => e + t.columns.length, 0)]), U(e, n);
		};
		G(r, (e) => {
			t.schemaState.loading ? e(i) : t.schemaState.error ? e(a, 1) : e(o, -1);
		});
		var s = L(r, 2);
		Xv(P(s), { size: 12 }), D(s), B("click", s, function(...e) {
			t.onreloadschema?.apply(this, e);
		}), U(e, n);
	};
	G(_e, (e) => {
		z(o) && i() && e(ve);
	}), D(ge);
	var ye = L(ge, 2), be = (e) => {
		U(e, fC());
	}, xe = (e) => {
		U(e, pC());
	};
	G(ye, (e) => {
		t.spec ? (t.spec.properties ?? []).length === 0 && e(xe, 1) : e(be);
	});
	var Se = L(ye, 2), Ce = (e) => {
		{
			let n = /* @__PURE__ */ j(() => t.node.config ?? {});
			$S(e, {
				get config() {
					return z(n);
				},
				get groups() {
					return t.groups;
				},
				get readOnly() {
					return r();
				},
				get canData() {
					return i();
				},
				onset: c
			});
		}
	}, we = (e) => {
		var n = H();
		K(F(n), 17, () => z(s), (e) => e.key, (e, n) => {
			var r = () => t.node.config?.[z(n).key], i = (e) => c(z(n).key, e);
			{
				let a = /* @__PURE__ */ j(() => t.node.config ?? {});
				DS(e, {
					get spec() {
						return z(n);
					},
					get config() {
						return z(a);
					},
					get nodeId() {
						return t.node.id;
					},
					get nodeName() {
						return t.node.name;
					},
					get groups() {
						return t.groups;
					},
					get value() {
						return r();
					},
					set value(e) {
						i(e);
					}
				});
			}
		}), U(e, n);
	};
	G(Se, (e) => {
		t.node.type === "transform.lookup" ? e(Ce) : e(we, -1);
	});
	var Te = L(Se, 4);
	_t(Te), D(ae), D(S), D(l), R(() => {
		d = qi(u, "", d, { "--cat": t.spec ? Vy[t.spec.category] : "var(--text-3)" }), W(h, t.spec?.label ?? t.node.type), W(g, `${t.node.type ?? ""} · ${t.node.id ?? ""}`), ae.disabled = r(), fa(se, t.node.name), pa(me, !t.node.disabled), W(he, t.node.disabled ? "Disabled — skipped" : "Enabled"), fa(Te, t.node.notes ?? "");
	}), B("click", x, function(...e) {
		t.onclose?.apply(this, e);
	}), B("input", se, (e) => t.onchange({ name: e.currentTarget.value })), B("change", me, (e) => t.onchange({ disabled: !e.currentTarget.checked })), B("input", Te, (e) => t.onchange({ notes: e.currentTarget.value })), U(e, l), A();
}
Hr([
	"click",
	"input",
	"change"
]);
//#endregion
//#region src/lib/canvas/EdgePanel.svelte
var gC = /* @__PURE__ */ V("<button class=\"btn ghost sm icon danger\" title=\"Delete connection (Del)\"><!></button>"), _C = /* @__PURE__ */ V("<div><!> </div>"), vC = /* @__PURE__ */ V("<span class=\"help\">loading tables…</span>"), yC = /* @__PURE__ */ V("<span class=\"also svelte-o103z9\"> </span>"), bC = /* @__PURE__ */ V("<label class=\"trow svelte-o103z9\"><input type=\"checkbox\"/> <span class=\"mono svelte-o103z9\"> </span> <!></label>"), xC = /* @__PURE__ */ V("<div class=\"tlist svelte-o103z9\"></div>"), SC = /* @__PURE__ */ V("<input class=\"input mono\" placeholder=\"table names, comma-separated\"/>"), CC = /* @__PURE__ */ V("<div class=\"iss svelte-o103z9\"><!> </div>"), wC = /* @__PURE__ */ V("<div class=\"svelte-o103z9\"><span class=\"k svelte-o103z9\">Retried</span><span class=\"v svelte-o103z9\"> </span></div>"), TC = /* @__PURE__ */ V("<div class=\"svelte-o103z9\"><span class=\"k svelte-o103z9\">Dropped</span><span class=\"v svelte-o103z9\"> </span></div>"), EC = /* @__PURE__ */ V("<div class=\"stats svelte-o103z9\"><div class=\"svelte-o103z9\"><span class=\"k svelte-o103z9\">Queued</span><span class=\"v svelte-o103z9\"> </span></div> <div class=\"svelte-o103z9\"><span class=\"k svelte-o103z9\">Passed</span><span class=\"v svelte-o103z9\"> </span></div> <!> <!></div>"), DC = /* @__PURE__ */ V("<aside class=\"cfg svelte-o103z9\"><header class=\"svelte-o103z9\"><div class=\"t svelte-o103z9\"><div class=\"tt svelte-o103z9\">Connection</div><div class=\"tiny muted mono\"> </div></div> <!> <button class=\"btn ghost sm icon\" title=\"Close (Esc)\"><!></button></header> <div class=\"body svelte-o103z9\"><div class=\"path svelte-o103z9\"><strong class=\"ellipsis\"> </strong> <span> </span> <!> <strong class=\"ellipsis\"> </strong></div> <!> <div class=\"field svelte-o103z9\"><span class=\"field-label\">Tables on this connection</span> <div class=\"seg svelte-o103z9\"><label><input type=\"radio\" class=\"svelte-o103z9\"/> All tables</label> <label><input type=\"radio\" class=\"svelte-o103z9\"/> Only some</label></div> <!> <span class=\"help\">Send only some of the upstream tables along this connection — e.g. <span class=\"mono\">user</span> through a Lookup,\n        the rest straight to the sink. Connect the same output again for the other tables.</span> <!></div> <div class=\"field svelte-o103z9\"><label for=\"bp\">Back-pressure threshold (rows)</label> <input id=\"bp\" class=\"input num\" type=\"number\" min=\"1\" step=\"1000\"/> <span class=\"help\"> </span></div> <div class=\"field svelte-o103z9\"><label for=\"retries\">Retry the destination</label> <div class=\"row\"><input id=\"retries\" class=\"input num\" type=\"number\" min=\"0\" max=\"20\" step=\"1\" placeholder=\"0\"/> <input class=\"input\" style=\"width:90px\" placeholder=\"2s\" title=\"Wait before the first retry; it doubles each time\"/></div> <span class=\"help\">How often a batch is tried again when the destination fails on it, and the wait before the first retry (it doubles\n        each time). For the transient: a dropped connection, a deadlock, a target that was briefly away.</span></div> <div class=\"field svelte-o103z9\"><label for=\"onfail\">When the retries are used up</label> <select id=\"onfail\" class=\"select\"><option>Stop the run</option><option>Keep going — send the rows to dead letters</option></select> <span class=\"help\">Dead-lettered rows keep the error and can be replayed once the cause is fixed.</span></div> <!></div></aside>");
function OC(e, t) {
	k(t, !0);
	let n = Q(t, "issues", 19, () => []), r = Q(t, "readOnly", 3, !1), i = Q(t, "siblings", 19, () => []), a = /* @__PURE__ */ M(null), o = /* @__PURE__ */ M(!1);
	Fn(() => {
		t.edge.id, t.loadTables && (N(o, !0), t.loadTables().then((e) => N(a, e, !0)).catch(() => N(a, null)).finally(() => N(o, !1)));
	});
	let s = /* @__PURE__ */ j(() => (t.edge.tables ?? []).length > 0), c = /* @__PURE__ */ j(() => new Set((t.edge.tables ?? []).map((e) => e.toLowerCase()))), l = /* @__PURE__ */ j(() => [.../* @__PURE__ */ new Set([...z(a) ?? [], ...t.edge.tables ?? []])]), u = /* @__PURE__ */ M("");
	function d(e) {
		t.onchange({ tables: e.length ? e : void 0 });
	}
	function f(e, n) {
		let r = (t.edge.tables ?? []).filter((t) => t.toLowerCase() !== e.toLowerCase());
		d(n ? [...r, e] : r);
	}
	let p = (e, t) => !e?.length || e.some((e) => e.toLowerCase() === t.toLowerCase()), m = /* @__PURE__ */ j(() => (z(a) ?? []).filter((e) => !p(t.edge.tables, e) && !i().some((t) => p(t.tables, e))));
	var h = DC(), g = P(h), _ = P(g), v = I(L(P(_)), !0);
	D(_);
	var y = L(_, 2), b = (e) => {
		var n = gC();
		Cy(P(n), { size: 14 }), D(n), B("click", n, function(...e) {
			t.ondelete?.apply(this, e);
		}), U(e, n);
	};
	G(y, (e) => {
		r() || e(b);
	});
	var x = L(y, 2);
	Ny(P(x), { size: 14 }), D(x), D(g);
	var S = L(g, 2), C = P(S), w = P(C), T = I(w, !0), ee = L(w, 2), te = I(ee, !0), ne = L(ee, 2);
	L_(ne, { size: 13 });
	var re = I(L(ne, 2), !0);
	D(C);
	var ie = L(C, 2);
	K(ie, 17, n, Ti, (e, t) => {
		var n = _C(), r = P(n);
		wy(r, { size: 12 });
		var i = L(r);
		D(n), R(() => {
			J(n, 1, `iss ${z(t).level ?? ""}`, "svelte-o103z9"), W(i, ` ${z(t).message ?? ""}`);
		}), U(e, n);
	});
	var ae = L(ie, 2), oe = L(P(ae), 2), se = P(oe);
	let ce;
	var le = P(se);
	da(le), O(), D(se);
	var ue = L(se, 2);
	let de;
	var fe = P(ue);
	da(fe), O(), D(ue), D(oe);
	var pe = L(oe, 2), me = (e) => {
		var n = H(), a = F(n), s = (e) => {
			U(e, vC());
		}, m = (e) => {
			var t = xC();
			K(t, 20, () => z(l), (e) => e, (e, t) => {
				var n = bC(), a = P(n);
				da(a);
				var o = L(a, 2), s = I(o, !0);
				K(L(o, 2), 17, () => i().filter((e) => e.tables?.length && p(e.tables, t)), Ti, (e, t) => {
					var n = yC(), r = I(n);
					R(() => {
						Y(n, "title", `Also carried to ${z(t).toName ?? ""}`), W(r, `→ ${z(t).toName ?? ""}`);
					}), U(e, n);
				}), D(n), R((e) => {
					pa(a, e), a.disabled = r(), W(s, t);
				}, [() => z(c).has(t.toLowerCase())]), B("change", a, (e) => f(t, e.currentTarget.checked)), U(e, n);
			}), D(t), U(e, t);
		}, h = (e) => {
			var n = SC();
			da(n), R((e) => {
				fa(n, e), n.disabled = r();
			}, [() => z(u) || (t.edge.tables ?? []).join(", ")]), B("input", n, (e) => {
				N(u, e.currentTarget.value, !0), d(z(u).split(",").map((e) => e.trim()).filter(Boolean));
			}), U(e, n);
		};
		G(a, (e) => {
			z(o) ? e(s) : z(l).length ? e(m, 1) : e(h, -1);
		}), U(e, n);
	};
	G(pe, (e) => {
		z(s) && e(me);
	});
	var he = L(pe, 4), ge = (e) => {
		var n = CC(), r = P(n);
		wy(r, { size: 12 });
		var i = L(r);
		D(n), R((e) => W(i, ` Not sent anywhere from ${t.fromName ?? ""}: ${e ?? ""}`), [() => z(m).join(", ")]), U(e, n);
	};
	G(he, (e) => {
		z(m).length && e(ge);
	}), D(ae);
	var _e = L(ae, 2), ve = L(P(_e), 2);
	da(ve);
	var ye = I(L(ve, 2));
	D(_e);
	var be = L(_e, 2), xe = L(P(be), 2), Se = P(xe);
	da(Se);
	var Ce = L(Se, 2);
	da(Ce), D(xe), O(2), D(be);
	var we = L(be, 2), Te = L(P(we), 2), Ee = P(Te);
	Ee.value = Ee.__value = "fail";
	var E = L(Ee);
	E.value = E.__value = "dead_letter", D(Te);
	var De;
	Qi(Te), O(2), D(we);
	var Oe = L(we, 2), ke = (e) => {
		var n = EC(), r = P(n), i = I(L(P(r)));
		D(r);
		var a = L(r, 2), o = I(L(P(a)), !0);
		D(a);
		var s = L(a, 2), c = (e) => {
			var n = wC(), r = I(L(P(n)), !0);
			D(n), R((e) => W(r, e), [() => r_(t.stats.retried)]), U(e, n);
		};
		G(s, (e) => {
			t.stats.retried && e(c);
		});
		var l = L(s, 2), u = (e) => {
			var n = TC(), r = I(L(P(n)), !0);
			D(n), R((e) => W(r, e), [() => r_(t.stats.rowsDropped)]), U(e, n);
		};
		G(l, (e) => {
			t.stats.rowsDropped && e(u);
		}), D(n), R((e, t, n) => {
			W(i, `${e ?? ""} / ${t ?? ""}`), W(o, n);
		}, [
			() => r_(t.stats.queuedRows),
			() => r_(t.stats.capacityRows),
			() => r_(t.stats.rowsPassed)
		]), U(e, n);
	};
	G(Oe, (e) => {
		t.stats && e(ke);
	}), D(S), D(h), R((e, n) => {
		W(v, t.edge.id), W(T, t.fromName), J(ee, 1, `badge ${t.edge.fromPort === "failure" ? "err" : "ok"} mono`), W(te, t.edge.fromPort), W(re, t.toName), ce = J(se, 1, "svelte-o103z9", null, ce, { on: !z(s) }), Y(le, "name", `etab-${t.edge.id ?? ""}`), pa(le, !z(s)), le.disabled = r(), de = J(ue, 1, "svelte-o103z9", null, de, { on: z(s) }), Y(fe, "name", `etab-${t.edge.id ?? ""}`), pa(fe, z(s)), fe.disabled = r(), fa(ve, t.edge.backPressureRows ?? ""), ve.disabled = r(), Y(ve, "placeholder", e), W(ye, `When this many rows are queued on the connection, the upstream node blocks. Default ${n ?? ""}.`), fa(Se, t.edge.retries ?? ""), Se.disabled = r(), fa(Ce, t.edge.retryBackoff ?? ""), Ce.disabled = r() || !t.edge.retries, Te.disabled = r(), De !== (De = t.edge.onFailure ?? "fail") && (Te.value = (Te.__value = De) ?? "", Zi(Te, De));
	}, [() => String(y_), () => r_(y_)]), B("click", x, function(...e) {
		t.onclose?.apply(this, e);
	}), B("change", le, () => d([])), B("change", fe, () => d(z(a)?.length ? [z(a)[0]] : [])), B("input", ve, (e) => {
		let n = e.currentTarget.value;
		t.onchange({ backPressureRows: n === "" ? void 0 : Math.max(1, Math.trunc(Number(n))) });
	}), B("input", Se, (e) => {
		let n = e.currentTarget.value;
		t.onchange({ retries: n === "" ? void 0 : Math.max(0, Math.min(20, Math.trunc(Number(n)))) });
	}), B("input", Ce, (e) => t.onchange({ retryBackoff: e.currentTarget.value.trim() || void 0 })), B("change", Te, (e) => t.onchange({ onFailure: e.currentTarget.value === "dead_letter" ? "dead_letter" : void 0 })), U(e, h), A();
}
Hr([
	"click",
	"change",
	"input"
]);
//#endregion
//#region src/lib/canvas/PreviewPane.svelte
var kC = /* @__PURE__ */ V("<option> </option>"), AC = /* @__PURE__ */ V("<label class=\"small dim\" for=\"pv-table\">Table</label> <select id=\"pv-table\" class=\"select sm-sel mono svelte-1iga5fy\"></select>", 1), jC = /* @__PURE__ */ V("<button><!></button>"), MC = /* @__PURE__ */ V("<span class=\"badge warn\">showing preview of another node</span>"), NC = /* @__PURE__ */ V("<div class=\"perr svelte-1iga5fy\"><!> <span> </span></div>"), PC = /* @__PURE__ */ V("Click <strong>Preview</strong> ", 1), FC = /* @__PURE__ */ V("<div class=\"empty small\"><p><!></p></div>"), IC = /* @__PURE__ */ V("<span> </span>"), LC = /* @__PURE__ */ V("<span class=\"badge err\"> </span>"), RC = /* @__PURE__ */ V("<!> <button title=\"Double-click to select node\"><!> <span class=\"sn ellipsis svelte-1iga5fy\"> </span> <span class=\"badge\"> </span> <!> <!></button>", 1), zC = /* @__PURE__ */ V("<strong> </strong><span class=\"muted tiny mono\"> </span>", 1), BC = /* @__PURE__ */ V("<span class=\"badge ok list\"> </span>"), VC = /* @__PURE__ */ V("<span class=\"badge warn list\"> </span>"), HC = /* @__PURE__ */ V("<span class=\"badge err list\"> </span>"), UC = /* @__PURE__ */ V("<div class=\"sh svelte-1iga5fy\"><!> <!> <!> <!></div>"), WC = /* @__PURE__ */ V("<section class=\"sg svelte-1iga5fy\"><!> <div class=\"gbox svelte-1iga5fy\"><!></div></section>"), GC = /* @__PURE__ */ V("<div class=\"stages svelte-1iga5fy\"></div> <div></div>", 1), KC = /* @__PURE__ */ V("<div class=\"pv svelte-1iga5fy\"><div class=\"bar svelte-1iga5fy\"><button class=\"btn primary sm\"><!> </button> <!> <label class=\"small dim\" for=\"pv-limit\">Rows</label> <select id=\"pv-limit\" class=\"select sm-sel svelte-1iga5fy\" style=\"width:70px\"></select> <!> <span class=\"spacer\"></span> <!> <span class=\"tiny muted\">Nothing is written — rows run through each stage in memory.</span></div> <!></div>");
function qC(e, t) {
	k(t, !0);
	let n = Q(t, "trigger", 3, 0), r = /* @__PURE__ */ M(null), i = /* @__PURE__ */ M(null), a = /* @__PURE__ */ M(""), o = /* @__PURE__ */ M(20), s = /* @__PURE__ */ M(!1), c = /* @__PURE__ */ M(""), l = /* @__PURE__ */ M(-1), u = /* @__PURE__ */ M(!1), d = null;
	async function f(e) {
		if (!t.nodeId) return;
		d?.abort(), d = new AbortController(), N(s, !0), N(c, "");
		let n = t.nodeId;
		try {
			let s = await Bg.preview(t.getGraph(), n, e ?? (z(i) === n ? z(a) : ""), z(o), d.signal);
			N(r, s, !0), N(i, n, !0), N(a, s.table, !0), N(l, (s.stages?.length ?? 0) - 1), t.onresult?.(n, s);
		} catch (e) {
			if (e.name === "AbortError") return;
			N(c, e.message, !0), N(r, null), N(i, n, !0);
		} finally {
			N(s, !1);
		}
	}
	let p = 0;
	Fn(() => {
		n() !== p && (p = n(), n() && f());
	});
	let m = /* @__PURE__ */ j(() => z(r)?.stages ?? []), h = /* @__PURE__ */ j(() => !!z(r) && z(i) !== t.nodeId);
	function g(e) {
		let t = /* @__PURE__ */ new Set(), n = /* @__PURE__ */ new Set(), r = z(m)[e], i = z(m)[e - 1];
		if (!r || !i) return {
			changed: t,
			added: n
		};
		let a = new Map(i.columns.map((e, t) => [e.name, t])), o = r.rows.length === i.rows.length;
		return r.columns.forEach((e, s) => {
			let c = a.get(e.name);
			if (c === void 0) {
				n.add(e.name);
				return;
			}
			if (i.columns[c].type !== e.type) {
				t.add(e.name);
				return;
			}
			if (o) {
				for (let n = 0; n < r.rows.length; n++) if (JSON.stringify(r.rows[n]?.[s]) !== JSON.stringify(i.rows[n]?.[c])) {
					t.add(e.name);
					break;
				}
			}
		}), {
			changed: t,
			added: n
		};
	}
	function _(e) {
		return e.length <= 4 ? e.join(", ") : `${e.slice(0, 4).join(", ")} +${e.length - 4} more`;
	}
	function v(e) {
		let t = z(m)[e], n = z(m)[e - 1];
		if (!t || !n) return [];
		let r = new Set(t.columns.map((e) => e.name));
		return n.columns.map((e) => e.name).filter((e) => !r.has(e));
	}
	function y(e) {
		return Hg.byType.get(e.type);
	}
	var b = { run: f }, x = KC(), S = P(x), C = P(S), w = P(C), T = (e) => {
		Lv(e, {
			size: 13,
			class: "spin"
		});
	}, ee = (e) => {
		fv(e, { size: 13 });
	};
	G(w, (e) => {
		z(s) ? e(T) : e(ee, -1);
	});
	var te = L(w);
	D(C);
	var ne = L(C, 2), re = (e) => {
		var t = AC(), n = L(F(t), 2);
		K(n, 21, () => z(r).tables, Ti, (e, t) => {
			var n = kC(), r = I(n, !0), i = {};
			R(() => {
				W(r, z(t)), i !== (i = z(t)) && (n.value = (n.__value = i) ?? "");
			}), U(e, n);
		}), D(n), Qi(n), B("change", n, () => f(z(a))), $i(n, () => z(a), (e) => N(a, e)), U(e, t);
	};
	G(ne, (e) => {
		z(r) && z(r).tables?.length && e(re);
	});
	var ie = L(ne, 4);
	K(ie, 20, () => [
		10,
		20,
		50,
		100,
		200
	], Ti, (e, t) => {
		var n = kC(), r = I(n, !0), i = {};
		R(() => {
			W(r, t), i !== (i = t) && (n.value = (n.__value = i) ?? "");
		}), U(e, n);
	}), D(ie), Qi(ie);
	var ae = L(ie, 2), oe = (e) => {
		var t = jC();
		let n;
		var r = P(t), i = (e) => {
			ty(e, { size: 13 });
		}, a = (e) => {
			jv(e, { size: 13 });
		};
		G(r, (e) => {
			z(u) ? e(i) : e(a, -1);
		}), D(t), R(() => {
			n = J(t, 1, "btn sm icon", null, n, { active: z(u) }), Y(t, "title", z(u) ? "Show one stage" : "Stack all stages");
		}), B("click", t, () => N(u, !z(u))), U(e, t);
	};
	G(ae, (e) => {
		z(m).length > 1 && e(oe);
	});
	var se = L(ae, 4), ce = (e) => {
		U(e, MC());
	};
	G(se, (e) => {
		z(h) && e(ce);
	}), O(2), D(S);
	var le = L(S, 2), ue = (e) => {
		var t = NC(), n = P(t);
		wy(n, { size: 14 });
		var r = I(L(n, 2), !0);
		D(t), R(() => W(r, z(c))), U(e, t);
	}, de = (e) => {
		var n = FC(), r = P(n), i = P(r), a = (e) => {
			var n = PC(), r = L(F(n), 2);
			R(() => W(r, ` to run ${z(o) ?? ""} sample rows from the source through every stage up to “${t.nodeName ?? ""}”.`)), U(e, n);
		}, s = (e) => {
			U(e, Qr("Select a node on the canvas, then preview the data arriving at and leaving it."));
		};
		G(i, (e) => {
			t.nodeId ? e(a) : e(s, -1);
		}), D(r), D(n), U(e, n);
	}, fe = (e) => {
		var n = GC(), r = F(n);
		K(r, 21, () => z(m), Ti, (e, n, r) => {
			let i = /* @__PURE__ */ j(() => y(z(n))), a = /* @__PURE__ */ j(() => zy(z(i)?.icon, z(i)?.category));
			var o = RC(), s = F(o), c = (e) => {
				Q_(e, {
					size: 13,
					class: "sep"
				});
			};
			G(s, (e) => {
				r > 0 && e(c);
			});
			var d = L(s, 2);
			let f, p;
			var m = P(d);
			Pi(m, () => z(a), (e, t) => {
				t(e, { size: 12 });
			});
			var h = L(m, 2), g = I(h, !0), _ = L(h, 2), v = I(_, !0), b = L(_, 2), x = (e) => {
				var t = IC(), r = I(t, !0);
				R(() => {
					J(t, 1, `badge ${z(n).port === "failure" ? "err" : "info"} mono`), W(r, z(n).port);
				}), U(e, t);
			};
			G(b, (e) => {
				z(n).port && z(n).port !== "success" && e(x);
			});
			var S = L(b, 2), C = (e) => {
				var t = LC(), r = I(t);
				R(() => W(r, `${z(n).errors.length ?? ""} err`)), U(e, t);
			};
			G(S, (e) => {
				z(n).errors?.length && e(C);
			}), D(d), R(() => {
				f = J(d, 1, "stage svelte-1iga5fy", null, f, { on: !z(u) && z(l) === r }), p = qi(d, "", p, { "--cat": z(i) ? Vy[z(i).category] : "var(--text-3)" }), W(g, z(n).name), W(v, z(n).rows.length);
			}), B("click", d, () => (N(l, r, !0), N(u, !1))), B("dblclick", d, () => t.onselectnode?.(z(n).nodeId)), U(e, o);
		}), D(r);
		var i = L(r, 2);
		let a;
		K(i, 21, () => z(m), Ti, (e, t, n) => {
			var r = H(), i = F(r), a = (e) => {
				let r = /* @__PURE__ */ j(() => g(n)), i = /* @__PURE__ */ j(() => v(n));
				var a = WC(), o = P(a), s = (e) => {
					var n = UC(), a = P(n), o = (e) => {
						var n = zC(), r = F(n), i = I(r, !0), a = I(L(r), !0);
						R(() => {
							W(i, z(t).name), W(a, z(t).type);
						}), U(e, n);
					};
					G(a, (e) => {
						z(u) && e(o);
					});
					var s = L(a, 2), c = (e) => {
						var t = BC(), n = I(t);
						R((e, r) => {
							Y(t, "title", `Added: ${e ?? ""}`), W(n, `+${r ?? ""}`);
						}, [() => [...z(r).added].join(", "), () => _([...z(r).added])]), U(e, t);
					};
					G(s, (e) => {
						z(r).added.size && e(c);
					});
					var l = L(s, 2), d = (e) => {
						var t = VC(), n = I(t);
						R((e, r) => {
							Y(t, "title", `Changed: ${e ?? ""}`), W(n, `~${r ?? ""}`);
						}, [() => [...z(r).changed].join(", "), () => _([...z(r).changed])]), U(e, t);
					};
					G(l, (e) => {
						z(r).changed.size && e(d);
					});
					var f = L(l, 2), p = (e) => {
						var t = HC(), n = I(t);
						R((e, r) => {
							Y(t, "title", `Dropped: ${e ?? ""}`), W(n, `−${r ?? ""}`);
						}, [() => z(i).join(", "), () => _(z(i))]), U(e, t);
					};
					G(f, (e) => {
						z(i).length && e(p);
					}), D(n), U(e, n);
				};
				G(o, (e) => {
					(z(u) || z(r).changed.size || z(r).added.size || z(i).length) && e(s);
				});
				var c = L(o, 2), l = P(c);
				{
					let e = /* @__PURE__ */ j(() => z(t).columns ?? []), n = /* @__PURE__ */ j(() => z(t).rows ?? []), i = /* @__PURE__ */ j(() => z(t).errors ?? []);
					Px(l, {
						get columns() {
							return z(e);
						},
						get rows() {
							return z(n);
						},
						get errors() {
							return z(i);
						},
						get changed() {
							return z(r).changed;
						},
						get added() {
							return z(r).added;
						},
						emptyText: "No rows left this stage"
					});
				}
				D(c), D(a), U(e, a);
			};
			G(i, (e) => {
				(z(u) || z(l) === n) && e(a);
			}), U(e, r);
		}), D(i), R(() => a = J(i, 1, "grids svelte-1iga5fy", null, a, { stacked: z(u) })), U(e, n);
	};
	return G(le, (e) => {
		z(c) ? e(ue) : z(r) ? e(fe, -1) : e(de, 1);
	}), D(x), R(() => {
		C.disabled = !t.nodeId || z(s), W(te, ` Preview${t.nodeName ? ` “${t.nodeName}”` : ""}`);
	}), B("click", C, () => f()), $i(ie, () => z(o), (e) => N(o, e)), U(e, x), A(b);
}
Hr([
	"click",
	"change",
	"dblclick"
]);
//#endregion
//#region src/lib/run/RunProgress.svelte
var JC = /* @__PURE__ */ V("<span class=\"of svelte-khb7k3\"> </span>"), YC = /* @__PURE__ */ V("<div class=\"stat svelte-khb7k3\"><div class=\"k svelte-khb7k3\">Rows deleted</div><div class=\"v num svelte-khb7k3\"> </div></div>"), XC = /* @__PURE__ */ V("<div class=\"stat svelte-khb7k3\"><div class=\"k svelte-khb7k3\">Chunks</div><div class=\"v num svelte-khb7k3\"> <span class=\"of svelte-khb7k3\"> </span></div></div>"), ZC = /* @__PURE__ */ V("<div class=\"overall svelte-khb7k3\"><div><div class=\"svelte-khb7k3\"></div></div></div>"), QC = /* @__PURE__ */ V("<p class=\"note muted small svelte-khb7k3\">This run follows its source and keeps going: new and changed rows are written as they appear, and rows deleted at\n      the source are removed. It ends when you stop it, and starts again where it left off.</p>"), $C = /* @__PURE__ */ V("<div></div>"), ew = /* @__PURE__ */ V("<div><span class=\"pd svelte-khb7k3\"><!></span> </div> <!>", 1), tw = /* @__PURE__ */ V("<div class=\"phases svelte-khb7k3\"></div>"), nw = /* @__PURE__ */ V("<div class=\"rerr svelte-khb7k3\"> </div>"), rw = /* @__PURE__ */ V("<button> <span class=\"muted svelte-khb7k3\"> </span></button>"), iw = /* @__PURE__ */ V("<div><div class=\"svelte-khb7k3\"></div></div>"), aw = /* @__PURE__ */ V("<span class=\"muted svelte-khb7k3\"> </span>"), ow = /* @__PURE__ */ V("<div><span class=\"ic svelte-khb7k3\"><!></span> <span class=\"tn mono ellipsis svelte-khb7k3\"> </span> <div class=\"bar svelte-khb7k3\"><!></div> <span class=\"num small nums svelte-khb7k3\"> <!></span> <span class=\"num small muted chunks svelte-khb7k3\"> </span> <span> </span></div>"), sw = /* @__PURE__ */ V("<div class=\"empty small svelte-khb7k3\"> </div>"), cw = /* @__PURE__ */ V("<div class=\"rp svelte-khb7k3\"><div class=\"totals svelte-khb7k3\"><div class=\"stat svelte-khb7k3\"><div class=\"k svelte-khb7k3\">Rows read</div><div class=\"v num svelte-khb7k3\"> </div></div> <div class=\"stat svelte-khb7k3\"><div class=\"k svelte-khb7k3\">Rows written</div> <div class=\"v num svelte-khb7k3\"> <!></div></div> <!> <div class=\"stat svelte-khb7k3\"><div class=\"k svelte-khb7k3\">Failed</div><div> </div></div> <div class=\"stat svelte-khb7k3\"><div class=\"k svelte-khb7k3\">Tables</div><div class=\"v num svelte-khb7k3\"> </div></div> <!> <div class=\"stat svelte-khb7k3\"><div class=\"k svelte-khb7k3\">Throughput</div><div class=\"v num svelte-khb7k3\"> <span class=\"of svelte-khb7k3\">rows/s</span></div></div> <div class=\"stat svelte-khb7k3\"><div class=\"k svelte-khb7k3\"> </div><div class=\"v num svelte-khb7k3\"> </div></div> <!></div> <!> <!> <div class=\"filters svelte-khb7k3\"><div class=\"search svelte-khb7k3\"><!><input class=\"input svelte-khb7k3\" placeholder=\"Filter tables…\"/></div> <!></div> <div class=\"tlist svelte-khb7k3\"></div></div>");
function lw(e, t) {
	k(t, !0);
	let n = /* @__PURE__ */ M(""), r = /* @__PURE__ */ M("all"), i = [
		{
			key: "loading",
			label: "Load data"
		},
		{
			key: "indexes",
			label: "Indexes"
		},
		{
			key: "constraints",
			label: "Constraints"
		},
		{
			key: "sequences",
			label: "Sequences"
		}
	], a = /* @__PURE__ */ j(() => t.detail.status === "completed" ? i.length : i.findIndex((e) => e.key === (t.detail.phase || (t.detail.status === "running" ? "loading" : "")))), o = /* @__PURE__ */ j(() => t.detail.tables ?? []), s = /* @__PURE__ */ j(() => ({
		all: z(o).length,
		pending: z(o).filter((e) => e.status === "pending").length,
		reading: z(o).filter((e) => e.status === "reading").length,
		done: z(o).filter((e) => e.status === "done").length,
		failed: z(o).filter((e) => e.status === "failed").length
	})), c = /* @__PURE__ */ j(() => !!t.detail.live), l = /* @__PURE__ */ j(() => z(o).reduce((e, t) => e + (t.rowsDeleted || 0), 0)), u = /* @__PURE__ */ j(() => z(o).reduce((e, t) => e + (t.estimatedRows || 0), 0)), d = /* @__PURE__ */ j(() => z(o).reduce((e, t) => e + (t.chunksDone || 0), 0)), f = /* @__PURE__ */ j(() => z(o).reduce((e, t) => e + (t.chunksTotal || 0), 0)), p = /* @__PURE__ */ j(() => (t.detail.nodes ?? []).reduce((e, t) => Math.max(e, t.rowsPerSec || 0), 0)), m = {
		reading: 0,
		failed: 1,
		pending: 2,
		done: 3
	}, h = /* @__PURE__ */ j(() => z(o).filter((e) => (z(r) === "all" || e.status === z(r)) && (!z(n) || e.table.toLowerCase().includes(z(n).toLowerCase()))).sort((e, t) => (m[e.status] ?? 9) - (m[t.status] ?? 9) || e.table.localeCompare(t.table)));
	var g = cw(), _ = P(g), v = P(_), y = L(P(v)), b = I(y, !0);
	D(v);
	var x = L(v, 2), S = L(P(x), 2), C = P(S, !0), w = L(C), T = (e) => {
		var t = JC(), n = I(t);
		R((e) => W(n, `/ ~${e ?? ""}`), [() => i_(z(u))]), U(e, t);
	};
	G(w, (e) => {
		z(c) || e(T);
	}), D(S), D(x);
	var ee = L(x, 2), te = (e) => {
		var t = YC(), n = L(P(t)), r = I(n, !0);
		D(t), R((e, t) => {
			Y(n, "title", e), W(r, t);
		}, [() => r_(z(l)), () => i_(z(l))]), U(e, t);
	};
	G(ee, (e) => {
		z(c) && e(te);
	});
	var ne = L(ee, 2), re = L(P(ne));
	let ie;
	var ae = I(re, !0);
	D(ne);
	var oe = L(ne, 2), se = I(L(P(oe)), !0);
	D(oe);
	var ce = L(oe, 2), le = (e) => {
		var t = XC(), n = L(P(t)), r = P(n, !0), i = I(L(r));
		D(n), D(t), R((e, t) => {
			W(r, e), W(i, `/ ${t ?? ""}`);
		}, [() => i_(z(d)), () => i_(z(f))]), U(e, t);
	};
	G(ce, (e) => {
		z(c) || e(le);
	});
	var ue = L(ce, 2), de = L(P(ue)), fe = P(de, !0);
	O(), D(de), D(ue);
	var pe = L(ue, 2), me = P(pe), he = I(me, !0), ge = I(L(me), !0);
	D(pe);
	var _e = L(pe, 2), ve = (e) => {
		var n = ZC(), r = P(n);
		let i;
		var a = P(r);
		let o;
		D(r), D(n), R((e) => {
			i = J(r, 1, "progress svelte-khb7k3", null, i, {
				ok: t.detail.status === "completed",
				err: t.detail.status === "failed"
			}), o = qi(a, "", o, { width: e });
		}, [() => `${(t.detail.status === "completed" ? 100 : l_(t.detail.rowsWritten, z(u))) ?? ""}%`]), U(e, n);
	};
	G(_e, (e) => {
		z(c) || e(ve);
	}), D(_);
	var ye = L(_, 2), be = (e) => {
		U(e, QC());
	}, xe = (e) => {
		var n = tw();
		K(n, 21, () => i, Ti, (e, n, r) => {
			var o = ew(), s = F(o);
			let c;
			var l = P(s), u = P(l), d = (e) => {
				J_(e, { size: 10 });
			}, f = (e) => {
				var t = Qr();
				t.nodeValue = r + 1, U(e, t);
			};
			G(u, (e) => {
				z(a) > r ? e(d) : e(f, -1);
			}), D(l);
			var p = L(l, 1, !0);
			D(s);
			var m = L(s, 2), h = (e) => {
				var t = $C();
				let n;
				R(() => n = J(t, 1, "pline svelte-khb7k3", null, n, { done: z(a) > r })), U(e, t);
			};
			G(m, (e) => {
				r < i.length - 1 && e(h);
			}), R(() => {
				c = J(s, 1, "phase svelte-khb7k3", null, c, {
					done: z(a) > r,
					cur: z(a) === r && t.detail.status !== "failed",
					fail: z(a) === r && t.detail.status === "failed"
				}), W(p, z(n).label);
			}), U(e, o);
		}), D(n), U(e, n);
	};
	G(ye, (e) => {
		z(c) ? e(be) : e(xe, -1);
	});
	var Se = L(ye, 2), Ce = (e) => {
		var n = nw(), r = I(n, !0);
		R(() => W(r, t.detail.error)), U(e, n);
	};
	G(Se, (e) => {
		t.detail.error && e(Ce);
	});
	var we = L(Se, 2), Te = P(we), Ee = P(Te);
	ay(Ee, { size: 13 });
	var E = L(Ee);
	da(E), D(Te), K(L(Te, 2), 16, () => [
		"all",
		"reading",
		"pending",
		"done",
		"failed"
	], Ti, (e, t) => {
		var n = rw();
		let i;
		var a = P(n), o = I(L(a), !0);
		D(n), R(() => {
			i = J(n, 1, "btn sm svelte-khb7k3", null, i, { active: z(r) === t }), W(a, `${t ?? ""} `), W(o, z(s)[t]);
		}), B("click", n, () => N(r, t, !0)), U(e, n);
	}), D(we);
	var De = L(we, 2);
	K(De, 21, () => z(h), (e) => e.table, (e, t) => {
		var n = ow(), r = P(n), i = P(r), a = (e) => {
			J_(e, { size: 13 });
		}, o = (e) => {
			tv(e, { size: 13 });
		}, s = (e) => {
			Lv(e, {
				size: 13,
				class: "spin"
			});
		}, l = (e) => {
			nv(e, { size: 13 });
		};
		G(i, (e) => {
			z(t).status === "done" ? e(a) : z(t).status === "failed" ? e(o, 1) : z(t).status === "reading" ? e(s, 2) : e(l, -1);
		}), D(r);
		var u = L(r, 2), d = I(u, !0), f = L(u, 2), p = P(f), m = (e) => {
			var n = iw();
			let r;
			var i = P(n);
			let a;
			D(n), R((e) => {
				r = J(n, 1, "progress svelte-khb7k3", null, r, {
					ok: z(t).status === "done",
					err: z(t).status === "failed"
				}), a = qi(i, "", a, { width: e });
			}, [() => `${(z(t).status === "done" ? 100 : l_(z(t).rowsWritten, z(t).estimatedRows)) ?? ""}%`]), U(e, n);
		};
		G(p, (e) => {
			z(c) || e(m);
		}), D(f);
		var h = L(f, 2), g = P(h, !0), _ = L(g), v = (e) => {
			var n = aw(), r = I(n);
			R((e) => W(r, `/ ~${e ?? ""}`), [() => i_(z(t).estimatedRows)]), U(e, n);
		};
		G(_, (e) => {
			z(c) || e(v);
		}), D(h);
		var y = L(h, 2), b = I(y, !0), x = L(y, 2);
		let S;
		var C = I(x, !0);
		D(n), R((e, r, i, a, o, s) => {
			J(n, 1, `trow ${z(t).status ?? ""}`, "svelte-khb7k3"), Y(u, "title", z(t).table), W(d, z(t).table), Y(h, "title", `${e ?? ""} written / ${r ?? ""} read${i ?? ""}`), W(g, a), Y(y, "title", z(c) ? "rows removed because the source deleted them" : "chunks done / total"), W(b, o), S = J(x, 1, "num small fails svelte-khb7k3", null, S, { bad: z(t).rowsFailed > 0 }), W(C, s);
		}, [
			() => r_(z(t).rowsWritten),
			() => r_(z(t).rowsRead),
			() => z(c) ? "" : ` / ~${r_(z(t).estimatedRows)} estimated`,
			() => i_(z(t).rowsWritten),
			() => z(c) ? z(t).rowsDeleted ? `${i_(z(t).rowsDeleted)} deleted` : "" : `${z(t).chunksDone}/${z(t).chunksTotal} ch`,
			() => z(t).rowsFailed ? `${i_(z(t).rowsFailed)} failed` : ""
		]), U(e, n);
	}, (e) => {
		var t = sw(), n = I(t, !0);
		R(() => W(n, z(o).length ? "No tables match." : "No table progress yet.")), U(e, t);
	}), D(De), D(g), R((e, n, r, i, a, o, l) => {
		Y(y, "title", e), W(b, n), Y(S, "title", r), W(C, i), ie = J(re, 1, "v num svelte-khb7k3", null, ie, { bad: t.detail.rowsFailed > 0 }), W(ae, a), W(se, z(c) ? z(s).all : `${z(s).done} / ${z(s).all}`), W(fe, o), W(he, z(c) ? "Following for" : "Elapsed"), W(ge, l);
	}, [
		() => r_(t.detail.rowsRead),
		() => i_(t.detail.rowsRead),
		() => r_(t.detail.rowsWritten),
		() => i_(t.detail.rowsWritten),
		() => i_(t.detail.rowsFailed),
		() => i_(z(p)),
		() => c_(t.detail.startedAt, t.detail.finishedAt)
	]), ya(E, () => z(n), (e) => N(n, e)), U(e, g), A();
}
Hr(["click"]);
//#endregion
//#region src/lib/run/Bulletins.svelte
var uw = /* @__PURE__ */ V("<button class=\"node svelte-1gxfhr9\" title=\"Select node\"> </button>"), dw = /* @__PURE__ */ V("<span class=\"tbl mono svelte-1gxfhr9\"> </span>"), fw = /* @__PURE__ */ V("<div><span class=\"t mono svelte-1gxfhr9\"> </span> <span class=\"lv svelte-1gxfhr9\"> </span> <!> <!> <span class=\"m svelte-1gxfhr9\"> </span></div>"), pw = /* @__PURE__ */ V("<div class=\"empty small\"> </div>"), mw = /* @__PURE__ */ V("<div class=\"bl svelte-1gxfhr9\"><div class=\"bar svelte-1gxfhr9\"><div class=\"search svelte-1gxfhr9\"><!><input class=\"input svelte-1gxfhr9\" placeholder=\"Filter messages…\"/></div> <button>All <span class=\"muted\"> </span></button> <button>Warnings+ <span class=\"muted\"> </span></button> <button>Errors <span class=\"muted\"> </span></button></div> <div class=\"list scroll svelte-1gxfhr9\"></div></div>");
function hw(e, t) {
	k(t, !0);
	let n = Q(t, "follow", 3, !0), r = /* @__PURE__ */ M("all"), i = /* @__PURE__ */ M(""), a = /* @__PURE__ */ M(void 0), o = /* @__PURE__ */ M(!0), s = /* @__PURE__ */ j(() => t.bulletins.filter((e) => (z(r) === "all" || e.level === z(r) || z(r) === "warn" && e.level === "error") && (!z(i) || e.message.toLowerCase().includes(z(i).toLowerCase()) || e.table?.toLowerCase().includes(z(i).toLowerCase())))), c = /* @__PURE__ */ j(() => ({
		warn: t.bulletins.filter((e) => e.level === "warn").length,
		error: t.bulletins.filter((e) => e.level === "error").length
	}));
	Fn(() => {
		z(s).length, n() && z(o) && z(a) && queueMicrotask(() => z(a) && (z(a).scrollTop = z(a).scrollHeight));
	});
	function l() {
		z(a) && N(o, z(a).scrollHeight - z(a).scrollTop - z(a).clientHeight < 24);
	}
	var u = mw(), d = P(u), f = P(d), p = P(f);
	ay(p, { size: 13 });
	var m = L(p);
	da(m), D(f);
	var h = L(f, 2);
	let g;
	var _ = I(L(P(h)), !0);
	D(h);
	var v = L(h, 2);
	let y;
	var b = I(L(P(v)), !0);
	D(v);
	var x = L(v, 2);
	let S;
	var C = I(L(P(x)), !0);
	D(x), D(d);
	var w = L(d, 2);
	K(w, 21, () => z(s), (e) => e.seq, (e, n) => {
		var r = fw(), i = P(r), a = I(i, !0), o = L(i, 2), s = I(o, !0), c = L(o, 2), l = (e) => {
			var r = uw(), i = I(r, !0);
			R((e) => {
				r.disabled = !t.onnode, W(i, e);
			}, [() => t.nodeName?.(z(n).nodeId) ?? z(n).nodeId]), B("click", r, () => t.onnode?.(z(n).nodeId)), U(e, r);
		};
		G(c, (e) => {
			z(n).nodeId && e(l);
		});
		var u = L(c, 2), d = (e) => {
			var t = dw(), r = I(t, !0);
			R(() => W(r, z(n).table)), U(e, t);
		};
		G(u, (e) => {
			z(n).table && e(d);
		});
		var f = I(L(u, 2), !0);
		D(r), R((e) => {
			J(r, 1, `b ${z(n).level ?? ""}`, "svelte-1gxfhr9"), W(a, e), W(s, z(n).level), W(f, z(n).message);
		}, [() => o_(z(n).time)]), U(e, r);
	}, (e) => {
		var n = pw(), r = I(n);
		R(() => W(r, `No bulletins${t.bulletins.length ? " match" : " yet"}.`)), U(e, n);
	}), D(w), Ea(w, (e) => N(a, e), () => z(a)), D(u), R(() => {
		g = J(h, 1, "btn sm", null, g, { active: z(r) === "all" }), W(_, t.bulletins.length), y = J(v, 1, "btn sm", null, y, { active: z(r) === "warn" }), W(b, z(c).warn + z(c).error), S = J(x, 1, "btn sm", null, S, { active: z(r) === "error" }), W(C, z(c).error);
	}), ya(m, () => z(i), (e) => N(i, e)), B("click", h, () => N(r, "all")), B("click", v, () => N(r, "warn")), B("click", x, () => N(r, "error")), Vr("scroll", w, l), U(e, u), A();
}
Hr(["click"]);
var gw = new class {
	#e = /* @__PURE__ */ M(null);
	get current() {
		return z(this.#e);
	}
	set current(e) {
		N(this.#e, e, !0);
	}
	ask(e) {
		return new Promise((t) => {
			this.current = {
				...e,
				resolve: t
			};
		});
	}
	answer(e) {
		let t = this.current;
		this.current = null, t?.resolve(e);
	}
}(), _w = (e) => gw.ask(e), vw = /* @__PURE__ */ V("<option> </option>"), yw = /* @__PURE__ */ V("<button class=\"btn sm\" title=\"Run these rows through the flow again, from this node on\"><!> </button>"), bw = /* @__PURE__ */ V("<span class=\"muted small num\"> </span> <button class=\"btn sm icon\" aria-label=\"Previous\"><!></button> <button class=\"btn sm icon\" aria-label=\"Next\"><!></button>", 1), xw = /* @__PURE__ */ V("<div class=\"body svelte-1jf1ugk\"><div class=\"errfull svelte-1jf1ugk\"> </div> <pre class=\"svelte-1jf1ugk\"> </pre></div>"), Sw = /* @__PURE__ */ V("<div><button class=\"head svelte-1jf1ugk\"><span class=\"t mono svelte-1jf1ugk\"> </span> <span class=\"tbl mono svelte-1jf1ugk\"> </span> <span class=\"node svelte-1jf1ugk\"> </span> <span class=\"err ellipsis svelte-1jf1ugk\"> </span></button> <!></div>"), Cw = /* @__PURE__ */ V("<div class=\"empty small\"> </div>"), ww = /* @__PURE__ */ V("<div class=\"dl svelte-1jf1ugk\"><div class=\"bar svelte-1jf1ugk\"><select class=\"select\" style=\"width:240px;height:24px\"><option>All tables</option><!></select> <button class=\"btn sm icon\" title=\"Refresh\"><!></button> <!> <span class=\"spacer\"></span> <!></div> <div class=\"list scroll svelte-1jf1ugk\"><!></div></div>");
function Tw(e, t) {
	k(t, !0);
	let n = Q(t, "tables", 19, () => []), r = /* @__PURE__ */ M("");
	async function i(e) {
		if (await _w({
			title: "Replay dead letters",
			message: `Feed every dead-lettered row of “${t.nodeName?.(e) ?? e}” back into it and on through the rest of the flow? This starts a run of its own and writes to the same targets.`,
			confirmLabel: "Replay"
		})) {
			N(r, e, !0);
			try {
				let n = await Bg.replayDeadLetters(t.runId, e);
				Gg.success("Replay started"), Kg(`/runs/${n.id}`);
			} catch (e) {
				Gg.error(e);
			} finally {
				N(r, "");
			}
		}
	}
	let a = /* @__PURE__ */ M(""), o = /* @__PURE__ */ M(0), s = /* @__PURE__ */ M(null), c = /* @__PURE__ */ M(!1), l = /* @__PURE__ */ M(null), u = /* @__PURE__ */ j(() => [...new Set((z(s)?.items ?? []).map((e) => e.nodeId))]);
	async function d() {
		N(c, !0);
		try {
			N(s, await Bg.deadLetters(t.runId, z(a), z(o), 50), !0);
		} catch (e) {
			Gg.error(e), N(s, z(s) ?? {
				total: 0,
				items: []
			}, !0);
		} finally {
			N(c, !1);
		}
	}
	Fn(() => {
		t.runId, z(a), z(o), d();
	});
	var f = ww(), p = P(f), m = P(p), h = P(m);
	h.value = h.__value = "", K(L(h), 17, n, Ti, (e, t) => {
		var n = vw(), r = I(n, !0), i = {};
		R(() => {
			W(r, z(t)), i !== (i = z(t)) && (n.value = (n.__value = i) ?? "");
		}), U(e, n);
	}), D(m), Qi(m);
	var g = L(m, 2), _ = P(g);
	{
		let e = /* @__PURE__ */ j(() => z(c) ? "spin" : "");
		Xv(_, {
			size: 13,
			get class() {
				return z(e);
			}
		});
	}
	D(g);
	var v = L(g, 2), y = (e) => {
		var n = H();
		K(F(n), 16, () => z(u), (e) => e, (e, n) => {
			var a = yw(), o = P(a);
			Qv(o, { size: 12 });
			var s = L(o);
			D(a), R((e) => {
				a.disabled = !!z(r), W(s, ` Replay ${e ?? ""}`);
			}, [() => t.nodeName?.(n) ?? n]), B("click", a, () => i(n)), U(e, a);
		}), U(e, n);
	};
	G(v, (e) => {
		n_.can.run && e(y);
	});
	var b = L(v, 4), x = (e) => {
		var t = bw(), n = F(t), r = I(n, !0), i = L(n, 2);
		X_(P(i), { size: 14 }), D(i);
		var a = L(i, 2);
		Q_(P(a), { size: 14 }), D(a), R((e) => {
			W(r, e), i.disabled = z(o) === 0, a.disabled = z(o) + 50 >= z(s).total;
		}, [() => z(s).total ? `${z(o) + 1}–${Math.min(z(o) + 50, z(s).total)} of ${r_(z(s).total)}` : "0 rows"]), B("click", i, () => N(o, Math.max(0, z(o) - 50), !0)), B("click", a, () => N(o, z(o) + 50)), U(e, t);
	};
	G(b, (e) => {
		z(s) && e(x);
	}), D(p);
	var S = L(p, 2), C = P(S), w = (e) => {
		tb(e, { rows: 5 });
	}, T = (e) => {
		var n = H();
		K(F(n), 17, () => z(s).items, (e) => e.id, (e, n) => {
			var r = Sw();
			let i;
			var a = P(r), o = P(a), s = I(o, !0), c = L(o, 2), u = I(c, !0), d = L(c, 2), f = I(d, !0), p = I(L(d, 2), !0);
			D(a);
			var m = L(a, 2), h = (e) => {
				var t = xw(), r = P(t), i = I(r, !0), a = I(L(r, 2), !0);
				D(t), R((e) => {
					W(i, z(n).error), W(a, e);
				}, [() => JSON.stringify(z(n).row, null, 2)]), U(e, t);
			};
			G(m, (e) => {
				z(l) === z(n).id && e(h);
			}), D(r), R((e, t) => {
				i = J(r, 1, "item svelte-1jf1ugk", null, i, { open: z(l) === z(n).id }), W(s, e), W(u, z(n).table), W(f, t), W(p, z(n).error);
			}, [() => o_(z(n).time), () => t.nodeName?.(z(n).nodeId) ?? z(n).nodeId]), B("click", a, () => N(l, z(l) === z(n).id ? null : z(n).id, !0)), U(e, r);
		}, (e) => {
			var t = Cw(), n = I(t);
			R(() => W(n, `No dead-lettered rows${z(a) ? ` for ${z(a)}` : ""}. 🎉`)), U(e, t);
		}), U(e, n);
	};
	G(C, (e) => {
		z(s) ? e(T, -1) : e(w);
	}), D(S), D(f), B("change", m, () => N(o, 0)), $i(m, () => z(a), (e) => N(a, e)), B("click", g, d), U(e, f), A();
}
Hr(["change", "click"]);
//#endregion
//#region src/lib/components/StatusPill.svelte
var Ew = /* @__PURE__ */ V("<span><span class=\"dot svelte-1swmi23\"></span> </span>"), Dw = /* @__PURE__ */ V("<span>never run</span>");
function Ow(e, t) {
	let n = Q(t, "size", 3, "md"), r = Q(t, "live", 3, !1), i = /* @__PURE__ */ j(() => r() && t.status === "running" ? "live" : t.status), a = {
		pending: "muted",
		running: "running",
		paused: "warn",
		stopping: "warn",
		stopped: "muted",
		completed: "ok",
		failed: "err"
	};
	var o = H(), s = F(o), c = (e) => {
		var o = Ew(), s = L(P(o), 1, !0);
		D(o), R(() => {
			J(o, 1, `pill ${a[t.status] ?? "muted" ?? ""} ${n() ?? ""}`, "svelte-1swmi23"), Y(o, "title", r() ? "Follows its source; ends only when stopped" : void 0), W(s, z(i));
		}), U(e, o);
	}, l = (e) => {
		var t = Dw();
		R(() => J(t, 1, `pill none ${n() ?? ""}`, "svelte-1swmi23")), U(e, t);
	};
	G(s, (e) => {
		t.status ? e(c) : e(l, -1);
	}), U(e, o);
}
//#endregion
//#region src/lib/run/RunsHistory.svelte
var kw = /* @__PURE__ */ V("<div class=\"empty small\"> </div>"), Aw = /* @__PURE__ */ V("<div class=\"empty small\">This flow has never run.</div>"), jw = /* @__PURE__ */ V("<tr><td class=\"svelte-v7lhhb\"> </td><td class=\"svelte-v7lhhb\"><!></td><td class=\"num svelte-v7lhhb\"> </td><td class=\"right num svelte-v7lhhb\"> </td><td class=\"right num svelte-v7lhhb\"> </td><td class=\"right num svelte-v7lhhb\"> </td><td class=\"svelte-v7lhhb\"><a>Open</a></td></tr>"), Mw = /* @__PURE__ */ V("<div class=\"table-wrap\"><table class=\"table svelte-v7lhhb\"><thead><tr><th class=\"svelte-v7lhhb\">Started</th><th class=\"svelte-v7lhhb\">Status</th><th class=\"svelte-v7lhhb\">Duration</th><th class=\"right svelte-v7lhhb\">Read</th><th class=\"right svelte-v7lhhb\">Written</th><th class=\"right svelte-v7lhhb\">Failed</th><th class=\"svelte-v7lhhb\"></th></tr></thead><tbody></tbody></table></div>");
function Nw(e, t) {
	k(t, !0);
	let n = Q(t, "refreshKey", 3, 0), r = /* @__PURE__ */ M(null), i = /* @__PURE__ */ M("");
	Fn(() => {
		n(), Bg.flowRuns(t.flowId).then((e) => N(r, e ?? [], !0), (e) => (N(i, e.message, !0), N(r, [], !0)));
	});
	var a = H(), o = F(a), s = (e) => {
		tb(e, { rows: 4 });
	}, c = (e) => {
		var t = kw(), n = I(t, !0);
		R(() => W(n, z(i))), U(e, t);
	}, l = (e) => {
		U(e, Aw());
	}, u = (e) => {
		var n = Mw(), i = P(n), a = L(P(i));
		K(a, 21, () => z(r), (e) => e.id, (e, n) => {
			var r = jw();
			let i;
			var a = P(r), o = I(a, !0), s = L(a);
			Ow(P(s), {
				get status() {
					return z(n).status;
				},
				get live() {
					return z(n).live;
				},
				size: "sm"
			}), D(s);
			var c = L(s), l = I(c, !0), u = L(c), d = I(u, !0), f = L(u), p = I(f, !0), m = L(f);
			let h;
			var g = I(m, !0), _ = I(L(m));
			D(r), R((e, a, s, c, u, f) => {
				i = J(r, 1, "svelte-v7lhhb", null, i, { cur: z(n).id === t.currentId }), W(o, e), W(l, a), W(d, s), W(p, c), h = qi(m, "", h, { color: z(n).rowsFailed ? "var(--err)" : void 0 }), W(g, u), Y(_, "href", f);
			}, [
				() => a_(z(n).startedAt),
				() => c_(z(n).startedAt, z(n).finishedAt),
				() => i_(z(n).rowsRead),
				() => i_(z(n).rowsWritten),
				() => i_(z(n).rowsFailed),
				() => qg(`/runs/${z(n).id}`)
			]), U(e, r);
		}), D(a), D(i), D(n), U(e, n);
	};
	G(o, (e) => {
		z(r) === null ? e(s) : z(i) ? e(c, 1) : z(r).length === 0 ? e(l, 2) : e(u, -1);
	}), U(e, a), A();
}
//#endregion
//#region src/lib/run/Queues.svelte
var Pw = /* @__PURE__ */ V("<div class=\"none svelte-kpq2kt\"><!><p class=\"muted small svelte-kpq2kt\">Nothing queued. Connections show their rows here while a run is going.</p></div>"), Fw = /* @__PURE__ */ V("<span class=\"port svelte-kpq2kt\"> </span>"), Iw = /* @__PURE__ */ V("<div class=\"tiny muted\">last batch: <span class=\"mono\"> </span><!></div>"), Lw = /* @__PURE__ */ V("<div class=\"tiny err svelte-kpq2kt\"> </div>"), Rw = /* @__PURE__ */ V("<div class=\"tiny warn svelte-kpq2kt\"> </div>"), zw = /* @__PURE__ */ V("<span class=\"tiny\"><!> </span> <!>", 1), Bw = /* @__PURE__ */ V("<span class=\"tiny muted\">none</span>"), Vw = /* @__PURE__ */ V("<button class=\"btn ghost sm\">Open</button>"), Hw = /* @__PURE__ */ V("<button class=\"btn ghost sm icon danger\" title=\"Empty this queue\"><!></button>"), Uw = /* @__PURE__ */ V("<th class=\"mono svelte-kpq2kt\"> </th>"), Ww = /* @__PURE__ */ V("<td> </td>"), Gw = /* @__PURE__ */ V("<tr></tr>"), Kw = /* @__PURE__ */ V("<div class=\"table-wrap\"><table class=\"table sm svelte-kpq2kt\"><thead><tr></tr></thead><tbody></tbody></table></div> <p class=\"tiny muted\"> </p>", 1), qw = /* @__PURE__ */ V("<p class=\"tiny muted\">No rows have travelled this connection yet.</p>"), Jw = /* @__PURE__ */ V("<tr class=\"peek svelte-kpq2kt\"><td colspan=\"5\" class=\"svelte-kpq2kt\"><!></td></tr>"), Yw = /* @__PURE__ */ V("<tr class=\"clickable\"><td><span class=\"conn svelte-kpq2kt\"><b> </b> <!> <!> <b> </b></span> <!></td><td class=\"right num\"> <div class=\"bar-mini svelte-kpq2kt\"><div class=\"svelte-kpq2kt\"></div></div></td><td class=\"right num\"> <!></td><td><!></td><td><div class=\"row\"><!> <!></div></td></tr> <!>", 1), Xw = /* @__PURE__ */ V("<div class=\"table-wrap\"><table class=\"table\"><thead><tr><th>Connection</th><th class=\"right\">Queued</th><th class=\"right\">Passed</th><th>Retries</th><th style=\"width:1%\"></th></tr></thead><tbody></tbody></table></div>"), Zw = /* @__PURE__ */ V("<div class=\"q svelte-kpq2kt\"><div class=\"bar svelte-kpq2kt\"><span class=\"muted small\"> </span> <span class=\"spacer\"></span> <button class=\"btn sm icon\" title=\"Refresh\"><!></button></div> <!></div>");
function Qw(e, t) {
	k(t, !0);
	let n = Q(t, "live", 3, !1), r = /* @__PURE__ */ M(null), i = /* @__PURE__ */ M(!1), a = /* @__PURE__ */ M(null), o;
	async function s() {
		N(i, !0);
		try {
			N(r, await Bg.queues(t.runId) ?? [], !0);
		} catch (e) {
			Gg.error(e), N(r, z(r) ?? [], !0);
		} finally {
			N(i, !1);
		}
	}
	Fn(() => (t.runId, s(), clearInterval(o), n() && (o = setInterval(s, 2e3)), () => clearInterval(o)));
	async function c(e) {
		if (await _w({
			title: "Empty queue",
			message: `Throw away the ${r_(e.queuedRows)} row${e.queuedRows === 1 ? "" : "s"} waiting before “${e.toName}”? They are not written anywhere, and the run carries on with what comes next.`,
			confirmLabel: "Empty queue",
			danger: !0
		})) try {
			let n = await Bg.emptyQueue(t.runId, e.edgeId);
			Gg.info(`Dropped ${r_(n.droppedRows)} rows`), s();
		} catch (e) {
			Gg.error(e);
		}
	}
	var l = Zw(), u = P(l), d = P(u), f = I(d, !0), p = L(d, 4), m = P(p);
	{
		let e = /* @__PURE__ */ j(() => z(i) ? "spin" : "");
		Xv(m, {
			size: 13,
			get class() {
				return z(e);
			}
		});
	}
	D(p), D(u);
	var h = L(u, 2), g = (e) => {
		tb(e, { rows: 3 });
	}, _ = (e) => {
		var t = Pw();
		Dv(P(t), { size: 22 }), O(), D(t), U(e, t);
	}, v = (e) => {
		var i = Xw(), o = P(i), s = L(P(o));
		K(s, 21, () => z(r), (e) => e.edgeId, (e, r) => {
			var i = Yw(), o = F(i), s = P(o), l = P(s), u = P(l), d = I(u, !0), f = L(u, 2), p = (e) => {
				var t = Fw(), n = I(t, !0);
				R(() => W(n, z(r).fromPort)), U(e, t);
			};
			G(f, (e) => {
				z(r).fromPort && z(r).fromPort !== "success" && e(p);
			});
			var m = L(f, 2);
			L_(m, { size: 12 });
			var h = I(L(m, 2), !0);
			D(l);
			var g = L(l, 2), _ = (e) => {
				var t = Iw(), n = L(P(t)), i = I(n, !0), a = L(n), o = (e) => {
					var t = Qr();
					R(() => W(t, `· ${z(r).rows.length ?? ""} row peek`)), U(e, t);
				};
				G(a, (e) => {
					z(r).rows?.length && e(o);
				}), D(t), R(() => W(i, z(r).table)), U(e, t);
			};
			G(g, (e) => {
				z(r).table && e(_);
			}), D(s);
			var v = L(s), y = P(v), b = L(y), x = P(b);
			let S;
			D(b), D(v);
			var C = L(v), w = P(C, !0), T = L(w), ee = (e) => {
				var t = Lw(), n = I(t);
				R((e) => W(n, `${e ?? ""} dropped`), [() => r_(z(r).rowsDropped)]), U(e, t);
			};
			G(T, (e) => {
				z(r).rowsDropped && e(ee);
			}), D(C);
			var te = L(C), ne = P(te), re = (e) => {
				var t = zw(), n = F(t), i = P(n);
				$v(i, { size: 11 });
				var a = L(i);
				D(n);
				var o = L(n, 2), s = (e) => {
					var t = Rw(), n = I(t);
					R((e) => W(n, `${e ?? ""} retried`), [() => r_(z(r).retried)]), U(e, t);
				};
				G(o, (e) => {
					z(r).retried && e(s);
				}), R(() => W(a, ` up to ${z(r).retries ?? ""}${z(r).onFailure === "dead_letter" ? ", then dead letters" : ""}`)), U(e, t);
			}, ie = (e) => {
				U(e, Bw());
			};
			G(ne, (e) => {
				z(r).retries ? e(re) : e(ie, -1);
			}), D(te);
			var ae = L(te), oe = P(ae), se = P(oe), ce = (e) => {
				var n = Vw();
				B("click", n, () => t.onselectedge(z(r).edgeId)), U(e, n);
			};
			G(se, (e) => {
				t.onselectedge && e(ce);
			});
			var le = L(se, 2), ue = (e) => {
				var t = Hw();
				Cy(P(t), { size: 14 }), D(t), R(() => t.disabled = !z(r).queuedRows), B("click", t, () => c(z(r))), U(e, t);
			};
			G(le, (e) => {
				n_.can.run && n() && e(ue);
			}), D(oe), D(ae), D(o);
			var de = L(o, 2), fe = (e) => {
				var t = Jw(), n = P(t), i = P(n), a = (e) => {
					var t = Kw(), n = F(t), i = P(n), a = P(i), o = P(a);
					K(o, 21, () => z(r).columns, Ti, (e, t) => {
						var n = Uw(), r = I(n, !0);
						R(() => W(r, z(t).name)), U(e, n);
					}), D(o), D(a);
					var s = L(a);
					K(s, 21, () => z(r).rows, Ti, (e, t) => {
						var n = Gw();
						K(n, 21, () => z(t), Ti, (e, t) => {
							let n = /* @__PURE__ */ j(() => u_(z(t)));
							var r = Ww(), i = I(r, !0);
							R(() => {
								J(r, 1, `mono ${z(n).kind ?? ""}`, "svelte-kpq2kt"), W(i, z(n).text);
							}), U(e, r);
						}), D(n), U(e, n);
					}), D(s), D(i), D(n);
					var c = I(L(n, 2));
					R((e) => W(c, `The most recent batch to travel this connection${e ?? ""} — up to 20 rows.`), [() => z(r).seenAt ? ` (${new Date(z(r).seenAt).toLocaleTimeString()})` : ""]), U(e, t);
				}, o = (e) => {
					U(e, qw());
				};
				G(i, (e) => {
					z(r).rows?.length && z(r).columns?.length ? e(a) : e(o, -1);
				}), D(n), D(t), U(e, t);
			};
			G(de, (e) => {
				z(a) === z(r).edgeId && e(fe);
			}), R((e, t, n) => {
				W(d, z(r).fromName), W(h, z(r).toName), W(y, `${e ?? ""} `), S = qi(x, "", S, { width: t }), W(w, n);
			}, [
				() => r_(z(r).queuedRows),
				() => `${Math.min(100, z(r).capacityRows ? z(r).queuedRows / z(r).capacityRows * 100 : 0)}%`,
				() => r_(z(r).rowsPassed)
			]), B("click", o, () => N(a, z(a) === z(r).edgeId ? null : z(r).edgeId, !0)), B("click", ae, (e) => e.stopPropagation()), U(e, i);
		}), D(s), D(o), D(i), U(e, i);
	};
	G(h, (e) => {
		z(r) === null ? e(g) : z(r).length === 0 ? e(_, 1) : e(v, -1);
	}), D(l), R(() => W(f, n() ? "Updating while the run goes" : "A finished run holds nothing")), B("click", p, s), U(e, l), A();
}
Hr(["click"]);
//#endregion
//#region src/lib/canvas/BottomPanel.svelte
var $w = /* @__PURE__ */ V("<div class=\"resize svelte-r9jzc7\" role=\"separator\" aria-orientation=\"horizontal\"></div>"), eT = /* @__PURE__ */ V("<button>Preview</button>"), tT = /* @__PURE__ */ V("<span class=\"livedot svelte-r9jzc7\"></span>"), nT = /* @__PURE__ */ V("<span> </span>"), rT = /* @__PURE__ */ V("<span class=\"badge err svelte-r9jzc7\"> </span>"), iT = /* @__PURE__ */ V("<button>Dead letters <!></button>"), aT = /* @__PURE__ */ V("<span class=\"badge accent svelte-r9jzc7\"> </span>"), oT = /* @__PURE__ */ V("<button>Queues <!></button>"), sT = /* @__PURE__ */ V("<a class=\"btn ghost sm svelte-r9jzc7\" title=\"Open run page\"><!> Run page</a>"), cT = /* @__PURE__ */ V("<div><!></div>"), lT = /* @__PURE__ */ V("<div class=\"empty small svelte-r9jzc7\"><p class=\"svelte-r9jzc7\">No runs yet. Press <strong class=\"svelte-r9jzc7\">Run</strong> in the toolbar to start one.</p></div>"), uT = /* @__PURE__ */ V("<div class=\"empty small svelte-r9jzc7\">Bulletins from the latest run appear here.</div>"), dT = /* @__PURE__ */ V("<div class=\"empty small svelte-r9jzc7\">Rows that failed and were not routed anywhere land here.</div>"), fT = /* @__PURE__ */ V("<div class=\"empty small svelte-r9jzc7\"><p class=\"svelte-r9jzc7\">Press <strong class=\"svelte-r9jzc7\">Validate</strong> to check the flow.</p></div>"), pT = /* @__PURE__ */ V("<div class=\"empty small svelte-r9jzc7\"><!> No issues found.</div>"), mT = /* @__PURE__ */ V("<span class=\"who svelte-r9jzc7\"> </span>"), hT = /* @__PURE__ */ V("<span class=\"who svelte-r9jzc7\">connection</span>"), gT = /* @__PURE__ */ V("<button><!> <!> <span class=\"svelte-r9jzc7\"> </span></button>"), _T = /* @__PURE__ */ V("<div class=\"issues svelte-r9jzc7\"></div>"), vT = /* @__PURE__ */ V("<div><!> <!></div>"), yT = /* @__PURE__ */ V("<section class=\"bp svelte-r9jzc7\"><!> <div class=\"tabs svelte-r9jzc7\"><!> <button>Run <!></button> <button>Bulletins <!></button> <!> <!> <button>Issues <!></button> <button>History</button> <span class=\"spacer svelte-r9jzc7\"></span> <!> <button class=\"btn ghost sm icon svelte-r9jzc7\"><!></button></div> <!></section>");
function bT(e, t) {
	k(t, !0);
	let n = Q(t, "tab", 15, "preview"), r = Q(t, "open", 15, !0), i = Q(t, "height", 15, 300), a = Q(t, "canData", 3, !0);
	function o(e) {
		n() === e && r() ? r(!1) : (n(e), r(!0));
	}
	let s = !1, c = 0, l = 0;
	function u(e) {
		s = !0, c = e.clientY, l = i(), e.currentTarget.setPointerCapture(e.pointerId);
	}
	function d(e) {
		s && i(Math.max(140, Math.min(window.innerHeight - 200, l + (c - e.clientY))));
	}
	function f() {
		s = !1;
		try {
			localStorage.setItem("nifi.bottomHeight", String(i()));
		} catch {}
	}
	let p = /* @__PURE__ */ j(() => t.issues.filter((e) => e.level === "error").length), m = /* @__PURE__ */ j(() => t.live.detail), h = /* @__PURE__ */ j(() => (z(m)?.edges ?? []).reduce((e, t) => e + (t.queuedRows || 0), 0)), g = /* @__PURE__ */ j(() => t.live.bulletins.filter((e) => e.level === "error").length);
	var _ = yT();
	let v;
	var y = P(_), b = (e) => {
		var t = $w();
		B("pointerdown", t, u), B("pointermove", t, d), B("pointerup", t, f), U(e, t);
	};
	G(y, (e) => {
		r() && e(b);
	});
	var x = L(y, 2), S = P(x), C = (e) => {
		var t = eT();
		let i;
		R(() => i = J(t, 1, "tab svelte-r9jzc7", null, i, { active: r() && n() === "preview" })), B("click", t, () => o("preview")), U(e, t);
	};
	G(S, (e) => {
		a() && e(C);
	});
	var w = L(S, 2);
	let T;
	var ee = L(P(w)), te = (e) => {
		U(e, tT());
	};
	G(ee, (e) => {
		t.live.active && e(te);
	}), D(w);
	var ne = L(w, 2);
	let re;
	var ie = L(P(ne)), ae = (e) => {
		var n = nT(), r = I(n, !0);
		R(() => {
			J(n, 1, `badge ${z(g) ? "err" : ""}`, "svelte-r9jzc7"), W(r, t.live.bulletins.length);
		}), U(e, n);
	};
	G(ie, (e) => {
		t.live.bulletins.length && e(ae);
	}), D(ne);
	var oe = L(ne, 2), se = (e) => {
		var t = iT();
		let i;
		var a = L(P(t)), s = (e) => {
			var t = rT(), n = I(t, !0);
			R(() => W(n, z(m).rowsFailed)), U(e, t);
		};
		G(a, (e) => {
			z(m)?.rowsFailed && e(s);
		}), D(t), R(() => i = J(t, 1, "tab svelte-r9jzc7", null, i, { active: r() && n() === "dead" })), B("click", t, () => o("dead")), U(e, t);
	};
	G(oe, (e) => {
		a() && e(se);
	});
	var ce = L(oe, 2), le = (e) => {
		var t = oT();
		let i;
		var a = L(P(t)), s = (e) => {
			var t = aT(), n = I(t, !0);
			R(() => W(n, z(h))), U(e, t);
		};
		G(a, (e) => {
			z(h) && e(s);
		}), D(t), R(() => i = J(t, 1, "tab svelte-r9jzc7", null, i, { active: r() && n() === "queues" })), B("click", t, () => o("queues")), U(e, t);
	};
	G(ce, (e) => {
		z(m) && a() && e(le);
	});
	var ue = L(ce, 2);
	let de;
	var fe = L(P(ue)), pe = (e) => {
		var n = nT(), r = I(n, !0);
		R(() => {
			J(n, 1, `badge ${z(p) ? "err" : "warn"}`, "svelte-r9jzc7"), W(r, t.issues.length);
		}), U(e, n);
	};
	G(fe, (e) => {
		t.issues.length && e(pe);
	}), D(ue);
	var me = L(ue, 2);
	let he;
	var ge = L(me, 4), _e = (e) => {
		var t = sT();
		uv(P(t), { size: 12 }), O(), D(t), R((e) => Y(t, "href", e), [() => qg(`/runs/${z(m).id}`)]), U(e, t);
	};
	G(ge, (e) => {
		z(m) && (n() === "run" || n() === "bulletins" || n() === "dead") && e(_e);
	});
	var ve = L(ge, 2), ye = P(ve), be = (e) => {
		Y_(e, { size: 14 });
	}, xe = (e) => {
		Z_(e, { size: 14 });
	};
	G(ye, (e) => {
		r() ? e(be) : e(xe, -1);
	}), D(ve), D(x);
	var Se = L(x, 2), Ce = (e) => {
		var r = vT();
		let i;
		var o = P(r), s = (e) => {
			var r = cT();
			let i;
			qC(P(r), {
				get nodeId() {
					return t.nodeId;
				},
				get nodeName() {
					return t.nodeName;
				},
				get getGraph() {
					return t.getGraph;
				},
				get trigger() {
					return t.previewTrigger;
				},
				get onselectnode() {
					return t.onselectnode;
				},
				get onresult() {
					return t.onpreviewresult;
				}
			}), D(r), R(() => i = J(r, 1, "pane svelte-r9jzc7", null, i, { hidden: n() !== "preview" })), U(e, r);
		};
		G(o, (e) => {
			a() && e(s);
		});
		var c = L(o, 2), l = (e) => {
			var t = H(), n = F(t), r = (e) => {
				lw(e, { get detail() {
					return z(m);
				} });
			}, i = (e) => {
				U(e, lT());
			};
			G(n, (e) => {
				z(m) ? e(r) : e(i, -1);
			}), U(e, t);
		}, u = (e) => {
			var n = H(), r = F(n), i = (e) => {
				hw(e, {
					get bulletins() {
						return t.live.bulletins;
					},
					nodeName: (e) => t.names.get(e),
					get onnode() {
						return t.onselectnode;
					}
				});
			}, a = (e) => {
				U(e, uT());
			};
			G(r, (e) => {
				z(m) ? e(i) : e(a, -1);
			}), U(e, n);
		}, d = (e) => {
			var n = H(), r = F(n), i = (e) => {
				{
					let n = /* @__PURE__ */ j(() => (z(m).tables ?? []).map((e) => e.table));
					Tw(e, {
						get runId() {
							return z(m).id;
						},
						get tables() {
							return z(n);
						},
						nodeName: (e) => t.names.get(e)
					});
				}
			}, a = (e) => {
				U(e, dT());
			};
			G(r, (e) => {
				z(m) ? e(i) : e(a, -1);
			}), U(e, n);
		}, f = (e) => {
			{
				let n = /* @__PURE__ */ j(() => Yg(z(m).status));
				Qw(e, {
					get runId() {
						return z(m).id;
					},
					get live() {
						return z(n);
					},
					get onselectedge() {
						return t.onselectedge;
					}
				});
			}
		}, p = (e) => {
			var n = H(), r = F(n), i = (e) => {
				U(e, fT());
			}, a = (e) => {
				var t = pT();
				ev(P(t), { size: 20 }), O(), D(t), U(e, t);
			}, o = (e) => {
				var n = _T();
				K(n, 21, () => t.issues, Ti, (e, n) => {
					var r = gT(), i = P(r), a = (e) => {
						tv(e, { size: 13 });
					}, o = (e) => {
						wy(e, { size: 13 });
					};
					G(i, (e) => {
						z(n).level === "error" ? e(a) : e(o, -1);
					});
					var s = L(i, 2), c = (e) => {
						var r = mT(), i = I(r, !0);
						R((e) => W(i, e), [() => t.names.get(z(n).nodeId) ?? z(n).nodeId]), U(e, r);
					}, l = (e) => {
						U(e, hT());
					};
					G(s, (e) => {
						z(n).nodeId ? e(c) : z(n).edgeId && e(l, 1);
					});
					var u = I(L(s, 2), !0);
					D(r), R(() => {
						J(r, 1, `iss ${z(n).level ?? ""}`, "svelte-r9jzc7"), W(u, z(n).message);
					}), B("click", r, () => z(n).nodeId ? t.onselectnode(z(n).nodeId) : z(n).edgeId ? t.onselectedge(z(n).edgeId) : null), U(e, r);
				}), D(n), U(e, n);
			};
			G(r, (e) => {
				t.validated ? t.issues.length === 0 ? e(a, 1) : e(o, -1) : e(i);
			}), U(e, n);
		}, h = (e) => {
			{
				let n = /* @__PURE__ */ j(() => z(m)?.id);
				Nw(e, {
					get flowId() {
						return t.flowId;
					},
					get currentId() {
						return z(n);
					},
					get refreshKey() {
						return t.histKey;
					}
				});
			}
		};
		G(c, (e) => {
			n() === "run" ? e(l) : n() === "bulletins" ? e(u, 1) : n() === "dead" && a() ? e(d, 2) : n() === "queues" && a() && z(m) ? e(f, 3) : n() === "issues" ? e(p, 4) : n() === "history" && e(h, 5);
		}), D(r), R(() => i = J(r, 1, "content svelte-r9jzc7", null, i, { scroll: n() === "run" || n() === "issues" || n() === "history" })), U(e, r);
	};
	G(Se, (e) => {
		r() && e(Ce);
	}), D(_), R(() => {
		v = qi(_, "", v, { height: r() ? `${i()}px` : "auto" }), T = J(w, 1, "tab svelte-r9jzc7", null, T, { active: r() && n() === "run" }), re = J(ne, 1, "tab svelte-r9jzc7", null, re, { active: r() && n() === "bulletins" }), de = J(ue, 1, "tab svelte-r9jzc7", null, de, { active: r() && n() === "issues" }), he = J(me, 1, "tab svelte-r9jzc7", null, he, { active: r() && n() === "history" }), Y(ve, "title", r() ? "Collapse" : "Expand");
	}), B("click", w, () => o("run")), B("click", ne, () => o("bulletins")), B("click", ue, () => o("issues")), B("click", me, () => o("history")), B("click", ve, () => r(!r())), U(e, _), A();
}
Hr([
	"pointerdown",
	"pointermove",
	"pointerup",
	"click"
]);
//#endregion
//#region src/lib/run/RunControls.svelte
var xT = /* @__PURE__ */ V("<button class=\"btn\"><!> Pause</button>"), ST = /* @__PURE__ */ V("<button class=\"btn\"><!> Resume</button>"), CT = /* @__PURE__ */ V("<button class=\"btn danger\"><!> Stop</button>"), wT = /* @__PURE__ */ V("<!> <!>", 1);
function TT(e, t) {
	k(t, !0);
	let n = /* @__PURE__ */ M(!1);
	async function r(e) {
		if (e !== "stop" || await _w({
			title: "Stop run",
			message: "Stop this run? In-flight chunks are abandoned; committed chunks are kept and the run can be resumed later.",
			confirmLabel: "Stop run",
			danger: !0
		})) {
			N(n, !0);
			try {
				let n = e === "pause" ? await Bg.pauseRun(t.run.id) : e === "resume" ? await Bg.resumeRun(t.run.id) : await Bg.stopRun(t.run.id);
				t.onchange(n);
			} catch (e) {
				Gg.error(e);
			} finally {
				N(n, !1);
			}
		}
	}
	var i = wT(), a = F(i), o = (e) => {
		var t = xT();
		Wv(P(t), { size: 14 }), O(), D(t), R(() => t.disabled = z(n)), B("click", t, () => r("pause")), U(e, t);
	}, s = (e) => {
		var t = ST();
		Kv(P(t), { size: 14 }), O(), D(t), R(() => t.disabled = z(n)), B("click", t, () => r("resume")), U(e, t);
	};
	G(a, (e) => {
		t.run.status === "running" ? e(o) : t.run.status === "paused" && e(s, 1);
	});
	var c = L(a, 2), l = (e) => {
		var t = CT();
		gy(P(t), { size: 13 }), O(), D(t), R(() => t.disabled = z(n)), B("click", t, () => r("stop")), U(e, t);
	};
	G(c, (e) => {
		(t.run.status === "running" || t.run.status === "pending" || t.run.status === "paused") && e(l);
	}), U(e, i), A();
}
Hr(["click"]);
//#endregion
//#region src/lib/canvas/CanvasPalettes.svelte
var ET = /* @__PURE__ */ V("<div class=\"sel svelte-16m8i58\"><span class=\"si svelte-16m8i58\"><!></span> <span class=\"st svelte-16m8i58\"><span class=\"sn svelte-16m8i58\"> </span> <span class=\"sy svelte-16m8i58\"> </span></span></div>"), DT = /* @__PURE__ */ V("<div class=\"sel svelte-16m8i58\"><span class=\"si svelte-16m8i58\"><!></span> <span class=\"st svelte-16m8i58\"><span class=\"sn svelte-16m8i58\"> </span> <span class=\"sy svelte-16m8i58\">connection</span></span></div>"), OT = /* @__PURE__ */ V("<p class=\"none svelte-16m8i58\">Select a component on the canvas.</p>"), kT = /* @__PURE__ */ V("<div class=\"palettes svelte-16m8i58\"><section class=\"pal svelte-16m8i58\"><header class=\"svelte-16m8i58\">Navigate</header> <div class=\"map svelte-16m8i58\"><!></div> <div class=\"zoom svelte-16m8i58\"><button type=\"button\" title=\"Zoom in\" class=\"svelte-16m8i58\"><!></button> <button type=\"button\" title=\"Zoom out\" class=\"svelte-16m8i58\"><!></button> <button type=\"button\" title=\"Fit the whole flow\" class=\"svelte-16m8i58\"><!></button> <button type=\"button\" title=\"Actual size\" class=\"svelte-16m8i58\"><!></button></div></section> <section class=\"pal op svelte-16m8i58\"><header class=\"svelte-16m8i58\">Operate</header> <!> <div class=\"acts svelte-16m8i58\"><button type=\"button\" title=\"Configure\" class=\"svelte-16m8i58\"><!></button> <button type=\"button\"><!></button> <button type=\"button\" class=\"danger svelte-16m8i58\" title=\"Delete\"><!></button></div></section></div>");
function AT(e, t) {
	k(t, !0);
	let n = Q(t, "readOnly", 3, !1), { zoomIn: r, zoomOut: i, fitView: a, setViewport: o, getViewport: s } = Ah();
	function c() {
		let e = s();
		o({
			x: e.x,
			y: e.y,
			zoom: 1
		});
	}
	let l = /* @__PURE__ */ j(() => t.node ? Hg.byType.get(t.node.type) : void 0), u = /* @__PURE__ */ j(() => zy(z(l)?.icon, z(l)?.category)), d = /* @__PURE__ */ j(() => t.node ? "processor" : t.edge ? "connection" : "");
	var f = kT(), p = P(f), m = L(P(p), 2);
	kg(P(m), {
		pannable: !0,
		zoomable: !0,
		nodeStrokeWidth: 2,
		width: 168,
		height: 96
	}), D(m);
	var h = L(m, 2), g = P(h);
	Fy(P(g), { size: 13 }), D(g);
	var _ = L(g, 2);
	Iy(P(_), { size: 13 }), D(_);
	var v = L(_, 2);
	Bv(P(v), { size: 13 }), D(v);
	var y = L(v, 2);
	ry(P(y), { size: 13 }), D(y), D(h), D(p);
	var b = L(p, 2), x = L(P(b), 2), S = (e) => {
		var n = ET(), r = P(n);
		Pi(P(r), () => z(u), (e, t) => {
			t(e, {
				size: 13,
				strokeWidth: 1.9
			});
		}), D(r);
		var i = L(r, 2), a = P(i), o = I(a, !0), s = I(L(a, 2), !0);
		D(i), D(n), R(() => {
			Y(a, "title", t.node.name), W(o, t.node.name), W(s, z(l)?.label ?? t.node.type);
		}), U(e, n);
	}, C = (e) => {
		var n = DT(), r = P(n);
		py(P(r), {
			size: 13,
			strokeWidth: 1.9
		}), D(r);
		var i = L(r, 2), a = I(P(i), !0);
		O(2), D(i), D(n), R(() => W(a, t.edge.fromPort)), U(e, n);
	}, w = (e) => {
		U(e, OT());
	};
	G(x, (e) => {
		t.node ? e(S) : t.edge ? e(C, 1) : e(w, -1);
	});
	var T = L(x, 2), ee = P(T);
	dy(P(ee), { size: 13 }), D(ee);
	var te = L(ee, 2);
	let ne;
	Jv(P(te), { size: 13 }), D(te);
	var re = L(te, 2);
	Cy(P(re), { size: 13 }), D(re), D(T), D(b), D(f), R(() => {
		ee.disabled = !z(d), Y(te, "title", t.node?.disabled ? "Enable" : "Disable"), te.disabled = !t.node || n(), ne = J(te, 1, "svelte-16m8i58", null, ne, { off: t.node?.disabled }), re.disabled = !z(d) || n();
	}), B("click", g, () => r()), B("click", _, () => i()), B("click", v, () => a({
		maxZoom: 1.1,
		padding: .15
	})), B("click", y, c), B("click", ee, function(...e) {
		t.onconfigure?.apply(this, e);
	}), B("click", te, function(...e) {
		t.ontoggle?.apply(this, e);
	}), B("click", re, function(...e) {
		t.ondelete?.apply(this, e);
	}), U(e, f), A();
}
Hr(["click"]);
//#endregion
//#region src/lib/flows/DependenciesModal.svelte
var jT = /* @__PURE__ */ V("<button class=\"btn primary\"> </button>"), MT = /* @__PURE__ */ V("<span class=\"muted small\"> </span> <span class=\"spacer\"></span> <button class=\"btn\"> </button> <!>", 1), NT = /* @__PURE__ */ V("<span class=\"badge warn\" title=\"This flow depends on the current one — selecting it would form a cycle\">depends on this</span>"), PT = /* @__PURE__ */ V("<span class=\"tiny muted\"><!> </span>"), FT = /* @__PURE__ */ V("<label><input type=\"checkbox\" class=\"svelte-1s7idy7\"/> <span class=\"nm ellipsis svelte-1s7idy7\"> </span> <!> <!></label>"), IT = /* @__PURE__ */ V("<div class=\"empty small\"> </div>"), LT = /* @__PURE__ */ V("<div class=\"err svelte-1s7idy7\" role=\"alert\"><!> <span> </span></div>"), RT = /* @__PURE__ */ V("<p class=\"intro svelte-1s7idy7\">This flow runs only after the flows selected here have <strong>completed</strong>. “Run” starts unfinished prerequisites first; if one\n    fails or is stopped, this run stops too.</p> <div class=\"search svelte-1s7idy7\"><!> <input class=\"input svelte-1s7idy7\" placeholder=\"Search flows…\"/></div> <div class=\"list scroll svelte-1s7idy7\"><!></div> <!>", 1);
function zT(e, t) {
	k(t, !0);
	let n = Q(t, "readOnly", 3, !1), r = /* @__PURE__ */ M(null), i = /* @__PURE__ */ M(pn(new Set(t.current))), a = /* @__PURE__ */ M(""), o = /* @__PURE__ */ M(!1), s = /* @__PURE__ */ M("");
	Bg.flows().then((e) => N(r, (e ?? []).filter((e) => e.id !== t.flowId).sort((e, t) => e.name.localeCompare(t.name)), !0), (e) => (N(s, e.message, !0), N(r, [], !0)));
	let c = /* @__PURE__ */ j(() => (z(r) ?? []).filter((e) => !z(a) || e.name.toLowerCase().includes(z(a).toLowerCase()))), l = /* @__PURE__ */ j(() => new Set((z(r) ?? []).filter((e) => e.dependsOn?.includes(t.flowId)).map((e) => e.id))), u = /* @__PURE__ */ j(() => z(i).size !== t.current.length || t.current.some((e) => !z(i).has(e)));
	function d(e) {
		if (n()) return;
		let t = new Set(z(i));
		t.has(e) ? t.delete(e) : t.add(e), N(i, t, !0), N(s, "");
	}
	async function f() {
		N(o, !0), N(s, "");
		let e = (z(r) ?? []).filter((e) => z(i).has(e.id)).map((e) => e.id);
		for (let t of z(i)) e.includes(t) || e.push(t);
		try {
			let n = await Bg.updateFlow(t.flowId, { dependsOn: e });
			t.onsaved(n.dependsOn ?? e);
		} catch (e) {
			N(s, e.message, !0);
		} finally {
			N(o, !1);
		}
	}
	Ib(e, {
		title: "Dependencies",
		width: "520px",
		get onclose() {
			return t.onclose;
		},
		footer: (e) => {
			var r = MT(), a = F(r), s = I(a), c = L(a, 4), l = I(c, !0), d = L(c, 2), p = (e) => {
				var t = jT(), n = I(t, !0);
				R(() => {
					t.disabled = z(o) || !z(u), W(n, z(o) ? "Saving…" : "Save");
				}), B("click", t, f), U(e, t);
			};
			G(d, (e) => {
				n() || e(p);
			}), R(() => {
				W(s, `${z(i).size ?? ""} selected`), W(l, n() ? "Close" : "Cancel");
			}), B("click", c, function(...e) {
				t.onclose?.apply(this, e);
			}), U(e, r);
		},
		children: (e, t) => {
			var o = RT(), u = L(F(o), 2), f = P(u);
			ay(f, { size: 13 });
			var p = L(f, 2);
			da(p), D(u);
			var m = L(u, 2), h = P(m), g = (e) => {
				tb(e, { rows: 5 });
			}, _ = (e) => {
				var t = H();
				K(F(t), 17, () => z(c), (e) => e.id, (e, t) => {
					var r = FT();
					let a;
					var o = P(r);
					da(o);
					var s = L(o, 2), c = I(s, !0), u = L(s, 2), f = (e) => {
						U(e, NT());
					}, p = /* @__PURE__ */ j(() => z(l).has(z(t).id));
					G(u, (e) => {
						z(p) && e(f);
					});
					var m = L(u, 2), h = (e) => {
						var n = PT(), r = P(n);
						Mv(r, { size: 10 });
						var i = L(r);
						D(n), R(() => W(i, ` ${z(t).dependsOn.length ?? ""}`)), U(e, n);
					};
					G(m, (e) => {
						z(t).dependsOn?.length && e(h);
					}), D(r), R((e, i) => {
						a = J(r, 1, "item svelte-1s7idy7", null, a, {
							on: e,
							ro: n()
						}), pa(o, i), o.disabled = n(), W(c, z(t).name);
					}, [() => z(i).has(z(t).id), () => z(i).has(z(t).id)]), B("change", o, () => d(z(t).id)), U(e, r);
				}, (e) => {
					var t = IT(), n = I(t, !0);
					R(() => W(n, z(r).length ? "No flows match." : "There are no other flows yet.")), U(e, t);
				}), U(e, t);
			};
			G(h, (e) => {
				z(r) === null ? e(g) : e(_, -1);
			}), D(m);
			var v = L(m, 2), y = (e) => {
				var t = LT(), n = P(t);
				tv(n, { size: 14 });
				var r = I(L(n, 2), !0);
				D(t), R(() => W(r, z(s))), U(e, t);
			};
			G(v, (e) => {
				z(s) && e(y);
			}), ya(p, () => z(a), (e) => N(a, e)), U(e, o);
		},
		$$slots: {
			footer: !0,
			default: !0
		}
	}), A();
}
Hr(["click", "change"]);
//#endregion
//#region src/lib/flows/ScheduleModal.svelte
var BT = /* @__PURE__ */ V("<button class=\"btn danger ghost\">Remove schedule</button>"), VT = /* @__PURE__ */ V("<button class=\"btn primary\"><!> Save</button>"), HT = /* @__PURE__ */ V("<!> <span class=\"spacer\"></span> <button class=\"btn\"> </button> <!>", 1), UT = /* @__PURE__ */ V("<button> </button>"), WT = /* @__PURE__ */ V("<div class=\"presets svelte-zksodz\"></div>"), GT = /* @__PURE__ */ V("<div class=\"next svelte-zksodz\"><!> <span class=\"muted\"> </span></div>"), KT = /* @__PURE__ */ V("<p class=\"tiny muted\"> </p>"), qT = /* @__PURE__ */ V("<div class=\"callout err\"><!> <span> </span></div>"), JT = /* @__PURE__ */ V("<p class=\"intro svelte-zksodz\">While a schedule is on, this flow starts by itself at those times — the same as pressing Run. A flow that is still\n    running when its next time comes round is skipped, so slow runs never pile up. Times are the server's.</p> <div class=\"field\"><label for=\"sch-spec\">When to run</label> <input id=\"sch-spec\" class=\"input mono\" placeholder=\"0 2 * * *\"/> <p class=\"help\">A cron expression — minute, hour, day of month, month, weekday — or <span class=\"mono\">@hourly</span>, <span class=\"mono\">@daily</span>, <span class=\"mono\">@weekly</span>, <span class=\"mono\">@monthly</span>, <span class=\"mono\">@every 30m</span>.</p></div> <!> <label><span class=\"switch\"><input type=\"checkbox\"/><span></span></span> <span><b class=\"svelte-zksodz\">Run on this schedule</b> <span class=\"sub svelte-zksodz\">Off keeps the schedule saved but never starts the flow.</span></span></label> <!> <!> <!>", 1);
function YT(e, t) {
	k(t, !0);
	let n = Q(t, "readOnly", 3, !1), r = /* @__PURE__ */ M(pn(t.flow.schedule ?? "")), i = /* @__PURE__ */ M(!!t.flow.scheduleEnabled), a = /* @__PURE__ */ M(!1), o = /* @__PURE__ */ M(""), s = /* @__PURE__ */ M(pn(t.flow.nextRun ?? "")), c = [
		{
			spec: "@every 30m",
			label: "Every 30 minutes"
		},
		{
			spec: "@hourly",
			label: "Every hour"
		},
		{
			spec: "0 2 * * *",
			label: "Every night at 02:00"
		},
		{
			spec: "0 6 * * mon-fri",
			label: "Weekdays at 06:00"
		},
		{
			spec: "0 3 * * 0",
			label: "Sundays at 03:00"
		},
		{
			spec: "0 4 1 * *",
			label: "First of the month at 04:00"
		}
	], l = /* @__PURE__ */ j(() => z(r).trim() !== (t.flow.schedule ?? "") || z(i) !== !!t.flow.scheduleEnabled);
	async function u() {
		N(a, !0), N(o, "");
		try {
			let e = await Bg.setSchedule(t.flow.id, z(r).trim(), z(r).trim() ? z(i) : !1);
			N(s, e.nextRun ?? "", !0), t.onsaved(e);
		} catch (e) {
			N(o, e.message, !0);
		} finally {
			N(a, !1);
		}
	}
	async function d() {
		N(r, ""), N(i, !1), await u();
	}
	Ib(e, {
		title: "Schedule",
		width: "560px",
		get onclose() {
			return t.onclose;
		},
		footer: (e) => {
			var i = HT(), o = F(i), s = (e) => {
				var t = BT();
				R(() => t.disabled = z(a)), B("click", t, d), U(e, t);
			};
			G(o, (e) => {
				!n() && (t.flow.schedule || z(r)) && e(s);
			});
			var c = L(o, 4), f = I(c, !0), p = L(c, 2), m = (e) => {
				var t = VT();
				J_(P(t), { size: 13 }), O(), D(t), R(() => t.disabled = z(a) || !z(l)), B("click", t, u), U(e, t);
			};
			G(p, (e) => {
				n() || e(m);
			}), R(() => W(f, n() ? "Close" : "Cancel")), B("click", c, function(...e) {
				t.onclose?.apply(this, e);
			}), U(e, i);
		},
		children: (e, a) => {
			var l = JT(), u = L(F(l), 2), d = L(P(u), 2);
			da(d), O(2), D(u);
			var f = L(u, 2), p = (e) => {
				var t = WT();
				K(t, 21, () => c, Ti, (e, t) => {
					var n = UT();
					let i;
					var a = I(n, !0);
					R((e) => {
						i = J(n, 1, "chip svelte-zksodz", null, i, { on: e }), W(a, z(t).label);
					}, [() => z(r).trim() === z(t).spec]), B("click", n, () => (N(r, z(t).spec, !0), N(o, ""))), U(e, n);
				}), D(t), U(e, t);
			};
			G(f, (e) => {
				n() || e(p);
			});
			var m = L(f, 2);
			let h;
			var g = P(m), _ = P(g);
			da(_), O(), D(g), O(2), D(m);
			var v = L(m, 2), y = (e) => {
				var t = GT(), n = P(t);
				nv(n, { size: 13 });
				var r = L(n), i = I(L(r));
				D(t), R((e, t) => {
					W(r, ` Next run ${e ?? ""} `), W(i, `(${t ?? ""})`);
				}, [() => s_(z(s)), () => new Date(z(s)).toLocaleString()]), U(e, t);
			}, b = /* @__PURE__ */ j(() => z(s) && z(i) && z(r).trim());
			G(v, (e) => {
				z(b) && e(y);
			});
			var x = L(v, 2), S = (e) => {
				var n = KT(), r = I(n);
				R((e) => W(r, `Last started by the schedule ${e ?? ""}.`), [() => s_(t.flow.lastFire)]), U(e, n);
			};
			G(x, (e) => {
				t.flow.lastFire && e(S);
			});
			var C = L(x, 2), w = (e) => {
				var t = qT(), n = P(t);
				tv(n, { size: 15 });
				var r = I(L(n, 2), !0);
				D(t), R(() => W(r, z(o))), U(e, t);
			};
			G(C, (e) => {
				z(o) && e(w);
			}), R((e, t) => {
				d.disabled = n(), h = J(m, 1, "on-row svelte-zksodz", null, h, { dim: e }), _.disabled = t;
			}, [() => !z(r).trim(), () => n() || !z(r).trim()]), B("input", d, () => N(o, "")), ya(d, () => z(r), (e) => N(r, e)), ba(_, () => z(i), (e) => N(i, e)), U(e, l);
		},
		$$slots: {
			footer: !0,
			default: !0
		}
	}), A();
}
Hr(["click", "input"]);
//#endregion
//#region src/lib/flows/HistoryModal.svelte
var XT = /* @__PURE__ */ V("<span class=\"count tiny muted svelte-12mng3o\"> </span>"), ZT = /* @__PURE__ */ V("<div class=\"empty\"><!> <h3>No history yet</h3> <p class=\"muted small\">Each save is kept here, so an edit can be compared with the flow as it is now and put back.</p></div>"), QT = /* @__PURE__ */ V("<div class=\"tiny muted ellipsis\"> </div>"), $T = /* @__PURE__ */ V("<button><div class=\"l1 svelte-12mng3o\"><b> </b> <span class=\"muted tiny\"> </span></div> <div class=\"l2 ellipsis svelte-12mng3o\"> </div> <!></button>"), eE = /* @__PURE__ */ V("<button class=\"btn primary sm\"><!> Restore this version</button>"), tE = /* @__PURE__ */ V("<p class=\"note svelte-12mng3o\"> </p>"), nE = /* @__PURE__ */ V("<p class=\"muted small\">This version kept no flow.</p>"), rE = /* @__PURE__ */ V("<p class=\"muted small\">Identical — restoring it would change nothing.</p>"), iE = /* @__PURE__ */ V("<li class=\"add svelte-12mng3o\"><!> <b> </b> <span class=\"muted tiny\"> </span> <span class=\"muted\">would come back</span></li>"), aE = /* @__PURE__ */ V("<li class=\"rem svelte-12mng3o\"><!> <b> </b> <span class=\"muted tiny\"> </span> <span class=\"muted\">would be removed</span></li>"), oE = /* @__PURE__ */ V("<li class=\"chg svelte-12mng3o\"><!> <b> </b> <span class=\"muted\">settings would change back</span></li>"), sE = /* @__PURE__ */ V("<li class=\"chg svelte-12mng3o\"><!> <b> </b> <span class=\"muted\"> </span></li>"), cE = /* @__PURE__ */ V("<ul class=\"diff svelte-12mng3o\"><!> <!> <!> <!></ul>"), lE = /* @__PURE__ */ V("<div class=\"dh svelte-12mng3o\"><h3 class=\"svelte-12mng3o\"> </h3> <span class=\"muted small\"> </span> <span class=\"spacer\"></span> <!></div> <!> <div class=\"facts svelte-12mng3o\"><span><b> </b> nodes</span> <span><b> </b> connections</span> <span class=\"mono\"> </span></div> <h4 class=\"svelte-12mng3o\">Compared with the flow now</h4> <!>", 1), uE = /* @__PURE__ */ V("<div class=\"callout err\"><!> <span> </span></div>"), dE = /* @__PURE__ */ V("<div class=\"split svelte-12mng3o\"><aside class=\"list scroll svelte-12mng3o\"></aside> <section class=\"detail scroll svelte-12mng3o\"><!> <!></section></div>");
function fE(e, t) {
	k(t, !0);
	let n = Q(t, "readOnly", 3, !1), r = /* @__PURE__ */ M(null), i = /* @__PURE__ */ M(null), a = /* @__PURE__ */ M(!1), o = /* @__PURE__ */ M("");
	Bg.versions(t.flowId).then((e) => {
		N(r, e ?? [], !0), z(r).length && s(z(r)[0]);
	}, (e) => (N(o, e.message, !0), N(r, [], !0)));
	async function s(e) {
		N(a, !0);
		try {
			N(i, await Bg.version(t.flowId, e.version), !0);
		} catch (e) {
			N(o, e.message, !0);
		} finally {
			N(a, !1);
		}
	}
	let c = /* @__PURE__ */ j(() => {
		if (!z(i)?.graph) return null;
		let e = new Map(t.current.nodes.map((e) => [e.id, e])), n = new Map(z(i).graph.nodes.map((e) => [e.id, e])), r = [...n.values()].filter((t) => !e.has(t.id)), a = [...e.values()].filter((e) => !n.has(e.id)), o = [...n.values()].filter((t) => {
			let n = e.get(t.id);
			return n && JSON.stringify([
				n.name,
				n.config,
				n.concurrency,
				n.disabled
			]) !== JSON.stringify([
				t.name,
				t.config,
				t.concurrency,
				t.disabled
			]);
		}), s = z(i).graph.edges.length - t.current.edges.length;
		return {
			added: r,
			removed: a,
			changed: o,
			edges: s,
			same: !r.length && !a.length && !o.length && s === 0
		};
	});
	async function l() {
		if (z(i) && await _w({
			title: `Restore version ${z(i).version}`,
			message: `Put this flow back as it was ${s_(z(i).savedAt)}? The version you have now is kept in the history, so this can be undone.`,
			confirmLabel: "Restore"
		})) {
			N(a, !0);
			try {
				let e = await Bg.restoreVersion(t.flowId, z(i).version);
				Gg.success(`Restored version ${z(i).version}`), t.onrestored(e);
			} catch (e) {
				N(o, e.message, !0);
			} finally {
				N(a, !1);
			}
		}
	}
	Ib(e, {
		title: "History",
		width: "min(860px, 96vw)",
		height: "min(620px, 88vh)",
		get onclose() {
			return t.onclose;
		},
		headerExtra: (e) => {
			var t = H(), n = F(t), i = (e) => {
				var t = XT(), n = I(t);
				R(() => W(n, `${z(r).length ?? ""} saved edit${z(r).length === 1 ? "" : "s"}`)), U(e, t);
			};
			G(n, (e) => {
				z(r)?.length && e(i);
			}), U(e, t);
		},
		children: (e, t) => {
			var u = H(), d = F(u), f = (e) => {
				tb(e, { rows: 6 });
			}, p = (e) => {
				var t = ZT();
				Ev(P(t), { size: 28 }), O(4), D(t), U(e, t);
			}, m = (e) => {
				var t = dE(), u = P(t);
				K(u, 21, () => z(r), (e) => e.version, (e, t) => {
					var n = $T();
					let r;
					var a = P(n), o = P(a), c = I(o), l = I(L(o, 2), !0);
					D(a);
					var u = L(a, 2), d = I(u, !0), f = L(u, 2), p = (e) => {
						var n = QT(), r = I(n);
						R(() => W(r, `by ${z(t).actor ?? ""}`)), U(e, n);
					};
					G(f, (e) => {
						z(t).actor && e(p);
					}), D(n), R((e) => {
						r = J(n, 1, "item svelte-12mng3o", null, r, { on: z(i)?.version === z(t).version }), W(c, `v${z(t).version ?? ""}`), W(l, e), W(d, z(t).note || z(t).name);
					}, [() => s_(z(t).savedAt)]), B("click", n, () => s(z(t))), U(e, n);
				}), D(u);
				var d = L(u, 2), f = P(d), p = (e) => {
					tb(e, { rows: 4 });
				}, m = (e) => {
					var t = lE(), r = F(t), o = P(r), s = I(o), u = L(o, 2), d = I(u), f = L(u, 4), p = (e) => {
						var t = eE();
						Qv(P(t), { size: 13 }), O(), D(t), R(() => t.disabled = z(a)), B("click", t, l), U(e, t);
					};
					G(f, (e) => {
						n() || e(p);
					}), D(r);
					var m = L(r, 2), h = (e) => {
						var t = tE(), n = I(t, !0);
						R(() => W(n, z(i).note)), U(e, t);
					};
					G(m, (e) => {
						z(i).note && e(h);
					});
					var g = L(m, 2), _ = P(g), v = I(P(_), !0);
					O(), D(_);
					var y = L(_, 2), b = I(P(y), !0);
					O(), D(y);
					var x = I(L(y, 2), !0);
					D(g);
					var S = L(g, 4), C = (e) => {
						U(e, nE());
					}, w = (e) => {
						U(e, rE());
					}, T = (e) => {
						var t = cE(), n = P(t);
						K(n, 17, () => z(c).added, (e) => e.id, (e, t) => {
							var n = iE(), r = P(n);
							qv(r, { size: 12 });
							var i = L(r, 2), a = I(i, !0), o = I(L(i, 2), !0);
							O(2), D(n), R(() => {
								W(a, z(t).name), W(o, z(t).type);
							}), U(e, n);
						});
						var r = L(n, 2);
						K(r, 17, () => z(c).removed, (e) => e.id, (e, t) => {
							var n = aE(), r = P(n);
							Hv(r, { size: 12 });
							var i = L(r, 2), a = I(i, !0), o = I(L(i, 2), !0);
							O(2), D(n), R(() => {
								W(a, z(t).name), W(o, z(t).type);
							}), U(e, n);
						});
						var i = L(r, 2);
						K(i, 17, () => z(c).changed, (e) => e.id, (e, t) => {
							var n = oE(), r = P(n);
							Gv(r, { size: 12 });
							var i = I(L(r, 2), !0);
							O(2), D(n), R(() => W(i, z(t).name)), U(e, n);
						});
						var a = L(i, 2), o = (e) => {
							var t = sE(), n = P(t);
							Gv(n, { size: 12 });
							var r = L(n, 2), i = I(r, !0), a = I(L(r, 2));
							D(t), R((e, t) => {
								W(i, e), W(a, `connection${t ?? ""} would be ${z(c).edges > 0 ? "added" : "removed"}`);
							}, [() => Math.abs(z(c).edges), () => Math.abs(z(c).edges) === 1 ? "" : "s"]), U(e, t);
						};
						G(a, (e) => {
							z(c).edges !== 0 && e(o);
						}), D(t), U(e, t);
					};
					G(S, (e) => {
						z(c) ? z(c).same ? e(w, 1) : e(T, -1) : e(C);
					}), R((e) => {
						W(s, `Version ${z(i).version ?? ""}`), W(d, `saved ${e ?? ""}${z(i).actor ? ` by ${z(i).actor}` : ""}`), W(v, z(i).graph?.nodes.length ?? 0), W(b, z(i).graph?.edges.length ?? 0), W(x, z(i).name);
					}, [() => s_(z(i).savedAt)]), U(e, t);
				};
				G(f, (e) => {
					z(a) && !z(i) ? e(p) : z(i) && e(m, 1);
				});
				var h = L(f, 2), g = (e) => {
					var t = uE(), n = P(t);
					tv(n, { size: 15 });
					var r = I(L(n, 2), !0);
					D(t), R(() => W(r, z(o))), U(e, t);
				};
				G(h, (e) => {
					z(o) && e(g);
				}), D(d), D(t), U(e, t);
			};
			G(d, (e) => {
				z(r) === null ? e(f) : z(r).length === 0 ? e(p, 1) : e(m, -1);
			}), U(e, u);
		},
		$$slots: {
			headerExtra: !0,
			default: !0
		}
	}), A();
}
Hr(["click"]);
//#endregion
//#region src/lib/canvas/fields/TargetColumnPicker.svelte
var pE = /* @__PURE__ */ V("<button class=\"opt new svelte-808033\">Use new name: <span class=\"mono\"> </span></button>"), mE = /* @__PURE__ */ V("<span class=\"uf svelte-808033\">not provided yet</span>"), hE = /* @__PURE__ */ V("<span class=\"tiny muted mono\"> </span>"), gE = /* @__PURE__ */ V("<button><span class=\"mono\"> </span> <!> <span class=\"spacer\"></span> <!></button>"), _E = /* @__PURE__ */ V("<div class=\"dd scroll svelte-808033\"><!> <button class=\"opt skipopt svelte-808033\">— skip — <span class=\"muted tiny\">don't write this column</span></button> <!></div>"), vE = /* @__PURE__ */ V("<div><input class=\"input mono svelte-808033\" placeholder=\"— skip —\" spellcheck=\"false\" autocomplete=\"off\"/> <!></div>");
function yE(e, t) {
	k(t, !0);
	let n = Q(t, "options", 19, () => []), r = Q(t, "readOnly", 3, !1), i = /* @__PURE__ */ M(""), a = /* @__PURE__ */ M(!1);
	Fn(() => {
		N(i, t.value, !0);
	});
	let o = /* @__PURE__ */ j(() => z(a) && z(i) !== t.value ? z(i).trim().toLowerCase() : ""), s = /* @__PURE__ */ j(() => n().filter((e) => !z(o) || e.name.toLowerCase().includes(z(o)))), c = /* @__PURE__ */ j(() => !!z(i).trim() && z(i).trim() !== t.value && !n().some((e) => e.name === z(i).trim()));
	function l(e) {
		N(a, !1), N(i, e, !0), e !== t.value && t.onpick(e);
	}
	var u = vE();
	let d;
	var f = P(u);
	da(f);
	var p = L(f, 2), m = (e) => {
		var n = _E(), r = P(n), a = (e) => {
			var t = pE(), n = I(L(P(t)), !0);
			D(t), R((e) => W(n, e), [() => z(i).trim()]), B("mousedown", t, (e) => (e.preventDefault(), l(z(i).trim()))), U(e, t);
		};
		G(r, (e) => {
			z(c) && e(a);
		});
		var o = L(r, 2);
		K(L(o, 2), 17, () => z(s), (e) => e.name, (e, n) => {
			var r = gE();
			let i;
			var a = P(r), o = I(a, !0), s = L(a, 2), c = (e) => {
				U(e, mE());
			};
			G(s, (e) => {
				z(n).unfilled && e(c);
			});
			var u = L(s, 4), d = (e) => {
				var t = hE(), r = I(t, !0);
				R(() => W(r, z(n).type)), U(e, t);
			};
			G(u, (e) => {
				z(n).type && e(d);
			}), D(r), R(() => {
				i = J(r, 1, "opt svelte-808033", null, i, { cur: z(n).name === t.value }), W(o, z(n).name);
			}), B("mousedown", r, (e) => (e.preventDefault(), l(z(n).name))), U(e, r);
		}), D(n), B("mousedown", o, (e) => (e.preventDefault(), l(""))), U(e, n);
	};
	G(p, (e) => {
		z(a) && !r() && e(m);
	}), D(u), R(() => {
		d = J(u, 1, "tcp svelte-808033", null, d, { skip: t.value === "" }), f.disabled = r();
	}), Vr("focus", f, () => N(a, !0)), B("input", f, () => N(a, !0)), Vr("blur", f, () => setTimeout(() => {
		z(a) && (N(a, !1), z(i).trim() !== t.value && l(z(i).trim()));
	}, 150)), B("keydown", f, (e) => {
		e.key === "Enter" ? (e.preventDefault(), l(z(i).trim())) : e.key === "Escape" && z(a) && (e.stopPropagation(), N(a, !1), N(i, t.value, !0));
	}), ya(f, () => z(i), (e) => N(i, e)), U(e, u), A();
}
Hr([
	"input",
	"keydown",
	"mousedown"
]);
//#endregion
//#region src/lib/canvas/SinkPlanModal.svelte
var bE = /* @__PURE__ */ V("<span class=\"badge err\"> </span>"), xE = /* @__PURE__ */ V("<span class=\"badge warn\"> </span>"), SE = /* @__PURE__ */ V("<span class=\"badge ok\"> </span> <span class=\"badge info\"> </span> <!> <!>", 1), CE = /* @__PURE__ */ V("<!> <!>", 1), wE = /* @__PURE__ */ V("<span class=\"small errtxt svelte-k4qtat\"> </span>"), TE = /* @__PURE__ */ V("<button class=\"btn primary\">Apply</button>"), EE = /* @__PURE__ */ V("<!> <span class=\"muted small\"> </span> <span class=\"spacer\"></span> <button class=\"btn\"> </button> <!>", 1), DE = /* @__PURE__ */ V("<div class=\"callout err svelte-k4qtat\"><!> <span> </span></div>"), OE = /* @__PURE__ */ V("<div class=\"empty\"><h3>No tables reach this node yet</h3> <p>Connect a source upstream (and pick its tables) to plan the target tables.</p></div>"), kE = /* @__PURE__ */ V("<span class=\"tag error svelte-k4qtat\">ERROR</span>"), AE = /* @__PURE__ */ V("<span class=\"tag new svelte-k4qtat\">NEW</span>"), jE = /* @__PURE__ */ V("<span class=\"tag exists svelte-k4qtat\">EXISTS</span>"), ME = /* @__PURE__ */ V("<span class=\"tag shared svelte-k4qtat\"> </span>"), NE = /* @__PURE__ */ V("<span class=\"tag shared svelte-k4qtat\">SHARED</span>"), PE = /* @__PURE__ */ V("<span class=\"wc svelte-k4qtat\"><!> </span>"), FE = /* @__PURE__ */ V("<span class=\"mapped svelte-k4qtat\" title=\"Explicit mapping\">mapped</span>"), IE = /* @__PURE__ */ V("<button><div class=\"il svelte-k4qtat\"><span class=\"src mono ellipsis svelte-k4qtat\"> </span> <span class=\"dst mono ellipsis svelte-k4qtat\"><!> </span></div> <div class=\"ib svelte-k4qtat\"><!> <!> <!> <!> <!></div></button>"), LE = /* @__PURE__ */ V("<div class=\"empty small\">No tables match.</div>"), RE = /* @__PURE__ */ V("<button class=\"opt create svelte-k4qtat\"><!> Create new table: <span class=\"mono\"> </span></button>"), zE = /* @__PURE__ */ V("<button class=\"opt svelte-k4qtat\"><span class=\"mono\"> </span> <!> <span class=\"spacer\"></span> <span class=\"tiny muted\"> </span></button>"), BE = /* @__PURE__ */ V("<div class=\"none tiny muted svelte-k4qtat\">No tables in the target database yet.</div>"), VE = /* @__PURE__ */ V("<div class=\"dd scroll svelte-k4qtat\"><!> <!></div>"), HE = /* @__PURE__ */ V("<button class=\"btn sm reset svelte-k4qtat\"><!> Default</button>"), UE = /* @__PURE__ */ V("<li> </li>"), WE = /* @__PURE__ */ V("<div class=\"callout warn svelte-k4qtat\"><!> <ul class=\"svelte-k4qtat\"></ul></div>"), GE = /* @__PURE__ */ V("<div class=\"pkwarn svelte-k4qtat\">A primary-key column is ignored: merge can't match existing rows, so re-runs insert duplicates.</div>"), KE = /* @__PURE__ */ V("<div class=\"introsum svelte-k4qtat\"><!> </div>"), qE = /* @__PURE__ */ V("<span class=\"intro svelte-k4qtat\"> </span>"), JE = /* @__PURE__ */ V("<span class=\"mapped svelte-k4qtat\" title=\"Explicit column mapping\">mapped</span>"), YE = /* @__PURE__ */ V("<button class=\"btn sm sugg svelte-k4qtat\" title=\"An existing target column looks like the same field\">Map to <span class=\"mono\"> </span></button>"), XE = /* @__PURE__ */ V("<option> </option>"), ZE = /* @__PURE__ */ V("<span class=\"tiny muted mono svelte-k4qtat\"> </span>"), QE = /* @__PURE__ */ V("<span class=\"nn svelte-k4qtat\">NOT NULL</span>"), $E = /* @__PURE__ */ V("<tr><td class=\"inc svelte-k4qtat\"><input type=\"checkbox\"/></td><td class=\"mono svelte-k4qtat\"><!> <span> </span> <!></td><td class=\"arrow svelte-k4qtat\"><!></td><td class=\"svelte-k4qtat\"><div class=\"tcell svelte-k4qtat\"><!> <!> <!></div></td><td class=\"ty svelte-k4qtat\"><select class=\"select sm mono svelte-k4qtat\" title=\"Convert incoming values before writing\"><option> </option><!></select> <!></td><td class=\"ty svelte-k4qtat\"><input class=\"input sm mono svelte-k4qtat\" list=\"pg-types\"/> <!> <!></td><td class=\"svelte-k4qtat\"><span> </span></td></tr>"), eD = /* @__PURE__ */ V("<span class=\"block svelte-k4qtat\"><!> NOT NULL without default — inserts will fail</span>"), tD = /* @__PURE__ */ V("<span class=\"note svelte-k4qtat\"> </span>"), nD = /* @__PURE__ */ V("<tr class=\"target_only svelte-k4qtat\"><td class=\"svelte-k4qtat\"></td><td class=\"muted svelte-k4qtat\">—</td><td class=\"arrow svelte-k4qtat\"><!></td><td class=\"mono svelte-k4qtat\"><!> </td><td class=\"mono dim svelte-k4qtat\">—</td><td class=\"mono dim svelte-k4qtat\"> <!></td><td class=\"svelte-k4qtat\"><span class=\"chip target_only svelte-k4qtat\">not provided</span> <!></td></tr>"), rD = /* @__PURE__ */ V("<tr class=\"sep svelte-k4qtat\"><td colspan=\"7\" class=\"svelte-k4qtat\">Target columns not provided by the flow</td></tr> <!>", 1), iD = /* @__PURE__ */ V("<div class=\"colhead svelte-k4qtat\"><h4 class=\"svelte-k4qtat\">Column mapping</h4> <span class=\"sum svelte-k4qtat\"> </span> <span class=\"spacer\"></span> <span class=\"tiny muted\">New columns are detected by running 3 sample rows through the flow</span> <button class=\"btn sm\" title=\"Re-run the sample and re-plan\"><!> Refresh</button></div> <!> <!> <table class=\"cols main svelte-k4qtat\"><colgroup><col style=\"width:34px\"/><col style=\"width:22%\"/><col style=\"width:26px\"/><col style=\"width:24%\"/><col style=\"width:16%\"/><col style=\"width:17%\"/><col style=\"width:108px\"/></colgroup><thead><tr><th class=\"inc svelte-k4qtat\"><input type=\"checkbox\" title=\"Include or ignore all columns (primary keys stay included)\"/></th><th class=\"svelte-k4qtat\">Incoming column</th><th class=\"svelte-k4qtat\"></th><th class=\"svelte-k4qtat\">Target column</th><th class=\"svelte-k4qtat\">Incoming type</th><th class=\"svelte-k4qtat\">Target type</th><th class=\"svelte-k4qtat\">Status</th></tr></thead><tbody><!><!></tbody></table>", 1), aD = /* @__PURE__ */ V("<button class=\"btn sm\"><!> Add expression</button>"), oD = /* @__PURE__ */ V("<span> </span>"), sD = /* @__PURE__ */ V("<span class=\"tiny muted\">—</span>"), cD = /* @__PURE__ */ V("<button class=\"btn ghost sm icon\" aria-label=\"Remove\"><!></button>"), lD = /* @__PURE__ */ V("<tr class=\"svelte-k4qtat\"><td class=\"svelte-k4qtat\"><input class=\"input sm mono\" placeholder=\"full_name\"/></td><td class=\"ex svelte-k4qtat\"><!></td><td class=\"svelte-k4qtat\"><input class=\"input sm mono\" list=\"pg-types\"/></td><td class=\"svelte-k4qtat\"><select class=\"select sm\"><option> </option><option>every table</option></select></td><td class=\"svelte-k4qtat\"><!></td><td class=\"svelte-k4qtat\"><!></td></tr>"), uD = /* @__PURE__ */ V("<table class=\"cols exprs svelte-k4qtat\"><colgroup><col style=\"width:20%\"/><col/><col style=\"width:17%\"/><col style=\"width:15%\"/><col style=\"width:96px\"/><col style=\"width:44px\"/></colgroup><thead><tr><th class=\"svelte-k4qtat\">Target column</th><th class=\"svelte-k4qtat\">Expression</th><th class=\"svelte-k4qtat\">Target type</th><th class=\"svelte-k4qtat\">Applies to</th><th class=\"svelte-k4qtat\">Status</th><th class=\"svelte-k4qtat\"></th></tr></thead><tbody></tbody></table>"), dD = /* @__PURE__ */ V("<p class=\"tiny muted exhint svelte-k4qtat\">None. Add an expression such as <span class=\"mono\">concat(first_name, \" \", last_name)</span> to write an extra column.</p>"), fD = /* @__PURE__ */ V("<div class=\"sqlh svelte-k4qtat\"><h4>Run before loading</h4></div> <pre class=\"ddl svelte-k4qtat\"> </pre>", 1), pD = /* @__PURE__ */ V("<pre class=\"ddl svelte-k4qtat\"> </pre>"), mD = /* @__PURE__ */ V("<div class=\"sqlh svelte-k4qtat\"><button class=\"link svelte-k4qtat\"><!> SQL</button> <span class=\"spacer\"></span> <button class=\"btn sm\"><!> Copy</button></div> <!>", 1), hD = /* @__PURE__ */ V("<div><h4 class=\"svelte-k4qtat\">Indexes built after load</h4><ul class=\"mono svelte-k4qtat\"></ul></div>"), gD = /* @__PURE__ */ V("<div><h4 class=\"svelte-k4qtat\">Foreign keys added after load</h4><ul class=\"mono svelte-k4qtat\"></ul></div>"), _D = /* @__PURE__ */ V("<div class=\"after svelte-k4qtat\"><!> <!></div>"), vD = /* @__PURE__ */ V("<div class=\"dh svelte-k4qtat\"><h3 class=\"svelte-k4qtat\"><span class=\"mono\"> </span> <!> <span class=\"mono\"> </span></h3> <!></div> <div class=\"facts svelte-k4qtat\"><span>mode <b class=\"svelte-k4qtat\"> </b></span> <span>before load <b class=\"svelte-k4qtat\"> </b></span> <span>conflict key <b class=\"mono svelte-k4qtat\"> </b></span></div> <div class=\"picker svelte-k4qtat\"><div class=\"field sch svelte-k4qtat\"><label for=\"sp-schema\">Schema</label> <input id=\"sp-schema\" class=\"input mono\"/></div> <div class=\"field tbl svelte-k4qtat\"><label for=\"sp-table\">Target table</label> <div class=\"combo svelte-k4qtat\"><input id=\"sp-table\" class=\"input mono\" autocomplete=\"off\"/> <!></div></div> <!></div> <!> <!> <!> <div class=\"colhead svelte-k4qtat\"><h4 class=\"svelte-k4qtat\">Computed columns</h4> <span class=\"sum svelte-k4qtat\">extra target columns calculated from the incoming row</span> <span class=\"spacer\"></span> <!></div> <!> <!> <!>", 1), yD = /* @__PURE__ */ V("<div class=\"split svelte-k4qtat\"><aside class=\"list svelte-k4qtat\"><div class=\"search svelte-k4qtat\"><!><input class=\"input svelte-k4qtat\"/></div> <div class=\"items scroll svelte-k4qtat\"></div></aside> <section class=\"detail scroll svelte-k4qtat\"><!></section></div>"), bD = /* @__PURE__ */ V("<option></option>"), xD = /* @__PURE__ */ V("<!> <datalist id=\"pg-types\"></datalist>", 1);
function SD(e, t) {
	k(t, !0);
	let n = Q(t, "readOnly", 3, !1), r = t.node.config ?? {}, i = t.node.id, a = r.schema || "public", o = r.name_case || "preserve", s = r.connection || "", c = /* @__PURE__ */ M(pn(Array.isArray(r.table_map) ? r.table_map.map((e) => ({
		key: e.key,
		value: e.value
	})) : [])), l = /* @__PURE__ */ M(pn(Array.isArray(r.column_map) ? r.column_map.map((e) => ({ ...e })) : [])), u = /* @__PURE__ */ M(pn(Array.isArray(r.expressions) ? r.expressions.map((e) => ({
		table: e.table ?? "",
		column: e.column ?? "",
		expr: e.expr ?? "",
		type: e.type ?? ""
	})) : []));
	Hg.loadTypes();
	let d = [
		"text",
		"varchar(255)",
		"integer",
		"bigint",
		"smallint",
		"numeric(12,2)",
		"double precision",
		"boolean",
		"date",
		"timestamp",
		"timestamptz",
		"jsonb",
		"uuid",
		"bytea",
		"text[]"
	], f = /* @__PURE__ */ M(null), p = /* @__PURE__ */ M(""), m = /* @__PURE__ */ M(!1), h = /* @__PURE__ */ M(""), g = /* @__PURE__ */ M(null), _ = /* @__PURE__ */ M(!0);
	function v(e) {
		let t = "", n = [...e];
		return n.forEach((e, r) => {
			if (e !== e.toLowerCase() && e === e.toUpperCase()) {
				let i = n[r - 1], a = n[r + 1], o = (e) => !!e && e === e.toLowerCase() && e !== e.toUpperCase();
				r > 0 && (o(i) || ((e) => !!e && /[0-9]/.test(e))(i) || o(a) && ((e) => !!e && e === e.toUpperCase() && e !== e.toLowerCase())(i)) && (t += "_"), t += e.toLowerCase();
			} else t += e === " " || e === "-" || e === "." ? "_" : e;
		}), t.replaceAll("__", "_").replace(/^_+|_+$/g, "");
	}
	let y = (e) => o === "lower" ? e.toLowerCase() : o === "snake" ? v(e) : e, b = (e) => e.includes(".") ? e.slice(e.lastIndexOf(".") + 1) : e, x = (e) => `${a}.${y(b(e))}`, S = (e) => e.includes(".") ? e : `${a}.${e}`, C = null, w;
	function T() {
		let e = t.getGraph();
		return {
			...e,
			nodes: e.nodes.map((e) => e.id === i ? {
				...e,
				config: {
					...e.config,
					table_map: Ze(z(c)),
					column_map: Ze(z(l)),
					expressions: pe()
				}
			} : e)
		};
	}
	async function ee() {
		C?.abort(), C = new AbortController(), N(m, !0);
		try {
			let e = await Bg.sinkPlan(T(), i, C.signal);
			N(f, e, !0), N(p, ""), (!z(g) || !e.tables.some((e) => e.source === z(g))) && N(g, e.tables[0]?.source ?? null, !0);
		} catch (e) {
			if (e.name === "AbortError") return;
			N(p, e.message, !0);
		} finally {
			N(m, !1);
		}
	}
	ee();
	function te() {
		clearTimeout(w), w = setTimeout(ee, 350);
	}
	bi(() => {
		clearTimeout(w), C?.abort();
	});
	let ne = /* @__PURE__ */ M(pn([]));
	s && Bg.tables(s).then((e) => N(ne, (e ?? []).sort((e, t) => `${e.schema}.${e.name}`.localeCompare(`${t.schema}.${t.name}`)), !0)).catch(() => {});
	let re = /* @__PURE__ */ j(() => z(f)?.tables ?? []), ie = /* @__PURE__ */ j(() => z(re).filter((e) => !z(h) || `${e.source} ${e.schema}.${e.table}`.toLowerCase().includes(z(h).toLowerCase()))), ae = /* @__PURE__ */ j(() => z(re).find((e) => e.source === z(g)) ?? null), oe = /* @__PURE__ */ j(() => ({
		create: z(re).filter((e) => e.action === "create").length,
		load: z(re).filter((e) => e.action === "load").length,
		error: z(re).filter((e) => e.action === "error").length
	}));
	function se(e, t) {
		if (n()) return;
		let r = t.trim(), i = z(c).filter((t) => t.key.toLowerCase() !== e.toLowerCase());
		N(c, !r || S(r) === x(e) ? i : [...i, {
			key: e,
			value: S(r)
		}], !0), te();
	}
	let ce = (e, t) => e.toLowerCase() === t.toLowerCase(), le = (e) => y(e), ue = (e, t) => z(l).find((n) => ce(n.table, e) && n.from === t);
	function de(e, t, r) {
		if (n()) return;
		let i = {
			...ue(e, t) ?? {
				table: e,
				from: t
			},
			...r
		};
		i.to === le(t) && delete i.to, i.cast || delete i.cast, i.type?.trim() || delete i.type, (i.cast || i.type) && i.to === void 0 && (i.to = le(t)), i.to === le(t) && !i.cast && !i.type && delete i.to;
		let a = z(l).filter((n) => !(ce(n.table, e) && n.from === t));
		N(l, i.to === void 0 && !i.cast && !i.type ? a : [...a, i], !0), te();
	}
	function fe(e, t, n) {
		de(e, t, { to: n });
	}
	function pe() {
		return Ze(z(u)).filter((e) => e.column.trim() && e.expr.trim());
	}
	let me = (e) => z(u).map((e, t) => ({
		e,
		i: t
	})).filter(({ e: t }) => !t.table || ce(t.table, e.source));
	function he(e) {
		N(u, [...z(u), {
			table: e.source,
			column: "",
			expr: "",
			type: ""
		}], !0);
	}
	function ge(e, t) {
		z(u)[e] = {
			...z(u)[e],
			...t
		}, te();
	}
	function _e(e) {
		N(u, z(u).filter((t, n) => n !== e), !0), te();
	}
	let ve = (e, t) => e.columns.find((e) => e.expr && e.name === t);
	function ye(e, t, r) {
		!n() && t.source && (r ? N(l, z(l).filter((n) => !(ce(n.table, e) && n.from === t.source)), !0) : N(l, [...z(l).filter((n) => !(ce(n.table, e) && n.from === t.source)), {
			table: e,
			from: t.source,
			to: ""
		}], !0), te());
	}
	function be(e, t) {
		if (n()) return;
		let r = Ce(e), i = z(l).filter((t) => !(ce(t.table, e.source) && r.some((e) => e.source === t.from && t.to === "")));
		t || (i = i.filter((t) => !(ce(t.table, e.source) && r.some((e) => e.source === t.from))), i = [...i, ...r.filter((e) => !e.primaryKey).map((t) => ({
			table: e.source,
			from: t.source,
			to: ""
		}))]), N(l, i, !0), te();
	}
	let xe = (e) => e.status === "skipped";
	function Se(e) {
		return e.exists ? e.columns.filter((e) => e.targetType && e.status !== "create").map((e) => ({
			name: e.name,
			type: e.targetType,
			unfilled: e.status === "target_only"
		})).sort((e, t) => Number(!!t.unfilled) - Number(!!e.unfilled) || e.name.localeCompare(t.name)) : [];
	}
	let Ce = (e) => e.columns.filter((e) => e.source && !e.expr && e.status !== "target_only").sort((e, t) => Number(!!e.introducedBy) - Number(!!t.introducedBy)), we = (e) => e.columns.filter((e) => e.status === "target_only"), Te = (e) => e.columns.filter((e) => e.introducedBy && e.source && !e.expr), Ee = (e) => e.status === "skipped" ? "" : e.name, E = /* @__PURE__ */ M(""), De = /* @__PURE__ */ M(""), Oe = /* @__PURE__ */ M(!1);
	Fn(() => {
		z(ae) && (N(E, z(ae).schema, !0), N(De, z(ae).table, !0));
	});
	let ke = /* @__PURE__ */ j(() => z(ne).filter((e) => {
		let t = z(De).trim().toLowerCase();
		return !t || e.name.toLowerCase().includes(t) || `${e.schema}.${e.name}`.toLowerCase().includes(t);
	}).slice(0, 50)), Ae = /* @__PURE__ */ j(() => z(ne).some((e) => e.schema === z(E).trim() && e.name === z(De).trim()));
	function je(e, t) {
		N(Oe, !1), z(ae) && (N(E, e, !0), N(De, t, !0), se(z(ae).source, `${e}.${t}`));
	}
	let Me = {
		create: "+ create",
		match: "✓ match",
		add: "+ will be added",
		type_differs: "converted",
		retype: "type changed",
		dropped: "not written",
		skipped: "ignored",
		target_only: "target only"
	};
	function Ne(e) {
		let t = (t) => e.filter((e) => e.status === t).length, n = [];
		return t("create") && n.push(`${t("create")} to create`), t("match") && n.push(`${t("match")} match`), t("add") && n.push(`${t("add")} will be added`), t("retype") && n.push(`${t("retype")} retyped`), t("type_differs") && n.push(`${t("type_differs")} type differ${t("type_differs") === 1 ? "s" : ""}`), t("dropped") && n.push(`${t("dropped")} not written`), t("skipped") && n.push(`${t("skipped")} ignored`), t("target_only") && n.push(`${t("target_only")} target-only`), n.join(" · ");
	}
	let Pe = (e) => e.status === "target_only" && !e.nullable && (!e.note || /without (a )?default|no default/i.test(e.note));
	async function Fe(e) {
		try {
			await navigator.clipboard.writeText(e), Gg.success("SQL copied");
		} catch {
			Gg.error("Clipboard unavailable");
		}
	}
	let Ie = (e, t, n) => JSON.stringify([
		e.map((e) => [e.key, e.value]),
		t.map((e) => [
			e.table,
			e.from,
			e.to ?? null,
			e.cast ?? "",
			e.type ?? ""
		]),
		n.map((e) => [
			e.table ?? "",
			e.column,
			e.expr,
			e.type ?? ""
		])
	]), Le = Ie(Array.isArray(r.table_map) ? r.table_map : [], Array.isArray(r.column_map) ? r.column_map : [], Array.isArray(r.expressions) ? r.expressions : []), Re = /* @__PURE__ */ j(() => Ie(z(c), z(l), z(u)) !== Le);
	Ib(e, {
		get title() {
			return `Target tables · ${t.node.name ?? ""}`;
		},
		width: "min(1240px, 96vw)",
		height: "min(820px, 94vh)",
		get onclose() {
			return t.onclose;
		},
		headerExtra: (e) => {
			var t = CE(), n = F(t), r = (e) => {
				var t = SE(), n = F(t), r = I(n), i = L(n, 2), a = I(i), o = L(i, 2), s = (e) => {
					var t = bE(), n = I(t);
					R(() => W(n, `${z(oe).error ?? ""} error`)), U(e, t);
				};
				G(o, (e) => {
					z(oe).error && e(s);
				});
				var c = L(o, 2), l = (e) => {
					var t = xE(), n = I(t);
					R(() => W(n, `showing ${z(re).length ?? ""} of ${z(f).totalTables ?? ""}`)), U(e, t);
				};
				G(c, (e) => {
					z(f).truncated && e(l);
				}), R(() => {
					W(r, `${z(oe).create ?? ""} new`), W(a, `${z(oe).load ?? ""} existing`);
				}), U(e, t);
			};
			G(n, (e) => {
				z(f) && e(r);
			});
			var i = L(n, 2), a = (e) => {
				Lv(e, {
					size: 14,
					class: "spin"
				});
			};
			G(i, (e) => {
				z(m) && e(a);
			}), U(e, t);
		},
		footer: (e) => {
			var r = EE(), i = F(r), a = (e) => {
				var t = wE(), n = I(t, !0);
				R(() => W(n, z(p))), U(e, t);
			};
			G(i, (e) => {
				z(p) && z(f) && e(a);
			});
			var o = L(i, 2), s = I(o, !0), d = L(o, 4), m = I(d, !0), h = L(d, 2), g = (e) => {
				var n = TE();
				R(() => n.disabled = !z(Re)), B("click", n, () => t.onapply({
					table_map: Ze(z(c)),
					column_map: Ze(z(l)),
					expressions: pe()
				})), U(e, n);
			};
			G(h, (e) => {
				n() || e(g);
			}), R(() => {
				W(s, n() ? "Read-only" : `${z(c).length} table mapping${z(c).length === 1 ? "" : "s"} · ${z(l).length} column setting${z(l).length === 1 ? "" : "s"} · ${z(u).length} computed`), W(m, n() ? "Close" : "Cancel");
			}), B("click", d, function(...e) {
				t.onclose?.apply(this, e);
			}), U(e, r);
		},
		children: (e, t) => {
			var r = xD(), o = F(r), s = (e) => {
				var t = DE(), n = P(t);
				tv(n, { size: 15 });
				var r = I(L(n, 2), !0);
				D(t), R(() => W(r, z(p))), U(e, t);
			}, c = (e) => {
				tb(e, { rows: 10 });
			}, l = (e) => {
				U(e, OE());
			}, u = (e) => {
				var t = yD(), r = P(t), o = P(r), s = P(o);
				ay(s, { size: 13 });
				var c = L(s);
				da(c), D(o);
				var l = L(o, 2);
				K(l, 21, () => z(ie), (e) => e.source, (e, t) => {
					var n = IE();
					let r;
					var i = P(n), a = P(i), o = I(a, !0), s = L(a, 2), c = P(s);
					L_(c, { size: 10 });
					var l = L(c);
					D(s), D(i);
					var u = L(i, 2), d = P(u), f = (e) => {
						U(e, kE());
					}, p = (e) => {
						U(e, AE());
					}, m = (e) => {
						U(e, jE());
					};
					G(d, (e) => {
						z(t).action === "error" ? e(f) : z(t).action === "create" ? e(p, 1) : e(m, -1);
					});
					var h = L(d, 2), _ = (e) => {
						var n = ME(), r = I(n);
						R((e) => W(r, `+ ${e ?? ""} → same table`), [() => z(t).sharedWith.join(", ")]), U(e, n);
					};
					G(h, (e) => {
						z(t).sharedWith?.length && e(_);
					});
					var v = L(h, 2), y = (e) => {
						var n = NE();
						R((e) => Y(n, "title", `Also written by: ${e ?? ""}`), [() => z(t).sharedWith.join(", ")]), U(e, n);
					};
					G(v, (e) => {
						z(t).sharedWith?.length && e(y);
					});
					var b = L(v, 2), x = (e) => {
						var n = PE(), r = P(n);
						wy(r, { size: 11 });
						var i = L(r, 1, !0);
						D(n), R((e) => {
							Y(n, "title", e), W(i, z(t).warnings.length);
						}, [() => z(t).warnings.join("\n")]), U(e, n);
					};
					G(b, (e) => {
						z(t).warnings?.length && e(x);
					});
					var S = L(b, 2), C = (e) => {
						U(e, FE());
					};
					G(S, (e) => {
						z(t).mapped && e(C);
					}), D(u), D(n), R(() => {
						r = J(n, 1, "item svelte-k4qtat", null, r, { on: z(t).source === z(g) }), W(o, z(t).source), W(l, ` ${z(t).schema ?? ""}.${z(t).table ?? ""}`);
					}), B("click", n, () => N(g, z(t).source, !0)), U(e, n);
				}, (e) => {
					U(e, LE());
				}), D(l), D(r);
				var u = L(r, 2), d = P(u), f = (e) => {
					let t = /* @__PURE__ */ j(() => z(ae));
					var r = vD(), o = F(r), s = P(o), c = P(s), l = I(c, !0), u = L(c, 2);
					L_(u, { size: 14 });
					var d = I(L(u, 2));
					D(s);
					var f = L(s, 2), p = (e) => {
						U(e, kE());
					}, h = (e) => {
						U(e, AE());
					}, g = (e) => {
						U(e, jE());
					};
					G(f, (e) => {
						z(t).action === "error" ? e(p) : z(t).action === "create" ? e(h, 1) : e(g, -1);
					}), D(o);
					var v = L(o, 2), y = P(v), b = I(L(P(y)), !0);
					D(y);
					var S = L(y, 2), C = I(L(P(S)), !0);
					D(S);
					var w = L(S, 2), T = I(L(P(w)), !0);
					D(w), D(v);
					var te = L(v, 2), ne = P(te), re = L(P(ne), 2);
					da(re), D(ne);
					var ie = L(ne, 2), oe = L(P(ie), 2), ce = P(oe);
					da(ce);
					var le = L(ce, 2), pe = (e) => {
						var n = VE(), r = P(n), i = (e) => {
							var t = RE(), n = P(t);
							qv(n, { size: 12 });
							var r = I(L(n, 2));
							D(t), R((e, t) => W(r, `${e ?? ""}.${t ?? ""}`), [() => z(E).trim() || a, () => z(De).trim()]), B("mousedown", t, (e) => (e.preventDefault(), je(z(E).trim() || a, z(De).trim()))), U(e, t);
						}, o = /* @__PURE__ */ j(() => z(De).trim() && !z(Ae));
						G(r, (e) => {
							z(o) && e(i);
						}), K(L(r, 2), 17, () => z(ke), Ti, (e, n) => {
							var r = zE(), i = P(r), a = I(i), o = L(i, 2), s = (e) => {
								J_(e, { size: 12 });
							};
							G(o, (e) => {
								z(n).schema === z(t).schema && z(n).name === z(t).table && e(s);
							});
							var c = I(L(o, 4));
							D(r), R((e) => {
								W(a, `${z(n).schema ?? ""}.${z(n).name ?? ""}`), W(c, `${e ?? ""} rows`);
							}, [() => z(n).estimatedRows.toLocaleString()]), B("mousedown", r, (e) => (e.preventDefault(), je(z(n).schema, z(n).name))), U(e, r);
						}, (e) => {
							var t = H(), n = F(t), r = (e) => {
								U(e, BE());
							}, i = /* @__PURE__ */ j(() => !z(De).trim());
							G(n, (e) => {
								z(i) && e(r);
							}), U(e, t);
						}), D(n), U(e, n);
					};
					G(le, (e) => {
						z(Oe) && !n() && e(pe);
					}), D(oe), D(ie);
					var Ie = L(ie, 2), Le = (e) => {
						var n = HE();
						Qv(P(n), { size: 12 }), O(), D(n), R((e) => Y(n, "title", `Use ${e ?? ""}`), [() => x(z(t).source)]), B("click", n, () => se(z(t).source, "")), U(e, n);
					};
					G(Ie, (e) => {
						z(t).mapped && !n() && e(Le);
					}), D(te);
					var Re = L(te, 2), ze = (e) => {
						var n = DE(), r = P(n);
						tv(r, { size: 15 });
						var i = I(L(r, 2), !0);
						D(n), R(() => W(i, z(t).error)), U(e, n);
					};
					G(Re, (e) => {
						z(t).error && e(ze);
					});
					var Be = L(Re, 2), Ve = (e) => {
						var n = WE(), r = P(n);
						wy(r, { size: 15 });
						var i = L(r, 2);
						K(i, 21, () => z(t).warnings, Ti, (e, t) => {
							var n = UE(), r = I(n, !0);
							R(() => W(r, z(t))), U(e, n);
						}), D(i), D(n), U(e, n);
					};
					G(Be, (e) => {
						z(t).warnings?.length && e(Ve);
					});
					var He = L(Be, 2), Ue = (e) => {
						let r = /* @__PURE__ */ j(() => Te(z(t))), i = /* @__PURE__ */ j(() => we(z(t)));
						var a = iD(), o = F(a), s = L(P(o), 2), c = I(s, !0), l = L(s, 6), u = P(l);
						{
							let e = /* @__PURE__ */ j(() => z(m) ? "spin" : "");
							Xv(u, {
								size: 12,
								get class() {
									return z(e);
								}
							});
						}
						O(), D(l), D(o);
						var d = L(o, 2), f = (e) => {
							U(e, GE());
						}, p = /* @__PURE__ */ j(() => Ce(z(t)).some((e) => e.primaryKey && xe(e)));
						G(d, (e) => {
							z(p) && e(f);
						});
						var h = L(d, 2), g = (e) => {
							var t = KE(), n = P(t);
							fy(n, { size: 12 });
							var i = L(n);
							D(t), R((e) => W(i, ` ${z(r).length ?? ""} column${z(r).length === 1 ? "" : "s"} added by transforms:
                ${e ?? ""}`), [() => z(r).map((e) => `${e.source} (${e.introducedBy})`).join(", ")]), U(e, t);
						};
						G(h, (e) => {
							z(r).length && e(g);
						});
						var _ = L(h, 2), v = L(P(_)), y = P(v), b = P(y), x = P(b);
						da(x), D(b), O(6), D(y), D(v);
						var S = L(v), C = P(S);
						K(C, 17, () => Ce(z(t)), (e) => e.source, (e, r) => {
							var i = $E();
							let a;
							var o = P(i), s = P(o);
							da(s), D(o);
							var c = L(o), l = P(c), u = (e) => {
								kv(e, {
									size: 11,
									class: "pk"
								});
							};
							G(l, (e) => {
								z(r).primaryKey && e(u);
							});
							var d = L(l, 2);
							let f;
							var p = I(d, !0), m = L(d, 2), h = (e) => {
								var t = qE(), n = I(t);
								R(() => {
									Y(t, "title", `Created by the flow step “${z(r).introducedBy ?? ""}”`), W(n, `✦ added by ${z(r).introducedBy ?? ""}`);
								}), U(e, t);
							};
							G(m, (e) => {
								z(r).introducedBy && e(h);
							}), D(c);
							var g = L(c);
							L_(P(g), { size: 12 }), D(g);
							var _ = L(g), v = P(_), y = P(v);
							{
								let e = /* @__PURE__ */ j(() => Ee(z(r))), i = /* @__PURE__ */ j(() => Se(z(t)));
								yE(y, {
									get value() {
										return z(e);
									},
									get options() {
										return z(i);
									},
									get readOnly() {
										return n();
									},
									onpick: (e) => fe(z(t).source, z(r).source, e)
								});
							}
							var b = L(y, 2), x = (e) => {
								U(e, JE());
							};
							G(b, (e) => {
								z(r).mapped && e(x);
							});
							var S = L(b, 2), C = (e) => {
								var n = YE(), i = I(L(P(n)), !0);
								D(n), R(() => W(i, z(r).suggest)), B("click", n, () => fe(z(t).source, z(r).source, z(r).suggest)), U(e, n);
							};
							G(S, (e) => {
								z(r).suggest && z(r).suggest !== z(r).name && !n() && e(C);
							}), D(v), D(_);
							var w = L(_), T = P(w), ee = P(T), te = I(ee, !0);
							ee.value = ee.__value = "", K(L(ee), 17, () => Hg.types, Ti, (e, t) => {
								var n = XE(), r = I(n), i = {};
								R(() => {
									W(r, `→ ${z(t).label ?? ""}`), i !== (i = z(t).value) && (n.value = (n.__value = i) ?? "");
								}), U(e, n);
							}), D(T);
							var ne;
							Qi(T);
							var re = L(T, 2), ie = (e) => {
								var t = ZE(), n = I(t, !0);
								R(() => W(n, z(r).sourceType)), U(e, t);
							};
							G(re, (e) => {
								z(r).cast && e(ie);
							}), D(w);
							var ae = L(w), oe = P(ae);
							da(oe);
							var se = L(oe, 2), ce = (e) => {
								var t = ZE(), n = I(t);
								R(() => W(n, `was ${z(r).targetType ?? ""}`)), U(e, t);
							};
							G(se, (e) => {
								z(r).status === "retype" && e(ce);
							});
							var le = L(se, 2), pe = (e) => {
								U(e, QE());
							};
							G(le, (e) => {
								!z(r).nullable && z(r).targetType && e(pe);
							}), D(ae);
							var me = L(ae), he = P(me), ge = I(he, !0);
							D(me), D(i), R((e, o, c, l, u, m, h) => {
								a = J(i, 1, Bi(z(r).status), "svelte-k4qtat", a, { ignored: e }), Y(i, "title", z(r).note), Y(s, "title", o), s.disabled = n(), pa(s, c), f = J(d, 1, "svelte-k4qtat", null, f, { strike: z(r).status === "skipped" || z(r).status === "dropped" }), W(p, z(r).source), T.disabled = l, W(te, z(r).cast ? "as is" : z(r).sourceType ?? "as is"), ne !== (ne = u) && (T.value = (T.__value = ne) ?? "", Zi(T, ne)), oe.disabled = m, Y(oe, "placeholder", z(r).targetType ?? z(r).sourceType ?? ""), Y(oe, "title", z(t).exists && z(r).targetType ? `Current: ${z(r).targetType}. Set a type to ALTER the column before loading.` : "PostgreSQL type the column is created with"), fa(oe, h), J(he, 1, `chip ${z(r).status ?? ""}`, "svelte-k4qtat"), Y(he, "title", z(r).note), W(ge, Me[z(r).status]);
							}, [
								() => xe(z(r)),
								() => xe(z(r)) ? "Ignored — not written to the target. Tick to include." : "Included. Untick to ignore this column.",
								() => !xe(z(r)),
								() => n() || xe(z(r)),
								() => ue(z(t).source, z(r).source)?.cast ?? "",
								() => n() || xe(z(r)) || z(r).status === "dropped",
								() => ue(z(t).source, z(r).source)?.type ?? ""
							]), B("change", s, (e) => ye(z(t).source, z(r), e.currentTarget.checked)), B("change", T, (e) => de(z(t).source, z(r).source, { cast: e.currentTarget.value })), B("change", oe, (e) => de(z(t).source, z(r).source, { type: e.currentTarget.value.trim() })), U(e, i);
						});
						var w = L(C), T = (e) => {
							var t = rD();
							K(L(F(t), 2), 17, () => z(i), (e) => e.name, (e, t) => {
								var n = nD(), r = L(P(n), 2);
								L_(P(r), { size: 12 }), D(r);
								var i = L(r), a = P(i), o = (e) => {
									kv(e, {
										size: 11,
										class: "pk"
									});
								};
								G(a, (e) => {
									z(t).primaryKey && e(o);
								});
								var s = L(a, 1, !0);
								D(i);
								var c = L(i, 2), l = P(c, !0), u = L(l), d = (e) => {
									U(e, QE());
								};
								G(u, (e) => {
									z(t).nullable || e(d);
								}), D(c);
								var f = L(c), p = L(P(f), 2), m = (e) => {
									var n = eD();
									wy(P(n), { size: 11 }), O(), D(n), R(() => Y(n, "title", z(t).note)), U(e, n);
								}, h = /* @__PURE__ */ j(() => Pe(z(t))), g = (e) => {
									var n = tD(), r = I(n, !0);
									R(() => W(r, z(t).note)), U(e, n);
								};
								G(p, (e) => {
									z(h) ? e(m) : z(t).note && e(g, 1);
								}), D(f), D(n), R(() => {
									Y(n, "title", z(t).note), W(s, z(t).name), W(l, z(t).targetType ?? "—");
								}), U(e, n);
							}), U(e, t);
						};
						G(w, (e) => {
							z(i).length && e(T);
						}), D(S), D(_), R((e, t, r) => {
							W(c, e), l.disabled = z(m), x.disabled = n(), pa(x, t), x.indeterminate = r;
						}, [
							() => Ne(z(t).columns),
							() => Ce(z(t)).every((e) => !xe(e)),
							() => Ce(z(t)).some(xe) && !Ce(z(t)).every(xe)
						]), B("click", l, ee), B("change", x, (e) => be(z(t), e.currentTarget.checked)), U(e, a);
					};
					G(He, (e) => {
						z(t).columns?.length && e(Ue);
					});
					var We = L(He, 2), Ge = L(P(We), 6), Ke = (e) => {
						var n = aD();
						qv(P(n), { size: 12 }), O(), D(n), B("click", n, () => he(z(t))), U(e, n);
					};
					G(Ge, (e) => {
						n() || e(Ke);
					}), D(We);
					var qe = L(We, 2), Je = (e) => {
						var r = uD(), a = L(P(r), 2);
						K(a, 21, () => me(z(t)), ({ e, i: t }) => t, (e, r) => {
							let a = () => z(r).e, o = () => z(r).i, s = /* @__PURE__ */ j(() => ve(z(t), a().column));
							var c = lD(), l = P(c), u = P(l);
							da(u), D(l);
							var d = L(l), f = P(d), p = () => a().expr, m = (e) => ge(o(), { expr: e });
							Xb(f, {
								compact: !0,
								get nodeId() {
									return i;
								},
								get value() {
									return p();
								},
								set value(e) {
									m(e);
								}
							}), D(d);
							var h = L(d), g = P(h);
							da(g), D(h);
							var _ = L(h), v = P(_), y = P(v), b = I(y);
							y.value = y.__value = "this";
							var x = L(y);
							x.value = x.__value = "all", D(v);
							var S;
							Qi(v), D(_);
							var C = L(_), w = P(C), T = (e) => {
								var t = oD(), n = I(t, !0);
								R(() => {
									J(t, 1, `chip ${z(s).status ?? ""}`, "svelte-k4qtat"), Y(t, "title", z(s).note), W(n, Me[z(s).status]);
								}), U(e, t);
							}, ee = (e) => {
								U(e, sD());
							};
							G(w, (e) => {
								z(s) ? e(T) : e(ee, -1);
							}), D(C);
							var te = L(C), ne = P(te), re = (e) => {
								var t = cD();
								Cy(P(t), { size: 13 }), D(t), B("click", t, () => _e(o())), U(e, t);
							};
							G(ne, (e) => {
								n() || e(re);
							}), D(te), D(c), R(() => {
								fa(u, a().column), u.disabled = n(), Y(g, "placeholder", z(s)?.sourceType ?? "inferred"), fa(g, a().type), g.disabled = n(), v.disabled = n(), W(b, `${z(t).source ?? ""} only`), S !== (S = a().table ? "this" : "all") && (v.value = v.__value = S, Zi(v, S));
							}), B("change", u, (e) => ge(o(), { column: e.currentTarget.value.trim() })), B("change", g, (e) => ge(o(), { type: e.currentTarget.value.trim() })), B("change", v, (e) => ge(o(), { table: e.currentTarget.value === "all" ? "" : z(t).source })), U(e, c);
						}), D(a), D(r), U(e, r);
					}, Ye = /* @__PURE__ */ j(() => me(z(t)).length), Xe = (e) => {
						U(e, dD());
					};
					G(qe, (e) => {
						z(Ye) ? e(Je) : e(Xe, -1);
					});
					var Ze = L(qe, 2), Qe = (e) => {
						var n = fD(), r = I(L(F(n), 2));
						R((e) => W(r, `${e ?? ""};`), [() => z(t).alter.join(";\n")]), U(e, n);
					};
					G(Ze, (e) => {
						z(t).alter?.length && e(Qe);
					});
					var $e = L(Ze, 2), et = (e) => {
						var n = CE(), r = F(n), i = (e) => {
							var n = mD(), r = F(n), i = P(r), a = P(i), o = (e) => {
								Y_(e, { size: 13 });
							}, s = (e) => {
								Q_(e, { size: 13 });
							};
							G(a, (e) => {
								z(_) ? e(o) : e(s, -1);
							}), O(), D(i);
							var c = L(i, 4);
							ov(P(c), { size: 12 }), O(), D(c), D(r);
							var l = L(r, 2), u = (e) => {
								var n = pD(), r = I(n, !0);
								R(() => W(r, z(t).ddl)), U(e, n);
							};
							G(l, (e) => {
								z(_) && e(u);
							}), B("click", i, () => N(_, !z(_))), B("click", c, () => Fe(z(t).ddl ?? "")), U(e, n);
						};
						G(r, (e) => {
							z(t).ddl && e(i);
						});
						var a = L(r, 2), o = (e) => {
							var n = _D(), r = P(n), i = (e) => {
								var n = hD(), r = L(P(n));
								K(r, 21, () => z(t).indexes, Ti, (e, t) => {
									var n = UE(), r = I(n, !0);
									R(() => W(r, z(t))), U(e, n);
								}), D(r), D(n), U(e, n);
							};
							G(r, (e) => {
								z(t).indexes?.length && e(i);
							});
							var a = L(r, 2), o = (e) => {
								var n = gD(), r = L(P(n));
								K(r, 21, () => z(t).foreignKeys, Ti, (e, t) => {
									var n = UE(), r = I(n, !0);
									R(() => W(r, z(t))), U(e, n);
								}), D(r), D(n), U(e, n);
							};
							G(a, (e) => {
								z(t).foreignKeys?.length && e(o);
							}), D(n), U(e, n);
						};
						G(a, (e) => {
							(z(t).indexes?.length || z(t).foreignKeys?.length) && e(o);
						}), U(e, n);
					};
					G($e, (e) => {
						z(t).action === "create" && e(et);
					}), R((e) => {
						W(l, z(t).source), W(d, `${z(t).schema ?? ""}.${z(t).table ?? ""}`), W(b, z(t).mode), W(C, z(t).truncate || "none"), W(T, e), re.disabled = n(), ce.disabled = n();
					}, [() => z(t).conflictKey?.length ? z(t).conflictKey.join(", ") : "—"]), B("change", re, () => z(ae) && se(z(ae).source, `${z(E)}.${z(De)}`)), ya(re, () => z(E), (e) => N(E, e)), Vr("focus", ce, () => N(Oe, !0)), B("input", ce, () => N(Oe, !0)), Vr("blur", ce, () => setTimeout(() => N(Oe, !1), 150)), B("keydown", ce, (e) => {
						e.key === "Enter" ? (e.preventDefault(), je(z(E).trim() || a, z(De).trim())) : e.key === "Escape" && z(Oe) && (e.stopPropagation(), N(Oe, !1));
					}), ya(ce, () => z(De), (e) => N(De, e)), U(e, r);
				};
				G(d, (e) => {
					z(ae) && e(f);
				}), D(u), D(t), R(() => Y(c, "placeholder", `Filter ${z(re).length ?? ""} tables…`)), ya(c, () => z(h), (e) => N(h, e)), U(e, t);
			};
			G(o, (e) => {
				!z(f) && z(p) ? e(s) : z(f) ? z(re).length === 0 ? e(l, 2) : e(u, -1) : e(c, 1);
			});
			var v = L(o, 2);
			K(v, 21, () => d, Ti, (e, t) => {
				var n = bD(), r = {};
				R(() => {
					r !== (r = z(t)) && (n.value = (n.__value = r) ?? "");
				}), U(e, n);
			}), D(v), U(e, r);
		},
		$$slots: {
			headerExtra: !0,
			footer: !0,
			default: !0
		}
	}), A();
}
Hr([
	"click",
	"change",
	"input",
	"keydown",
	"mousedown"
]);
//#endregion
//#region src/lib/flows/status.ts
function CD(e, t) {
	let n = /* @__PURE__ */ new Map();
	for (let e of t) {
		let t = n.get(e.flowId);
		(!t || +new Date(e.startedAt) > +new Date(t.startedAt)) && n.set(e.flowId, e);
	}
	let r = /* @__PURE__ */ new Map();
	for (let t of e) {
		let e = n.get(t.id), i = t.lastRun;
		r.set(t.id, e && (!i || +new Date(e.startedAt) >= +new Date(i.startedAt)) ? e : i ?? e);
	}
	return r;
}
function wD(e, t, n) {
	return (e.dependsOn ?? []).filter((e) => n.get(e)?.status !== "completed").map((e) => t.get(e)?.name ?? e);
}
//#endregion
//#region src/lib/canvas/FlowEditor.svelte
var TD = /* @__PURE__ */ V("<span class=\"badge\" title=\"Your account can view this flow but not change it\"><!> Read-only</span>"), ED = /* @__PURE__ */ V("<span><!> </span> <div class=\"sep svelte-xqx3jn\"></div> <button class=\"btn ghost icon\" title=\"Undo (⌘Z)\"><!></button> <button class=\"btn ghost icon\" title=\"Redo (⇧⌘Z)\"><!></button> <button class=\"btn ghost icon\" title=\"Save (⌘S)\"><!></button>", 1), DD = /* @__PURE__ */ V("<span class=\"badge warn\"><!> reconnecting</span>"), OD = /* @__PURE__ */ V("<span class=\"badge accent\"> </span>"), kD = /* @__PURE__ */ V("<span class=\"badge accent mono\"> </span>"), AD = /* @__PURE__ */ V("<span class=\"badge mono\">off</span>"), jD = /* @__PURE__ */ V("<span class=\"wait ellipsis svelte-xqx3jn\"> </span>"), MD = /* @__PURE__ */ V("<a class=\"runpill svelte-xqx3jn\"><!> <!></a>"), ND = /* @__PURE__ */ V("<span> </span>"), PD = /* @__PURE__ */ V("<button class=\"btn\" title=\"Continue the latest run, skipping committed chunks\"><!> Resume</button>"), FD = /* @__PURE__ */ V("<button class=\"scrim svelte-xqx3jn\" aria-label=\"Close menu\"></button> <div class=\"menu svelte-xqx3jn\" role=\"menu\"><button role=\"menuitem\" class=\"svelte-xqx3jn\"><!> Run with dependencies <span class=\"muted tiny svelte-xqx3jn\"> </span></button> <button role=\"menuitem\" class=\"svelte-xqx3jn\"><!> Run this flow only <span class=\"muted tiny svelte-xqx3jn\">ignore prerequisites</span></button></div>", 1), ID = /* @__PURE__ */ V("<!> <div class=\"split svelte-xqx3jn\"><button class=\"btn primary svelte-xqx3jn\"><!> Run</button> <button class=\"btn primary caret svelte-xqx3jn\" aria-label=\"Run options\" aria-haspopup=\"menu\"><!></button> <!></div>", 1), LD = /* @__PURE__ */ V("<!> <!>", 1), RD = /* @__PURE__ */ V("<p class=\"svelte-xqx3jn\">Drag a <strong>Source</strong> from the palette onto the canvas, then add transforms and a <strong>Sink</strong>. Connect an output port (right) to the next node's input (left).</p>"), zD = /* @__PURE__ */ V("<p class=\"svelte-xqx3jn\">This flow is empty.</p>"), BD = /* @__PURE__ */ V("<div class=\"blank svelte-xqx3jn\"><!> <h3 class=\"svelte-xqx3jn\"> </h3> <!></div>"), VD = /* @__PURE__ */ V("<!> <!> <!> <!> <div class=\"editor svelte-xqx3jn\"><div class=\"toolbar svelte-xqx3jn\"><a class=\"btn ghost icon\" title=\"All flows\"><!></a> <input class=\"fname svelte-xqx3jn\" aria-label=\"Flow name\" spellcheck=\"false\"/> <!> <span class=\"spacer\"></span> <!> <button class=\"btn\"><!> Depends on<!></button> <button class=\"btn ghost icon\" title=\"History of saved edits\"><!></button> <button class=\"btn\"><!> Schedule<!></button> <!> <button class=\"btn\"><!> Validate <!></button> <!></div> <div class=\"main svelte-xqx3jn\"><!> <div class=\"center svelte-xqx3jn\"><div role=\"application\"><!> <!></div> <!></div> <!></div></div>", 1);
function HD(e, t) {
	k(t, !0);
	let n = /* @__PURE__ */ j(() => n_.can.edit), r = /* @__PURE__ */ j(() => n_.can.run), i = /* @__PURE__ */ j(() => n_.can.data), a = t.flow, o = a.id, { screenToFlowPosition: s, fitView: c } = Ah(), l = {
		type: Dd.ArrowClosed,
		width: 16,
		height: 16,
		color: "#98a2b3"
	}, u = (e) => ({
		...e,
		markerEnd: l
	}), d = /* @__PURE__ */ M((a.graph?.nodes ?? []).map(b_)), f = /* @__PURE__ */ M((a.graph?.edges ?? []).map((e) => u(x_(e)))), p = /* @__PURE__ */ M(pn(a.name)), m = /* @__PURE__ */ M(pn(a.dependsOn ?? [])), h = /* @__PURE__ */ M(!1), g = /* @__PURE__ */ M(!1), _ = /* @__PURE__ */ M(!1), v = /* @__PURE__ */ M(pn({
		schedule: a.schedule,
		scheduleEnabled: a.scheduleEnabled,
		lastFire: a.lastFire,
		nextRun: a.nextRun
	})), y = /* @__PURE__ */ M(null), b = /* @__PURE__ */ M(!1), x = a.graph?.viewport, S = /* @__PURE__ */ M(x), C = { processor: qy }, w = { flow: Qy }, T = /* @__PURE__ */ j(() => S_(z(d), z(f))), ee = /* @__PURE__ */ j(() => O_(z(T))), te = /* @__PURE__ */ M(O_(S_(Nr(() => z(d)), Nr(() => z(f)))) + "" + a.name), ne = /* @__PURE__ */ j(() => z(ee) + "" + z(p) !== z(te)), re = /* @__PURE__ */ M(!1), ie = /* @__PURE__ */ M(""), ae = () => ({
		...S_(z(d), z(f)),
		...z(S) ? { viewport: z(S) } : {}
	}), oe, se = !1;
	Fn(() => {
		z(n) && z(ne) && (z(ee), z(p), clearTimeout(oe), oe = setTimeout(() => ce(), 1e3));
	});
	async function ce(e = !1) {
		if (clearTimeout(oe), !z(n)) return !1;
		if (z(re)) return se = !0, !1;
		if (!z(ne) && !e) return !0;
		let t = ae(), r = O_(t) + "" + z(p), i = z(p).trim() || "Untitled flow";
		N(re, !0);
		try {
			return await Bg.updateFlow(o, {
				name: i,
				graph: t
			}), N(te, r), N(ie, ""), e && Gg.success("Saved"), qe(), !0;
		} catch (t) {
			return N(ie, t.message, !0), (e || !le) && Gg.error(`Save failed: ${z(ie)}`), le = !0, !1;
		} finally {
			N(re, !1), se && (se = !1, z(ne) && ce());
		}
	}
	let le = !1, ue = /* @__PURE__ */ M([]), de = /* @__PURE__ */ M(-1), fe;
	function pe() {
		let e = S_(z(d), z(f));
		return {
			key: O_(e),
			nodes: p_(e.nodes),
			edges: p_(e.edges)
		};
	}
	N(ue, [pe()]), N(de, 0), Fn(() => {
		let e = z(ee);
		z(d).some((e) => e.dragging) || (clearTimeout(fe), fe = setTimeout(() => {
			Nr(() => {
				if (z(ue)[z(de)]?.key === e) return;
				let t = z(ue).slice(0, z(de) + 1).concat(pe()).slice(-100);
				N(ue, t), N(de, t.length - 1);
			});
		}, 350));
	});
	function me(e) {
		let t = new Set(z(d).filter((e) => e.selected).map((e) => e.id));
		N(d, e.nodes.map((e) => ({
			...b_(p_(e)),
			selected: t.has(e.id)
		}))), N(f, e.edges.map((e) => u(x_(p_(e)))));
	}
	function he() {
		if (clearTimeout(fe), z(ue)[z(de)]?.key !== z(ee)) {
			let e = z(ue).slice(0, z(de) + 1).concat(pe());
			N(ue, e), N(de, e.length - 1);
		}
		z(de) <= 0 || (un(de, -1), me(z(ue)[z(de)]));
	}
	function ge() {
		z(de) >= z(ue).length - 1 || (un(de), me(z(ue)[z(de)]));
	}
	let _e = /* @__PURE__ */ j(() => z(d).filter((e) => e.selected)), ve = /* @__PURE__ */ j(() => z(f).filter((e) => e.selected)), ye = /* @__PURE__ */ j(() => z(_e).length === 1 ? z(_e)[0] : null), be = /* @__PURE__ */ j(() => !z(ye) && z(ve).length === 1 ? z(ve)[0] : null), xe = /* @__PURE__ */ j(() => z(ye)?.id ?? null);
	function Se(e, t = !0) {
		N(d, z(d).map((t) => ({
			...t,
			selected: t.id === e
		}))), N(f, z(f).map((e) => e.selected ? {
			...e,
			selected: !1
		} : e)), t && c({
			nodes: [{ id: e }],
			duration: 350,
			maxZoom: 1.1,
			padding: .6
		});
	}
	function Ce(e) {
		let t = z(d).find((t) => t.id === e);
		t && (t.selected || Se(e, !1), t.data.node.type === "sink.postgres" && we(e));
	}
	function we(e) {
		if (!z(i)) {
			Gg.info("Planning target tables inspects the databases, which needs the data permission.");
			return;
		}
		N(y, e, !0);
	}
	function Te(e) {
		N(d, z(d).map((e) => e.selected ? {
			...e,
			selected: !1
		} : e)), N(f, z(f).map((t) => ({
			...t,
			selected: t.id === e
		})));
	}
	function Ee() {
		N(d, z(d).map((e) => e.selected ? {
			...e,
			selected: !1
		} : e)), N(f, z(f).map((e) => e.selected ? {
			...e,
			selected: !1
		} : e));
	}
	function E(e, t) {
		let n = z(d).find((t) => t.id === e);
		if (!n) return;
		let r = {
			...n.data.node,
			...Ze(t)
		};
		N(d, z(d).map((t) => t.id === e ? {
			...t,
			data: { node: r }
		} : t)), t.config && De(e, n.data.node, r);
	}
	function De(e, t, n) {
		let r = Hg.byType.get(n.type);
		if (!r?.dynamicRelationships) return;
		let i = w_(r, t.config), a = w_(r, n.config);
		if (i.join("|") === a.join("|")) return;
		let o = /* @__PURE__ */ new Map();
		i.length === a.length && i.forEach((e, t) => e !== a[t] && o.set(e, a[t]));
		let s = new Set(a);
		N(f, z(f).map((t) => {
			if (t.source !== e || !t.sourceHandle || !o.has(t.sourceHandle)) return t;
			let n = o.get(t.sourceHandle);
			return {
				...t,
				sourceHandle: n,
				data: { edge: {
					...t.data.edge,
					fromPort: n
				} }
			};
		}).filter((t) => t.source !== e || s.has(t.sourceHandle ?? "")));
	}
	async function Oe(e) {
		try {
			return ((await Bg.schema(ae(), e)).tables ?? []).map((e) => e.table);
		} catch {
			return null;
		}
	}
	function ke(e, t) {
		N(f, z(f).map((n) => n.id === e ? {
			...n,
			data: { edge: {
				...n.data.edge,
				...Ze(t)
			} }
		} : n));
	}
	function Ae(e) {
		N(d, z(d).filter((t) => t.id !== e)), N(f, z(f).filter((t) => t.source !== e && t.target !== e));
	}
	function je(e) {
		N(f, z(f).filter((t) => t.id !== e));
	}
	function Me(e, t) {
		let n = Hg.byType.get(e);
		if (!n) return;
		if (!t) {
			let e = z(Fe)?.getBoundingClientRect();
			t = e ? s({
				x: e.left + e.width / 2,
				y: e.top + e.height / 2
			}) : {
				x: 0,
				y: 0
			}, t = {
				x: t.x - 165 + z(d).length % 5 * 16,
				y: t.y - 40 + z(d).length % 5 * 16
			};
		}
		let r = E_(n, {
			x: Math.round(t.x),
			y: Math.round(t.y)
		}, z(d).map((e) => e.data.node.name));
		N(d, [...z(d).map((e) => e.selected ? {
			...e,
			selected: !1
		} : e), {
			...b_(r),
			selected: !0
		}]), N(f, z(f).map((e) => e.selected ? {
			...e,
			selected: !1
		} : e));
	}
	function Ne(e) {
		return e.source === e.target || e.targetHandle && e.targetHandle !== "in" ? !1 : !z(f).some((t) => t.source === e.source && t.sourceHandle === e.sourceHandle && t.target === e.target);
	}
	function Pe(e) {
		if (!Ne(e)) return !1;
		let t = f_("e"), n = e.sourceHandle ?? "success";
		return u(x_({
			id: t,
			from: e.source,
			fromPort: n,
			to: e.target
		}));
	}
	let Fe = /* @__PURE__ */ M(void 0), Ie = /* @__PURE__ */ M(!1);
	function Le(e) {
		z(n) && e.dataTransfer?.types.includes("application/nifi-processor") && (e.preventDefault(), e.dataTransfer.dropEffect = "copy", N(Ie, !0));
	}
	function Re(e) {
		if (N(Ie, !1), !z(n)) return;
		let t = e.dataTransfer?.getData("application/nifi-processor");
		if (!t) return;
		e.preventDefault();
		let r = s({
			x: e.clientX,
			y: e.clientY
		});
		Me(t, {
			x: r.x - 165,
			y: r.y - 30
		});
	}
	let ze = /* @__PURE__ */ M(pn([])), Be = /* @__PURE__ */ M(!1), Ve = /* @__PURE__ */ M(!1), He = /* @__PURE__ */ j(() => {
		let e = /* @__PURE__ */ new Map();
		for (let t of z(ze)) t.nodeId && e.set(t.nodeId, [...e.get(t.nodeId) ?? [], t]);
		return e;
	}), Ue = /* @__PURE__ */ j(() => {
		let e = /* @__PURE__ */ new Map();
		for (let t of z(ze)) t.edgeId && e.set(t.edgeId, [...e.get(t.edgeId) ?? [], t]);
		return e;
	}), We = /* @__PURE__ */ j(() => z(ze).filter((e) => e.level === "error").length);
	async function Ge(e = !0) {
		N(Ve, !0);
		try {
			N(ze, await Bg.validate(ae()) ?? [], !0), N(Be, !0), e && (N(xt, "issues"), N(St, !0), z(ze).length || Gg.success("Flow is valid"));
		} catch (t) {
			e && Gg.error(t);
		} finally {
			N(Ve, !1);
		}
	}
	let Ke;
	function qe() {
		clearTimeout(Ke), Ke = setTimeout(() => Ge(!1), 200);
	}
	let Je = new h_(), Ye = /* @__PURE__ */ M(null), Xe = /* @__PURE__ */ M(!1), Qe = /* @__PURE__ */ M(0), $e = /* @__PURE__ */ M(!1), et = /* @__PURE__ */ j(() => Je.detail?.id === z(Ye)?.id ? Je.detail?.status ?? z(Ye)?.status : z(Ye)?.status), tt = /* @__PURE__ */ j(() => Je.detail?.id === z(Ye)?.id ? Je.detail?.live ?? z(Ye)?.live : z(Ye)?.live), nt = /* @__PURE__ */ j(() => z(et) === "stopped" || z(et) === "failed"), rt = /* @__PURE__ */ j(() => Yg(z(et)));
	Je.onEnd = (e) => {
		N(Ye, e, !0), N(Xe, !0), un(Qe), e.status === "completed" ? Gg.success(`Run completed · ${e.rowsWritten.toLocaleString()} rows written`) : e.status === "failed" ? Gg.error(`Run failed${e.error ? `: ${e.error}` : ""}`) : Gg.info(`Run ${e.status}`);
	};
	async function it() {
		try {
			let e = await Bg.flowRuns(o);
			e?.length && (N(Ye, e[0], !0), Je.start(e[0].id));
		} catch {}
	}
	async function at(e = !1, t = !0) {
		if (N(b, !1), z(r)) {
			z(We) && !e && (N(xt, "issues"), N(St, !0)), N($e, !0);
			try {
				if (z(n) && z(ne) && !await ce()) return;
				let r = await Bg.startRun(o, e, t);
				N(Ye, r, !0), N(Xe, !1), un(Qe), Je.start(r.id), N(xt, "run"), N(St, !0), Gg.info(e ? "Run resumed" : r.status === "pending" ? "Run queued — waiting for prerequisites" : t && z(m).length ? "Run started (with dependencies)" : "Run started");
			} catch (e) {
				Gg.error(e);
			} finally {
				N($e, !1);
			}
		}
	}
	let ot = /* @__PURE__ */ M(pn([]));
	Fn(() => {
		if (z(et) !== "pending") {
			N(ot, [], !0);
			return;
		}
		let e = !1, t = async () => {
			try {
				let [t, n] = await Promise.all([Bg.flows(), Bg.activeRuns()]);
				if (e) return;
				let r = t.find((e) => e.id === o), i = CD(t, n);
				N(ot, r ? wD({
					...r,
					dependsOn: z(m)
				}, new Map(t.map((e) => [e.id, e])), i) : [], !0);
			} catch {}
		};
		t();
		let n = setInterval(t, 2e3);
		return () => {
			e = !0, clearInterval(n);
		};
	});
	function st(e) {
		N(Ye, e, !0), Je.patch(e), Yg(e.status) && Je.connection !== "open" && Je.start(e.id);
	}
	let ct;
	yi(() => (it(), qe(), ct = setInterval(lt, 8e3), document.addEventListener("visibilitychange", lt), () => document.removeEventListener("visibilitychange", lt)));
	async function lt() {
		if (!(Je.active || document.hidden)) try {
			let e = (await Bg.activeRuns() ?? []).find((e) => e.flowId === o);
			e && e.id !== Je.runId && (N(Ye, e, !0), N(Xe, !1), Je.start(e.id));
		} catch {}
	}
	bi(() => {
		Je.stop(), clearInterval(ct), clearTimeout(oe), clearTimeout(fe), clearTimeout(Ke), clearTimeout(_t), z(n) && z(ne) && Bg.updateFlow(o, {
			name: z(p).trim() || "Untitled flow",
			graph: ae()
		}).catch(() => {});
	});
	let ut = "", dt = /* @__PURE__ */ new Map();
	async function ft(e) {
		if (!z(f).some((t) => t.target === e)) return null;
		let t = ae(), n = `${O_(t)}|${e}|${ut}`;
		if (dt.has(n)) return dt.get(n);
		let r = await Bg.preview(t, e, ut || void 0, 20);
		!r.input && ut && (r = await Bg.preview(t, e, void 0, 20));
		let i = r.input ? {
			columns: r.input.columns ?? [],
			rows: r.input.rows ?? [],
			table: r.input.table ?? r.table
		} : null;
		return dt.size > 20 && dt.clear(), dt.set(n, i), i;
	}
	function pt(e, t) {
		ut = t.table ?? "";
	}
	let mt = /* @__PURE__ */ M(pn([])), ht = /* @__PURE__ */ M(pn({
		loading: !1,
		error: ""
	})), gt = "", _t, vt = null, yt = /* @__PURE__ */ j(() => {
		if (!z(xe)) return "";
		let e = /* @__PURE__ */ new Set([z(xe)]), t = [z(xe)];
		for (; t.length;) {
			let n = t.pop();
			for (let r of z(f)) r.target === n && !e.has(r.source) && (e.add(r.source), t.push(r.source));
		}
		let n = z(d).filter((t) => e.has(t.id) && t.id !== z(xe)).map((e) => [
			e.id,
			e.data.node.type,
			e.data.node.config,
			e.data.node.disabled
		]), r = z(f).filter((t) => e.has(t.target)).map((e) => [
			e.source,
			e.sourceHandle,
			e.target
		]), i = z(d).find((e) => e.id === z(xe)), a = Hg.byType.get(i?.data.node.type ?? "")?.inputs === 0 ? i?.data.node.config : null;
		return z(xe) + JSON.stringify([
			n,
			r,
			a
		]);
	});
	async function bt(e) {
		vt?.abort(), vt = new AbortController(), N(ht, {
			loading: !0,
			error: ""
		}, !0);
		try {
			let t = await Bg.schema(ae(), e, vt.signal);
			if (z(xe) !== e) return;
			N(mt, (t.tables ?? []).map((e) => ({
				table: e.table,
				columns: e.columns ?? []
			})), !0), N(ht, {
				loading: !1,
				error: t.error ?? ""
			}, !0);
		} catch (e) {
			if (e.name === "AbortError") return;
			N(ht, {
				loading: !1,
				error: e.message
			}, !0);
		}
	}
	Fn(() => {
		z(yt);
		let e = z(xe);
		if (clearTimeout(_t), !e) {
			N(mt, [], !0), gt = "";
			return;
		}
		if (!z(i)) {
			N(mt, [], !0);
			return;
		}
		let t = Nr(() => gt) !== e;
		t && N(mt, [], !0), gt = e, _t = setTimeout(() => bt(e), t ? 0 : 800);
	}), __({
		specs: () => Hg.byType,
		live: Je,
		issues: () => z(He),
		edgeIssues: () => z(Ue),
		showStats: () => !!Je.detail && (Je.active || z(Xe)),
		readOnly: () => !z(n),
		opennode: (e) => Ce(e),
		portsOf: (e) => {
			let t = z(d).find((t) => t.id === e);
			return t ? w_(Hg.byType.get(t.data.node.type), t.data.node.config) : [];
		},
		sampleFor: ft
	});
	let xt = /* @__PURE__ */ M(pn(Nr(() => n_.can.data) ? "preview" : "run")), St = /* @__PURE__ */ M(!0), Ct = /* @__PURE__ */ M(pn((() => {
		try {
			return Number(localStorage.getItem("nifi.bottomHeight")) || 300;
		} catch {
			return 300;
		}
	})())), wt = /* @__PURE__ */ M(0);
	function Tt() {
		z(i) && (N(xt, "preview"), N(St, !0), un(wt));
	}
	let Et = /* @__PURE__ */ j(() => new Map(z(d).map((e) => [e.id, e.data.node.name])));
	function Dt(e) {
		let t = e;
		return !!t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable || !!t.closest?.(".cm-editor"));
	}
	function Ot(e) {
		let t = e.metaKey || e.ctrlKey;
		if (t && e.key.toLowerCase() === "s") {
			e.preventDefault(), z(n) && ce(!0);
			return;
		}
		if (!(!z(n) && t && ["z", "y"].includes(e.key.toLowerCase())) && !document.querySelector("[aria-modal=\"true\"]")) {
			if (t && e.key.toLowerCase() === "z" && !Dt(e.target)) {
				e.preventDefault(), e.shiftKey ? ge() : he();
				return;
			}
			if (t && e.key.toLowerCase() === "y" && !Dt(e.target)) {
				e.preventDefault(), ge();
				return;
			}
			e.key === "Escape" && !Dt(e.target) && (z(ye) || z(be)) && Ee();
		}
	}
	function kt(e) {
		z(ne) && e.preventDefault();
	}
	let At = /* @__PURE__ */ j(() => z(re) ? "Saving…" : z(ie) && z(ne) ? "Save failed" : z(ne) ? "Unsaved" : "Saved");
	var jt = VD();
	Vr("keydown", gn, Ot), Vr("beforeunload", gn, kt);
	var Mt = F(jt), Nt = (e) => {
		let t = /* @__PURE__ */ j(() => z(d).find((e) => e.id === z(y)));
		var r = H(), i = F(r), a = (e) => {
			{
				let r = /* @__PURE__ */ j(() => !z(n));
				SD(e, {
					get node() {
						return z(t).data.node;
					},
					getGraph: ae,
					get readOnly() {
						return z(r);
					},
					onclose: () => N(y, null),
					onapply: (e) => {
						z(n) && z(y) && E(z(y), { config: {
							...z(t).data.node.config,
							table_map: e.table_map,
							column_map: e.column_map,
							expressions: e.expressions
						} }), N(y, null);
					}
				});
			}
		};
		G(i, (e) => {
			z(t) && e(a);
		}), U(e, r);
	};
	G(Mt, (e) => {
		z(y) && e(Nt);
	});
	var Pt = L(Mt, 2), Ft = (e) => {
		{
			let t = /* @__PURE__ */ j(ae), r = /* @__PURE__ */ j(() => !z(n));
			fE(e, {
				get flowId() {
					return o;
				},
				get current() {
					return z(t);
				},
				get readOnly() {
					return z(r);
				},
				onclose: () => N(_, !1),
				onrestored: (e) => {
					N(_, !1), Gg.success("Version restored — reloading the flow"), location.reload();
				}
			});
		}
	};
	G(Pt, (e) => {
		z(_) && e(Ft);
	});
	var It = L(Pt, 2), Lt = (e) => {
		{
			let t = /* @__PURE__ */ j(() => ({
				...a,
				...z(v)
			})), r = /* @__PURE__ */ j(() => !z(n));
			YT(e, {
				get flow() {
					return z(t);
				},
				get readOnly() {
					return z(r);
				},
				onclose: () => N(g, !1),
				onsaved: (e) => {
					N(v, {
						schedule: e.schedule,
						scheduleEnabled: e.scheduleEnabled,
						lastFire: e.lastFire,
						nextRun: e.nextRun
					}, !0), N(g, !1), Gg.success(e.schedule ? e.scheduleEnabled ? `Scheduled: ${e.schedule}` : "Schedule saved (off)" : "Schedule removed");
				}
			});
		}
	};
	G(It, (e) => {
		z(g) && e(Lt);
	});
	var Rt = L(It, 2), zt = (e) => {
		{
			let t = /* @__PURE__ */ j(() => !z(n));
			zT(e, {
				get flowId() {
					return o;
				},
				get current() {
					return z(m);
				},
				get readOnly() {
					return z(t);
				},
				onclose: () => N(h, !1),
				onsaved: (e) => {
					N(m, e, !0), N(h, !1), Gg.success(e.length ? `Depends on ${e.length} flow${e.length === 1 ? "" : "s"}` : "Dependencies cleared");
				}
			});
		}
	};
	G(Rt, (e) => {
		z(h) && e(zt);
	});
	var Bt = L(Rt, 2), Vt = P(Bt), Ht = P(Vt);
	F_(P(Ht), { size: 16 }), D(Ht);
	var Ut = L(Ht, 2);
	da(Ut);
	var Wt = L(Ut, 2), Gt = (e) => {
		var t = TD();
		fv(P(t), { size: 11 }), O(), D(t), U(e, t);
	}, Kt = (e) => {
		var t = ED(), n = F(t), r = P(n), i = (e) => {
			Lv(e, {
				size: 12,
				class: "spin"
			});
		}, a = (e) => {
			$_(e, { size: 12 });
		}, o = (e) => {
			J_(e, { size: 12 });
		};
		G(r, (e) => {
			z(re) ? e(i) : z(ie) && z(ne) ? e(a, 1) : z(ne) || e(o, 2);
		});
		var s = L(r);
		D(n);
		var c = L(n, 4);
		Ey(P(c), { size: 15 }), D(c);
		var l = L(c, 2);
		Yv(P(l), { size: 15 }), D(l);
		var u = L(l, 2);
		ny(P(u), { size: 15 }), D(u), R(() => {
			J(n, 1, `save ${z(re) ? "saving" : z(ie) && z(ne) ? "err" : z(ne) ? "dirty" : "ok"}`, "svelte-xqx3jn"), Y(n, "title", z(ie) || "Autosaves ~1s after changes · ⌘/Ctrl+S"), W(s, ` ${z(At) ?? ""}`), c.disabled = z(de) <= 0 && z(ue)[z(de)]?.key === z(ee), l.disabled = z(de) >= z(ue).length - 1, u.disabled = z(re);
		}), B("click", c, he), B("click", l, ge), B("click", u, () => ce(!0)), U(e, t);
	};
	G(Wt, (e) => {
		z(n) ? e(Kt, -1) : e(Gt);
	});
	var qt = L(Wt, 4), Jt = (e) => {
		var t = DD();
		Ay(P(t), { size: 11 }), O(), D(t), U(e, t);
	};
	G(qt, (e) => {
		Je.connection === "reconnecting" && e(Jt);
	});
	var Yt = L(qt, 2), Xt = P(Yt);
	Mv(Xt, { size: 14 });
	var Zt = L(Xt, 2), Qt = (e) => {
		var t = OD(), n = I(t, !0);
		R(() => W(n, z(m).length)), U(e, t);
	};
	G(Zt, (e) => {
		z(m).length && e(Qt);
	}), D(Yt);
	var $t = L(Yt, 2);
	Ev(P($t), { size: 15 }), D($t);
	var en = L($t, 2), tn = P(en);
	nv(tn, { size: 14 });
	var nn = L(tn, 2), rn = (e) => {
		var t = kD(), n = I(t, !0);
		R(() => W(n, z(v).schedule)), U(e, t);
	}, an = (e) => {
		U(e, AD());
	};
	G(nn, (e) => {
		z(v).schedule && z(v).scheduleEnabled ? e(rn) : z(v).schedule && e(an, 1);
	}), D(en);
	var on = L(en, 2), sn = (e) => {
		var t = MD(), n = P(t);
		Ow(n, {
			get status() {
				return z(et);
			},
			get live() {
				return z(tt);
			}
		});
		var r = L(n, 2), i = (e) => {
			var t = jD(), n = I(t, !0);
			R((e) => W(n, e), [() => z(ot).length ? `Waiting for: ${z(ot).join(", ")}` : "Queued"]), U(e, t);
		};
		G(r, (e) => {
			z(et) === "pending" && e(i);
		}), D(t), R((e, n) => {
			Y(t, "href", e), Y(t, "title", n);
		}, [() => qg(`/runs/${z(Ye).id}`), () => z(et) === "pending" && z(ot).length ? `Waiting for: ${z(ot).join(", ")}` : "Open latest run"]), U(e, t);
	};
	G(on, (e) => {
		z(Ye) && e(sn);
	});
	var cn = L(on, 2), ln = P(cn), dn = (e) => {
		Lv(e, {
			size: 14,
			class: "spin"
		});
	}, fn = (e) => {
		sy(e, { size: 14 });
	};
	G(ln, (e) => {
		z(Ve) ? e(dn) : e(fn, -1);
	});
	var mn = L(ln, 2), hn = (e) => {
		var t = ND(), n = I(t, !0);
		R(() => {
			J(t, 1, `badge ${z(We) ? "err" : "warn"}`), W(n, z(ze).length);
		}), U(e, t);
	};
	G(mn, (e) => {
		z(Be) && z(ze).length && e(hn);
	}), D(cn);
	var _n = L(cn, 2), vn = (e) => {}, yn = (e) => {
		TT(e, {
			get run() {
				return Je.detail;
			},
			onchange: st
		});
	}, bn = (e) => {
		var t = ID(), n = F(t), r = (e) => {
			var t = PD();
			Qv(P(t), { size: 14 }), O(), D(t), R(() => t.disabled = z($e)), B("click", t, () => at(!0)), U(e, t);
		};
		G(n, (e) => {
			z(nt) && e(r);
		});
		var i = L(n, 2), a = P(i), o = P(a), s = (e) => {
			Lv(e, {
				size: 14,
				class: "spin"
			});
		}, c = (e) => {
			Kv(e, { size: 14 });
		};
		G(o, (e) => {
			z($e) ? e(s) : e(c, -1);
		}), O(), D(a);
		var l = L(a, 2);
		Y_(P(l), { size: 14 }), D(l);
		var u = L(l, 2), f = (e) => {
			var t = FD(), n = F(t), r = L(n, 2), i = P(r), a = P(i);
			Kv(a, { size: 13 });
			var o = I(L(a, 2), !0);
			D(i);
			var s = L(i, 2);
			Kv(P(s), { size: 13 }), O(2), D(s), D(r), R(() => W(o, z(m).length ? `${z(m).length} prerequisite${z(m).length === 1 ? "" : "s"}` : "none set")), B("click", n, () => N(b, !1)), B("click", i, () => at(!1, !0)), B("click", s, () => at(!1, !1)), U(e, t);
		};
		G(u, (e) => {
			z(b) && e(f);
		}), D(i), R(() => {
			a.disabled = z($e) || z(d).length === 0, Y(a, "title", z(m).length ? "Runs unfinished prerequisites first, then this flow" : "Run this flow"), l.disabled = z($e) || z(d).length === 0;
		}), B("click", a, () => at(!1, !0)), B("click", l, () => N(b, !z(b))), U(e, t);
	};
	G(_n, (e) => {
		z(r) ? z(rt) && Je.detail ? e(yn, 1) : e(bn, -1) : e(vn);
	}), D(Vt);
	var xn = L(Vt, 2), Sn = P(xn), Cn = (e) => {
		ob(e, {
			get processors() {
				return Hg.processors;
			},
			get loaded() {
				return Hg.processorsLoaded;
			},
			onadd: (e) => Me(e)
		});
	};
	G(Sn, (e) => {
		z(n) && e(Cn);
	});
	var wn = L(Sn, 2), Tn = P(wn);
	let En;
	var Dn = P(Tn);
	{
		let e = /* @__PURE__ */ j(() => !x && z(d).length > 0), t = /* @__PURE__ */ j(() => z(n) ? ["Delete", "Backspace"] : null);
		qh(Dn, {
			get nodeTypes() {
				return C;
			},
			get edgeTypes() {
				return w;
			},
			get colorMode() {
				return $g.resolved;
			},
			get initialViewport() {
				return x;
			},
			get fitView() {
				return z(e);
			},
			fitViewOptions: {
				maxZoom: 1.1,
				padding: .25
			},
			minZoom: .1,
			maxZoom: 2,
			snapGrid: [8, 8],
			get deleteKey() {
				return z(t);
			},
			get nodesDraggable() {
				return z(n);
			},
			zoomOnDoubleClick: !1,
			get nodesConnectable() {
				return z(n);
			},
			isValidConnection: Ne,
			onbeforeconnect: Pe,
			onmoveend: (e, t) => N(S, t),
			onpaneclick: () => Ee(),
			oninit: () => !x && z(d).length && setTimeout(() => c({
				maxZoom: 1.1,
				padding: .2
			}), 50),
			proOptions: { hideAttribution: !0 },
			get nodes() {
				return z(d);
			},
			set nodes(e) {
				N(d, e);
			},
			get edges() {
				return z(f);
			},
			set edges(e) {
				N(f, e);
			},
			children: (e, t) => {
				var r = LD(), i = F(r);
				yg(i, {
					get variant() {
						return fg.Dots;
					},
					gap: 14,
					size: 1
				});
				var a = L(i, 2);
				{
					let e = /* @__PURE__ */ j(() => z(ye)?.data.node ?? null), t = /* @__PURE__ */ j(() => z(be)?.data?.edge ?? null), r = /* @__PURE__ */ j(() => !z(n));
					AT(a, {
						get node() {
							return z(e);
						},
						get edge() {
							return z(t);
						},
						get readOnly() {
							return z(r);
						},
						onconfigure: () => {
							z(ye) ? Ce(z(ye).id) : z(be) && Te(z(be).id);
						},
						ontoggle: () => z(ye) && E(z(ye).id, { disabled: !z(ye).data.node.disabled }),
						ondelete: () => {
							z(ye) ? Ae(z(ye).id) : z(be) && je(z(be).id);
						}
					});
				}
				U(e, r);
			},
			$$slots: { default: !0 }
		});
	}
	var On = L(Dn, 2), kn = (e) => {
		var t = BD(), r = P(t);
		Uv(r, { size: 28 });
		var i = L(r, 2), a = I(i, !0), o = L(i, 2), s = (e) => {
			U(e, RD());
		}, c = (e) => {
			U(e, zD());
		};
		G(o, (e) => {
			z(n) ? e(s) : e(c, -1);
		}), D(t), R(() => W(a, z(n) ? "Start your flow" : "Empty flow")), U(e, t);
	};
	G(On, (e) => {
		z(d).length === 0 && e(kn);
	}), D(Tn), Ea(Tn, (e) => N(Fe, e), () => z(Fe));
	var An = L(Tn, 2);
	{
		let e = /* @__PURE__ */ j(() => z(ye)?.id ?? null), t = /* @__PURE__ */ j(() => z(ye)?.data.node.name);
		bT(An, {
			get live() {
				return Je;
			},
			get flowId() {
				return o;
			},
			get nodeId() {
				return z(e);
			},
			get nodeName() {
				return z(t);
			},
			getGraph: ae,
			get previewTrigger() {
				return z(wt);
			},
			get issues() {
				return z(ze);
			},
			get validated() {
				return z(Be);
			},
			get histKey() {
				return z(Qe);
			},
			get names() {
				return z(Et);
			},
			onselectnode: (e) => Se(e),
			onselectedge: (e) => Te(e),
			onpreviewresult: pt,
			get canData() {
				return z(i);
			},
			get tab() {
				return z(xt);
			},
			set tab(e) {
				N(xt, e, !0);
			},
			get open() {
				return z(St);
			},
			set open(e) {
				N(St, e, !0);
			},
			get height() {
				return z(Ct);
			},
			set height(e) {
				N(Ct, e, !0);
			}
		});
	}
	D(wn);
	var jn = L(wn, 2), Mn = (e) => {
		var t = H();
		Ci(F(t), () => z(ye).id, (e) => {
			{
				let t = /* @__PURE__ */ j(() => Hg.byType.get(z(ye).data.node.type)), r = /* @__PURE__ */ j(() => z(He).get(z(ye).id) ?? []), a = /* @__PURE__ */ j(() => !z(n)), o = /* @__PURE__ */ j(() => z(ye).data.node.type === "sink.postgres" ? () => z(ye) && we(z(ye).id) : void 0);
				hC(e, {
					get node() {
						return z(ye).data.node;
					},
					get spec() {
						return z(t);
					},
					get issues() {
						return z(r);
					},
					get groups() {
						return z(mt);
					},
					get schemaState() {
						return z(ht);
					},
					onchange: (e) => z(ye) && E(z(ye).id, e),
					onclose: () => Ee(),
					ondelete: () => z(ye) && Ae(z(ye).id),
					onpreview: Tt,
					onreloadschema: () => z(xe) && z(i) && bt(z(xe)),
					get readOnly() {
						return z(a);
					},
					get canData() {
						return z(i);
					},
					get onmapping() {
						return z(o);
					}
				});
			}
		}), U(e, t);
	}, Nn = (e) => {
		{
			let t = /* @__PURE__ */ j(() => z(Et).get(z(be).source) ?? z(be).source), r = /* @__PURE__ */ j(() => z(Et).get(z(be).target) ?? z(be).target), a = /* @__PURE__ */ j(() => Je.edgeStats.get(z(be).id)), o = /* @__PURE__ */ j(() => z(Ue).get(z(be).id) ?? []), s = /* @__PURE__ */ j(() => !z(n)), c = /* @__PURE__ */ j(() => z(i) ? () => Oe(z(be).source) : void 0), l = /* @__PURE__ */ j(() => z(f).filter((e) => z(be) && e.id !== z(be).id && e.source === z(be).source && (e.sourceHandle ?? "success") === (z(be).sourceHandle ?? "success")).map((e) => ({
				toName: z(Et).get(e.target) ?? e.target,
				tables: e.data?.edge.tables
			})));
			OC(e, {
				get edge() {
					return z(be).data.edge;
				},
				get fromName() {
					return z(t);
				},
				get toName() {
					return z(r);
				},
				get stats() {
					return z(a);
				},
				get issues() {
					return z(o);
				},
				onchange: (e) => z(be) && ke(z(be).id, e),
				onclose: () => Ee(),
				ondelete: () => z(be) && je(z(be).id),
				get readOnly() {
					return z(s);
				},
				get loadTables() {
					return z(c);
				},
				get siblings() {
					return z(l);
				}
			});
		}
	};
	G(jn, (e) => {
		z(ye) ? e(Mn) : z(be) && e(Nn, 1);
	}), D(xn), D(Bt), R((e, t) => {
		Y(Ht, "href", e), Ut.readOnly = !z(n), Y(Ut, "size", t), Y(Yt, "title", z(n) ? "Flows that must complete before this one runs" : "Prerequisite flows"), Y(en, "title", z(v).schedule ? `${z(v).scheduleEnabled ? "Runs" : "Paused"}: ${z(v).schedule}` : "Run this flow automatically"), cn.disabled = z(Ve), En = J(Tn, 1, "canvas svelte-xqx3jn", null, En, { drop: z(Ie) });
	}, [() => qg("/flows"), () => Math.max(8, Math.min(48, z(p).length + 1))]), ya(Ut, () => z(p), (e) => N(p, e)), B("click", Yt, () => N(h, !0)), B("click", $t, () => N(_, !0)), B("click", en, () => N(g, !0)), B("click", cn, () => Ge(!0)), Vr("dragover", Tn, Le), Vr("dragleave", Tn, () => N(Ie, !1)), Vr("drop", Tn, Re), U(e, jt), A();
}
Hr(["click"]);
//#endregion
//#region src/routes/CanvasPage.svelte
var UD = /* @__PURE__ */ V("<div class=\"empty\"><h3>Could not open flow</h3><p> </p><a>Back to flows</a></div>"), WD = /* @__PURE__ */ V("<div class=\"loading svelte-6rgn6b\"><!> Loading flow…</div>");
function GD(e, t) {
	k(t, !0);
	let n = /* @__PURE__ */ M(null), r = /* @__PURE__ */ M("");
	Fn(() => {
		let e = t.id;
		N(n, null), N(r, ""), Promise.all([
			Bg.flow(e),
			Hg.loadProcessors().catch((e) => Gg.error(`Processor catalog: ${e.message}`)),
			Hg.loadConnections().catch(() => {}),
			Hg.loadTypes()
		]).then(([e]) => N(n, e), (e) => N(r, e.message, !0));
	});
	var i = H(), a = F(i), o = (e) => {
		var t = UD(), n = L(P(t)), i = I(n, !0), a = L(n);
		D(t), R((e) => {
			W(i, z(r)), Y(a, "href", e);
		}, [() => qg("/flows")]), U(e, t);
	}, s = (e) => {
		var t = WD();
		Lv(P(t), {
			size: 20,
			class: "spin"
		}), O(), D(t), U(e, t);
	}, c = (e) => {
		Jh(e, {
			children: (e, t) => {
				HD(e, { get flow() {
					return z(n);
				} });
			},
			$$slots: { default: !0 }
		});
	};
	G(a, (e) => {
		z(r) ? e(o) : z(n) ? e(c, -1) : e(s, 1);
	}), U(e, i), A();
}
//#endregion
//#region src/lib/components/Toasts.svelte
var KD = /* @__PURE__ */ V("<li> </li>"), qD = /* @__PURE__ */ V("<ul class=\"svelte-r9p0hk\"></ul>"), JD = /* @__PURE__ */ V("<button class=\"more svelte-r9p0hk\"><!> </button> <!>", 1), YD = /* @__PURE__ */ V("<div><!> <div class=\"msg svelte-r9p0hk\"> <!></div> <button class=\"btn ghost sm icon\" aria-label=\"Dismiss\"><!></button></div>"), XD = /* @__PURE__ */ V("<div class=\"toasts svelte-r9p0hk\" aria-live=\"polite\"></div>");
function ZD(e, t) {
	k(t, !0);
	let n = pn({}), r = {
		info: Ov,
		success: ev,
		error: tv,
		warn: wy
	};
	var i = XD();
	K(i, 21, () => Wg.items, (e) => e.id, (e, t) => {
		let i = /* @__PURE__ */ j(() => r[z(t).kind]);
		var a = YD(), o = P(a);
		Pi(o, () => z(i), (e, t) => {
			t(e, { size: 16 });
		});
		var s = L(o, 2), c = P(s), l = L(c), u = (e) => {
			var r = JD(), i = F(r), a = P(i), o = (e) => {
				Y_(e, { size: 12 });
			}, s = (e) => {
				Q_(e, { size: 12 });
			};
			G(a, (e) => {
				n[z(t).id] ? e(o) : e(s, -1);
			});
			var c = L(a);
			D(i);
			var l = L(i, 2), u = (e) => {
				var n = qD();
				K(n, 21, () => z(t).details.lines, Ti, (e, t) => {
					var n = KD(), r = I(n, !0);
					R(() => W(r, z(t))), U(e, n);
				}), D(n), U(e, n);
			};
			G(l, (e) => {
				n[z(t).id] && e(u);
			}), R(() => W(c, ` ${z(t).details.title ?? ""}`)), B("click", i, () => n[z(t).id] = !n[z(t).id]), U(e, r);
		};
		G(l, (e) => {
			z(t).details?.lines.length && e(u);
		}), D(s);
		var d = L(s, 2);
		Ny(P(d), { size: 13 }), D(d), D(a), R(() => {
			J(a, 1, `toast ${z(t).kind ?? ""}`, "svelte-r9p0hk"), W(c, `${z(t).message ?? ""} `);
		}), B("click", d, () => Wg.dismiss(z(t).id)), U(e, a);
	}), D(i), U(e, i), A();
}
Hr(["click"]);
//#endregion
//#region src/lib/components/ConfirmDialog.svelte
var QD = /* @__PURE__ */ V("<span class=\"spacer\"></span> <button class=\"btn\">Cancel</button> <button> </button>", 1), $D = /* @__PURE__ */ V("<p class=\"msg svelte-7e0w24\"> </p>");
function eO(e, t) {
	k(t, !0);
	let n = /* @__PURE__ */ M(void 0);
	Fn(() => {
		gw.current && queueMicrotask(() => z(n)?.focus());
	});
	var r = H(), i = F(r), a = (e) => {
		let t = /* @__PURE__ */ j(() => gw.current);
		Ib(e, {
			get title() {
				return z(t).title;
			},
			width: "420px",
			onclose: () => gw.answer(!1),
			footer: (e) => {
				var r = QD(), i = L(F(r), 2), a = L(i, 2), o = I(a, !0);
				Ea(a, (e) => N(n, e), () => z(n)), R(() => {
					J(a, 1, `btn ${z(t).danger ? "danger solid" : "primary"}`), W(o, z(t).confirmLabel ?? "Confirm");
				}), B("click", i, () => gw.answer(!1)), B("click", a, () => gw.answer(!0)), U(e, r);
			},
			children: (e, n) => {
				var r = $D(), i = I(r, !0);
				R(() => W(i, z(t).message)), U(e, r);
			},
			$$slots: {
				footer: !0,
				default: !0
			}
		});
	};
	G(i, (e) => {
		gw.current && e(a);
	}), U(e, r), A();
}
Hr(["click"]);
//#endregion
//#region src/islands/Canvas.svelte
var tO = /* @__PURE__ */ V("<div class=\"loading svelte-zclmyw\"><!> Loading flow…</div>"), nO = /* @__PURE__ */ V("<!> <!> <!>", 1);
function rO(e, t) {
	k(t, !0), n_.load();
	var n = nO(), r = F(n), i = (e) => {
		GD(e, { get id() {
			return t.id;
		} });
	}, a = (e) => {
		var t = tO();
		Lv(P(t), {
			size: 20,
			class: "spin"
		}), O(), D(t), U(e, t);
	};
	G(r, (e) => {
		n_.loaded ? e(i) : e(a, -1);
	});
	var o = L(r, 2);
	ZD(o, {}), eO(L(o, 2), {}), U(e, n), A();
}
//#endregion
//#region src/lib/flows/DepNode.svelte
var iO = /* @__PURE__ */ V("<div class=\"sub svelte-1urh2da\"> </div>"), aO = /* @__PURE__ */ V("<div><div class=\"top svelte-1urh2da\"><span class=\"dot svelte-1urh2da\"></span> <span class=\"name svelte-1urh2da\"> </span></div> <!> <!> <!></div>");
function oO(e, t) {
	k(t, !0);
	let n = /* @__PURE__ */ j(() => t.data.run?.status ?? "never"), r = /* @__PURE__ */ j(() => t.data.run ? z(n) === "pending" ? t.data.waiting.length ? `waiting for ${t.data.waiting.join(", ")}` : "queued" : z(n) === "failed" || z(n) === "stopped" ? t.data.run.error ?? z(n) : `${i_(t.data.run.rowsWritten)} rows written` : "never run");
	var i = aO();
	let a;
	var o = P(i), s = I(L(P(o), 2), !0);
	D(o);
	var c = L(o, 2), l = (e) => {
		var t = iO(), n = I(t, !0);
		R(() => W(n, z(r))), U(e, t);
	};
	G(c, (e) => {
		t.data.compact || e(l);
	});
	var u = L(c, 2), d = (e) => {
		om(e, {
			type: "target",
			get position() {
				return Od.Left;
			},
			isConnectable: !1,
			class: "dh"
		});
	};
	G(u, (e) => {
		t.data.hasIn && e(d);
	});
	var f = L(u, 2), p = (e) => {
		om(e, {
			type: "source",
			get position() {
				return Od.Right;
			},
			isConnectable: !1,
			class: "dh"
		});
	};
	G(f, (e) => {
		t.data.hasOut && e(p);
	}), D(i), R(() => {
		a = J(i, 1, `dn ${z(n) ?? ""}`, "svelte-1urh2da", a, {
			compact: t.data.compact,
			dim: t.data.dim,
			hit: t.data.hit
		}), Y(i, "title", `${t.data.name ?? ""}\\n${z(r) ?? ""}`), W(s, t.data.name);
	}), U(e, i), A();
}
//#endregion
//#region src/lib/flows/LaneNode.svelte
var sO = /* @__PURE__ */ V("<span class=\"pip running svelte-1x3e4hf\"> </span>"), cO = /* @__PURE__ */ V("<span class=\"pip failed svelte-1x3e4hf\"> </span>"), lO = /* @__PURE__ */ V("<span class=\"pip completed svelte-1x3e4hf\"> </span>"), uO = /* @__PURE__ */ V("<span class=\"pip svelte-1x3e4hf\">never run</span>"), dO = /* @__PURE__ */ V("<div class=\"pips svelte-1x3e4hf\"><!> <!> <!> <!></div>"), fO = /* @__PURE__ */ V("<div><button class=\"hd svelte-1x3e4hf\"><!> <!> <span class=\"nm svelte-1x3e4hf\"> </span> <span class=\"n svelte-1x3e4hf\"> </span></button> <!> <!> <!></div>");
function pO(e, t) {
	k(t, !0);
	let n = /* @__PURE__ */ j(() => t.data.counts.running ? "running" : t.data.counts.failed ? "failed" : t.data.counts.completed === t.data.counts.total ? "completed" : "never");
	var r = fO();
	let i;
	var a = P(r), o = P(a), s = (e) => {
		Q_(e, { size: 12 });
	}, c = (e) => {
		Y_(e, { size: 12 });
	};
	G(o, (e) => {
		t.data.collapsed ? e(s) : e(c, -1);
	});
	var l = L(o, 2);
	_v(l, { size: 12 });
	var u = L(l, 2), d = I(u, !0), f = I(L(u, 2), !0);
	D(a);
	var p = L(a, 2), m = (e) => {
		var n = dO(), r = P(n), i = (e) => {
			var n = sO(), r = I(n);
			R(() => W(r, `${t.data.counts.running ?? ""} running`)), U(e, n);
		};
		G(r, (e) => {
			t.data.counts.running && e(i);
		});
		var a = L(r, 2), o = (e) => {
			var n = cO(), r = I(n);
			R(() => W(r, `${t.data.counts.failed ?? ""} failed`)), U(e, n);
		};
		G(a, (e) => {
			t.data.counts.failed && e(o);
		});
		var s = L(a, 2), c = (e) => {
			var n = lO(), r = I(n);
			R(() => W(r, `${t.data.counts.completed ?? ""} done`)), U(e, n);
		};
		G(s, (e) => {
			t.data.counts.completed && e(c);
		});
		var l = L(s, 2), u = (e) => {
			U(e, uO());
		};
		G(l, (e) => {
			!t.data.counts.running && !t.data.counts.failed && !t.data.counts.completed && e(u);
		}), D(n), U(e, n);
	};
	G(p, (e) => {
		t.data.collapsed && e(m);
	});
	var h = L(p, 2);
	om(h, {
		type: "target",
		get position() {
			return Od.Left;
		},
		isConnectable: !1,
		class: "dh"
	}), om(L(h, 2), {
		type: "source",
		get position() {
			return Od.Right;
		},
		isConnectable: !1,
		class: "dh"
	}), D(r), R(() => {
		i = J(r, 1, `lane ${z(n) ?? ""}`, "svelte-1x3e4hf", i, { folded: t.data.collapsed }), Y(a, "title", t.data.collapsed ? `Open ${t.data.name}` : `Collapse ${t.data.name}`), W(d, t.data.name), W(f, t.data.counts.total);
	}), B("click", a, (e) => (e.stopPropagation(), t.data.ontoggle(t.data.path))), U(e, r), A();
}
Hr(["click"]);
//#endregion
//#region src/lib/flows/folders.ts
function mO(e) {
	return e.split("/").map((e) => e.trim()).filter(Boolean).join("/");
}
var hO = 42, gO = 12, _O = 12, vO = 26, yO = 70, bO = 30;
function xO(e, t) {
	let n = mO(e.folder ?? "");
	if (!n) return "";
	if (!t) return n.split("/")[0];
	if (n === t) return t;
	let r = n.slice(t.length + 1);
	return t + "/" + r.split("/")[0];
}
function SO(e, t) {
	let n = t;
	for (let t = 0; t < 16; t++) {
		let t = new Set(e.map((e) => xO(e, n)));
		if (t.size !== 1) return n;
		let r = [...t][0];
		if (r === "" || r === n) return n;
		n = r;
	}
	return n;
}
function CO(e, t) {
	let n = SO(e, t), r = /* @__PURE__ */ new Map();
	for (let t of e) {
		let e = xO(t, n);
		(r.get(e) ?? r.set(e, []).get(e)).push(t);
	}
	return [...r.entries()].map(([e, t]) => ({
		path: e,
		name: e === "" ? "Ungrouped" : e === n ? e.split("/").pop() : e.slice(n ? n.length + 1 : 0),
		flows: t.sort((e, t) => e.name.localeCompare(t.name))
	})).sort((e, t) => e.path === "" ? 1 : t.path === "" ? -1 : e.name.localeCompare(t.name));
}
function wO(e, t) {
	let n = new Set(e), r = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Set(), a = (e) => {
		let o = r.get(e);
		if (o !== void 0) return o;
		if (i.has(e)) return 0;
		i.add(e);
		let s = t(e).filter((e) => n.has(e)), c = s.length ? 1 + Math.max(...s.map(a)) : 0;
		return i.delete(e), r.set(e, c), c;
	};
	for (let t of e) a(t);
	return r;
}
function TO(e, t) {
	let n = /* @__PURE__ */ new Map();
	e[0]?.forEach((e, t) => n.set(e, t));
	for (let r = 1; r < e.length; r++) {
		let i = e[r], a = /* @__PURE__ */ new Map();
		i.forEach((e, r) => {
			let i = t(e).filter((e) => n.has(e));
			a.set(e, i.length ? i.reduce((e, t) => e + n.get(t), 0) / i.length : r);
		}), i.sort((e, t) => a.get(e) - a.get(t) || 0), i.forEach((e, t) => n.set(e, t));
	}
	return e;
}
function EO(e, t) {
	let n = wO(e, t), r = [];
	for (let t of e) {
		let e = n.get(t) ?? 0;
		(r[e] ??= []).push(t);
	}
	for (let e = 0; e < r.length; e++) r[e] ??= [];
	return TO(r, t);
}
function DO(e, t, n) {
	let r = CO(e, t), i = /* @__PURE__ */ new Map();
	for (let e of r) for (let t of e.flows) i.set(t.id, e.path);
	let a = new Set(e.map((e) => e.id)), o = (e) => (e.dependsOn ?? []).filter((e) => a.has(e)), s = new Map(r.map((e) => [e.path, /* @__PURE__ */ new Set()]));
	for (let t of e) {
		let e = i.get(t.id);
		for (let n of o(t)) {
			let t = i.get(n);
			t !== e && s.get(e).add(t);
		}
	}
	let c = /* @__PURE__ */ new Map();
	for (let e of r) {
		if (n.has(e.path)) {
			c.set(e.path, {
				w: 210,
				h: 58,
				at: /* @__PURE__ */ new Map()
			});
			continue;
		}
		let t = e.flows.map((e) => e.id), r = new Map(e.flows.map((e) => [e.id, e])), a = EO(t, (t) => o(r.get(t)).filter((t) => i.get(t) === e.path)), s = /* @__PURE__ */ new Map(), l = 0;
		a.forEach((e, t) => {
			e.forEach((e, n) => {
				s.set(e, {
					x: _O + t * 212,
					y: vO + n * 46
				});
			}), l = Math.max(l, e.length);
		}), c.set(e.path, {
			w: 24 + Math.max(1, a.length) * 170 + Math.max(0, a.length - 1) * hO,
			h: 38 + Math.max(1, l) * 34 + Math.max(0, l - 1) * gO,
			at: s
		});
	}
	let l = EO(r.map((e) => e.path), (e) => [...s.get(e) ?? []]), u = [], d = [], f = 0;
	for (let e of l) {
		let t = Math.max(0, ...e.map((e) => c.get(e).w)), i = 0;
		for (let t of e) {
			let e = r.find((e) => e.path === t), a = c.get(t);
			u.push({
				lane: e,
				collapsed: n.has(t),
				x: f,
				y: i,
				w: a.w,
				h: a.h
			});
			for (let n of e.flows) {
				let e = a.at.get(n.id);
				e && d.push({
					flow: n,
					lane: t,
					x: e.x,
					y: e.y
				});
			}
			i += a.h + bO;
		}
		f += t + yO;
	}
	return {
		lanes: u,
		flows: d
	};
}
function OO(e, t, n, r) {
	let i = new Set(e.map((e) => e.id)), a = /* @__PURE__ */ new Map();
	for (let n of CO(e, t)) for (let e of n.flows) a.set(e.id, n.path);
	let o = (e) => {
		let t = a.get(e);
		return n.has(t) ? `lane:${t}` : e;
	}, s = /* @__PURE__ */ new Map();
	for (let t of e) for (let e of (t.dependsOn ?? []).filter((e) => i.has(e))) {
		let n = o(e), i = o(t.id);
		if (n === i) continue;
		let a = `${n}->${i}`, c = s.get(a);
		c ? (c.count++, c.running ||= r(e)) : s.set(a, {
			id: a,
			source: n,
			target: i,
			count: 1,
			bundled: n.startsWith("lane:") || i.startsWith("lane:"),
			running: r(e)
		});
	}
	return [...s.values()];
}
//#endregion
//#region src/lib/flows/DepGraph.svelte
var kO = /* @__PURE__ */ V("<div class=\"empty small\">No flows.</div>"), AO = /* @__PURE__ */ V("<!> <!>", 1), jO = /* @__PURE__ */ V("<!> <div class=\"lanebar svelte-1n7wfla\"><button class=\"lb svelte-1n7wfla\">Collapse all</button> <button class=\"lb svelte-1n7wfla\">Expand all</button> <span class=\"muted tiny\"> </span></div>", 1), MO = /* @__PURE__ */ V("<div class=\"dag svelte-1n7wfla\"><!></div>");
function NO(e, t) {
	k(t, !0);
	let n = Q(t, "scope", 3, ""), r = Q(t, "highlight", 3, ""), i = {
		dep: oO,
		lane: pO
	}, a = "nifi.graphFolded", { fitView: o } = Ah(), s = (() => {
		try {
			let e = localStorage.getItem(a);
			return e === null ? null : JSON.parse(e);
		} catch {
			return null;
		}
	})(), c = /* @__PURE__ */ M(pn(new Set(s ?? []))), l = s !== null;
	function u(e) {
		let t = new Set(z(c));
		t.has(e) ? t.delete(e) : t.add(e), N(c, t, !0);
		try {
			localStorage.setItem(a, JSON.stringify([...t]));
		} catch {}
	}
	let d = /* @__PURE__ */ M([]), f = /* @__PURE__ */ M([]);
	Fn(() => {
		!l && t.flows.length && (l = !0, N(c, new Set(CO(t.flows, n()).map((e) => e.path)), !0));
	});
	let p = (e) => !!r() && e.name.toLowerCase().includes(r().toLowerCase());
	Fn(() => {
		let e = new Map(t.flows.map((e) => [e.id, e])), i = (e) => {
			let n = t.runs.get(e)?.status;
			return n === "running" || n === "stopping";
		}, { lanes: a, flows: o } = DO(t.flows, n(), z(c)), s = a.map((e) => {
			let n = {
				total: e.lane.flows.length,
				running: 0,
				failed: 0,
				completed: 0
			};
			for (let r of e.lane.flows) {
				let e = t.runs.get(r.id)?.status;
				e === "running" || e === "stopping" || e === "pending" || e === "paused" ? n.running++ : e === "failed" ? n.failed++ : e === "completed" && n.completed++;
			}
			return {
				id: `lane:${e.lane.path}`,
				type: "lane",
				position: {
					x: e.x,
					y: e.y
				},
				width: e.collapsed ? 210 : e.w,
				height: e.collapsed ? 58 : e.h,
				data: {
					name: e.lane.name,
					path: e.lane.path,
					collapsed: e.collapsed,
					counts: n,
					ontoggle: u
				},
				draggable: !1,
				connectable: !1,
				selectable: !1,
				zIndex: 0
			};
		}), l = new Set(t.flows.flatMap((e) => e.dependsOn ?? []));
		for (let n of o) s.push({
			id: n.flow.id,
			type: "dep",
			parentId: `lane:${n.lane}`,
			extent: "parent",
			position: {
				x: n.x,
				y: n.y
			},
			width: 170,
			height: 34,
			data: {
				name: n.flow.name,
				run: t.runs.get(n.flow.id),
				waiting: wD(n.flow, e, t.runs),
				hasIn: (n.flow.dependsOn ?? []).length > 0,
				hasOut: l.has(n.flow.id),
				compact: !0,
				dim: !!r() && !p(n.flow),
				hit: p(n.flow)
			},
			draggable: !1,
			connectable: !1,
			zIndex: 1
		});
		N(d, s), N(f, OO(t.flows, n(), z(c), i).map((e) => ({
			id: e.id,
			source: e.source,
			target: e.target,
			type: "smoothstep",
			animated: e.running,
			label: e.count > 1 ? String(e.count) : void 0,
			labelBgPadding: [4, 2],
			markerEnd: {
				type: Dd.ArrowClosed,
				width: 14,
				height: 14,
				color: "#98a2b3"
			},
			style: `stroke: var(--edge); stroke-width: ${e.bundled ? Math.min(1.5 + e.count * .7, 5) : 1.5}px;`,
			zIndex: 2
		})));
	});
	let m = /* @__PURE__ */ j(() => `${n()}|${[...z(c)].sort().join(",")}|${t.flows.length}`);
	Fn(() => {
		z(m);
		let e = !0;
		return Ar().then(() => requestAnimationFrame(() => requestAnimationFrame(() => e && o({
			padding: .12,
			maxZoom: 1.1,
			duration: 250
		})))), () => {
			e = !1;
		};
	});
	let h = /* @__PURE__ */ j(() => CO(t.flows, n()).length);
	var g = MO(), _ = P(g), v = (e) => {
		U(e, kO());
	}, y = (e) => {
		var r = jO(), a = F(r);
		qh(a, {
			get nodeTypes() {
				return i;
			},
			get colorMode() {
				return $g.resolved;
			},
			fitView: !0,
			fitViewOptions: {
				padding: .12,
				maxZoom: 1.1
			},
			nodesDraggable: !1,
			nodesConnectable: !1,
			elementsSelectable: !1,
			deleteKey: null,
			minZoom: .1,
			onnodeclick: ({ node: e }) => e.type === "dep" && Kg(`/flows/${e.id}`),
			proOptions: { hideAttribution: !0 },
			get nodes() {
				return z(d);
			},
			set nodes(e) {
				N(d, e);
			},
			get edges() {
				return z(f);
			},
			set edges(e) {
				N(f, e);
			},
			children: (e, t) => {
				var n = AO(), r = F(n);
				yg(r, {
					get variant() {
						return fg.Dots;
					},
					gap: 14,
					size: 1
				}), dg(L(r, 2), {
					showLock: !1,
					fitViewOptions: {
						padding: .12,
						maxZoom: 1.1
					}
				}), U(e, n);
			},
			$$slots: { default: !0 }
		});
		var o = L(a, 2), s = P(o), l = L(s, 2), u = I(L(l, 2));
		D(o), R(() => W(u, `${z(h) ?? ""} folder${z(h) === 1 ? "" : "s"}`)), B("click", s, () => N(c, new Set(CO(t.flows, n()).map((e) => e.path)), !0)), B("click", l, () => N(c, /* @__PURE__ */ new Set(), !0)), U(e, r);
	};
	G(_, (e) => {
		t.flows.length === 0 ? e(v) : e(y, -1);
	}), D(g), U(e, g), A();
}
Hr(["click"]);
//#endregion
//#region src/islands/DepGraph.svelte
function PO(e, t) {
	k(t, !0);
	let n = Q(t, "flows", 19, () => []), r = Q(t, "scope", 3, ""), i = Q(t, "highlight", 3, ""), a = /* @__PURE__ */ j(() => n().map((e) => ({
		...e,
		description: "",
		graph: null,
		createdAt: "",
		updatedAt: ""
	}))), o = /* @__PURE__ */ j(() => new Map(n().map((e) => [e.id, e.run])));
	Jh(e, {
		children: (e, t) => {
			NO(e, {
				get flows() {
					return z(a);
				},
				get runs() {
					return z(o);
				},
				get scope() {
					return r();
				},
				get highlight() {
					return i();
				}
			});
		},
		$$slots: { default: !0 }
	}), A();
}
//#endregion
//#region src/islands.svelte.ts
var FO = {
	canvas: rO,
	depgraph: PO
}, IO = !1;
function LO() {
	if (IO) return;
	IO = !0;
	let e = document.createElement("link");
	e.rel = "stylesheet", e.href = new URL(
		/* @vite-ignore */
		"./islands.css",
		import.meta.url
	).href, document.head.appendChild(e);
}
function RO(e, t, n) {
	let r = FO[t];
	if (!r) throw Error(`no island named ${t}`);
	LO(), e.classList.add("nifi-island");
	let i = pn({ ...n });
	e.addEventListener("nifi:props", (e) => Object.assign(i, e.detail)), pi(r, {
		target: e,
		props: i
	});
}
//#endregion
export { RO as mount };
