import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { APP_AUTHOR, isDesktopApp, isNativeApp, registerBackButton } from './engine/platform';
import { useGame } from './engine/store';
import { levelFromXp, rankFor } from './engine/levels';
import { useToasts } from './engine/toast';
import { Dashboard } from './pages/Dashboard';
import { SkillMap } from './pages/SkillMap';
const TrackPage = lazy(() => import('./pages/TrackPage').then((m) => ({ default: m.TrackPage })));
const LessonPage = lazy(() => import('./pages/LessonPage').then((m) => ({ default: m.LessonPage })));
const Review = lazy(() => import('./pages/Review').then((m) => ({ default: m.Review })));
const Atlas = lazy(() => import('./pages/Atlas').then((m) => ({ default: m.Atlas })));
const Lab = lazy(() => import('./pages/Lab').then((m) => ({ default: m.Lab })));
const Shop = lazy(() => import('./pages/Shop').then((m) => ({ default: m.Shop })));
const Achievements = lazy(() => import('./pages/Achievements').then((m) => ({ default: m.Achievements })));
const Settings = lazy(() => import('./pages/Settings').then((m) => ({ default: m.Settings })));
const Playground = lazy(() => import('./pages/Playground').then((m) => ({ default: m.Playground })));
import { Welcome } from './pages/Welcome';
const Projects = lazy(() => import('./pages/Projects').then((m) => ({ default: m.Projects })));
const ProjectWorkspace = lazy(() => import('./pages/ProjectWorkspace').then((m) => ({ default: m.ProjectWorkspace })));
const Dojo = lazy(() => import('./pages/Dojo').then((m) => ({ default: m.Dojo })));
const AgentLab = lazy(() => import('./pages/AgentLab').then((m) => ({ default: m.AgentLab })));
const Guide = lazy(() => import('./pages/Guide').then((m) => ({ default: m.Guide })));
import { PathPage, PathPicker } from './pages/Paths';
const Download = lazy(() => import('./pages/Download').then((m) => ({ default: m.Download })));
const Languages = lazy(() => import('./pages/Languages').then((m) => ({ default: m.Languages })));
import { Tutor } from './components/Tutor';
import { ErrorBoundary } from './components/ErrorBoundary';

const NAV = [
  ['/', '🏠', 'Home'],
  ['/path', '🧭', 'My Path'],
  ['/map', '🗺️', 'Skill Map'],
  ['/languages', '🔤', 'Languages'],
  ['/dojo', '🥋', 'Code Dojo'],
  ['/projects', '🏗️', 'Projects'],
  ['/agent', '🧪', 'Agent Lab'],
  ['/review', '🃏', 'Review'],
  ['/playground', '🧪', 'Playground'],
  ['/atlas', '📖', 'Command Atlas'],
  ['/lab', '🔬', 'Visual Lab'],
  ['/achievements', '🏆', 'Achievements'],
  ['/shop', '💎', 'Shop'],
  ['/guide', '📘', 'Guide'],
  ['/settings', '⚙️', 'Settings'],
  // The Download page only makes sense in the browser, not inside the apps themselves
  ...(isNativeApp || isDesktopApp ? [] : ([['/download', '⬇️', 'Get the app']] as const)),
] as const;

/** Phone-sized bottom tab bar for the most-used sections; "More" opens the full menu. */
const TABS = [
  ['/', '🏠', 'Home'],
  ['/path', '🧭', 'Path'],
  ['/dojo', '🥋', 'Dojo'],
  ['/projects', '🏗️', 'Projects'],
] as const;

function BottomNav({ onMore, moreOpen }: { onMore: () => void; moreOpen: boolean }) {
  return (
    <nav className="bottom-nav" aria-label="Main">
      {TABS.map(([to, icon, label]) => (
        <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => (isActive && !moreOpen ? 'active' : '')}>
          <span className="bn-icon">{icon}</span>
          <span className="bn-label">{label}</span>
        </NavLink>
      ))}
      <button className={moreOpen ? 'active' : ''} onClick={onMore} aria-label="More">
        <span className="bn-icon">☰</span>
        <span className="bn-label">More</span>
      </button>
    </nav>
  );
}

function TopBar() {
  const xp = useGame((s) => s.xp);
  const gems = useGame((s) => s.gems);
  const streak = useGame((s) => s.streak);
  const potionUntil = useGame((s) => s.potionUntil);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(t);
  }, []);
  const lv = levelFromXp(xp);
  const rank = rankFor(lv.level);
  const potionMin = Math.ceil((potionUntil - now) / 60000);
  return (
    <header className="topbar">
      <div className="level-chip" title={`${lv.into} / ${lv.span} XP to level ${lv.level + 1}`}>
        <span className="lv">Lv {lv.level}</span>
        <div className="xpbar">
          <div style={{ width: `${lv.progress * 100}%` }} />
        </div>
        <span className="muted small">
          {rank.emoji} {rank.name}
        </span>
      </div>
      <span className="spacer" />
      {potionMin > 0 && <span className="chip potion" title="XP Potion active: +50% XP">🧪 {potionMin}m</span>}
      <span className="chip xp-total" title="Total XP">⭐ {xp.toLocaleString()}</span>
      <span className="chip" title="Gems">💎 {gems}</span>
      <span className={`chip ${streak.count ? 'fire' : ''}`} title={`Best streak: ${streak.best}`}>🔥 {streak.count}</span>
    </header>
  );
}

function Toasts() {
  const list = useToasts((s) => s.list);
  return (
    <div className="toasts">
      {list.map((t) => (
        <div key={t.id} className={`toast ${t.kind}`}>
          <b>{t.title}</b>
          {t.body && <div>{t.body}</div>}
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const theme = useGame((s) => s.settings.theme);
  const name = useGame((s) => s.name);
  const loc = useLocation();
  const navigate = useNavigate();
  const [navOpen, setNavOpen] = useState(false);

  // Android hardware back button: close the menu, else go back, else exit from Home
  const navState = useRef({ open: false, path: '/' });
  navState.current = { open: navOpen, path: loc.pathname };
  useEffect(() => {
    let cleanup = () => {};
    registerBackButton(
      () => navigate(-1),
      () => navState.current.path === '/',
      () => {
        if (!navState.current.open) return false;
        setNavOpen(false);
        return true;
      },
    ).then((c) => (cleanup = c));
    return () => cleanup();
  }, [navigate]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.classList.toggle('wallpaper', theme !== 'dark' && theme !== 'light');
  }, [theme]);
  useEffect(() => {
    setNavOpen(false);
    document.querySelector('.main')?.scrollTo(0, 0);
  }, [loc.pathname]);

  if (!name) return <Welcome />;

  return (
    <div className={`app ${navOpen ? 'nav-open' : ''}`}>
      <aside className="sidebar">
        <div className="brand">
          <img src="./icon.svg" alt="" width={30} height={30} />
          <span>DevQuest</span>
        </div>
        <nav>
          {NAV.map(([to, icon, label]) => (
            <NavLink key={to} to={to} end={to === '/'}>
              <span className="nav-icon">{icon}</span> {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-foot muted small">
          Learn a little every day 🔥
          <div className="credit">Created by <b>{APP_AUTHOR}</b></div>
        </div>
      </aside>
      {navOpen && <div className="nav-scrim" onClick={() => setNavOpen(false)} />}
      <div className="main" tabIndex={0} aria-label="Page content">
        <TopBar />
        <main className="content">
          {/* Pages load on demand (code-split) so the app starts faster */}
          <ErrorBoundary resetKey={loc.pathname}>
          <Suspense fallback={<div className="muted page-loading" role="status">Loading…</div>}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/map" element={<SkillMap />} />
            <Route path="/track/:id" element={<TrackPage />} />
            <Route path="/lesson/:id" element={<LessonPage />} />
            <Route path="/review" element={<Review />} />
            <Route path="/playground" element={<Playground />} />
            <Route path="/atlas" element={<Atlas />} />
            <Route path="/lab" element={<Lab />} />
            <Route path="/lab/:id" element={<Lab />} />
            <Route path="/achievements" element={<Achievements />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:id" element={<ProjectWorkspace />} />
            <Route path="/dojo" element={<Dojo />} />
            <Route path="/agent" element={<AgentLab />} />
            <Route path="/download" element={<Download />} />
            <Route path="/dojo/:id" element={<Dojo />} />
            <Route path="/guide" element={<Guide />} />
            <Route path="/path" element={<PathPage />} />
            <Route path="/paths" element={<PathPicker />} />
            <Route path="/languages" element={<Languages />} />
          </Routes>
          </Suspense>
          </ErrorBoundary>
        </main>
      </div>
      {/^\/(lesson|playground|projects\/|dojo\/)/.test(loc.pathname) ? <Tutor /> : null}
      <BottomNav onMore={() => setNavOpen(!navOpen)} moreOpen={navOpen} />
      <Toasts />
    </div>
  );
}
