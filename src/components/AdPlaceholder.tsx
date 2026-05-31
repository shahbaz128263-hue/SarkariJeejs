export function AdPlaceholder({ className = '' }: { className?: string }) {
  return (
    <div className={`w-full flex justify-center my-6 ${className}`}>
      <div className="w-full max-w-[728px] min-h-[90px] bg-slate-100 border border-slate-300 flex flex-col items-center justify-center text-slate-400 rounded-md gap-1.5 p-2 shadow-sm font-sans relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>
        <span className="uppercase tracking-widest font-bold text-xs flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-slate-300 rounded-full inline-block"></span>
          Advertisement
          <span className="w-1.5 h-1.5 bg-slate-300 rounded-full inline-block"></span>
        </span>
        <span className="text-[10px] bg-slate-200/50 px-2.5 py-0.5 rounded text-slate-500 font-medium">Google AdSense / Sponsorship Space</span>
      </div>
    </div>
  );
}
