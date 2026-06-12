import React, { useState, useEffect } from 'react';
import { Loader2, PlusCircle, Lock, LogOut, LayoutDashboard, FileText, Settings, BookOpen, Bot, Edit3, Grid, Menu, X, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AdminMockTests } from '../components/AdminMockTests';

import { AdminProfileSettings } from '../components/AdminProfileSettings';

export function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'ai_article', 'manual_article', 'mock_test', 'categories'


  const [categories, setCategories] = useState<{id: string, name: string, parentId?: string}[]>([]);
  const [newCatName, setNewCatName] = useState('');
  const [newCatParentId, setNewCatParentId] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const [url, setUrl] = useState('');
  const [rawText, setRawText] = useState('');
  const [context, setContext] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [jobs, setJobs] = useState<any[]>([]);
  const [editingJob, setEditingJob] = useState<any | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      setIsAuthenticated(true);
      fetchCategories();
      fetchJobs();
    }
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/jobs');
      const data = await res.json();
      setJobs(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({ name: newCatName.trim(), parentId: newCatParentId || null }),
      });
      if (res.ok) {
        setNewCatName('');
        setNewCatParentId('');
        fetchCategories();
      }
    } catch {}
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete category "${name}"?`)) return;
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      if (res.ok) {
        fetchCategories();
      }
    } catch {}
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem('adminToken', data.token);
        setIsAuthenticated(true);
      } else {
        setLoginError('Invalid credentials');
      }
    } catch {
      setLoginError('Network error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setIsAuthenticated(false);
  };

  const handleDeleteJob = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      const res = await fetch(`/api/jobs/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      if (res.ok) {
        fetchJobs();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleEditJobSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJob) return;
    try {
      const res = await fetch(`/api/jobs/${editingJob.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(editingJob)
      });
      if (res.ok) {
        setEditingJob(null);
        fetchJobs();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleGenerate = async (e: React.FormEvent, overrideContext?: string) => {
    e.preventDefault();
    if (!url && !rawText) {
      setError('Please provide either a URL or raw text/mock test details.');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    const finalContext = overrideContext || (selectedCategory 
      ? `Force Category exactly to: "${selectedCategory}". ${context}`
      : context);

    try {
      const res = await fetch('/api/jobs/generate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({ url, rawText, additionalContext: finalContext }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate article');
      }

      setSuccess('Content generated and published successfully! Auto-arranged by SEO policy.');
      setUrl('');
      setRawText('');
      setContext('');
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const renderCategoryOptions = (parentId: string | null | undefined = undefined, depth: number = 0): React.ReactNode[] => {
    if (depth > 4) return [];
    let options: React.ReactNode[] = [];
    const children = categories.filter(c => (!c.parentId && !parentId) || c.parentId === parentId);
    for (const cat of children) {
      options.push(<option key={cat.id} value={cat.id}>{"\u00A0\u00A0".repeat(depth)}{cat.name}</option>);
      options = options.concat(renderCategoryOptions(cat.id, depth + 1));
    }
    return options;
  };

  const renderCategoryRows = (parentId: string | null | undefined = undefined, depth: number = 0): React.ReactNode[] => {
    if (depth > 4) return [];
    let rows: React.ReactNode[] = [];
    const children = categories.filter(c => (!c.parentId && !parentId) || c.parentId === parentId);
    for (const cat of children) {
      rows.push(
        <tr key={cat.id} className={depth === 0 ? "bg-white dark:bg-slate-800" : "bg-gray-50 dark:bg-slate-800/50"}>
          <td className={`px-6 py-${depth === 0 ? '4' : '3'} whitespace-nowrap text-sm font-medium ${depth === 0 ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400 font-normal'} flex items-center`} style={{ paddingLeft: `${1.5 + depth * 2}rem` }}>
            {depth > 0 && <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600 mr-2 shrink-0"></div>}
            {cat.name}
          </td>
          <td className={`px-6 py-${depth === 0 ? '4' : '3'} whitespace-nowrap text-right text-sm font-medium`}>
            <button 
              onClick={() => handleDeleteCategory(cat.id, cat.name)}
              className="text-rose-600 hover:text-rose-900 dark:text-rose-400 dark:hover:text-rose-300 transition-colors"
            >
              Delete
            </button>
          </td>
        </tr>
      );
      rows = rows.concat(renderCategoryRows(cat.id, depth + 1));
    }
    return rows;
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 px-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8">
          <div className="flex justify-center mb-6">
            <div className="bg-indigo-100 dark:bg-indigo-900/50 p-3 rounded-full">
              <Lock className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-8">Admin Access</h2>
          {loginError && <p className="text-red-500 text-sm mb-4 text-center">{loginError}</p>}
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white font-bold py-2 px-4 rounded hover:bg-indigo-700 transition"
            >
              Sign In
            </button>
          </form>
          <div className="mt-6 text-center">
             <Link to="/" className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
               Return to Website
             </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex font-sans">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 flex flex-col transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-6 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">AdminPanel</h1>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-gray-500 hover:text-gray-700">
             <X className="w-6 h-6" />
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <button
            onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'dashboard' 
                ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </button>
          <button
            onClick={() => { setActiveTab('ai_article'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'ai_article' 
                ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
            }`}
          >
            <Bot className="w-5 h-5" />
            AI Content Generator
          </button>
          <button
            onClick={() => { setActiveTab('manual_article'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'manual_article' 
                ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
            }`}
          >
            <Edit3 className="w-5 h-5" />
            Manual Content
          </button>
          <button
            onClick={() => { setActiveTab('mock_test'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'mock_test' 
                ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
            }`}
          >
            <BookOpen className="w-5 h-5" />
            Mock Tests
          </button>
          <button
            onClick={() => { setActiveTab('manage_jobs'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'manage_jobs' 
                ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
            }`}
          >
            <Edit3 className="w-5 h-5" />
            Manage Jobs
          </button>
          <button
            onClick={() => { setActiveTab('categories'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'categories' 
                ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
            }`}
          >
            <Grid className="w-5 h-5" />
            Categories
          </button>
          <button
            onClick={() => { setActiveTab('settings'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'settings' 
                ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
            }`}
          >
            <Settings className="w-5 h-5" />
            Profile Settings
          </button>
        </nav>
        <div className="p-4 border-t border-gray-200 dark:border-slate-700">
          <Link to="/" className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition">
            View Website
          </Link>
          <button 
            onClick={handleLogout} 
            className="w-full mt-3 flex items-center justify-center gap-2 text-rose-600 hover:text-rose-700 font-medium text-sm transition"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 p-4 shrink-0 flex justify-between items-center md:hidden">
            <div className="flex items-center gap-3">
              <button onClick={() => setIsMobileMenuOpen(true)} className="text-gray-500 hover:text-gray-700">
                <Menu className="w-6 h-6" />
              </button>
              <h1 className="text-xl font-bold text-indigo-600 dark:text-indigo-400">AdminPanel</h1>
            </div>
            <button onClick={handleLogout} className="text-sm font-medium text-rose-600">Logout</button>
        </header>
        
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-5xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <div className="animate-in fade-in duration-300">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
                  <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-lg"><FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" /></div>
                  <div>
                    <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Auto-SEO Published</h3>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">Active</p>
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
                  <div className="bg-teal-100 dark:bg-teal-900/50 p-3 rounded-lg"><BookOpen className="w-6 h-6 text-teal-600 dark:text-teal-400" /></div>
                  <div>
                    <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Mock Tests System</h3>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">Ready</p>
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
                  <div className="bg-purple-100 dark:bg-purple-900/50 p-3 rounded-lg"><Settings className="w-6 h-6 text-purple-600 dark:text-purple-400" /></div>
                  <div>
                    <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">System Status</h3>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">Online</p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-8 text-center">
                 <p className="text-gray-500 dark:text-gray-400">Welcome to your advanced AI dashboard.</p>
                 <button onClick={() => setActiveTab('ai_article')} className="mt-4 px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition">Go to Generator</button>
              </div>
            </div>
          )}

          {activeTab === 'ai_article' && (
            <div className="animate-in fade-in duration-300">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">AI Content Generator</h2>
                <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">Fetch and generate SEO-optimized articles from notification URLs.</p>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
                    <Bot className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    Automated Extraction
                  </h2>
                </div>
                
                <form onSubmit={(e) => { e.preventDefault(); handleGenerate(e); }} className="p-6 space-y-6">
                  {error && (
                    <div className="p-4 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
                      {error}
                    </div>
                  )}
                  {success && (
                    <div className="p-4 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-sm text-green-700 dark:text-green-400">
                      {success}
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label htmlFor="url" className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                        Official Notification URL
                      </label>
                      <p className="text-xs text-gray-500 mb-2 mt-1">Paste an official job link to let the AI scrape and summarize it.</p>
                      <input
                        type="url"
                        id="url"
                        value={url}
                        onChange={(e) => { setUrl(e.target.value); setRawText(''); }}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-slate-600 rounded-md border p-3 flex-1 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                        placeholder="https://ssc.gov.in/notice/..."
                        required
                      />
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                        Target Category
                      </label>
                      <p className="text-xs text-gray-500 mb-2 mt-1">Select the exact category to publish this to.</p>
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="mb-4 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-slate-600 rounded-md border p-3 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                      >
                        <option value="">Auto-Detect via AI</option>
                        {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                      </select>

                      <label htmlFor="context" className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                        Additional AI Context
                      </label>
                      <p className="text-xs text-gray-500 mb-2 mt-1">Any other custom instructions (e.g. "Highlight eligibility").</p>
                      <input
                        type="text"
                        id="context"
                        value={context}
                        onChange={(e) => setContext(e.target.value)}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-slate-600 rounded-md border p-3 bg-indigo-50 dark:bg-slate-700/50 text-indigo-900 dark:text-indigo-100"
                        placeholder="e.g. 'Force Category: State Govt'"
                      />
                    </div>
                  </div>

                  <div className="pt-6 flex justify-end">
                    <button
                      type="submit"
                      disabled={loading || !url}
                      className="inline-flex items-center px-6 py-3 border border-transparent text-base font-bold rounded-lg shadow-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                          Processing...
                        </>
                      ) : (
                        'Generate & Publish'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'manual_article' && (
            <div className="animate-in fade-in duration-300">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Manual Content Construction</h2>
                <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">Write or paste unstructured raw details, and AI will structure them perfectly.</p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
                    <Edit3 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    Construct Article
                  </h2>
                </div>
                <form onSubmit={(e) => { e.preventDefault(); setUrl(''); handleGenerate(e); }} className="p-6 space-y-6">
                  {error && (
                    <div className="p-4 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
                      {error}
                    </div>
                  )}
                  {success && (
                    <div className="p-4 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-sm text-green-700 dark:text-green-400">
                      {success}
                    </div>
                  )}
                  <div>
                    <label htmlFor="rawText" className="block text-sm font-bold text-gray-700 dark:text-gray-300">Raw Text Details</label>
                    <textarea
                      id="rawText" rows={8} value={rawText} onChange={(e) => { setRawText(e.target.value); setUrl(''); }}
                      className="mt-2 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-slate-600 rounded-md border p-3 bg-white dark:bg-slate-700 text-gray-900 dark:text-white font-mono"
                      placeholder="Paste unstructured notes, offline results, syllabus text..." required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Target Category</label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="mt-2 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-slate-600 rounded-md border p-3 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Select Category (Optional)</option>
                      {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="context" className="block text-sm font-bold text-gray-700 dark:text-gray-300">Custom AI Instructions</label>
                    <input
                      type="text" id="context" value={context} onChange={(e) => setContext(e.target.value)}
                      className="mt-2 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-slate-600 rounded-md border p-3 bg-indigo-50 dark:bg-slate-700/50 text-indigo-900 dark:text-indigo-100"
                      placeholder="e.g. 'Format this as a syllabus outline'"
                    />
                  </div>
                  <div className="pt-2 flex justify-end">
                    <button type="submit" disabled={loading || !rawText} className="inline-flex items-center px-6 py-3 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg font-bold">
                       {loading ? <><Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" /> Processing...</> : 'Structure & Publish'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'mock_test' && (
            <AdminMockTests />
          )}

          {activeTab === 'manage_jobs' && (
            <div className="animate-in fade-in duration-300">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Manage Jobs & Articles</h2>
                <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">Edit or delete existing job postings and mock tests.</p>
              </div>

              {editingJob ? (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
                   <div className="p-6 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 flex justify-between items-center">
                      <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
                        <Edit3 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        Edit Article
                      </h2>
                      <button onClick={() => setEditingJob(null)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">Cancel</button>
                   </div>
                   <form onSubmit={handleEditJobSubmit} className="p-6 space-y-6">
                     <div>
                       <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Title</label>
                       <input 
                         type="text" 
                         value={editingJob.title} 
                         onChange={e => setEditingJob({...editingJob, title: e.target.value})}
                         className="mt-2 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-slate-600 rounded-md border p-3 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                         required
                       />
                     </div>
                     <div>
                       <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Category</label>
                       <select
                         value={editingJob.category}
                         onChange={e => setEditingJob({...editingJob, category: e.target.value})}
                         className="mt-2 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-slate-600 rounded-md border p-3 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                         required
                       >
                         {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                       </select>
                     </div>
                     <div>
                       <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Summary / Short Desc</label>
                       <textarea 
                         rows={3}
                         value={editingJob.summary} 
                         onChange={e => setEditingJob({...editingJob, summary: e.target.value})}
                         className="mt-2 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-slate-600 rounded-md border p-3 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                       />
                     </div>
                     <div>
                       <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Content (Markdown/HTML)</label>
                       <textarea 
                         rows={10}
                         value={editingJob.content} 
                         onChange={e => setEditingJob({...editingJob, content: e.target.value})}
                         className="mt-2 font-mono shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-slate-600 rounded-md border p-3 bg-slate-50 dark:bg-slate-900 text-gray-900 dark:text-white"
                         required
                       />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                       <div>
                         <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Publish Date</label>
                         <input 
                           type="date" 
                           value={editingJob.publishDate} 
                           onChange={e => setEditingJob({...editingJob, publishDate: e.target.value})}
                           className="mt-2 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-slate-600 rounded-md border p-3 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                         />
                       </div>
                       <div>
                         <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Last Date</label>
                         <input 
                           type="date" 
                           value={editingJob.lastDate || ''} 
                           onChange={e => setEditingJob({...editingJob, lastDate: e.target.value})}
                           className="mt-2 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-slate-600 rounded-md border p-3 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                         />
                       </div>
                     </div>
                     <div className="pt-4 flex justify-end gap-3">
                       <button type="button" onClick={() => setEditingJob(null)} className="px-6 py-3 bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-white font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 transition">Cancel</button>
                       <button type="submit" className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition">Save Changes</button>
                     </div>
                   </form>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                      <thead className="bg-gray-50 dark:bg-slate-900/50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Title</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Category</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                        {jobs.map((job) => (
                          <tr key={job.id}>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                              <div className="line-clamp-2">{job.title}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{job.category}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{job.publishDate}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button 
                                onClick={() => setEditingJob(job)}
                                className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors mr-4"
                              >
                                Edit
                              </button>
                              <button 
                                onClick={() => handleDeleteJob(job.id, job.title)}
                                className="text-rose-600 hover:text-rose-900 dark:text-rose-400 dark:hover:text-rose-300 transition-colors"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                        {jobs.length === 0 && (
                          <tr><td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">No jobs structured yet.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'categories' && (
            <div className="animate-in fade-in duration-300">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Manage Categories</h2>
                <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">Add or remove categories for the main website sidebar and Navbar.</p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
                 <div className="p-6">
                    <form onSubmit={handleAddCategory} className="flex flex-col md:flex-row gap-4 mb-8">
                       <input 
                         type="text" 
                         value={newCatName}
                         onChange={(e) => setNewCatName(e.target.value)}
                         placeholder="New Category Name (e.g. State Govt)" 
                         className="flex-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-slate-600 rounded-md border p-3 bg-white dark:bg-slate-700 text-gray-900 dark:text-white" 
                         required
                       />
                       <select
                         value={newCatParentId}
                         onChange={(e) => setNewCatParentId(e.target.value)}
                         className="flex-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-slate-600 rounded-md border p-3 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                       >
                         <option value="">No Parent (Top Level)</option>
                         {renderCategoryOptions(undefined, 0)}
                       </select>
                       <button type="submit" className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition whitespace-nowrap">Add Category</button>
                    </form>
                    
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                        <thead className="bg-gray-50 dark:bg-slate-900/50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Category Name</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                          {renderCategoryRows(undefined, 0)}
                          {categories.length === 0 && (
                            <tr><td colSpan={2} className="px-6 py-4 text-center text-sm text-gray-500">No categories found.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                 </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <AdminProfileSettings />
          )}
          </div>
        </div>
      </main>
    </div>
  );
}
