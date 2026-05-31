import { Clock, AlertCircle } from 'lucide-react';

export function JobStatusBadge({ lastDate }: { lastDate: string }) {
  if (!lastDate) return null;

  const getStatus = () => {
    // Attempt to parse the date. Handling DD-MM-YYYY or MM/DD/YYYY or YYYY-MM-DD
    // If it's something like "24-05-2026", JS Date.parse might fail or give wrong results depending on format
    // A simple parsing mechanism:
    let parsedDate = Date.parse(lastDate);
    
    // If it fails to parse standard formats, try to detect DD-MM-YYYY format specifically
    if (isNaN(parsedDate) && /^\d{2}-\d{2}-\d{4}$/.test(lastDate)) {
      const parts = lastDate.split('-');
      parsedDate = Date.parse(`${parts[2]}-${parts[1]}-${parts[0]}`); // YYYY-MM-DD
    }

    if (isNaN(parsedDate)) return null;

    const targetDate = new Date(parsedDate);
    // Set both to midnight for accurate day comparison
    targetDate.setHours(23, 59, 59, 999); 
    const now = new Date();
    
    const diffTime = targetDate.getTime() - now.getTime();
    
    if (diffTime < 0) {
      return 'EXPIRED';
    }
    
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 3) {
      return 'CLOSING_SOON';
    }
    
    return null;
  };

  const status = getStatus();

  if (status === 'EXPIRED') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
        <AlertCircle className="w-3 h-3 mr-1" />
        Expired
      </span>
    );
  }

  if (status === 'CLOSING_SOON') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
        <Clock className="w-3 h-3 mr-1" />
        Closing Soon
      </span>
    );
  }

  return null;
}
