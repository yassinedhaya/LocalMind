@file:OptIn(com.google.ai.edge.litertlm.ExperimentalApi::class)
package com.localmind

import android.app.Activity
import android.app.ActivityManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.os.ParcelFileDescriptor
import android.os.StatFs
import android.graphics.pdf.PdfRenderer
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import android.util.Log
import java.io.ByteArrayOutputStream
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.WritableNativeMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.google.ai.edge.litertlm.Backend
import com.google.ai.edge.litertlm.Content
import com.google.ai.edge.litertlm.Contents
import com.google.ai.edge.litertlm.Conversation
import com.google.ai.edge.litertlm.ConversationConfig
import com.google.ai.edge.litertlm.Engine
import com.google.ai.edge.litertlm.EngineConfig
import com.google.ai.edge.litertlm.SamplerConfig
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream
import java.net.HttpURLConnection
import java.net.URL

class GemmaModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private val scope = CoroutineScope(Dispatchers.IO)
    private val TAG = "GemmaModule"

    private var engine: Engine? = null
    private var conversation: Conversation? = null

    private var speechRecognizer: SpeechRecognizer? = null
    private var tts: TextToSpeech? = null
    private var ttsReady = false

    private var pendingPickPromise: Promise? = null
    private var pendingPickWantsBase64: Boolean = true
    private val PICK_REQUEST_CODE = 7351
    private var pendingSttPromise: Promise? = null
    private var pendingSttLanguage: String = "en-US"
    private val RECORD_AUDIO_REQUEST_CODE = 7352

    fun onRequestPermissionsResult(requestCode: Int, grantResults: IntArray) {
        if (requestCode != RECORD_AUDIO_REQUEST_CODE) return
        val promise = pendingSttPromise ?: return
        pendingSttPromise = null
        val granted = grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED
        if (!granted) {
            promise.reject("STT_PERMISSION_DENIED", "Microphone permission denied")
            return
        }
        val activity = reactApplicationContext.currentActivity ?: run {
            promise.reject("NO_ACTIVITY", "No current activity")
            return
        }
        val lang = pendingSttLanguage
        activity.runOnUiThread {
            beginSTT(activity, lang, promise)
        }
    }

    private val activityEventListener = object : ActivityEventListener {
        override fun onActivityResult(
            activity: Activity,
            requestCode: Int,
            resultCode: Int,
            data: Intent?
        ) {
            if (requestCode != PICK_REQUEST_CODE) return
            val promise = pendingPickPromise ?: return
            pendingPickPromise = null
            if (resultCode == Activity.RESULT_OK && data != null) {
                val uri: Uri? = data.data
                if (uri != null) {
                    try {
                        val path = copyPickedFileToCache(uri)
                        val map: WritableMap = Arguments.createMap()
                        map.putString("uri", uri.toString())
                        map.putString("path", path)
                        if (pendingPickWantsBase64) {
                            val bytes = java.io.File(path).readBytes()
                            val base64 = android.util.Base64.encodeToString(bytes, android.util.Base64.NO_WRAP)
                            map.putString("base64", base64)
                        }
                        promise.resolve(map)
                    } catch (e: Exception) {
                        promise.reject("PICK_COPY_FAILED", e.message, e)
                    }
                } else {
                    promise.reject("PICK_NO_URI", "No file URI returned")
                }
            } else {
                promise.resolve(null)
            }
        }

        override fun onNewIntent(intent: Intent) {}
    }

    init {
        reactContext.addActivityEventListener(activityEventListener)
    }

    private fun copyPickedFileToCache(uri: Uri): String {
        val ctx = reactApplicationContext
        val input = ctx.contentResolver.openInputStream(uri)
            ?: throw Exception("Cannot open picked file")
        val fileName = "picked_${System.currentTimeMillis()}.bin"
        val outFile = File(ctx.cacheDir, fileName)
        input.use { inp ->
            FileOutputStream(outFile).use { out ->
                inp.copyTo(out)
            }
        }
        return outFile.absolutePath
    }

    override fun getName(): String = "GemmaModule"
    @ReactMethod
    fun addListener(eventType: String) {}

    @ReactMethod
    fun removeListeners(count: Int) {}

    override fun initialize() {
        super.initialize()
        getModelsDir().mkdirs()
    }

    private fun getModelsDir(): File {
        val dir = File(reactApplicationContext.getExternalFilesDir(null), "models")
        dir.mkdirs()
        return dir
    }

    private fun modelFile(modelId: String): String {
        return File(getModelsDir(), "$modelId.litertlm").absolutePath
    }

    @ReactMethod
    fun checkCompatibility(promise: Promise) {
        scope.launch {
            try {
                val ctx = reactApplicationContext
                val am = ctx.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
                val mi = ActivityManager.MemoryInfo()
                am.getMemoryInfo(mi)
                val ramGB = mi.totalMem.toDouble() / (1024.0 * 1024.0 * 1024.0)

                val sf = StatFs(Environment.getDataDirectory().absolutePath)
                val storageGB = sf.availableBytes.toDouble() / (1024.0 * 1024.0 * 1024.0)

                val models = mutableListOf<String>()
                if (ramGB >= 6.0) models.add("gemma-4-e2b")
                if (ramGB >= 6.0) models.add("gemma-4-e4b")

                val arr: WritableArray = Arguments.createArray()
                for (m in models) arr.pushString(m)
                val result = WritableNativeMap()
                result.putDouble("ramGB", Math.round(ramGB * 10.0) / 10.0)
                result.putDouble("storageGB", Math.round(storageGB * 10.0) / 10.0)
                result.putInt("apiLevel", Build.VERSION.SDK_INT)
                result.putArray("availableModels", arr)
                promise.resolve(result)
            } catch (e: Exception) {
                promise.reject("COMPATIBILITY_CHECK_FAILED", e.message, e)
            }
        }
    }

    @ReactMethod
    fun checkModelExists(modelId: String, promise: Promise) {
        try {
            val exists = File(modelFile(modelId)).exists()
            promise.resolve(if (exists) "DOWNLOADED" else "NOT_FOUND")
        } catch (e: Exception) {
            promise.resolve("NOT_FOUND")
        }
    }

    @ReactMethod
    fun pickFile(mimeType: String, promise: Promise) {
        try {
            val activity = reactApplicationContext.currentActivity
            if (activity == null) {
                promise.reject("NO_ACTIVITY", "No current activity to start picker")
                return
            }
            pendingPickPromise = promise
            pendingPickWantsBase64 = true
            val intent = Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
                addCategory(Intent.CATEGORY_OPENABLE)
                type = mimeType.ifEmpty { "*/*" }
            }
            activity.startActivityForResult(intent, PICK_REQUEST_CODE)
        } catch (e: Exception) {
            pendingPickPromise = null
            promise.reject("PICK_FAILED", e.message, e)
        }
    }

    /**
     * Same as pickFile but does NOT base64-encode the selected file (avoids
     * OOM when picking large model files). Returns { uri, path } only.
     */
    @ReactMethod
    fun pickImportFile(mimeType: String, promise: Promise) {
        try {
            val activity = reactApplicationContext.currentActivity
            if (activity == null) {
                promise.reject("NO_ACTIVITY", "No current activity to start picker")
                return
            }
            pendingPickPromise = promise
            pendingPickWantsBase64 = false
            val intent = Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
                addCategory(Intent.CATEGORY_OPENABLE)
                type = mimeType.ifEmpty { "*/*" }
            }
            activity.startActivityForResult(intent, PICK_REQUEST_CODE)
        } catch (e: Exception) {
            pendingPickPromise = null
            promise.reject("PICK_FAILED", e.message, e)
        }
    }

    @ReactMethod
    fun importModelFromFile(modelId: String, fileUri: String, promise: Promise) {
        scope.launch {
            try {
                val srcFile = File(fileUri.replace("file://", ""))
                if (!srcFile.exists()) {
                    promise.reject("FILE_NOT_FOUND", "Source file not found: $fileUri")
                    return@launch
                }
                val destFile = File(modelFile(modelId))
                destFile.parentFile?.mkdirs()
                srcFile.copyTo(destFile, overwrite = true)
                promise.resolve("IMPORTED")
            } catch (e: Exception) {
                promise.reject("IMPORT_FAILED", e.message, e)
            }
        }
    }

    private fun hasNotificationPermission(): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) return true
        return ContextCompat.checkSelfPermission(
            reactApplicationContext,
            android.Manifest.permission.POST_NOTIFICATIONS
        ) == PackageManager.PERMISSION_GRANTED
    }

    @ReactMethod
    fun requestNotificationPermission(promise: Promise) {
        try {
            if (hasNotificationPermission()) {
                promise.resolve("GRANTED")
                return
            }
            val activity = reactApplicationContext.currentActivity
            if (activity == null) {
                promise.reject("NO_ACTIVITY", "No current activity")
                return
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                ActivityCompat.requestPermissions(
                    activity,
                    arrayOf(android.Manifest.permission.POST_NOTIFICATIONS),
                    1001
                )
            }
            promise.resolve("REQUESTED")
        } catch (e: Exception) {
            promise.reject("PERMISSION_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun downloadModelFile(modelId: String, promise: Promise) {
        try {
            val urlStr = when {
                modelId.contains("e2b") ->
                    "https://huggingface.co/litert-community/gemma-4-E2B-it-litert-lm/resolve/main/gemma-4-E2B-it.litertlm"
                modelId.contains("e4b") ->
                    "https://huggingface.co/litert-community/gemma-4-E4B-it-litert-lm/resolve/main/gemma-4-E4B-it.litertlm"
                else -> throw Exception("Unknown model: $modelId")
            }
            val expectedBytes = if (modelId.contains("e2b")) 2580000000L else 3660000000L

            val currentPromise = promise
            val currentReactCtx = reactApplicationContext

            DownloadService.progressCallback = { id, percent, speedMBs ->
                val map: WritableMap = Arguments.createMap()
                map.putDouble("bytesDownloaded", 0.0)
                map.putDouble("totalBytes", expectedBytes.toDouble())
                map.putInt("percent", percent)
                map.putDouble("speedMBs", speedMBs)
                currentReactCtx
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    .emit("DownloadProgress", map)
            }
            DownloadService.completeCallback = { id, success, error ->
                if (success) {
                    currentPromise.resolve("DOWNLOADED")
                } else {
                    currentPromise.reject("DOWNLOAD_FAILED", error ?: "Unknown error")
                }
                DownloadService.progressCallback = null
                DownloadService.completeCallback = null
            }

            val intent = Intent(currentReactCtx, DownloadService::class.java).apply {
                action = DownloadService.ACTION_DOWNLOAD
                putExtra(DownloadService.EXTRA_MODEL_ID, modelId)
                putExtra(DownloadService.EXTRA_URL, urlStr)
                putExtra(DownloadService.EXTRA_EXPECTED_BYTES, expectedBytes)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                currentReactCtx.startForegroundService(intent)
            } else {
                currentReactCtx.startService(intent)
            }
        } catch (e: Exception) {
            promise.reject("DOWNLOAD_FAILED", e.message, e)
        }
    }

    @ReactMethod
    fun cancelDownload(modelId: String, promise: Promise) {
        try {
            DownloadService.cancelDownload(modelId)
            promise.resolve("CANCELLED")
        } catch (e: Exception) {
            promise.resolve("CANCELLED")
        }
    }

    @ReactMethod
    fun initEngine(modelId: String, promise: Promise) {
        scope.launch {
            try {
                closeEngineInternal()
                val path = modelFile(modelId)
                if (!File(path).exists()) {
                    promise.reject("MODEL_NOT_FOUND", "Model file not found. Download first.")
                    return@launch
                }
                Log.d(TAG, "Initializing engine with model: $path")
                val engineConfig = EngineConfig(
                    modelPath = path,
                    backend = Backend.GPU(),
                    maxNumTokens = 512,
                    cacheDir = reactApplicationContext.cacheDir.absolutePath
                )
                val eng = Engine(engineConfig)
                withContext(Dispatchers.IO) {
                    eng.initialize()
                }
                engine = eng
                conversation = eng.createConversation(
                    ConversationConfig(
                        samplerConfig = SamplerConfig(topK = 64, topP = 0.95, temperature = 0.8)
                    )
                )
                Log.d(TAG, "Engine initialized")
                promise.resolve("INITIALIZED")
            } catch (e: Exception) {
                Log.e(TAG, "Engine init failed: ${e.message}", e)
                promise.reject("ENGINE_INIT_FAILED", e.message, e)
            }
        }
    }

    @ReactMethod
    fun generate(prompt: String, promise: Promise) {
        scope.launch {
            try {
                val convo = conversation
                if (convo == null) {
                    promise.reject("ENGINE_NOT_INITIALIZED", "Engine not initialized. Call initEngine first.")
                    return@launch
                }
                Log.d(TAG, "generate() prompt length=${prompt.length}")
                val ctx = reactApplicationContext
                val emitter = ctx.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                val handler = android.os.Handler(ctx.mainLooper)
                val responseText = withContext(Dispatchers.IO) {
                    val msg = convo.sendMessage(prompt)
                    val sb = StringBuilder()
                    msg.contents.contents.forEach { content ->
                        if (content is Content.Text) {
                            sb.append(content.text)
                            handler.post { emitter.emit("onGenerateToken", content.text) }
                        }
                    }
                    sb.toString()
                }
                Log.d(TAG, "generate() response length=${responseText.length}")
                handler.post {
                    emitter.emit("onGenerateComplete", responseText)
                    promise.resolve(responseText)
                }
            } catch (e: Exception) {
                Log.e(TAG, "generate failed: ${e.message}", e)
                promise.reject("INFERENCE_FAILED", e.message, e)
            }
        }
    }

    @ReactMethod
    fun closeEngine(promise: Promise) {
        try {
            closeEngineInternal()
            promise.resolve("CLOSED")
        } catch (e: Exception) {
            promise.reject("CLOSE_FAILED", e.message, e)
        }
    }

    // ---- Speech-to-Text (Android SpeechRecognizer, on-device capable) ----

    private fun emit(event: String, map: WritableMap) {
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(event, map)
    }

    @ReactMethod
    fun startSTT(language: String, promise: Promise) {
        try {
            val ctx = reactApplicationContext
            if (!SpeechRecognizer.isRecognitionAvailable(ctx)) {
                promise.reject("STT_UNAVAILABLE", "Speech recognition not available on this device")
                return
            }
            val activity = reactApplicationContext.currentActivity
            if (activity == null) {
                promise.reject("NO_ACTIVITY", "No current activity")
                return
            }
            val needsPermission = ContextCompat.checkSelfPermission(
                ctx,
                android.Manifest.permission.RECORD_AUDIO
            ) != PackageManager.PERMISSION_GRANTED
            if (needsPermission) {
                pendingSttPromise = promise
                pendingSttLanguage = language
                ActivityCompat.requestPermissions(
                    activity,
                    arrayOf(android.Manifest.permission.RECORD_AUDIO),
                    RECORD_AUDIO_REQUEST_CODE
                )
                return
            }
            activity.runOnUiThread {
                beginSTT(activity, language, promise)
            }
        } catch (e: Exception) {
            promise.reject("STT_START_FAILED", e.message, e)
        }
    }

    private fun beginSTT(activity: Activity, language: String, promise: Promise) {
        try {
            speechRecognizer?.destroy()
            speechRecognizer = SpeechRecognizer.createSpeechRecognizer(activity)
            val listener = object : RecognitionListener {
                override fun onReadyForSpeech(params: Bundle?) {
                    val m = Arguments.createMap(); m.putString("status", "ready"); emit("onSTTStatus", m)
                }
                override fun onBeginningOfSpeech() {}
                override fun onRmsChanged(rmsdB: Float) {
                    val m = Arguments.createMap(); m.putDouble("rms", rmsdB.toDouble()); emit("onSTTRms", m)
                }
                override fun onBufferReceived(buffer: ByteArray?) {}
                override fun onEndOfSpeech() {
                    val m = Arguments.createMap(); m.putString("status", "end"); emit("onSTTStatus", m)
                }
                override fun onError(error: Int) {
                    val m = Arguments.createMap(); m.putInt("code", error); m.putString("message", sttErrorString(error)); emit("onSTTError", m)
                }
                override fun onResults(results: Bundle?) {
                    val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                    val text = matches?.firstOrNull() ?: ""
                    val m = Arguments.createMap(); m.putString("text", text); emit("onSTTFinal", m)
                }
                override fun onPartialResults(partialResults: Bundle?) {
                    val matches = partialResults?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                    val text = matches?.firstOrNull() ?: ""
                    if (text.isNotEmpty()) {
                        val m = Arguments.createMap(); m.putString("text", text); emit("onSTTPartial", m)
                    }
                }
                override fun onEvent(eventType: Int, params: Bundle?) {}
            }
            speechRecognizer?.setRecognitionListener(listener)
            val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                putExtra(RecognizerIntent.EXTRA_LANGUAGE, language.ifEmpty { "en-US" })
                putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
                putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1)
            }
            speechRecognizer?.startListening(intent)
            promise.resolve("STARTED")
        } catch (e: Exception) {
            promise.reject("STT_START_FAILED", e.message, e)
        }
    }

    @ReactMethod
    fun stopSTT(promise: Promise) {
        try {
            speechRecognizer?.stopListening()
            promise.resolve("STOPPED")
        } catch (e: Exception) {
            promise.reject("STT_STOP_FAILED", e.message, e)
        }
    }

    private fun sttErrorString(code: Int): String {
        return when (code) {
            SpeechRecognizer.ERROR_AUDIO -> "Audio recording error"
            SpeechRecognizer.ERROR_CLIENT -> "Client side error"
            SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> "Microphone permission denied"
            SpeechRecognizer.ERROR_NETWORK -> "Network error"
            SpeechRecognizer.ERROR_NETWORK_TIMEOUT -> "Network timeout"
            SpeechRecognizer.ERROR_NO_MATCH -> "No speech match"
            SpeechRecognizer.ERROR_RECOGNIZER_BUSY -> "Recognizer busy"
            SpeechRecognizer.ERROR_SERVER -> "Server error"
            SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "No speech input"
            else -> "Unknown speech error ($code)"
        }
    }

    // ---- Text-to-Speech (Android TextToSpeech) ----

    @ReactMethod
    fun speakText(text: String, promise: Promise) {
        try {
            val ctx = reactApplicationContext
            fun doSpeak(engine: TextToSpeech) {
                val params = Bundle()
                val id = "lm_tts_${System.currentTimeMillis()}"
                engine.speak(text, TextToSpeech.QUEUE_FLUSH, params, id)
                promise.resolve("SPOKEN")
            }
            if (tts == null) {
                tts = TextToSpeech(ctx) { status ->
                    if (status == TextToSpeech.SUCCESS) {
                        ttsReady = true
                        tts?.language = java.util.Locale.US
                        doSpeak(tts!!)
                    } else {
                        promise.reject("TTS_INIT_FAILED", "Text-to-speech init failed")
                    }
                }
            } else {
                doSpeak(tts!!)
            }
        } catch (e: Exception) {
            promise.reject("TTS_FAILED", e.message, e)
        }
    }

    @ReactMethod
    fun stopSpeakingText(promise: Promise) {
        try {
            tts?.stop()
            promise.resolve("STOPPED")
        } catch (e: Exception) {
            promise.reject("TTS_STOP_FAILED", e.message, e)
        }
    }

    @ReactMethod
    fun isTtsAvailable(promise: Promise) {
        promise.resolve(true)
    }

    @ReactMethod
    fun isSttAvailable(promise: Promise) {
        try {
            promise.resolve(SpeechRecognizer.isRecognitionAvailable(reactApplicationContext))
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }

    /**
     * Extract text from a PDF on-device by decompressing Flate streams
     * (java.util.zip.Inflater) and scanning for Tj/TJ text operators.
     * `path` is an absolute file path (e.g. from pickFile's `path`).
     * Returns { text, pages }.
     */
    @ReactMethod
    fun extractPdfText(path: String, promise: Promise) {
        scope.launch {
            try {
                val file = File(path.replace("file://", ""))
                if (!file.exists()) {
                    promise.reject("PDF_NOT_FOUND", "Selected file not found")
                    return@launch
                }
                val data = file.readBytes()
                val sb = StringBuilder()
                var pageCount = 0

                // Count pages (match /Type /Page but not /Type /Pages).
                val ascii = String(data, Charsets.US_ASCII)
                val pm = Regex("/Type\\s*/Page(?![s/])").findAll(ascii)
                pageCount = pm.count()

                // Find stream ... endstream blocks in the RAW bytes (binary-safe).
                // PDF content streams are often Flate-compressed, so we must not
                // round-trip them through an ASCII String (that corrupts bytes > 127).
                val streamMarker = "stream".toByteArray(Charsets.US_ASCII)
                val endMarker = "endstream".toByteArray(Charsets.US_ASCII)
                var pos = 0
                while (pos < data.size) {
                    val sIdx = indexOf(data, streamMarker, pos)
                    if (sIdx < 0) break
                    // Skip past "stream" and the following EOL (\n or \r\n).
                    var p = sIdx + streamMarker.size
                    if (p < data.size && data[p] == '\r'.code.toByte()) p++
                    if (p < data.size && data[p] == '\n'.code.toByte()) p++
                    val eIdx = indexOf(data, endMarker, p)
                    if (eIdx < 0) break
                    // Trim a single trailing EOL before "endstream".
                    var end = eIdx
                    if (end > p && data[end - 1] == '\n'.code.toByte()) end--
                    if (end > p && data[end - 1] == '\r'.code.toByte()) end--
                    val rawBytes = data.copyOfRange(p, end)

                    var textBytes: ByteArray? = null
                    // Try raw first (uncompressed content stream).
                    val rawStr = String(rawBytes, Charsets.ISO_8859_1)
                    if (rawStr.contains("Tj") || rawStr.contains("TJ")) {
                        textBytes = rawBytes
                    } else {
                        // Try inflate. PDF /FlateDecode streams are zlib-wrapped.
                        try {
                            val inflater = java.util.zip.Inflater(false)
                            inflater.setInput(rawBytes)
                            val out = ByteArrayOutputStream()
                            val buf = ByteArray(64 * 1024)
                            while (!inflater.finished()) {
                                val n = inflater.inflate(buf)
                                if (n > 0) out.write(buf, 0, n)
                                if (n == 0) {
                                    if (inflater.finished() || inflater.needsDictionary() || inflater.needsInput()) break
                                }
                            }
                            inflater.end()
                            val inflated = out.toByteArray()
                            if (inflated.isNotEmpty()) {
                                val txt = String(inflated, Charsets.ISO_8859_1)
                                if (txt.contains("Tj") || txt.contains("TJ")) {
                                    textBytes = inflated
                                }
                            }
                        } catch (_: Exception) {
                            // ignore and move on
                        }
                    }
                    if (textBytes != null) {
                        sb.append(scanPdfTextOps(String(textBytes, Charsets.ISO_8859_1))).append(" ")
                    }
                    pos = eIdx + endMarker.size
                }

                val text = sb.toString().replace(Regex("[ \\t]+"), " ").replace(Regex("\n{2,}"), "\n").trim()
                val result: WritableMap = Arguments.createMap()
                result.putString("text", text)
                result.putInt("pages", pageCount)
                promise.resolve(result)
            } catch (e: Exception) {
                promise.reject("PDF_EXTRACT_FAILED", e.message, e)
            }
        }
    }

    private fun scanPdfTextOps(buffer: String): String {
        val out = StringBuilder()
        val tj = Regex("\\(((?:[^()\\\\]|\\\\.)*)\\)\\s*Tj")
        tj.findAll(buffer).forEach { m ->
            out.append(decodePdfString(m.groupValues[1])).append(" ")
        }
        val tjArr = Regex("\\[\\s*((?:[^\\[\\]]|\\((?:[^()\\\\]|\\\\.)*\\)|-?\\d+(?:\\.\\d+)?)\\s*)\\]\\s*TJ")
        tjArr.findAll(buffer).forEach { m ->
            val inner = m.groupValues[1]
            val parts = Regex("\\((?:[^()\\\\]|\\\\.)*\\)").findAll(inner)
            parts.forEach { p ->
                out.append(decodePdfString(p.value)).append(" ")
            }
        }
        return out.toString()
    }

    private fun decodePdfString(raw: String): String {
        var s = raw
        if (s.length >= 2 && s[0] == '(' && s[s.length - 1] == ')') {
            s = s.substring(1, s.length - 1)
        }
        return s
            .replace(Regex("\\\\([nrtbf()\\\\])")) { mr ->
                when (mr.groupValues[1]) {
                    "n" -> "\n"; "r" -> "\r"; "t" -> "\t"
                    "b" -> "\u0008"; "f" -> "\u000C"; else -> mr.groupValues[1]
                }
            }
            .replace(Regex("\\\\x([0-9A-Fa-f]{1,2})")) { mr ->
                val c = mr.groupValues[1].toInt(16)
                if (c > 0) String(charArrayOf(c.toChar())) else ""
            }
    }

    private fun indexOf(haystack: ByteArray, needle: ByteArray, from: Int): Int {
        if (needle.isEmpty()) return from
        var i = from
        while (i + needle.size <= haystack.size) {
            var match = true
            for (j in needle.indices) {
                if (haystack[i + j] != needle[j]) { match = false; break }
            }
            if (match) return i
            i++
        }
        return -1
    }

    private fun closeEngineInternal() {
        conversation?.close()
        conversation = null
        engine?.close()
        engine = null
        try {
            speechRecognizer?.destroy()
            speechRecognizer = null
        } catch (_: Exception) {}
        try {
            tts?.stop()
            tts?.shutdown()
            tts = null
        } catch (_: Exception) {}
    }
}
