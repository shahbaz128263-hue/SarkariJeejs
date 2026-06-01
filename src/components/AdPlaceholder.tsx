export function AdPlaceholder({ className = '' }: { className?: string }) {
  const adHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body, html { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; overflow: hidden; background: transparent; }
        </style>
      </head>
      <body>
        <script async="async" data-cfasync="false" src="https://pl29609909.effectivecpmnetwork.com/3c0c51334a7cdfe71acee167b17456d4/invoke.js"></script>
        <div id="container-3c0c51334a7cdfe71acee167b17456d4"></div>
      </body>
    </html>
  `;

  return (
    <div className={`w-full flex justify-center my-6 py-2 ${className}`}>
      <div className="w-full max-w-[728px] min-h-[90px] flex flex-col items-center justify-center relative">
        <span className="absolute -top-3 text-[10px] text-slate-400 uppercase tracking-wider z-10 font-sans pointer-events-none text-center">Advertisement</span>
        <iframe 
          title="Advertisement"
          srcDoc={adHtml} 
          width="100%" 
          height="90" 
          className="border-0 w-full relative z-20 m-0 p-0"
          style={{ overflow: 'hidden' }}
          scrolling="no"
          sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-same-origin"
        />
      </div>
    </div>
  );
}
