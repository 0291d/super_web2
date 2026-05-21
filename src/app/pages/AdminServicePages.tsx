import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { createServicePage, deleteServicePage, getServicePages, ServicePage, updateServicePage } from '../api/servicePages';
import { useAuth } from '../context/AuthContext';
import { readImageFiles } from '../lib/fileImages';

const emptyPage: ServicePage = {
  id: '',
  title: '',
  slug: '',
  category: 'Customer Service',
  excerpt: '',
  heroImage: '',
  sections: [{ title: '', body: '', items: [] }],
  ctaLabel: '',
  ctaHref: '',
  order: 0,
  isPublished: true,
};

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function splitLines(value: string) {
  return value.split('\n').map((item) => item.trim()).filter(Boolean);
}

function pageToForm(page: ServicePage): ServicePage {
  return {
    ...emptyPage,
    ...page,
    slug: page.slug || slugify(page.title),
    sections: page.sections?.length ? page.sections : emptyPage.sections,
  };
}

export function AdminServicePages() {
  const [pages, setPages] = useState<ServicePage[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [form, setForm] = useState<ServicePage>(emptyPage);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { user, isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const filteredPages = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return pages;
    return pages.filter((page) => [page.title, page.slug, page.category].some((value) => value?.toLowerCase().includes(query)));
  }, [pages, search]);

  async function loadPages() {
    setIsLoading(true);
    try {
      const data = await getServicePages(true);
      setPages(data);
      if (!selectedId && data[0]) {
        setSelectedId(data[0].id);
        setForm(pageToForm(data[0]));
      }
    } catch {
      toast.error('Unable to load service pages');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) return navigate('/login', { state: { from: location.pathname } });
    if (user.role !== 'admin') return navigate('/');
    loadPages();
  }, [isAuthLoading, location.pathname, user]);

  if (isAuthLoading || !user || user.role !== 'admin') {
    return <div className="container mx-auto px-6 py-20 text-sm text-[#737373]">Checking admin access...</div>;
  }

  function updateField<K extends keyof ServicePage>(field: K, value: ServicePage[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateSection(index: number, field: 'title' | 'body' | 'items', value: any) {
    setForm((current) => ({
      ...current,
      sections: (current.sections || []).map((section, sectionIndex) =>
        sectionIndex === index ? { ...section, [field]: value } : section,
      ),
    }));
  }

  function addSection() {
    setForm((current) => ({
      ...current,
      sections: [...(current.sections || []), { title: '', body: '', items: [] }],
    }));
  }

  function removeSection(index: number) {
    setForm((current) => ({
      ...current,
      sections: (current.sections || []).filter((_, sectionIndex) => sectionIndex !== index),
    }));
  }

  async function handleHeroImageFile(files: FileList | null) {
    try {
      const [image] = await readImageFiles(files);
      if (image) updateField('heroImage', image);
    } catch {
      toast.error('Unable to read image file');
    }
  }

  function newPage() {
    const id = `service_${Date.now().toString().slice(-6)}`;
    setSelectedId('');
    setForm({ ...emptyPage, id });
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    const payload = {
      ...form,
      slug: form.slug || slugify(form.title),
      sections: (form.sections || []).filter((section) => section.title || section.body || section.items?.length),
    };

    try {
      const saved = selectedId ? await updateServicePage(selectedId, payload) : await createServicePage(payload);
      toast.success(selectedId ? 'Service page updated' : 'Service page created');
      await loadPages();
      setSelectedId(saved.id);
      setForm(pageToForm(saved));
    } catch {
      toast.error('Unable to save service page');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!selectedId) return;
    if (!window.confirm(`Delete ${form.title}?`)) return;
    try {
      await deleteServicePage(selectedId);
      toast.success('Service page deleted');
      setSelectedId('');
      setForm(emptyPage);
      await loadPages();
    } catch {
      toast.error('Unable to delete service page');
    }
  }

  return (
    <div className="min-h-screen bg-[#F9F8F6] px-6 py-10">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#9E9B94]">Admin</p>
            <h1 className="font-serif text-4xl">Customer Service Pages</h1>
          </div>
          <button onClick={newPage} className="bg-[#2D2D2D] px-6 py-3 text-sm uppercase tracking-widest text-white hover:bg-black">
            New Page
          </button>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[330px_1fr]">
          <aside className="border border-[#EAE7E0] bg-white">
            <div className="border-b border-[#EAE7E0] p-4">
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search pages" className="w-full border border-[#EAE7E0] px-3 py-2 text-sm" />
            </div>
            <div className="max-h-[760px] overflow-y-auto">
              {isLoading && <div className="p-6 text-sm text-[#737373]">Loading...</div>}
              {!isLoading && filteredPages.map((page) => (
                <button
                  key={page.id}
                  onClick={() => {
                    setSelectedId(page.id);
                    setForm(pageToForm(page));
                  }}
                  className={`block w-full border-b border-[#EAE7E0] p-4 text-left hover:bg-[#F9F8F6] ${selectedId === page.id ? 'bg-[#F3F1EC]' : 'bg-white'}`}
                >
                  <p className="font-medium">{page.title}</p>
                  <p className="text-xs text-[#737373]">{page.category}</p>
                  <p className="text-xs text-[#9E9B94]">/service/{page.slug}</p>
                </button>
              ))}
            </div>
          </aside>

          <form onSubmit={handleSave} className="space-y-8 border border-[#EAE7E0] bg-white p-6">
            <section>
              <h2 className="mb-4 font-serif text-2xl">Page Info</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <input value={form.id} onChange={(event) => updateField('id', event.target.value)} placeholder="ID" className="border border-[#EAE7E0] px-3 py-2" required />
                <input value={form.slug} onChange={(event) => updateField('slug', event.target.value)} placeholder="Slug" className="border border-[#EAE7E0] px-3 py-2" />
                <input value={form.title} onChange={(event) => updateField('title', event.target.value)} placeholder="Title" className="border border-[#EAE7E0] px-3 py-2" required />
                <select value={form.category} onChange={(event) => updateField('category', event.target.value)} className="border border-[#EAE7E0] px-3 py-2">
                  <option>Customer Service</option>
                  <option>Legal</option>
                </select>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => handleHeroImageFile(event.target.files)}
                  className="border border-[#EAE7E0] bg-white px-3 py-2 text-sm md:col-span-2"
                />
                <input value={form.heroImage || ''} onChange={(event) => updateField('heroImage', event.target.value)} placeholder="Hero image URL" className="border border-[#EAE7E0] px-3 py-2 md:col-span-2" />
                <textarea value={form.excerpt || ''} onChange={(event) => updateField('excerpt', event.target.value)} placeholder="Excerpt" className="min-h-24 border border-[#EAE7E0] px-3 py-2 md:col-span-2" />
              </div>
            </section>

            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-serif text-2xl">Sections</h2>
                <button type="button" onClick={addSection} className="border border-[#2D2D2D] px-4 py-2 text-xs uppercase tracking-widest">
                  Add Section
                </button>
              </div>
              <div className="space-y-4">
                {(form.sections || []).map((section, index) => (
                  <div key={index} className="border border-[#EAE7E0] p-4">
                    <div className="mb-3 flex justify-between">
                      <h3 className="font-serif text-xl">Section {index + 1}</h3>
                      <button type="button" onClick={() => removeSection(index)} className="text-xs uppercase tracking-widest text-[#9E9B94]">Remove</button>
                    </div>
                    <input value={section.title || ''} onChange={(event) => updateSection(index, 'title', event.target.value)} placeholder="Section title" className="mb-3 w-full border border-[#EAE7E0] px-3 py-2" />
                    <textarea value={section.body || ''} onChange={(event) => updateSection(index, 'body', event.target.value)} placeholder="Body" className="mb-3 min-h-24 w-full border border-[#EAE7E0] px-3 py-2" />
                    <textarea value={(section.items || []).join('\n')} onChange={(event) => updateSection(index, 'items', splitLines(event.target.value))} placeholder="Items, one per line" className="min-h-20 w-full border border-[#EAE7E0] px-3 py-2" />
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="mb-4 font-serif text-2xl">CTA</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <input value={form.ctaLabel || ''} onChange={(event) => updateField('ctaLabel', event.target.value)} placeholder="CTA label" className="border border-[#EAE7E0] px-3 py-2" />
                <input value={form.ctaHref || ''} onChange={(event) => updateField('ctaHref', event.target.value)} placeholder="CTA href" className="border border-[#EAE7E0] px-3 py-2" />
                <input type="number" value={form.order || 0} onChange={(event) => updateField('order', Number(event.target.value))} placeholder="Order" className="border border-[#EAE7E0] px-3 py-2" />
              </div>
            </section>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-3 text-sm">
                <input type="checkbox" checked={Boolean(form.isPublished)} onChange={(event) => updateField('isPublished', event.target.checked)} />
                Published
              </label>
              <div className="flex gap-3">
                {selectedId && <button type="button" onClick={handleDelete} className="border border-[#2D2D2D] px-6 py-3 text-sm uppercase tracking-widest hover:bg-[#2D2D2D] hover:text-white">Delete</button>}
                <button disabled={isSaving} className="bg-[#2D2D2D] px-8 py-3 text-sm uppercase tracking-widest text-white hover:bg-black disabled:opacity-60">
                  {isSaving ? 'Saving...' : 'Save Page'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
