# NeuroWave

A browser-based binaural-beat generator for the five EEG bands. It uses only the Web Audio API: no audio files, no external audio services, no build step.

**Not a treatment.** Binaural beats are an audio experience. This tool does not claim to change brain activity or to guarantee sleep, focus, meditation or better memory.

## Run it

```bash
python3 -m http.server 8000     # or: npm start
# open http://localhost:8000
```

`index.html` loads `engine.js`, so serve the folder (or open `index.html` directly; both files must sit together). Click **Play**: browsers only start audio after a user click.

**Browsers:** a current Chrome, Edge, Firefox or Safari with Web Audio and `OfflineAudioContext`. Use stereo headphones.

## Frequency bands

| Band | Range (Hz) | General association |
|---|---|---|
| Delta | 0.5–4 | deep sleep |
| Theta | 4–8 | drowsiness, some memory processes |
| Alpha | 8–13 | relaxed wakefulness |
| Beta | 13–30 | alertness, active thinking |
| Gamma | 30–100 | attention, information processing |

These are approximate. EEG band boundaries overlap and vary by convention (for example, some sources use 4–7 Hz for theta, 8–12 Hz for alpha, or start gamma near 25 Hz). The ranges are kept as listed.

### Gamma and the binaural-beat percept

Gamma is an EEG category; a 30 Hz or larger difference between the two tones is often not heard as a clear binaural beat. The recommended range for a clearly heard beat is roughly **1–30 Hz**. The Gamma band still spans 30–100 Hz, but any beat above 30 Hz is an **experimental high-difference mode** that must be enabled with a checkbox before Play works. Nothing here promises a gamma brain state.

## Audio calculation

- Left channel = carrier frequency (default 200 Hz, adjustable 100–500 Hz).
- Right channel = carrier + target beat frequency.
- Beat = right - left. Beats below about 20 Hz aren't heard as tones, so each beat is the difference between two audible sine tones.
- Two oscillators go through separate gains and analysers into a `ChannelMerger` (input 0 = left, input 1 = right), then a master gain. They are never mixed to mono.
- Fade-in 1.5 s, fade-out 0.8 s. Volume, beat and carrier changes ramp smoothly during playback.

## Files

- `index.html`: interface and visualizations.
- `engine.js`: band data, audio graph, frequency measurement, and the playback `Session` state machine (shared by the page and the tests).
- `tests/engine.test.js`: automated tests. `tests/ui-smoke.js`: DOM smoke test.

## Testing

```bash
npm install
npm test          # 18 tests
npm run test:ui   # DOM smoke test (jsdom)
```

- **Frequency tests** render each band's minimum, midpoint and maximum beat with `OfflineAudioContext` (from `node-web-audio-api`) at carriers of 100, 200 and 500 Hz, 4 s each. Each channel's frequency is measured from interpolated zero crossings. Tolerance: 0.02 Hz on left, right and difference.
- **Isolation tests** mute one oscillator and check the opposite output channel is silent.
- **Lifecycle tests** run the `Session` against a fake AudioContext and fake clock: Play/Pause/Resume/Stop, fades, live volume/beat/carrier changes, timer expiry, band switches, rapid Play/Stop, blocked autoplay, interruptions, Gamma gating, timers and context cleanup.
- **In a browser:** open the page, expand "Testing instructions and self-test" and press **Run self-test**. This runs the same frequency check using that browser's own audio engine.
- **By ear:** Alpha, 10 Hz, 200 Hz carrier, stereo headphones. One ear alone gives a steady tone; both ears give a slow pulsing. Swapping the headphones swaps the tones.

## Limitations

- Node tests use `node-web-audio-api`, not a browser engine, and the lifecycle and DOM tests use fakes. Real audio output, autoplay policy and iOS interruption behavior need manual checking in each browser.
- Parameter ramps assume `AudioParam.value` reflects the current value mid-ramp, which holds in current Chrome and Firefox; Safari wasn't verified.
- The beat envelope graph is calculated from the beat frequency, not measured from the audio.
- Whether a given listener perceives a binaural beat varies, especially at higher beat frequencies.

## Safety

Use stereo headphones; the effect needs a different tone in each ear. Keep the volume low and comfortable. Don't listen while driving or doing anything that needs your full attention. Stop if you feel unwell.

## License

See `LICENSE`.
