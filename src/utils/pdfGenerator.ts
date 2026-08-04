import { jsPDF } from 'jspdf';
import { ProjectState, UserProfile } from '../types';
import { GENERAL_STEPS, PART_STEPS } from '../questionnaire';

// Helper to translate labels from question IDs
const getGeneralQuestionLabel = (id: string): string => {
  const q = GENERAL_STEPS[0].questions.find(item => item.id === id);
  return q ? `[${id}] ${q.label}` : id;
};

const getPartQuestionLabel = (id: string): string => {
  for (const step of PART_STEPS) {
    const q = step.questions.find(item => item.id === id);
    if (q) return `[${id}] ${q.label}`;
  }
  return id;
};

export const generateProjectPdf = (project: ProjectState, profile?: UserProfile | null) => {
  const isAdmin = !!profile?.isAdmin;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2); // 180mm
  let y = 20;

  // Helper to verify and handle page breaks
  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - margin) {
      doc.addPage();
      y = margin + 5;
      drawPageHeaderFooter();
    }
  };

  const drawPageHeaderFooter = () => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(`SCAPE Bin-Picking Evaluation Report - Project: ${project.projectName || 'Unknown'}`, margin, pageHeight - 8);
    doc.text(`Page ${doc.internal.pages.length - 1}`, pageWidth - margin - 15, pageHeight - 8);
  };

  // 1. Draw Title Header on First Page
  // Header Banner background (Dark Slate #0f172a)
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 42, 'F');

  // Red accent line
  doc.setFillColor(191, 30, 46); // #bf1e2e Scape Red
  doc.rect(0, 42, pageWidth, 2, 'F');

  // Title Text inside Banner
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text('SCAPE BIN-PICKING EVALUATION', margin, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text(`Case ID: #${(project.id || 'N/A').toUpperCase()} | Created: ${new Date(project.createdAt?.seconds ? project.createdAt.seconds * 1000 : project.createdAt || Date.now()).toLocaleDateString()}`, margin, 28);
  doc.text(`Status: ${project.status.toUpperCase()}`, margin, 35);

  y = 55; // Reset y to start contents below banner

  // 2. Project Metadata block
  checkPageBreak(30);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text('Customer Contact Information', margin, y);
  y += 7;

  doc.setDrawColor(226, 232, 240); // slate-200
  doc.line(margin, y, margin + contentWidth, y);
  y += 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105); // slate-600

  const metaData = [
    { label: 'Project Name:', value: project.projectName },
    { label: 'Contact Name:', value: project.ownerName || 'Unknown Owner' },
    { label: 'Company / Org:', value: project.ownerCompany || 'No Company' },
    { label: 'Email Address:', value: project.ownerEmail || 'Unknown Email' },
    { label: 'Phone Number:', value: project.ownerPhone || 'Unknown Phone' }
  ];

  metaData.forEach(item => {
    checkPageBreak(6);
    doc.setFont('helvetica', 'bold');
    doc.text(item.label, margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(String(item.value || 'N/A'), margin + 40, y);
    y += 6;
  });

  y += 6;

  // 3. Step 0 General Responses
  checkPageBreak(25);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text('Project & Cell Configuration', margin, y);
  y += 7;
  doc.line(margin, y, margin + contentWidth, y);
  y += 5;

  doc.setFontSize(10);
  Object.entries(project.generalResponses || {}).forEach(([key, value]) => {
    // Skip formatting name/count if redundant
    if (key === '1.01' || key === '1.02') return;

    let valueStr = String(value);
    if (value === true) valueStr = 'Yes';
    if (value === false) valueStr = 'No';
    if (!valueStr || valueStr.trim() === '') return;

    const label = getGeneralQuestionLabel(key);
    const obs = project.fieldObservations?.[key];
    const obsMarker = obs ? (obs.severity === 'critical' ? ' [!]' : ' [!]') : '';
    
    // Check if we need to split text
    const maxValWidth = contentWidth - 65;
    const splitVal = doc.splitTextToSize(valueStr, maxValWidth);
    
    const labelLines = doc.splitTextToSize(label + obsMarker, 60);
    const neededHeight = Math.max(6, labelLines.length * 5, splitVal.length * 5) + 3; // Measure both label & value height

    checkPageBreak(neededHeight);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(obs?.severity === 'critical' ? 191 : obs ? 217 : 71, obs ? 30 : 119, obs?.severity === 'critical' ? 46 : obs ? 119 : 105);
    
    // Print label with obs marker
    labelLines.forEach((lblLine: string, idx: number) => {
      doc.text(lblLine, margin, y + (idx * 5));
    });

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    splitVal.forEach((valLine: string, idx: number) => {
      doc.text(valLine, margin + 62, y + (idx * 5));
    });

    // Subtle horizontal border line separating entries
    doc.setDrawColor(241, 245, 249);
    doc.line(margin, y + neededHeight - 1, margin + contentWidth, y + neededHeight - 1);

    y += neededHeight;
  });

  y += 8;

  // 4. Parts list summary Table
  checkPageBreak(35);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text('Parts Under Evaluation Summary', margin, y);
  y += 7;
  doc.line(margin, y, margin + contentWidth, y);
  y += 5;

  // Draw Table Header
  doc.setFillColor(241, 245, 249); // slate-100
  doc.rect(margin, y, contentWidth, 8, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85); // slate-700
  doc.text('Part Name', margin + 3, y + 5.5);
  doc.text('Dimensions', margin + 50, y + 5.5);
  doc.text('Weight', margin + 90, y + 5.5);
  doc.text('Material', margin + 120, y + 5.5);
  doc.text('CAD File', margin + 155, y + 5.5);
  
  y += 8;

  // Table rows
  (project.parts || []).forEach((part) => {
    checkPageBreak(8);
    const r = part.responses || {};
    const pName = r['2.01'] || 'Unnamed Part';
    const pDims = r['2.02'] || 'N/A';
    const pWeight = r['2.03'] ? `${r['2.03']} kg` : 'N/A';
    const pMat = r['2.03_material'] || 'N/A';
    const hasCad = part.cadFile ? part.cadFile.name : (r['2.06'] === true ? 'Yes' : 'No');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);

    doc.text(doc.splitTextToSize(pName, 45)[0], margin + 3, y + 5.5);
    doc.text(pDims, margin + 50, y + 5.5);
    doc.text(pWeight, margin + 90, y + 5.5);
    doc.text(pMat, margin + 120, y + 5.5);
    doc.text(doc.splitTextToSize(hasCad, 25)[0], margin + 155, y + 5.5);

    doc.setDrawColor(241, 245, 249); // horizontal border line
    doc.line(margin, y + 8, margin + contentWidth, y + 8);
    y += 8;
  });

  y += 8;

  // 5. Part details questionnaire answers
  (project.parts || []).forEach((part, index) => {
    checkPageBreak(25);
    const r = part.responses || {};
    const pName = r['2.01'] || `Part ${index + 1}`;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(`Part ${index + 1} Details: ${pName}`, margin, y);
    y += 6;
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y, margin + contentWidth, y);
    y += 4;

    doc.setFontSize(10);
    Object.entries(r).forEach(([key, value]) => {
      // Skip name/dims already in summary table to keep pdf clean
      if (key === '2.01' || key === '2.02' || key === '2.03' || key === '2.03_material') return;

      let valueStr = String(value);
      if (value === true) valueStr = 'Yes';
      if (value === false) valueStr = 'No';
      if (!valueStr || valueStr.trim() === '') return;

      const label = getPartQuestionLabel(key);
      const obs = project.fieldObservations?.[key];
      const obsMarker = obs ? (obs.severity === 'critical' ? ' [!]' : ' [!]') : '';
      const maxValWidth = contentWidth - 65;
      const splitVal = doc.splitTextToSize(valueStr, maxValWidth);
      
      const labelLines = doc.splitTextToSize(label + obsMarker, 60);
      const neededHeight = Math.max(6, labelLines.length * 5, splitVal.length * 5) + 3; // Measure both label & value height

      checkPageBreak(neededHeight);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(obs?.severity === 'critical' ? 191 : obs ? 217 : 71, obs ? 30 : 119, obs?.severity === 'critical' ? 46 : obs ? 119 : 105);

      labelLines.forEach((lblLine: string, idx: number) => {
        doc.text(lblLine, margin, y + (idx * 5));
      });

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      splitVal.forEach((valLine: string, idx: number) => {
        doc.text(valLine, margin + 62, y + (idx * 5));
      });

      // Subtle horizontal border line separating entries
      doc.setDrawColor(241, 245, 249);
      doc.line(margin, y + neededHeight - 1, margin + contentWidth, y + neededHeight - 1);

      y += neededHeight;
    });

    y += 6;
  });

  // ==========================================================================
  // SECTION B — Field Observations Summary (data coming from field-level observations)
  // ==========================================================================
  const obsEntries = Object.entries(project.fieldObservations || {});
  if (obsEntries.length > 0) {
    y += 4;
    checkPageBreak(25);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text('Field Observations Summary', margin, y);
    y += 7;
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y, margin + contentWidth, y);
    y += 5;

    obsEntries.forEach(([fieldId, obs]) => {
      const allQuestions = [
        ...GENERAL_STEPS.flatMap(s => s.questions),
        ...PART_STEPS.flatMap(s => s.questions)
      ];
      const fieldLabel = allQuestions.find(q => q.id === fieldId)?.label || fieldId;
      const isCritical = obs.severity === 'critical';
      const marker = isCritical ? '[!]' : '[!]';
      const entryText = `${marker} ${fieldLabel}: ${obs.text}`;
      const splitEntry = doc.splitTextToSize(entryText, contentWidth - 8);
      const entryHeight = Math.max(7, splitEntry.length * 5 + 2);

      checkPageBreak(entryHeight + 2);

      // Coloured left strip
      doc.setFillColor(isCritical ? 254 : 254, isCritical ? 226 : 243, isCritical ? 226 : 199);
      doc.rect(margin, y - 1, contentWidth, entryHeight, 'F');
      doc.setFillColor(isCritical ? 239 : 245, isCritical ? 68 : 158, isCritical ? 68 : 11);
      doc.rect(margin, y - 1, 2, entryHeight, 'F');

      doc.setFont('helvetica', isCritical ? 'bold' : 'normal');
      doc.setFontSize(9);
      doc.setTextColor(isCritical ? 153 : 120, isCritical ? 27 : 53, isCritical ? 27 : 15);
      splitEntry.forEach((line: string, idx: number) => {
        doc.text(line, margin + 5, y + 3.5 + (idx * 5));
      });
      y += entryHeight + 2;
    });

    y += 6;
  }

  // 7. Visual Attachments Appendix (if images exist)
  const allImages: { dataUrl: string; label: string }[] = [];
  
  if (project.generalImages && project.generalImages.length > 0) {
    project.generalImages.forEach((img, idx) => {
      allImages.push({ dataUrl: img, label: `Cell Env Photo ${idx + 1}` });
    });
  }

  (project.parts || []).forEach((part, partIdx) => {
    if (part.images && part.images.length > 0) {
      part.images.forEach((img, idx) => {
        allImages.push({ dataUrl: img, label: `Part ${partIdx + 1} Photo ${idx + 1}` });
      });
    }
    if (part.placementImages && part.placementImages.length > 0) {
      part.placementImages.forEach((img, idx) => {
        allImages.push({ dataUrl: img, label: `Part ${partIdx + 1} Placement Photo ${idx + 1}` });
      });
    }
  });

  if (allImages.length > 0) {
    checkPageBreak(30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text('Visual Attachments Appendix', margin, y);
    y += 7;
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y, margin + contentWidth, y);
    y += 10;

    // Draw images in a 3-column grid
    const cols = 3;
    const imgWidth = 52;
    const imgHeight = 39;
    const gap = 8;

    for (let i = 0; i < allImages.length; i += cols) {
      checkPageBreak(imgHeight + 15);
      const rowImages = allImages.slice(i, i + cols);

      rowImages.forEach((imgObj, colIdx) => {
        const xPos = margin + colIdx * (imgWidth + gap);
        
        try {
          // Add image to PDF
          doc.addImage(imgObj.dataUrl, 'JPEG', xPos, y, imgWidth, imgHeight);
          
          // Label text under image
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(100, 116, 139);
          doc.text(imgObj.label, xPos, y + imgHeight + 4);
        } catch (err) {
          console.error("Failed to render image in PDF:", err);
          // Render placeholder frame with error message
          doc.setDrawColor(239, 68, 68);
          doc.rect(xPos, y, imgWidth, imgHeight);
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(7);
          doc.setTextColor(239, 68, 68);
          doc.text('[Image Render Fail]', xPos + 10, y + 20);
        }
      });

      y += imgHeight + 12;
    }
  }

  // Draw footer on all pages
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawPageHeaderFooter();
  }

  // Save the PDF local file trigger
  const safeName = (project.projectName || 'project')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .substring(0, 30);
  doc.save(`scape_evaluation_${safeName}.pdf`);
};
