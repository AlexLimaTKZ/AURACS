import test from "node:test";
import assert from "node:assert/strict";
import { normalizeChallengeStatus, shouldRegisterCombatDamage } from "../src/lib/gameRules.ts";

test("preserves progress status from the API", () => {
  assert.equal(
    normalizeChallengeStatus({ challengePassed: false, challengeStatus: "progress" }),
    "progress"
  );
});

test("supports the legacy challengePassed field", () => {
  assert.equal(normalizeChallengeStatus({ challengePassed: true }), "passed");
  assert.equal(normalizeChallengeStatus({ challengePassed: false }), "failed");
});

test("a correct intermediate boss step does not cause damage", () => {
  assert.equal(
    shouldRegisterCombatDamage({
      isCombat: true,
      evaluationSucceeded: true,
      challengeStatus: "progress",
    }),
    false
  );
});

test("invalid combat code causes damage", () => {
  assert.equal(
    shouldRegisterCombatDamage({
      isCombat: true,
      evaluationSucceeded: false,
      challengeStatus: "failed",
    }),
    true
  );
});

test("non-combat failures do not invoke the combat damage system", () => {
  assert.equal(
    shouldRegisterCombatDamage({
      isCombat: false,
      evaluationSucceeded: false,
      challengeStatus: "failed",
    }),
    false
  );
});
