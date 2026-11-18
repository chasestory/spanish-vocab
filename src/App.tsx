import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Shell } from "./components/Shell.tsx";
import { AppProvider } from "./context.tsx";
import { Browse } from "./pages/Browse.tsx";
import { Drill } from "./pages/Drill.tsx";
import { Home } from "./pages/Home.tsx";
import { Phrases } from "./pages/Phrases.tsx";
import { Saved } from "./pages/Saved.tsx";
import { Settings } from "./pages/Settings.tsx";
import { Study } from "./pages/Study.tsx";
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
            <Route path="/words" element={<Browse />} />
            <Route path="/word/:id" element={<WordPage />} />
            <Route path="/phrases" element={<Phrases />} />
            <Route path="/drill" element={<Drill />} />
            <Route path="/saved" element={<Saved />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Shell>
      </AppProvider>
    </BrowserRouter>
  );
}
