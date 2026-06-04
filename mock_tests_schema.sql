-- Mock Tests Table
CREATE TABLE public."mockTests" (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL DEFAULT 60,
    "totalMarks" INTEGER NOT NULL DEFAULT 100,
    "positiveMarks" INTEGER NOT NULL DEFAULT 1,
    "negativeMarks" INTEGER NOT NULL DEFAULT 0,
    "isSectionsEnabled" BOOLEAN NOT NULL DEFAULT false,
    published BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TEXT NOT NULL
);

-- Mock Test Sections Table
CREATE TABLE public."mockTestSections" (
    id TEXT PRIMARY KEY,
    "testId" TEXT NOT NULL,
    title TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT fk_mock_test FOREIGN KEY ("testId") REFERENCES public."mockTests" (id) ON DELETE CASCADE
);

-- Mock Test Questions Table
CREATE TABLE public."mockTestQuestions" (
    id TEXT PRIMARY KEY,
    "testId" TEXT NOT NULL,
    "sectionId" TEXT,
    type TEXT NOT NULL DEFAULT 'MCQ',
    "contentMarkdown" TEXT NOT NULL,
    options JSONB,
    "correctOptionId" TEXT NOT NULL,
    "explanationMarkdown" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT fk_question_test FOREIGN KEY ("testId") REFERENCES public."mockTests" (id) ON DELETE CASCADE,
    CONSTRAINT fk_question_section FOREIGN KEY ("sectionId") REFERENCES public."mockTestSections" (id) ON DELETE CASCADE
);
