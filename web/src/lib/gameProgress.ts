export interface ChapterShape<TStep> {
  initialStepId: string;
  steps: Record<string, TStep>;
}

export function resolveProgress<TStep>(
  chapters: Record<string, ChapterShape<TStep>>,
  fallbackChapterId: string,
  chapterId: string,
  stepId: string
): { chapterId: string; chapter: ChapterShape<TStep>; stepId: string; step: TStep } {
  const fallbackChapter = chapters[fallbackChapterId];
  if (!fallbackChapter) {
    throw new Error(`Capítulo fallback '${fallbackChapterId}' não existe.`);
  }

  const chapter = chapters[chapterId] ?? fallbackChapter;
  const resolvedChapterId = chapters[chapterId] ? chapterId : fallbackChapterId;
  const resolvedStepId = chapter.steps[stepId] ? stepId : chapter.initialStepId;
  const step = chapter.steps[resolvedStepId];

  if (!step) {
    throw new Error(`Passo inicial '${chapter.initialStepId}' não existe no capítulo '${resolvedChapterId}'.`);
  }

  return {
    chapterId: resolvedChapterId,
    chapter,
    stepId: resolvedStepId,
    step,
  };
}

export function stepEffectKey(chapterId: string, stepId: string): string {
  return `${chapterId}:${stepId}`;
}
