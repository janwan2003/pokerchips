import java.util.Properties

plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.kotlin.serialization)
}

android {
    namespace = "com.pokerchips"
    compileSdk = 36

    defaultConfig {
        minSdk = 26
        targetSdk = 36
        versionCode = 8
        versionName = "1.7"
    }

    // One fixed key, checked in, so every build from any machine can install over the
    // previous one. A different key forces an uninstall, and an uninstall deletes the
    // saved game history - the thing this app must never lose.
    signingConfigs {
        create("shared") {
            storeFile = rootProject.file("keystore/pokerchips.jks")
            storePassword = "pokerchips"
            keyAlias = "pokerchips"
            keyPassword = "pokerchips"
        }
        // The Play Store upload key. Private: it lives outside the repo, in
        // ~/.config/easypoker/upload.properties (or $EASYPOKER_UPLOAD_PROPERTIES). Without
        // it the play release builds unsigned, which Play will not accept.
        val uploadProps = (System.getenv("EASYPOKER_UPLOAD_PROPERTIES")
            ?: "${System.getProperty("user.home")}/.config/easypoker/upload.properties").let(::File)
        if (uploadProps.exists()) {
            val p = Properties().apply { uploadProps.inputStream().use { load(it) } }
            create("upload") {
                storeFile = File(p.getProperty("storeFile"))
                storePassword = p.getProperty("storePassword")
                keyAlias = p.getProperty("keyAlias")
                keyPassword = p.getProperty("keyPassword")
            }
        }
    }

    // legacy: the sideloaded "PokerChips" (com.pokerchips) that existing phones run; same
    //         checked-in key forever, so it keeps updating in place and keeps its history.
    // play:   "EasyPoker" (cc.easypoker.app) for Google Play. com.pokerchips is taken there.
    //         History moves over with Export / Import on the history screen.
    flavorDimensions += "store"
    productFlavors {
        create("legacy") {
            dimension = "store"
            applicationId = "com.pokerchips"
            resValue("string", "app_name", "PokerChips")
            buildConfigField("boolean", "ASK_BATTERY_EXEMPTION", "true")
            signingConfig = signingConfigs.getByName("shared")
        }
        create("play") {
            dimension = "store"
            applicationId = "cc.easypoker.app"
            resValue("string", "app_name", "EasyPoker")
            buildConfigField("boolean", "ASK_BATTERY_EXEMPTION", "false")
            signingConfig = signingConfigs.findByName("upload")
        }
    }

    buildTypes {
        debug {
            signingConfig = signingConfigs.getByName("shared")
        }
        release {
            isMinifyEnabled = false
            // Signed per flavor (see productFlavors).
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
            excludes += "/META-INF/INDEX.LIST"
            excludes += "/META-INF/io.netty.*"
        }
    }
}

dependencies {
    implementation(platform(libs.compose.bom))
    implementation(libs.compose.ui)
    implementation(libs.compose.ui.graphics)
    implementation(libs.compose.material3)
    implementation(libs.compose.material.icons)
    implementation(libs.compose.ui.tooling.preview)
    debugImplementation(libs.compose.ui.tooling)

    implementation(libs.core.ktx)
    implementation(libs.activity.compose)
    implementation(libs.lifecycle.runtime.compose)
    implementation(libs.lifecycle.viewmodel.compose)
    implementation(libs.lifecycle.service)

    implementation(libs.ktor.server.core)
    implementation(libs.ktor.server.cio)
    implementation(libs.ktor.server.websockets)
    implementation(libs.ktor.server.content.negotiation)
    implementation(libs.ktor.server.cors)
    implementation(libs.ktor.server.status.pages)
    implementation(libs.ktor.serialization.json)

    implementation(libs.kotlinx.serialization.json)
    implementation(libs.kotlinx.coroutines.android)

    implementation(libs.zxing.core)
    implementation(libs.zxing.android.embedded)

    testImplementation(libs.junit)
    testImplementation(libs.kotlinx.coroutines.test)
    testImplementation(libs.ktor.client.cio)
    testImplementation(libs.ktor.client.websockets)
}
