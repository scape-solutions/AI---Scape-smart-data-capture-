import { jsPDF } from 'jspdf';
import { ProjectState } from '../types';
import { GENERAL_STEPS, PART_STEPS } from '../questionnaire';

// Helper to translate labels from question IDs
const getGeneralQuestionLabel = (id: string): string => {
  const q = GENERAL_STEPS[0].questions.find(item => item.id === id);
  return q ? q.label : id;
};

const getPartQuestionLabel = (id: string): string => {
  for (const step of PART_STEPS) {
    const q = step.questions.find(item => item.id === id);
    if (q) return q.label;
  }
  return id;
};

export const generateProjectPdf = (project: ProjectState) => {
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
    
    // Check if we need to split text
    const maxValWidth = contentWidth - 65;
    const splitVal = doc.splitTextToSize(valueStr, maxValWidth);
    const neededHeight = Math.max(6, splitVal.length * 5);

    checkPageBreak(neededHeight);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    
    // Print label
    const labelLines = doc.splitTextToSize(label, 60);
    labelLines.forEach((lblLine: string, idx: number) => {
      doc.text(lblLine, margin, y + (idx * 5));
    });

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    splitVal.forEach((valLine: string, idx: number) => {
      doc.text(valLine, margin + 62, y + (idx * 5));
    });

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
      const maxValWidth = contentWidth - 65;
      const splitVal = doc.splitTextToSize(valueStr, maxValWidth);
      const neededHeight = Math.max(6, splitVal.length * 5);

      checkPageBreak(neededHeight);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);

      const labelLines = doc.splitTextToSize(label, 60);
      labelLines.forEach((lblLine: string, idx: number) => {
        doc.text(lblLine, margin, y + (idx * 5));
      });

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      splitVal.forEach((valLine: string, idx: number) => {
        doc.text(valLine, margin + 62, y + (idx * 5));
      });

      y += neededHeight;
    });

    y += 6;
  });

  // 6. Feasibility Report and Verdict Section (If available)
  if (project.report || project.finalVerdict) {
    y += 4;
    checkPageBreak(25);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text('Technical Feasibility Review', margin, y);
    y += 7;
    doc.setDrawColor(15, 23, 42);
    doc.line(margin, y, margin + contentWidth, y);
    y += 5;

    // Helper to print markdown-like reports
    const printMarkdownText = (rawText: string) => {
      const paragraphs = rawText.split('\n');
      paragraphs.forEach(p => {
        const cleaned = p.replace(/\*\*|###|##|#/g, '').trim();
        if (cleaned === '') {
          y += 2;
          return;
        }

        const isHeader = p.startsWith('#') || p.startsWith('##') || p.startsWith('###');
        const isBullet = p.trim().startsWith('*') || p.trim().startsWith('-');

        const fontSize = isHeader ? 11 : 9.5;
        const fontStyle = isHeader ? 'bold' : 'normal';
        const color = isHeader ? [15, 23, 42] : [51, 65, 85];
        const indent = isBullet ? 20 : 15;
        
        doc.setFont('helvetica', fontStyle);
        doc.setFontSize(fontSize);
        doc.setTextColor(color[0], color[1], color[2]);

        const bulletPrefix = isBullet ? '• ' : '';
        const textToSplit = bulletPrefix + (isBullet ? cleaned.substring(1).trim() : cleaned);
        const splitLines = doc.splitTextToSize(textToSplit, contentWidth - (indent - 15));
        const paragraphHeight = splitLines.length * 5 + (isHeader ? 2 : 0);

        checkPageBreak(paragraphHeight);
        splitLines.forEach((line: string, idx: number) => {
          doc.text(line, indent, y + (idx * 5));
        });
        y += paragraphHeight + 1.5;
      });
    };

    if (project.report) {
      printMarkdownText(project.report);
      y += 6;
    }

    if (project.finalVerdict) {
      checkPageBreak(20);
      doc.setFillColor(248, 250, 252); // light background panel
      doc.setDrawColor(226, 232, 240);
      const startY = y;
      y += 5;
      
      printMarkdownText(project.finalVerdict);
      
      // Draw background border surrounding verdict
      const endY = y;
      doc.rect(margin, startY, contentWidth, endY - startY, 'S');
      y += 8;
    }
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
