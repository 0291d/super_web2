import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { createStory, deleteStory, getStories, Story, updateStory } from '../api/stories';
import { PlaceholderImage } from '../components/PlaceholderImage';
import { useAuth } from '../context/AuthContext';
import { inspireCategories } from '../data/inspireCategories';
import { readImageFiles } from '../lib/fileImages';

const emptyStory: Story = {
  id: '',
  title: '',
  slug: '',
  category: 'Interior Design',
  excerpt: '',
  heroImage: '',
  images: [''],
  author: 'ferm LIVING Studio',
  publishedAt: new Date().toISOString().slice(0, 10),
  readTime: '5 min read',
  isFeatured: false,
  isPublished: true,
  tags: [],
  sections: [
    { heading: 'The Starting Point', body: '', image: '' },
    { heading: 'Material Direction', body: '', image: '' },
  ],
  quote: '',
  relatedProductIds: [],
  sourceUrl: '',
  seoTitle: '',
  seoDescription: '',
};

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function splitLines(value: string) {
  return value.split('\n').map((item) => item.trim()).filter(Boolean);
}

function splitCsv(value: string) {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

function joinCsv(value?: string[]) {
  return value?.join(', ') || '';
}

function storyToForm(story: Story): Story {
  return {
    ...emptyStory,
    ...story,
    slug: story.slug || slugify(story.title),
    heroImage: story.heroImage || story.images?.[0] || '',
    images: story.images?.length ? story.images : [story.heroImage || ''],
    sections: story.sections?.length ? story.sections : emptyStory.sections,
    publishedAt: story.publishedAt ? story.publishedAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
  };
}

export function AdminStories() {
  const [stories, setStories] = useState<Story[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [form, setForm] = useState<Story>(emptyStory);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { user, isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const filteredStories = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return stories;
    return stories.filter((story) =>
      [story.title, story.category, story.slug].some((value) => value?.toLowerCase().includes(query)),
    );
  }, [stories, search]);

  async function loadStories() {
    setIsLoading(true);
    try {
      const data = await getStories({ includeDrafts: 'true' });
      setStories(data);
      if (!selectedId && data[0]) {
        setSelectedId(data[0].id);
        setForm(storyToForm(data[0]));
      }
    } catch {
      toast.error('Unable to load stories');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) return navigate('/login', { state: { from: location.pathname } });
    if (user.role !== 'admin') return navigate('/');
    loadStories();
  }, [isAuthLoading, location.pathname, user]);

  if (isAuthLoading || !user || user.role !== 'admin') {
    return <div className="container mx-auto px-6 py-20 text-sm text-[#737373]">Checking admin access...</div>;
  }

  function updateField<K extends keyof Story>(field: K, value: Story[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateSection(index: number, field: 'heading' | 'body' | 'image', value: string) {
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
      sections: [...(current.sections || []), { heading: '', body: '', image: '' }],
    }));
  }

  function removeSection(index: number) {
    setForm((current) => ({
      ...current,
      sections: (current.sections || []).filter((_, sectionIndex) => sectionIndex !== index),
    }));
  }

  async function handleStoryImageFiles(files: FileList | null) {
    try {
      const uploadedImages = await readImageFiles(files);
      if (!uploadedImages.length) return;
      const images = [...uploadedImages, ...(form.images || []).filter(Boolean)];
      updateField('images', images);
      updateField('heroImage', images[0]);
    } catch {
      toast.error('Unable to read image file');
    }
  }

  async function handleSectionImageFile(index: number, files: FileList | null) {
    try {
      const [image] = await readImageFiles(files);
      if (image) updateSection(index, 'image', image);
    } catch {
      toast.error('Unable to read image file');
    }
  }

  function newStory() {
    const id = `story_${Date.now().toString().slice(-6)}`;
    setSelectedId('');
    setForm({ ...emptyStory, id, slug: '' });
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setIsSaving(true);

    const images = form.images?.filter(Boolean) || [];
    const payload: Story = {
      ...form,
      slug: form.slug || slugify(form.title),
      heroImage: form.heroImage || images[0] || '',
      images,
      publishedAt: form.publishedAt ? new Date(form.publishedAt).toISOString() : new Date().toISOString(),
      sections: (form.sections || []).filter((section) => section.heading || section.body || section.image),
    };

    try {
      const saved = selectedId ? await updateStory(selectedId, payload) : await createStory(payload);
      toast.success(selectedId ? 'Story updated' : 'Story created');
      await loadStories();
      setSelectedId(saved.id);
      setForm(storyToForm(saved));
    } catch {
      toast.error('Unable to save story');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!selectedId) return;
    const confirmed = window.confirm(`Delete ${form.title}?`);
    if (!confirmed) return;

    try {
      await deleteStory(selectedId);
      toast.success('Story deleted');
      setSelectedId('');
      setForm(emptyStory);
      await loadStories();
    } catch {
      toast.error('Unable to delete story');
    }
  }

  return (
    <div className="min-h-screen bg-[#F9F8F6] px-6 py-10">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#9E9B94]">Admin</p>
            <h1 className="font-serif text-4xl">Inspire Manager</h1>
          </div>
          <button onClick={newStory} className="w-fit bg-[#2D2D2D] px-6 py-3 text-sm uppercase tracking-widest text-white hover:bg-black">
            New Story
          </button>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[360px_1fr]">
          <aside className="border border-[#EAE7E0] bg-white">
            <div className="border-b border-[#EAE7E0] p-4">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search stories"
                className="w-full border border-[#EAE7E0] bg-transparent px-3 py-2 text-sm outline-none focus:border-[#2D2D2D]"
              />
            </div>
            <div className="max-h-[780px] overflow-y-auto">
              {isLoading && <div className="p-6 text-sm text-[#737373]">Loading stories...</div>}
              {!isLoading && filteredStories.map((story) => (
                <button
                  key={story.id}
                  onClick={() => {
                    setSelectedId(story.id);
                    setForm(storyToForm(story));
                  }}
                  className={`flex w-full gap-4 border-b border-[#EAE7E0] p-4 text-left hover:bg-[#F9F8F6] ${
                    selectedId === story.id ? 'bg-[#F3F1EC]' : 'bg-white'
                  }`}
                >
                  <div className="h-20 w-24 shrink-0 bg-[#EAE7E0]">
                    <PlaceholderImage text={`ADMIN STORY ${story.id}`} src={story.heroImage || story.images?.[0]} alt={story.title} />
                  </div>
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-sm font-medium">{story.title}</p>
                    <p className="mt-1 text-xs text-[#737373]">{story.category}</p>
                    <p className="text-xs text-[#9E9B94]">{story.isPublished ? 'Published' : 'Draft'}</p>
                  </div>
                </button>
              ))}
            </div>
          </aside>

          <form onSubmit={handleSave} className="border border-[#EAE7E0] bg-white p-6">
            <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1fr_340px]">
              <div className="space-y-8">
                <section>
                  <h2 className="mb-4 font-serif text-2xl">Story Information</h2>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <label>
                      <span className="mb-2 block text-xs uppercase tracking-widest text-[#737373]">ID</span>
                      <input value={form.id} onChange={(event) => updateField('id', event.target.value)} className="w-full border border-[#EAE7E0] px-3 py-2" required />
                    </label>
                    <label>
                      <span className="mb-2 block text-xs uppercase tracking-widest text-[#737373]">Slug</span>
                      <input value={form.slug} onChange={(event) => updateField('slug', event.target.value)} className="w-full border border-[#EAE7E0] px-3 py-2" />
                    </label>
                    <label className="md:col-span-2">
                      <span className="mb-2 block text-xs uppercase tracking-widest text-[#737373]">Title</span>
                      <input value={form.title} onChange={(event) => updateField('title', event.target.value)} className="w-full border border-[#EAE7E0] px-3 py-2" required />
                    </label>
                    <label>
                      <span className="mb-2 block text-xs uppercase tracking-widest text-[#737373]">Category</span>
                      <select value={form.category} onChange={(event) => updateField('category', event.target.value)} className="w-full border border-[#EAE7E0] px-3 py-2">
                        {inspireCategories.map((item) => <option key={item}>{item}</option>)}
                      </select>
                    </label>
                    <label>
                      <span className="mb-2 block text-xs uppercase tracking-widest text-[#737373]">Published At</span>
                      <input type="date" value={form.publishedAt || ''} onChange={(event) => updateField('publishedAt', event.target.value)} className="w-full border border-[#EAE7E0] px-3 py-2" />
                    </label>
                    <label>
                      <span className="mb-2 block text-xs uppercase tracking-widest text-[#737373]">Author</span>
                      <input value={form.author || ''} onChange={(event) => updateField('author', event.target.value)} className="w-full border border-[#EAE7E0] px-3 py-2" />
                    </label>
                    <label>
                      <span className="mb-2 block text-xs uppercase tracking-widest text-[#737373]">Read Time</span>
                      <input value={form.readTime || ''} onChange={(event) => updateField('readTime', event.target.value)} className="w-full border border-[#EAE7E0] px-3 py-2" />
                    </label>
                  </div>
                </section>

                <section>
                  <h2 className="mb-4 font-serif text-2xl">Content</h2>
                  <div className="space-y-4">
                    <label className="block">
                      <span className="mb-2 block text-xs uppercase tracking-widest text-[#737373]">Excerpt</span>
                      <textarea value={form.excerpt} onChange={(event) => updateField('excerpt', event.target.value)} className="min-h-24 w-full border border-[#EAE7E0] px-3 py-2" required />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-xs uppercase tracking-widest text-[#737373]">Quote</span>
                      <textarea value={form.quote || ''} onChange={(event) => updateField('quote', event.target.value)} className="min-h-20 w-full border border-[#EAE7E0] px-3 py-2" />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-xs uppercase tracking-widest text-[#737373]">Choose story image files</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(event) => handleStoryImageFiles(event.target.files)}
                        className="mb-4 w-full border border-[#EAE7E0] bg-white px-3 py-2 text-sm"
                      />
                      <span className="mb-2 block text-xs uppercase tracking-widest text-[#737373]">Image URLs or uploaded data, one per line</span>
                      <textarea
                        value={(form.images || []).join('\n')}
                        onChange={(event) => {
                          const images = splitLines(event.target.value);
                          updateField('images', images);
                          updateField('heroImage', images[0] || '');
                        }}
                        className="min-h-28 w-full border border-[#EAE7E0] px-3 py-2 font-mono text-sm"
                      />
                    </label>
                  </div>
                </section>

                <section>
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="font-serif text-2xl">Sections</h2>
                    <button type="button" onClick={addSection} className="border border-[#2D2D2D] px-4 py-2 text-xs uppercase tracking-widest hover:bg-[#2D2D2D] hover:text-white">
                      Add Section
                    </button>
                  </div>
                  <div className="space-y-6">
                    {(form.sections || []).map((section, index) => (
                      <div key={index} className="border border-[#EAE7E0] p-4">
                        <div className="mb-4 flex items-center justify-between">
                          <h3 className="font-serif text-xl">Section {index + 1}</h3>
                          <button type="button" onClick={() => removeSection(index)} className="text-xs uppercase tracking-widest text-[#9E9B94] hover:text-[#2D2D2D]">
                            Remove
                          </button>
                        </div>
                        <div className="space-y-4">
                          <input value={section.heading || ''} onChange={(event) => updateSection(index, 'heading', event.target.value)} placeholder="Heading" className="w-full border border-[#EAE7E0] px-3 py-2" />
                          <textarea value={section.body || ''} onChange={(event) => updateSection(index, 'body', event.target.value)} placeholder="Body" className="min-h-28 w-full border border-[#EAE7E0] px-3 py-2" />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(event) => handleSectionImageFile(index, event.target.files)}
                            className="w-full border border-[#EAE7E0] bg-white px-3 py-2 text-sm"
                          />
                          <input value={section.image || ''} onChange={(event) => updateSection(index, 'image', event.target.value)} placeholder="Image URL" className="w-full border border-[#EAE7E0] px-3 py-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <h2 className="mb-4 font-serif text-2xl">Metadata</h2>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <label>
                      <span className="mb-2 block text-xs uppercase tracking-widest text-[#737373]">Tags</span>
                      <input value={joinCsv(form.tags)} onChange={(event) => updateField('tags', splitCsv(event.target.value))} className="w-full border border-[#EAE7E0] px-3 py-2" />
                    </label>
                    <label>
                      <span className="mb-2 block text-xs uppercase tracking-widest text-[#737373]">Related Product IDs</span>
                      <input value={joinCsv(form.relatedProductIds)} onChange={(event) => updateField('relatedProductIds', splitCsv(event.target.value))} className="w-full border border-[#EAE7E0] px-3 py-2" />
                    </label>
                    <label className="md:col-span-2">
                      <span className="mb-2 block text-xs uppercase tracking-widest text-[#737373]">Read More / Ferm Living URL</span>
                      <input value={form.sourceUrl || ''} onChange={(event) => updateField('sourceUrl', event.target.value)} className="w-full border border-[#EAE7E0] px-3 py-2" />
                    </label>
                    <label>
                      <span className="mb-2 block text-xs uppercase tracking-widest text-[#737373]">SEO Title</span>
                      <input value={form.seoTitle || ''} onChange={(event) => updateField('seoTitle', event.target.value)} className="w-full border border-[#EAE7E0] px-3 py-2" />
                    </label>
                    <label>
                      <span className="mb-2 block text-xs uppercase tracking-widest text-[#737373]">SEO Description</span>
                      <input value={form.seoDescription || ''} onChange={(event) => updateField('seoDescription', event.target.value)} className="w-full border border-[#EAE7E0] px-3 py-2" />
                    </label>
                  </div>
                </section>
              </div>

              <aside className="space-y-6">
                <div className="border border-[#EAE7E0] bg-[#F9F8F6] p-4">
                  <div className="aspect-[4/5] bg-[#EAE7E0]">
                    <PlaceholderImage text="STORY PREVIEW" src={form.heroImage || form.images?.[0]} alt={form.title || 'Story preview'} />
                  </div>
                  <p className="mt-4 font-serif text-2xl">{form.title || 'New Story'}</p>
                  <p className="mt-1 text-sm text-[#737373]">{form.category}</p>
                </div>
                <div className="border border-[#EAE7E0] p-4">
                  <h3 className="mb-4 font-serif text-xl">Status</h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 text-sm">
                      <input type="checkbox" checked={Boolean(form.isFeatured)} onChange={(event) => updateField('isFeatured', event.target.checked)} />
                      Featured
                    </label>
                    <label className="flex items-center gap-3 text-sm">
                      <input type="checkbox" checked={Boolean(form.isPublished)} onChange={(event) => updateField('isPublished', event.target.checked)} />
                      Published
                    </label>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button disabled={isSaving} type="submit" className="flex-1 bg-[#2D2D2D] px-6 py-3 text-sm uppercase tracking-widest text-white hover:bg-black disabled:opacity-50">
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                  {selectedId && (
                    <button type="button" onClick={handleDelete} className="border border-[#2D2D2D] px-6 py-3 text-sm uppercase tracking-widest hover:bg-[#2D2D2D] hover:text-white">
                      Delete
                    </button>
                  )}
                </div>
              </aside>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
