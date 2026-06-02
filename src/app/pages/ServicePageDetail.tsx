import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { ChevronDown, Download } from 'lucide-react';
import { toast } from 'sonner';
import { getServicePage, ServicePage } from '../api/servicePages';
import { PlaceholderImage } from '../components/PlaceholderImage';

const faqAnswers: Record<string, string> = {
  'Can I change my order?':
    'If your order has not been packed or dispatched yet, contact customer care with your order number and the change you need. We will confirm whether the update is still possible.',
  'Can I cancel before dispatch?':
    'Yes, demo orders can be cancelled before dispatch. Once an order has shipped, please follow the return process instead.',
  'Where is my order confirmation?':
    'Order confirmations are sent to the email used at checkout. If you do not see it within a few minutes, check your spam folder or contact support with the checkout email.',
  'Where can I find dimensions?':
    'Dimensions are listed on each product detail page together with material notes, weight, care guidance, and stock information when available.',
  'Are products suitable for contract use?':
    'Selected products may be suitable for contract or professional projects. Use the Professionals page to request specifications, pricing, and project support.',
  'How do I request spare parts?':
    'Contact customer care with the product name, item number if available, and photos of the part you need. The team will confirm availability and next steps.',
  'How do I reset my password?':
    'Password reset is not connected to an email flow in this local demo. For testing, create a new customer account or ask an admin to help manage access.',
  'How do I update my details?':
    'Customer profile editing is limited in this demo. Use the account details entered during registration, or create a fresh account for a different test profile.',
  'How do admins access the dashboard?':
    'Admins sign in through the normal Login page. After a successful admin login, the app redirects to the admin dashboard.',
};

export function ServicePageDetail() {
  const { slug } = useParams();
  const [page, setPage] = useState<ServicePage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState('');

  useEffect(() => {
    if (!slug) return;
    let isMounted = true;
    setIsLoading(true);

    getServicePage(slug)
      .then((data) => {
        if (isMounted) setPage(data);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  if (isLoading) {
    return <div className="container mx-auto px-6 py-20 text-center text-sm text-[#737373]">Loading page...</div>;
  }

  if (!page) {
    return <div className="container mx-auto px-6 py-20 text-center text-sm text-[#737373]">Page not found.</div>;
  }

  const isFaqPage = page.slug === 'faq';
  const pendingDownload = page.ctaHref?.startsWith('/downloads/');

  return (
    <div className="min-h-screen bg-[#F9F8F6]">
      {page.heroImage && (
        <section className="h-[42vh] bg-[#EAE7E0]">
          <PlaceholderImage text={page.title} src={page.heroImage} alt={page.title} />
        </section>
      )}
      <section className="container mx-auto max-w-4xl px-6 py-20">
        <div className="mb-14 text-center">
          <p className="mb-4 text-xs uppercase tracking-widest text-[#9E9B94]">{page.category}</p>
          <h1 className="mb-6 font-serif text-5xl">{page.title}</h1>
          {page.excerpt && <p className="mx-auto max-w-2xl text-lg leading-relaxed text-[#737373]">{page.excerpt}</p>}
        </div>

        {isFaqPage ? (
          <div className="space-y-12 border-t border-[#EAE7E0]">
            {page.sections?.map((section, index) => (
              <section key={`${section.title}-${index}`} className="border-b border-[#EAE7E0] py-10">
                {section.title && <h2 className="mb-6 font-serif text-3xl">{section.title}</h2>}
                <div className="divide-y divide-[#EAE7E0] border-t border-[#EAE7E0]">
                  {(section.items || []).map((item) => {
                    const faqId = `${section.title}-${item}`;
                    const isOpen = openFaq === faqId;

                    return (
                      <div key={faqId}>
                        <button
                          type="button"
                          onClick={() => setOpenFaq(isOpen ? '' : faqId)}
                          className="flex w-full items-center justify-between gap-6 py-5 text-left"
                          aria-expanded={isOpen}
                        >
                          <span className="font-serif text-xl text-[#2D2D2D]">{item}</span>
                          <ChevronDown className={`h-5 w-5 flex-shrink-0 text-[#9E9B94] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isOpen && (
                          <div className="pb-6 pr-10 leading-relaxed text-[#737373]">
                            {faqAnswers[item] || section.body}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="space-y-10 border-t border-[#EAE7E0]">
            {page.sections?.map((section, index) => (
              <section key={`${section.title}-${index}`} className="border-b border-[#EAE7E0] py-10">
                {section.title && <h2 className="mb-4 font-serif text-3xl">{section.title}</h2>}
                {section.body && <p className="leading-relaxed text-[#737373]">{section.body}</p>}
                {section.items?.length ? (
                  <ul className="mt-6 space-y-3 text-[#737373]">
                    {section.items.map((item) => <li key={item}>- {item}</li>)}
                  </ul>
                ) : null}
              </section>
            ))}
          </div>
        )}

        {page.ctaLabel && page.ctaHref && (
          <div className="mt-14 text-center">
            {pendingDownload ? (
              <button
                type="button"
                onClick={() => toast.info('This download is being prepared and is not available yet.')}
                className="inline-flex items-center gap-2 border border-[#2D2D2D] px-8 py-3 text-sm font-medium uppercase tracking-widest hover:bg-[#2D2D2D] hover:text-white"
              >
                <Download className="h-4 w-4" /> Request Download
              </button>
            ) : (
              <a href={page.ctaHref} className="inline-flex items-center gap-2 border border-[#2D2D2D] px-8 py-3 text-sm font-medium uppercase tracking-widest hover:bg-[#2D2D2D] hover:text-white">
                <Download className="h-4 w-4" /> {page.ctaLabel}
              </a>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
