import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Job } from '../types';
import { Calendar, GraduationCap, Users } from 'lucide-react';
import { JobStatusBadge } from './JobStatusBadge';

export function RelatedJobs({ category, currentJobId }: { category: string, currentJobId: string }) {
  const [relatedJobs, setRelatedJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/jobs')
      .then(res => res.json())
      .then((data: Job[]) => {
        const filtered = data
          .filter(job => job.category === category && job.id !== currentJobId)
          .slice(0, 3); // Get up to 3 related jobs
        setRelatedJobs(filtered);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [category, currentJobId]);

  if (loading || relatedJobs.length === 0) {
    return null;
  }

  return (
    <div className="mt-12 w-full">
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 pl-3 border-l-4 border-indigo-600">
        Related {category} Updates
      </h3>
      <div className="grid gap-6 md:grid-cols-3">
        {relatedJobs.map(job => (
          <Link key={job.id} to={`/job/${job.id}`} className="block group">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden hover:shadow-lg transition-transform hover:-translate-y-1 duration-200 flex flex-col h-full shadow-sm">
              <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 uppercase tracking-wide border border-indigo-100 dark:border-indigo-800">
                    {job.category}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-slate-400 font-medium">
                    {new Date(job.publishDate).toLocaleDateString()}
                  </span>
                </div>
                
                <h4 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mb-2 leading-tight line-clamp-2">
                  {job.title}
                </h4>
                
                <div className="space-y-2 mt-4 pt-3 border-t border-gray-100 dark:border-slate-700">
                  <div className="flex items-center text-xs text-gray-600 dark:text-slate-300">
                    <GraduationCap className="h-3.5 w-3.5 mr-2 text-indigo-400" />
                    <span className="truncate">{job.shortEligibility || "Not specified"}</span>
                  </div>
                  <div className="flex items-center text-xs text-gray-600 dark:text-slate-300">
                    <Users className="h-3.5 w-3.5 mr-2 text-indigo-400" />
                    <span>{job.totalVacancies || "Not specified"} Vacancies</span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1">
                    <div className="flex items-center">
                      <Calendar className="h-3.5 w-3.5 mr-2 text-rose-500" />
                      <span className="text-rose-600 dark:text-rose-400">Last: {job.lastDate}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
