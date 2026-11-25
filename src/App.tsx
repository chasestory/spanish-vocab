import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Shell } from "./components/Shell.tsx";
import { AppProvider } from "./context.tsx";
import { Browse } from "./pages/Browse.tsx";
import { Explore } from "./pages/Explore.tsx";
import { Grammar, GrammarLesson } from "./pages/Grammar.tsx";
import { Home } from "./pages/Home.tsx";
import { Phrases } from "./pages/Phrases.tsx";
import { Prepositions } from "./pages/Prepositions.tsx";
import { Progress } from "./pages/Progress.tsx";
import { Pronouns } from "./pages/Pronouns.tsx";
import { Saved } from "./pages/Saved.tsx";
import { Settings } from "./pages/Settings.tsx";
import { Study } from "./pages/Study.tsx";
import { ThemeDetail, Themes } from "./pages/Themes.tsx";
import { Verbs } from "./pages/Verbs.tsx";
import { WordPage } from "./pages/Word.tsx";

const basename = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function App() {
  return (
    <BrowserRouter basename={basename}>
      <AppProvider>
        <Shell>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/study" element={<Study />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/words" element={<Browse />} />
            <Route path="/word/:id" element={<WordPage />} />
            <Route path="/phrases" element={<Phrases />} />
            <Route path="/verbs" element={<Verbs />} />
            <Route path="/drill" element={<Navigate to="/verbs" replace />} />
            <Route path="/prepositions" element={<Prepositions />} />
            <Route path="/pronouns" element={<Pronouns />} />
            <Route path="/themes" element={<Themes />} />
            <Route path="/themes/:id" element={<ThemeDetail />} />
            <Route path="/grammar" element={<Grammar />} />
            <Route path="/grammar/:id" element={<GrammarLesson />} />
            <Route path="/saved" element={<Saved />} />
          </Routes>
        </Shell>
      </AppProvider>
    </BrowserRouter>
  );
}
