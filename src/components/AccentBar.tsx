const ACCENTS = ["á", "é", "í", "ó", "ú", "ñ", "ü", "¿", "¡"];

export function AccentBar({ onInsert }: { onInsert: (char: string) => void }) {
  return (
    <div className="accent-bar" aria-label="Spanish accents">
      {ACCENTS.map((char) => (
        <button key={char} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => onInsert(char)}>
          {char}
        </button>
      ))}
    </div>
  );
}
