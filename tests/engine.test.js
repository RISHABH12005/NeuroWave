'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const E = require('../engine.js');

/* ---------- Part 1: real audio rendering (node-web-audio-api's OfflineAudioContext) ---------- */
const { OfflineAudioContext } = require('node-web-audio-api');

test('band table matches the specified EEG ranges', () => {
  const want = { delta: [0.5, 4], theta: [4, 8], alpha: [8, 13], beta: [13, 30], gamma: [30, 100] };
  assert.equal(E.BANDS.length, 5);
  for (const b of E.BANDS) assert.deepEqual([b.min, b.max], want[b.id], b.id);
  assert.deepEqual([E.CARRIER.min, E.CARRIER.def, E.CARRIER.max], [100, 200, 500]);
});

for (const carrier of [100, 200, 500]) {
  test(`measured channel frequencies: all bands, min/mid/max beat, carrier ${carrier} Hz`, async () => {
    const rows = await E.runChannelSuite(OfflineAudioContext, carrier, { tolerance: 0.02 });
    assert.equal(rows.length, 15);
    for (const r of rows) {
      console.log(`  ${r.band.padEnd(6)} beat ${String(r.beat).padEnd(5)} L ${r.left.toFixed(3)}  R ${r.right.toFixed(3)}  R-L ${r.diff.toFixed(3)}`);
      assert.ok(r.ok, `${r.band} beat ${r.beat}: L=${r.left} R=${r.right} diff=${r.diff}`);
    }
  });
}

async function render(muteL, muteR) {
  const sr = 44100, ctx = new OfflineAudioContext(2, sr * 2, sr);
  const n = E.buildGraph(ctx, ctx.destination, 200, 10);
  n.master.gain.value = 1; if (muteL) n.gL.gain.value = 0; if (muteR) n.gR.gain.value = 0;
  n.oL.start(); n.oR.start();
  return ctx.startRendering();
}
const peak = (d) => d.reduce((m, x) => Math.max(m, Math.abs(x)), 0);

test('channel isolation: left oscillator only reaches left output, right only right (no mono mix)', async () => {
  const noR = await render(false, true), noL = await render(true, false);
  assert.ok(peak(noR.getChannelData(0)) > 0.9, 'left carries left oscillator');
  assert.ok(peak(noR.getChannelData(1)) < 1e-6, 'right is silent when right oscillator is muted');
  assert.ok(peak(noL.getChannelData(1)) > 0.9, 'right carries right oscillator');
  assert.ok(peak(noL.getChannelData(0)) < 1e-6, 'left is silent when left oscillator is muted');
});

/* ---------- Part 2: lifecycle tests with a deterministic fake AudioContext and clock ---------- */
function makeEnv(mode = 'normal') {
  let t = 0, id = 0; const timers = new Map(), env = { contexts: [], mode, errors: [], states: [] };
  env.clock = {
    now: () => t, pending: () => timers.size,
    setTimeout: (f, ms) => { const i = ++id; timers.set(i, { f, at: t + ms, every: 0 }); return i; },
    setInterval: (f, ms) => { const i = ++id; timers.set(i, { f, at: t + ms, every: ms }); return i; },
    clearTimeout: (i) => timers.delete(i), clearInterval: (i) => timers.delete(i),
    advance(ms) {
      const end = t + ms;
      for (;;) {
        let next = null, ni = 0;
        for (const [i, x] of timers) if (x.at <= end && (!next || x.at < next.at)) { next = x; ni = i; }
        if (!next) break;
        t = Math.max(t, next.at); if (next.every) next.at += next.every; else timers.delete(ni); next.f();
      }
      t = end;
    }
  };
  class Param { constructor(v = 0) { this.value = v; this.ramps = []; } setValueAtTime(v) { this.value = v; } cancelScheduledValues() {}
    linearRampToValueAtTime(v, at) { this.ramps.push({ v, at }); } get last() { return this.ramps[this.ramps.length - 1]; } }
  class Node { constructor(ctx, kind) { this.ctx = ctx; this.kind = kind; ctx.nodes.push(this); if (kind === 'osc' || kind === 'gain') this[kind === 'osc' ? 'frequency' : 'gain'] = new Param(); }
    connect(dst, o = 0, i = 0) { this.ctx.edges.push({ from: this, to: dst, o, i }); return dst; }
    disconnect() { this.disconnected = true; } start() { this.started = true; } stop() { this.stopped = true; } }
  env.AC = class {
    constructor() { this.nodes = []; this.edges = []; this.sampleRate = 48000; this.closeCalls = 0; this.suspendCalls = 0;
      this.state = env.mode === 'normal' ? 'running' : 'suspended'; this.destination = new Node(this, 'dest'); env.contexts.push(this); }
    get currentTime() { return t / 1000; }
    createOscillator() { return new Node(this, 'osc'); } createGain() { return new Node(this, 'gain'); }
    createChannelMerger() { return new Node(this, 'merger'); } createAnalyser() { return new Node(this, 'analyser'); }
    async resume() { if (env.mode === 'reject') { const e = new Error('no gesture'); e.name = 'NotAllowedError'; throw e; }
      if (env.mode !== 'blocked') { this.state = 'running'; if (this.onstatechange) this.onstatechange(); } }
    async suspend() { this.suspendCalls++; this.state = 'suspended'; if (this.onstatechange) this.onstatechange(); }
    async close() { this.closeCalls++; this.state = 'closed'; }
  };
  env.session = new E.Session({ AudioContext: env.AC, now: env.clock.now, setTimeout: env.clock.setTimeout, clearTimeout: env.clock.clearTimeout,
    setInterval: env.clock.setInterval, clearInterval: env.clock.clearInterval,
    onError: (c) => { if (c) env.errors.push(c); }, onChange: (s) => env.states.push(s.state) });
  env.osc = (c, i) => c.nodes.filter((n) => n.kind === 'osc')[i];
  env.master = (c) => c.nodes.filter((n) => n.kind === 'gain')[2];
  return env;
}
const idleClean = (e) => { assert.equal(e.session.state, 'idle'); assert.equal(e.clock.pending(), 0, 'no timers left'); assert.equal(e.session.ctx, null); };

test('graph wiring: left chain -> merger input 0, right chain -> merger input 1, frequencies 200 / 210', async () => {
  const e = makeEnv(); await e.session.play(); const c = e.contexts[0];
  const merger = c.nodes.find((n) => n.kind === 'merger');
  const into = c.edges.filter((x) => x.to === merger).sort((a, b) => a.i - b.i);
  assert.equal(into.length, 2); assert.deepEqual(into.map((x) => x.o), [0, 0]); assert.deepEqual(into.map((x) => x.i), [0, 1]);
  assert.equal(e.osc(c, 0).frequency.value, 200); assert.equal(e.osc(c, 1).frequency.value, 210);
  e.session.hardStop();
});

test('play / pause / resume / stop cycle with fades and full cleanup', async () => {
  const e = makeEnv(), s = e.session; await s.play(); const c = e.contexts[0];
  assert.equal(s.state, 'playing'); assert.ok(Math.abs(e.master(c).gain.last.v - 0.125) < 1e-9); assert.ok(e.master(c).gain.last.at >= 1.5);
  e.clock.advance(1000); s.pause(); assert.equal(s.state, 'paused'); assert.equal(e.master(c).gain.last.v, 0);
  e.clock.advance(500); assert.equal(c.suspendCalls, 1); const frozen = s.elapsed; e.clock.advance(2000); assert.equal(s.elapsed, frozen, 'timer frozen while paused');
  await s.resume(); assert.equal(s.state, 'playing'); assert.ok(e.master(c).gain.last.v > 0);
  s.stop(); assert.equal(s.state, 'stopping'); assert.equal(e.master(c).gain.last.v, 0);
  e.clock.advance(1000); idleClean(e); assert.equal(c.closeCalls, 1); assert.ok(e.osc(c, 0).stopped && e.osc(c, 1).stopped);
});

test('rapid Play clicks create a single context; Play is ignored while stopping', async () => {
  const e = makeEnv(), s = e.session;
  await Promise.all([s.play(), s.play(), s.play()]); assert.equal(e.contexts.length, 1);
  s.stop(); assert.equal(await s.play(), false); assert.equal(e.contexts.length, 1);
  e.clock.advance(1000); idleClean(e); assert.equal(await s.play(), true); assert.equal(e.contexts.length, 2); s.hardStop();
});

test('Stop while the context is still starting leaves nothing running', async () => {
  const e = makeEnv('suspended'); const p = e.session.play(); assert.equal(e.session.state, 'starting');
  e.session.stop(); await p; idleClean(e); assert.equal(e.contexts[0].closeCalls, 1); assert.equal(e.contexts[0].nodes.filter((n) => n.started).length, 0);
});

test('autoplay blocked (context stays suspended) and rejected resume are reported and cleaned up', async () => {
  for (const [mode, code] of [['blocked', 'blocked'], ['reject', 'blocked']]) {
    const e = makeEnv(mode); assert.equal(await e.session.play(), false); assert.deepEqual(e.errors, [code]); idleClean(e); assert.ok(e.contexts[0].closeCalls >= 1);
  }
});

test('suspended context is resumed by Play (user gesture) and starts normally', async () => {
  const e = makeEnv('suspended'); assert.equal(await e.session.play(), true); assert.equal(e.session.state, 'playing'); e.session.hardStop(); idleClean(e);
});

test('switching band during playback stops audio and resets the beat to the new band default', async () => {
  const e = makeEnv(), s = e.session; await s.play(); const c = e.contexts[0];
  assert.ok(s.setBand('theta')); assert.equal(s.state, 'stopping'); assert.equal(s.beat, 6);
  e.clock.advance(500); idleClean(e); assert.equal(c.closeCalls, 1);
});

test('session timer expiry stops playback after the chosen duration', async () => {
  const e = makeEnv(), s = e.session; s.setDuration(5); await s.play();
  e.clock.advance(4800); assert.equal(s.state, 'playing'); e.clock.advance(500); assert.equal(s.state, 'stopping'); assert.equal(s.elapsed, 5);
  e.clock.advance(1000); idleClean(e);
});

test('volume, carrier and beat changes apply live; invalid values are rejected', async () => {
  const e = makeEnv(), s = e.session; await s.play(); const c = e.contexts[0]; e.clock.advance(2000);
  assert.ok(s.setVolume(50)); assert.ok(Math.abs(e.master(c).gain.last.v - 0.25) < 1e-9);
  assert.ok(s.setCarrier(300)); assert.equal(e.osc(c, 0).frequency.last.v, 300); assert.equal(e.osc(c, 1).frequency.last.v, 310);
  assert.ok(s.setBeat(12)); assert.equal(e.osc(c, 1).frequency.last.v, 312);
  assert.equal(s.setBeat(20), false); assert.equal(s.setBeat(NaN), false); assert.equal(s.beat, 12);
  assert.equal(s.setCarrier(99), false); assert.equal(s.setCarrier(501), false); assert.equal(s.carrier, 300);
  s.hardStop(); idleClean(e);
});

test('no stale callbacks: Pause then immediate Stop never suspends the context', async () => {
  const e = makeEnv(), s = e.session; await s.play(); const c = e.contexts[0];
  s.pause(); e.clock.advance(100); s.stop(); e.clock.advance(3000); idleClean(e); assert.equal(c.suspendCalls, 0);
});

test('system interruption silences audio and shows Paused until the user resumes', async () => {
  const e = makeEnv(), s = e.session; await s.play(); const c = e.contexts[0];
  c.state = 'interrupted'; c.onstatechange(); assert.equal(s.state, 'paused'); assert.deepEqual(e.errors, ['interrupted']); assert.equal(e.master(c).gain.value, 0);
  await s.resume(); assert.equal(s.state, 'playing'); s.hardStop();
});

test('Gamma: beats above 30 Hz need the experimental option; turning it off stops playback', async () => {
  const e = makeEnv(), s = e.session; s.setBand('gamma'); assert.equal(s.beat, 40);
  assert.deepEqual([s.band.min, s.band.max], [30, 100], 'band range is not silently changed');
  assert.equal(await s.play(), false); assert.deepEqual(e.errors, ['experimental']);
  s.setExperimental(true); assert.equal(await s.play(), true);
  s.setExperimental(false); assert.equal(s.state, 'stopping'); e.clock.advance(1000); idleClean(e);
  assert.ok(s.setBeat(30)); assert.equal(await s.play(), true); s.hardStop();
});

test('dispose (page exit) tears everything down immediately', async () => {
  const e = makeEnv(), s = e.session; await s.play(); s.dispose(); idleClean(e); assert.equal(e.contexts[0].closeCalls, 1);
});
