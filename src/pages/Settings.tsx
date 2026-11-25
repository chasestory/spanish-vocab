import { useEffect, useRef, useState } from "react";
import { renderSVG } from "uqr";
import { useApp } from "../context.tsx";
import { decodeSync, previewMerge, encodeSync, type MergePreview } from "../lib/sync.ts";
import { exportBackup, importBackup, type BackupFile } from "../lib/storage.ts";
import type { Settings as SettingsShape } from "../lib/types.ts";

export function Settings() {
  const { settings, setSettings, corpus, reload } = useApp();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [code, setCode] = useState("");
  const [paste, setPaste] = useState("");
  const [preview, setPreview] = useState<MergePreview | null>(null);
  const [pending, setPending] = useState<BackupFile | null>(null);
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  function patch(partial: Partial<SettingsShape>) {
    setSettings({ ...settings, ...partial });
  }

  async function makeCode() {
    const next = await encodeSync(await exportBackup());
    setCode(next);
    setMessage("Sync code ready. Copy it, or download the file.");
    setError("");
  }

  function download(filename: string, contents: string, type: string) {
    const blob = new Blob([contents], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function prepare(raw: string) {
    try {
      const incoming = await decodeSync(raw);
      const local = await exportBackup();
      const result = previewMerge(local, incoming);
      setPreview(result.preview);
      setPending(result.merged);
      setError("");
      setMessage("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not read that backup.");
      setPreview(null);
      setPending(null);
    }
  }

  async function confirm() {
    if (!pending) return;
    await importBackup(pending, "replace");
    await reload();
    setPreview(null);
    setPending(null);
    setMessage("Merged. The newest review of each card stayed, stars were combined, and the longer streak was kept.");
  }

  useEffect(() => {
    if (!scanning) return;
    let stop = false;
    let stream: MediaStream | null = null;
    const Detector = (window as unknown as { BarcodeDetector?: new (opts: { formats: string[] }) => { detect: (source: HTMLVideoElement) => Promise<{ rawValue?: string }[]> } }).BarcodeDetector;
    if (!Detector || !navigator.mediaDevices?.getUserMedia) {
      setError("This browser can’t scan a QR code. Paste the code instead.");
      setScanning(false);
      return;
    }
    const detector = new Detector({ formats: ["qr_code"] });
    void (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (!videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        const tick = async () => {
          if (stop || !videoRef.current) return;
          const found = await detector.detect(videoRef.current);
          const value = found.find((item) => item.rawValue)?.rawValue;
          if (value) {
            setScanning(false);
            await prepare(value);
            return;
          }
          requestAnimationFrame(() => void tick());
        };
        void tick();
      } catch {
        setError("The camera didn’t open. Paste the code instead.");
        setScanning(false);
      }
    })();
    return () => {
      stop = true;
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [scanning]);

  const qr = code && code.length < 1800 ? renderSVG(code, { pixelSize: 4, whiteColor: "#fffdf8", blackColor: "#1c1915" }) : "";

  return (
    <div className="page">
      <header>
        <p className="eyebrow">Settings</p>
        <h1>Make it yours</h1>
      </header>
      <section className="panel stack">
        <div className="toggle">
          <div>
            <strong>Spain Spanish</strong>
            <div className="muted">Shows vosotros. Off is Latin America and hides it.</div>
          </div>
          <input type="checkbox" checked={settings.region === "spain"} onChange={(event) => patch({ region: event.target.checked ? "spain" : "latam" })} />
        </div>
        <label className="field">Daily goal
          <input type="number" min={5} max={200} value={settings.dailyGoal} onChange={(event) => patch({ dailyGoal: Number(event.target.value) })} />
        </label>
        <label className="field">New cards per day
          <input type="number" min={0} max={100} value={settings.newPerDay} onChange={(event) => patch({ newPerDay: Number(event.target.value) })} />
        </label>
        <div className="field"><span>Appearance</span>
          <div className="seg">
            {(["system", "light", "dark"] as const).map((theme) => (
              <button key={theme} className={`btn${settings.theme === theme ? " primary" : ""}`} type="button" onClick={() => patch({ theme })}>{theme}</button>
            ))}
          </div>
        </div>
        <div className="field"><span>Text size</span>
          <div className="seg">
            <button className={`btn${settings.textSize !== "large" ? " primary" : ""}`} type="button" onClick={() => patch({ textSize: "normal" })}>Normal</button>
            <button className={`btn${settings.textSize === "large" ? " primary" : ""}`} type="button" onClick={() => patch({ textSize: "large" })}>Large</button>
          </div>
        </div>
      </section>
      <section className="panel stack">
        <h2>Move progress</h2>
        <p className="muted">No account. A sync code carries reviews, stars, and the streak. On the other device, import merges: the newer review wins, stars combine, and the longer streak stays. Settings on this device stay put.</p>
        <button className="btn primary" type="button" onClick={() => void makeCode()}>Make a sync code</button>
        {code && (
          <>
            <textarea readOnly value={code} rows={4} onFocus={(event) => event.currentTarget.select()} />
            <div className="row">
              <button className="btn" type="button" onClick={() => void navigator.clipboard.writeText(code).then(() => setMessage("Copied."))}>Copy</button>
              <button className="btn" type="button" onClick={() => download("raiz-sync.txt", code, "text/plain")}>Download code</button>
              <button className="btn" type="button" onClick={() => void exportBackup().then((file) => download("raiz-progress.json", JSON.stringify(file, null, 2), "application/json"))}>Download JSON</button>
            </div>
            {qr ? <div className="qr" dangerouslySetInnerHTML={{ __html: qr }} /> : <p className="muted">This backup is too long for a QR code. Copy it or download the file.</p>}
          </>
        )}
        <label className="field">Paste a code or JSON
          <textarea value={paste} rows={4} onChange={(event) => setPaste(event.target.value)} placeholder="raiz1.…" />
        </label>
        <div className="row">
          <button className="btn" type="button" onClick={() => void prepare(paste)}>Preview import</button>
          <button className="btn" type="button" onClick={() => setScanning(true)}>Scan QR</button>
          <label className="btn" style={{ display: "grid", placeItems: "center" }}>
            Choose a file
            <input type="file" accept="application/json,text/plain,.txt" hidden onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              void file.text().then((text) => prepare(text));
            }} />
          </label>
        </div>
        {scanning && <video ref={videoRef} className="scan" muted playsInline />}
        {preview && (
          <div className="verdict">
            <p>{preview.incomingCards} cards in the backup. {preview.added} new, {preview.updated} with a newer review, {preview.newStars} newly starred.</p>
            <p>Streak becomes {preview.streak} (this device {preview.localStreak}, the other {preview.incomingStreak}).</p>
            <button className="btn primary" type="button" onClick={() => void confirm()}>Merge into this device</button>
          </div>
        )}
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
      </section>
    </div>
  );
}
