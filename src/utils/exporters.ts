import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Packer,
  Paragraph,
  TabStopPosition,
  TabStopType,
  TextRun,
} from 'docx';
import { jsPDF } from 'jspdf';
import { normalizeForAts, ResumeRecord } from '../types/resume';

const DOWNLOAD_WATERMARK_TEXT = 'Prepared by My Buddy';

function buildSafeFilename(record: ResumeRecord, ext: string): string {
  const base = (record.fullName || record.recordTitle || 'resume')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return `${base || 'my_buddy'}_ats_resume.${ext}`;
}

function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Generates a true vector, selectable-text ATS-compliant PDF using jsPDF.
 * Single-column linear text flow ensures 100% parser compatibility.
 */
export function downloadAtsPdf(record: ResumeRecord): void {
  const data = normalizeForAts(record);
  const style = record.atsStyle;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'letter',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 612 pt
  const pageHeight = doc.internal.pageSize.getHeight(); // 792 pt
  const marginX = style === 'compact' ? 40 : 48;
  const marginTop = style === 'compact' ? 40 : 46;
  const marginBottom = 44;
  const contentWidth = pageWidth - marginX * 2;
  const fontFamily = style === 'classic' ? 'times' : 'helvetica';
  const baseFontSize = style === 'compact' ? 9.5 : 10;
  const lineHeight = style === 'compact' ? 13 : 14.5;

  let y = marginTop;

  const drawPageWatermark = () => {
    const prevFont = doc.getFont();
    const prevSize = doc.getFontSize();
    const prevColor = doc.getTextColor();

    doc.setFont(fontFamily, 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(DOWNLOAD_WATERMARK_TEXT, pageWidth / 2, pageHeight - 20, {
      align: 'center',
    });

    doc.setFont(prevFont.fontName, prevFont.fontStyle);
    doc.setFontSize(prevSize);
    doc.setTextColor(prevColor);
  };

  drawPageWatermark();

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - marginBottom) {
      doc.addPage();
      drawPageWatermark();
      y = marginTop;
    }
  };

  const drawSectionHeading = (title: string) => {
    ensureSpace(28);
    y += style === 'compact' ? 8 : 11;
    doc.setFont(fontFamily, 'bold');
    doc.setFontSize(style === 'compact' ? 10 : 10.5);
    doc.setTextColor(15, 23, 42);
    doc.text(title.toUpperCase(), marginX, y);
    y += 4;
    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.75);
    doc.line(marginX, y, pageWidth - marginX, y);
    y += style === 'compact' ? 11 : 13;
  };

  // Header: Full Name
  doc.setFont(fontFamily, 'bold');
  doc.setFontSize(style === 'compact' ? 18 : 20);
  doc.setTextColor(15, 23, 42);
  const nameText = data.fullName || 'Candidate Name';
  if (style === 'classic') {
    doc.text(nameText, pageWidth / 2, y, { align: 'center' });
  } else {
    doc.text(nameText, marginX, y);
  }
  y += 16;

  // Target Role subtitle (optional)
  if (data.targetTitle) {
    doc.setFont(fontFamily, 'normal');
    doc.setFontSize(11);
    doc.setTextColor(51, 65, 85);
    if (style === 'classic') {
      doc.text(data.targetTitle, pageWidth / 2, y, { align: 'center' });
    } else {
      doc.text(data.targetTitle, marginX, y);
    }
    y += 14;
  }

  // Contact Line
  const contactParts = [
    data.location,
    data.phone,
    data.email,
    data.linkedin,
    data.website,
  ].filter(Boolean);

  if (contactParts.length > 0) {
    doc.setFont(fontFamily, 'normal');
    doc.setFontSize(9.25);
    doc.setTextColor(71, 85, 105);
    const contactLine = contactParts.join('  |  ');
    const wrappedContact = doc.splitTextToSize(contactLine, contentWidth);
    wrappedContact.forEach((line: string) => {
      if (style === 'classic') {
        doc.text(line, pageWidth / 2, y, { align: 'center' });
      } else {
        doc.text(line, marginX, y);
      }
      y += 12;
    });
  }

  y += 2;
  if (style !== 'classic') {
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(1.1);
    doc.line(marginX, y, pageWidth - marginX, y);
    y += 4;
  }

  // Summary
  if (data.summary) {
    drawSectionHeading('Professional Summary');
    doc.setFont(fontFamily, 'normal');
    doc.setFontSize(baseFontSize);
    doc.setTextColor(30, 41, 59);
    const summaryLines = doc.splitTextToSize(data.summary, contentWidth);
    summaryLines.forEach((line: string) => {
      ensureSpace(lineHeight);
      doc.text(line, marginX, y);
      y += lineHeight;
    });
  }

  // Work Experience
  if (data.experiences.length > 0) {
    drawSectionHeading('Work Experience');
    data.experiences.forEach((exp, idx) => {
      ensureSpace(34);
      const dateRange = [exp.startDate, exp.current ? 'Present' : exp.endDate]
        .filter(Boolean)
        .join(' – ');

      // Role & Date line
      doc.setFont(fontFamily, 'bold');
      doc.setFontSize(baseFontSize + 0.5);
      doc.setTextColor(15, 23, 42);
      doc.text(exp.jobTitle || 'Role', marginX, y);

      if (dateRange) {
        doc.setFont(fontFamily, 'normal');
        doc.setFontSize(baseFontSize - 0.5);
        doc.setTextColor(71, 85, 105);
        doc.text(dateRange, pageWidth - marginX, y, { align: 'right' });
      }
      y += lineHeight - 1;

      // Company & Location line
      const companyLine = [exp.company, exp.location].filter(Boolean).join(' — ');
      if (companyLine) {
        doc.setFont(fontFamily, style === 'classic' ? 'italic' : 'normal');
        doc.setFontSize(baseFontSize);
        doc.setTextColor(51, 65, 85);
        doc.text(companyLine, marginX, y);
        y += lineHeight;
      }

      // Highlights
      doc.setFont(fontFamily, 'normal');
      doc.setFontSize(baseFontSize);
      doc.setTextColor(30, 41, 59);
      const bulletIndent = 12;
      exp.highlights.forEach((bullet) => {
        const wrapped = doc.splitTextToSize(bullet, contentWidth - bulletIndent);
        wrapped.forEach((line: string, lineIdx: number) => {
          ensureSpace(lineHeight);
          if (lineIdx === 0) {
            doc.text('•', marginX + 2, y);
          }
          doc.text(line, marginX + bulletIndent, y);
          y += lineHeight - 0.5;
        });
      });

      if (idx < data.experiences.length - 1) {
        y += style === 'compact' ? 5 : 8;
      }
    });
  }

  // Education
  if (data.education.length > 0) {
    drawSectionHeading('Education');
    data.education.forEach((edu, idx) => {
      ensureSpace(28);
      doc.setFont(fontFamily, 'bold');
      doc.setFontSize(baseFontSize + 0.5);
      doc.setTextColor(15, 23, 42);
      doc.text(edu.degree || 'Degree', marginX, y);

      if (edu.graduationDate) {
        doc.setFont(fontFamily, 'normal');
        doc.setFontSize(baseFontSize - 0.5);
        doc.setTextColor(71, 85, 105);
        doc.text(edu.graduationDate, pageWidth - marginX, y, { align: 'right' });
      }
      y += lineHeight - 1;

      const schoolLine = [edu.institution, edu.location].filter(Boolean).join(' — ');
      if (schoolLine) {
        doc.setFont(fontFamily, 'normal');
        doc.setFontSize(baseFontSize);
        doc.setTextColor(51, 65, 85);
        doc.text(schoolLine, marginX, y);
        y += lineHeight;
      }

      if (edu.details) {
        doc.setFont(fontFamily, 'normal');
        doc.setFontSize(baseFontSize - 0.5);
        doc.setTextColor(71, 85, 105);
        const wrappedDetails = doc.splitTextToSize(edu.details, contentWidth);
        wrappedDetails.forEach((line: string) => {
          ensureSpace(lineHeight);
          doc.text(line, marginX, y);
          y += lineHeight - 1;
        });
      }

      if (idx < data.education.length - 1) {
        y += 5;
      }
    });
  }

  // Skills
  if (data.skillGroups.length > 0) {
    drawSectionHeading('Skills');
    data.skillGroups.forEach((group) => {
      const label = `${group.category}: `;
      const itemsText = group.items.join(', ');
      const fullLine = `${label}${itemsText}`;
      const wrapped = doc.splitTextToSize(fullLine, contentWidth);
      wrapped.forEach((line: string, lineIdx: number) => {
        ensureSpace(lineHeight);
        if (lineIdx === 0 && line.startsWith(label)) {
          doc.setFont(fontFamily, 'bold');
          doc.setFontSize(baseFontSize);
          doc.setTextColor(15, 23, 42);
          doc.text(label, marginX, y);
          const labelWidth = doc.getTextWidth(label);
          doc.setFont(fontFamily, 'normal');
          doc.setTextColor(30, 41, 59);
          doc.text(line.slice(label.length), marginX + labelWidth, y);
        } else {
          doc.setFont(fontFamily, 'normal');
          doc.setFontSize(baseFontSize);
          doc.setTextColor(30, 41, 59);
          doc.text(line, marginX, y);
        }
        y += lineHeight;
      });
    });
  }

  // Projects & Certifications
  if (data.projectsAndCerts.length > 0) {
    drawSectionHeading('Projects & Certifications');
    data.projectsAndCerts.forEach((item, idx) => {
      ensureSpace(26);
      doc.setFont(fontFamily, 'bold');
      doc.setFontSize(baseFontSize);
      doc.setTextColor(15, 23, 42);
      const header = [item.title, item.issuerOrRole].filter(Boolean).join(' — ');
      doc.text(header, marginX, y);

      if (item.year) {
        doc.setFont(fontFamily, 'normal');
        doc.setFontSize(baseFontSize - 0.5);
        doc.setTextColor(71, 85, 105);
        doc.text(item.year, pageWidth - marginX, y, { align: 'right' });
      }
      y += lineHeight - 1;

      if (item.details) {
        doc.setFont(fontFamily, 'normal');
        doc.setFontSize(baseFontSize);
        doc.setTextColor(30, 41, 59);
        const wrapped = doc.splitTextToSize(item.details, contentWidth);
        wrapped.forEach((line: string) => {
          ensureSpace(lineHeight);
          doc.text(line, marginX, y);
          y += lineHeight - 0.5;
        });
      }

      if (idx < data.projectsAndCerts.length - 1) {
        y += 4;
      }
    });
  }

  doc.save(buildSafeFilename(record, 'pdf'));
}

/**
 * Generates an authentic, ATS-friendly Microsoft Word (.docx) document.
 */
export async function downloadAtsDocx(record: ResumeRecord): Promise<void> {
  const data = normalizeForAts(record);
  const isClassic = record.atsStyle === 'classic';
  const fontName = isClassic ? 'Georgia' : 'Calibri';

  const sectionHeading = (title: string) =>
    new Paragraph({
      spacing: { before: 200, after: 80 },
      border: {
        bottom: {
          color: '94A3B8',
          space: 3,
          style: BorderStyle.SINGLE,
          size: 6,
        },
      },
      children: [
        new TextRun({
          text: title.toUpperCase(),
          bold: true,
          size: 21,
          font: fontName,
          color: '0F172A',
        }),
      ],
    });

  const children: Paragraph[] = [];

  // Name
  children.push(
    new Paragraph({
      alignment: isClassic ? AlignmentType.CENTER : AlignmentType.LEFT,
      spacing: { after: 40 },
      children: [
        new TextRun({
          text: data.fullName || 'Candidate Name',
          bold: true,
          size: 36,
          font: fontName,
          color: '0F172A',
        }),
      ],
    })
  );

  // Target Role
  if (data.targetTitle) {
    children.push(
      new Paragraph({
        alignment: isClassic ? AlignmentType.CENTER : AlignmentType.LEFT,
        spacing: { after: 40 },
        children: [
          new TextRun({
            text: data.targetTitle,
            size: 22,
            font: fontName,
            color: '334155',
          }),
        ],
      })
    );
  }

  // Contact Line
  const contactParts = [
    data.location,
    data.phone,
    data.email,
    data.linkedin,
    data.website,
  ].filter(Boolean);

  if (contactParts.length > 0) {
    children.push(
      new Paragraph({
        alignment: isClassic ? AlignmentType.CENTER : AlignmentType.LEFT,
        spacing: { after: 120 },
        children: [
          new TextRun({
            text: contactParts.join('  |  '),
            size: 19,
            font: fontName,
            color: '475569',
          }),
        ],
      })
    );
  }

  // Summary
  if (data.summary) {
    children.push(sectionHeading('Professional Summary'));
    children.push(
      new Paragraph({
        spacing: { after: 100, line: 276 },
        children: [
          new TextRun({
            text: data.summary,
            size: 21,
            font: fontName,
            color: '1E293B',
          }),
        ],
      })
    );
  }

  // Experience
  if (data.experiences.length > 0) {
    children.push(sectionHeading('Work Experience'));
    data.experiences.forEach((exp) => {
      const dateRange = [exp.startDate, exp.current ? 'Present' : exp.endDate]
        .filter(Boolean)
        .join(' – ');

      children.push(
        new Paragraph({
          spacing: { before: 100, after: 20 },
          tabStops: [
            {
              type: TabStopType.RIGHT,
              position: TabStopPosition.MAX,
            },
          ],
          children: [
            new TextRun({
              text: exp.jobTitle || 'Role',
              bold: true,
              size: 22,
              font: fontName,
              color: '0F172A',
            }),
            ...(dateRange
              ? [
                  new TextRun({
                    text: `\t${dateRange}`,
                    size: 20,
                    font: fontName,
                    color: '475569',
                  }),
                ]
              : []),
          ],
        })
      );

      const companyLine = [exp.company, exp.location].filter(Boolean).join(' — ');
      if (companyLine) {
        children.push(
          new Paragraph({
            spacing: { after: 40 },
            children: [
              new TextRun({
                text: companyLine,
                italics: isClassic,
                size: 21,
                font: fontName,
                color: '334155',
              }),
            ],
          })
        );
      }

      exp.highlights.forEach((bullet) => {
        children.push(
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 40, line: 264 },
            children: [
              new TextRun({
                text: bullet,
                size: 21,
                font: fontName,
                color: '1E293B',
              }),
            ],
          })
        );
      });
    });
  }

  // Education
  if (data.education.length > 0) {
    children.push(sectionHeading('Education'));
    data.education.forEach((edu) => {
      children.push(
        new Paragraph({
          spacing: { before: 80, after: 20 },
          tabStops: [
            {
              type: TabStopType.RIGHT,
              position: TabStopPosition.MAX,
            },
          ],
          children: [
            new TextRun({
              text: edu.degree || 'Degree',
              bold: true,
              size: 21,
              font: fontName,
              color: '0F172A',
            }),
            ...(edu.graduationDate
              ? [
                  new TextRun({
                    text: `\t${edu.graduationDate}`,
                    size: 20,
                    font: fontName,
                    color: '475569',
                  }),
                ]
              : []),
          ],
        })
      );

      const schoolLine = [edu.institution, edu.location].filter(Boolean).join(' — ');
      if (schoolLine) {
        children.push(
          new Paragraph({
            spacing: { after: edu.details ? 20 : 60 },
            children: [
              new TextRun({
                text: schoolLine,
                size: 21,
                font: fontName,
                color: '334155',
              }),
            ],
          })
        );
      }

      if (edu.details) {
        children.push(
          new Paragraph({
            spacing: { after: 60 },
            children: [
              new TextRun({
                text: edu.details,
                size: 20,
                font: fontName,
                color: '475569',
              }),
            ],
          })
        );
      }
    });
  }

  // Skills
  if (data.skillGroups.length > 0) {
    children.push(sectionHeading('Skills'));
    data.skillGroups.forEach((group) => {
      children.push(
        new Paragraph({
          spacing: { after: 50, line: 264 },
          children: [
            new TextRun({
              text: `${group.category}: `,
              bold: true,
              size: 21,
              font: fontName,
              color: '0F172A',
            }),
            new TextRun({
              text: group.items.join(', '),
              size: 21,
              font: fontName,
              color: '1E293B',
            }),
          ],
        })
      );
    });
  }

  // Projects & Certifications
  if (data.projectsAndCerts.length > 0) {
    children.push(sectionHeading('Projects & Certifications'));
    data.projectsAndCerts.forEach((item) => {
      const header = [item.title, item.issuerOrRole].filter(Boolean).join(' — ');
      children.push(
        new Paragraph({
          spacing: { before: 60, after: 20 },
          tabStops: [
            {
              type: TabStopType.RIGHT,
              position: TabStopPosition.MAX,
            },
          ],
          children: [
            new TextRun({
              text: header,
              bold: true,
              size: 21,
              font: fontName,
              color: '0F172A',
            }),
            ...(item.year
              ? [
                  new TextRun({
                    text: `\t${item.year}`,
                    size: 20,
                    font: fontName,
                    color: '475569',
                  }),
                ]
              : []),
          ],
        })
      );

      if (item.details) {
        children.push(
          new Paragraph({
            spacing: { after: 60, line: 264 },
            children: [
              new TextRun({
                text: item.details,
                size: 21,
                font: fontName,
                color: '1E293B',
              }),
            ],
          })
        );
      }
    });
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 864, // 0.6 in
              bottom: 864,
              left: 936, // 0.65 in
              right: 936,
            },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: DOWNLOAD_WATERMARK_TEXT,
                    size: 16,
                    font: fontName,
                    color: '94A3B8',
                  }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  triggerBlobDownload(blob, buildSafeFilename(record, 'docx'));
}

/**
 * Generates a clean UTF-8 plain text ATS resume fallback.
 */
export function downloadAtsTxt(record: ResumeRecord): void {
  const data = normalizeForAts(record);
  const lines: string[] = [];

  lines.push(data.fullName || 'Candidate Name');
  if (data.targetTitle) lines.push(data.targetTitle);
  const contact = [data.location, data.phone, data.email, data.linkedin, data.website]
    .filter(Boolean)
    .join(' | ');
  if (contact) lines.push(contact);
  lines.push('');

  if (data.summary) {
    lines.push('PROFESSIONAL SUMMARY');
    lines.push('--------------------');
    lines.push(data.summary);
    lines.push('');
  }

  if (data.experiences.length > 0) {
    lines.push('WORK EXPERIENCE');
    lines.push('---------------');
    data.experiences.forEach((exp) => {
      const dateRange = [exp.startDate, exp.current ? 'Present' : exp.endDate]
        .filter(Boolean)
        .join(' - ');
      lines.push(`${exp.jobTitle}${dateRange ? ` (${dateRange})` : ''}`);
      const company = [exp.company, exp.location].filter(Boolean).join(' — ');
      if (company) lines.push(company);
      exp.highlights.forEach((b) => lines.push(`* ${b}`));
      lines.push('');
    });
  }

  if (data.education.length > 0) {
    lines.push('EDUCATION');
    lines.push('---------');
    data.education.forEach((edu) => {
      lines.push(
        `${edu.degree}${edu.graduationDate ? ` (${edu.graduationDate})` : ''}`
      );
      const school = [edu.institution, edu.location].filter(Boolean).join(' — ');
      if (school) lines.push(school);
      if (edu.details) lines.push(edu.details);
      lines.push('');
    });
  }

  if (data.skillGroups.length > 0) {
    lines.push('SKILLS');
    lines.push('------');
    data.skillGroups.forEach((g) => {
      lines.push(`${g.category}: ${g.items.join(', ')}`);
    });
    lines.push('');
  }

  if (data.projectsAndCerts.length > 0) {
    lines.push('PROJECTS & CERTIFICATIONS');
    lines.push('-------------------------');
    data.projectsAndCerts.forEach((item) => {
      lines.push(
        `${item.title}${item.issuerOrRole ? ` — ${item.issuerOrRole}` : ''}${
          item.year ? ` (${item.year})` : ''
        }`
      );
      if (item.details) lines.push(item.details);
      lines.push('');
    });
  }

  lines.push('---');
  lines.push(DOWNLOAD_WATERMARK_TEXT);

  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  triggerBlobDownload(blob, buildSafeFilename(record, 'txt'));
}
