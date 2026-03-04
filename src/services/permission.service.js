const fs = require('fs');
const path = require('path');

/**
 * Daftar semua Android permissions yang bisa dipilih user
 */
const ANDROID_PERMISSIONS = {
    // Kamera
    camera: {
        label: 'Camera',
        icon: '📷',
        description: 'Akses kamera untuk foto/video',
        permissions: ['android.permission.CAMERA'],
        features: ['android.hardware.camera'],
        capacitorPlugins: []
    },

    // Storage
    storage: {
        label: 'Storage',
        icon: '📂',
        description: 'Baca/tulis file di penyimpanan',
        permissions: [
            'android.permission.READ_EXTERNAL_STORAGE',
            'android.permission.WRITE_EXTERNAL_STORAGE',
            'android.permission.READ_MEDIA_IMAGES',
            'android.permission.READ_MEDIA_VIDEO',
            'android.permission.READ_MEDIA_AUDIO'
        ],
        features: [],
        capacitorPlugins: []
    },

    // Mikrofon/Audio
    microphone: {
        label: 'Microphone',
        icon: '🎤',
        description: 'Rekam audio dan suara',
        permissions: ['android.permission.RECORD_AUDIO', 'android.permission.MODIFY_AUDIO_SETTINGS'],
        features: ['android.hardware.microphone'],
        capacitorPlugins: []
    },

    // Lokasi
    location: {
        label: 'Location',
        icon: '📍',
        description: 'Akses GPS dan lokasi',
        permissions: [
            'android.permission.ACCESS_FINE_LOCATION',
            'android.permission.ACCESS_COARSE_LOCATION'
        ],
        features: ['android.hardware.location.gps'],
        capacitorPlugins: []
    },

    // Internet
    internet: {
        label: 'Internet',
        icon: '🌐',
        description: 'Akses internet dan jaringan',
        permissions: [
            'android.permission.INTERNET',
            'android.permission.ACCESS_NETWORK_STATE',
            'android.permission.ACCESS_WIFI_STATE'
        ],
        features: [],
        capacitorPlugins: []
    },

    // Notifikasi
    notifications: {
        label: 'Notifications',
        icon: '🔔',
        description: 'Kirim push notification',
        permissions: ['android.permission.POST_NOTIFICATIONS', 'android.permission.VIBRATE'],
        features: [],
        capacitorPlugins: []
    },

    // Bluetooth
    bluetooth: {
        label: 'Bluetooth',
        icon: '📶',
        description: 'Koneksi perangkat Bluetooth',
        permissions: [
            'android.permission.BLUETOOTH',
            'android.permission.BLUETOOTH_ADMIN',
            'android.permission.BLUETOOTH_CONNECT',
            'android.permission.BLUETOOTH_SCAN'
        ],
        features: ['android.hardware.bluetooth'],
        capacitorPlugins: []
    },

    // Kontak
    contacts: {
        label: 'Contacts',
        icon: '👥',
        description: 'Baca/tulis kontak',
        permissions: [
            'android.permission.READ_CONTACTS',
            'android.permission.WRITE_CONTACTS'
        ],
        features: [],
        capacitorPlugins: []
    },

    // Telepon
    phone: {
        label: 'Phone',
        icon: '📞',
        description: 'Info telepon dan panggilan',
        permissions: [
            'android.permission.READ_PHONE_STATE',
            'android.permission.CALL_PHONE'
        ],
        features: ['android.hardware.telephony'],
        capacitorPlugins: []
    },

    // Sensor (accelerometer, gyro, etc)
    sensors: {
        label: 'Sensors',
        icon: '🔄',
        description: 'Accelerometer, gyroscope, dll',
        permissions: ['android.permission.BODY_SENSORS'],
        features: ['android.hardware.sensor.accelerometer'],
        capacitorPlugins: []
    },

    // Biometric / Fingerprint
    biometric: {
        label: 'Biometric',
        icon: '🔐',
        description: 'Fingerprint dan face ID',
        permissions: ['android.permission.USE_BIOMETRIC', 'android.permission.USE_FINGERPRINT'],
        features: ['android.hardware.fingerprint'],
        capacitorPlugins: []
    },

    // Background services
    background: {
        label: 'Background',
        icon: '⚡',
        description: 'Jalankan proses di background',
        permissions: [
            'android.permission.FOREGROUND_SERVICE',
            'android.permission.WAKE_LOCK',
            'android.permission.RECEIVE_BOOT_COMPLETED'
        ],
        features: [],
        capacitorPlugins: []
    }
};

class PermissionService {
    constructor(logger) {
        this.logger = logger;
    }

    /**
     * Get daftar permissions yang tersedia
     */
    getAvailablePermissions() {
        return Object.entries(ANDROID_PERMISSIONS).map(([key, value]) => ({
            key,
            ...value
        }));
    }

    /**
     * Apply permissions ke AndroidManifest.xml
     */
    applyToManifest(androidProjectDir, selectedPermissions = []) {
        this.logger.info('🔑 Mengaplikasikan permissions ke AndroidManifest.xml...');

        const manifestPath = path.join(androidProjectDir, 'app', 'src', 'main', 'AndroidManifest.xml');

        if (!fs.existsSync(manifestPath)) {
            this.logger.warning('AndroidManifest.xml tidak ditemukan');
            return;
        }

        let manifest = fs.readFileSync(manifestPath, 'utf-8');

        // Kumpulkan semua permissions dan features
        const allPermissions = new Set();
        const allFeatures = new Set();

        // Internet selalu ditambahkan
        allPermissions.add('android.permission.INTERNET');
        allPermissions.add('android.permission.ACCESS_NETWORK_STATE');

        for (const key of selectedPermissions) {
            const perm = ANDROID_PERMISSIONS[key];
            if (perm) {
                perm.permissions.forEach(p => allPermissions.add(p));
                perm.features.forEach(f => allFeatures.add(f));
                this.logger.stdout(`  ✓ ${perm.label}: ${perm.permissions.length} permissions`);
            }
        }

        // Generate permission XML lines
        const permissionLines = Array.from(allPermissions)
            .filter(p => !manifest.includes(p))
            .map(p => `    <uses-permission android:name="${p}" />`)
            .join('\n');

        const featureLines = Array.from(allFeatures)
            .filter(f => !manifest.includes(f))
            .map(f => `    <uses-feature android:name="${f}" android:required="false" />`)
            .join('\n');

        // Insert setelah <manifest> tag
        if (permissionLines || featureLines) {
            const insertContent = [permissionLines, featureLines].filter(Boolean).join('\n');

            // Cari posisi setelah xmlns declaration
            const manifestTagEnd = manifest.indexOf('>', manifest.indexOf('<manifest'));
            if (manifestTagEnd > -1) {
                const insertPos = manifestTagEnd + 1;
                manifest = manifest.slice(0, insertPos) + '\n' + insertContent + manifest.slice(insertPos);
            }
        }

        fs.writeFileSync(manifestPath, manifest);
        this.logger.success(`🔑 ${allPermissions.size} permissions + ${allFeatures.size} features diterapkan`);
    }
}

module.exports = { PermissionService, ANDROID_PERMISSIONS };
