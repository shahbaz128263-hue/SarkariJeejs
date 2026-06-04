import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Job } from '../types';
import Markdown from 'react-markdown';
import { ArrowLeft } from 'lucide-react';
import { AdPlaceholder } from '../components/AdPlaceholder';

import { JobStatusBadge } from '../components/JobStatusBadge';
import { ShareButtons } from '../components/ShareButtons';
import { RelatedJobs } from '../components/RelatedJobs';

export function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/jobs/${id}`)
      .then(res => res.json())
      .then(data => {
        setJob(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center p-24">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8b0000]"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-24">
        <h2 className="text-2xl font-bold text-gray-900">Job not found</h2>
        <Link to="/" className="text-blue-600 hover:underline mt-4 inline-block">Return to home</Link>
      </div>
    );
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    "title": job.title,
    "description": job.summary,
    "datePosted": job.publishDate,
    "validThrough": job.lastDate,
    "employmentType": "FULL_TIME",
    "hiringOrganization": {
      "@type": "Organization",
      "name": "Government of India",
      "sameAs": "https://india.gov.in/"
    },
    "jobLocation": {
      "@type": "Place",
      "address": {
        "@type": "PostalAddress",
        "addressCountry": "IN"
      }
    }
  };

  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": `What is the last date to apply for ${job.title}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": job.lastDate ? `The last date to apply is ${job.lastDate}.` : `The last date to apply is not specified. Please refer to the official notification.`
        }
      },
      {
        "@type": "Question",
        "name": `How many vacancies are available for ${job.title}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": job.totalVacancies ? `There are a total of ${job.totalVacancies} vacancies available.` : `The number of vacancies is not clearly specified.`
        }
      },
      {
        "@type": "Question",
        "name": `What is the eligibility criteria for ${job.title}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": job.shortEligibility || `Please refer to the official notification for detailed eligibility criteria.`
        }
      }
    ]
  };

  const pageTitle = job.metaTitle || `${job.title} | SarkariJeeja`;
  const pageDescription = job.metaDescription || job.summary;

  return (
    <div className="w-full">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
      </Helmet>
      
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqData) }} />
      <Link to="/" className="inline-flex items-center text-sm font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 px-4 py-2 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/50 mb-6 transition-colors">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Jobs
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white text-center pb-4 mb-4 leading-tight">
          {job.title}
        </h1>
        <div className="flex justify-center items-center flex-wrap gap-3 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-slate-800 shadow-sm border border-gray-200 dark:border-slate-700 py-3 px-4 rounded-lg max-w-2xl mx-auto">
          <span><span className="text-indigo-600 dark:text-indigo-400 font-bold">Category:</span> {job.category}</span>
          <span className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></span>
          <span><span className="text-indigo-600 dark:text-indigo-400 font-bold">Updated:</span> {new Date(job.publishDate).toLocaleDateString()}</span>
          {job.lastDate && (
            <>
              <span className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></span>
              <JobStatusBadge lastDate={job.lastDate} />
            </>
          )}
        </div>
        
        <div className="mt-6 flex justify-center">
          <ShareButtons title={job.title} url={window.location.href} />
        </div>
      </div>

      {job.category === 'Mock Test' && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-6 mb-8 text-center shadow-sm">
           <h3 className="text-xl font-bold text-emerald-900 dark:text-emerald-400 mb-2">Notice: Mock Test Information</h3>
           <p className="text-emerald-700 dark:text-emerald-300 mb-4 max-w-2xl mx-auto">
             This page contains syllabus and notification details for the test. <strong>If you want to take the interactive mock test with timer and scoring, click the button below.</strong>
           </p>
           {job.sourceUrl ? (
              <a href={job.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors ring-4 ring-emerald-600/30">
                Start External Test
              </a>
           ) : (
             <Link to="/?category=Mock%20Test" className="inline-flex items-center px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors ring-4 ring-emerald-600/30">
               Browse Interactive Mock Tests
             </Link>
           )}
        </div>
      )}

      <AdPlaceholder />

      <div className="bg-indigo-50/50 dark:bg-slate-800/80 border border-indigo-100 dark:border-slate-700 rounded-xl p-6 mb-8 shadow-sm">
        <h3 className="font-bold text-indigo-900 dark:text-indigo-400 text-lg mb-3 flex items-center gap-2">
          <span className="bg-indigo-600 dark:bg-indigo-500 text-white w-6 h-6 rounded-full inline-flex items-center justify-center text-sm">i</span>
          Brief Information
        </h3>
        <p className="text-gray-700 dark:text-gray-300 text-base leading-relaxed">{job.summary}</p>
      </div>

      {/* Tailwind Typography config for clean, modern tables */}
      <div className="prose prose-blue max-w-none break-words dark:prose-invert
          prose-headings:text-indigo-900 dark:prose-headings:text-indigo-400 prose-headings:font-bold prose-h2:text-2xl prose-h2:border-b prose-h2:border-indigo-100 dark:prose-h2:border-slate-700 prose-h2:pb-2
          prose-table:border-collapse prose-table:w-full prose-table:bg-white dark:prose-table:bg-slate-800 prose-table:rounded-lg prose-table:shadow-sm prose-table:border prose-table:border-gray-200 dark:prose-table:border-slate-700
          prose-th:bg-slate-50 dark:prose-th:bg-slate-800/50 prose-th:text-slate-700 dark:prose-th:text-slate-300 prose-th:font-semibold prose-th:py-3 prose-th:px-4 prose-th:border-b prose-th:border-gray-200 dark:prose-th:border-slate-700
          prose-td:py-3 prose-td:px-4 prose-td:border-b prose-td:border-gray-100 dark:prose-td:border-slate-700 prose-td:text-gray-700 dark:prose-td:text-gray-300
          prose-a:text-indigo-600 dark:prose-a:text-indigo-400 prose-a:font-medium hover:prose-a:text-indigo-800 dark:hover:prose-a:text-indigo-300
      ">
        <Markdown
          components={{
            table: ({ node, ...props }) => (
              <div className="overflow-x-auto w-full my-6 rounded-lg border border-gray-200 dark:border-slate-700">
                <table className="!m-0 !border-0" {...props} />
              </div>
            )
          }}
        >
          {job.contentMarkdown}
        </Markdown>
      </div>

      <RelatedJobs category={job.category} currentJobId={job.id} />

      <AdPlaceholder className="mt-12" />
    </div>
  );
}
