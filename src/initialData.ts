import { Project } from './types';

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    name: 'Apex Retail Rebuild',
    description: 'Complete rebuild of our customer-facing retail platform with unified checkout, responsive frameworks, and native app wrappers.',
    category: 'Development',
    status: 'active',
    priority: 'high',
    startDate: '2026-06-01',
    endDate: '2026-09-15',
    owner: 'Alex Chen (Tech Lead)',
    initiatives: [
      { id: 'init-1-1', title: 'Design modern responsive checkout interface', progress: 100, completed: true },
      { id: 'init-1-2', title: 'Build high-throughput GraphQL Gateway APIs', progress: 80, completed: false },
      { id: 'init-1-3', title: 'Integrate multi-currency Stripe SDK', progress: 50, completed: false },
      { id: 'init-1-4', title: 'Implement automated regression testing suite', progress: 20, completed: false }
    ],
    milestones: [
      { id: 'mile-1-1', title: 'UI/UX Interactive Prototypes Approved', date: '2026-06-25', completed: true, notes: 'Design sign-off from VP of Product.' },
      { id: 'mile-1-2', title: 'Alpha Release & QA Hand-off', date: '2026-07-28', completed: false, notes: 'Deploy to staging environments for regression tests.' },
      { id: 'mile-1-3', title: 'Production Rollout & Store Submission', date: '2026-09-15', completed: false, notes: 'Synchronized launch on Google Play & App Store.' }
    ],
    tags: ['urgent', 'work', 'technical'],
    collaborators: ['Alex Chen', 'Elena Rostova', 'Tariq Al-Fayed', 'Clara Schumann']
  },
  {
    id: 'proj-2',
    name: 'Next-Gen Brand System',
    description: 'Revitalize company-wide design guidelines, primary color systems, corporate typography, and digital asset templates.',
    category: 'Design',
    status: 'active',
    priority: 'medium',
    startDate: '2026-07-01',
    endDate: '2026-08-25',
    owner: 'Sarah Martinez (Creative Dir.)',
    initiatives: [
      { id: 'init-2-1', title: 'Establish Slate-Teal accessibility color palette', progress: 100, completed: true },
      { id: 'init-2-2', title: 'Re-author guidelines and UI kit components', progress: 60, completed: false },
      { id: 'init-2-3', title: 'Draft social media & newsletter canvas templates', progress: 30, completed: false }
    ],
    milestones: [
      { id: 'mile-2-1', title: 'Core Palette & Logo Guidelines Signed Off', date: '2026-07-12', completed: true, notes: 'Ensures Web Content Accessibility Guidelines AA standard.' },
      { id: 'mile-2-2', title: 'Figma Token Library Export', date: '2026-08-05', completed: false, notes: 'Direct consumption path for front-end engineers.' },
      { id: 'mile-2-3', title: 'Internal Brand Kit Masterclass', date: '2026-08-25', completed: false, notes: 'Hands-on session with the marketing team.' }
    ],
    tags: ['work', 'personal', 'research'],
    collaborators: ['Sarah Martinez', 'Sofia Kovalevskaya', 'Marcus Aurelius']
  },
  {
    id: 'proj-3',
    name: 'Growth SEO & Content Initiative',
    description: 'Produce high-quality technical content pipelines, optimize page indexing, and secure referral link alignments.',
    category: 'Marketing',
    status: 'planning',
    priority: 'medium',
    startDate: '2026-08-01',
    endDate: '2026-11-01',
    owner: 'Marcus Aurelius (Growth Lead)',
    initiatives: [
      { id: 'init-3-1', title: 'Conduct comprehensive competitor keyword gap audit', progress: 90, completed: false },
      { id: 'init-3-2', title: 'Draft 10 technical deep-dive feature guides', progress: 0, completed: false },
      { id: 'init-3-3', title: 'Migrate media library to edge CDN nodes', progress: 15, completed: false }
    ],
    milestones: [
      { id: 'mile-3-1', title: 'SEO Gap Discovery Report', date: '2026-08-15', completed: false, notes: 'Identifies high-value low-competition targets.' },
      { id: 'mile-3-2', title: 'First Batch (5 Guides) Published', date: '2026-09-30', completed: false, notes: 'Publishing schedule with social amplification.' }
    ],
    tags: ['marketing', 'research'],
    collaborators: ['Marcus Aurelius', 'Tariq Al-Fayed']
  },
  {
    id: 'proj-4',
    name: 'Cloud Security Audit',
    description: 'Perform penetration tests, review IAM roles, secure API endpoints, and consolidate resource pools.',
    category: 'Operations',
    status: 'on-hold',
    priority: 'high',
    startDate: '2026-05-15',
    endDate: '2026-10-10',
    owner: 'DevOps Security Squad',
    initiatives: [
      { id: 'init-4-1', title: 'Rotate expired keys and credentials', progress: 100, completed: true },
      { id: 'init-4-2', title: 'Deprecate old database staging targets', progress: 40, completed: false }
    ],
    milestones: [
      { id: 'mile-4-1', title: 'Credential Auditing Protocol Draft', date: '2026-06-10', completed: true, notes: 'Formalized internal security standard.' },
      { id: 'mile-4-2', title: 'Full Sandbox Infrastructure Roll-Down', date: '2026-10-01', completed: false, notes: 'Terminates idle legacy servers to lower risk and cost.' }
    ],
    tags: ['urgent', 'internal', 'technical'],
    collaborators: ['Alex Chen', 'Sofia Kovalevskaya', 'John Doe']
  }
];
