/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Routes, Route, Link, Outlet } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { JobDetail } from './pages/JobDetail';
import { Admin } from './pages/Admin';
import { AboutUs } from './pages/AboutUs';
import { ContactUs } from './pages/ContactUs';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { MockTestPlayer } from './pages/MockTestPlayer';

function PublicLayout() {
  return (
    <div className="min-h-screen bg-[#f3f3f3] dark:bg-slate-900 flex flex-col font-sans transition-colors">
      <Navbar />
      <main className="flex-1 w-full max-w-7xl mx-auto min-w-0 overflow-x-clip bg-white dark:bg-slate-800 shadow-xl min-h-screen mt-2 mb-8 p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
      <footer className="bg-slate-900 dark:bg-black text-slate-400 mt-auto">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 text-center space-y-4 text-sm font-medium">
          <div className="flex justify-center space-x-6 mb-4">
            <Link to="/about-us" className="hover:text-white transition-colors">About Us</Link>
            <Link to="/contact-us" className="hover:text-white transition-colors">Contact Us</Link>
            <Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
          </div>
          <p>
            &copy; {new Date().getFullYear()} SarkariJeeja. All rights reserved.
          </p>
          <p className="text-xs">
            Disclaimer: This website provides information about government jobs and exams for educational purposes only. It is not affiliated with any government organization.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/admin" element={<Admin />} />
      <Route path="/mock-test/:id" element={<MockTestPlayer />} />
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/job/:id" element={<JobDetail />} />
        <Route path="/about-us" element={<AboutUs />} />
        <Route path="/contact-us" element={<ContactUs />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      </Route>
    </Routes>
  );
}
