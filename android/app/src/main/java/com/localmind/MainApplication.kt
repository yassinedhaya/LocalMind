package com.localmind

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost

class MainApplication : Application(), ReactApplication {

  // Uses the default JS engine (Hermes), which is bundled in the APK.
  override val reactHost: ReactHost by lazy {
    DefaultReactHost.getDefaultReactHost(
      applicationContext,
      PackageList(this).packages.apply {
        add(LocalMindPackage())
      }
    )
  }

  override fun onCreate() {
    super.onCreate()
    loadReactNative(this)
  }
}
