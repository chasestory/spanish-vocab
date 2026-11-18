import type { Settings } from "./types.ts";

export function spanishLang(region: Settings["region"]): string {
  return region === "spain" ? "es-ES" : "es-MX";
}

export function spanishVoices(): SpeechSynthesisVoice[] {
  if (typeof speechSynthesis === "undefined") return [];
  return speechSynthesis.getVoices().filter((voice) => voice.lang.toLowerCase().startsWith("es"));
}

export function speakSpanish(text: string, settings: Settings): void {
  if (typeof speechSynthesis === "undefined") return;
  const utterance = new SpeechSynthesisUtterance(text);
  const lang = spanishLang(settings.region);
  utterance.lang = lang;
  utterance.rate = settings.rate;
  const voices = spanishVoices();
  const chosen =
    voices.find((voice) => voice.voiceURI === settings.voiceURI) ??
    voices.find((voice) => voice.lang.toLowerCase() === lang.toLowerCase()) ??
    voices.find((voice) => voice.lang.toLowerCase().startsWith("es"));
  if (chosen) utterance.voice = chosen;
  speechSynthesis.cancel();
  speechSynthesis.speak(utterance);
}

export function ttsAvailable(): boolean {
  return typeof speechSynthesis !== "undefined";
}
