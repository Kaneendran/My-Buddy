import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Download,
  FileText,
  Pencil,
  Printer,
} from 'lucide-react';
import {
  AtsTemplateStyle,
  getAtsReadinessChecks,
  normalizeForAts,
  ResumeRecord,
} from '../types/resume';
import {
  downloadAtsDocx,
  downloadAtsPdf,
  downloadAtsTxt,
} from '../utils/exporters';

interface AtsResumeStudioProps {
  record: ResumeRecord;
  onBackToActivity: () => void;
  onChangeStyle: (style: AtsTemplateStyle) => void;
  onModifyRecord: (sectionId?: string) => void;
}

const TEMPLATE_OPTIONS: { id: AtsTemplateStyle; label: string }[] = [
  { id: 'classic', label: 'Classic Serif' },
  { id: 'modern', label: 'Modern Sans' },
  { id: 'compact', label: 'Compact Technical' },
];

export const AtsResumeStudio: React.FC<AtsResumeStudioProps> = ({
  record,
  onBackToActivity,
  onChangeStyle,
  onModifyRecord,
}) => {
  const [downloadFeedback, setDownloadFeedback] = useState<string | null>(null);
  const [isExportingDocx, setIsExportingDocx] = useState(false);

  const data = normalizeForAts(record);
  const checks = getAtsReadinessChecks(record);
  const passedCount = checks.filter((c) => c.passed).length;

  const isClassic = record.atsStyle === 'classic';
  const isCompact = record.atsStyle === 'compact';

  const contactItems = [
    data.location,
    data.phone,
    data.email,
    data.linkedin,
    data.website,
  ].filter(Boolean);

  const handleDownloadPdf = () => {
    downloadAtsPdf(record);
    setDownloadFeedback('Downloaded ATS PDF (.pdf) with selectable vector text.');
  };

  const handleDownloadDocx = async () => {
    setIsExportingDocx(true);
    try {
      await downloadAtsDocx(record);
      setDownloadFeedback('Downloaded Microsoft Word (.docx) ATS resume.');
    } finally {
      setIsExportingDocx(false);
    }
  };

  const handleDownloadTxt = () => {
    downloadAtsTxt(record);
    setDownloadFeedback('Downloaded Plain Text (.txt) ATS fallback.');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Studio Action Bar */}
      <div className="no-print flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-5 border-b border-slate-200">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBackToActivity}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Activity
          </button>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-slate-900 truncate">
              {data.recordTitle}
            </h1>
            <p className="text-xs text-slate-500">
              Single-column ATS-compliant format · Selectable text
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onModifyRecord()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Pencil className="w-3.5 h-3.5" />
            Modify Details
          </button>

          <button
            type="button"
            onClick={handleDownloadTxt}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            TXT
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>

          <button
            type="button"
            disabled={isExportingDocx}
            onClick={handleDownloadDocx}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-900 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
          >
            <Download className="w-3.5 h-3.5" />
            {isExportingDocx ? 'Preparing Word...' : 'Download Word (.docx)'}
          </button>

          <button
            type="button"
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Download ATS PDF
          </button>
        </div>
      </div>

      {/* Format Switcher & Feedback */}
      <div className="no-print mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-slate-600">
            ATS Layout Style:
          </span>
          <div
            role="radiogroup"
            aria-label="ATS layout style"
            className="inline-flex items-center gap-1 p-1 bg-slate-100 border border-slate-200 rounded-lg"
          >
            {TEMPLATE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                role="radio"
                aria-checked={record.atsStyle === opt.id}
                onClick={() => onChangeStyle(opt.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  record.atsStyle === opt.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {downloadFeedback && (
          <div
            role="status"
            className="flex items-center gap-2 text-xs font-medium text-emerald-700"
          >
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>{downloadFeedback}</span>
          </div>
        )}
      </div>

      {/* Main Workspace: Paper Sheet + Verification Rail */}
      <div className="mt-6 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_310px] gap-8 items-start">
        {/* ATS Paper Canvas */}
        <div className="bg-slate-100/80 border border-slate-200 rounded-xl p-4 sm:p-8 flex justify-center print-only-sheet">
          <article
            aria-label="ATS Resume Preview"
            style={{
              fontFamily: isClassic
                ? 'var(--font-serif-resume)'
                : 'var(--font-sans)',
            }}
            className={`print-only-sheet w-full max-w-[790px] bg-white border border-slate-200 shadow-sm text-slate-900 ${
              isCompact
                ? 'px-8 py-8 text-[13px] leading-[1.42]'
                : 'px-10 py-11 sm:px-12 sm:py-12 text-[14px] leading-[1.5]'
            }`}
          >
            {/* Header */}
            <header
              className={
                isClassic
                  ? 'text-center pb-4'
                  : 'text-left pb-4 border-b-2 border-slate-900'
              }
            >
              <h2
                className={`font-bold tracking-tight text-slate-950 ${
                  isCompact ? 'text-2xl' : 'text-[26px]'
                }`}
                style={{
                  fontFamily: isClassic
                    ? 'var(--font-serif-resume)'
                    : 'var(--font-display)',
                }}
              >
                {data.fullName || 'Candidate Name'}
              </h2>
              {data.targetTitle && (
                <p className="mt-0.5 text-[14.5px] font-medium text-slate-700">
                  {data.targetTitle}
                </p>
              )}
              {contactItems.length > 0 && (
                <p className="mt-1.5 text-[12.5px] text-slate-600 flex flex-wrap gap-x-2 gap-y-0.5 justify-start data-[classic=true]:justify-center"
                   data-classic={isClassic}>
                  {contactItems.map((item, idx) => (
                    <React.Fragment key={idx}>
                      {idx > 0 && <span aria-hidden="true">|</span>}
                      <span>{item}</span>
                    </React.Fragment>
                  ))}
                </p>
              )}
            </header>

            {/* Professional Summary */}
            {data.summary && (
              <section className={isCompact ? 'mt-4' : 'mt-5'}>
                <h3
                  className="text-[12px] font-bold tracking-wider uppercase text-slate-950 pb-1 border-b border-slate-300"
                  style={{
                    fontFamily: isClassic
                      ? 'var(--font-serif-resume)'
                      : 'var(--font-display)',
                  }}
                >
                  Professional Summary
                </h3>
                <p className="mt-2 text-slate-800">{data.summary}</p>
              </section>
            )}

            {/* Work Experience */}
            {data.experiences.length > 0 && (
              <section className={isCompact ? 'mt-4' : 'mt-5'}>
                <h3
                  className="text-[12px] font-bold tracking-wider uppercase text-slate-950 pb-1 border-b border-slate-300"
                  style={{
                    fontFamily: isClassic
                      ? 'var(--font-serif-resume)'
                      : 'var(--font-display)',
                  }}
                >
                  Work Experience
                </h3>

                <div className={isCompact ? 'mt-2.5 space-y-3' : 'mt-3 space-y-4'}>
                  {data.experiences.map((exp) => {
                    const dateRange = [
                      exp.startDate,
                      exp.current ? 'Present' : exp.endDate,
                    ]
                      .filter(Boolean)
                      .join(' – ');
                    const companyLine = [exp.company, exp.location]
                      .filter(Boolean)
                      .join(' — ');

                    return (
                      <div key={exp.id}>
                        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
                          <h4
                            className="font-bold text-slate-950 text-[14.5px]"
                            style={{
                              fontFamily: isClassic
                                ? 'var(--font-serif-resume)'
                                : 'var(--font-display)',
                            }}
                          >
                            {exp.jobTitle || 'Role'}
                          </h4>
                          {dateRange && (
                            <span className="text-[12.5px] text-slate-600 tabular-nums shrink-0">
                              {dateRange}
                            </span>
                          )}
                        </div>
                        {companyLine && (
                          <p
                            className={`text-slate-700 text-[13.5px] ${
                              isClassic ? 'italic' : 'font-medium'
                            }`}
                          >
                            {companyLine}
                          </p>
                        )}
                        {exp.highlights.length > 0 && (
                          <ul className="mt-1.5 list-disc pl-5 space-y-1 text-slate-800">
                            {exp.highlights.map((bullet, bIdx) => (
                              <li key={bIdx}>{bullet}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Education */}
            {data.education.length > 0 && (
              <section className={isCompact ? 'mt-4' : 'mt-5'}>
                <h3
                  className="text-[12px] font-bold tracking-wider uppercase text-slate-950 pb-1 border-b border-slate-300"
                  style={{
                    fontFamily: isClassic
                      ? 'var(--font-serif-resume)'
                      : 'var(--font-display)',
                  }}
                >
                  Education
                </h3>

                <div className="mt-2.5 space-y-2.5">
                  {data.education.map((edu) => {
                    const schoolLine = [edu.institution, edu.location]
                      .filter(Boolean)
                      .join(' — ');
                    return (
                      <div key={edu.id}>
                        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
                          <h4
                            className="font-bold text-slate-950 text-[14px]"
                            style={{
                              fontFamily: isClassic
                                ? 'var(--font-serif-resume)'
                                : 'var(--font-display)',
                            }}
                          >
                            {edu.degree || 'Degree'}
                          </h4>
                          {edu.graduationDate && (
                            <span className="text-[12.5px] text-slate-600 tabular-nums shrink-0">
                              {edu.graduationDate}
                            </span>
                          )}
                        </div>
                        {schoolLine && (
                          <p className="text-[13.5px] text-slate-700">
                            {schoolLine}
                          </p>
                        )}
                        {edu.details && (
                          <p className="text-[12.5px] text-slate-600 mt-0.5">
                            {edu.details}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Skills */}
            {data.skillGroups.length > 0 && (
              <section className={isCompact ? 'mt-4' : 'mt-5'}>
                <h3
                  className="text-[12px] font-bold tracking-wider uppercase text-slate-950 pb-1 border-b border-slate-300"
                  style={{
                    fontFamily: isClassic
                      ? 'var(--font-serif-resume)'
                      : 'var(--font-display)',
                  }}
                >
                  Skills
                </h3>

                <div className="mt-2 space-y-1 text-slate-800">
                  {data.skillGroups.map((group) => (
                    <p key={group.id}>
                      <strong className="font-semibold text-slate-950">
                        {group.category}:{' '}
                      </strong>
                      <span>{group.items.join(', ')}</span>
                    </p>
                  ))}
                </div>
              </section>
            )}

            {/* Projects & Certifications */}
            {data.projectsAndCerts.length > 0 && (
              <section className={isCompact ? 'mt-4' : 'mt-5'}>
                <h3
                  className="text-[12px] font-bold tracking-wider uppercase text-slate-950 pb-1 border-b border-slate-300"
                  style={{
                    fontFamily: isClassic
                      ? 'var(--font-serif-resume)'
                      : 'var(--font-display)',
                  }}
                >
                  Projects & Certifications
                </h3>

                <div className="mt-2.5 space-y-2.5">
                  {data.projectsAndCerts.map((item) => (
                    <div key={item.id}>
                      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
                        <h4
                          className="font-bold text-slate-950 text-[13.5px]"
                          style={{
                            fontFamily: isClassic
                              ? 'var(--font-serif-resume)'
                              : 'var(--font-display)',
                          }}
                        >
                          {[item.title, item.issuerOrRole]
                            .filter(Boolean)
                            .join(' — ')}
                        </h4>
                        {item.year && (
                          <span className="text-[12.5px] text-slate-600 tabular-nums shrink-0">
                            {item.year}
                          </span>
                        )}
                      </div>
                      {item.details && (
                        <p className="text-slate-700 mt-0.5">{item.details}</p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </article>
        </div>

        {/* ATS Readiness Checklist Rail */}
        <aside className="no-print bg-white border border-slate-200 rounded-xl p-5 space-y-5 sticky top-24">
          <div className="pb-3 border-b border-slate-100 flex items-baseline justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-900">
              ATS Readiness Checks
            </h2>
            <span className="text-xs font-medium text-slate-600 tabular-nums">
              {passedCount} of {checks.length} passed
            </span>
          </div>

          <ul className="space-y-3.5">
            {checks.map((check) => (
              <li key={check.id} className="flex items-start gap-2.5">
                {check.passed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                )}
                <div className="min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-900">
                      {check.label}
                    </p>
                    {!check.passed && (
                      <button
                        type="button"
                        onClick={() => onModifyRecord(check.sectionId)}
                        className="text-xs font-medium text-blue-700 hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        Fix
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    {check.detail}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-xs font-semibold text-slate-900 mb-2">
              Export Format Guarantees
            </h3>
            <ul className="space-y-1.5 text-xs text-slate-600">
              <li>• Single-column reading order for Workday, Greenhouse, and Lever</li>
              <li>• Real selectable vector text in PDF and Word (.docx)</li>
              <li>• Standard headings with zero layout tables or hidden layers</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
};
