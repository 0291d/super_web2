import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { useGlobal } from '../context/GlobalContext';
import { PlaceholderImage } from '../components/PlaceholderImage';
import { ProductCard } from '../components/ProductCard';
import { Minus, Plus, ChevronDown, Heart, Share2, Download } from 'lucide-react';
import { toast } from 'sonner';
import { getProduct, getProducts, ProductDetail as ProductDetailType } from '../api/products';
import { PRODUCT_IMAGES } from '../lib/images';

const FALLBACK_PRODUCT: ProductDetailType = {
  id: 'prod_001',
  name: 'Aster Lounge Chair',
  slug: 'aster-lounge-chair',
  price: 849,
  currency: 'EUR',
  category: 'Furniture',
  subcategory: 'Lounge Chairs',
  sizes: ['One Size'],
  materials: ['Oak', 'Linen Blend', 'Foam'],
  stock: 12,
  description: 'A sculptural lounge chair with soft proportions, designed for calm and comfortable living spaces.',
  shortDescription: 'Minimal lounge chair with soft upholstery.',
  material: 'Oak frame, linen blend upholstery',
  dimensions: 'W: 78 x H: 72 x D: 82 cm',
  inStock: true,
  imageUrl: PRODUCT_IMAGES[0],
  images: [PRODUCT_IMAGES[0], PRODUCT_IMAGES[1], PRODUCT_IMAGES[2], PRODUCT_IMAGES[3]],
  details: {
    itemNumber: 'BREW-DEMO-001',
    size: 'W 78 x H 72 x D 82 cm',
    weight: '18 kg',
    material: 'Oak frame, linen blend upholstery',
    origin: 'Designed in Europe',
  },
  careInstructions: 'Vacuum regularly using a soft brush attachment. Spot clean with a damp cloth.',
};

export function ProductDetail() {
  const { id } = useParams();
  const { addToCart, toggleWishlist, wishlist } = useGlobal();
  const [qty, setQty] = useState(1);
  const [activeAccordion, setActiveAccordion] = useState<string | null>('description');
  const [product, setProduct] = useState<ProductDetailType>(FALLBACK_PRODUCT);
  const [relatedProducts, setRelatedProducts] = useState<ProductDetailType[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    setIsLoading(true);
    setActiveImageIndex(0);

    getProduct(id)
      .then((data) => {
        if (isMounted) setProduct(data);
      })
      .catch(() => {
        if (isMounted) setProduct({ ...FALLBACK_PRODUCT, id });
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  useEffect(() => {
    if (isLoading || !product.category) return;
    let isMounted = true;

    getProducts({ category: product.category, sort: 'popular' })
      .then((products) => {
        if (!isMounted) return;
        setRelatedProducts(products.filter((item) => item.id !== product.id).slice(0, 4));
      })
      .catch(() => {
        if (isMounted) setRelatedProducts([]);
      });

    return () => {
      isMounted = false;
    };
  }, [isLoading, product.category, product.id]);

  const isWishlisted = wishlist.some((item) => item.id === product.id);
  const currency = product.currency || 'EUR';
  const productImages = product.images?.length
    ? product.images
    : [product.imageUrl || PRODUCT_IMAGES[0], PRODUCT_IMAGES[1], PRODUCT_IMAGES[2], PRODUCT_IMAGES[3]];
  const activeImage = productImages[activeImageIndex] || productImages[0];
  const details = product.details || FALLBACK_PRODUCT.details;

  const handleAddToCart = () => {
    addToCart(product, qty);
    toast.success(`${product.name} added to cart`);
  };

  const toggleAccordion = (name: string) => {
    setActiveAccordion(activeAccordion === name ? null : name);
  };

  return (
    <div className="container mx-auto px-6 py-12">
      <div className="flex gap-2 text-xs tracking-widest uppercase text-[#9E9B94] mb-8">
        <Link to="/" className="hover:text-[#2D2D2D]">Home</Link>
        <span>/</span>
        <Link to={`/shop?category=${encodeURIComponent(product.category)}`} className="hover:text-[#2D2D2D]">{product.category}</Link>
        <span>/</span>
        <span className="text-[#2D2D2D]">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-20">
        <div className="flex gap-4 flex-col-reverse md:flex-row">
          <div className="flex md:flex-col gap-4 overflow-x-auto md:w-24 flex-shrink-0">
            {productImages.map((image, index) => (
              <button
                type="button"
                key={`${image}-${index}`}
                onClick={() => setActiveImageIndex(index)}
                className={`w-20 h-24 md:w-full shrink-0 bg-[#EAE7E0] cursor-pointer border ${
                  activeImageIndex === index ? 'border-[#2D2D2D]' : 'border-transparent hover:border-[#2D2D2D]'
                }`}
                aria-label={`Show ${product.name} image ${index + 1}`}
              >
                <PlaceholderImage text={`THUMB ${index + 1}`} src={image} alt={`${product.name} view ${index + 1}`} />
              </button>
            ))}
          </div>
          <div className="flex-1 bg-[#EAE7E0] aspect-[3/4] relative">
            <PlaceholderImage text="MAIN PRODUCT IMAGE" src={activeImage} alt={product.name} />
          </div>
        </div>

        <div className="flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <div>
              {product.badge && <span className="text-xs tracking-widest uppercase text-[#9E9B94] mb-3 block">{product.badge}</span>}
              <h1 className="text-4xl font-serif">{product.name}</h1>
            </div>
            <button onClick={() => toggleWishlist(product)}>
              <Heart className={`w-6 h-6 ${isWishlisted ? 'fill-[#2D2D2D] text-[#2D2D2D]' : 'text-[#2D2D2D]'}`} />
            </button>
          </div>
          {isLoading && <p className="text-sm text-[#737373] mb-4">Loading product...</p>}
          {product.shortDescription && <p className="text-[#737373] mb-6">{product.shortDescription}</p>}
          <p className="text-2xl mb-8">{currency} {product.price.toFixed(2)}</p>

          <div className="flex gap-4 mb-8">
            <div className="flex items-center border border-[#EAE7E0] w-32">
              <button className="px-4 py-3 hover:bg-[#F9F8F6]" onClick={() => setQty(Math.max(1, qty - 1))}><Minus className="w-4 h-4" /></button>
              <span className="flex-1 text-center font-medium">{qty}</span>
              <button className="px-4 py-3 hover:bg-[#F9F8F6]" onClick={() => setQty(qty + 1)}><Plus className="w-4 h-4" /></button>
            </div>
            <button
              onClick={handleAddToCart}
              className="flex-1 bg-[#2D2D2D] text-white py-3 font-medium tracking-wide uppercase hover:bg-black transition-colors"
            >
              Add to Cart
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm mb-12 py-6 border-y border-[#EAE7E0]">
            <div className="flex items-center gap-2 text-[#737373]"><div className="w-2 h-2 bg-green-500 rounded-full" /> {product.stock ?? 0} In Stock</div>
            <div className="flex items-center gap-2 text-[#737373]">Free Shipping {'>'} EUR 150</div>
            <div className="flex items-center gap-2 text-[#737373]">{details?.origin || 'Designed in Europe'}</div>
          </div>

          <div className="border-t border-[#EAE7E0]">
            {[
              { id: 'description', title: 'Description', content: product.description || FALLBACK_PRODUCT.description },
              {
                id: 'details',
                title: 'Product Details',
                content: `Item no: ${details?.itemNumber || product.id}\nSize: ${details?.size || product.dimensions || 'Standard dimensions'}\nWeight: ${details?.weight || 'N/A'}\nMaterial: ${details?.material || product.material || product.materials?.join(', ') || 'Premium mixed materials'}\nOrigin: ${details?.origin || 'Designed in Europe'}`,
              },
              { id: 'care', title: 'Care Instructions', content: product.careInstructions || FALLBACK_PRODUCT.careInstructions },
            ].map((section) => (
              <div key={section.id} className="border-b border-[#EAE7E0]">
                <button
                  className="w-full py-4 flex justify-between items-center text-left font-serif text-lg"
                  onClick={() => toggleAccordion(section.id)}
                >
                  {section.title}
                  <ChevronDown className={`w-5 h-5 transition-transform ${activeAccordion === section.id ? 'rotate-180' : ''}`} />
                </button>
                {activeAccordion === section.id && (
                  <div className="pb-4 text-[#737373] text-sm whitespace-pre-line leading-relaxed">{section.content}</div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 flex gap-4 text-sm text-[#737373]">
            <button className="flex items-center gap-2 hover:text-[#2D2D2D]"><Share2 className="w-4 h-4" /> Share</button>
            <button className="flex items-center gap-2 hover:text-[#2D2D2D]"><Download className="w-4 h-4" /> Download 2D/3D</button>
          </div>
        </div>
      </div>

      <section className="py-20 border-t border-[#EAE7E0]">
        <h2 className="text-3xl font-serif mb-10 text-center">You May Also Like</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {relatedProducts.map((relatedProduct) => (
            <ProductCard key={relatedProduct.id} product={relatedProduct} />
          ))}
          {!relatedProducts.length && <div className="col-span-full text-center text-sm text-[#737373]">No related products available.</div>}
        </div>
      </section>
    </div>
  );
}
