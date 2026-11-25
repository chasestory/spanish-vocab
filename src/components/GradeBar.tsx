import { reviewCard, type CardState, type Rating } from "../lib/srs.ts";

const RATINGS: Rating[] = ["again", "hard", "good", "easy"];

export function GradeBar({ card, onGrade }: { card: CardState; onGrade: (rating: Rating) => void }) {
  return (
    <div className="rates" role="group" aria-label="How well did you know it?">
      {RATINGS.map((rating) => {
        const next = reviewCard(card, rating, Date.now());
        const when = rating === "again" ? "10m" : `${next.interval}d`;
        const label = rating[0]?.toUpperCase() + rating.slice(1);
        return (
          <button key={rating} className={`rate ${rating}`} type="button" onClick={() => onGrade(rating)}>
            {label}<small>{when}</small>
          </button>
        );
      })}
    </div>
  );
}
