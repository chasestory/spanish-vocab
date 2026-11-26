import { useState } from "react";

const KEY = "raiz.intro";
const STEPS = [
  { title: "Tap Start", body: "Today mixes words that are due with a few new ones. One button is enough." },
  { title: "Say how it felt", body: "Again means you missed it and will see it soon. Easy means you knew it. Hard and Good sit in between." },
  { title: "The rest is in Explore", body: "Words, themes, verbs, and grammar live there. Your progress stays on this phone." },
];

export function Intro() {
  const [step, setStep] = useState(() => (localStorage.getItem(KEY) === "done" ? -1 : 0));
  if (step < 0) return null;
  const current = STEPS[step];
  if (!current) return null;
  function finish() {
    localStorage.setItem(KEY, "done");
    setStep(-1);
  }
  return (
    <div className="intro" role="dialog" aria-modal="true" aria-labelledby="intro-title">
      <div className="panel">
        <p className="eyebrow">Welcome</p>
        <h2 id="intro-title">{current.title}</h2>
        <p>{current.body}</p>
        <div className="dots" aria-hidden="true">
          {STEPS.map((item, index) => <i key={item.title} className={index === step ? "on" : ""} />)}
        </div>
        <div className="row">
          <button className="btn" type="button" onClick={finish}>Skip</button>
          {step < STEPS.length - 1 ? (
            <button className="btn primary" type="button" onClick={() => setStep(step + 1)}>Next</button>
          ) : (
            <button className="btn primary" type="button" onClick={finish}>Start using Raíz</button>
          )}
        </div>
      </div>
    </div>
  );
}
