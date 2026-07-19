package com.localmind

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.util.Log
import java.io.File
import java.io.FileOutputStream
import java.net.HttpURLConnection
import java.net.URL

class DownloadService : Service() {

    companion object {
        const val ACTION_DOWNLOAD = "com.localmind.DOWNLOAD"
        const val EXTRA_MODEL_ID = "model_id"
        const val EXTRA_URL = "download_url"
        const val EXTRA_EXPECTED_BYTES = "expected_bytes"
        const val CHANNEL_ID = "model_download"
        const val NOTIFICATION_ID = 1001
        private const val TAG = "DownloadService"

        var progressCallback: ((modelId: String, percent: Int, speedMBs: Double) -> Unit)? = null
        var completeCallback: ((modelId: String, success: Boolean, error: String?) -> Unit)? = null

        fun cancelDownload(modelId: String) {
            val srv = activeService
            if (srv != null && srv.currentModelId == modelId) {
                srv.cancelled = true
                val modelsDir = File(srv.getExternalFilesDir(null), "models")
                File(modelsDir, "$modelId.litertlm.tmp").delete()
                File(modelsDir, "$modelId.litertlm").delete()
                srv.stopForeground(STOP_FOREGROUND_REMOVE)
                srv.stopSelf()
            }
        }

        private var activeService: DownloadService? = null
    }

    private var cancelled = false
    private var currentModelId: String? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        activeService = this
    }

    override fun onDestroy() {
        super.onDestroy()
        if (activeService === this) activeService = null
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action != ACTION_DOWNLOAD) {
            stopSelf(startId)
            return START_NOT_STICKY
        }

        val modelId = intent.getStringExtra(EXTRA_MODEL_ID) ?: run {
            stopSelf(startId)
            return START_NOT_STICKY
        }
        currentModelId = modelId
        val urlStr = intent.getStringExtra(EXTRA_URL) ?: run {
            stopSelf(startId)
            return START_NOT_STICKY
        }
        val expectedBytes = intent.getLongExtra(EXTRA_EXPECTED_BYTES, 2580000000L)

        val notification = buildNotification("Starting download...", 0)
        startForeground(NOTIFICATION_ID, notification)

        cancelled = false

        Thread {
            try {
                downloadFile(modelId, urlStr, expectedBytes)
                if (!cancelled) {
                    completeCallback?.invoke(modelId, true, null)
                }
            } catch (e: Exception) {
                if (!cancelled) {
                    Log.e(TAG, "Download failed: ${e.message}", e)
                    completeCallback?.invoke(modelId, false, e.message)
                }
            } finally {
                stopForeground(STOP_FOREGROUND_REMOVE)
                stopSelf(startId)
            }
        }.start()

        return START_REDELIVER_INTENT
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun downloadFile(modelId: String, urlStr: String, expectedBytes: Long) {
        val modelsDir = File(getExternalFilesDir(null), "models")
        modelsDir.mkdirs()
        val destPath = File(modelsDir, "$modelId.litertlm")
        val tmpPath = File(modelsDir, "$modelId.litertlm.tmp")

        val existingBytes = if (tmpPath.exists()) tmpPath.length() else 0L
        val url = URL(urlStr)
        val conn = url.openConnection() as HttpURLConnection
        conn.connectTimeout = 60000
        conn.readTimeout = 300000
        if (existingBytes > 0) {
            conn.setRequestProperty("Range", "bytes=$existingBytes-")
        }
        conn.connect()
        val totalBytes = conn.contentLengthLong.let { if (it > 0) it + existingBytes else expectedBytes }
        val input = conn.inputStream
        val output = FileOutputStream(tmpPath, existingBytes > 0)
        val buffer = ByteArray(32768)
        var bytesRead: Int
        var totalRead: Long = existingBytes
        var lastEmittedPercent = -1
        var chunkCount = 0
        var speedSamples = mutableListOf<Pair<Long, Long>>()
        var lastSpeedEmit = 0L

        input.use { inp ->
            output.use { out ->
                while (inp.read(buffer).also { bytesRead = it } != -1) {
                    if (cancelled) {
                        Log.d(TAG, "Download cancelled for $modelId")
                        break
                    }
                    out.write(buffer, 0, bytesRead)
                    totalRead += bytesRead
                    chunkCount++
                    speedSamples.add(Pair(System.currentTimeMillis(), bytesRead.toLong()))
                    val percent = ((totalRead * 100) / totalBytes).toInt().coerceIn(0, 100)
                    val step = percent / 5 * 5
                    if (step != lastEmittedPercent || chunkCount % 50 == 0) {
                        lastEmittedPercent = step
                        val now = System.currentTimeMillis()
                        val windowStart = now - 3000
                        speedSamples = speedSamples.dropWhile { it.first < windowStart }.toMutableList()
                        val windowBytes = speedSamples.sumOf { it.second }
                        val windowMs = (now - (speedSamples.firstOrNull()?.first ?: now)).coerceAtLeast(1)
                        val speedBps = (windowBytes * 1000L) / windowMs
                        lastSpeedEmit = now
                        val speedMBs = speedBps.toDouble() / (1024.0 * 1024.0)
                        val notif = buildNotification("Downloading $modelId", percent)
                        val manager = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
                        manager.notify(NOTIFICATION_ID, notif)
                        progressCallback?.invoke(modelId, percent, speedMBs)
                    }
                }
            }
        }

        if (cancelled) {
            tmpPath.delete()
            Log.d(TAG, "Deleted partial download: $tmpPath")
            return
        }

        tmpPath.renameTo(destPath)
        val finalNotif = buildNotification("Download complete", 100)
        val manager = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
        manager.notify(NOTIFICATION_ID, finalNotif)
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Model Downloads",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Shows model download progress"
            }
            val manager = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(text: String, progress: Int): Notification {
        val openIntent = packageManager.getLaunchIntentForPackage(packageName)
        val openPI = PendingIntent.getActivity(
            this, 0, openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Notification.Builder(this, CHANNEL_ID)
        } else {
            Notification.Builder(this)
        }
        return builder
            .setContentTitle("LocalMind - Downloading Model")
            .setContentText(text)
            .setSmallIcon(android.R.drawable.stat_sys_download)
            .setContentIntent(openPI)
            .setOngoing(progress < 100)
            .apply {
                if (progress >= 0) {
                    setProgress(100, progress, false)
                }
            }
            .build()
    }
}
