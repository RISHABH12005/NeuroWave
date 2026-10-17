# NeuroWave

**NeuroWave** is a browser-based binaural-beat generator that lets you explore audio frequency differences commonly discussed alongside EEG brainwave bands. It creates two steady tones in real time using the Web Audio API—one for the left ear and one for the right.

## EEG brainwave frequency bands

Electroencephalography (**EEG**) records electrical activity from the brain. EEG rhythms are often grouped into frequency bands. The ranges below are approximate; definitions can vary across sources and contexts.

| Band | Approximate range | Common association in EEG research |
|---|---:|---|
| Delta | 0.5–4 Hz | Often prominent during deep, non-REM sleep |
| Theta | 4–8 Hz | Often observed during drowsiness and studied in relation to memory |
| Alpha | 8–13 Hz | Common during relaxed wakefulness, especially with eyes closed |
| Beta | 13–30 Hz | Often associated with alertness and active mental processing |
| Gamma | 30–100 Hz | Studied in relation to attention and information processing |

**Important distinction:** These ranges describe electrical rhythms measured with EEG. They are not audible tones that directly reproduce brain activity, and selecting a matching binaural-beat frequency does not guarantee a corresponding brain state.

## How binaural beats work

NeuroWave sends a slightly different audible tone to each ear using separate stereo channels. The difference between the tones is the **beat frequency**.

For example:

- **Left channel:** 200 Hz
- **Right channel:** 210 Hz
- **Difference:** 210 Hz − 200 Hz = **10 Hz**

When each tone reaches a separate ear through stereo headphones, the auditory system may perceive a beat corresponding to the 10 Hz difference. The two carrier tones remain steady; NeuroWave does not intentionally pulse them on and off or automatically sweep the selected frequency.

The carrier tones are audible sound frequencies. The 10 Hz difference in this example is not a separate 10 Hz tone being played into either ear. Stereo headphones are recommended because speakers or mono playback may mix the channels and reduce the intended binaural effect.

## What you can explore

- Select one of five EEG-associated bands: Delta, Theta, Alpha, Beta, or Gamma.
- Adjust the beat frequency, carrier frequency, and volume.
- Listen to continuous tones and stop playback when you choose, or select a timed session.
- Use the visualizations and browser self-test to explore the experience.

## Scientific limitations

NeuroWave generates audio; it does **not** measure EEG, read brain activity, or confirm that a particular brainwave state has occurred. Research on binaural beats has mixed results, and effects may vary between people and settings. The tool is for audio exploration, not a medical treatment or a guaranteed method for changing brain activity.

## Run locally

You need Node.js and npm for the project’s test commands. To serve the static app locally, you also need Python 3.

```bash
git clone https://github.com/RISHABH12005/NeuroWave.git
cd NeuroWave
npm ci
npm test
npm run test:ui
npm start
```

Then open **http://localhost:8000** in your browser. Use stereo headphones for the intended binaural-beat experience.

## Project structure

```text
NeuroWave/
├── public/
│   ├── index.html
│   └── engine.js
├── tests/
│   ├── engine.test.js
│   └── ui-smoke.js
├── .github/
│   └── workflows/
│       └── ci.yml
├── .gitignore
├── LICENSE
├── package.json
├── package-lock.json
├── README.md
└── render.yaml
```

## License

Released under the MIT License. See [LICENSE](LICENSE).
