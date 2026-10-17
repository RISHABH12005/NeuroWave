# NeuroWave

A browser-based brain wave frequency generator. It plays binaural beats for the five EEG bands (Delta, Theta, Alpha, Beta, Gamma) using only the Web Audio API. No audio files, no external audio services, no build step.

## Run it

Open `index.html` in a current Chrome, Edge, Firefox or Safari. Or serve the folder locally:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

Use stereo headphones. Press Play (browsers need a click before audio can start).

## How it works

- Left channel = carrier frequency; right channel = carrier + target beat frequency.
- Two sine oscillators feed a `ChannelMerger`, so left and right stay separate.
- Beats below about 20 Hz are not heard as tones, so each beat is the difference between two audible carrier tones (carrier range 100-500 Hz).
- Fade in/out on play, pause, resume and stop. Audio stops and the context is closed on band switch, Stop, session end and page exit.

## Testing

1. Open the page, expand "Testing instructions and self-test", press **Run self-test**. It renders each band at its min, middle and max beat offline and checks left = carrier and right = carrier + beat (tolerance 0.05 Hz).
2. By ear: Alpha, 10 Hz, 200 Hz carrier. One ear alone gives a steady tone; both ears give a slow pulsing.
3. Swap headphone sides and confirm the tones swap.
4. Cleanup: start playback, then switch bands, press Stop or close the tab. Audio should fade out and stop each time.

## Disclaimer

Binaural beats are an audio experience, not a proven treatment or a guaranteed way to control brain activity, sleep, focus, meditation or memory. The bands are approximate EEG ranges, not guaranteed mental states. Keep the volume low and don't listen while driving or doing anything that needs your full attention.
