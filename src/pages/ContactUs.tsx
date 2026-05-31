export function ContactUs() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 shadow-sm">
      <h1 className="text-4xl font-black font-brand mb-6 text-indigo-900 border-b-2 border-indigo-100 pb-4">Contact Us</h1>
      <div className="prose prose-indigo max-w-none text-slate-700 space-y-6">
        <p>If you have any questions about this Privacy Policy, the practices of this site, or your dealings with this site, please contact us.</p>
        
        <div className="bg-indigo-50 p-6 rounded-lg border border-indigo-100 mt-6">
          <h2 className="text-xl font-bold font-display mb-4 text-indigo-800">Get In Touch</h2>
          <ul className="space-y-3">
            <li><strong>Email:</strong> support@sarkarijeeja.com</li>
            <li><strong>Support Hours:</strong> Monday to Friday (10:00 AM - 6:00 PM IST)</li>
          </ul>
        </div>
        
        <p className="text-sm text-slate-500 mt-8">Note: We try our best to respond to your queries as soon as possible, but due to high volume, it may take 24-48 hours. Thank you for your patience.</p>
      </div>
    </div>
  );
}
