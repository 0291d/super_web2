import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { PlaceholderImage } from '../components/PlaceholderImage';
import { ArrowRight, Download } from 'lucide-react';
import { createProfessionalInquiry, getProfessionalPage, ProfessionalPage } from '../api/professionals';

export function Professionals() {
  const [page, setPage] = useState<ProfessionalPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    getProfessionalPage()
      .then((data) => {
        if (isMounted) setPage(data);
      })
      .catch(() => toast.error('Unable to load professional resources'))
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleInquiry(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);

    try {
      await createProfessionalInquiry({
        name: String(formData.get('name') || ''),
        company: String(formData.get('company') || ''),
        email: String(formData.get('email') || ''),
        phone: String(formData.get('phone') || ''),
        projectType: String(formData.get('projectType') || ''),
        budget: String(formData.get('budget') || ''),
        projectDetails: String(formData.get('projectDetails') || ''),
      });
      event.currentTarget.reset();
      toast.success('Inquiry submitted');
    } catch {
      toast.error('Unable to submit inquiry');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <div className="container mx-auto px-6 py-20 text-center text-sm text-[#737373]">Loading professional resources...</div>;
  }

  if (!page) {
    return <div className="container mx-auto px-6 py-20 text-center text-sm text-[#737373]">Professional resources are unavailable.</div>;
  }

  const cards = [...(page.cards || [])].filter((card) => card.isActive !== false).sort((a, b) => (a.order || 0) - (b.order || 0));
  const catalogues = [...(page.catalogues || [])].filter((item) => item.isActive !== false).sort((a, b) => (a.order || 0) - (b.order || 0));
  const isExternalLink = (href = '') => /^https?:\/\//i.test(href);

  return (
    <div>
      <section className="relative flex h-[60vh] items-center justify-center bg-[#2D2D2D] text-white">
        <div className="absolute inset-0 z-0 opacity-40 mix-blend-overlay">
          <PlaceholderImage text="PROFESSIONALS HERO" src={page.heroImage} alt={page.title} />
        </div>
        <div className="relative z-10 max-w-2xl px-6 text-center">
          <span className="mb-4 block text-sm font-medium uppercase tracking-widest">{page.eyebrow}</span>
          <h1 className="mb-6 font-serif text-5xl">{page.title}</h1>
          <p className="text-lg leading-relaxed text-[#DCD5C6]">{page.subtitle}</p>
        </div>
      </section>

      <section className="bg-[#F9F8F6] py-20">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => {
              const href = card.href || '#inquiry';
              const isExternal = isExternalLink(href);
              return (
                <a
                  key={card.title}
                  href={href}
                  target={isExternal ? '_blank' : undefined}
                  rel={isExternal ? 'noreferrer' : undefined}
                  className="group flex h-full cursor-pointer flex-col border border-[#EAE7E0] bg-white p-10 transition-colors hover:border-[#2D2D2D]"
                >
                  <h3 className="mb-4 font-serif text-2xl">{card.title}</h3>
                  <p className="mb-8 text-[#737373]">{card.description}</p>
                  <span className="mt-auto flex items-center gap-2 text-sm font-medium uppercase tracking-widest text-[#9E9B94] transition-colors group-hover:text-[#2D2D2D]">
                    {card.linkLabel || 'Explore'} <ArrowRight className="h-4 w-4" />
                  </span>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20" id="inquiry">
        <div className="container mx-auto max-w-6xl px-6">
          <div className="flex flex-col gap-16 lg:flex-row">
            <div className="lg:w-1/2">
              <h2 className="mb-4 font-serif text-3xl">{page.inquiryTitle}</h2>
              {page.inquiryIntro && <p className="mb-8 text-[#737373]">{page.inquiryIntro}</p>}
              <form className="space-y-6" onSubmit={handleInquiry}>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-[#737373]">Name</label>
                    <input name="name" required className="w-full border border-[#EAE7E0] bg-[#F9F8F6] p-3 focus:border-[#2D2D2D] focus:outline-none" />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-[#737373]">Company</label>
                    <input name="company" className="w-full border border-[#EAE7E0] bg-[#F9F8F6] p-3 focus:border-[#2D2D2D] focus:outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-[#737373]">Email</label>
                    <input name="email" type="email" required className="w-full border border-[#EAE7E0] bg-[#F9F8F6] p-3 focus:border-[#2D2D2D] focus:outline-none" />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-[#737373]">Phone</label>
                    <input name="phone" className="w-full border border-[#EAE7E0] bg-[#F9F8F6] p-3 focus:border-[#2D2D2D] focus:outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-[#737373]">Project Type</label>
                    <input name="projectType" className="w-full border border-[#EAE7E0] bg-[#F9F8F6] p-3 focus:border-[#2D2D2D] focus:outline-none" />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-[#737373]">Budget</label>
                    <input name="budget" className="w-full border border-[#EAE7E0] bg-[#F9F8F6] p-3 focus:border-[#2D2D2D] focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-[#737373]">Project Details</label>
                  <textarea name="projectDetails" rows={5} required className="w-full border border-[#EAE7E0] bg-[#F9F8F6] p-3 focus:border-[#2D2D2D] focus:outline-none" />
                </div>
                <button disabled={isSubmitting} className="bg-[#2D2D2D] px-8 py-4 text-sm font-medium uppercase tracking-widest text-white transition-colors hover:bg-black disabled:opacity-60">
                  {isSubmitting ? 'Submitting...' : 'Submit Inquiry'}
                </button>
              </form>
            </div>

            <div className="lg:w-1/2" id="catalogues">
              <h2 className="mb-8 font-serif text-3xl">{page.cataloguesTitle}</h2>
              <div className="space-y-8">
                {catalogues.map((catalogue) => (
                  <button
                    key={catalogue.title}
                    type="button"
                    onClick={() => {
                      if (!catalogue.fileUrl || catalogue.fileUrl.startsWith('/downloads/')) {
                        toast.info('This catalogue file is being prepared and is not available yet.');
                        return;
                      }
                      window.open(catalogue.fileUrl, '_blank', 'noopener,noreferrer');
                    }}
                    className="group flex w-full cursor-pointer items-center justify-between border-b border-[#EAE7E0] pb-6 text-left"
                  >
                    <div>
                      <h4 className="mb-1 font-serif text-lg transition-colors group-hover:text-[#737373]">{catalogue.title}</h4>
                      {catalogue.description && <p className="mb-2 text-sm text-[#737373]">{catalogue.description}</p>}
                      <span className="text-xs uppercase tracking-widest text-[#9E9B94]">PDF • {catalogue.fileSize}</span>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#EAE7E0] transition-colors group-hover:bg-[#EAE7E0]">
                      <Download className="h-4 w-4 text-[#2D2D2D]" />
                    </div>
                  </button>
                ))}
              </div>

              {page.services?.length ? (
                <div className="mt-16 border border-[#EAE7E0] bg-[#F9F8F6] p-8">
                  <h3 className="mb-6 font-serif text-2xl">{page.servicesTitle}</h3>
                  <ul className="space-y-3 text-sm text-[#737373]">
                    {page.services.map((service) => <li key={service}>- {service}</li>)}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
