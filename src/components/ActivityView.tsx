import React, { useMemo, useState } from 'react';
import {
  Copy,
  Download,
  FileCheck2,
  FilePlus2,
  FileText,
  Pencil,
  Search,
  Trash2,
} from 'lucide-react';
import { formatTimestamp, ResumeRecord } from '../types/resume';

interface ActivityViewProps {
  records: ResumeRecord[];
  justSubmittedId?: string | null;
  onDismissBanner: () => void;
  onCreateNew: () => void;
  onConvertOrOpenAts: (id: string) => void;
  onModifyRecord: (id: string) => void;
  onQuickDownloadPdf: (id: string) => void;
  onDuplicateRecord: (id: string) => void;
  onDeleteRecord: (id: string) => void;
}

type StatusFilter = 'all' | 'submitted' | 'ats_converted';

export const ActivityView: React.FC<ActivityViewProps> = ({
  records,
  justSubmittedId,
  onDismissBanner,
  onCreateNew,
  onConvertOrOpenAts,
  onModifyRecord,
  onQuickDownloadPdf,
  onDuplicateRecord,
  onDeleteRecord,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filteredRecords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return records.filter((rec) => {
      if (filter !== 'all' && rec.status !== filter) return false;
      if (!q) return true;
      const haystack = [
        rec.recordTitle,
        rec.fullName,
        rec.targetTitle,
        rec.email,
        ...rec.skillGroups.flatMap((g) => g.items),
        ...rec.experiences.map((e) => `${e.jobTitle} ${e.company}`),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [records, searchQuery, filter]);

  const convertedCount = records.filter((r) => r.status === 'ats_converted').length;
  const pendingCount = records.filter((r) => r.status === 'submitted').length;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Activity
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage your submitted resume records, convert any record into an ATS-ready resume, download files, or modify details anytime.
          </p>
        </div>

        <button
          type="button"
          onClick={onCreateNew}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <FilePlus2 className="w-4 h-4" />
          New Resume Details
        </button>
      </div>

      {/* Just-submitted confirmation prompt */}
      {justSubmittedId && (
        <div
          role="status"
          className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3.5 bg-emerald-50 border border-emerald-200 rounded-xl"
        >
          <div className="flex items-center gap-2.5 text-sm text-emerald-950">
            <FileCheck2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>
              Your details were saved to Activity. Click{' '}
              <strong>Convert to ATS Resume</strong> on the record below to format and download it.
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onConvertOrOpenAts(justSubmittedId)}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 transition-colors whitespace-nowrap cursor-pointer"
            >
              Convert Now
            </button>
            <button
              type="button"
              onClick={onDismissBanner}
              className="text-xs font-medium text-emerald-800 hover:underline whitespace-nowrap cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      {records.length > 0 && (
        <div className="mt-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, role, company, or skill..."
              className="w-full pl-9 pr-3.5 py-2 text-sm text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-700"
            />
          </div>

          <div
            role="tablist"
            aria-label="Filter resume records"
            className="inline-flex items-center gap-1 p-1 bg-slate-100 border border-slate-200 rounded-lg self-start"
          >
            <button
              type="button"
              role="tab"
              aria-selected={filter === 'all'}
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                filter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({records.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={filter === 'submitted'}
              onClick={() => setFilter('submitted')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                filter === 'submitted'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Needs Conversion ({pendingCount})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={filter === 'ats_converted'}
              onClick={() => setFilter('ats_converted')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                filter === 'ats_converted'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ATS Ready ({convertedCount})
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {records.length === 0 ? (
        <div className="mt-8 bg-white border border-slate-200 rounded-xl p-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <h2 className="mt-4 text-base font-semibold text-slate-900">
            No resume records in Activity yet
          </h2>
          <p className="mt-1.5 text-sm text-slate-600 max-w-md mx-auto">
            Enter your contact info, work experience, education, and skills first. Once submitted, your record will appear here ready for ATS conversion and download.
          </p>
          <button
            type="button"
            onClick={onCreateNew}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors cursor-pointer"
          >
            <FilePlus2 className="w-4 h-4" />
            Enter Resume Details
          </button>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="mt-6 bg-white border border-slate-200 rounded-xl p-10 text-center">
          <p className="text-sm text-slate-600">
            No records match your current search or filter.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setFilter('all');
            }}
            className="mt-3 text-xs font-semibold text-blue-700 hover:underline cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="mt-5 bg-white border border-slate-200 rounded-xl divide-y divide-slate-200">
          {filteredRecords.map((rec) => {
            const totalSkills = rec.skillGroups.reduce(
              (sum, g) => sum + g.items.length,
              0
            );
            const isConverted = rec.status === 'ats_converted';
            const isConfirmingDelete = confirmDeleteId === rec.id;

            return (
              <div
                key={rec.id}
                className={`p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 transition-colors ${
                  justSubmittedId === rec.id ? 'bg-blue-50/40' : 'hover:bg-slate-50/60'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                    <h2 className="text-base font-semibold text-slate-900 truncate">
                      {rec.recordTitle || rec.fullName || 'Untitled Resume'}
                    </h2>
                    {rec.fullName && rec.recordTitle !== rec.fullName && (
                      <span className="text-xs text-slate-500">
                        {rec.fullName}
                      </span>
                    )}
                  </div>

                  {/* Clean unboxed metadata with typographic separators */}
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                    <span
                      className={
                        isConverted
                          ? 'font-medium text-emerald-700'
                          : 'font-medium text-amber-700'
                      }
                    >
                      {isConverted
                        ? 'ATS Resume Converted'
                        : 'Details Submitted — Ready to Convert'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">
                      Updated {formatTimestamp(rec.updatedAt)}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">
                      {rec.experiences.length}{' '}
                      {rec.experiences.length === 1 ? 'role' : 'roles'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">{totalSkills} skills</span>
                  </div>
                </div>

                {/* Action Controls */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {isConfirmingDelete ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-red-700 font-medium">
                        Delete this record?
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteRecord(rec.id);
                          setConfirmDeleteId(null);
                        }}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors whitespace-nowrap cursor-pointer"
                      >
                        Confirm Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => onConvertOrOpenAts(rec.id)}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          isConverted
                            ? 'text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100'
                            : 'text-white bg-blue-700 hover:bg-blue-800'
                        }`}
                      >
                        <FileCheck2 className="w-3.5 h-3.5" />
                        {isConverted
                          ? 'Open ATS Resume'
                          : 'Convert to ATS Resume'}
                      </button>

                      <button
                        type="button"
                        onClick={() => onModifyRecord(rec.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Modify
                      </button>

                      <button
                        type="button"
                        onClick={() => onQuickDownloadPdf(rec.id)}
                        title="Download professional ATS PDF"
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download PDF
                      </button>

                      <button
                        type="button"
                        onClick={() => onDuplicateRecord(rec.id)}
                        title="Duplicate record"
                        aria-label="Duplicate record"
                        className="p-2 text-slate-500 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shrink-0 cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(rec.id)}
                        title="Delete record"
                        aria-label="Delete record"
                        className="p-2 text-slate-500 hover:text-red-600 bg-white border border-slate-200 rounded-lg hover:bg-red-50 transition-colors shrink-0 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
