import { ProjectState } from '../types';
import { GENERAL_STEPS, PART_STEPS } from '../questionnaire';

export function computeDataDiff(project: ProjectState): string[] {
  const snapshot = project.lastAdviceResponsesSnapshot;
  if (!snapshot) return [];

  const changes: string[] = [];

  // Check general responses
  const prevGen = snapshot.general || {};
  const currGen = project.generalResponses || {};

  GENERAL_STEPS.forEach(step => {
    step.questions.forEach(q => {
      const prevVal = prevGen[q.id];
      const currVal = currGen[q.id];
      if (JSON.stringify(prevVal) !== JSON.stringify(currVal)) {
        if ((prevVal === undefined || prevVal === '') && currVal !== undefined && currVal !== '') {
          changes.push(`[${q.id}] ${q.label}: Filled as "${currVal}"`);
        } else if (currVal === undefined || currVal === '') {
          changes.push(`[${q.id}] ${q.label}: Cleared (was "${prevVal}")`);
        } else {
          changes.push(`[${q.id}] ${q.label}: Updated from "${prevVal}" to "${currVal}"`);
        }
      }
    });
  });

  // Check parts responses
  const prevParts = snapshot.parts || [];
  const currParts = project.parts || [];

  currParts.forEach((part, pIdx) => {
    const prevPart = prevParts[pIdx] || {};
    const prevPartResp = prevPart.responses || {};
    const currPartResp = part.responses || {};
    const partTitle = part.responses['2.01'] || `Part #${pIdx + 1}`;

    PART_STEPS.forEach(step => {
      step.questions.forEach(q => {
        const prevVal = prevPartResp[q.id];
        const currVal = currPartResp[q.id];
        if (JSON.stringify(prevVal) !== JSON.stringify(currVal)) {
          if ((prevVal === undefined || prevVal === '') && currVal !== undefined && currVal !== '') {
            changes.push(`${partTitle} - [${q.id}] ${q.label}: Filled as "${currVal}"`);
          } else if (currVal === undefined || currVal === '') {
            changes.push(`${partTitle} - [${q.id}] ${q.label}: Cleared (was "${prevVal}")`);
          } else {
            changes.push(`${partTitle} - [${q.id}] ${q.label}: Updated from "${prevVal}" to "${currVal}"`);
          }
        }
      });
    });
  });

  return changes;
}

export function getCurrentResponsesSnapshot(project: ProjectState) {
  return {
    general: JSON.parse(JSON.stringify(project.generalResponses || {})),
    parts: (project.parts || []).map(p => ({
      responses: JSON.parse(JSON.stringify(p.responses || {})),
      imagesCount: (p.images || []).length,
      hasCad: !!p.cadFile
    }))
  };
}
