import React, { useEffect, useState } from 'react';
import {
  Activity,
  FileCheck2,
  FilePlus2,
  Menu,
  X,
} from 'lucide-react';
import { ActivityView } from './components/ActivityView';
import { AtsResumeStudio } from './components/AtsResumeStudio';
import { ResumeIntakeForm } from './components/ResumeIntakeForm';
import {
  AtsTemplateStyle,
  createEmptyDraft,
  createId,
  ResumeDraft,
  ResumeRecord,
} from './types/resume';
import { downloadAtsPdf } from './utils/exporters';
import {
  createSubmittedRecord,
  loadResumeRecords,
  markRecordAsAtsConverted,
  saveResumeRecords,
  updateExistingRecord,
} from './utils/storage';

type AppView = 'enter' | 'activity' | 'ats_studio';

function recordToDraft(record: ResumeRecord): ResumeDraft {
  return {
    recordTitle: record.recordTitle,
    fullName: record.fullName,
    targetTitle: record.targetTitle,
    email: record.email,
    phone: record.phone,
    location: record.location,
    linkedin: record.linkedin,
    website: record.website,
    summary: record.summary,
    experiences:
      record.experiences.length > 0
        ? record.experiences.map((e) => ({
            ...e,
            highlights: e.highlights.length > 0 ? [...e.highlights] : [''],
          }))
        : createEmptyDraft().experiences,
    education:
      record.education.length > 0
        ? record.education.map((e) => ({ ...e }))
        : createEmptyDraft().education,
    skillGroups:
      record.skillGroups.length > 0
        ? record.skillGroups.map((g) => ({ ...g, items: [...g.items] }))
        : createEmptyDraft().skillGroups,
    projectsAndCerts: record.projectsAndCerts.map((p) => ({ ...p })),
  };
}

export default function App() {
  const [records, setRecords] = useState<ResumeRecord[]>(() =>
    loadResumeRecords()
  );
  const [view, setView] = useState<AppView>('enter');
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [formInitialDraft, setFormInitialDraft] = useState<ResumeDraft>(() =>
    createEmptyDraft()
  );
  const [formKey, setFormKey] = useState<number>(1);
  const [focusSection, setFocusSection] = useState<string | null>(null);
  const [activeStudioId, setActiveStudioId] = useState<string | null>(null);
  const [justSubmittedId, setJustSubmittedId] = useState<string | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    saveResumeRecords(records);
  }, [records]);

  const activeStudioRecord =
    records.find((r) => r.id === activeStudioId) ?? null;

  const startNewResume = () => {
    setEditingRecordId(null);
    setFocusSection(null);
    setFormInitialDraft(createEmptyDraft());
    setFormKey((k) => k + 1);
    setView('enter');
    setMobileNavOpen(false);
  };

  const handleSubmitForm = (draft: ResumeDraft) => {
    if (editingRecordId) {
      let updatedId = editingRecordId;
      setRecords((prev) =>
        prev.map((rec) => {
          if (rec.id !== editingRecordId) return rec;
          const updated = updateExistingRecord(rec, draft);
          updatedId = updated.id;
          return updated;
        })
      );
      setEditingRecordId(null);
      setFocusSection(null);
      setJustSubmittedId(updatedId);
      setView('activity');
    } else {
      const created = createSubmittedRecord(draft);
      setRecords((prev) => [created, ...prev]);
      setFormInitialDraft(createEmptyDraft());
      setFormKey((k) => k + 1);
      setJustSubmittedId(created.id);
      setView('activity');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingRecordId(null);
    setFocusSection(null);
    setView('activity');
  };

  const handleModifyRecord = (id: string, sectionId?: string) => {
    const target = records.find((r) => r.id === id);
    if (!target) return;
    setEditingRecordId(target.id);
    setFormInitialDraft(recordToDraft(target));
    setFormKey((k) => k + 1);
    setFocusSection(sectionId ?? null);
    setView('enter');
    setMobileNavOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleConvertOrOpenAts = (id: string) => {
    setRecords((prev) =>
      prev.map((rec) =>
        rec.id === id ? markRecordAsAtsConverted(rec) : rec
      )
    );
    setActiveStudioId(id);
    setJustSubmittedId(null);
    setView('ats_studio');
    setMobileNavOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleQuickDownloadPdf = (id: string) => {
    const target = records.find((r) => r.id === id);
    if (!target) return;
    const converted = markRecordAsAtsConverted(target);
    setRecords((prev) =>
      prev.map((rec) => (rec.id === id ? converted : rec))
    );
    downloadAtsPdf(converted);
  };

  const handleDuplicateRecord = (id: string) => {
    const source = records.find((r) => r.id === id);
    if (!source) return;
    const now = new Date().toISOString();
    const copy: ResumeRecord = {
      ...source,
      id: createId('rec'),
      recordTitle: `${source.recordTitle || source.fullName || 'Resume'} (Copy)`,
      createdAt: now,
      updatedAt: now,
    };
    setRecords((prev) => [copy, ...prev]);
  };

  const handleDeleteRecord = (id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
    if (activeStudioId === id) {
      setActiveStudioId(null);
      if (view === 'ats_studio') setView('activity');
    }
    if (editingRecordId === id) {
      setEditingRecordId(null);
      setFormInitialDraft(createEmptyDraft());
      setFormKey((k) => k + 1);
    }
    if (justSubmittedId === id) {
      setJustSubmittedId(null);
    }
  };

  const handleChangeAtsStyle = (style: AtsTemplateStyle) => {
    if (!activeStudioId) return;
    setRecords((prev) =>
      prev.map((rec) =>
        rec.id === activeStudioId
          ? { ...rec, atsStyle: style, updatedAt: new Date().toISOString() }
          : rec
      )
    );
  };

  const breadcrumbLabel =
    view === 'enter'
      ? editingRecordId
        ? 'Modify Details'
        : 'Enter Details'
      : view === 'activity'
      ? 'Activity'
      : 'ATS Resume Studio';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Mobile Drawer Backdrop */}
      {mobileNavOpen && (
        <div
          onClick={() => setMobileNavOpen(false)}
          className="no-print fixed inset-0 bg-slate-900/30 z-40 lg:hidden"
        />
      )}

      {/* Left Workspace Sidebar */}
      <aside
        className={`no-print fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-150 ${
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          {/* Brand Zone: Single text element wordmark */}
          <div className="h-16 px-6 flex items-center justify-between border-b border-slate-200">
            <button
              type="button"
              onClick={() => {
                setView('enter');
                setMobileNavOpen(false);
              }}
              className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 cursor-pointer"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              My Buddy
            </button>
            <button
              type="button"
              onClick={() => setMobileNavOpen(false)}
              aria-label="Close navigation"
              className="lg:hidden p-1.5 text-slate-500 hover:text-slate-900 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Primary Navigation */}
          <nav aria-label="Workspace" className="p-4 space-y-1">
            <button
              type="button"
              onClick={() => {
                if (editingRecordId) {
                  setView('enter');
                } else {
                  startNewResume();
                }
                setMobileNavOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                view === 'enter'
                  ? 'bg-blue-50 text-blue-800'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <FilePlus2 className="w-4 h-4 shrink-0" />
              <span>{editingRecordId ? 'Modify Details' : 'Enter Details'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setView('activity');
                setMobileNavOpen(false);
              }}
              className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                view === 'activity'
                  ? 'bg-blue-50 text-blue-800'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Activity className="w-4 h-4 shrink-0" />
                <span>Activity</span>
              </span>
              <span className="text-xs text-slate-500 tabular-nums">
                {records.length}
              </span>
            </button>

            {activeStudioRecord && (
              <button
                type="button"
                onClick={() => {
                  setView('ats_studio');
                  setMobileNavOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  view === 'ats_studio'
                    ? 'bg-blue-50 text-blue-800'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <FileCheck2 className="w-4 h-4 shrink-0" />
                <span className="truncate">ATS Resume Studio</span>
              </button>
            )}
          </nav>
        </div>

        {/* Quiet Workflow Guide */}
        <div className="p-5 border-t border-slate-200 text-xs text-slate-500 space-y-2">
          <p className="font-semibold text-slate-700">How My Buddy works</p>
          <ol className="space-y-1.5 leading-relaxed">
            <li>1. Enter your career details and submit.</li>
            <li>2. Open Activity to convert to an ATS resume.</li>
            <li>3. Download PDF or Word, or modify anytime.</li>
          </ol>
        </div>
      </aside>

      {/* Main Content Shell */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar Contract: Breadcrumb Left — Single Action Right */}
        <header className="no-print sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-xs border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between gap-8">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation"
              className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="font-medium text-slate-500 whitespace-nowrap shrink-0">
                My Buddy
              </span>
              <span aria-hidden="true" className="text-slate-300">
                /
              </span>
              <span className="font-semibold text-slate-900 truncate">
                {breadcrumbLabel}
              </span>
            </div>
          </div>

          <div className="shrink-0">
            {view === 'enter' ? (
              <button
                type="button"
                onClick={() => setView('activity')}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                View Activity ({records.length})
              </button>
            ) : (
              <button
                type="button"
                onClick={startNewResume}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                New Resume Details
              </button>
            )}
          </div>
        </header>

        {/* Active Viewport */}
        <main className="flex-1 px-4 sm:px-8 py-6 sm:py-8">
          {view === 'enter' && (
            <ResumeIntakeForm
              key={formKey}
              initialDraft={formInitialDraft}
              isEditing={Boolean(editingRecordId)}
              initialSection={focusSection}
              onSubmit={handleSubmitForm}
              onCancelEdit={handleCancelEdit}
            />
          )}

          {view === 'activity' && (
            <ActivityView
              records={records}
              justSubmittedId={justSubmittedId}
              onDismissBanner={() => setJustSubmittedId(null)}
              onCreateNew={startNewResume}
              onConvertOrOpenAts={handleConvertOrOpenAts}
              onModifyRecord={(id) => handleModifyRecord(id)}
              onQuickDownloadPdf={handleQuickDownloadPdf}
              onDuplicateRecord={handleDuplicateRecord}
              onDeleteRecord={handleDeleteRecord}
            />
          )}

          {view === 'ats_studio' && activeStudioRecord && (
            <AtsResumeStudio
              record={activeStudioRecord}
              onBackToActivity={() => setView('activity')}
              onChangeStyle={handleChangeAtsStyle}
              onModifyRecord={(sectionId) =>
                handleModifyRecord(activeStudioRecord.id, sectionId)
              }
            />
          )}
        </main>
      </div>
    </div>
  );
}
