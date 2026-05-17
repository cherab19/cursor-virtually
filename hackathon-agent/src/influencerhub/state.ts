import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { STATE_FILE } from "./paths.js";

export type BuildState = {
  agentId?: string;
  completedPhaseIds: number[];
  lastRunId?: string;
  updatedAt: string;
};

function emptyState(): BuildState {
  return { completedPhaseIds: [], updatedAt: new Date().toISOString() };
}

export function loadState(): BuildState {
  if (!existsSync(STATE_FILE)) return emptyState();
  try {
    return { ...emptyState(), ...JSON.parse(readFileSync(STATE_FILE, "utf8")) };
  } catch {
    return emptyState();
  }
}

export function saveState(state: BuildState): void {
  writeFileSync(
    STATE_FILE,
    JSON.stringify({ ...state, updatedAt: new Date().toISOString() }, null, 2),
    "utf8",
  );
}

export function markPhaseComplete(state: BuildState, phaseId: number): BuildState {
  const completed = new Set(state.completedPhaseIds);
  completed.add(phaseId);
  return {
    ...state,
    completedPhaseIds: [...completed].sort((a, b) => a - b),
  };
}
