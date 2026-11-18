import { useEffect, useState } from "react";
import { useApp } from "../context.tsx";
import { spanishVoices, ttsAvailable } from "../lib/speech.ts";
import { exportBackup, importBackup } from "../lib/storage.ts";
import type { Settings as SettingsShape } from "../lib/types.ts";

export function Settings() {
  const { settings, setSettings, corpus, reload } = useApp();
  const [voices, setVoices] = useState(spanishVoices());
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    if (!ttsAvailable()) return;
    const load = () => setVoices(spanishVoices());
    load();
    speechSynthesis.addEventListener("voiceschanged", load);
    return () => speechSynthesis.removeEventListener("voiceschanged", load);
  }, []);

  function patch(partial: Partial<SettingsShape>) {
    setSettings({ ...settings, ...partial });
  }

  async function download() {
    const backup = await exportBackup();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "raiz-progress.json";
    link.click();
    URL.revokeObjectURL(url);
    setMessage("Backup downloaded.");
    setError("");
  }

  async function onFile(file: File | undefined, mode: "merge" | "replace") {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      await importBackup(parsed, mode);
      await reload();
      setMessage(mode === "merge" ? "Progress merged." : "This device now uses the imported file.");
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not read that file.");
      setMessage("");
    }
  }

  return (
    <div className="page">
      <header>
        <p className="eyebrow">Settings</p>
        <h1>Make it yours</h1>
      </header>
      <section className="panel" style={{ display: "grid", gap: 12 }}>
        <div className="toggle">
          <div>
            <strong>Spain Spanish</strong>
            <div className="muted">Shows vosotros and prefers an es-ES voice. Off uses Latin America and hides vosotros.</div>
          </div>
          <input type="checkbox" checked={settings.region === "spain"} onChange={(event) => patch({ region: event.target.checked ? "spain" : "latam" })} />
        </div>
        <label className="field">Daily goal
          <input type="number" min={5} max={200} value={settings.dailyGoal} onChange={(event) => patch({ dailyGoal: Number(event.target.value) })} />
        </label>
        <label className="field">New cards per day
          <input type="number" min={0} max={100} value={settings.newPerDay} onChange={(event) => patch({ newPerDay: Number(event.target.value) })} />
        </label>
        <label className="field">Voice speed ({settings.rate.toFixed(2)})
          <input type="range" min={0.7} max={1.2} step={0.02} value={settings.rate} onChange={(event) => patch({ rate: Number(event.target.value) })} />
        </label>
        <label className="field">Spanish voice
          <select value={settings.voiceURI} onChange={(event) => patch({ voiceURI: event.target.value })} disabled={!ttsAvailable()}>
            <option value="">Best match for the region</option>
            {voices.map((voice) => <option key={voice.voiceURI} value={voice.voiceURI}>{voice.name} ({voice.lang})</option>)}
          </select>
        </label>
        {!ttsAvailable() && <p className="muted">This browser has no speech synthesis. Listening mode still shows the choices.</p>}
        <label className="field">Theme
          <select value={settings.theme} onChange={(event) => patch({ theme: event.target.value as SettingsShape["theme"] })}>
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>
      </section>
      <section className="panel" style={{ display: "grid", gap: 10 }}>
        <h2>Move progress</h2>
        <p className="muted">Everything lives on this device. Export a JSON file and import it on the iPad.</p>
        <button className="btn" type="button" onClick={() => void download()}>Export JSON</button>
        <label className="btn" style={{ display: "grid", placeItems: "center" }}>
          Merge a file
          <input type="file" accept="application/json" hidden onChange={(event) => void onFile(event.target.files?.[0], "merge")} />
        </label>
        <label className="btn" style={{ display: "grid", placeItems: "center" }}>
          Replace this device
          <input type="file" accept="application/json" hidden onChange={(event) => void onFile(event.target.files?.[0], "replace")} />
        </label>
        {message && <p className="verdict correct">{message}</p>}
        {error && <p className="verdict wrong">{error}</p>}
      </section>
      <section className="panel">
        <h2>Sources</h2>
        <p className="muted">{corpus.meta.wordCount.toLocaleString()} lemmas, {corpus.meta.phraseCount.toLocaleString()} phrases, {corpus.meta.withExample.toLocaleString()} with a Wiktionary example.</p>
        <ul>
          {corpus.meta.sources?.map((source) => (
            <li key={source.name} style={{ marginBottom: 8 }}>
              <a href={source.url}>{source.name}</a> · {source.license}. {source.note}
            </li>
          ))}
        </ul>
        <ul>
          {(corpus.meta.filters ?? []).map((line) => <li key={line} className="muted">{line}</li>)}
        </ul>
      </section>
    </div>
  );
}
