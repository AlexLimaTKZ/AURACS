import test from "node:test";
import assert from "node:assert/strict";
import { resolveProgress, stepEffectKey } from "../src/lib/gameProgress.ts";

const chapters = {
  "chapter-1": {
    initialStepId: "step-1",
    steps: {
      "step-1": { id: "step-1" },
      "step-2": { id: "step-2" },
    },
  },
  "chapter-2": {
    initialStepId: "ch2-step-1",
    steps: {
      "ch2-step-1": { id: "ch2-step-1" },
      "ch2-monster-2": { id: "ch2-monster-2" },
    },
  },
};

test("resolves a saved Chapter 2 step without falling back to Chapter 1", () => {
  const resolved = resolveProgress(chapters, "chapter-1", "chapter-2", "ch2-monster-2");

  assert.equal(resolved.chapterId, "chapter-2");
  assert.equal(resolved.stepId, "ch2-monster-2");
  assert.equal(resolved.step.id, "ch2-monster-2");
});

test("falls back to the selected chapter initial step when its step is invalid", () => {
  const resolved = resolveProgress(chapters, "chapter-1", "chapter-2", "missing");

  assert.equal(resolved.chapterId, "chapter-2");
  assert.equal(resolved.stepId, "ch2-step-1");
});

test("falls back to Chapter 1 only when the chapter itself is invalid", () => {
  const resolved = resolveProgress(chapters, "chapter-1", "missing", "whatever");

  assert.equal(resolved.chapterId, "chapter-1");
  assert.equal(resolved.stepId, "step-1");
});

test("step effect keys are chapter-aware", () => {
  assert.equal(stepEffectKey("chapter-2", "ch2-monster-3"), "chapter-2:ch2-monster-3");
});
