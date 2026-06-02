import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Job } from '../types';
import { Calendar, GraduationCap, Users, ArrowRight } from 'lucide-react';
import { AdPlaceholder } from '../components/AdPlaceholder';
import { JobStatusBadge } from '../components/JobStatusBadge';

function CategoryBlock({ title, jobs, colorClass }: { title: string, jobs: Job[], colorClass: string }) {
  return (
    <div className="border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
      <div className={`${colorClass} text-white py-3 px-4 font-bold text-lg text-center uppercase tracking-wider`}>
        {title}
      </div>
      <div className="flex-1">
        <ul className="divide-y divide-gray-100 dark:divide-slate-700">
          {jobs.length > 0 ? jobs.map(job => (
            <li key={job.id}>
              <Link to={`/job/${job.id}`} className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-indigo-700 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 font-medium text-sm transition-colors md:text-left flex flex-col md:flex-row md:items-center gap-2 justify-between">
                <span>{job.title}</span>
                <div className="flex-shrink-0 self-start md:self-center">
                  <JobStatusBadge lastDate={job.lastDate} />
                </div>
              </Link>
            </li>
          )) : (
            <li className="px-4 py-8 text-center text-gray-400 dark:text-slate-500 text-sm italic">No new updates</li>
          )}
        </ul>
      </div>
      <div className="bg-slate-50 dark:bg-slate-800/80 text-center py-3 border-t border-gray-100 dark:border-slate-700 mt-auto">
         <Link to={`/?category=${encodeURIComponent(title)}`} className="text-slate-600 dark:text-slate-400 font-bold text-sm tracking-wide uppercase hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center justify-center gap-1 transition-colors">
           View All <ArrowRight className="w-4 h-4" />
         </Link>
      </div>
    </div>
  );
}

export function Home() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [categories, setCategories] = useState<{id?: string, name: string, parentId?: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  
  const categoryQuery = searchParams.get('category') || 'All';
  const searchQuery = searchParams.get('q') || '';

  useEffect(() => {
    Promise.all([
      fetch('/api/jobs').then(res => res.json()),
      fetch('/api/categories').then(res => res.json())
    ])
    .then(([fetchedJobs, fetchedCategories]) => {
      setJobs(fetchedJobs);
      setCategories(fetchedCategories.length > 0 ? fetchedCategories : [
        {name: 'Result'}, {name: 'Admit Card'}, {name: 'Latest Jobs'}, {name: 'State Govt'}, 
        {name: 'Answer Key'}, {name: 'Syllabus'}, {name: 'Admission'}, {name: 'Mock Test'}
      ]);
      setLoading(false);
    })
    .catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const filteredJobs = jobs.filter(j => {
    const matchesCategory = categoryQuery === 'All' || j.category === categoryQuery;
    const matchesSearch = !searchQuery || 
      j.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      j.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getJobsByCategory = (cat: string) => {
    return jobs.filter(j => j.category === cat).slice(0, 8); // Top 8 for the blocks
  };

  if (loading) {
    return (
      <div className="flex justify-center p-24">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const pageTitle = searchQuery 
    ? `${searchQuery} - Search Results | SarkariJeeja` 
    : categoryQuery === 'All' 
      ? 'SarkariJeeja - Latest Sarkari Updates' 
      : `${categoryQuery} Updates | SarkariJeeja`;
      
  const pageDescription = searchQuery
    ? `Search results for ${searchQuery} jobs, results, and admit cards on SarkariJeeja.`
    : categoryQuery === 'All'
      ? 'SarkariJeeja provides the latest Sarkari jobs, admit cards, results, syllabus and various exam updates across India.'
      : `Get the latest ${categoryQuery} updates, notifications, and more on SarkariJeeja.`;

  // Sectioned layout for 'All' (Home Page) without search query
  if (categoryQuery === 'All' && !searchQuery) {
    const categoryColors = [
      'bg-indigo-600', 'bg-emerald-600', 'bg-rose-600', 'bg-blue-600',
      'bg-amber-600', 'bg-cyan-600', 'bg-purple-600', 'bg-teal-600'
    ];
    
    return (
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-6">
        <Helmet>
          <title>{pageTitle}</title>
          <meta name="description" content={pageDescription} />
          <meta property="og:title" content={pageTitle} />
          <meta property="og:description" content={pageDescription} />
          <meta name="twitter:title" content={pageTitle} />
          <meta name="twitter:description" content={pageDescription} />
        </Helmet>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "SarkariJeeja",
          "url": "https://sarkarijeeja.com/"
        }) }} />
        {/* Important Updates Marquee */}
        {jobs.length > 0 && (
          <div className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md p-2 mb-6 flex overflow-hidden whitespace-nowrap items-center">
            <span className="bg-rose-600 text-white font-bold px-3 py-1 rounded text-sm mr-4 shrink-0 shadow-sm z-10 relative">Trending</span>
            <div className="animate-[marquee_25s_linear_infinite] flex items-center gap-8">
              {jobs.slice(0, 5).map(job => (
                 <Link key={job.id} to={`/job/${job.id}`} className="text-indigo-700 dark:text-indigo-300 hover:text-rose-600 dark:hover:text-rose-400 font-bold text-sm transition-colors">
                   {job.title}
                 </Link>
              ))}
            </div>
          </div>
        )}

        <AdPlaceholder />

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Website Sidebar - Categories */}
          <aside className="hidden lg:block w-64 shrink-0">
             <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden sticky top-6 shadow-sm">
                <div className="bg-indigo-600 dark:bg-indigo-700 px-4 py-3 text-white font-bold tracking-wide uppercase text-sm">
                  Top Categories
                </div>
                <div className="divide-y divide-gray-100 dark:divide-slate-700">
                  {categories.filter(c => !c.parentId).map((cat) => (
                    <React.Fragment key={cat.id || cat.name}>
                      <Link to={`/?category=${encodeURIComponent(cat.name)}`} className="block px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition">
                        <span className="text-gray-900 dark:text-gray-100 font-bold text-sm hover:text-indigo-600 dark:hover:text-indigo-400">{cat.name}</span>
                      </Link>
                      {categories.filter(sub => sub.parentId === cat.id).map(subCat => (
                        <Link key={subCat.id || subCat.name} to={`/?category=${encodeURIComponent(subCat.name)}`} className="block px-4 py-2 pl-8 hover:bg-slate-50 dark:hover:bg-slate-700 transition border-t-0 bg-slate-50 border-gray-100 dark:border-slate-700 dark:bg-slate-800/50">
                          <span className="text-gray-600 dark:text-gray-400 font-medium text-sm hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center">
                             <div className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 mr-2"></div>
                             {subCat.name}
                          </span>
                        </Link>
                      ))}
                    </React.Fragment>
                  ))}
                </div>
             </div>
          </aside>

          {/* Grid Layout Main Content */}
          <div className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {categories.map((c, idx) => (
                 <CategoryBlock key={c.name} title={c.name} jobs={getJobsByCategory(c.name)} colorClass={categoryColors[idx % categoryColors.length]} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Category specific layout (List view)
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
      </Helmet>
      
      <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white border-l-4 border-indigo-600 pl-3">
            {searchQuery ? `Search Results for "${searchQuery}"` : `${categoryQuery} Updates`}
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-slate-300">
            {searchQuery ? `Showing ${filteredJobs.length} jobs matching your search.` : `Find the latest notifications for ${categoryQuery}.`}
          </p>
        </div>
      </div>

      <AdPlaceholder />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredJobs.map(job => (
          <Link key={job.id} to={`/job/${job.id}`} className="block group">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden hover:shadow-lg transition-transform hover:-translate-y-1 duration-200 flex flex-col h-full shadow-sm">
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 uppercase tracking-wide border border-indigo-100 dark:border-indigo-800">
                    {job.category}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-slate-400 font-medium">
                    {new Date(job.publishDate).toLocaleDateString()}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mb-3 leading-tight">
                  {job.title}
                </h3>
                
                <p className="text-gray-600 dark:text-slate-300 text-sm mb-6 line-clamp-3">
                  {job.summary}
                </p>

                <div className="space-y-3 mt-auto border-t border-gray-100 dark:border-slate-700 pt-4 overflow-hidden">
                  <div className="flex items-center text-sm text-gray-600 dark:text-slate-300 min-w-0">
                    <GraduationCap className="h-4 w-4 mr-2.5 text-indigo-400 shrink-0" />
                    <span className="truncate min-w-0 flex-1">{job.shortEligibility || "Not specified"}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 dark:text-slate-300 min-w-0">
                    <Users className="h-4 w-4 mr-2.5 text-indigo-400 shrink-0" />
                    <span className="truncate min-w-0 flex-1">{job.totalVacancies || "Not specified"} Vacancies</span>
                  </div>
                  <div className="flex items-center text-sm font-medium flex-wrap gap-2">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2.5 text-rose-500" />
                      <span className="text-rose-600 dark:text-rose-400">Last Date: {job.lastDate}</span>
                    </div>
                    {job.lastDate && <JobStatusBadge lastDate={job.lastDate} />}
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-700 mt-auto flex justify-between items-center group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 transition-colors">
                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-700 dark:group-hover:text-indigo-300">
                  Read Notification
                </span>
                <span className="text-indigo-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
              </div>
            </div>
          </Link>
        ))}
        
        {filteredJobs.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-gray-300 dark:border-slate-700">
            No jobs found in this category currently.
          </div>
        )}
      </div>
    </div>
  );
}
