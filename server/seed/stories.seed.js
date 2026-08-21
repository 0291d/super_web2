const storyImages = [
  'https://images.unsplash.com/photo-1752004028694-72610be3604e?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&w=1600',
  'https://images.unsplash.com/photo-1723750290151-164cb19ebab7?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&w=1600',
  'https://images.unsplash.com/photo-1725859685127-c723ea1d32a1?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&w=1600',
  'https://images.unsplash.com/photo-1759238136818-7b00ec9e782a?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&w=1600',
  'https://images.unsplash.com/photo-1773578639782-2046b150ce28?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&w=1600',
  'https://images.unsplash.com/photo-1768609239321-1cfe14893e80?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&w=1600',
  'https://images.unsplash.com/photo-1757262798677-ab4af4455a58?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&w=1600',
  'https://images.unsplash.com/photo-1771888703723-01d85da1dae1?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&w=1600',
  'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&w=1600',
  'https://images.unsplash.com/photo-1569081596046-a00841f93159?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&w=1600',
  'https://images.unsplash.com/photo-1611270478701-e5b9e0c91890?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&w=1600',
  'https://images.unsplash.com/photo-1711450840884-12a344ed3070?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&w=1600',
  'https://images.unsplash.com/photo-1592150138572-7f2aa260eac7?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&w=1600',
  'https://images.unsplash.com/photo-1635232958384-cb399204f666?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&w=1600',
  'https://images.unsplash.com/photo-1761295908436-89f850764209?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&w=1600',
];

const storySourceUrls = [
  'https://fermliving.com/blogs/stories/living-with-kids-at-home-with-fanny-nilsson',
  'https://fermliving.com/blogs/stories/notes-on-romanticism-autumn-winter-2025',
  'https://fermliving.com/blogs/stories/back-to-school-with-kids',
  'https://fermliving.com/blogs/stories/office-edition-at-home-with-sune-palner',
  'https://fermliving.com/blogs/stories/expanding-the-dapple-collection',
  'https://fermliving.com/blogs/stories/copenhagen-city-guide-3daysofdesign',
  'https://fermliving.com/blogs/stories/the-process-behind-vegea',
  'https://fermliving.com/blogs/stories/set-the-outdoor-table-with-nuria-val',
  'https://fermliving.com/blogs/stories/at-home-with-eva-papadaki',
  'https://fermliving.com/blogs/stories/behind-the-design-dapple-collection',
  'https://fermliving.com/blogs/stories/meet-our-design-studio',
  'https://fermliving.com/blogs/stories/the-home-of-liene-meneve',
  'https://fermliving.com/blogs/stories/the-art-of-balance',
  'https://fermliving.com/blogs/stories/the-garden-of-malene-lei-raben',
  'https://fermliving.com/blogs/stories/the-love-story-of-a-classic',
];

const storyGroups = [
  {
    category: 'Interior Design',
    stories: [
      ['A Quiet Apartment Shaped by Warm Light', 'How soft light, warm wood, and restrained silhouettes make a compact city apartment feel calm and complete.'],
      ['Layering Neutrals Without Losing Depth', 'A practical look at texture, contrast, and material changes inside a neutral living space.'],
      ['Creating Flow Between Dining and Living', 'Design notes for making open-plan rooms feel connected without becoming visually noisy.'],
    ],
  },
  {
    category: 'Design Profiles',
    stories: [
      ['Inside the Studio: The Value of Restraint', 'A conversation with our studio team about proportion, restraint, and furniture that settles into daily life.'],
      ['Material Notes from a Wood Workshop', 'A profile of the craft decisions behind oak, ash, and quiet surface treatments.'],
      ['The Ceramicist and the Everyday Object', 'How handmade references can inform functional objects without making them precious.'],
    ],
  },
  {
    category: 'Guides',
    stories: [
      ['How to Choose a Rug for Each Room', 'A room-by-room guide to scale, material, pile height, and visual weight.'],
      ['A Simple Lighting Plan for Evenings', 'Build a calmer room with layered lighting, dimming, and portable lamps.'],
      ['Choosing Storage That Does Not Dominate', 'How to select storage pieces that organize the home while keeping the room composed.'],
    ],
  },
  {
    category: 'News',
    stories: [
      ['Spring Edit: New Shapes for Slow Rooms', 'Our seasonal edit introduces softened silhouettes and tactile finishes for everyday rooms.'],
      ['ferm LIVING Opens a Material Library', 'A behind-the-scenes look at the references guiding upcoming furniture and accessory work.'],
      ['Certified Pieces Join the Permanent Range', 'A short update on certified materials and longer-lasting home objects.'],
    ],
  },
  {
    category: 'Styling Tips',
    stories: [
      ['Five Ways to Style a Low Table', 'Small adjustments in height, texture, and negative space can make a coffee table feel considered.'],
      ['Shelf Styling with Fewer Objects', 'A practical approach to shelves using rhythm, spacing, and repeated materials.'],
      ['Textiles That Soften Minimal Rooms', 'Use cushions, throws, and towels to add comfort without overpowering a quiet palette.'],
    ],
  },
];

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export const inspireCategories = storyGroups.map((group) => group.category);

export const stories = storyGroups.flatMap((group, groupIndex) =>
  group.stories.map(([title, excerpt], storyIndex) => {
    const numericId = groupIndex * 3 + storyIndex + 1;
    const id = `story_${String(numericId).padStart(3, '0')}`;
    const heroImage = storyImages[numericId - 1];
    const secondaryImage = storyImages[numericId % storyImages.length];
    const detailImage = storyImages[(numericId + 5) % storyImages.length];

    return {
      storyId: id,
      title,
      slug: slugify(title),
      category: group.category,
      excerpt,
      heroImage,
      images: [heroImage, secondaryImage, detailImage],
      author: numericId % 2 === 0 ? 'ferm LIVING Editorial' : 'ferm LIVING Studio',
      publishedAt: new Date(Date.UTC(2026, (numericId % 6), 4 + numericId)),
      readTime: `${4 + (numericId % 4)} min read`,
      isFeatured: numericId === 1 || storyIndex === 0,
      isPublished: true,
      tags: [group.category, 'European interiors', 'Home styling'],
      quote:
        'A room feels resolved when every material has a reason to be there and enough space to be understood.',
      sections: [
        {
          heading: 'The Starting Point',
          body:
            'The project begins with a simple question: what should the room help you do every day? From there, each choice is measured against function, comfort, and atmosphere.',
          image: secondaryImage,
        },
        {
          heading: 'Material Direction',
          body:
            'Natural textures, honest surfaces, and muted contrast keep the setting warm without relying on decoration. The result is a room that feels edited rather than empty.',
          image: detailImage,
        },
        {
          heading: 'How to Apply It',
          body:
            'Start with one anchor piece, repeat two or three materials, and leave breathing room around the objects you want people to notice.',
          image: '',
        },
      ],
      relatedProductIds: [`prod_${String(((numericId - 1) % 33) + 1).padStart(3, '0')}`],
      sourceUrl: storySourceUrls[numericId - 1],
      seoTitle: `${title} | ferm LIVING Stories`,
      seoDescription: excerpt,
    };
  }),
);
