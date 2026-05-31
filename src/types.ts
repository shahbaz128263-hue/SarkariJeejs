export interface Job {
  id: string;
  title: string;
  metaTitle?: string;
  metaDescription?: string;
  category: string;
  publishDate: string;
  lastDate: string;
  contentMarkdown: string;
  summary: string;
  shortEligibility: string;
  totalVacancies: string;
  featuredImage?: string;
  sourceUrl?: string;
}
