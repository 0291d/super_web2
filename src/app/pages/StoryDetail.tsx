import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { PlaceholderImage } from '../components/PlaceholderImage';
import { ProductCard } from '../components/ProductCard';
import { Facebook, Twitter, Instagram } from 'lucide-react';
import { Product } from '../context/GlobalContext';
import { getStory, Story } from '../api/stories';
import { getProduct } from '../api/products';
import { formatDate } from '../lib/dates';

const fermLivingStoryUrls: Record<string, string> = {
  story_001: 'https://fermliving.com/blogs/stories/living-with-kids-at-home-with-fanny-nilsson',
  story_002: 'https://fermliving.com/blogs/stories/notes-on-romanticism-autumn-winter-2025',
  story_003: 'https://fermliving.com/blogs/stories/back-to-school-with-kids',
  story_004: 'https://fermliving.com/blogs/stories/office-edition-at-home-with-sune-palner',
  story_005: 'https://fermliving.com/blogs/stories/expanding-the-dapple-collection',
  story_006: 'https://fermliving.com/blogs/stories/copenhagen-city-guide-3daysofdesign',
  story_007: 'https://fermliving.com/blogs/stories/the-process-behind-vegea',
  story_008: 'https://fermliving.com/blogs/stories/set-the-outdoor-table-with-nuria-val',
  story_009: 'https://fermliving.com/blogs/stories/at-home-with-eva-papadaki',
  story_010: 'https://fermliving.com/blogs/stories/behind-the-design-dapple-collection',
  story_011: 'https://fermliving.com/blogs/stories/meet-our-design-studio',
  story_012: 'https://fermliving.com/blogs/stories/the-home-of-liene-meneve',
  story_013: 'https://fermliving.com/blogs/stories/the-art-of-balance',
  story_014: 'https://fermliving.com/blogs/stories/the-garden-of-malene-lei-raben',
  story_015: 'https://fermliving.com/blogs/stories/the-love-story-of-a-classic',
};

export function StoryDetail() {
  const { id } = useParams();
  const [story, setStory] = useState<Story | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    setIsLoading(true);

    getStory(id)
      .then(async (data) => {
        if (!isMounted) return;
        setStory(data);
        const relatedProducts = await Promise.allSettled((data.relatedProductIds || []).map((productId) => getProduct(productId)));
        if (!isMounted) return;
        setProducts(
          relatedProducts
            .filter((result): result is PromiseFulfilledResult<Product> => result.status === 'fulfilled')
            .map((result) => result.value),
        );
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (isLoading) {
    return <div className="container mx-auto px-6 py-20 text-center text-sm text-[#737373]">Loading story...</div>;
  }

  if (!story) {
    return <div className="container mx-auto px-6 py-20 text-center text-sm text-[#737373]">Story not found.</div>;
  }

  const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`;
  const readMoreUrl = story.sourceUrl || fermLivingStoryUrls[story.id] || 'https://fermliving.com/blogs/stories';

  return (
    <article className="bg-[#F9F8F6]">
      <section className="relative h-[80vh] w-full">
        <PlaceholderImage text="STORY HERO" src={story.heroImage || story.images?.[0]} alt={story.title} />
      </section>

      <section className="container mx-auto max-w-4xl px-6 py-16 text-center">
        <Link to={`/inspire?category=${encodeURIComponent(story.category)}`} className="mb-6 block text-xs font-medium uppercase tracking-widest text-[#9E9B94]">
          ferm LIVING Stories / {story.category} / {formatDate(story.publishedAt, '', 'en')} / {story.readTime}
        </Link>
        <h1 className="mb-8 font-serif text-5xl md:text-6xl">{story.title}</h1>
        <p className="text-xl leading-relaxed text-[#737373]">{story.excerpt}</p>
      </section>

      <section className="container mx-auto max-w-3xl space-y-12 px-6 pb-20 text-lg leading-relaxed text-[#2D2D2D]">
        {story.sections?.map((section, index) => (
          <React.Fragment key={`${section.heading}-${index}`}>
            {section.heading && <h2 className="font-serif text-3xl">{section.heading}</h2>}
            <p>{section.body}</p>
            {section.image && (
              <div className="my-16 aspect-[3/2] w-full bg-[#EAE7E0]">
                <PlaceholderImage text={`EDITORIAL IMAGE ${index + 1}`} src={section.image} alt={section.heading || story.title} />
              </div>
            )}
          </React.Fragment>
        ))}

        {story.quote && (
          <blockquote className="my-16 border-l-2 border-[#2D2D2D] py-4 pl-8">
            <p className="font-serif text-3xl italic leading-relaxed text-[#737373]">"{story.quote}"</p>
          </blockquote>
        )}

        {products.length > 0 && (
          <div className="my-16 bg-white p-10">
            <h3 className="mb-8 text-center font-serif text-2xl">Featured in this story</h3>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
              {products.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          </div>
        )}

        <div className="mt-20 flex items-center gap-4 border-t border-[#EAE7E0] pt-12">
          <a
            href={readMoreUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="border-b border-[#2D2D2D] pb-1 text-xs font-medium uppercase tracking-widest text-[#2D2D2D] hover:border-[#737373] hover:text-[#737373]"
          >
            Read more...
          </a>
          <span className="text-sm font-medium uppercase tracking-widest text-[#9E9B94]">Share Story</span>
          <a
            href={facebookShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Share this story on Facebook"
            className="text-[#9E9B94] hover:text-[#2D2D2D]"
          >
            <Facebook className="h-5 w-5" />
          </a>
          <Twitter className="h-5 w-5 cursor-pointer text-[#9E9B94] hover:text-[#2D2D2D]" />
          <Instagram className="h-5 w-5 cursor-pointer text-[#9E9B94] hover:text-[#2D2D2D]" />
        </div>
      </section>
    </article>
  );
}
