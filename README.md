# NeuroWave

**NeuroWave** is a browser-based binaural-beat generator for exploring audio frequency differences commonly discussed alongside EEG brainwave bands. It creates two steady tones in real time using the Web Audio API—one for the left ear and one for the right.

## EEG brainwave frequency bands

Electroencephalography (**EEG**) records electrical activity from the brain. EEG rhythms are commonly grouped into frequency bands. The ranges below are approximate and can vary across sources and contexts.

| Band | Approximate range | Common EEG association |
|---|---:|---|
| Delta | 0.5–4 Hz | Often prominent during deep, non-REM sleep |
| Theta | 4–8 Hz | Associated with drowsiness and studied in relation to memory |
| Alpha | 8–13 Hz | Common during relaxed wakefulness, especially with eyes closed |
| Beta | 13–30 Hz | Often associated with alertness and active mental processing |
| Gamma | 30–100 Hz | Studied in relation to attention and information processing |

These ranges describe EEG activity, not audible tones that directly reproduce the brain's electrical signals.

## How binaural beats work

NeuroWave sends a slightly different audible tone to each ear through separate stereo channels. The difference between the two tones is the **beat frequency**.

For example:

- **Left channel:** 200 Hz
- **Right channel:** 210 Hz
- **Difference:** 210 Hz − 200 Hz = **10 Hz**

When each tone reaches a separate ear through stereo headphones, the auditory system may perceive a beat corresponding to the 10 Hz difference. The carrier tones remain steady; NeuroWave does not intentionally pulse them on and off or automatically sweep the selected frequency.

The carrier tones are audible sound frequencies. The 10 Hz difference is not a separate 10 Hz tone played into either ear. Stereo headphones are recommended because speakers or mono playback may mix the channels and reduce the intended binaural effect.

## Features

- Explore Delta, Theta, Alpha, Beta, and Gamma frequency ranges.
- Adjust beat frequency, carrier frequency, and volume.
- Listen to continuous tones and stop playback when you choose, or select a timed session.
- Explore the visualizations and browser self-test.

## License

Released under the MIT License. See [LICENSE](LICENSE).
