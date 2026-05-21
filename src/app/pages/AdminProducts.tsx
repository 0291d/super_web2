import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { createProduct, deleteProduct, getProducts, ProductDetail, updateProduct } from '../api/products';
import { PlaceholderImage } from '../components/PlaceholderImage';
import { useAuth } from '../context/AuthContext';
import { shopMenu } from '../data/shopMenu';
import { roomOptions } from '../data/rooms';
import { readImageFiles } from '../lib/fileImages';

const emptyProduct: ProductDetail = {
  id: '',
  name: '',
  slug: '',
  category: 'Furniture',
  subcategory: 'Lounge Chairs',
  room: ['Living Room'],
  price: 0,
  currency: 'EUR',
  description: '',
  shortDescription: '',
  images: [''],
  sizes: ['One Size'],
  materials: ['Oak'],
  stock: 0,
  isNew: false,
  isCertified: false,
  isFeatured: false,
  isPopular: false,
  badge: '',
  details: {
    itemNumber: '',
    size: '',
    weight: '',
    material: '',
    origin: 'Designed in Europe',
  },
  careInstructions: '',
  material: '',
  dimensions: '',
  inStock: true,
  imageUrl: '',
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

function productToForm(product: ProductDetail): ProductDetail {
  return {
    ...emptyProduct,
    ...product,
    slug: product.slug || slugify(product.name),
    imageUrl: product.imageUrl || product.images?.[0] || '',
    images: product.images?.length ? product.images : [product.imageUrl || ''],
    details: { ...emptyProduct.details, ...product.details },
  };
}

export function AdminProducts() {
  const [products, setProducts] = useState<ProductDetail[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [form, setForm] = useState<ProductDetail>(emptyProduct);
  const [previewImageIndex, setPreviewImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState('');
  const { user, isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const subcategories = useMemo(() => {
    return shopMenu.find((group) => group.title === form.category)?.links.filter((link) => !link.startsWith('All ')) || [];
  }, [form.category]);

  const filteredProducts = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return products;
    return products.filter((product) =>
      [product.name, product.category, product.subcategory, product.slug].some((value) => value?.toLowerCase().includes(query)),
    );
  }, [products, search]);

  async function loadProducts() {
    setIsLoading(true);
    try {
      const data = await getProducts({ sort: 'newest' });
      setProducts(data);
      if (!selectedId && data[0]) {
        setSelectedId(data[0].id);
        setForm(productToForm(data[0]));
        setPreviewImageIndex(0);
      }
    } catch {
      toast.error('Unable to load products');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (isAuthLoading) return;

    if (!user) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }

    if (user.role !== 'admin') {
      navigate('/');
      return;
    }

    loadProducts();
  }, [isAuthLoading, location.pathname, user]);

  if (isAuthLoading || !user || user.role !== 'admin') {
    return <div className="container mx-auto px-6 py-20 text-sm text-[#737373]">Checking admin access...</div>;
  }

  function selectProduct(product: ProductDetail) {
    setSelectedId(product.id);
    setForm(productToForm(product));
    setPreviewImageIndex(0);
  }

  function updateField<K extends keyof ProductDetail>(field: K, value: ProductDetail[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateCategory(category: string) {
    const nextSubcategories = shopMenu.find((group) => group.title === category)?.links.filter((link) => !link.startsWith('All ')) || [];
    setForm((current) => ({
      ...current,
      category,
      subcategory: nextSubcategories.includes(current.subcategory || '') ? current.subcategory : nextSubcategories[0] || '',
    }));
  }

  function updateDetails(field: keyof NonNullable<ProductDetail['details']>, value: string) {
    setForm((current) => ({
      ...current,
      details: { ...current.details, [field]: value },
    }));
  }

  function toggleRoom(room: string) {
    const currentRooms = form.room || [];
    updateField(
      'room',
      currentRooms.includes(room)
        ? currentRooms.filter((item) => item !== room)
        : [...currentRooms, room],
    );
  }

  async function handleImageFiles(files: FileList | null) {
    try {
      const uploadedImages = await readImageFiles(files);
      if (!uploadedImages.length) return;
      const images = [...uploadedImages, ...(form.images || []).filter(Boolean)];
      updateField('images', images);
      updateField('imageUrl', images[0]);
      setPreviewImageIndex(0);
    } catch {
      toast.error('Unable to read image file');
    }
  }

  function newProduct() {
    const id = `prod_${Date.now().toString().slice(-6)}`;
    setSelectedId('');
    setForm({
      ...emptyProduct,
      id,
      slug: '',
      details: { ...emptyProduct.details, itemNumber: `BREW-DEMO-${id.replace('prod_', '')}` },
    });
    setPreviewImageIndex(0);
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setIsSaving(true);

    const images = form.images?.filter(Boolean) || [];
    const payload: ProductDetail = {
      ...form,
      slug: form.slug || slugify(form.name),
      price: Number(form.price),
      stock: Number(form.stock),
      images,
      imageUrl: form.imageUrl || images[0] || '',
      material: form.materials?.join(', ') || form.material || '',
      inStock: Number(form.stock) > 0,
    };

    try {
      const saved = selectedId ? await updateProduct(selectedId, payload) : await createProduct(payload);
      toast.success(selectedId ? 'Product updated' : 'Product created');
      await loadProducts();
      setSelectedId(saved.id);
      setForm(productToForm(saved));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to save product');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!selectedId) return;
    const confirmed = window.confirm(`Delete ${form.name}?`);
    if (!confirmed) return;

    try {
      await deleteProduct(selectedId);
      toast.success('Product deleted');
      setSelectedId('');
      setForm(emptyProduct);
      await loadProducts();
    } catch {
      toast.error('Unable to delete product');
    }
  }

  return (
    <div className="min-h-screen bg-[#F9F8F6] px-6 py-10">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#9E9B94]">Admin</p>
            <h1 className="font-serif text-4xl">Product Manager</h1>
          </div>
          <button onClick={newProduct} className="w-fit bg-[#2D2D2D] px-6 py-3 text-sm uppercase tracking-widest text-white hover:bg-black">
            New Product
          </button>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[360px_1fr]">
          <aside className="border border-[#EAE7E0] bg-white">
            <div className="border-b border-[#EAE7E0] p-4">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search products"
                className="w-full border border-[#EAE7E0] bg-transparent px-3 py-2 text-sm outline-none focus:border-[#2D2D2D]"
              />
            </div>
            <div className="max-h-[780px] overflow-y-auto">
              {isLoading && <div className="p-6 text-sm text-[#737373]">Loading products...</div>}
              {!isLoading && filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => selectProduct(product)}
                  className={`flex w-full gap-4 border-b border-[#EAE7E0] p-4 text-left hover:bg-[#F9F8F6] ${
                    selectedId === product.id ? 'bg-[#F3F1EC]' : 'bg-white'
                  }`}
                >
                  <div className="h-20 w-16 shrink-0 bg-[#EAE7E0]">
                    <PlaceholderImage text={`ADMIN ${product.id}`} src={product.imageUrl || product.images?.[0]} alt={product.name} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{product.name}</p>
                    <p className="mt-1 text-xs text-[#737373]">{product.category}</p>
                    <p className="text-xs text-[#9E9B94]">{product.currency || 'EUR'} {product.price.toFixed(2)}</p>
                  </div>
                </button>
              ))}
            </div>
          </aside>

          <form onSubmit={handleSave} className="border border-[#EAE7E0] bg-white p-6">
            <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1fr_340px]">
              <div className="space-y-8">
                <section>
                  <h2 className="mb-4 font-serif text-2xl">Core Information</h2>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-xs uppercase tracking-widest text-[#737373]">ID</span>
                      <input value={form.id} onChange={(event) => updateField('id', event.target.value)} className="w-full border border-[#EAE7E0] px-3 py-2" required />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-xs uppercase tracking-widest text-[#737373]">Slug</span>
                      <input value={form.slug || ''} onChange={(event) => updateField('slug', event.target.value)} className="w-full border border-[#EAE7E0] px-3 py-2" />
                    </label>
                    <label className="block md:col-span-2">
                      <span className="mb-2 block text-xs uppercase tracking-widest text-[#737373]">Name</span>
                      <input value={form.name} onChange={(event) => updateField('name', event.target.value)} className="w-full border border-[#EAE7E0] px-3 py-2" required />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-xs uppercase tracking-widest text-[#737373]">Category</span>
                      <select value={form.category} onChange={(event) => updateCategory(event.target.value)} className="w-full border border-[#EAE7E0] px-3 py-2">
                        {shopMenu.map((group) => <option key={group.title}>{group.title}</option>)}
                      </select>
                    </label>
                    {subcategories.length > 0 ? (
                      <label className="block">
                        <span className="mb-2 block text-xs uppercase tracking-widest text-[#737373]">Subcategory</span>
                        <select value={form.subcategory || ''} onChange={(event) => updateField('subcategory', event.target.value)} className="w-full border border-[#EAE7E0] px-3 py-2">
                          {subcategories.map((item) => <option key={item}>{item}</option>)}
                        </select>
                      </label>
                    ) : (
                      <div className="block">
                        <span className="mb-2 block text-xs uppercase tracking-widest text-[#737373]">Subcategory</span>
                        <div className="border border-[#EAE7E0] px-3 py-2 text-sm text-[#737373]">No subcategory</div>
                      </div>
                    )}
                    <label className="block">
                      <span className="mb-2 block text-xs uppercase tracking-widest text-[#737373]">Price</span>
                      <input type="number" value={form.price} onChange={(event) => updateField('price', Number(event.target.value))} className="w-full border border-[#EAE7E0] px-3 py-2" />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-xs uppercase tracking-widest text-[#737373]">Stock</span>
                      <input type="number" value={form.stock || 0} onChange={(event) => updateField('stock', Number(event.target.value))} className="w-full border border-[#EAE7E0] px-3 py-2" />
                    </label>
                  </div>
                </section>

                <section>
                  <h2 className="mb-4 font-serif text-2xl">Descriptions</h2>
                  <div className="space-y-4">
                    <label className="block">
                      <span className="mb-2 block text-xs uppercase tracking-widest text-[#737373]">Short Description</span>
                      <input value={form.shortDescription || ''} onChange={(event) => updateField('shortDescription', event.target.value)} className="w-full border border-[#EAE7E0] px-3 py-2" />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-xs uppercase tracking-widest text-[#737373]">Description</span>
                      <textarea value={form.description || ''} onChange={(event) => updateField('description', event.target.value)} className="min-h-28 w-full border border-[#EAE7E0] px-3 py-2" />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-xs uppercase tracking-widest text-[#737373]">Care Instructions</span>
                      <textarea value={form.careInstructions || ''} onChange={(event) => updateField('careInstructions', event.target.value)} className="min-h-24 w-full border border-[#EAE7E0] px-3 py-2" />
                    </label>
                  </div>
                </section>

                <section>
                  <h2 className="mb-4 font-serif text-2xl">Images</h2>
                  <label className="mb-4 block">
                    <span className="mb-2 block text-xs uppercase tracking-widest text-[#737373]">Choose image files</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(event) => handleImageFiles(event.target.files)}
                      className="w-full border border-[#EAE7E0] bg-white px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-xs uppercase tracking-widest text-[#737373]">Image URLs or uploaded data, one per line</span>
                    <textarea
                      value={(form.images || []).join('\n')}
                      onChange={(event) => {
                        const images = splitLines(event.target.value);
                        updateField('images', images);
                        updateField('imageUrl', images[0] || '');
                        setPreviewImageIndex(0);
                      }}
                      className="min-h-32 w-full border border-[#EAE7E0] px-3 py-2 font-mono text-sm"
                    />
                  </label>
                </section>

                <section>
                  <h2 className="mb-4 font-serif text-2xl">Attributes</h2>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-xs uppercase tracking-widest text-[#737373]">Sizes</span>
                      <input value={joinCsv(form.sizes)} onChange={(event) => updateField('sizes', splitCsv(event.target.value))} className="w-full border border-[#EAE7E0] px-3 py-2" />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-xs uppercase tracking-widest text-[#737373]">Materials</span>
                      <input value={joinCsv(form.materials)} onChange={(event) => updateField('materials', splitCsv(event.target.value))} className="w-full border border-[#EAE7E0] px-3 py-2" />
                    </label>
                    <div className="md:col-span-2">
                      <span className="mb-2 block text-xs uppercase tracking-widest text-[#737373]">Rooms</span>
                      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                        {roomOptions.map((room) => (
                          <label key={room} className="flex items-center gap-2 border border-[#EAE7E0] px-3 py-2 text-sm">
                            <input
                              type="checkbox"
                              checked={Boolean(form.room?.includes(room))}
                              onChange={() => toggleRoom(room)}
                            />
                            {room}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="mb-4 font-serif text-2xl">Details</h2>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {(['itemNumber', 'size', 'weight', 'material', 'origin'] as const).map((field) => (
                      <label key={field} className="block">
                        <span className="mb-2 block text-xs uppercase tracking-widest text-[#737373]">{field}</span>
                        <input value={form.details?.[field] || ''} onChange={(event) => updateDetails(field, event.target.value)} className="w-full border border-[#EAE7E0] px-3 py-2" />
                      </label>
                    ))}
                  </div>
                </section>
              </div>

              <aside className="space-y-6">
                <div className="border border-[#EAE7E0] bg-[#F9F8F6] p-4">
                  <div className="aspect-[4/5] bg-[#EAE7E0]">
                    <PlaceholderImage text="ADMIN PREVIEW" src={form.images?.[previewImageIndex] || form.imageUrl || form.images?.[0]} alt={form.name || 'Product preview'} />
                  </div>
                  {Boolean(form.images?.filter(Boolean).length) && (
                    <div className="mt-3 grid grid-cols-4 gap-2">
                      {(form.images || []).filter(Boolean).map((image, index) => (
                        <button
                          key={`${image}-${index}`}
                          type="button"
                          onClick={() => {
                            setPreviewImageIndex(index);
                            updateField('imageUrl', image);
                          }}
                          className={`aspect-square bg-[#EAE7E0] border ${previewImageIndex === index ? 'border-[#2D2D2D]' : 'border-transparent'}`}
                          aria-label={`Preview product image ${index + 1}`}
                        >
                          <PlaceholderImage text={`ADMIN THUMB ${index + 1}`} src={image} alt={`${form.name || 'Product'} ${index + 1}`} />
                        </button>
                      ))}
                    </div>
                  )}
                  <p className="mt-4 font-serif text-2xl">{form.name || 'New Product'}</p>
                  <p className="mt-1 text-sm text-[#737373]">{form.currency || 'EUR'} {Number(form.price || 0).toFixed(2)}</p>
                </div>

                <div className="border border-[#EAE7E0] p-4">
                  <h3 className="mb-4 font-serif text-xl">Flags</h3>
                  <div className="space-y-3">
                    {(['isNew', 'isCertified', 'isFeatured', 'isPopular'] as const).map((field) => (
                      <label key={field} className="flex items-center gap-3 text-sm">
                        <input type="checkbox" checked={Boolean(form[field])} onChange={(event) => updateField(field, event.target.checked)} />
                        {field}
                      </label>
                    ))}
                    <label className="block pt-3">
                      <span className="mb-2 block text-xs uppercase tracking-widest text-[#737373]">Badge</span>
                      <input value={form.badge || ''} onChange={(event) => updateField('badge', event.target.value)} className="w-full border border-[#EAE7E0] px-3 py-2" />
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
