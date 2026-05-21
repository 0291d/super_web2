import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { toast } from 'sonner';
import {
  deleteProfessionalInquiry,
  getProfessionalInquiries,
  getProfessionalPage,
  ProfessionalPage,
  updateProfessionalInquiry,
  updateProfessionalPage,
} from '../api/professionals';
import { PlaceholderImage } from '../components/PlaceholderImage';
import { useAuth } from '../context/AuthContext';
import { readImageFiles } from '../lib/fileImages';

const fallbackPage: ProfessionalPage = {
  eyebrow: 'Trade & Contract',
  title: 'Designed for Professionals',
  subtitle: '',
  heroImage: '',
  cards: [],
  inquiryTitle: 'Contract Project Inquiry',
  inquiryIntro: '',
  cataloguesTitle: 'Latest Professional Files',
  catalogues: [],
  servicesTitle: 'Professional Services',
  services: [],
  isPublished: true,
};

function splitLines(value: string) {
  return value.split('\n').map((item) => item.trim()).filter(Boolean);
}

export function AdminProfessionals() {
  const [page, setPage] = useState<ProfessionalPage>(fallbackPage);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { user, isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function loadData() {
    setIsLoading(true);
    try {
      const [pageData, inquiryData] = await Promise.all([
        getProfessionalPage(true),
        getProfessionalInquiries(),
      ]);
      setPage({ ...fallbackPage, ...pageData });
      setInquiries(inquiryData);
    } catch {
      toast.error('Unable to load professional admin data');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) return navigate('/login', { state: { from: location.pathname } });
    if (user.role !== 'admin') return navigate('/');
    loadData();
  }, [isAuthLoading, location.pathname, user]);

  if (isAuthLoading || !user || user.role !== 'admin') {
    return <div className="container mx-auto px-6 py-20 text-sm text-[#737373]">Checking admin access...</div>;
  }

  function updatePage<K extends keyof ProfessionalPage>(field: K, value: ProfessionalPage[K]) {
    setPage((current) => ({ ...current, [field]: value }));
  }

  function updateCard(index: number, field: string, value: any) {
    setPage((current) => ({
      ...current,
      cards: current.cards.map((card, cardIndex) => cardIndex === index ? { ...card, [field]: value } : card),
    }));
  }

  function updateCatalogue(index: number, field: string, value: any) {
    setPage((current) => ({
      ...current,
      catalogues: current.catalogues.map((catalogue, catalogueIndex) => catalogueIndex === index ? { ...catalogue, [field]: value } : catalogue),
    }));
  }

  async function handleHeroImageFile(files: FileList | null) {
    try {
      const [image] = await readImageFiles(files);
      if (image) updatePage('heroImage', image);
    } catch {
      toast.error('Unable to read image file');
    }
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    try {
      const saved = await updateProfessionalPage(page);
      setPage({ ...fallbackPage, ...saved });
      toast.success('Professionals page updated');
    } catch {
      toast.error('Unable to save professionals page');
    } finally {
      setIsSaving(false);
    }
  }

  async function setInquiryStatus(id: string, status: string) {
    try {
      await updateProfessionalInquiry(id, { status: status as any });
      await loadData();
    } catch {
      toast.error('Unable to update inquiry');
    }
  }

  async function removeInquiry(id: string) {
    if (!window.confirm('Delete this inquiry?')) return;
    try {
      await deleteProfessionalInquiry(id);
      await loadData();
      toast.success('Inquiry deleted');
    } catch {
      toast.error('Unable to delete inquiry');
    }
  }

  return (
    <div className="min-h-screen bg-[#F9F8F6] px-6 py-10">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-widest text-[#9E9B94]">Admin</p>
          <h1 className="font-serif text-4xl">Professionals Manager</h1>
        </div>

        {isLoading ? (
          <div className="text-sm text-[#737373]">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1fr_420px]">
            <form onSubmit={handleSave} className="space-y-8 border border-[#EAE7E0] bg-white p-6">
              <section>
                <h2 className="mb-4 font-serif text-2xl">Hero</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <input value={page.eyebrow} onChange={(event) => updatePage('eyebrow', event.target.value)} placeholder="Eyebrow" className="border border-[#EAE7E0] px-3 py-2" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => handleHeroImageFile(event.target.files)}
                    className="border border-[#EAE7E0] bg-white px-3 py-2 text-sm"
                  />
                  <input value={page.heroImage || ''} onChange={(event) => updatePage('heroImage', event.target.value)} placeholder="Hero image URL" className="border border-[#EAE7E0] px-3 py-2" />
                  <input value={page.title} onChange={(event) => updatePage('title', event.target.value)} placeholder="Title" className="border border-[#EAE7E0] px-3 py-2 md:col-span-2" />
                  <textarea value={page.subtitle} onChange={(event) => updatePage('subtitle', event.target.value)} placeholder="Subtitle" className="min-h-24 border border-[#EAE7E0] px-3 py-2 md:col-span-2" />
                </div>
              </section>

              <section>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-serif text-2xl">Resource Cards</h2>
                  <button type="button" onClick={() => updatePage('cards', [...page.cards, { title: '', description: '', linkLabel: 'Explore', href: '#inquiry', order: page.cards.length + 1, isActive: true }])} className="border border-[#2D2D2D] px-4 py-2 text-xs uppercase tracking-widest">
                    Add Card
                  </button>
                </div>
                <div className="space-y-4">
                  {page.cards.map((card, index) => (
                    <div key={index} className="border border-[#EAE7E0] p-4">
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <input value={card.title} onChange={(event) => updateCard(index, 'title', event.target.value)} placeholder="Title" className="border border-[#EAE7E0] px-3 py-2" />
                        <input value={card.linkLabel || ''} onChange={(event) => updateCard(index, 'linkLabel', event.target.value)} placeholder="Link label" className="border border-[#EAE7E0] px-3 py-2" />
                        <input value={card.href || ''} onChange={(event) => updateCard(index, 'href', event.target.value)} placeholder="Href" className="border border-[#EAE7E0] px-3 py-2" />
                        <input type="number" value={card.order || 0} onChange={(event) => updateCard(index, 'order', Number(event.target.value))} placeholder="Order" className="border border-[#EAE7E0] px-3 py-2" />
                        <textarea value={card.description} onChange={(event) => updateCard(index, 'description', event.target.value)} placeholder="Description" className="min-h-20 border border-[#EAE7E0] px-3 py-2 md:col-span-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="mb-4 font-serif text-2xl">Inquiry & Services</h2>
                <div className="space-y-4">
                  <input value={page.inquiryTitle} onChange={(event) => updatePage('inquiryTitle', event.target.value)} className="w-full border border-[#EAE7E0] px-3 py-2" />
                  <textarea value={page.inquiryIntro || ''} onChange={(event) => updatePage('inquiryIntro', event.target.value)} className="min-h-20 w-full border border-[#EAE7E0] px-3 py-2" />
                  <input value={page.servicesTitle || ''} onChange={(event) => updatePage('servicesTitle', event.target.value)} className="w-full border border-[#EAE7E0] px-3 py-2" />
                  <textarea value={(page.services || []).join('\n')} onChange={(event) => updatePage('services', splitLines(event.target.value))} className="min-h-28 w-full border border-[#EAE7E0] px-3 py-2" />
                </div>
              </section>

              <section>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-serif text-2xl">Catalogues</h2>
                  <button type="button" onClick={() => updatePage('catalogues', [...page.catalogues, { title: '', fileSize: '', fileUrl: '#', description: '', order: page.catalogues.length + 1, isActive: true }])} className="border border-[#2D2D2D] px-4 py-2 text-xs uppercase tracking-widest">
                    Add Catalogue
                  </button>
                </div>
                <div className="space-y-4">
                  {page.catalogues.map((catalogue, index) => (
                    <div key={index} className="border border-[#EAE7E0] p-4">
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <input value={catalogue.title} onChange={(event) => updateCatalogue(index, 'title', event.target.value)} placeholder="Title" className="border border-[#EAE7E0] px-3 py-2" />
                        <input value={catalogue.fileSize || ''} onChange={(event) => updateCatalogue(index, 'fileSize', event.target.value)} placeholder="File size" className="border border-[#EAE7E0] px-3 py-2" />
                        <input value={catalogue.fileUrl || ''} onChange={(event) => updateCatalogue(index, 'fileUrl', event.target.value)} placeholder="File URL" className="border border-[#EAE7E0] px-3 py-2" />
                        <input type="number" value={catalogue.order || 0} onChange={(event) => updateCatalogue(index, 'order', Number(event.target.value))} placeholder="Order" className="border border-[#EAE7E0] px-3 py-2" />
                        <textarea value={catalogue.description || ''} onChange={(event) => updateCatalogue(index, 'description', event.target.value)} placeholder="Description" className="min-h-20 border border-[#EAE7E0] px-3 py-2 md:col-span-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-3 text-sm">
                  <input type="checkbox" checked={Boolean(page.isPublished)} onChange={(event) => updatePage('isPublished', event.target.checked)} />
                  Published
                </label>
                <button disabled={isSaving} className="bg-[#2D2D2D] px-8 py-3 text-sm uppercase tracking-widest text-white hover:bg-black disabled:opacity-60">
                  {isSaving ? 'Saving...' : 'Save Professionals Page'}
                </button>
              </div>
            </form>

            <aside className="space-y-8">
              <div className="border border-[#EAE7E0] bg-white p-4">
                <div className="aspect-[4/3] bg-[#EAE7E0]">
                  <PlaceholderImage text="PROFESSIONALS ADMIN" src={page.heroImage} alt={page.title} />
                </div>
                <h2 className="mt-4 font-serif text-2xl">{page.title}</h2>
                <p className="mt-2 text-sm text-[#737373]">{page.subtitle}</p>
              </div>

              <div className="border border-[#EAE7E0] bg-white p-4">
                <h2 className="mb-4 font-serif text-2xl">Inquiries</h2>
                <div className="max-h-[640px] space-y-4 overflow-y-auto">
                  {inquiries.length === 0 && <p className="text-sm text-[#737373]">No inquiries yet.</p>}
                  {inquiries.map((inquiry) => (
                    <div key={inquiry.id} className="border border-[#EAE7E0] p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium">{inquiry.name}</p>
                          <p className="text-sm text-[#737373]">{inquiry.company}</p>
                          <p className="text-sm text-[#737373]">{inquiry.email}</p>
                        </div>
                        <select value={inquiry.status} onChange={(event) => setInquiryStatus(inquiry.id, event.target.value)} className="border border-[#EAE7E0] px-2 py-1 text-xs">
                          <option value="new">new</option>
                          <option value="reviewed">reviewed</option>
                          <option value="archived">archived</option>
                        </select>
                      </div>
                      <p className="mt-3 text-sm text-[#737373]">{inquiry.projectDetails}</p>
                      <button onClick={() => removeInquiry(inquiry.id)} className="mt-3 text-xs uppercase tracking-widest text-[#9E9B94] hover:text-[#2D2D2D]">
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
