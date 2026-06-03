import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2, Clock, CheckCircle2, XCircle, AlertCircle, Play, ChevronLeft, ChevronRight, BarChart3 } from 'lucide-react';
import { MockTest, MockTestSection, MockTestQuestion } from '../types';
import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

type AnswerMap = Record<string, string>;

export function MockTestPlayer() {
  const { id } = useParams();
  const [test, setTest] = useState<MockTest | null>(null);
  const [sections, setSections] = useState<MockTestSection[]>([]);
  const [questions, setQuestions] = useState<MockTestQuestion[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  
  const [currentSectionId, setCurrentSectionId] = useState<string | null>(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    fetchTest();
  }, [id]);

  const fetchTest = async () => {
    setLoading(true);
    try {
      const [tRes, sRes, qRes] = await Promise.all([
        fetch(`/api/mock-tests/${id}`),
        fetch(`/api/mock-tests/${id}/sections`),
        fetch(`/api/mock-tests/${id}/questions`)
      ]);
      const t = await tRes.json();
      setTest(t);
      setTimeLeft(t.durationMinutes * 60);
      const secs = await sRes.json();
      setSections(secs);
      setQuestions(await qRes.json());
      if (t.isSectionsEnabled && secs.length > 0) {
        setCurrentSectionId(secs[0].id);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    if (started && !finished && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setFinished(true); // Auto submit
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [started, finished, timeLeft]);

  const displayedQuestions = useMemo(() => {
    if (!test?.isSectionsEnabled) return questions;
    return questions.filter(q => q.sectionId === currentSectionId);
  }, [test, questions, currentSectionId]);

  const currentQ = displayedQuestions[currentQIndex];

  const handleOptionSelect = (qId: string, optId: string) => {
    setAnswers(prev => ({ ...prev, [qId]: optId }));
  };

  const handleNext = () => {
    if (currentQIndex < displayedQuestions.length - 1) {
       setCurrentQIndex(currentQIndex + 1);
    } else if (test?.isSectionsEnabled && currentSectionId) {
       const sectionIndex = sections.findIndex(s => s.id === currentSectionId);
       if (sectionIndex < sections.length - 1) {
          setCurrentSectionId(sections[sectionIndex + 1].id);
          setCurrentQIndex(0);
       }
    }
  };

  const handlePrev = () => {
    if (currentQIndex > 0) {
       setCurrentQIndex(currentQIndex - 1);
    } else if (test?.isSectionsEnabled && currentSectionId) {
       const sectionIndex = sections.findIndex(s => s.id === currentSectionId);
       if (sectionIndex > 0) {
          setCurrentSectionId(sections[sectionIndex - 1].id);
          const prevSecQuestions = questions.filter(q => q.sectionId === sections[sectionIndex - 1].id);
          setCurrentQIndex(Math.max(0, prevSecQuestions.length - 1));
       }
    }
  };

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const resultStats = useMemo(() => {
    if (!finished) return null;
    let correct = 0;
    let wrong = 0;
    let skipped = 0;
    let totalScore = 0;

    questions.forEach(q => {
      const ans = answers[q.id];
      if (!ans) {
        skipped++;
      } else if (ans === q.correctOptionId) {
        correct++;
        totalScore += test?.positiveMarks || 1;
      } else {
        wrong++;
        totalScore -= test?.negativeMarks || 0;
      }
    });

    return { correct, wrong, skipped, totalScore, totalQuestions: questions.length };
  }, [finished, answers, questions, test]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;
  if (!test) return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 text-gray-500">Test not found.</div>;

  if (!started) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4">
         <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{test.title}</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8">Please read all instructions before starting.</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 text-left">
              <div className="bg-gray-50 dark:bg-slate-900/50 p-4 rounded-xl border border-gray-100 dark:border-slate-700">
                <div className="text-sm text-gray-500 dark:text-gray-400">Duration</div>
                <div className="font-bold text-lg dark:text-white">{test.durationMinutes} Mins</div>
              </div>
              <div className="bg-gray-50 dark:bg-slate-900/50 p-4 rounded-xl border border-gray-100 dark:border-slate-700">
                <div className="text-sm text-gray-500 dark:text-gray-400">Questions</div>
                <div className="font-bold text-lg dark:text-white">{questions.length}</div>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
                <div className="text-sm text-emerald-600 dark:text-emerald-400">+ Marks</div>
                <div className="font-bold text-lg text-emerald-700 dark:text-emerald-300">{test.positiveMarks} per correct</div>
              </div>
              <div className="bg-rose-50 dark:bg-rose-900/20 p-4 rounded-xl border border-rose-100 dark:border-rose-900/50">
                <div className="text-sm text-rose-600 dark:text-rose-400">- Marks</div>
                <div className="font-bold text-lg text-rose-700 dark:text-rose-300">{test.negativeMarks} per wrong</div>
              </div>
            </div>

            <button onClick={() => setStarted(true)} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-lg font-bold rounded-xl shadow transition-transform hover:scale-105 active:scale-95 flex items-center gap-2 mx-auto">
               <Play className="w-5 h-5 fill-current" /> Start Challenge
            </button>
         </div>
      </div>
    );
  }

  if (finished && resultStats) {
    const data = [
      { name: 'Correct', value: resultStats.correct, color: '#10b981' },
      { name: 'Wrong', value: resultStats.wrong, color: '#f43f5e' },
      { name: 'Skipped', value: resultStats.skipped, color: '#94a3b8' },
    ];

    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center">Score Report</h2>
        
        <div className="grid md:grid-cols-2 gap-6 mb-8">
           <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-8 flex flex-col items-center justify-center">
             <div className="text-5xl font-black text-indigo-600 dark:text-indigo-400 mb-2">{resultStats.totalScore.toFixed(2)}</div>
             <div className="text-gray-500 dark:text-gray-400 font-medium tracking-wide uppercase">Final Score</div>
             <div className="mt-6 text-sm text-gray-400">Total Available Marks: {test.totalMarks}</div>
           </div>
           
           <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 flex items-center justify-center h-[280px]">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {data.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
             </ResponsiveContainer>
             <div className="absolute right-8 md:right-16 space-y-3">
                {data.map(d => (
                  <div key={d.name} className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></div>
                    <span className="text-gray-600 dark:text-gray-300 w-16">{d.name}</span>
                    <span className="font-bold dark:text-white">{d.value}</span>
                  </div>
                ))}
             </div>
           </div>
        </div>

        <h3 className="text-xl font-bold dark:text-white mb-4">Detailed Breakdown</h3>
        <div className="space-y-4">
          {questions.map((q, idx) => {
            const userAns = answers[q.id];
            const isCorrect = userAns === q.correctOptionId;
            const isSkipped = !userAns;
            
            return (
              <div key={q.id} className={`bg-white dark:bg-slate-800 rounded-xl border p-5 ${isCorrect ? 'border-emerald-200 dark:border-emerald-900/50' : isSkipped ? 'border-gray-200 dark:border-slate-700' : 'border-rose-200 dark:border-rose-900/50'}`}>
                 <div className="flex justify-between items-start mb-3">
                   <div className="font-bold text-gray-500 flex gap-2 items-center">
                     Q {idx+1}. 
                     {isCorrect && <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Correct</span>}
                     {!isCorrect && !isSkipped && <span className="bg-rose-100 text-rose-700 text-xs px-2 py-0.5 rounded-full flex items-center gap-1"><XCircle className="w-3 h-3"/> Wrong</span>}
                     {isSkipped && <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Skipped</span>}
                   </div>
                 </div>
                 <div className="prose dark:prose-invert prose-sm max-w-none mb-4">
                   <Markdown remarkPlugins={[remarkMath, remarkGfm, remarkBreaks]} rehypePlugins={[[rehypeKatex, { strict: false }]]}>{q.contentMarkdown || ""}</Markdown>
                 </div>
                 <div className="space-y-2 opacity-80">
                   {q.options.map((opt, oIdx) => (
                     <div key={opt.id} className={`px-4 py-2 rounded-lg text-sm flex gap-3 ${opt.id === q.correctOptionId ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 border' : userAns === opt.id ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800 border' : 'bg-gray-50 dark:bg-slate-900/50 border border-transparent'}`}>
                       <span className="font-bold">{String.fromCharCode(65 + oIdx)}.</span>
                       <Markdown remarkPlugins={[remarkMath, remarkBreaks]} rehypePlugins={[[rehypeKatex, { strict: false }]]}>{opt.contentMarkdown || ""}</Markdown>
                     </div>
                   ))}
                 </div>
                 {q.explanationMarkdown && (
                   <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
                     <div className="text-xs font-bold uppercase tracking-wider text-indigo-500 mb-2">Explanation</div>
                     <div className="prose dark:prose-invert prose-sm">
                       <Markdown remarkPlugins={[remarkMath, remarkGfm, remarkBreaks]} rehypePlugins={[[rehypeKatex, { strict: false }]]}>{q.explanationMarkdown || ""}</Markdown>
                     </div>
                   </div>
                 )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Active Test UI
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col font-sans transition-colors pt-2">
       <header className="sticky top-0 bg-white dark:bg-slate-800 shadow-sm z-10 px-4 py-3 flex justify-between items-center">
         <div>
            <h1 className="font-bold text-gray-900 dark:text-white leading-tight">{test.title}</h1>
            {test.isSectionsEnabled && currentSectionId && (
              <div className="text-sm font-medium text-indigo-600 dark:text-indigo-400">{sections.find(s=>s.id === currentSectionId)?.title}</div>
            )}
         </div>
         <div className="flex items-center gap-4">
           <div className={`font-mono text-xl font-bold flex items-center gap-2 ${timeLeft < 300 ? 'text-rose-500 animate-pulse' : 'text-gray-700 dark:text-gray-300'}`}>
             <Clock className="w-5 h-5" /> {formatTime(timeLeft)}
           </div>
           <button onClick={() => { if(confirm('Submit Test?')) setFinished(true); }} className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold shadow-sm transition-colors">
             Submit Exam
           </button>
         </div>
       </header>

       <div className="flex-1 max-w-7xl mx-auto w-full flex flex-col md:flex-row gap-4 p-4 lg:p-6">
         
         <div className="flex-1 flex flex-col bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
           {test.isSectionsEnabled && (
             <div className="flex overflow-x-auto border-b border-gray-200 dark:border-slate-700 scrollbar-hide bg-gray-50 dark:bg-slate-900/50">
               {sections.map(s => (
                 <button key={s.id} onClick={() => {setCurrentSectionId(s.id); setCurrentQIndex(0);}} className={`px-4 py-3 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${currentSectionId === s.id ? 'border-indigo-600 text-indigo-600 bg-white dark:bg-slate-800' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                   {s.title}
                 </button>
               ))}
             </div>
           )}
           
           <div className="p-6 flex-1 overflow-y-auto">
             {!currentQ ? (
                <div className="py-20 text-center text-gray-500">No questions found in this section.</div>
             ) : (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex justify-between items-center mb-6">
                     <span className="font-bold text-gray-700 dark:text-gray-300">Question {currentQIndex + 1} of {displayedQuestions.length}</span>
                     <span className="text-xs bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded font-medium">+{test.positiveMarks} / -{test.negativeMarks} marks</span>
                  </div>
                  
                  <div className="prose dark:prose-invert prose-lg max-w-none text-gray-900 dark:text-gray-100 mb-8 border-l-4 border-indigo-500 pl-4 py-1 bg-gray-50 dark:bg-slate-800/50">
                    <Markdown remarkPlugins={[remarkMath, remarkGfm, remarkBreaks]} rehypePlugins={[[rehypeKatex, { strict: false }]]}>{currentQ.contentMarkdown || ""}</Markdown>
                  </div>

                  <div className="space-y-3">
                    {currentQ.options.map((opt, oIdx) => {
                      const isSelected = answers[currentQ.id] === opt.id;
                      return (
                        <button key={opt.id} onClick={() => handleOptionSelect(currentQ.id, opt.id)} className={`w-full text-left p-4 rounded-xl border-2 transition-all group ${isSelected ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-slate-500 bg-white dark:bg-slate-800'}`}>
                          <div className="flex gap-4 items-center">
                            <div className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 border ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-300 dark:border-slate-600 text-gray-500 group-hover:border-indigo-400 dark:group-hover:border-slate-500 dark:text-gray-400'}`}>
                               {String.fromCharCode(65 + oIdx)}
                            </div>
                            <div className={`prose dark:prose-invert prose-sm flex-1 ${isSelected ? 'text-indigo-900 dark:text-indigo-100' : 'text-gray-700 dark:text-gray-300'}`}>
                              <Markdown remarkPlugins={[remarkMath, remarkBreaks]} rehypePlugins={[[rehypeKatex, { strict: false }]]}>{opt.contentMarkdown || ""}</Markdown>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
             )}
           </div>

           {/* Content Footer Navigation */}
           <div className="p-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 flex justify-between items-center">
              <button disabled={(!test.isSectionsEnabled && currentQIndex === 0) || (test.isSectionsEnabled && currentQIndex === 0 && sections.findIndex(s=>s.id === currentSectionId)===0)} onClick={handlePrev} className="px-5 py-2.5 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-slate-600 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition disabled:opacity-50 flex items-center gap-2">
                 <ChevronLeft className="w-5 h-5" /> Previous
              </button>
              <div className="flex gap-2">
                 <button onClick={() => {const newAnswers = {...answers}; delete newAnswers[currentQ?.id]; setAnswers(newAnswers);}} className="px-5 py-2.5 text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg font-medium transition hidden sm:block">
                   Clear Selection
                 </button>
                 <button onClick={handleNext} className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition flex items-center gap-2 shadow-sm">
                   Save & Next <ChevronRight className="w-5 h-5" />
                 </button>
              </div>
           </div>
         </div>

         {/* Right Sidebar Question Palette */}
         <div className="w-full md:w-80 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 flex flex-col h-[400px] md:h-auto">
           <div className="p-4 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 font-bold text-gray-900 dark:text-white">
              Question Palette
           </div>
           <div className="p-4 flex-1 overflow-y-auto">
             <div className="flex flex-wrap gap-2">
                {displayedQuestions.map((q, idx) => {
                  const isAnswered = !!answers[q.id];
                  const isActive = currentQ?.id === q.id;
                  return (
                    <button key={q.id} onClick={() => setCurrentQIndex(idx)} className={`w-10 h-10 rounded-lg text-sm font-bold flex items-center justify-center transition-all ${isActive ? 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-800' : ''} ${isAnswered ? 'bg-emerald-500 text-white shadow-sm' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'}`}>
                      {idx + 1}
                    </button>
                  );
                })}
             </div>
           </div>
           <div className="p-4 border-t border-gray-200 dark:border-slate-700 text-xs flex justify-around bg-gray-50 dark:bg-slate-900/50">
             <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 font-medium">
               <div className="w-4 h-4 rounded bg-emerald-500 shrink-0"></div> Answered
             </div>
             <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 font-medium">
               <div className="w-4 h-4 rounded bg-gray-200 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 shrink-0"></div> Unanswered
             </div>
           </div>
         </div>
       </div>

    </div>
  );
}
