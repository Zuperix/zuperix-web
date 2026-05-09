import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import { ShieldCheckIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function TermsOfServicePage() {
  const filePath = path.join(process.cwd(), 'TERMS_OF_SERVICE.md');
  const content = fs.readFileSync(filePath, 'utf8');

  const lines = content.split('\n');

  return (
    <div className="min-h-screen bg-[#0f111a] text-gray-300 selection:bg-blue-500/30 font-sans">
      <main className="max-w-4xl mx-auto pt-12 pb-12 px-6">
        <div className="bg-gray-900/20 border border-gray-800/40 rounded-[2rem] p-8 md:p-12 shadow-2xl relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px] -z-10" />
          
          <div className="prose prose-invert prose-blue max-w-none">
            {lines.map((line, index) => {
              // Simple check for titles/headers based on the first few lines
              if (index === 0) return <h1 key={index} className="text-4xl font-black text-white mb-2 !leading-tight tracking-tight">{line}</h1>;
              if (index === 1) return <p key={index} className="text-gray-500 font-bold mb-12 uppercase tracking-widest text-xs">{line}</p>;
              
              // Detect section headers (e.g. "1. Acceptance...")
              const sectionMatch = line.match(/^(\d+\.)\s+(.+)/);
              if (sectionMatch) {
                return (
                  <h2 key={index} className="text-xl font-bold text-white mt-12 mb-6 flex items-center gap-3">
                    <span className="text-blue-500">{sectionMatch[1]}</span>
                    {sectionMatch[2]}
                  </h2>
                );
              }

              // Normal text line
              return (
                <p key={index} className="mb-6 text-gray-400 leading-relaxed text-sm whitespace-pre-wrap">
                  {line}
                </p>
              );
            })}
          </div>

        </div>
      </main>
    </div>
  );
}
