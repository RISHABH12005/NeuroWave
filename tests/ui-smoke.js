const { JSDOM, VirtualConsole } = require('jsdom');
const path = require('path').join(__dirname,'..','index.html');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const errs = [], vc = new VirtualConsole(); vc.on('jsdomError', (e) => { if (!/stylesheet|Could not load|getContext|Not implemented/.test(String(e.message))) errs.push(e.message); });
  const dom = await JSDOM.fromFile(path, { runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      w.HTMLCanvasElement.prototype.getContext = () => new Proxy({}, { get: () => () => {}, set: () => true });
      class P { constructor() { this.value = 0; } setValueAtTime(v) { this.value = v; } cancelScheduledValues() {} linearRampToValueAtTime(v) { this.value = v; } }
      class N { constructor(k) { if (k === 'osc') this.frequency = new P(); if (k === 'gain') this.gain = new P(); if (k === 'an') { this.fftSize = 2048; this.getFloatTimeDomainData = (b) => b.fill(0); } }
        connect() {} disconnect() {} start() {} stop() {} }
      w.AudioContext = class { constructor() { this.state = 'running'; this.currentTime = 0; this.sampleRate = 44100; this.destination = new N(); w.__ctxs = (w.__ctxs || 0) + 1; }
        createOscillator() { return new N('osc'); } createGain() { return new N('gain'); } createChannelMerger() { return new N(); } createAnalyser() { return new N('an'); }
        async resume() { this.state = 'running'; } async suspend() { this.state = 'suspended'; } async close() { this.state = 'closed'; w.__closed = (w.__closed || 0) + 1; } };
    } });
  const w = dom.window, d = w.document, $ = (i) => d.getElementById(i); await sleep(400);
  const out = []; const ok = (c, m) => { out.push((c ? 'PASS ' : 'FAIL ') + m); };
  ok($('statusTxt').textContent === 'Stopped' && !$('bPlay').disabled && $('bPause').disabled, 'initial state: stopped, only Play enabled');
  ok(d.querySelectorAll('.card').length === 5, 'five band cards');
  $('bPlay').click(); await sleep(50);
  ok(/^Playing Alpha · 10 Hz beat/.test($('statusTxt').textContent) && $('lHz').textContent === '200' && $('rHz').textContent === '210', 'Play: status and L/R readouts (200 / 210)');
  $('beat').value = '12'; $('beat').dispatchEvent(new w.Event('input')); ok($('rHz').textContent === '212', 'beat slider updates right channel readout live');
  $('beatNum').value = '99'; $('beatNum').dispatchEvent(new w.Event('change')); ok(/8 to 13/.test($('beatErr').textContent) && $('beatNum').value === '12', 'out-of-band beat rejected and reverted');
  $('bPause').click(); ok($('statusTxt').textContent === 'Paused' && !$('bResume').disabled, 'Pause'); 
  $('bResume').click(); await sleep(20); ok(/^Playing/.test($('statusTxt').textContent), 'Resume');
  d.querySelector('.card[data-id="gamma"]').click(); ok($('statusTxt').textContent === 'Fading out…', 'switching band mid-play starts fade-out'); await sleep(500);
  ok($('statusTxt').textContent === 'Stopped' && w.__ctxs === w.__closed, 'band switch: stopped and every created AudioContext closed');
  ok($('bName').textContent === 'Gamma band' && $('beatNum').min === '30' && $('beatNum').max === '100', 'Gamma keeps 30–100 Hz range');
  ok(!$('expRow').hidden && !$('gammaNote').hidden && $('bPlay').disabled, 'Gamma at 40 Hz: experimental box shown, Play disabled until ticked');
  $('exp').checked = true; $('exp').dispatchEvent(new w.Event('change')); ok(!$('bPlay').disabled, 'ticking experimental enables Play');
  d.querySelector('.card[data-id="beta"]').click(); await sleep(50); ok($('expRow').hidden, 'experimental box hidden outside Gamma');
  w.dispatchEvent(new w.Event('pagehide')); ok(errs.length === 0, 'no script errors' + (errs.length ? ': ' + errs.join(' | ') : ''));
  console.log(out.join('\n')); w.close(); process.exit(out.some((l) => l.startsWith('FAIL')) ? 1 : 0);
})();
