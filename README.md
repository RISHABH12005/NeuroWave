# NeuroWave

NeuroWave is a free, browser-based binaural tone generator. Choose a frequency band, adjust the sound, and listen through stereo headphones. Audio is generated in your browser using the Web Audio API.

**Playback is continuous by default:** it has no time limit and keeps playing until you press **Stop**. The tones do not intentionally pulse on and off. You can pause and resume playback whenever you want.

> **Please note:** NeuroWave is an audio experiment, not a medical device or treatment. Binaural beats are not guaranteed to change brain activity or improve sleep, focus, memory, or mood.

## Features

- Five selectable frequency bands: Delta, Theta, Alpha, Beta, and Gamma.
- Adjustable beat frequency, carrier frequency, and volume.
- Continuous stereo audio with Play, Pause, Resume, and Stop controls.
- Optional session timer, or **No limit** for playback without an automatic time limit.
- Waveform visualizations and an in-browser audio self-test.
- Runs in a modern browser without downloading audio files.

## Try it locally

### Requirements

- A modern browser such as Chrome, Edge, Firefox, or Safari.
- Python 3 to run the local server, or Node.js if you want to use the included npm scripts and tests.
- Stereo headphones for the intended binaural listening experience.

### Steps

```bash
git clone https://github.com/RISHABH12005/NeuroWave.git
cd NeuroWave
npm ci
npm start
```

Open [http://localhost:8000](http://localhost:8000) in your browser and press **Play**. If you only want to run the site and have Python 3 installed, you can instead run:

```bash
python3 -m http.server 8000 --directory public
```

On Windows, use `py -m http.server 8000 --directory public` if `python3` is not recognized.

## Understanding the frequencies

| Band | Approximate range | Common EEG association |
|---|---:|---|
| Delta | 0.5–4 Hz | Deep sleep |
| Theta | 4–8 Hz | Drowsiness and some memory processes |
| Alpha | 8–13 Hz | Relaxed wakefulness |
| Beta | 13–30 Hz | Alertness and active thinking |
| Gamma | 30–100 Hz | Attention and information processing |

EEG ranges vary by source and can overlap. These associations describe common EEG terminology; they do not mean listening to a matching sound will cause that mental state.

## How the sound works

NeuroWave plays a slightly different tone in each ear:

- **Left ear:** the selected carrier frequency.
- **Right ear:** carrier frequency plus the selected beat frequency.
- **Beat difference:** right frequency minus left frequency.

For example, a 200 Hz left tone and a 210 Hz right tone have a 10 Hz difference. The audio is generated continuously, and the sine waves naturally repeat their cycles. The app does not add intentional on/off pulses or automatic frequency sweeps.

Use stereo headphones at a comfortable, low volume. A difference above about 30 Hz may not be perceived as a clear binaural beat; Gamma's EEG range should not be interpreted as a promise of a Gamma brain state.

## Repository layout

```text
NeuroWave/
├── public/
│   ├── index.html       # Web interface and visualizations
│   └── engine.js        # Audio engine and playback controls
├── tests/
│   ├── engine.test.js   # Audio and playback tests
│   └── ui-smoke.js      # Basic interface smoke test
├── .github/workflows/
│   └── ci.yml           # Automated GitHub Actions checks
├── .gitignore
├── LICENSE
├── README.md
├── package.json
├── package-lock.json
└── render.yaml           # Render static-site configuration
```

## Run the tests

```bash
npm ci
npm test
npm run test:ui
```

You can also open the website, expand **Testing instructions and self-test**, and click **Run self-test**. Automated tests are useful checks, but they do not replace testing audio output on real devices and browsers.

## Deploy with Render

This repository includes a `render.yaml` Blueprint configured to publish the `public/` directory as a static site.

1. In Render, choose **New + → Blueprint**.
2. Connect `RISHABH12005/NeuroWave` and select the `main` branch.
3. Set the Blueprint path to `render.yaml` if asked.
4. Deploy and open the URL Render provides.

If the Render service is already connected to this repository with automatic deploys enabled, new commits to the linked branch should trigger a deployment. Confirm the deployment status in Render before assuming the live site has updated.

## Safety and limitations

- Keep the volume low and comfortable; stop if you feel discomfort.
- Do not listen while driving or doing tasks that require full attention.
- Browser audio behavior can vary, especially on mobile devices and during interruptions.
- NeuroWave does not measure EEG and cannot verify that a listener's brain enters any particular state.

## License

This project is released under the MIT License. See [LICENSE](LICENSE).
