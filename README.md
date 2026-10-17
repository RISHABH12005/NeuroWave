# NeuroWave

NeuroWave is a browser-based binaural-beat generator for the five commonly described EEG frequency bands. It generates stereo sine tones locally with the **Web Audio API**—no prerecorded audio, external audio API, or frontend build step is required.

> **Important:** NeuroWave is an audio tool, not a medical device or treatment. Binaural beats do not guarantee changes in brain activity or improvements in sleep, focus, meditation, or memory.

## Features

- Delta, Theta, Alpha, Beta, and Gamma band presets with adjustable beat and carrier frequencies.
- Stereo binaural audio generated in real time by the browser.
- Play, pause, resume, and stop controls, plus a playback timer.
- Smooth volume and frequency transitions.
- Audio visualizations and a browser-based self-test.
- Responsive static web app that can be hosted on a service such as Render.

## Run locally

Requirements: a current browser with Web Audio API support, and Python 3 or Node.js for the optional local server.

```bash
git clone https://github.com/RISHABH12005/NeuroWave.git
cd NeuroWave

# Option A
python3 -m http.server 8000

# Option B, if Python 3 is installed
npm start
```

Open [http://localhost:8000](http://localhost:8000). Keep `index.html` and `engine.js` in the same directory. Press **Play** to start audio; browsers generally require a user gesture before audio can play.

On Windows, if `python3` is unavailable, try `py -m http.server 8000`.

## Frequency bands

The following are approximate categories; definitions vary across references and EEG conventions.

| Band | Range (Hz) | Commonly associated with |
|---|---:|---|
| Delta | 0.5–4 | Deep sleep |
| Theta | 4–8 | Drowsiness and some memory processes |
| Alpha | 8–13 | Relaxed wakefulness |
| Beta | 13–30 | Alertness and active thinking |
| Gamma | 30–100 | Attention and information processing |

These associations are general descriptions, not effects that listening to a sound is proven to produce.

### Gamma and high beat frequencies

A high EEG gamma frequency is not the same thing as a clearly perceived binaural beat. Differences above roughly 30 Hz may not be perceived as a distinct binaural beat by many listeners. NeuroWave treats beat differences above 30 Hz as an experimental high-difference mode that requires explicit enabling. This does not mean the audio induces a gamma brain state.

## How the audio works

- The left channel plays the carrier tone.
- The right channel plays the carrier tone plus the selected beat difference.
- The perceived beat frequency is the difference between the right and left channel frequencies.
- Separate oscillators, gain nodes, and analysers feed a stereo `ChannelMerger`; the channels are not intentionally mixed to mono.
- Playback uses short fade-in and fade-out ramps. Volume and frequency adjustments are ramped smoothly.

**Use stereo headphones.** Speakers or mono playback may mix the two channels and reduce the intended effect.

## Project structure

- `index.html` — interface and visualizations.
- `engine.js` — frequency-band data, Web Audio graph, playback session logic, and audio measurements.
- `tests/engine.test.js` — automated engine tests.
- `tests/ui-smoke.js` — DOM smoke test.
- `render.yaml` — Render Blueprint configuration for publishing the static site.
- `.github/workflows/ci.yml` — GitHub Actions workflow for automated checks.

## Tests

Install the project dependencies and run:

```bash
npm ci
npm test
npm run test:ui
```

The test suite includes frequency calculations, channel-isolation checks, playback lifecycle scenarios, and a DOM smoke test. The Node-based audio tests use `node-web-audio-api`; they do not replace listening tests in real browsers.

You can also open the page, expand **Testing instructions and self-test**, and select **Run self-test** to test the audio engine available in your browser.

### Current verification limits

- Browser audio output, autoplay behavior, mobile interruptions, and Safari behavior should be checked manually on target devices.
- Automated tests using simulated contexts or DOM environments cannot fully reproduce every browser's audio behavior.
- Perception of binaural beats varies by listener, especially at higher beat frequencies.

## Deploy on Render

The repository includes a root-level `render.yaml` Blueprint for a static site named `neurowave`.

1. Push the repository to GitHub.
2. In Render, choose **New + → Blueprint** and connect `RISHABH12005/NeuroWave`.
3. Select the `main` branch and set **Blueprint Path** to `render.yaml`.
4. Deploy the Blueprint and open the service URL provided by Render.

The configuration publishes the repository root as static files. A successful GitHub commit or Blueprint setup alone does not guarantee the deployment or tests have succeeded; check the latest Render deployment and GitHub Actions run for their actual status.

## Safety

- Use stereo headphones at a low, comfortable volume.
- Stop playback if you experience discomfort.
- Do not listen while driving or doing tasks that require full attention.
- Do not use NeuroWave as a substitute for medical advice or treatment.

## License

MIT — see [LICENSE](LICENSE).
