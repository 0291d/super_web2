const projectTypes = [
  'Residential full-home furnishing',
  'Boutique hotel FF&E',
  'Show apartment staging',
  'Office lounge refresh',
  'Restaurant dining room',
  'Retail concept store',
  'Private villa procurement',
  'Model home installation',
  'Executive suite upgrade',
  'Multi-unit rental package',
];

const budgets = [
  'Under EUR 10,000',
  'EUR 10,000 - EUR 25,000',
  'EUR 25,000 - EUR 50,000',
  'EUR 50,000 - EUR 100,000',
  'EUR 100,000+',
];

const companies = [
  'Northline Studio',
  'Aster Interiors',
  'Maison Collective',
  'Harbor & Co.',
  'Luma Hospitality',
  'Arc House Design',
  'Studio Vale',
  'Noble Rooms',
  'Urban Nest Group',
  'Forma Projects',
];

const names = [
  ['Maya', 'Bennett'],
  ['Daniel', 'Hart'],
  ['Sofia', 'Moreau'],
  ['Lucas', 'Nguyen'],
  ['Amelia', 'Stone'],
  ['Noah', 'Carter'],
  ['Clara', 'Reed'],
  ['Ethan', 'Miles'],
  ['Isabel', 'Grant'],
  ['Theo', 'Laurent'],
  ['Nina', 'Park'],
  ['Oliver', 'Hayes'],
  ['Emma', 'Foster'],
  ['Leo', 'Walsh'],
  ['Grace', 'Kim'],
  ['Felix', 'Bauer'],
  ['Hannah', 'Blake'],
  ['Marco', 'Rossi'],
  ['Lena', 'Keller'],
  ['Aaron', 'Price'],
  ['Chloe', 'Martin'],
  ['Julian', 'Brooks'],
  ['Mila', 'Tran'],
  ['Oscar', 'Wright'],
  ['Eva', 'Sinclair'],
  ['Max', 'Turner'],
  ['Ivy', 'Cole'],
  ['Sam', 'Walker'],
  ['Ruby', 'Ellis'],
  ['Victor', 'Lane'],
];

const details = [
  'Looking for a cohesive furniture and lighting package with durable fabrics, warm materials, and delivery support for a tight opening schedule.',
  'Need trade pricing, lead times, and recommendations for layered seating, rugs, storage, and statement pieces across multiple connected rooms.',
  'The client wants a calm premium feel with practical maintenance requirements and a mix of ready-to-ship and made-to-order items.',
  'Please advise on procurement options, installation support, and whether similar finishes can be held across repeat orders.',
  'We are preparing a proposal and need a product shortlist with alternates for budget control and phased installation.',
];

export const professionalInquiries = names.map(([firstName, lastName], index) => {
  const slug = `${firstName}.${lastName}`.toLowerCase();
  return {
    name: `${firstName} ${lastName}`,
    company: companies[index % companies.length],
    email: `${slug}@example.com`,
    phone: `+1 555 ${String(180 + index).padStart(3, '0')} ${String(4100 + index).padStart(4, '0')}`,
    projectType: projectTypes[index % projectTypes.length],
    budget: budgets[index % budgets.length],
    projectDetails: details[index % details.length],
    status: index % 6 === 0 ? 'archived' : index % 3 === 0 ? 'reviewed' : 'new',
    createdAt: new Date(Date.UTC(2026, 4, 1 + index, 9 + (index % 8), 30)),
    updatedAt: new Date(Date.UTC(2026, 4, 1 + index, 10 + (index % 8), 15)),
  };
});
