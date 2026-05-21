import React, { useState } from 'react';
import { Link } from 'react-router';
import { Heart, Plus } from 'lucide-react';
import { useGlobal, Product } from '../context/GlobalContext';
import { PlaceholderImage } from './PlaceholderImage';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { toggleWishlist, wishlist, addToCart } = useGlobal();
  const [isHovered, setIsHovered] = useState(false);
  const isWishlisted = wishlist.some((item) => item.id === product.id);
  const primaryImage = product.imageUrl || product.images?.[0];
  const hoverImage = product.images?.[1] || primaryImage;
  const currency = product.currency || 'EUR';

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
    toast.success(`${product.name} added to cart`);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
    if (!isWishlisted) toast.success(`${product.name} added to wishlist`);
  };

  return (
    <div 
      className="group relative flex flex-col cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link to={`/product/${product.id}`} className="block relative aspect-[4/5] bg-[#EAE7E0] mb-4 overflow-hidden">
        {isHovered ? (
          <PlaceholderImage text={`PRODUCT ${product.id}`} src={hoverImage} alt={product.name} />
        ) : (
          <PlaceholderImage text={`PRODUCT ${product.id}`} src={primaryImage} alt={product.name} />
        )}
        
        {/* Badges */}
        {(product.badge || product.price > 500) && (
          <div className="absolute top-4 left-4 bg-white px-2 py-1 text-xs font-medium uppercase tracking-widest">
            {product.badge || 'New'}
          </div>
        )}

        <button 
          onClick={handleWishlist}
          className="absolute top-4 right-4 p-2 hover:bg-white rounded-full transition-colors z-10"
        >
          <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-[#2D2D2D] text-[#2D2D2D]' : 'text-[#2D2D2D]'}`} />
        </button>

        <div className={`absolute bottom-0 w-full p-4 transition-transform duration-300 ${isHovered ? 'translate-y-0' : 'translate-y-full'}`}>
          <button 
            onClick={handleAddToCart}
            className="w-full bg-[#2D2D2D] text-white py-3 text-sm font-medium tracking-wide uppercase hover:bg-black transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> Quick Add
          </button>
        </div>
      </Link>

      <Link to={`/product/${product.id}`} className="flex flex-col flex-1">
        <h3 className="text-sm font-medium text-[#2D2D2D] mb-1">{product.name}</h3>
        <p className="text-sm text-[#737373] mb-2">{product.subcategory || product.category}</p>
        <div className="mt-auto flex justify-between items-center">
          <span className="text-sm font-medium">{currency} {product.price.toFixed(2)}</span>
        </div>
      </Link>
    </div>
  );
}
