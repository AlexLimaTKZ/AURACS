export type ChallengeStatus = "failed" | "progress" | "passed";

export interface ChallengeStatusLike {
  challengePassed?: boolean;
  challengeStatus?: string | null;
}

export function normalizeChallengeStatus(result: ChallengeStatusLike): ChallengeStatus {
  if (result.challengeStatus === "passed" || result.challengeStatus === "progress" || result.challengeStatus === "failed") {
    return result.challengeStatus;
  }

  return result.challengePassed ? "passed" : "failed";
}

export function shouldRegisterCombatDamage(input: {
  isCombat: boolean;
  evaluationSucceeded: boolean;
  challengeStatus: ChallengeStatus;
}): boolean {
  if (!input.isCombat) return false;
  if (!input.evaluationSucceeded) return true;
  return input.challengeStatus === "failed";
}
