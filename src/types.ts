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

export interface MockTest {
  id: string;
  title: string;
  categoryId?: string;
  durationMinutes: number;
  totalMarks: number;
  positiveMarks: number;
  negativeMarks: number;
  isSectionsEnabled: boolean;
  published: boolean;
  createdAt: string;
}

export interface MockTestSection {
  id: string;
  testId: string;
  title: string;
  order: number;
}

export interface MockTestQuestion {
  id: string;
  testId: string;
  sectionId?: string;
  type: 'MCQ';
  contentMarkdown: string;
  options: { id: string; contentMarkdown: string }[];
  correctOptionId: string;
  explanationMarkdown?: string;
  order: number;
}
