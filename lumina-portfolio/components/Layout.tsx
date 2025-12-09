import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Aperture, Lock, Home, Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAppStore } from '../App';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const { theme, toggleTheme } = useTheme();
  const { events } = useAppStore();

  const editMatch = location.pathname.match(/\/admin\/edit\/([^/]+)/);
  const activeEvent = editMatch ? events.find((event) => event.id === editMatch[1]) : undefined;
  const publicLink = activeEvent ? `/event/${activeEvent.slug}` : '/';
  const publicLabel = activeEvent ? 'View gallery' : 'Public View';

  return (
    <div className="min-h-screen bg-background text-primary flex flex-col transition-colors duration-300 relative overflow-x-hidden">
      <div className="pointer-events-none fixed inset-x-0 top-[-10rem] h-[20rem] blur-[120px] opacity-50 bg-gradient-to-r from-violet-500/30 via-sky-400/30 to-emerald-400/30" />

      <header className="sticky top-6 z-50 px-4">
        <div className="max-w-6xl mx-auto glass-panel flex items-center justify-between px-6 py-3 rounded-2xl">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="p-2 rounded-xl bg-accent/10 text-accent group-hover:bg-accent/20 transition-colors">
              <Aperture className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-secondary">Lumina</p>
              <p className="font-display text-lg font-semibold tracking-tight">Studio Collective</p>
            </div>
          </Link>

          <nav className="flex items-center gap-3 text-sm font-medium">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-secondary hover:text-primary hover:bg-primary/5 transition-colors"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            {!isAdmin ? (
              <Link
                to="/admin"
                className="rainbow-border rounded-xl px-4 py-2 text-sm font-semibold"
                title="Photographer Login"
              >
                <span className="relative flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5" />
                  Admin
                </span>
              </Link>
            ) : (
              <Link
                to={publicLink}
                className="rounded-xl px-4 py-2 text-sm font-semibold bg-primary text-background flex items-center gap-2"
                target={activeEvent ? '_blank' : undefined}
                rel={activeEvent ? 'noreferrer' : undefined}
              >
                <Home className="w-4 h-4" />
                {publicLabel}
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-grow pt-10">{children}</main>

      <footer className="border-t border-primary/5 py-10 mt-16">
        <div className="max-w-6xl mx-auto px-4 flex flex-col gap-3 text-center text-secondary text-sm">
          <p>© {new Date().getFullYear()} Lumina Studio Collective.</p>
          <p>Crafted with light, preserved with care.</p>
        </div>
      </footer>
    </div>
  );
};