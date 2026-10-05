"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "../../lib/supabase-browser";
import { api } from "../../lib/api";

export default function SettingsPage() {
  const [displayName, setDisplayName] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem("soundEnabled");
    if (stored !== null) setSoundEnabled(stored === "true");

    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setDisplayName(user.user_metadata?.display_name || user.email?.split("@")[0] || "");
        // Load avatar from profile
        api.getProfile(user.id).then((profile: any) => {
          if (profile?.avatar_url) setAvatarUrl(profile.avatar_url);
        }).catch(() => {});
      }
    });
  }, []);

  async function handleSaveName() {
    setSaving(true);
    setMessage("");
    try {
      await api.updateProfile({ display_name: displayName });
      setMessage("Name updated!");
    } catch {
      setMessage("Failed to update name");
    } finally {
      setSaving(false);
    }
  }

  function handleSoundToggle() {
    const newVal = !soundEnabled;
    setSoundEnabled(newVal);
    localStorage.setItem("soundEnabled", String(newVal));
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setMessage("Image too large. Max 2MB.");
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setMessage("Use JPEG, PNG, or WebP images.");
      return;
    }

    setUploading(true);
    setMessage("");
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        const result = await api.uploadAvatar(base64, file.type);
        setAvatarUrl(result.avatar_url);
        setMessage("Avatar updated!");
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setMessage("Failed to upload avatar");
      setUploading(false);
    }
  }

  async function handleDeleteAccount() {
    if (!confirm("Are you sure you want to delete your account? This cannot be undone.")) return;
    if (!confirm("This will permanently delete all your data. Continue?")) return;

    try {
      await api.deleteAccount();
      const supabase = createClient();
      await supabase.auth.signOut();
      window.location.href = "/login";
    } catch {
      setMessage("Failed to delete account. Please contact support.");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 pt-20 pb-8 px-4">
      <div className="max-w-lg mx-auto space-y-6">
        <h1 className="text-2xl font-black gradient-text">Settings</h1>

        {/* Avatar */}
        <div className="glass-card rounded-2xl p-6 space-y-3">
          <h2 className="font-bold">Profile Picture</h2>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xl font-bold overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                displayName?.charAt(0).toUpperCase() || "?"
              )}
            </div>
            <div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
              >
                {uploading ? "Uploading..." : "Change Avatar"}
              </button>
              <p className="text-xs text-white/40 mt-1">JPEG, PNG, or WebP. Max 2MB.</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>
        </div>

        {/* Display Name */}
        <div className="glass-card rounded-2xl p-6 space-y-3">
          <h2 className="font-bold">Display Name</h2>
          <div className="flex gap-2">
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={30}
              className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
            />
            <button
              onClick={handleSaveName}
              disabled={saving}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
            >
              {saving ? "..." : "Save"}
            </button>
          </div>
          {message && <p className="text-sm text-purple-400">{message}</p>}
        </div>

        {/* Sound */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold">Sound Effects</h2>
              <p className="text-sm text-white/40">Game sounds and notifications</p>
            </div>
            <button
              onClick={handleSoundToggle}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                soundEnabled ? "bg-purple-600" : "bg-white/20"
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                soundEnabled ? "translate-x-6" : "translate-x-0.5"
              }`} />
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="glass-card rounded-2xl p-6 border border-red-500/20">
          <h2 className="font-bold text-red-400 mb-2">Danger Zone</h2>
          <p className="text-sm text-white/40 mb-4">
            Permanently delete your account and all data.
          </p>
          <button
            onClick={handleDeleteAccount}
            className="px-4 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg text-sm font-medium transition-colors"
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}
