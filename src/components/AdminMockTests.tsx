import React, { useState, useEffect } from 'react';
import { Loader2, PlusCircle, Trash2, Edit3, Settings, BookOpen, Layers, CheckCircle } from 'lucide-react';
import { MockTest, MockTestSection, MockTestQuestion } from '../types';
import { AdminMockTestBuilder } from './AdminMockTestBuilder';

export function AdminMockTests() {
  const [tests, setTests] = useState<MockTest[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingTestId, setEditingTestId] = useState<string | null>(null);

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/mock-tests');
      const data = await res.json();
      setTests(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleCreateNew = async () => {
    const newTest = {
      title: 'New Untitled Test',
      durationMinutes: 60,
      totalMarks: 100,
      positiveMarks: 1,
      negativeMarks: 0.25,
      isSectionsEnabled: false,
      published: false
    };
    try {
      const res = await fetch('/api/mock-tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(newTest)
      });
      if (res.ok) {
        const data = await res.json();
        setTests([data, ...tests]);
        setEditingTestId(data.id);
      }
    } catch {}
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this test? All questions will be lost.')) return;
    try {
      const res = await fetch(`/api/mock-tests/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      if (res.ok) {
        setTests(tests.filter(t => t.id !== id));
      }
    } catch {}
  };

  if (editingTestId) {
    return <AdminMockTestBuilder testId={editingTestId} onBack={() => { setEditingTestId(null); fetchTests(); }} />;
  }

  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-8 flex justify-between items-center">
         <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Mock Test Creator</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">Create, manage and publish advanced mock tests.</p>
         </div>
         <button onClick={handleCreateNew} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors">
           <PlusCircle className="w-5 h-5" />
           New Exam
         </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
           <div className="col-span-full py-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
        ) : tests.length === 0 ? (
           <div className="col-span-full py-12 text-center text-gray-500 dark:text-gray-400 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-gray-300 dark:border-slate-700">
             No mock tests found. Create your first exam!
           </div>
        ) : (
          tests.map(test => (
            <div key={test.id} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
               {test.published && <div className="absolute top-3 right-3 text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded text-xs font-bold ring-1 ring-emerald-200 dark:ring-emerald-800">Published</div>}
               {!test.published && <div className="absolute top-3 right-3 text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded text-xs font-bold ring-1 ring-amber-200 dark:ring-amber-800">Draft</div>}
               
               <h3 className="font-bold text-lg text-gray-900 dark:text-white mt-1 pr-16 line-clamp-2">{test.title}</h3>
               
               <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-slate-400">
                 <div className="flex items-center gap-1.5"><Layers className="w-4 h-4 text-indigo-400" /> {test.durationMinutes} mins</div>
                 <div className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-400" /> {test.totalMarks} marks</div>
                 <div className="col-span-2 text-xs mt-1 opacity-75">
                    Neg Mark: {test.negativeMarks} &bull; Sections: {test.isSectionsEnabled ? 'Yes' : 'No'}
                 </div>
               </div>

               <div className="mt-6 flex items-center justify-between gap-3 border-t border-gray-100 dark:border-slate-700 pt-4">
                 <button onClick={() => setEditingTestId(test.id)} className="flex-1 flex justify-center items-center gap-1.5 px-3 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition font-medium text-sm">
                   <Edit3 className="w-4 h-4" /> Edit Exam
                 </button>
                 <button onClick={() => handleDelete(test.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition">
                   <Trash2 className="w-4 h-4" />
                 </button>
               </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
