# 🚀 APK Builder Automation

APK Builder adalah platform otomatisasi untuk mengonversi project web (React, Vue, Laravel, Next.js, Static HTML, dll) menjadi aplikasi Android (.apk) secara instan. User cukup mengunggah folder project dalam format ZIP, dan sistem akan melakukan deteksi framework, instalasi dependencies, konfigurasi icon, permission, hingga proses build APK secara otomatis.

---

## 🛠️ Cara Kerja Sistem

1.  **Project Upload**: User mengunggah file ZIP berisi source code project web.
2.  **Smart Detection**: Sistem mendeteksi framework dan kebutuhan database.
3.  **Auto Configuration**: Memasang dependencies (`npm install`) dan menyusun environment.
4.  **Resource Injection**: Menyuntikkan icon (otomatis resize) dan Android Permissions.
5.  **Native Build**: Menggunakan Capacitor dan Gradle untuk mengompilasi APK.
6.  **Real-time Logs**: Pantau proses melalui terminal dashboard.

---

## 📋 Persyaratan Sistem (Prerequisites)

| Komponen | Versi Minimum | Keterangan |
| :--- | :--- | :--- |
| **Node.js** | v18.x atau v22.x | Runtime utama server |
| **Java JDK** | 17 (LTS) | Diperlukan oleh Gradle untuk build Android |
| **Android SDK** | API 33/34 | Diperlukan untuk kompilasi native |
| **RAM** | 4GB (8GB Rekomendasi) | Proses Gradle cukup memakan memori |

---

## 🪟 Panduan Instalasi: Windows (Detail)

Ikuti langkah-langkah ini secara berurutan untuk hasil terbaik.

### 1. Install Node.js
- Download installer **LTS** dari [nodejs.org](https://nodejs.org/).
- Centang opsi *"Automatically install the necessary tools"* (ini akan menginstall Python dan Visual Studio Build Tools yang dibutuhkan beberapa library).

### 2. Install Java JDK 17
1.  Download **x64 Installer** dari [Oracle JDK 17](https://www.oracle.com/java/technologies/downloads/#java17).
2.  Setelah install, buka **Start Menu** > ketik "env" > Pilih **"Edit the system environment variables"**.
3.  Klik **Environment Variables**.
4.  Di bagian **System Variables**, klik **New**:
    - **Variable name**: `JAVA_HOME`
    - **Variable value**: `C:\Program Files\Java\jdk-17` (Sesuaikan dengan folder install Anda).
5.  Cari variable **Path**, klik **Edit** > **New**, masukkan: `%JAVA_HOME%\bin`.

### 3. Install Android SDK (via Android Studio)
1.  Download & Install [Android Studio](https://developer.android.com/studio).
2.  Buka Android Studio, klik **More Actions** > **SDK Manager**.
3.  Di tab **SDK Platforms**: Pastikan **Android 14.0 (UpsideDownCake)** atau versi terbaru tercentang.
4.  Di tab **SDK Tools**: **WAJIB** centang:
    - `Android SDK Build-Tools`
    - `Android SDK Command-line Tools (latest)`
    - `Android Emulator`
    - `Android SDK Platform-Tools`
5.  Klik **Apply** dan tunggu hingga selesai.

### 4. Atur Environment Variables Android
Kembali ke menu **Environment Variables**:
1.  Klik **New** di System Variables:
    - **Variable name**: `ANDROID_HOME`
    - **Variable value**: `C:\Users\NAMA_USER\AppData\Local\Android\Sdk` (Ganti `NAMA_USER` dengan username Windows Anda).
2.  Edit variable **Path**, tambahkan 3 baris baru ini:
    - `%ANDROID_HOME%\platform-tools`
    - `%ANDROID_HOME%\cmdline-tools\latest\bin`
    - `%ANDROID_HOME%\build-tools\34.0.0` (Sesuaikan versi build-tools yang terinstall).

---

## 🐧 Panduan Instalasi: Linux (Ubuntu/Debian)

Jalankan perintah berikut di terminal:

### 1. Update & Install Java
```bash
sudo apt update
sudo apt install openjdk-17-jdk -y
```

### 2. Install Node.js (via NodeSource)
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

### 3. Setup Android SDK
Download command-line tools dan letakkan di `~/Android/Sdk`. Tambahkan ini ke file `~/.bashrc` atau `~/.zshrc`:
```bash
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/build-tools/34.0.0
```
Lalu jalankan `source ~/.bashrc`.

---

## 🚀 Instalasi Project APK Builder

Setelah environment siap, jalankan langkah berikut:

1.  **Ekstrak/Clone Project** ke folder tujuan.
2.  **Buka Terminal/CMD** di folder tersebut.
3.  **Install Dependencies**:
    ```bash
    npm install
    # Khusus Linux/macOS, pastikan sharp terinstall benar:
    npm install --os=linux --cpu=x64 sharp
    ```
4.  **Siapkan Folder Kerja**:
    ```bash
    mkdir workspace builds
    ```
5.  **Jalankan Aplikasi**:
    ```bash
    node server.js
    ```
    Buka dashboard di: `http://localhost:3000`

---

## � Cara Verifikasi Instalasi

Sebelum mulai build, pastikan perintah ini berjalan di terminal Anda tanpa error:
- `node -v` (Cek Node.js)
- `java -version` (Cek Java)
- `adb --version` (Cek Android Tools)
- `sdkmanager --list` (Cek SDK)

---

## ❓ Masalah Umum (Troubleshooting)

-   **Error: EADDRINUSE (Port 3000 occupied)**: Ada aplikasi lain (atau instance server lama) yang menggunakan port 3000. Matikan dulu atau ganti port di `server.js`.
-   **Gradle Stuck/Lama**: Build pertama kali memang memakan waktu lama karena Gradle mendownload file pendukung (~500MB). Pastikan internet stabil.
-   **RAM Habis**: Jika build gagal dengan error "Exit code 137", berarti RAM server Anda habis. Tutup aplikasi berat lain.
-   **ENOENT (spawn /bin/sh)**: Pastikan Anda menjalankan terminal dengan hak akses yang benar dan path Node.js sudah terdaftar di environment variables.

---n
💡 **Tips**: Selalu gunakan file project yang sudah dites berjalan normal di lokal sebelum diunggah ke builder.
