export const mockFiles = [
  {
    name: 'src',
    path: '/src',
    type: 'folder',
    children: [
      {
        name: 'components',
        path: '/src/components',
        type: 'folder',
        children: [
          { name: 'App.jsx', path: '/src/components/App.jsx', type: 'file' },
          { name: 'Header.jsx', path: '/src/components/Header.jsx', type: 'file' },
          { name: 'Footer.jsx', path: '/src/components/Footer.jsx', type: 'file' },
        ],
      },
      {
        name: 'styles',
        path: '/src/styles',
        type: 'folder',
        children: [
          { name: 'main.css', path: '/src/styles/main.css', type: 'file' },
          { name: 'components.css', path: '/src/styles/components.css', type: 'file' },
        ],
      },
      { name: 'index.js', path: '/src/index.js', type: 'file' },
    ],
  },
  {
    name: 'public',
    path: '/public',
    type: 'folder',
    children: [
      { name: 'index.html', path: '/public/index.html', type: 'file' },
      { name: 'favicon.ico', path: '/public/favicon.ico', type: 'file' },
    ],
  },
  { name: 'package.json', path: '/package.json', type: 'file' },
  { name: 'README.md', path: '/README.md', type: 'file' },
];

export const mockMessages = [
  {
    id: 1,
    type: 'assistant',
    content: 'Hi! I\'m Nexa AI. I can help you build full-stack web applications. What would you like to create today?',
    timestamp: new Date(Date.now() - 3600000),
  },
  {
    id: 2,
    type: 'user',
    content: 'Create a landing page for a SaaS product',
    timestamp: new Date(Date.now() - 3500000),
  },
  {
    id: 3,
    type: 'assistant',
    content: 'Great! I\'ll create a modern landing page for your SaaS product with the following features:\n\n- Hero section with CTA\n- Features showcase\n- Pricing section\n- Contact form\n\nLet me set everything up...',
    timestamp: new Date(Date.now() - 3400000),
    actions: [
      'Creating React components...',
      'Setting up Tailwind CSS...',
      'Building responsive layout...',
      'Done! Your landing page is ready.',
    ],
  },
];