# NeuroWave

NeuroWave is a browser-based audio tool for exploring binaural beats and the EEG frequency ranges commonly associated with brain waves. It generates two continuous tones—one for each ear—with a small frequency difference between them. The audio is created in real time using the Web Audio API.

## Brainwave frequency bands

Electroencephalography (EEG) measures electrical activity in the brain. EEG signals contain rhythms at different frequencies, which are commonly grouped into bands. The ranges below are approximate and can vary between references and measurement contexts.

| Band | Approximate frequency range | Common EEG association |
|---|---:|---|
| Delta | 0.5–4 Hz | Often prominent during deep, non-REM sleep |
| Theta | 4–8 Hz | Associated with drowsiness and some memory-related processes |
| Alpha | 8–13 Hz | Often seen during relaxed wakefulness, especially with eyes closed |
| Beta | 13–30 Hz | Often associated with alertness and active mental processing |
| Gamma | 30–100 Hz | Studied in relation to attention and information processing |

These are descriptions of EEG activity—not audio tones that directly reproduce the brain's electrical signals. Listening to a sound in one of these ranges does not guarantee that your brain will enter the corresponding EEG state.

## How binaural beats work

NeuroWave plays a slightly different audible tone in each ear through separate stereo channels. For example:

- **Left ear:** 200 Hz
- **Right ear:** 210 Hz
- **Frequency difference:** 210 − 200 = 10 Hz

When the tones are heard separately through stereo headphones, the auditory system may perceive a beat corresponding to the 10 Hz difference. The two tones themselves remain steady; NeuroWave does not intentionally switch them on and off to create pulses. Their sine waves naturally repeat many times per second, and playback continues until you stop it (unless you choose a timed session).

The carrier tones are audible sound frequencies. The beat difference is the difference between them, not a separate 10 Hz tone being played into either ear. Speakers or mono playback can mix the channels and reduce the intended binaural effect, so stereo headphones are recommended.

## What NeuroWave does—and does not do

NeuroWave lets you select a band and adjust the beat frequency, carrier frequency, and volume while listening to the generated audio. It can help you explore binaural tones, but it does not measure EEG, read your brain activity, or verify that a particular brainwave state has occurred. Research on binaural beats varies, and they should not be treated as a guaranteed way to change brain activity or as a medical treatment.
