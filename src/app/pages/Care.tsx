import React, { useState } from 'react';
import { Search, ChevronDown, Download } from 'lucide-react';
import { toast } from 'sonner';

const MATERIALS = [
  {
    id: 'wood',
    title: 'Wood',
    content: 'Wood is a living material that will continue to evolve over time. To ensure its longevity, avoid placing solid wood furniture in direct sunlight or near heat sources. Clean with a soft, damp cloth and wipe immediately with a dry cloth. For untreated wood, we recommend applying a suitable wood soap or oil regularly.'
  },
  {
    id: 'metal',
    title: 'Powder Coated Metal',
    content: 'Wipe with a damp cloth. Do not use abrasive cleaners or rough sponges, as they may scratch the surface. For tough stains, use a mild detergent mixed with water.'
  },
  {
    id: 'textiles',
    title: 'Textiles & Upholstery',
    content: 'Vacuum frequently on medium power. Remove non-greasy stains by carefully dabbing with a lint-free cloth or sponge wrung out in clean warm water. If necessary, clean by dabbing with soapy water or water with a little dish soap. Finally, dab the surface with clean water.'
  },
  {
    id: 'glass',
    title: 'Glass & Mirrors',
    content: 'Clean with a standard glass cleaner and a soft, lint-free cloth. Avoid using abrasive materials that could scratch the surface.'
  },
  {
    id: 'ceramics',
    title: 'Ceramics',
    content: 'Our ceramics are generally dishwasher safe, but we recommend washing delicate or unglazed pieces by hand. Avoid sudden temperature changes to prevent cracking.'
  }
];

export function Care() {
  const [activeAccordion, setActiveAccordion] = useState<string | null>('wood');
  const [query, setQuery] = useState('');

  return (
    <div className="container mx-auto px-6 py-20 min-h-screen">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <h1 className="text-4xl font-serif mb-6">Care & Maintenance</h1>
        <p className="text-[#737373]">
          Proper care ensures that your pieces will last for generations. Find detailed instructions on how to maintain different materials below.
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="relative mb-12">
          <input 
            type="text" 
            placeholder="Search for a material (e.g., Oak, Brass, Wool)..." 
            className="w-full border-b-2 border-[#2D2D2D] py-4 pl-12 text-lg focus:outline-none bg-transparent"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-[#9E9B94]" />
        </div>

        <div className="flex flex-col md:flex-row gap-16">
          {/* Left Nav */}
          <div className="hidden md:block w-48 flex-shrink-0">
            <div className="sticky top-32">
              <h3 className="text-sm font-medium tracking-widest uppercase mb-6 text-[#9E9B94]">Materials</h3>
              <ul className="space-y-4">
                {MATERIALS.map(m => (
                  <li key={`nav-${m.id}`}>
                    <button 
                      onClick={() => setActiveAccordion(m.id)}
                      className={`text-sm hover:text-[#2D2D2D] transition-colors ${activeAccordion === m.id ? 'text-[#2D2D2D] font-medium' : 'text-[#737373]'}`}
                    >
                      {m.title}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Accordions */}
          <div className="flex-1">
            <div className="border-t border-[#EAE7E0]">
              {MATERIALS.filter(m => m.title.toLowerCase().includes(query.toLowerCase()) || m.content.toLowerCase().includes(query.toLowerCase())).map((material) => (
                <div key={material.id} className="border-b border-[#EAE7E0]">
                  <button 
                    className="w-full py-6 flex justify-between items-center text-left font-serif text-2xl"
                    onClick={() => setActiveAccordion(activeAccordion === material.id ? null : material.id)}
                  >
                    {material.title}
                    <ChevronDown className={`w-6 h-6 text-[#9E9B94] transition-transform ${activeAccordion === material.id ? 'rotate-180' : ''}`} />
                  </button>
                  {activeAccordion === material.id && (
                    <div className="pb-8 text-[#737373] leading-relaxed">
                      <p>{material.content}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Download CTA */}
            <div className="mt-16 bg-[#F9F8F6] p-8 text-center border border-[#EAE7E0]">
              <h3 className="font-serif text-xl mb-4">Complete Care Guide</h3>
              <p className="text-[#737373] text-sm mb-6">Need a printable guide? Request it from customer care while the download library is prepared.</p>
              <button
                type="button"
                onClick={() => toast.info('The printable care guide is not available yet.')}
                className="inline-flex items-center gap-2 border border-[#2D2D2D] px-8 py-3 text-sm font-medium tracking-widest uppercase hover:bg-[#2D2D2D] hover:text-white transition-colors"
              >
                <Download className="w-4 h-4" /> Request PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
