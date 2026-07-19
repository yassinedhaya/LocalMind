# LocalMind

**Private, on-device AI for Android.** LocalMind runs large language models entirely on your phone — no servers, no API keys, no network calls for inference. Your conversations, documents, and voice never leave the device.

Built with React Native (New Architecture) + a native Kotlin inference module powered by [Google AI Edge LiteRT](https://ai.google.dev/edge/litert), with a coral "Stitch" design system.

---

## Why LocalMind

| | LocalMind | Typical AI apps |
|---|---|---|
| Inference | 100% on-device | Cloud API |
| Data leaving device | None (except optional model download) | Everything |
| API keys | Not required | Required |
| Works offline | Yes, after model is present | No |

The only time the network is used is to **download the model file once** (or you can copy it in manually). After that, all chat, PDF Q&A, and voice processing happen locally.

---

## Features

- **Chat** — multi-turn conversation with the on-device Gemma model.
- **Focus Timer + Coach (Feature 6)** — a pomodoro-style timer with an AI coach that helps you plan and reflect, all on-device.
- **PDF Q&A (Feature 7)** — pick a PDF, ask questions about its contents. Text is extracted **natively on the device** (including Flate-compressed streams) and answered by the local model. No document is uploaded.
- **Voice (Feature 8)** — real on-device speech: native Android `SpeechRecognizer` transcribes your microphone input, the model answers, and `TextToSpeech` reads the reply back. A "Read aloud" control is available on replies.
- **Home Dashboard (Feature 9)** — a single screen showing engine status, selected model, and quick access to every feature.

---

## Architecture

```
┌─────────────────────────────────────────────┐
│  React Native (New Arch, Hermes)             │
│  src/  screens · hooks · services · agents   │
│  theme/stitchTheme.ts  (coral design system) │
└───────────────┬─────────────────────────────┘
                │ TurboModule bridge (GemmaBridge.ts)
┌───────────────▼─────────────────────────────┐
│  android/app  ·  GemmaModule.kt (Kotlin)      │
│  - LLM engine (LiteRT)                        │
│  - STT (SpeechRecognizer) / TTS (TextToSpeech)│
│  - pickFile / pickImportFile (SAF)            │
│  - extractPdfText (native Flate decode)       │
│  - TimerTickerModule (native timers)         │
└───────────────────────────────────────────────┘
```

Key design points:

- **Standalone build.** The JS bundle is prebuilt into `android/app/src/main/assets/index.android.bundle`, so the app runs without a Metro dev server (no `npm start` needed on-device).
- **Native timers.** Because JS timers do not fire reliably in the standalone Hermes runtime, a `TimerTickerModule` provides native ticking for the focus timer.
- **Safe file handling.** PDFs are read via the Storage Access Framework and decoded in Kotlin (binary-safe, no base64 for large files). Model import uses a dedicated `pickImportFile` that copies the file without base64-encoding it (avoids out-of-memory on multi-GB models).

---

## Supported models

| Model | Approx. size | Notes |
|---|---|---|
| `gemma-4-e2b` | ~1.5 GB | Recommended — fast, multimodal-capable |
| `gemma-4-e4b` | ~4.9 GB | Higher quality, needs more RAM/storage |

Model availability is auto-detected from the device (RAM ≥ 6 GB unlocks both).

---

## Building from source

### Prerequisites

- Node.js 18+
- Android SDK (API 36 used here) with `platform-tools` on `PATH`
- NDK 27.1.x
- Gradle (wrapped; uses `GRADLE_USER_HOME` override below)

### Steps

```sh
# 1. Install JS dependencies
npm install

# 2. Build the standalone JS bundle
npx react-native bundle \
  --platform android \
  --dev false \
  --entry-file index.js \
  --bundle-output android/app/src/main/assets/index.android.bundle \
  --assets-dest android/app/src/main/res

# 3. Build the debug APK
$env:GRADLE_USER_HOME="C:\gradle-temp"   # adjust for your machine
cd android
.\gradlew.bat assembleDebug --no-daemon --no-build-cache --no-configuration-cache
```

The APK is produced at `android/app/build/outputs/apk/debug/app-debug.apk`.

> **Xiaomi / MIUI note:** `adb install` is often blocked by the OS. After pushing the APK you must tap **Install** on the phone's prompt. Use `adb install -r app-debug.apk`.

---

## Installing and running

```sh
adb -s <device-id> install -r android/app/build/outputs/apk/debug/app-debug.apk
adb -s <device-id> shell monkey -p com.localmind -c android.intent.category.LAUNCHER 1
```

### Providing the model

Either:

1. **In-app download** — open Settings → Model, pick a model, and let it download (requires network, one time only), or
2. **Manual copy** — place the `.litertlm` file at:
   ```
   /sdcard/Android/data/com.localmind/files/models/gemma-4-e2b.litertlm
   ```
   The dashboard will then show **Engine Ready**.

Once the engine is ready, the app works fully offline.

---

## Privacy & safety

- No telemetry, no analytics, no third-party network calls during inference.
- Conversations, PDF contents, and audio are processed locally and are not transmitted.
- The repository does **not** contain model binaries, credentials, or user data (see `.gitignore`).

---

## Project layout

```
src/
  agents/        Agent configs + prompt building
  components/    Reusable UI (logo, etc.)
  hooks/         Feature hooks (usePDF, useVoice, useModelSelector, ...)
  native/        GemmaBridge (TurboModule typing)
  screens/       Splash, Voice, Camper, ...
  services/      EngineManager, GemmaService, PDFExtractor, VoiceService, storage
  theme/         stitchTheme.ts (coral design tokens)
android/app/src/main/java/com/localmind/
  GemmaModule.kt      Native engine + STT/TTS + PDF + file picking
  MainActivity.kt     Permission forwarding
  TimerTickerModule.kt Native timer source
```

---

## Known limitations

- PDF Q&A handles text-based PDFs. Scanned/image-only PDFs (no text layer) are not yet OCR'd.
- Voice recognition quality depends on the device's built-in `SpeechRecognizer` and system language pack.
- Models are large; ensure sufficient free storage before importing.

---

## License

This project is provided as-is for private, local use.
