import { useEffect, useRef } from 'react';

export function AdPlaceholder({ className = '' }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Inject the Adsterra script directly into the container wrapper
    // Some ad networks require the script to be placed exactly where it should render
    if (containerRef.current && !containerRef.current.querySelector('script')) {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.async = true;
      script.setAttribute('data-cfasync', 'false');
      script.src = 'https://pl29609909.effectivecpmnetwork.com/3c0c51334a7cdfe71acee167b17456d4/invoke.js';
      containerRef.current.appendChild(script);
    }
  }, []);

  return (
    <div className={`w-full flex justify-center my-6 ${className}`}>
      <div className="w-full max-w-[728px] min-h-[90px] bg-slate-50 border border-slate-100 flex flex-col items-center justify-center rounded-md overflow-hidden relative">
        <span className="absolute top-1 left-2 text-[8px] text-slate-300 uppercase tracking-wider">Advertisement</span>
        {/* Adsterra Ad Container Wrapper */}
        <div ref={containerRef} className="w-full flex justify-center">
          <div id="container-3c0c51334a7cdfe71acee167b17456d4"></div>
        </div>
      </div>
    </div>
  );
}
