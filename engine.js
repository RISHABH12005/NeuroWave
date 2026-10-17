/* NeuroWave audio engine: band data, audio graph, frequency measurement and the playback Session.
   Works in browsers (window.NeuroEngine) and Node (require) so the same code is unit tested. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.NeuroEngine = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  // Approximate EEG ranges. Boundaries differ between sources and overlap in practice.
  var BANDS = [
    { id: 'delta', name: 'Delta', min: 0.5, max: 4, def: 2, color: '#6c86d9', desc: 'Associated with deep sleep.' },
    { id: 'theta', name: 'Theta', min: 4, max: 8, def: 6, color: '#a283d6', desc: 'Associated with drowsiness and some memory processes.' },
    { id: 'alpha', name: 'Alpha', min: 8, max: 13, def: 10, color: '#4fb5a5', desc: 'Associated with relaxed wakefulness.' },
    { id: 'beta', name: 'Beta', min: 13, max: 30, def: 20, color: '#d6a24f', desc: 'Associated with alertness and active thinking.' },
    { id: 'gamma', name: 'Gamma', min: 30, max: 100, def: 40, color: '#d9707f', desc: 'Associated with attention and information processing.' }
  ];
  var CARRIER = { min: 100, max: 500, def: 200 };
  var RECOMMENDED = { min: 1, max: 30 }; // beat differences usually heard as a clear binaural beat
  var FADE_IN = 1.5, FADE_OUT = 0.8, MAX_GAIN = 0.5;
  function noop() {}
  function bandById(id) { return BANDS.filter(function (b) { return b.id === id; })[0]; }
  function beatAllowed(beat, experimental) { return beat <= RECOMMENDED.max || !!experimental; }

  // Left oscillator = carrier, right oscillator = carrier + beat. A ChannelMerger keeps them on separate outputs.
  function buildGraph(ctx, dest, carrier, beat) {
    var merger = ctx.createChannelMerger(2);
    merger.channelInterpretation = 'discrete';
    var oL = ctx.createOscillator(), oR = ctx.createOscillator();
    oL.type = 'sine'; oR.type = 'sine';
    oL.frequency.value = carrier; oR.frequency.value = carrier + beat;
    var gL = ctx.createGain(), gR = ctx.createGain(); gL.gain.value = 1; gR.gain.value = 1;
    var master = ctx.createGain(); master.gain.value = 0;
    var aL = ctx.createAnalyser(), aR = ctx.createAnalyser(); aL.fftSize = 2048; aR.fftSize = 2048;
    oL.connect(gL); gL.connect(aL); aL.connect(merger, 0, 0); // merger input 0 = left output
    oR.connect(gR); gR.connect(aR); aR.connect(merger, 0, 1); // merger input 1 = right output
    merger.connect(master); master.connect(dest);
    return { oL: oL, oR: oR, gL: gL, gR: gR, master: master, aL: aL, aR: aR, merger: merger };
  }

  // Frequency from positive-going zero crossings with linear interpolation (independent of the engine).
  function crossFreq(d, sr) {
    var first = null, last = null, n = 0;
    for (var i = 1; i < d.length; i++) {
      if (d[i - 1] < 0 && d[i] >= 0) {
        var t = (i - 1 + (-d[i - 1]) / (d[i] - d[i - 1])) / sr;
        if (first === null) first = t; last = t; n++;
      }
    }
    return n > 2 ? (n - 1) / (last - first) : NaN;
  }

  // Renders min / midpoint / max beat of every band offline and measures both output channels.
  async function runChannelSuite(OAC, carrier, opts) {
    opts = opts || {};
    var sr = opts.sampleRate || 44100, tol = opts.tolerance || 0.02, secs = opts.seconds || 4, rows = [];
    for (var b = 0; b < BANDS.length; b++) {
      var B = BANDS[b], mid = Math.round((B.min + B.max) / 2 * 10) / 10, beats = [B.min, mid, B.max];
      for (var k = 0; k < 3; k++) {
        var beat = beats[k], ctx = new OAC(2, sr * secs, sr), n = buildGraph(ctx, ctx.destination, carrier, beat);
        n.master.gain.value = 1; n.oL.start(); n.oR.start();
        var buf = await ctx.startRendering();
        var l = crossFreq(buf.getChannelData(0), sr), r = crossFreq(buf.getChannelData(1), sr);
        rows.push({ band: B.name, beat: beat, carrier: carrier, left: l, right: r, diff: r - l,
          ok: Math.abs(l - carrier) <= tol && Math.abs(r - (carrier + beat)) <= tol && Math.abs(r - l - beat) <= 2 * tol });
      }
    }
    return rows;
  }

  function ramp(param, ctx, value, dur) {
    var t = ctx.currentTime;
    if (param.cancelAndHoldAtTime) { try { param.cancelAndHoldAtTime(t); } catch (e) { param.cancelScheduledValues(t); } }
    else param.cancelScheduledValues(t);
    param.setValueAtTime(param.value, t);
    param.linearRampToValueAtTime(value, t + dur);
  }

  /* Playback state machine: idle | starting | playing | paused | stopping.
     Every async callback carries a generation number; teardown bumps it so stale callbacks do nothing. */
  function Session(o) {
    o = o || {};
    this.AC = o.AudioContext || null;
    this.now = o.now || function () { return Date.now(); };
    this.setT = o.setTimeout || function (f, m) { return setTimeout(f, m); };
    this.clrT = o.clearTimeout || function (i) { clearTimeout(i); };
    this.setI = o.setInterval || function (f, m) { return setInterval(f, m); };
    this.clrI = o.clearInterval || function (i) { clearInterval(i); };
    this.onChange = o.onChange || noop; this.onError = o.onError || noop;
    this.state = 'idle'; this.gen = 0; this.ctx = null; this.nodes = null;
    this.band = bandById('alpha'); this.beat = this.band.def; this.carrier = CARRIER.def;
    this.volume = 25; this.duration = 900; this.experimental = false;
    this.elapsed = 0; this._last = 0; this._tick = null; this._to = null; this._fadeEnd = 0; this._resuming = false;
  }
  var P = Session.prototype;
  P.snapshot = function () {
    return { state: this.state, band: this.band.id, beat: this.beat, carrier: this.carrier, left: this.carrier,
      right: this.carrier + this.beat, volume: this.volume, duration: this.duration, elapsed: this.elapsed,
      experimental: this.experimental, allowed: beatAllowed(this.beat, this.experimental) };
  };
  P._emit = function () { this.onChange(this.snapshot()); };
  P.analysers = function () {
    var s = this.state;
    return this.nodes && (s === 'playing' || s === 'paused' || s === 'stopping')
      ? { L: this.nodes.aL, R: this.nodes.aR, sampleRate: this.ctx.sampleRate } : null;
  };
  P._target = function () { return this.volume / 100 * MAX_GAIN; };
  P._accrue = function () {
    if (this.state !== 'playing') return;
    var n = this.now(); this.elapsed += (n - this._last) / 1000; this._last = n;
  };
  P._teardown = function () {
    this.gen++; this._resuming = false;
    if (this._to !== null) { this.clrT(this._to); this._to = null; }
    if (this._tick !== null) { this.clrI(this._tick); this._tick = null; }
    var n = this.nodes, c = this.ctx; this.nodes = null; this.ctx = null;
    if (n) {
      try { n.oL.stop(); } catch (e) {} try { n.oR.stop(); } catch (e) {}
      try { n.master.disconnect(); n.merger.disconnect(); } catch (e) {}
    }
    if (c) { c.onstatechange = null; try { var p = c.close(); if (p && p.catch) p.catch(noop); } catch (e) {} }
  };
  P.hardStop = function () { this._teardown(); this.state = 'idle'; this.elapsed = 0; this._emit(); };
  P.dispose = P.hardStop;

  P.play = async function () {
    if (this.state !== 'idle') return false;
    this.onError(null);
    if (!this.AC) { this.onError('unsupported'); return false; }
    if (!beatAllowed(this.beat, this.experimental)) { this.onError('experimental'); return false; }
    var self = this, gen = ++this.gen, ctx = null;
    this.state = 'starting'; this._emit();
    try {
      ctx = new this.AC();
      if (ctx.state !== 'running') await ctx.resume();
      if (gen !== this.gen) { try { ctx.close(); } catch (e) {} return false; } // stopped while starting
      if (ctx.state !== 'running') { var be = new Error('blocked'); be.name = 'NotAllowedError'; throw be; }
      var n = buildGraph(ctx, ctx.destination, this.carrier, this.beat);
      n.oL.start(); n.oR.start();
      this.ctx = ctx; this.nodes = n;
      ctx.onstatechange = function () {
        if (gen !== self.gen || self.state !== 'playing' || ctx.state === 'running') return;
        self._accrue(); self.state = 'paused'; // browser/system suspended us: stay silent until the user resumes
        var t = ctx.currentTime; n.master.gain.cancelScheduledValues(t); n.master.gain.setValueAtTime(0, t);
        self.onError('interrupted'); self._emit();
      };
      ramp(n.master.gain, ctx, this._target(), FADE_IN); this._fadeEnd = ctx.currentTime + FADE_IN;
      this.elapsed = 0; this._last = this.now(); this.state = 'playing';
      this._tick = this.setI(function () { self._onTick(); }, 250);
      this._emit(); return true;
    } catch (err) {
      if (gen !== this.gen) { if (ctx) try { ctx.close(); } catch (e) {} return false; }
      var owned = this.ctx === ctx; this._teardown(); // teardown closes the context only if it was already adopted
      if (ctx && !owned) try { var cp = ctx.close(); if (cp && cp.catch) cp.catch(noop); } catch (e) {}
      this.state = 'idle'; this._emit();
      this.onError(err && err.name === 'NotAllowedError' ? 'blocked' : 'failed', err && err.message);
      return false;
    }
  };
  P._onTick = function () {
    if (this.state === 'playing') {
      this._accrue();
      if (this.duration && this.elapsed >= this.duration) { this.elapsed = this.duration; this.stop(); return; }
    }
    this._emit();
  };
  P.pause = function () {
    if (this.state !== 'playing') return;
    this._accrue(); this.state = 'paused';
    ramp(this.nodes.master.gain, this.ctx, 0, 0.3);
    var self = this, gen = this.gen, ctx = this.ctx;
    this._to = this.setT(function () { self._to = null; if (gen === self.gen && self.state === 'paused') ctx.suspend(); }, 400);
    this._emit();
  };
  P.resume = async function () {
    if (this.state !== 'paused' || this._resuming) return false;
    var gen = this.gen, ctx = this.ctx; this._resuming = true;
    if (this._to !== null) { this.clrT(this._to); this._to = null; }
    try { await ctx.resume(); } catch (e) { if (gen === this.gen) { this._resuming = false; this.onError('failed', e && e.message); } return false; }
    if (gen !== this.gen || this.state !== 'paused') return false;
    this._resuming = false;
    if (ctx.state !== 'running') { this.onError('blocked'); return false; }
    this.onError(null);
    ramp(this.nodes.master.gain, ctx, this._target(), 0.6); this._fadeEnd = ctx.currentTime + 0.6;
    this._last = this.now(); this.state = 'playing'; this._emit(); return true;
  };
  P.stop = function (opts) {
    if (this.state === 'starting') { this.hardStop(); return; }
    if (this.state !== 'playing' && this.state !== 'paused') return;
    this._accrue();
    if (this._to !== null) { this.clrT(this._to); this._to = null; }
    this.state = 'stopping'; this._emit();
    var self = this, gen = this.gen, ctx = this.ctx, dur = (opts && opts.fade) || FADE_OUT;
    function go() {
      if (gen !== self.gen) return;
      ramp(self.nodes.master.gain, ctx, 0, dur);
      self._to = self.setT(function () { if (gen === self.gen) { self._teardown(); self.state = 'idle'; self.elapsed = 0; self._emit(); } }, dur * 1000 + 100);
    }
    if (ctx.state === 'running') go();
    else ctx.resume().then(go, function () { if (gen === self.gen) self.hardStop(); });
  };

  P._live = function () { return this.nodes && (this.state === 'playing' || this.state === 'paused'); };
  P._guard = function () { if (!beatAllowed(this.beat, this.experimental) && (this.state === 'playing' || this.state === 'paused')) this.stop(); };
  P._applyFreq = function () {
    if (!this._live()) return;
    ramp(this.nodes.oL.frequency, this.ctx, this.carrier, 0.06);
    ramp(this.nodes.oR.frequency, this.ctx, this.carrier + this.beat, 0.06);
  };
  P.setBand = function (id) {
    var b = bandById(id); if (!b || b === this.band) return false;
    if (this.state !== 'idle') this.stop({ fade: 0.25 }); // always stop audio when the band changes
    this.band = b; this.beat = b.def; this._emit(); return true;
  };
  P.setBeat = function (v) {
    v = Math.round(v * 10) / 10;
    if (!isFinite(v) || v < this.band.min || v > this.band.max) return false;
    this.beat = v; this._applyFreq(); this._guard(); this._emit(); return true;
  };
  P.setCarrier = function (v) {
    if (!isFinite(v) || v < CARRIER.min || v > CARRIER.max) return false;
    this.carrier = Math.round(v); this._applyFreq(); this._emit(); return true;
  };
  P.setVolume = function (v) {
    if (!isFinite(v) || v < 0 || v > 100) return false;
    this.volume = v;
    if (this.state === 'playing') ramp(this.nodes.master.gain, this.ctx, this._target(), Math.max(0.05, this._fadeEnd - this.ctx.currentTime));
    this._emit(); return true;
  };
  P.setDuration = function (sec) { if (this.state !== 'idle' || !(sec >= 0)) return false; this.duration = sec; this._emit(); return true; };
  P.setExperimental = function (on) { this.experimental = !!on; this._guard(); this._emit(); };

  return { BANDS: BANDS, CARRIER: CARRIER, RECOMMENDED: RECOMMENDED, FADE_IN: FADE_IN, FADE_OUT: FADE_OUT, MAX_GAIN: MAX_GAIN,
    bandById: bandById, beatAllowed: beatAllowed, buildGraph: buildGraph, crossFreq: crossFreq, runChannelSuite: runChannelSuite, Session: Session };
});
