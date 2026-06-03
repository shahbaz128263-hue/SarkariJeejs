import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Settings, Search, Sun, Moon, Menu, X } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useTheme } from './ThemeContext';

export function Navbar() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const { theme, toggleTheme } = useTheme();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [categories, setCategories] = useState<{name: string, cat: string|null, path: string, parentId?: string, id?: string}[]>([
    { name: 'Home', cat: null, path: '/' }
  ]);

  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then((data: {id: string, name: string, parentId?: string}[]) => {
        const catLinks = data.map(c => ({
          id: c.id,
          name: c.name,
          cat: c.name,
          parentId: c.parentId,
          path: `/?category=${encodeURIComponent(c.name)}`
        }));
        setCategories([{ name: 'Home', cat: null, path: '/' }, ...catLinks]);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    setSearchQuery(searchParams.get('q') || '');
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      // If we are currently on a category, we might want to keep it?
      // Simple behavior: just go to home
      // But if we want to remove 'q' only, we should update searchParams
      searchParams.delete('q');
      navigate(`/?${searchParams.toString()}`);
    }
  };

  const closeDrawer = () => setIsDrawerOpen(false);

  return (
    <header className="w-full">
      {/* Top Header - Modern Deep Indigo */}
      <div className="bg-indigo-900 text-white py-6 px-4 text-center relative shadow-md">
        <Link to="/" className="inline-block hover:opacity-90 transition-opacity">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight font-brand" style={{ letterSpacing: '-0.02em' }}>
            Sarkari<span className="text-blue-400 font-display italic">Jeeja</span>
          </h1>
          <p className="text-sm md:text-base mt-2 font-medium text-indigo-200 tracking-[0.15em] uppercase font-sans">
            Next Generation Job Portal
          </p>
        </Link>
        <div className="absolute right-4 top-4 flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="text-indigo-300 hover:text-white transition-colors flex items-center justify-center pt-1"
            title="Toggle Dark Mode"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Navigation Bar - Bright Blue */}
      <nav className="bg-blue-700 text-white py-3 px-4 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Mobile Menu Button */}
          <button 
            onClick={() => setIsDrawerOpen(true)}
            className="md:hidden flex items-center justify-center p-2 -ml-2 rounded-md hover:bg-blue-600 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex flex-wrap items-center gap-x-2 lg:gap-x-4 text-sm md:text-base font-semibold">
            {categories.filter(c => !c.parentId).map(link => {
              const isActive = link.cat === null 
                ? !searchParams.get('category') 
                : searchParams.get('category') === link.cat;
                
              return (
                <Link 
                  key={link.name}
                  to={link.path} 
                  className={`px-3 py-1.5 rounded-md transition-colors ${
                    isActive 
                      ? 'bg-blue-800 text-white' 
                      : 'text-blue-100 hover:bg-blue-600 hover:text-white'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>
          
          <form onSubmit={handleSearch} className="relative flex-1 md:w-64 max-w-sm md:max-w-none md:flex-none">
            <input 
              type="text" 
              placeholder="Search jobs..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-blue-800 text-white placeholder-blue-300 rounded-full py-1.5 pl-4 pr-10 border border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm"
            />
            <button type="submit" className="absolute right-3 top-2 text-blue-300 hover:text-white transition-colors">
              <Search className="w-4 h-4" />
            </button>
          </form>
        </div>
      </nav>

      {/* Mobile Drawer Overlay */}
      {isDrawerOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 md:hidden" 
          onClick={closeDrawer}
        />
      )}
      
      {/* Mobile Drawer Menu */}
      <div 
        className={`fixed top-0 left-0 bottom-0 w-64 bg-white dark:bg-slate-900 shadow-xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col md:hidden ${isDrawerOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-800">
          <h2 className="text-xl font-bold text-indigo-900 dark:text-indigo-400">Menu</h2>
          <button onClick={closeDrawer} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 dark:text-gray-400 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-2">
          {categories.filter(c => !c.parentId && c.cat === null).map(link => {
            const isActive = !searchParams.get('category');
            return (
              <Link 
                key="home"
                to="/"
                onClick={closeDrawer}
                className={`block px-3 py-2 rounded-md font-semibold transition-colors ${isActive ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' : 'text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-slate-800'}`}
              >
                {link.name}
              </Link>
            );
          })}
          
          {(function renderMobileCategories(parentId: string | undefined = undefined, depth: number = 0): React.ReactNode {
            if (depth > 4) return null;
            const children = categories.filter(c => c.parentId === parentId && c.cat !== null);
            if (children.length === 0) return null;

            return (
              <div className={depth > 0 ? "ml-4 pl-4 border-l-2 border-gray-200 dark:border-slate-700 space-y-1" : "space-y-1 mt-1"}>
                {children.map(link => {
                  const isActive = searchParams.get('category') === link.cat;
                  return (
                    <React.Fragment key={link.id || link.name}>
                      <Link 
                        to={link.path} 
                        onClick={closeDrawer} 
                        className={`block px-3 py-2 rounded-r-md transition-colors ${
                          depth === 0 ? 'font-semibold' : 'text-sm font-medium'
                        } ${
                          isActive
                            ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-l-2 border-indigo-500 -ml-[18px] pl-[26px]'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400'
                        }`}
                      >
                        {link.name}
                      </Link>
                      {renderMobileCategories(link.id, depth + 1)}
                    </React.Fragment>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </div>
    </header>
  );
}
