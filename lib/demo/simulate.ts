import { getScenario, type ScenarioStep } from "./scenarios";
import type { ScenarioId } from "./types";

export type StepHandler = (step: ScenarioStep, index: number) => void;

export interface SimulationHandle {
  cancel: () => void;
  done: Promise<void>;
}

/**
 * Runs scenario steps sequentially with delays.
 * Calls onStep for each step after its delay elapses.
 */
export function runScenarioSimulation(
  scenarioId: ScenarioId,
  onStep: StepHandler,
): SimulationHandle {
  const { steps } = getScenario(scenarioId);
  let cancelled = false;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const done = new Promise<void>((resolve) => {
    let index = 0;

    const tick = () => {
      if (cancelled) {
        resolve();
        return;
      }
      if (index >= steps.length) {
        resolve();
        return;
      }

      const step = steps[index];
      timeoutId = setTimeout(() => {
        if (cancelled) {
          resolve();
          return;
        }
        onStep(step, index);
        index += 1;
        tick();
      }, step.delayMs);
    };

    tick();
  });

  return {
    cancel: () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    },
    done,
  };
}
