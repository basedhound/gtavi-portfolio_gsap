// All of the page's copy, one object per section. Edit this file (and swap the artwork in
// src/assets/) to make the site yours. Names, projects, clients, numbers and links are samples.

export const LINKS = {
  hire: '#',
  meetTheDeveloper: '#',
  rideAlong: '#',
  projects: ['#', '#', '#'],
  codeRescue: '#',
  startProject: '#',
  openToWork: '#',
  meetup: '#',
  caseStudy: '#',
  aboutMe: '#',
  clients: '#',
  allClients: '#',
  review: '#',
  blog: '#',
  posts: ['#', '#', '#'],
  buildYourOwn: '#',
  github: '#',
  linkedin: '#',
  x: '#',
  youtube: '#',
  email: '#',
  resume: '#',
  privacy: '#',
}

export const DISCLAIMER = 'Fan-made GTA VI-style portfolio. Not affiliated with Rockstar Games.'

export const site = {
  name: 'Grand Theft Developer',
  title: 'Grand Theft Developer · Jarvis, Full-Stack Developer',
  description: `Portfolio of Jarvis, a full-stack developer in Miami. ${DISCLAIMER}`,
}

export const navbar = {
  skipLink: 'Skip to Main Content',
  homeLabel: 'Back to top',
  menuLabel: 'Open menu',
  pill: { label: 'Hire Me', href: LINKS.hire },
}

export const hero = {
  heading: 'Grand Theft Developer',
  posterAlt: 'Collage of comic-style scenes from the developer’s projects',
  tagline: ['Full-stack developer', 'Booking spring 2027'],
  button: { label: 'Hire Me', href: LINKS.hire },
  tags: ['React', 'Node.js', 'PostgreSQL'],
  disclaimer: DISCLAIMER,
}

export const meetTheDeveloper = {
  eyebrow: 'Watch',
  title: 'Meet the Developer',
  playLabel: 'Play “Meet the Developer”',
  playHref: LINKS.meetTheDeveloper,
  sceneAlt: 'The developer at dusk with a laptop under his arm, a yellow supercar and a “Projects” tower behind him',
  featured: { eyebrow: 'Watch', title: 'Ride Along', button: 'Play', href: LINKS.rideAlong },
  projects: [
    { eyebrow: 'AI', title: 'AI Book Assistant', href: LINKS.projects[0] },
    { eyebrow: '3D Web', title: '3D Basketball Website', href: LINKS.projects[1] },
    { eyebrow: 'Mobile', title: 'React Native Language App', href: LINKS.projects[2] },
  ],
}

export const services = {
  heading: 'Services',
  cards: [
    {
      title: 'Code Rescue',
      text: 'For existing teams: slow pages, flaky deploys or a codebase nobody wants to touch. I find the problems, fix them and leave it documented.',
      button: 'See What’s Included',
      href: LINKS.codeRescue,
    },
    {
      eyebrow: 'For new products',
      title: 'Full-Stack / Builds',
      text: 'Product, API and database, designed and shipped end to end, from the first sketch to production. Typically six to ten weeks.',
      button: 'Start a Project',
      href: LINKS.startProject,
    },
  ],
}

export const miami = {
  title: 'Miami, USA.',
  bio: 'I’m Jarvis, a full-stack developer who has spent eight years building products for startups, agencies and teams that need to ship fast without breaking things. I work across the whole stack, from the interface people see to the API and database behind it, and I care about code the next developer will thank me for.',
}

// In page order. Text sits on the side the art leaves free (subject right of centre → text left).
export const wideCards = [
  { eyebrow: 'Status', title: 'Open to Work', text: 'Available for freelance and contract work from spring 2027, remote or on site in Miami.', button: 'Hire Me', href: LINKS.hire, side: 'left' },
  { eyebrow: 'Community', title: 'After Hours', text: 'When the deploy’s done, I’m out with Miami’s dev crowd: meetups, talks and the occasional late-night hackathon.', button: 'View All', href: LINKS.meetup, side: 'right' },
  { eyebrow: 'Case Study', title: 'The Heist: Shipped in Six Weeks', text: 'How I rebuilt a booking platform’s checkout and cut drop-offs by 31%.', button: 'Read the Case Study', href: LINKS.caseStudy, side: 'left' },
  { eyebrow: 'Personal', title: 'Off the Clock', text: 'Open-source contributor, weekend game jammer and the one who always brings the coffee to the meetup.', button: 'More About Me', href: LINKS.aboutMe, side: 'right' },
]

export const clients = {
  header: 'Clients',
  link: { label: 'View All', href: LINKS.clients },
  cards: [
    { eyebrow: 'Sample Clients', title: 'Startups, Agencies and Product Teams', button: 'See All Clients', href: LINKS.allClients },
    { eyebrow: 'Sample Review', title: '“Incredibly fast, detail-oriented, and easy to work with.”', button: 'Read the Review', href: LINKS.review },
  ],
}

export const blog = {
  header: 'Blog',
  link: { label: 'View all', href: LINKS.blog },
  posts: [
    { title: '700 AI Agents Escaped and Became Hackers', date: 'November 3, 2026', href: LINKS.posts[0] },
    { title: 'Agentic Engineering in 2026', date: 'October 21, 2026', href: LINKS.posts[1] },
    { title: 'Think System Design & Architecture', date: 'October 8, 2026', href: LINKS.posts[2] },
  ],
}

export const footer = {
  pill: { title: 'Build Your Own', text: 'Want a portfolio like this? Here’s how it was built, step by step.', href: LINKS.buildYourOwn },
  socials: [
    { label: 'GitHub', href: LINKS.github },
    { label: 'LinkedIn', href: LINKS.linkedin },
    { label: 'X', href: LINKS.x },
    { label: 'YouTube', href: LINKS.youtube },
  ],
  links: [
    { label: 'Email', href: LINKS.email },
    { label: 'Résumé', href: LINKS.resume },
    { label: 'Privacy', href: LINKS.privacy },
  ],
  badge: { title: 'Rated D for Developer', text: 'Clean Code, Mild Refactoring, Frequent Coffee.' },
  copyright: '© 2026 Grand Theft Developer.',
  disclaimer: DISCLAIMER,
}
