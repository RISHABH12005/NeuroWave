# NeuroWave

## What is NeuroWave?

NeuroWave is a browser-based binaural tone generator. It creates two tones with slightly different frequencies—one for the left ear and one for the right—to produce a perceived binaural beat when listened to through stereo headphones.

## What can you do with it?

- Choose a frequency band: Delta, Theta, Alpha, Beta, or Gamma.
- Adjust the beat frequency, carrier frequency, and volume.
- Play, pause, resume, or stop the audio.
- View live waveform visualizations while using the generator.

## How does it work?

1. Choose a frequency band and set the sound parameters.
2. NeuroWave generates a tone for each stereo channel in real time using the Web Audio API.
3. The right-ear tone is set at the carrier frequency plus the selected beat difference; the left-ear tone uses the carrier frequency.
4. Audio plays continuously by default, without intentional on/off pulses or automatic frequency sweeps, until you stop it. You can also pause and resume playback.

## What is it for?

NeuroWave provides a simple way to explore and listen to binaural tones in a web browser. The frequency bands use common EEG terminology, but listening to a tone does not guarantee a particular brain state or medical benefit.

## Requirements

- A modern web browser with Web Audio API support.
- Stereo headphones for the intended binaural listening experience.

## Project structure

- `public/index.html` — user interface and visualizations.
- `public/engine.js` — audio generation and playback logic.
- `tests/` — automated engine and interface tests.
- `.github/workflows/ci.yml` — automated checks on GitHub.
- `render.yaml` — Render static-site deployment configuration.

## License

MIT License. See [LICENSE](LICENSE).
