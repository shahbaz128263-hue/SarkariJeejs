export function AboutUs() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 shadow-sm">
      <h1 className="text-4xl font-black font-brand mb-6 text-indigo-900 border-b-2 border-indigo-100 pb-4">About Us</h1>
      <div className="prose prose-indigo max-w-none text-slate-700 space-y-4">
        <p>Welcome to <strong>SarkariJeeja</strong>, your number one source for all Government Job updates, Sarkari Results, Admit Cards, and more. We're dedicated to providing you the very best and fastest updates, with an emphasis on accuracy, speed, and real-time alerts.</p>
        
        <h2 className="text-2xl font-bold font-display mt-8 mb-4 text-indigo-800">Our Mission</h2>
        <p>Our mission is to help students, job seekers, and aspirants from all over India to get proper and timely information about the latest government job vacancies, exam syllabus, exam patterns, and result alerts without any hassle.</p>

        <h2 className="text-2xl font-bold font-display mt-8 mb-4 text-indigo-800">What We Do</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Latest Jobs:</strong> Regular updates on new recruitment notifications.</li>
          <li><strong>Admit Cards:</strong> Direct links to download exam hall tickets.</li>
          <li><strong>Results:</strong> Fast and accurate Sarkari exam results.</li>
          <li><strong>Syllabus & Admission:</strong> Proper guidance and outlines for entrance exams.</li>
        </ul>

        <p className="mt-8 italic text-slate-500">
          This platform is constantly evolving to serve you better. We hope you enjoy our services as much as we enjoy offering them to you. If you have any questions or comments, please don't hesitate to contact us.
        </p>
      </div>
    </div>
  );
}
