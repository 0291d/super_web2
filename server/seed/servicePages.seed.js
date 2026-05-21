export const servicePages = [
  {
    pageId: 'contact-us',
    title: 'Contact Us',
    slug: 'contact-us',
    category: 'Customer Service',
    excerpt: 'Reach the BREW team for product questions, order support, trade requests, and general assistance.',
    sections: [
      {
        title: 'Customer Care',
        body: 'Our customer care team answers messages Monday to Friday. We normally respond within two business days.',
        items: ['Email: care@brew.local', 'Phone: +45 00 00 00 00', 'Hours: Monday-Friday, 09:00-17:00 CET'],
      },
      {
        title: 'Order Support',
        body: 'Please include your order number, email address, and a short description of the issue so we can help quickly.',
        items: ['Order changes', 'Delivery updates', 'Return requests', 'Product information'],
      },
    ],
    ctaLabel: 'Email Customer Care',
    ctaHref: 'mailto:care@brew.local',
    order: 1,
  },
  {
    pageId: 'delivery-returns',
    title: 'Delivery & Returns',
    slug: 'delivery-returns',
    category: 'Customer Service',
    excerpt: 'Clear delivery, return, and exchange information for demo orders and project planning.',
    sections: [
      {
        title: 'Delivery',
        body: 'Delivery time depends on product type and destination. Small items are normally dispatched faster than furniture or oversized goods.',
        items: ['Parcel delivery: 3-7 business days', 'Furniture delivery: 2-5 weeks', 'Free shipping above EUR 150'],
      },
      {
        title: 'Returns',
        body: 'Unused products may be returned within 30 days. Items must be returned in original packaging and condition.',
        items: ['Register the return before shipping', 'Pack items securely', 'Refunds are processed after inspection'],
      },
    ],
    ctaLabel: 'Start Return',
    ctaHref: 'mailto:returns@brew.local',
    order: 2,
  },
  {
    pageId: 'care-maintenance',
    title: 'Care & Maintenance',
    slug: 'care-maintenance',
    category: 'Customer Service',
    excerpt: 'Material guidance to keep furniture, lighting, textiles, rugs, and accessories looking their best.',
    sections: [
      {
        title: 'Wood',
        body: 'Wipe wood with a soft damp cloth and dry immediately. Avoid heat, direct sunlight, and harsh chemicals.',
        items: ['Use coasters on tables', 'Clean spills immediately', 'Refresh untreated wood with suitable oil'],
      },
      {
        title: 'Textiles',
        body: 'Vacuum regularly with a soft brush attachment. Spot clean gently and avoid soaking the fabric.',
        items: ['Do not bleach', 'Keep away from direct sunlight', 'Professional cleaning is recommended for heavy stains'],
      },
      {
        title: 'Ceramics, Glass, and Metal',
        body: 'Clean with mild soap and a soft cloth. Avoid abrasive pads that can scratch surfaces.',
        items: ['Hand wash delicate ceramics', 'Use glass cleaner for mirrors', 'Dry metal after cleaning'],
      },
    ],
    ctaLabel: 'Download Care Guide',
    ctaHref: '/downloads/brew-care-guide.pdf',
    order: 3,
  },
  {
    pageId: 'faq',
    title: 'FAQ',
    slug: 'faq',
    category: 'Customer Service',
    excerpt: 'Answers to common questions about orders, delivery, returns, products, and account access.',
    sections: [
      {
        title: 'Orders',
        body: 'You will receive an order confirmation after checkout. If it does not arrive, check your spam folder or contact support.',
        items: ['Can I change my order?', 'Can I cancel before dispatch?', 'Where is my order confirmation?'],
      },
      {
        title: 'Products',
        body: 'Product pages include dimensions, materials, care notes, and stock information where available.',
        items: ['Where can I find dimensions?', 'Are products suitable for contract use?', 'How do I request spare parts?'],
      },
      {
        title: 'Accounts',
        body: 'Customer accounts store basic profile information. Admin accounts can manage content and products.',
        items: ['How do I reset my password?', 'How do I update my details?', 'How do admins access the dashboard?'],
      },
    ],
    order: 4,
  },
  {
    pageId: 'terms-conditions',
    title: 'Terms & Conditions',
    slug: 'terms-conditions',
    category: 'Legal',
    excerpt: 'Demo terms covering orders, pricing, product information, and website use.',
    sections: [
      {
        title: 'Website Use',
        body: 'This demo website is provided for presentation and development purposes. Product names, prices, and content are fictional unless otherwise noted.',
      },
      {
        title: 'Orders and Pricing',
        body: 'Prices are shown in EUR for demonstration. No real transaction is completed through this demo storefront.',
      },
    ],
    order: 10,
  },
  {
    pageId: 'privacy-policy',
    title: 'Privacy Policy',
    slug: 'privacy-policy',
    category: 'Legal',
    excerpt: 'How demo user, admin, inquiry, and account information is stored and used.',
    sections: [
      {
        title: 'Stored Data',
        body: 'The app stores user accounts, hashed passwords, product data, story content, professional inquiries, and service page content in MongoDB.',
      },
      {
        title: 'Account Security',
        body: 'Passwords are hashed before storage. Admin-only write APIs require an authenticated admin token.',
      },
    ],
    order: 11,
  },
  {
    pageId: 'cookies',
    title: 'Cookies',
    slug: 'cookies',
    category: 'Legal',
    excerpt: 'Cookie and local storage information for this demo storefront.',
    sections: [
      {
        title: 'Local Storage',
        body: 'The frontend stores the authentication token in browser local storage so signed-in users remain authenticated during the demo session.',
      },
      {
        title: 'Analytics',
        body: 'No analytics provider is configured by default in this local demo.',
      },
    ],
    order: 12,
  },
];
