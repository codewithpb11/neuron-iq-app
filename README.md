# Neuron IQ

Neuron IQ is a free, browser-based brain-training app with a 30-question reasoning assessment, an adaptive practice plan, and a collection of skill games. It is designed as a private, lightweight learning tool—no account or server is required.

> **Important:** The assessment produces a *practice IQ estimate*, not a clinical IQ result. It is useful as a personal learning baseline only. A validated IQ assessment requires standardized administration and representative normative data.

## What it includes

- A 30-question, untimed reasoning assessment across numerical, verbal, logical, and pattern-based tasks
- An elapsed-time clock, item-difficulty weighting, four-option guessing adjustment, and a small accuracy-aware timing adjustment
- A personalized four-week practice plan with recommended game levels
- Eight games: Word Connect, Chess, Connect 4, Memory Match, 2048, Tic-Tac-Toe, Jigsaw Puzzle, and Sudoku
- Ten difficulty levels for each game
- Chess bots from Rookie (200 Elo target) through Grandmaster Challenge (2400 Elo target)
- Five selectable jigsaw images with a separate reference picture
- A local Android wrapper and GitHub Actions workflow that produces a debug APK

## Run it on Windows

1. Install Python with the Windows `py` launcher available.
2. Double-click [`Start Neuron App.vbs`](Start%20Neuron%20App.vbs).
3. The app opens at `http://127.0.0.1:5173` in your browser.

The launcher serves the static files locally so the bundled Stockfish chess engine can run correctly.

## Android APK

Every push to `main` that changes the app, assets, Android wrapper, or APK workflow triggers the **Build Android APK** GitHub Actions workflow.

1. Open the repository’s **Actions** tab.
2. Open the latest successful **Build Android APK** run.
3. Download the `neuron-iq-app-debug-apk` artifact.
4. Install `app-debug.apk` on an Android device. Android may ask you to allow installation from that source.

The Android package ID is `com.codewithpb11.neuroniq`. The Early Access build is signed with the project’s permanent Android release key. Store a secure, private backup of that key before submitting future releases or publishing through an app store.

## Project structure

```text
├── index.html                 # App shell and content
├── styles.css                 # Responsive UI and game styling
├── app.js                     # Assessment, game logic, plans, and local state
├── assets/                    # Puzzle images and Stockfish chess engine assets
├── android/                   # Native Android WebView wrapper
└── .github/workflows/         # Automated APK build workflow
```

## Data and privacy

Neuron IQ stores the current practice score, game settings, and session progress in the browser’s local storage. The static app has no sign-in flow, backend, or analytics service.

## Third-party software

Chess levels 6–10 use bundled Stockfish 19 assets. Their license is included at [`assets/stockfish/COPYING.txt`](assets/stockfish/COPYING.txt).

## Development notes

- The web app is deliberately dependency-free: plain HTML, CSS, and JavaScript.
- Run `node --check app.js` after changing JavaScript.
- The Android workflow uses Android Gradle Plugin 8.7.3, Gradle 8.9, Java 17, and Android API 35.
