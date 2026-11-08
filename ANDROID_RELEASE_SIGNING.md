# Android release-signing backup

Neuron IQ’s Android release key is stored locally and is intentionally excluded from Git and GitHub Actions.

## Key details

- **Keystore:** `.release-signing/neuroniq-release.jks`
- **Signing configuration:** `.release-signing/release-signing.properties`
- **Alias:** `neuroniq-release`
- **Certificate owner:** `CN=Neuron IQ, OU=Android, O=Neuron IQ, L=Kolkata, ST=West Bengal, C=IN`
- **Validity:** 8 November 2026 to 26 March 2054
- **SHA-256 fingerprint:** `90:D4:08:B3:BD:8A:CE:33:5A:F6:A8:08:1A:BC:BB:1B:96:1B:0B:CB:9D:2C:B2:CF:08:D4:F0:E3:D5:4A:97:39`

## Do this now

Copy the entire `.release-signing` folder to an encrypted, private backup you control. Keep the key and `release-signing.properties` together. Do not commit, email, upload publicly, or lose either file.

Android treats this certificate as the app’s permanent update identity. Future updates to package `com.codewithpb11.neuroniq` must use the same key, otherwise existing users cannot install them as updates.

## Building a future release

Place a copy of `release-signing.properties` at `android/release-signing.properties` before invoking `:app:assembleRelease`. The build configuration reads this ignored local file; it must never be committed.
