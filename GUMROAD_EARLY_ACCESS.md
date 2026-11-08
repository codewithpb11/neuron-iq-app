# Neuron IQ Early Access

**Version:** 1.0.0  
**Platform:** Android 7.0 or later

Thank you for trying Neuron IQ Early Access. This is a self-contained brain-training app with a practice reasoning assessment, personalized game recommendations, and eight thinking games.

## What is included

- `Neuron-IQ-Early-Access-v1.0.0.apk` — Android installation package
- `Neuron-IQ-Source-v1.0.0.zip` — complete source bundle for this release
- This guide

## Install on Android

1. Download the APK to your Android device.
2. Open the downloaded file.
3. If Android asks, allow your browser or file manager to install apps from that source.
4. Tap **Install**, then open **Neuron IQ**.

This Early Access build is debug-signed. It is intended for direct installation, not Google Play distribution. If Android blocks the file, check your device’s “Install unknown apps” setting for the app used to open the download.

## What Neuron IQ does

- Provides a 30-question, untimed practice assessment with an elapsed timer
- Uses item difficulty and a limited accuracy-aware timing factor for a practice estimate
- Recommends starting levels across Word Connect, Chess, Connect 4, Memory Match, 2048, Tic-Tac-Toe, Jigsaw Puzzle, and Sudoku
- Includes ten game difficulty levels and local Stockfish-powered chess levels

## Important assessment notice

Neuron IQ’s score is a **practice estimate for learning and entertainment**. It is not a clinical, educational, employment, or diagnostic IQ assessment. It does not diagnose any condition, and the games do not guarantee an increase in IQ or intelligence.

## Your data

The app stores progress, settings, and the current practice score on your device using local storage. It has no account system, cloud database, or analytics service.

## Support

For support, use the contact option on the Gumroad product page and include your Android version, device model, and a screenshot of the issue where possible.

## Open-source notice: Stockfish.js 19

The chess feature includes Stockfish.js 19 Lite (single-threaded), a WebAssembly build of Stockfish. It is licensed under the GNU General Public License v3.0.

- GPLv3 license: `assets/stockfish/COPYING.txt`
- Stockfish.js source and release: <https://github.com/nmrugg/stockfish.js/tree/v19.0.0>
- Upstream Stockfish source: <https://github.com/official-stockfish/Stockfish/tree/sf_19>

The accompanying source bundle includes the app source and the bundled Stockfish assets for this release. Stockfish and Stockfish.js remain subject to their respective GPLv3 terms.
