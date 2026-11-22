import React, { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Check,
  FilePlus2,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  createEmptyDraft,
  createEmptyEducation,
  createEmptyExperience,
  createEmptyProjectOrCert,
  createEmptySkillGroup,
  createSampleDraft,
  ResumeDraft,
} from '../types/resume';

interface ResumeIntakeFormProps {
  initialDraft: ResumeDraft;
  isEditing: boolean;
  initialSection?: string | null;
  onSubmit: (draft: ResumeDraft) => void;
  onCancelEdit?: () => void;
}

interface ValidationErrors {
  fullName?: string;
  email?: string;
}

const SECTIONS = [
  { id: 'contact', label: '01. Contact & Identity' },
  { id: 'summary', label: '02. Professional Summary' },
  { id: 'experience', label: '03. Work Experience' },
  { id: 'education', label: '04. Education' },
  { id: 'skills', label: '05. Skills' },
  { id: 'projects', label: '06. Projects & Certifications' },
];

export const ResumeIntakeForm: React.FC<ResumeIntakeFormProps> = ({
  initialDraft,
  isEditing,
  initialSection,
  onSubmit,
  onCancelEdit,
}) => {
  const [draft, setDraft] = useState<ResumeDraft>(initialDraft);
  const [skillInputs, setSkillInputs] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    initialDraft.skillGroups.forEach((g) => {
      map[g.id] = g.items.join(', ');
    });
    return map;
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [formNotice, setFormNotice] = useState<string | null>(null);

  React.useEffect(() => {
    setDraft(initialDraft);
    const map: Record<string, string> = {};
    initialDraft.skillGroups.forEach((g) => {
      map[g.id] = g.items.join(', ');
    });
    setSkillInputs(map);
    setErrors({});
  }, [initialDraft]);

  React.useEffect(() => {
    if (initialSection) {
      const el = document.getElementById(`section-${initialSection}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [initialSection]);

  const updateField = <K extends keyof ResumeDraft>(key: K, value: ResumeDraft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    if (key === 'fullName' && errors.fullName) {
      setErrors((prev) => ({ ...prev, fullName: undefined }));
    }
    if (key === 'email' && errors.email) {
      setErrors((prev) => ({ ...prev, email: undefined }));
    }
  };

  const handleLoadSample = () => {
    const sample = createSampleDraft();
    setDraft(sample);
    const map: Record<string, string> = {};
    sample.skillGroups.forEach((g) => {
      map[g.id] = g.items.join(', ');
    });
    setSkillInputs(map);
    setErrors({});
    setFormNotice('Sample career details loaded. Review or customize any field before submitting.');
  };

  const handleReset = () => {
    const empty = createEmptyDraft();
    setDraft(empty);
    setSkillInputs({});
    setErrors({});
    setFormNotice('Form cleared.');
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: ValidationErrors = {};
    if (!draft.fullName.trim()) {
      nextErrors.fullName = 'Please enter your full name for the resume header.';
    }
    if (!draft.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) {
      nextErrors.email = 'Please enter a valid email address.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      const contactEl = document.getElementById('section-contact');
      contactEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    onSubmit(draft);
  };

  // Experience handlers
  const updateExperience = (
    idx: number,
    patch: Partial<ResumeDraft['experiences'][number]>
  ) => {
    setDraft((prev) => {
      const next = [...prev.experiences];
      next[idx] = { ...next[idx], ...patch };
      return { ...prev, experiences: next };
    });
  };

  const moveExperience = (idx: number, direction: -1 | 1) => {
    setDraft((prev) => {
      const target = idx + direction;
      if (target < 0 || target >= prev.experiences.length) return prev;
      const next = [...prev.experiences];
      [next[idx], next[target]] = [next[target], next[idx]];
      return { ...prev, experiences: next };
    });
  };

  const updateBullet = (expIdx: number, bulletIdx: number, value: string) => {
    setDraft((prev) => {
      const next = [...prev.experiences];
      const bullets = [...next[expIdx].highlights];
      bullets[bulletIdx] = value;
      next[expIdx] = { ...next[expIdx], highlights: bullets };
      return { ...prev, experiences: next };
    });
  };

  const addBullet = (expIdx: number) => {
    setDraft((prev) => {
      const next = [...prev.experiences];
      next[expIdx] = {
        ...next[expIdx],
        highlights: [...next[expIdx].highlights, ''],
      };
      return { ...prev, experiences: next };
    });
  };

  const removeBullet = (expIdx: number, bulletIdx: number) => {
    setDraft((prev) => {
      const next = [...prev.experiences];
      const filtered = next[expIdx].highlights.filter((_, i) => i !== bulletIdx);
      next[expIdx] = {
        ...next[expIdx],
        highlights: filtered.length > 0 ? filtered : [''],
      };
      return { ...prev, experiences: next };
    });
  };

  // Skill handlers
  const handleSkillItemsChange = (groupId: string, rawText: string) => {
    setSkillInputs((prev) => ({ ...prev, [groupId]: rawText }));
    const parsed = rawText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    setDraft((prev) => ({
      ...prev,
      skillGroups: prev.skillGroups.map((g) =>
        g.id === groupId ? { ...g, items: parsed } : g
      ),
    }));
  };

  const addSkillGroup = () => {
    const newGroup = createEmptySkillGroup();
    setDraft((prev) => ({
      ...prev,
      skillGroups: [...prev.skillGroups, newGroup],
    }));
    setSkillInputs((prev) => ({ ...prev, [newGroup.id]: '' }));
  };

  const filledSectionsCount = [
    Boolean(draft.fullName.trim() && draft.email.trim()),
    draft.summary.trim().length > 20,
    draft.experiences.some((e) => e.jobTitle.trim() || e.company.trim()),
    draft.education.some((e) => e.degree.trim() || e.institution.trim()),
    draft.skillGroups.some((g) => g.items.length > 0),
    draft.projectsAndCerts.some((p) => p.title.trim()),
  ].filter(Boolean).length;

  return (
    <form onSubmit={handleFormSubmit} className="max-w-6xl mx-auto">
      {/* Top Form Header Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {isEditing ? 'Modify Resume Record' : 'Enter Resume Details'}
          </h1>
          <p className="mt-1 text-sm text-slate-600 max-w-2xl">
            {isEditing
              ? 'Update any section below and save changes. Your Activity record and ATS resume stay synced.'
              : 'Fill in your career details below and submit. Your record will be saved in Activity where you can convert it into an ATS-ready resume.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {!isEditing && (
            <button
              type="button"
              onClick={handleLoadSample}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-700" />
              Load Sample Details
            </button>
          )}
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Clear Form
          </button>
          {isEditing && onCancelEdit && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            {isEditing ? 'Save Changes' : 'Submit to Activity'}
          </button>
        </div>
      </div>

      {formNotice && (
        <div
          role="status"
          className="mt-4 flex items-center justify-between gap-4 px-4 py-3 text-sm text-slate-800 bg-blue-50 border border-blue-200 rounded-lg"
        >
          <span>{formNotice}</span>
          <button
            type="button"
            onClick={() => setFormNotice(null)}
            className="text-xs font-medium text-blue-800 hover:underline whitespace-nowrap shrink-0 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_272px] gap-8 items-start">
        {/* Main Form Sheet */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-10">
          {/* 01. Contact & Identity */}
          <section id="section-contact" className="scroll-mt-24">
            <div className="mb-5">
              <h2 className="text-base font-semibold text-slate-900">
                01. Contact & Identity
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Standard plain-text contact headers ensure applicant tracking systems parse your identity accurately.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label
                  htmlFor="recordTitle"
                  className="block text-xs font-medium text-slate-700 mb-1.5"
                >
                  Record Label (for your Activity list)
                </label>
                <input
                  id="recordTitle"
                  type="text"
                  value={draft.recordTitle}
                  onChange={(e) => updateField('recordTitle', e.target.value)}
                  placeholder="e.g., Senior Frontend Engineer — Tech Companies"
                  className="w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-700"
                />
              </div>

              <div>
                <label
                  htmlFor="fullName"
                  className="block text-xs font-medium text-slate-700 mb-1.5"
                >
                  Full Name <span className="text-red-600">*</span>
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={draft.fullName}
                  onChange={(e) => updateField('fullName', e.target.value)}
                  placeholder="e.g., Priya Nair"
                  className={`w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 ${
                    errors.fullName
                      ? 'border-red-500 focus:border-red-600'
                      : 'border-slate-200 focus:border-blue-700'
                  }`}
                />
                {errors.fullName && (
                  <p className="mt-1 text-xs text-red-600">{errors.fullName}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="targetTitle"
                  className="block text-xs font-medium text-slate-700 mb-1.5"
                >
                  Target Job Title
                </label>
                <input
                  id="targetTitle"
                  type="text"
                  value={draft.targetTitle}
                  onChange={(e) => updateField('targetTitle', e.target.value)}
                  placeholder="e.g., Product Manager"
                  className="w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-700"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-medium text-slate-700 mb-1.5"
                >
                  Email Address <span className="text-red-600">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  value={draft.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="name@example.com"
                  className={`w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 ${
                    errors.email
                      ? 'border-red-500 focus:border-red-600'
                      : 'border-slate-200 focus:border-blue-700'
                  }`}
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="block text-xs font-medium text-slate-700 mb-1.5"
                >
                  Phone Number
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={draft.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="+1 (555) 234-5678"
                  className="w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-700"
                />
              </div>

              <div>
                <label
                  htmlFor="location"
                  className="block text-xs font-medium text-slate-700 mb-1.5"
                >
                  City & State / Country
                </label>
                <input
                  id="location"
                  type="text"
                  value={draft.location}
                  onChange={(e) => updateField('location', e.target.value)}
                  placeholder="Austin, TX"
                  className="w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-700"
                />
              </div>

              <div>
                <label
                  htmlFor="linkedin"
                  className="block text-xs font-medium text-slate-700 mb-1.5"
                >
                  LinkedIn Profile
                </label>
                <input
                  id="linkedin"
                  type="text"
                  value={draft.linkedin}
                  onChange={(e) => updateField('linkedin', e.target.value)}
                  placeholder="linkedin.com/in/username"
                  className="w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-700"
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="website"
                  className="block text-xs font-medium text-slate-700 mb-1.5"
                >
                  Portfolio or GitHub URL (optional)
                </label>
                <input
                  id="website"
                  type="text"
                  value={draft.website}
                  onChange={(e) => updateField('website', e.target.value)}
                  placeholder="portfolio.dev"
                  className="w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-700"
                />
              </div>
            </div>
          </section>

          {/* 02. Professional Summary */}
          <section id="section-summary" className="pt-8 border-t border-slate-200 scroll-mt-24">
            <div className="flex items-baseline justify-between gap-4 mb-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  02. Professional Summary
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  A 2–4 sentence overview highlighting your experience, core strengths, and measurable impact.
                </p>
              </div>
              <span className="text-xs text-slate-500 tabular-nums shrink-0">
                {draft.summary.trim()
                  ? `${draft.summary.trim().split(/\s+/).length} words`
                  : '0 words'}
              </span>
            </div>

            <textarea
              id="summary"
              rows={4}
              value={draft.summary}
              onChange={(e) => updateField('summary', e.target.value)}
              placeholder="Results-driven engineer with 5+ years of experience delivering scalable web platforms..."
              className="w-full px-3.5 py-2.5 text-sm leading-relaxed text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-700"
            />
          </section>

          {/* 03. Work Experience */}
          <section id="section-experience" className="pt-8 border-t border-slate-200 scroll-mt-24">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  03. Work Experience
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  List your most recent role first. Focus each bullet on an action verb and measurable outcome.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  updateField('experiences', [
                    ...draft.experiences,
                    createEmptyExperience(),
                  ])
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Role
              </button>
            </div>

            <div className="space-y-8">
              {draft.experiences.map((exp, expIdx) => (
                <div
                  key={exp.id}
                  className={expIdx > 0 ? 'pt-7 border-t border-slate-100' : ''}
                >
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <span className="text-xs font-semibold text-slate-500 tabular-nums">
                      Role {expIdx + 1}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveExperience(expIdx, -1)}
                        disabled={expIdx === 0}
                        aria-label="Move role up"
                        className="p-1.5 text-slate-500 hover:text-slate-800 disabled:opacity-30 rounded-md hover:bg-slate-100 transition-colors cursor-pointer disabled:cursor-not-allowed"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveExperience(expIdx, 1)}
                        disabled={expIdx === draft.experiences.length - 1}
                        aria-label="Move role down"
                        className="p-1.5 text-slate-500 hover:text-slate-800 disabled:opacity-30 rounded-md hover:bg-slate-100 transition-colors cursor-pointer disabled:cursor-not-allowed"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      {draft.experiences.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            updateField(
                              'experiences',
                              draft.experiences.filter((_, i) => i !== expIdx)
                            )
                          }
                          aria-label="Remove role"
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Remove
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        Job Title
                      </label>
                      <input
                        type="text"
                        value={exp.jobTitle}
                        onChange={(e) =>
                          updateExperience(expIdx, { jobTitle: e.target.value })
                        }
                        placeholder="e.g., Senior Product Designer"
                        className="w-full px-3.5 py-2 text-sm text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-700"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        Company / Organization
                      </label>
                      <input
                        type="text"
                        value={exp.company}
                        onChange={(e) =>
                          updateExperience(expIdx, { company: e.target.value })
                        }
                        placeholder="e.g., Meridian Labs"
                        className="w-full px-3.5 py-2 text-sm text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-700"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        Location
                      </label>
                      <input
                        type="text"
                        value={exp.location}
                        onChange={(e) =>
                          updateExperience(expIdx, { location: e.target.value })
                        }
                        placeholder="e.g., Remote or San Francisco, CA"
                        className="w-full px-3.5 py-2 text-sm text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-700"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1.5">
                          Start Date
                        </label>
                        <input
                          type="text"
                          value={exp.startDate}
                          onChange={(e) =>
                            updateExperience(expIdx, { startDate: e.target.value })
                          }
                          placeholder="Jan 2022"
                          className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-700"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-medium text-slate-700">
                            End Date
                          </label>
                          <label className="inline-flex items-center gap-1 text-xs text-slate-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={exp.current}
                              onChange={(e) =>
                                updateExperience(expIdx, {
                                  current: e.target.checked,
                                  endDate: e.target.checked ? 'Present' : '',
                                })
                              }
                              className="rounded border-slate-300 text-blue-700 focus:ring-blue-600"
                            />
                            Current
                          </label>
                        </div>
                        <input
                          type="text"
                          disabled={exp.current}
                          value={exp.current ? 'Present' : exp.endDate}
                          onChange={(e) =>
                            updateExperience(expIdx, { endDate: e.target.value })
                          }
                          placeholder="Dec 2024"
                          className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-200 rounded-lg disabled:bg-slate-50 disabled:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-700"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bullet highlights */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-medium text-slate-700">
                        Key Achievements & Responsibilities
                      </label>
                      <button
                        type="button"
                        onClick={() => addBullet(expIdx)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-800 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Bullet
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {exp.highlights.map((bullet, bIdx) => (
                        <div key={bIdx} className="flex items-start gap-2">
                          <span
                            aria-hidden="true"
                            className="mt-2.5 text-xs text-slate-400 select-none"
                          >
                            •
                          </span>
                          <input
                            type="text"
                            value={bullet}
                            onChange={(e) => updateBullet(expIdx, bIdx, e.target.value)}
                            placeholder="Increased deployment reliability by 35% through automated integration tests..."
                            className="flex-1 px-3 py-2 text-sm text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-700"
                          />
                          {exp.highlights.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeBullet(expIdx, bIdx)}
                              aria-label="Remove bullet"
                              className="mt-1.5 p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 04. Education */}
          <section id="section-education" className="pt-8 border-t border-slate-200 scroll-mt-24">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  04. Education
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Degrees, diplomas, or bootcamps with clear graduation dates.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  updateField('education', [
                    ...draft.education,
                    createEmptyEducation(),
                  ])
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Education
              </button>
            </div>

            <div className="space-y-6">
              {draft.education.map((edu, idx) => (
                <div
                  key={edu.id}
                  className={idx > 0 ? 'pt-6 border-t border-slate-100' : ''}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-500 tabular-nums">
                      Education {idx + 1}
                    </span>
                    {draft.education.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          updateField(
                            'education',
                            draft.education.filter((_, i) => i !== idx)
                          )
                        }
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        Degree / Program
                      </label>
                      <input
                        type="text"
                        value={edu.degree}
                        onChange={(e) => {
                          const next = [...draft.education];
                          next[idx] = { ...next[idx], degree: e.target.value };
                          updateField('education', next);
                        }}
                        placeholder="e.g., B.Tech in Computer Science"
                        className="w-full px-3.5 py-2 text-sm text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-700"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        Institution
                      </label>
                      <input
                        type="text"
                        value={edu.institution}
                        onChange={(e) => {
                          const next = [...draft.education];
                          next[idx] = { ...next[idx], institution: e.target.value };
                          updateField('education', next);
                        }}
                        placeholder="e.g., University of Michigan"
                        className="w-full px-3.5 py-2 text-sm text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-700"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        Location
                      </label>
                      <input
                        type="text"
                        value={edu.location}
                        onChange={(e) => {
                          const next = [...draft.education];
                          next[idx] = { ...next[idx], location: e.target.value };
                          updateField('education', next);
                        }}
                        placeholder="Ann Arbor, MI"
                        className="w-full px-3.5 py-2 text-sm text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-700"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        Graduation Year / Dates
                      </label>
                      <input
                        type="text"
                        value={edu.graduationDate}
                        onChange={(e) => {
                          const next = [...draft.education];
                          next[idx] = {
                            ...next[idx],
                            graduationDate: e.target.value,
                          };
                          updateField('education', next);
                        }}
                        placeholder="2021"
                        className="w-full px-3.5 py-2 text-sm text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-700"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        Honors, GPA, or Relevant Coursework (optional)
                      </label>
                      <input
                        type="text"
                        value={edu.details}
                        onChange={(e) => {
                          const next = [...draft.education];
                          next[idx] = { ...next[idx], details: e.target.value };
                          updateField('education', next);
                        }}
                        placeholder="GPA: 3.8/4.0 · Dean's List"
                        className="w-full px-3.5 py-2 text-sm text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-700"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 05. Skills */}
          <section id="section-skills" className="pt-8 border-t border-slate-200 scroll-mt-24">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  05. Skills
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Separate skills with commas. Grouped keyword lines scan cleanly in ATS software.
                </p>
              </div>
              <button
                type="button"
                onClick={addSkillGroup}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Skill Group
              </button>
            </div>

            <div className="space-y-4">
              {draft.skillGroups.map((group, idx) => (
                <div
                  key={group.id}
                  className="grid grid-cols-1 sm:grid-cols-[220px_minmax(0,1fr)_auto] gap-3 items-start"
                >
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Category
                    </label>
                    <input
                      type="text"
                      value={group.category}
                      onChange={(e) => {
                        const next = [...draft.skillGroups];
                        next[idx] = { ...next[idx], category: e.target.value };
                        updateField('skillGroups', next);
                      }}
                      placeholder="e.g., Technical Skills"
                      className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-700"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-slate-700">
                        Skills (comma-separated)
                      </label>
                      <span className="text-xs text-slate-400 tabular-nums">
                        {group.items.length} listed
                      </span>
                    </div>
                    <input
                      type="text"
                      value={skillInputs[group.id] ?? group.items.join(', ')}
                      onChange={(e) =>
                        handleSkillItemsChange(group.id, e.target.value)
                      }
                      placeholder="TypeScript, React, SQL, Project Management"
                      className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-700"
                    />
                  </div>

                  <div className="sm:pt-6">
                    {draft.skillGroups.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          updateField(
                            'skillGroups',
                            draft.skillGroups.filter((g) => g.id !== group.id)
                          )
                        }
                        aria-label="Remove skill group"
                        className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 06. Projects & Certifications */}
          <section id="section-projects" className="pt-8 border-t border-slate-200 scroll-mt-24">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  06. Projects & Certifications (Optional)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Include notable projects, publications, or professional licenses.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  updateField('projectsAndCerts', [
                    ...draft.projectsAndCerts,
                    createEmptyProjectOrCert(),
                  ])
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Entry
              </button>
            </div>

            {draft.projectsAndCerts.length === 0 ? (
              <p className="text-sm text-slate-500 py-4 border border-dashed border-slate-200 rounded-lg text-center">
                No projects or certifications added yet. Click &ldquo;Add Entry&rdquo; if you want to include them.
              </p>
            ) : (
              <div className="space-y-6">
                {draft.projectsAndCerts.map((item, idx) => (
                  <div
                    key={item.id}
                    className={idx > 0 ? 'pt-6 border-t border-slate-100' : ''}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-slate-500 tabular-nums">
                        Entry {idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateField(
                            'projectsAndCerts',
                            draft.projectsAndCerts.filter((_, i) => i !== idx)
                          )
                        }
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1.5">
                          Project or Certification Title
                        </label>
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => {
                            const next = [...draft.projectsAndCerts];
                            next[idx] = { ...next[idx], title: e.target.value };
                            updateField('projectsAndCerts', next);
                          }}
                          placeholder="e.g., PMP Certification"
                          className="w-full px-3.5 py-2 text-sm text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-700"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1.5">
                          Issuer or Role
                        </label>
                        <input
                          type="text"
                          value={item.issuerOrRole}
                          onChange={(e) => {
                            const next = [...draft.projectsAndCerts];
                            next[idx] = {
                              ...next[idx],
                              issuerOrRole: e.target.value,
                            };
                            updateField('projectsAndCerts', next);
                          }}
                          placeholder="e.g., Project Management Institute"
                          className="w-full px-3.5 py-2 text-sm text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-700"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1.5">
                          Year
                        </label>
                        <input
                          type="text"
                          value={item.year}
                          onChange={(e) => {
                            const next = [...draft.projectsAndCerts];
                            next[idx] = { ...next[idx], year: e.target.value };
                            updateField('projectsAndCerts', next);
                          }}
                          placeholder="2025"
                          className="w-full px-3.5 py-2 text-sm text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-700"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-xs font-medium text-slate-700 mb-1.5">
                          Summary / Outcome
                        </label>
                        <input
                          type="text"
                          value={item.details}
                          onChange={(e) => {
                            const next = [...draft.projectsAndCerts];
                            next[idx] = { ...next[idx], details: e.target.value };
                            updateField('projectsAndCerts', next);
                          }}
                          placeholder="Brief 1-sentence description of scope or credential."
                          className="w-full px-3.5 py-2 text-sm text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-700"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Bottom Submit Bar */}
          <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-xs text-slate-500">
              {isEditing
                ? 'Saving updates your Activity record immediately.'
                : 'Submitting stores your record in Activity so you can convert and download it anytime.'}
            </p>
            <div className="flex items-center gap-3 shrink-0">
              {isEditing && onCancelEdit && (
                <button
                  type="button"
                  onClick={onCancelEdit}
                  className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <FilePlus2 className="w-4 h-4" />
                {isEditing ? 'Save Changes' : 'Submit Details to Activity'}
              </button>
            </div>
          </div>
        </div>

        {/* Sticky Desktop Section Outline */}
        <aside className="hidden xl:block sticky top-24 bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="text-xs font-semibold text-slate-900">
              Form Sections
            </span>
            <span className="text-xs text-slate-500 tabular-nums">
              {filledSectionsCount}/6 ready
            </span>
          </div>

          <nav aria-label="Form sections" className="mt-3 space-y-1">
            {SECTIONS.map((sec) => (
              <a
                key={sec.id}
                href={`#section-${sec.id}`}
                className="block px-2.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-colors"
              >
                {sec.label}
              </a>
            ))}
          </nav>

          <div className="mt-5 pt-4 border-t border-slate-100 text-xs text-slate-500 leading-relaxed">
            After submitting, open <strong className="text-slate-700">Activity</strong> to convert your record into an ATS-compliant resume and download it as PDF or Word (.docx).
          </div>
        </aside>
      </div>
    </form>
  );
};
