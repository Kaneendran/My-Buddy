export type AtsTemplateStyle = 'classic' | 'modern' | 'compact';

export type RecordStatus = 'submitted' | 'ats_converted';

export interface ExperienceItem {
  id: string;
  jobTitle: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  highlights: string[];
}

export interface EducationItem {
  id: string;
  degree: string;
  institution: string;
  location: string;
  graduationDate: string;
  details: string;
}

export interface SkillGroup {
  id: string;
  category: string;
  items: string[];
}

export interface ProjectOrCertItem {
  id: string;
  title: string;
  issuerOrRole: string;
  year: string;
  details: string;
}

export interface ResumeDraft {
  recordTitle: string;
  fullName: string;
  targetTitle: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  website: string;
  summary: string;
  experiences: ExperienceItem[];
  education: EducationItem[];
  skillGroups: SkillGroup[];
  projectsAndCerts: ProjectOrCertItem[];
}

export interface ResumeRecord extends ResumeDraft {
  id: string;
  status: RecordStatus;
  atsStyle: AtsTemplateStyle;
  createdAt: string;
  updatedAt: string;
  convertedAt?: string;
}

export interface AtsCheckItem {
  id: string;
  label: string;
  detail: string;
  passed: boolean;
  sectionId: 'contact' | 'summary' | 'experience' | 'education' | 'skills';
}

export function createId(prefix = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function createEmptyExperience(): ExperienceItem {
  return {
    id: createId('exp'),
    jobTitle: '',
    company: '',
    location: '',
    startDate: '',
    endDate: '',
    current: false,
    highlights: [''],
  };
}

export function createEmptyEducation(): EducationItem {
  return {
    id: createId('edu'),
    degree: '',
    institution: '',
    location: '',
    graduationDate: '',
    details: '',
  };
}

export function createEmptySkillGroup(): SkillGroup {
  return {
    id: createId('skl'),
    category: '',
    items: [],
  };
}

export function createEmptyProjectOrCert(): ProjectOrCertItem {
  return {
    id: createId('prj'),
    title: '',
    issuerOrRole: '',
    year: '',
    details: '',
  };
}

export function createEmptyDraft(): ResumeDraft {
  return {
    recordTitle: '',
    fullName: '',
    targetTitle: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    website: '',
    summary: '',
    experiences: [createEmptyExperience()],
    education: [createEmptyEducation()],
    skillGroups: [
      { id: createId('skl'), category: 'Core Skills', items: [] },
      { id: createId('skl'), category: 'Tools & Technologies', items: [] },
    ],
    projectsAndCerts: [],
  };
}

export function createSampleDraft(): ResumeDraft {
  return {
    recordTitle: 'Senior Software Engineer — Product Platform',
    fullName: 'Aarav Menon',
    targetTitle: 'Senior Software Engineer',
    email: 'aarav.menon@example.com',
    phone: '+1 (415) 555-0194',
    location: 'Seattle, WA',
    linkedin: 'linkedin.com/in/aaravmenon',
    website: 'aaravmenon.dev',
    summary:
      'Full-stack software engineer with 7+ years of experience architecting high-throughput web applications, distributed APIs, and accessible design systems. Proven track record reducing page load latency by 42% and leading cross-functional teams from technical design through production launch.',
    experiences: [
      {
        id: createId('exp'),
        jobTitle: 'Senior Software Engineer',
        company: 'Northwind Cloud Systems',
        location: 'Seattle, WA',
        startDate: 'Mar 2023',
        endDate: 'Present',
        current: true,
        highlights: [
          'Led architecture and delivery of a real-time analytics workspace serving 180,000+ monthly active enterprise users using React, TypeScript, and Node.js.',
          'Reduced p95 API response latency from 460ms to 190ms by introducing Redis query caching and optimizing PostgreSQL composite indexes.',
          'Mentored 5 mid-level engineers through structured RFC reviews, automated testing standards, and CI/CD pipeline improvements.',
        ],
      },
      {
        id: createId('exp'),
        jobTitle: 'Software Engineer',
        company: 'Cascadia Commerce',
        location: 'Portland, OR',
        startDate: 'Jun 2019',
        endDate: 'Feb 2023',
        current: false,
        highlights: [
          'Built checkout and invoice export services processing $24M+ in annual transaction volume with 99.98% uptime.',
          'Migrated legacy REST endpoints to typed schemas and reduced frontend bundle size by 34%, lifting mobile conversion by 11%.',
          'Partnered with product designers to ship WCAG AA-compliant form controls and keyboard navigation workflows.',
        ],
      },
    ],
    education: [
      {
        id: createId('edu'),
        degree: 'B.S. in Computer Science',
        institution: 'University of Washington',
        location: 'Seattle, WA',
        graduationDate: '2019',
        details: 'Magna Cum Laude · Distributed Systems & Human-Computer Interaction',
      },
    ],
    skillGroups: [
      {
        id: createId('skl'),
        category: 'Languages & Frameworks',
        items: ['TypeScript', 'JavaScript', 'React', 'Node.js', 'Python', 'SQL', 'GraphQL'],
      },
      {
        id: createId('skl'),
        category: 'Infrastructure & Tools',
        items: ['PostgreSQL', 'Redis', 'Docker', 'AWS', 'GitHub Actions', 'Playwright', 'Tailwind CSS'],
      },
    ],
    projectsAndCerts: [
      {
        id: createId('prj'),
        title: 'AWS Certified Solutions Architect — Associate',
        issuerOrRole: 'Amazon Web Services',
        year: '2024',
        details: 'Credential verified for cloud architecture, security boundaries, and resilient deployment patterns.',
      },
    ],
  };
}

function cleanLine(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/^[\s•\-\*▪▸]+/, '')
    .trim();
}

function capitalizeFirst(text: string): string {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function cleanDisplayUrl(url: string): string {
  return url
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/\/+$/, '');
}

/**
 * Normalizes raw user-entered details into a clean, ATS-compliant structure:
 * - Removes empty placeholder rows
 * - Strips stray bullet symbols so PDF/DOCX/Preview never show double bullets
 * - Normalizes whitespace and capitalizes achievement statements
 */
export function normalizeForAts(draft: ResumeDraft): ResumeDraft {
  const fullName = cleanLine(draft.fullName);
  const targetTitle = cleanLine(draft.targetTitle);
  const recordTitle =
    cleanLine(draft.recordTitle) ||
    [fullName, targetTitle].filter(Boolean).join(' — ') ||
    'Untitled Resume';

  const experiences = draft.experiences
    .map((exp) => ({
      ...exp,
      jobTitle: cleanLine(exp.jobTitle),
      company: cleanLine(exp.company),
      location: cleanLine(exp.location),
      startDate: cleanLine(exp.startDate),
      endDate: exp.current ? 'Present' : cleanLine(exp.endDate),
      highlights: exp.highlights
        .map((line) => capitalizeFirst(cleanLine(line)))
        .filter(Boolean),
    }))
    .filter((exp) => exp.jobTitle || exp.company || exp.highlights.length > 0);

  const education = draft.education
    .map((edu) => ({
      ...edu,
      degree: cleanLine(edu.degree),
      institution: cleanLine(edu.institution),
      location: cleanLine(edu.location),
      graduationDate: cleanLine(edu.graduationDate),
      details: cleanLine(edu.details),
    }))
    .filter((edu) => edu.degree || edu.institution);

  const skillGroups = draft.skillGroups
    .map((group) => ({
      ...group,
      category: cleanLine(group.category) || 'Skills',
      items: Array.from(
        new Set(group.items.map((item) => cleanLine(item)).filter(Boolean))
      ),
    }))
    .filter((group) => group.items.length > 0);

  const projectsAndCerts = draft.projectsAndCerts
    .map((item) => ({
      ...item,
      title: cleanLine(item.title),
      issuerOrRole: cleanLine(item.issuerOrRole),
      year: cleanLine(item.year),
      details: cleanLine(item.details),
    }))
    .filter((item) => item.title || item.details);

  return {
    recordTitle,
    fullName,
    targetTitle,
    email: draft.email.trim(),
    phone: cleanLine(draft.phone),
    location: cleanLine(draft.location),
    linkedin: cleanDisplayUrl(draft.linkedin),
    website: cleanDisplayUrl(draft.website),
    summary: draft.summary.replace(/\s+/g, ' ').trim(),
    experiences,
    education,
    skillGroups,
    projectsAndCerts,
  };
}

export function getAtsReadinessChecks(record: ResumeDraft): AtsCheckItem[] {
  const normalized = normalizeForAts(record);
  const allBullets = normalized.experiences.flatMap((e) => e.highlights);
  const hasMetrics = allBullets.some((b) => /\d+%|\$\d+|\d+\+|\d+x|\b\d{2,}\b/i.test(b));
  const totalSkills = normalized.skillGroups.reduce((sum, g) => sum + g.items.length, 0);

  return [
    {
      id: 'contact',
      label: 'Contact details complete',
      detail:
        normalized.email && normalized.phone
          ? 'Name, email, and phone are formatted in plain selectable text.'
          : 'Add both an email address and phone number for recruiter reachability.',
      passed: Boolean(normalized.fullName && normalized.email && normalized.phone),
      sectionId: 'contact',
    },
    {
      id: 'summary',
      label: 'Professional summary included',
      detail:
        normalized.summary.length >= 60
          ? `${normalized.summary.split(/\s+/).filter(Boolean).length} words targeting ${normalized.targetTitle || 'your role'}.`
          : 'Write a concise 2–4 sentence summary aligned with your target role.',
      passed: normalized.summary.length >= 60,
      sectionId: 'summary',
    },
    {
      id: 'experience',
      label: 'Structured work experience bullets',
      detail:
        allBullets.length >= 2
          ? `${normalized.experiences.length} role(s) with ${allBullets.length} clean bullet statements.`
          : 'Add work experience roles with bulleted achievements.',
      passed: normalized.experiences.length >= 1 && allBullets.length >= 2,
      sectionId: 'experience',
    },
    {
      id: 'metrics',
      label: 'Quantified impact detected',
      detail: hasMetrics
        ? 'Measurable numbers or percentages found in your experience bullets.'
        : 'Consider adding numbers, percentages, or team sizes to quantify outcomes.',
      passed: hasMetrics,
      sectionId: 'experience',
    },
    {
      id: 'education',
      label: 'Education section populated',
      detail:
        normalized.education.length >= 1
          ? `${normalized.education.length} education entry formatted with standard dates.`
          : 'Add your degree, certification, or relevant coursework.',
      passed: normalized.education.length >= 1,
      sectionId: 'education',
    },
    {
      id: 'skills',
      label: 'ATS keyword skills listed',
      detail:
        totalSkills >= 5
          ? `${totalSkills} keyword skills grouped for clean parser extraction.`
          : 'List at least 5 relevant technical or core skills.',
      passed: totalSkills >= 5,
      sectionId: 'skills',
    },
  ];
}

export function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Just now';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}
