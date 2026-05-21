import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type Product = {
  id: string;
  name: string;
  slug?: string;
  price: number;
  currency?: string;
  category: string;
  subcategory?: string;
  room?: string[];
  imageUrl?: string;
  images?: string[];
  sizes?: string[];
  materials?: string[];
  stock?: number;
  isNew?: boolean;
  isCertified?: boolean;
  isFeatured?: boolean;
  isPopular?: boolean;
  badge?: string;
  shortDescription?: string;
};

export type CartItem = Product & {
  quantity: number;
};

interface GlobalContextType {
  cart: CartItem[];
  wishlist: Product[];
  isCartOpen: boolean;
  isSearchOpen: boolean;
  isMobileMenuOpen: boolean;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  toggleWishlist: (product: Product) => void;
  setIsCartOpen: (isOpen: boolean) => void;
  setIsSearchOpen: (isOpen: boolean) => void;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
  cartTotal: number;
  cartCount: number;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'brew.cart';
const WISHLIST_STORAGE_KEY = 'brew.wishlist';

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function isProduct(value: unknown): value is Product {
  if (!value || typeof value !== 'object') return false;
  const product = value as Product;
  return typeof product.id === 'string' && typeof product.name === 'string' && typeof product.price === 'number';
}

function loadProducts(key: string): Product[] {
  if (!canUseStorage()) return [];

  try {
    const rawValue = window.localStorage.getItem(key);
    if (!rawValue) return [];

    const parsed = JSON.parse(rawValue);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(isProduct);
  } catch {
    return [];
  }
}

function loadCart(): CartItem[] {
  return loadProducts(CART_STORAGE_KEY)
    .map((item) => ({ ...item, quantity: Number((item as CartItem).quantity) || 1 }))
    .filter((item) => item.quantity > 0);
}

function saveStorage<T>(key: string, value: T) {
  if (!canUseStorage()) return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage failures so shopping actions keep working in restricted browsers.
  }
}

export function GlobalProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(loadCart);
  const [wishlist, setWishlist] = useState<Product[]>(() => loadProducts(WISHLIST_STORAGE_KEY));
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    saveStorage(CART_STORAGE_KEY, cart);
  }, [cart]);

  useEffect(() => {
    saveStorage(WISHLIST_STORAGE_KEY, wishlist);
  }, [wishlist]);

  const addToCart = (product: Product, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prev, { ...product, quantity }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) return removeFromCart(id);
    setCart((prev) => prev.map((item) => (item.id === id ? { ...item, quantity } : item)));
  };

  const clearCart = () => setCart([]);

  const toggleWishlist = (product: Product) => {
    setWishlist((prev) =>
      prev.some((item) => item.id === product.id)
        ? prev.filter((item) => item.id !== product.id)
        : [...prev, product]
    );
  };

  const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

  return (
    <GlobalContext.Provider
      value={{
        cart,
        wishlist,
        isCartOpen,
        isSearchOpen,
        isMobileMenuOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        toggleWishlist,
        setIsCartOpen,
        setIsSearchOpen,
        setIsMobileMenuOpen,
        cartTotal,
        cartCount,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
}

export function useGlobal() {
  const context = useContext(GlobalContext);
  if (context === undefined) {
    throw new Error('useGlobal must be used within a GlobalProvider');
  }
  return context;
}
