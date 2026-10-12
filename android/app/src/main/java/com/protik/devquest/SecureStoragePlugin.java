package com.protik.devquest;

import android.content.Context;
import android.content.SharedPreferences;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import java.util.Map;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

/**
 * Stores API keys encrypted with an AES-256-GCM key that lives in the Android Keystore
 * (hardware-backed where available, never exported). Only ciphertext is written to SharedPreferences.
 */
@CapacitorPlugin(name = "SecureStorage")
public class SecureStoragePlugin extends Plugin {
    private static final String KEY_ALIAS = "devquest_secrets_key";
    private static final String PREFS = "devquest_secrets";

    private SecretKey key() throws Exception {
        KeyStore ks = KeyStore.getInstance("AndroidKeyStore");
        ks.load(null);
        if (ks.containsAlias(KEY_ALIAS)) return ((KeyStore.SecretKeyEntry) ks.getEntry(KEY_ALIAS, null)).getSecretKey();
        KeyGenerator gen = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore");
        gen.init(new KeyGenParameterSpec.Builder(KEY_ALIAS, KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
            .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
            .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
            .setKeySize(256)
            .build());
        return gen.generateKey();
    }

    private SharedPreferences prefs() {
        return getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    @PluginMethod
    public void set(PluginCall call) {
        String id = call.getString("id");
        String value = call.getString("value", "");
        if (id == null || !id.matches("[a-z0-9-]{1,40}")) {
            call.reject("Invalid id");
            return;
        }
        try {
            if (value == null || value.isEmpty()) {
                prefs().edit().remove(id).apply();
            } else {
                Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
                c.init(Cipher.ENCRYPT_MODE, key());
                byte[] iv = c.getIV();
                byte[] ct = c.doFinal(value.getBytes(StandardCharsets.UTF_8));
                String packed = Base64.encodeToString(iv, Base64.NO_WRAP) + ":" + Base64.encodeToString(ct, Base64.NO_WRAP);
                prefs().edit().putString(id, packed).apply();
            }
            call.resolve();
        } catch (Exception e) {
            call.reject("Could not store the key: " + e.getMessage());
        }
    }

    @PluginMethod
    public void getAll(PluginCall call) {
        JSObject out = new JSObject();
        try {
            SecretKey k = key();
            for (Map.Entry<String, ?> e : prefs().getAll().entrySet()) {
                try {
                    String[] parts = String.valueOf(e.getValue()).split(":", 2);
                    Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
                    c.init(Cipher.DECRYPT_MODE, k, new GCMParameterSpec(128, Base64.decode(parts[0], Base64.NO_WRAP)));
                    out.put(e.getKey(), new String(c.doFinal(Base64.decode(parts[1], Base64.NO_WRAP)), StandardCharsets.UTF_8));
                } catch (Exception ignored) {
                    // Unreadable (e.g. restored onto another device): the learner re-enters that key
                }
            }
            call.resolve(out);
        } catch (Exception e) {
            call.reject("Secure storage unavailable: " + e.getMessage());
        }
    }
}
