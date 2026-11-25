import { Link, useParams } from "react-router-dom";
import { GenderTag } from "../components/GenderTag.tsx";
import { useApp } from "../context.tsx";
import { THEME_GROUPS, THEMES, themeById, themeCardId } from "../data/themes.ts";
import { isLearned } from "../lib/srs.ts";

export function Themes() {
  const { cards, setFilters, filters } = useApp();
  return (
    <div className="page">
      <header>
        <p className="eyebrow">Themes</p>
        <h1>Learn by place</h1>
        <p className="lede">Each set is a small deck you can study on its own.</p>
      </header>
      {THEME_GROUPS.map((group) => (
        <section key={group} className="stack">
          <h2>{group}</h2>
          {THEMES.filter((theme) => theme.group === group).map((theme) => {
            const known = theme.items.filter((item) => isLearned(cards.get(themeCardId(theme.id, item)))).length;
            return (
              <Link key={theme.id} className="pick" to={`/themes/${theme.id}`}>
                <span><b>{theme.title}</b><small>{known}/{theme.items.length} learned · {theme.blurb}</small></span>
                <span>›</span>
              </Link>
            );
          })}
        </section>
      ))}
      <button
        className="btn"
        type="button"
        onClick={() => setFilters({ ...filters, sets: filters.sets.includes("themes") ? filters.sets : [...filters.sets, "themes"], themes: [] })}
      >
        Use every theme in Study
      </button>
    </div>
  );
}

export function ThemeDetail() {
  const { id = "" } = useParams();
  const theme = themeById(id);
  const { cards, setFilters, filters, toggleStar } = useApp();
  if (!theme) return <section className="panel"><h1>That theme isn’t here.</h1><Link to="/themes">Themes</Link></section>;
  return (
    <div className="page">
      <Link className="back" to="/themes">{theme.group}</Link>
      <header>
        <p className="eyebrow">{theme.group}</p>
        <h1>{theme.title}</h1>
        <p className="lede">{theme.blurb}</p>
      </header>
      <Link
        className="btn primary huge"
        to="/study?start=1"
        onClick={() => setFilters({ ...filters, sets: ["themes"], themes: [theme.id], mode: filters.mode })}
      >
        Study {theme.title}
      </Link>
      <div className="stack">
        {theme.items.map((item) => {
          const cardId = themeCardId(theme.id, item);
          const starred = cards.get(cardId)?.starred ?? false;
          return (
            <article key={cardId} className="panel stack">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <GenderTag gender={item.gender} article={item.article} />
                <button className={`btn star${starred ? " on" : ""}`} type="button" onClick={() => void toggleStar(cardId)}>{starred ? "Starred" : "Star"}</button>
              </div>
              <h2 style={{ margin: 0 }}>{item.es}</h2>
              <p className="muted" style={{ margin: 0 }}>{item.en}</p>
              <blockquote className="example">
                <p>{item.example}</p>
                <p className="en">{item.exampleEn}</p>
              </blockquote>
            </article>
          );
        })}
      </div>
    </div>
  );
}
