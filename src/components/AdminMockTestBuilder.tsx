import React, { useState, useEffect } from 'react';
import { Loader2, ArrowLeft, Settings, Save, Plus, Trash2, Edit3, Type, CheckCircle2, ChevronRight, Wand2, FileText } from 'lucide-react';
import { MockTest, MockTestSection, MockTestQuestion } from '../types';
import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import 'katex/dist/katex.min.css';

export function AdminMockTestBuilder({ testId, onBack }: { testId: string, onBack: () => void }) {
  const [test, setTest] = useState<MockTest | null>(null);
  const [sections, setSections] = useState<MockTestSection[]>([]);
  const [questions, setQuestions] = useState<MockTestQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  
  const [activeTab, setActiveTab] = useState('settings'); // settings, questions

  // Add Question Modal State
  const [isAddingQ, setIsAddingQ] = useState(false);
  const [qForm, setQForm] = useState<Partial<MockTestQuestion>>({ options: [{id: '1', contentMarkdown: ''}, {id: '2', contentMarkdown: ''}, {id: '3', contentMarkdown: ''}, {id: '4', contentMarkdown: ''}], correctOptionId: '1' });
  const [aiPrompt, setAiPrompt] = useState("");

  const [isBulkImport, setIsBulkImport] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkPreview, setBulkPreview] = useState<Partial<MockTestQuestion>[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    fetchTestData();
  }, []);

  const fetchTestData = async () => {
    setLoading(true);
    try {
      const [tRes, sRes, qRes, cRes] = await Promise.all([
        fetch(`/api/mock-tests/${testId}`),
        fetch(`/api/mock-tests/${testId}/sections`),
        fetch(`/api/mock-tests/${testId}/questions`),
        fetch(`/api/categories`)
      ]);
      setTest(await tRes.json());
      setSections(await sRes.json());
      setQuestions(await qRes.json());
      setCategories(await cRes.json());
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
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

  const handleUpdateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!test) return;
    try {
      await fetch(`/api/mock-tests/${testId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` },
        body: JSON.stringify(test)
      });
      alert('Settings saved!');
    } catch {}
  };

    const handleParseBulk = () => {
    const parsed: Partial<MockTestQuestion>[] = [];
    // Split by Question 1 / Q1 / 1. etc
    const splitRegex = /(?=^(?:###\s*)?(?:Q\s*|Question\s*|प्रश्न\s*|प्र\.\s*)?\d+(?:[.)\]:-]|\s+|$))/im;
    const rawBlocks = bulkText.split(splitRegex).map(b => b.trim()).filter(b => b);
    const blocks = rawBlocks.length > 0 ? rawBlocks : [bulkText.trim()];
    
    blocks.forEach(block => {
      const lines = block.split('\n').map(l => l.trim()).filter(l => l);
      if(lines.length < 3) return;
      
      let qText = "";
      const options: any[] = [];
      let answer = "";
      let explanation = "";
      
      let currentCtx = 'q';
      
      // Match option indicators like A. A) (A) [A] 1. (1) etc.
      const optRegex = /^(?:[\(\[]\s*)?(?:\*\*)?[A-Ea-e1-5](?:\*\*)?(?:[\)\]]|\.)\s*/;
      
      for (const line of lines) {
        if (currentCtx === 'q' && !qText) {
             qText = line.replace(/^(?:###\s*)?(?:Q\s*|Question\s*|प्रश्न\s*|प्र\.\s*)?\d+[.)\]:-]?\s*/i, '');
             continue;
        }

        if (optRegex.test(line)) {
          currentCtx = 'opt';
          const cleanOpt = line.replace(optRegex, '').replace(/\*\*$/, '').trim();
          options.push({ id: (options.length + 1).toString(), contentMarkdown: cleanOpt });
        } else if (/^(?:\*\*)?(?:Ans|Answer|Correct|उत्तर|सही उत्तर)\s*(?:\*\*)?\s*[:=]?/i.test(line)) {
          currentCtx = 'ans';
          const cleanLine = line.replace(/\*\*/g, '');
          const rawAns = cleanLine.replace(/^(?:Ans|Answer|Correct|उत्तर|सही उत्तर)\s*[:=]?\s*/i, '').trim();
          const match = rawAns.match(/^[A-Ea-e1-5]/);
          if (match) {
             answer = match[0].toUpperCase();
          } else {
             answer = rawAns;
          }
        } else if (/^(?:\*\*)?(?:Exp|Explanation|Reason|हल|स्पष्टीकरण)\s*(?:\*\*)?\s*[:=]?/i.test(line)) {
          currentCtx = 'exp';
          const cleanLine = line.replace(/\*\*/g, '');
          explanation = cleanLine.replace(/^(?:Exp|Explanation|Reason|हल|स्पष्टीकरण)\s*[:=]?\s*/i, '').trim();
        } else {
          if (currentCtx === 'q') qText += (qText ? '\n' : '') + line;
          else if (currentCtx === 'opt' && options.length > 0) {
             options[options.length - 1].contentMarkdown += '\n' + line;
          }
          else if (currentCtx === 'exp') explanation += (explanation ? '\n' : '') + line;
        }
      }
      
      // We need exactly 4 options by default. We can accept if it has at least 2.
      if (options.length >= 2) {
         let correctOptionId = '1';
         if (answer) {
             const charCode = answer.charCodeAt(0);
             if (charCode >= 65 && charCode <= 69) { // A to E (if they provide 5 options)
                correctOptionId = (charCode - 64).toString();
             } else if (charCode >= 49 && charCode <= 53) { // 1 to 5
                correctOptionId = answer;
             }
         }
         
         parsed.push({
           contentMarkdown: qText,
           options: options.slice(0, 4), // keep up to 4 for UI consistency, or let it map all? Our Player maps all! 
           // Wait, schema enforces options array. Let player map all. We'll slice 4.
           correctOptionId,
           explanationMarkdown: explanation
         });
      }
    });
    
    setBulkPreview(parsed);
  };

  const handleImportParsed = async () => {
    if (test.isSectionsEnabled && !qForm.sectionId) {
       alert("Please select a Target Section for these questions!");
       return;
    }
    setIsImporting(true);
    let successCount = 0;
    try {
      let currentOrder = questions.length;
      for (const q of bulkPreview) {
        currentOrder++;
        const payload = { ...q, type: 'MCQ', testId, order: currentOrder, sectionId: qForm.sectionId || undefined };
        const res = await fetch(`/api/mock-tests/${testId}/questions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
           const err = await res.json();
           throw new Error(err.error || 'Failed to insert question');
        }
        successCount++;
      }
      await fetchTestData();
      setIsBulkImport(false);
      setBulkText("");
      setBulkPreview([]);
      alert(`Imported ${successCount} questions successfully!`);
    } catch (e: any) {
      console.error(e);
      alert(`Error importing questions after ${successCount} inserts: ${e.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleSaveQuestion = async () => {
    if (test.isSectionsEnabled && !qForm.sectionId) {
       alert("Please select a Target Section for this question!");
       return;
    }
    try {
      const isNew = !qForm.id;
      const url = isNew ? `/api/mock-tests/${testId}/questions` : `/api/mock-tests/${testId}/questions/${qForm.id}`;
      const method = isNew ? 'POST' : 'PUT';
      
      const payload = { ...qForm, type: 'MCQ', testId, order: questions.length + 1 };
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        setIsAddingQ(false);
        fetchTestData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save question');
      }
    } catch {
       alert('Network error saving question.');
    }
  };

  const handleDeleteQ = async (id: string) => {
    if (!confirm('Delete question?')) return;
    await fetch(`/api/mock-tests/${testId}/questions/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` } });
    setQuestions(questions.filter(q => q.id !== id));
  };

  const handleOptionChange = (idx: number, content: string) => {
    const newOpts = [...(qForm.options || [])];
    newOpts[idx].contentMarkdown = content;
    setQForm({...qForm, options: newOpts });
  };

  const handleGenerateQ = async () => {
    if (!aiPrompt) return;
    // Simulated AI Generation for prompt text into Markdown (or call actual AI API)
    // Normally you would send aiPrompt to your node backend that uses Gemini to structured JSON output
    alert("AI Generation is an advanced feature that requires proper backend parsing. Please enter questions manually with markdown (React-Markdown + Math Katex) formatting rules provided!");
  };

  if (loading) return <div className="py-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;
  if (!test) return null;

  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-6 flex items-center gap-4">
        <button onClick={onBack} className="p-2 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-slate-700 transition">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white line-clamp-1">{test.title}</h2>
          <div className="flex gap-4 mt-1 text-sm text-gray-600 dark:text-slate-400">
             <span>{questions.length} Questions</span>
             <span>|</span>
             <span>Status: {test.published ? 'Published' : 'Draft'}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-4 border-b border-gray-200 dark:border-slate-700 mb-6">
        <button onClick={() => setActiveTab('settings')} className={`pb-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'settings' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>Settings</button>
        <button onClick={() => setActiveTab('questions')} className={`pb-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'questions' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>Manage Questions</button>
      </div>

      {activeTab === 'settings' && (
        <form onSubmit={handleUpdateTest} className="max-w-2xl bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 space-y-6">
           <div>
             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Test Title</label>
             <input type="text" value={test.title} onChange={e => setTest({...test, title: e.target.value})} className="w-full rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 p-2 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 ring-indigo-500 outline-none" required />
           </div>

           <div>
             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category (e.g., Mock Test, UP Police, SSC)</label>
             <select value={test.categoryId || ''} onChange={e => setTest({...test, categoryId: e.target.value})} className="w-full rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 p-2 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 ring-indigo-500 outline-none" required>
               <option value="">Select a Category...</option>
               {renderCategoryOptions(undefined, 0)}
             </select>
           </div>
           
           <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duration (Mins)</label>
               <input type="number" min="1" value={test.durationMinutes} onChange={e => setTest({...test, durationMinutes: Number(e.target.value)})} className="w-full rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 p-2 text-sm text-gray-900 dark:text-gray-100" required />
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Total Marks</label>
               <input type="number" min="1" value={test.totalMarks} onChange={e => setTest({...test, totalMarks: Number(e.target.value)})} className="w-full rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 p-2 text-sm text-gray-900 dark:text-gray-100" required />
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Positive Marks (Per Q)</label>
               <input type="number" step="0.1" min="0" value={test.positiveMarks} onChange={e => setTest({...test, positiveMarks: Number(e.target.value)})} className="w-full rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 p-2 text-sm text-gray-900 dark:text-gray-100" required />
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Negative Marks (Per Q)</label>
               <input type="number" step="0.01" min="0" value={test.negativeMarks} onChange={e => setTest({...test, negativeMarks: Number(e.target.value)})} className="w-full rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 p-2 text-sm text-gray-900 dark:text-gray-100" required />
             </div>
           </div>

           <div className="flex items-center gap-3 py-2">
             <input type="checkbox" id="pub" checked={test.published} onChange={e => setTest({...test, published: e.target.checked})} className="w-4 h-4 text-indigo-600 rounded" />
             <label htmlFor="pub" className="text-sm font-medium text-gray-700 dark:text-gray-300">Publish Test (Visible to users)</label>
           </div>

           <button type="submit" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium flex items-center gap-2">
             <Save className="w-5 h-5" /> Save Settings
           </button>
        </form>
      )}

      {activeTab === 'questions' && (
        <div className="space-y-6">
          {isBulkImport ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
              <div className="flex justify-between items-center border-b border-gray-100 dark:border-slate-700 pb-4 mb-5">
                 <h3 className="text-lg font-bold text-gray-900 dark:text-white">Bulk Plain Text Import</h3>
                 <button onClick={() => { setIsBulkImport(false); setBulkPreview([]); }} className="text-gray-500 hover:text-gray-900 dark:hover:text-white text-sm font-medium">Cancel</button>
              </div>
              <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">
                 Format your questions like this: <br/>
                 <code>Q1. What is the capital of France?</code><br/>
                 <code>A. London</code><br/>
                 <code>B. Paris</code><br/>
                 <code>C. Rome</code><br/>
                 <code>D. Madrid</code><br/>
                 <code>Answer: B</code><br/>
                 <code>Explanation: Paris is the capital.</code>
              </p>
              
              <div className="space-y-6">
                 {test.isSectionsEnabled && sections.length > 0 && (
                   <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Target Section</label>
                     <select value={qForm.sectionId || ''} onChange={e => setQForm({...qForm, sectionId: e.target.value})} className="w-full rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 p-2 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none" required>
                       <option value="">Select Section (Required)</option>
                       {sections.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                     </select>
                   </div>
                 )}
                 <textarea rows={8} value={bulkText} onChange={(e) => setBulkText(e.target.value)} className="w-full rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 p-3 text-sm text-gray-900 dark:text-gray-100 font-mono focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Paste questions here..." />
                 <div className="flex justify-between">
                    <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                      {bulkPreview.length > 0 ? `${bulkPreview.length} Questions Parsed` : 'Paste text and click Preview'}
                    </div>
                    <button onClick={handleParseBulk} disabled={!bulkText} className="px-5 py-2.5 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-800 dark:text-white rounded-lg font-medium disabled:opacity-50">
                       Parse & Preview
                    </button>
                 </div>

                 {bulkPreview.length > 0 && (
                   <div className="mt-8 border-t border-gray-200 dark:border-slate-700 pt-6">
                     <h4 className="font-bold text-gray-900 dark:text-white mb-4">Preview ({bulkPreview.length} Questions)</h4>
                     <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                       {bulkPreview.map((q, idx) => (
                         <div key={idx} className="bg-gray-50 dark:bg-slate-900/50 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
                           <div className="font-bold text-sm mb-2 text-gray-900 dark:text-white">
                             Q {idx + 1}. <span className="inline"><Markdown remarkPlugins={[remarkMath, remarkBreaks]} rehypePlugins={[[rehypeKatex, { strict: false }]]}>{((q.contentMarkdown as string) || "").replace(/\\\(/g, '$').replace(/\\\)/g, '$').replace(/\\\[/g, '$$$$').replace(/\\\]/g, '$$$$')}</Markdown></span>
                           </div>
                           <div className="text-sm space-y-1 mb-2 pl-4">
                             {q.options?.map((o, oidx) => (
                               <div key={oidx} className={q.correctOptionId === o.id ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-gray-600 dark:text-gray-400'}>
                                  {String.fromCharCode(65 + oidx)}. <Markdown remarkPlugins={[remarkMath, remarkBreaks]} rehypePlugins={[[rehypeKatex, { strict: false }]]}>{((o.contentMarkdown as string) || "").replace(/\\\(/g, '$').replace(/\\\)/g, '$').replace(/\\\[/g, '$$$$').replace(/\\\]/g, '$$$$')}</Markdown>
                               </div>
                             ))}
                           </div>
                           {q.explanationMarkdown && <div className="text-xs text-gray-500 dark:text-slate-400 mt-2 p-2 bg-gray-100 dark:bg-slate-800 rounded">Exp: <Markdown remarkPlugins={[remarkMath, remarkBreaks]} rehypePlugins={[[rehypeKatex, { strict: false }]]}>{((q.explanationMarkdown as string) || "").replace(/\\\(/g, '$').replace(/\\\)/g, '$').replace(/\\\[/g, '$$$$').replace(/\\\]/g, '$$$$')}</Markdown></div>}
                         </div>
                       ))}
                     </div>
                     <div className="flex justify-end pt-6 mt-4 border-t border-gray-200 dark:border-slate-700">
                       <button onClick={handleImportParsed} disabled={isImporting} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold disabled:opacity-50 flex items-center gap-2">
                         {isImporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                         Import {bulkPreview.length} Questions
                       </button>
                     </div>
                   </div>
                 )}
              </div>
            </div>
          ) : !isAddingQ ? (
            <>
              <div className="flex gap-4">
                <button onClick={() => { setQForm({ options: [{id: '1', contentMarkdown: ''}, {id: '2', contentMarkdown: ''}, {id: '3', contentMarkdown: ''}, {id: '4', contentMarkdown: ''}], correctOptionId: '1' }); setIsAddingQ(true); }} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2">
                  <Plus className="w-5 h-5" /> Add Question Manually
                </button>
                <div className="flex-1 flex gap-2">
                  <button onClick={() => { setIsBulkImport(true); setIsAddingQ(false); }} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg flex items-center gap-2">
                     <FileText className="w-5 h-5" /> Bulk Text Import
                  </button>
                  <button onClick={() => {
                     const template = `Please generate 5 MCQ questions for [Topic]. Use Markdown for text. For Math formulas use $...$ (inline) or $$...$$ (block). For Chemistry, also use Math formatting with chemical symbols. For each question, provide 4 options and the correct answer explanation.`;
                     navigator.clipboard.writeText(template);
                     alert("AI Prompt template copied to clipboard! Paste it into ChatGPT/Gemini and paste the generated Markdown back into our manual question editor.");
                  }} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg flex items-center gap-2">
                     <Wand2 className="w-4 h-4" /> Copy AI Prompt Template
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {questions.map((q, idx) => (
                  <div key={q.id} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5 shadow-sm">
                    <div className="flex justify-between items-start gap-4">
                       <div className="flex-1">
                          <div className="font-bold text-sm text-gray-500 dark:text-slate-400 mb-2">Q {idx + 1}.</div>
                          <div className="prose dark:prose-invert prose-sm max-w-none">
                            <Markdown remarkPlugins={[remarkMath, remarkGfm, remarkBreaks]} rehypePlugins={[[rehypeKatex, { strict: false }]]}>{(q.contentMarkdown || "").replace(/\\\(/g, '$').replace(/\\\)/g, '$').replace(/\\\[/g, '$$$$').replace(/\\\]/g, '$$$$')}</Markdown>
                          </div>
                       </div>
                       <div className="flex gap-2 shrink-0">
                         <button onClick={() => { setQForm(q); setIsAddingQ(true); }} className="p-2 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded"><Edit3 className="w-4 h-4" /></button>
                         <button onClick={() => handleDeleteQ(q.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"><Trash2 className="w-4 h-4" /></button>
                       </div>
                    </div>
                  </div>
                ))}
                {questions.length === 0 && <div className="text-center py-10 text-gray-500 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-xl">No questions added yet.</div>}
              </div>
            </>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
              <div className="flex justify-between items-center border-b border-gray-100 dark:border-slate-700 pb-4 mb-5">
                 <h3 className="text-lg font-bold text-gray-900 dark:text-white">{qForm.id ? 'Edit Question' : 'Add Question'}</h3>
                 <button onClick={() => setIsAddingQ(false)} className="text-gray-500 hover:text-gray-900 dark:hover:text-white text-sm font-medium">Cancel</button>
              </div>
              
              <div className="space-y-6">
                 {test.isSectionsEnabled && sections.length > 0 && (
                   <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Target Section</label>
                     <select value={qForm.sectionId || ''} onChange={e => setQForm({...qForm, sectionId: e.target.value})} className="w-full rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 p-2 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none" required>
                       <option value="">Select Section (Required)</option>
                       {sections.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                     </select>
                   </div>
                 )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex justify-between">
                    Question Content (Markdown)
                    <span className="text-xs text-gray-500">Supports Math & Chemistry (e.g., $E=mc^2$ or $$ \int $$)</span>
                  </label>
                  <textarea rows={5} value={qForm.contentMarkdown || ''} onChange={e => setQForm({...qForm, contentMarkdown: e.target.value})} className="w-full rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 p-3 text-sm text-gray-900 dark:text-gray-100 font-mono focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Enter question..." />
                </div>

                <div className="space-y-4 pt-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Options</label>
                  {qForm.options?.map((opt, idx) => (
                    <div key={opt.id} className="flex gap-3 items-start">
                       <input type="radio" name="correctOpt" checked={qForm.correctOptionId === opt.id} onChange={() => setQForm({...qForm, correctOptionId: opt.id})} className="mt-3 w-4 h-4 text-emerald-600 focus:ring-emerald-500" />
                       <div className="flex-1">
                         <input type="text" value={opt.contentMarkdown} onChange={e => handleOptionChange(idx, e.target.value)} placeholder={`Option ${idx + 1}`} className={`w-full rounded-md border p-2 text-sm outline-none focus:ring-2 ${qForm.correctOptionId === opt.id ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/10 focus:ring-emerald-500' : 'border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-indigo-500'}`} />
                       </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Explanation (Optional)</label>
                  <textarea rows={3} value={qForm.explanationMarkdown || ''} onChange={e => setQForm({...qForm, explanationMarkdown: e.target.value})} className="w-full rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 p-3 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Explain the correct answer..." />
                </div>

                <div className="flex justify-end pt-4">
                   <button onClick={handleSaveQuestion} disabled={!qForm.contentMarkdown || qForm.options?.some(o=>!o.contentMarkdown)} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-medium flex items-center gap-2">
                     <Save className="w-5 h-5" /> Save Question
                   </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
