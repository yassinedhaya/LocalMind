package com.localmind

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule
import android.os.Handler
import android.os.Looper
import android.util.Log

class TimerTickerModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val handler = Handler(Looper.getMainLooper())
    private var running = false
    private val intervalMs = 250L

    private val tickRunnable = object : Runnable {
        override fun run() {
            if (!running) return
            sendTick()
            handler.postDelayed(this, intervalMs)
        }
    }

    override fun getName(): String = "TimerTicker"

    private fun sendTick() {
        val params = Arguments.createMap()
        params.putDouble("now", System.currentTimeMillis().toDouble())
        try {
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit("timerTick", params)
        } catch (e: Exception) {
            Log.e("TimerTicker", "emit failed: " + e.message)
        }
    }

    @ReactMethod
    fun start() {
        Log.d("TimerTicker", "start() called")
        if (running) return
        running = true
        handler.postDelayed(tickRunnable, intervalMs)
    }

    @ReactMethod
    fun stop() {
        Log.d("TimerTicker", "stop() called")
        running = false
        handler.removeCallbacks(tickRunnable)
    }

    override fun invalidate() {
        running = false
        handler.removeCallbacks(tickRunnable)
        super.invalidate()
    }
}
