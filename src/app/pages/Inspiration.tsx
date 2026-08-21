import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { PlaceholderImage } from '../components/PlaceholderImage';
import { getStories, Story } from '../api/stories';
import { inspireCategories } from '../data/inspireCategories';
import { formatDate } from '../lib/dates';

function storyPath(story: Story) {
  return `/inspiration/${encodeURIComponent(story.id)}`;
}

export function Inspiration() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const category = searchParams.get('category') || '';

  const featuredStory = useMemo(() => stories.find((story) => story.isFeatured) || stories[0], [stories]);
  const gridStories = useMemo(() => stories.filter((story) => story.id !== featuredStory?.id), [stories, featuredStory]);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    getStories({ category })
      .then((data) => {
        if (!isMounted) return;
        setStories(data);
        setLoadError('');
      })
      .catch(() => {
        if (!isMounted) return;
        setStories([]);
        setLoadError('Unable to load inspire stories.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [category]);

  function selectCategory(nextCategory: string) {
    const params = new URLSearchParams(searchParams);
    if (nextCategory) params.set('category', nextCategory);
    else params.delete('category');
    setSearchParams(params);
  }

  return (
    <div>
      <section className="container mx-auto px-6 py-12">
        <div className="mb-12 flex gap-8 overflow-x-auto pb-4 text-sm font-medium tracking-widest uppercase text-[#9E9B94]">
          <button onClick={() => selectCategory('')} className={`whitespace-nowrap ${!category ? 'text-[#2D2D2D]' : 'hover:text-[#2D2D2D]'}`}>
            All Stories
          </button>
          {inspireCategories.map((item) => (
            <button
              key={item}
              onClick={() => selectCategory(item)}
              className={`whitespace-nowrap ${category === item ? 'text-[#2D2D2D]' : 'hover:text-[#2D2D2D]'}`}
            >
              {item}
            </button>
          ))}
        </div>

        {isLoading && <div className="py-20 text-center text-sm text-[#737373]">Loading inspire stories...</div>}
        {loadError && <div className="py-20 text-center text-sm text-[#9E9B94]">{loadError}</div>}

        {!isLoading && featuredStory && (
          <article className="group mb-20">
            <Link to={storyPath(featuredStory)} className="mb-8 block h-[70vh] w-full overflow-hidden">
              <PlaceholderImage text="FEATURED STORY" src={featuredStory.heroImage || featuredStory.images?.[0]} alt={featuredStory.title} className="transition-transform duration-1000 group-hover:scale-105" />
            </Link>
            <div className="max-w-3xl">
              <div className="mb-4 flex items-center gap-4 text-xs uppercase tracking-widest text-[#9E9B94]">
                <span>{featuredStory.category}</span>
                <span>{formatDate(featuredStory.publishedAt, '', 'en')}</span>
              </div>
              <h2 className="mb-6 font-serif text-4xl md:text-6xl">{featuredStory.title}</h2>
              <p className="mb-8 text-lg leading-relaxed text-[#737373]">{featuredStory.excerpt}</p>
              <Link to={storyPath(featuredStory)} className="w-max border-b border-[#2D2D2D] pb-1 text-sm font-medium uppercase tracking-widest transition-colors hover:border-[#737373] hover:text-[#737373]">
                Read more...
              </Link>
            </div>
          </article>
        )}

        {!isLoading && (
          <div className="mb-20 grid grid-cols-1 gap-x-8 gap-y-16 md:grid-cols-2 lg:grid-cols-3">
            {gridStories.map((story) => (
              <Link to={storyPath(story)} key={story.id} className="group flex h-full flex-col">
                <div className="mb-6 aspect-[4/3] overflow-hidden bg-[#EAE7E0]">
                  <PlaceholderImage text={`STORY ${story.id}`} src={story.heroImage || story.images?.[0]} alt={story.title} className="transition-transform duration-700 group-hover:scale-105" />
                </div>
                <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-widest text-[#9E9B94]">
                  <span>{story.category}</span>
                  <span>{formatDate(story.publishedAt, '', 'en')}</span>
                </div>
                <h3 className="mb-4 font-serif text-2xl transition-colors group-hover:text-[#737373]">{story.title}</h3>
                <p className="mb-6 line-clamp-3 text-[#737373]">{story.excerpt}</p>
                <span className="mt-auto w-max border-b border-[#2D2D2D] pb-1 text-xs font-medium uppercase tracking-widest transition-colors group-hover:border-[#737373] group-hover:text-[#737373]">
                  Read more...
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="bg-[#DCD5C6] py-24 text-center">
        <div className="container mx-auto max-w-2xl px-6">
          <h2 className="mb-6 font-serif text-4xl">Inspiration to your inbox</h2>
          <p className="mb-10 text-[#2D2D2D]/80">Sign up to receive stories, styling tips, and early access to new collections.</p>
          <form className="flex border-b border-[#2D2D2D] pb-2">
            <input type="email" placeholder="Email address" className="flex-1 bg-transparent text-lg placeholder:text-[#2D2D2D]/50 focus:outline-none" />
            <button type="submit" className="text-sm font-medium uppercase tracking-widest">Subscribe</button>
          </form>
        </div>
      </section>
    </div>
  );
}
