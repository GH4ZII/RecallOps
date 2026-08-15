"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import { getScenario, type ScenarioStep } from "./scenarios";
import { runScenarioSimulation, type SimulationHandle } from "./simulate";
import type {
  DashboardMetrics,
  DemoState,
  Incident,
  IncidentRuntime,
  Memory,
  ScenarioId,
} from "./types";

const STORAGE_KEY = "recallops-demo-v1";

const initialState: DemoState = {
  incidents: [],
  memories: [],
  runtimes: {},
  incident1Complete: false,
  incident2Complete: false,
  actionsAvoided: 0,
};

type Action =
  | { type: "HYDRATE"; payload: DemoState }
  | { type: "RESET" }
  | { type: "CREATE_INCIDENT"; incident: Incident; runtime: IncidentRuntime }
  | { type: "APPLY_STEP"; incidentId: string; step: ScenarioStep; startedAt: string }
  | { type: "SET_SIMULATING"; incidentId: string; isSimulating: boolean };

function emptyRuntime(incidentId: string): IncidentRuntime {
  return {
    incidentId,
    agentState: "IDLE",
    timeline: [],
    retrievedMemories: [],
    decision: null,
    actions: [],
    isSimulating: false,
  };
}

function applyStep(
  state: DemoState,
  incidentId: string,
  step: ScenarioStep,
  startedAt: string,
): DemoState {
  const incident = state.incidents.find((i) => i.id === incidentId);
  const runtime = state.runtimes[incidentId] ?? emptyRuntime(incidentId);
  if (!incident) return state;

  const now = new Date().toISOString();
  const elapsedSec = Math.max(
    0,
    Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000),
  );
  const mm = String(Math.floor(elapsedSec / 60)).padStart(2, "0");
  const ss = String(elapsedSec % 60).padStart(2, "0");

  const actions = [...runtime.actions];
  if (step.skipActions?.length) {
    for (const skip of step.skipActions) {
      if (!actions.some((a) => a.id === skip.id)) {
        actions.push(skip);
      }
    }
  }
  if (step.action) {
    const idx = actions.findIndex((a) => a.id === step.action!.id);
    if (idx >= 0) {
      actions[idx] = step.action;
    } else {
      actions.push(step.action);
    }
  }

  const nextRuntime: IncidentRuntime = {
    ...runtime,
    agentState: step.state,
    timeline: [
      ...runtime.timeline,
      {
        id: `${incidentId}-${runtime.timeline.length}`,
        at: `${mm}:${ss}`,
        label: step.label,
        state: step.state,
        tone: step.tone ?? "neutral",
      },
    ],
    retrievedMemories:
      step.retrievedMemories !== undefined
        ? step.retrievedMemories
        : runtime.retrievedMemories,
    decision: step.decision ?? runtime.decision,
    actions,
    isSimulating: true,
  };

  const incidents = state.incidents.map((i) =>
    i.id === incidentId
      ? {
          ...i,
          status: step.resolve || step.state === "RESOLVED" || step.state === "MEMORY_STORED"
            ? ("resolved" as const)
            : ("active" as const),
          resolvedAt:
            step.resolve || step.state === "RESOLVED"
              ? now
              : i.resolvedAt,
          resolutionSeconds:
            step.resolve || step.state === "RESOLVED"
              ? Math.max(1, Math.round((Date.now() - new Date(i.startedAt).getTime()) / 1000))
              : i.resolutionSeconds,
        }
      : i,
  );

  let memories = state.memories;
  let incident1Complete = state.incident1Complete;
  let incident2Complete = state.incident2Complete;
  let actionsAvoided = state.actionsAvoided;

  if (step.memory) {
    const memory: Memory = {
      id: `mem-${incidentId}`,
      incidentId,
      createdAt: now,
      ...step.memory,
    };
    if (!memories.some((m) => m.id === memory.id)) {
      memories = [...memories, memory];
    }
    nextRuntime.isSimulating = false;
    nextRuntime.agentState = "MEMORY_STORED";

    if (incident.scenarioId === "incident-1") {
      incident1Complete = true;
    }
    if (incident.scenarioId === "incident-2") {
      incident2Complete = true;
      const skipped = nextRuntime.actions.filter((a) => a.status === "SKIPPED").length;
      actionsAvoided = state.actionsAvoided + skipped;
    }
  }

  return {
    ...state,
    incidents,
    memories,
    runtimes: { ...state.runtimes, [incidentId]: nextRuntime },
    incident1Complete,
    incident2Complete,
    actionsAvoided,
  };
}

function reducer(state: DemoState, action: Action): DemoState {
  switch (action.type) {
    case "HYDRATE":
      return action.payload;
    case "RESET":
      return initialState;
    case "CREATE_INCIDENT":
      return {
        ...state,
        incidents: [...state.incidents, action.incident],
        runtimes: {
          ...state.runtimes,
          [action.incident.id]: { ...action.runtime, isSimulating: true },
        },
      };
    case "APPLY_STEP":
      return applyStep(state, action.incidentId, action.step, action.startedAt);
    case "SET_SIMULATING": {
      const runtime = state.runtimes[action.incidentId];
      if (!runtime) return state;
      return {
        ...state,
        runtimes: {
          ...state.runtimes,
          [action.incidentId]: { ...runtime, isSimulating: action.isSimulating },
        },
      };
    }
    default:
      return state;
  }
}

function computeMetrics(state: DemoState): DashboardMetrics {
  const active = state.incidents.filter((i) => i.status === "active");
  const resolved = state.incidents.filter((i) => i.status === "resolved");
  const times = resolved
    .map((i) => i.resolutionSeconds)
    .filter((t): t is number => typeof t === "number");
  const mean =
    times.length > 0
      ? Math.round(times.reduce((a, b) => a + b, 0) / times.length)
      : null;

  return {
    activeCount: active.length,
    resolvedCount: resolved.length,
    meanResolutionSeconds: mean,
    memoriesStored: state.memories.length,
    actionsAvoided: state.actionsAvoided,
  };
}

interface DemoContextValue {
  state: DemoState;
  metrics: DashboardMetrics;
  hydrated: boolean;
  startScenario: (scenarioId: ScenarioId) => string | null;
  resetDemo: () => void;
  getIncident: (id: string) => Incident | undefined;
  getRuntime: (id: string) => IncidentRuntime | undefined;
}

const DemoContext = createContext<DemoContextValue | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [hydrated, setHydrated] = useReducer(() => true, false);
  const simRef = useRef<SimulationHandle | null>(null);
  const startedAtRef = useRef<Record<string, string>>({});

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as DemoState;
        dispatch({ type: "HYDRATE", payload: parsed });
      }
    } catch {
      // ignore corrupt storage
    }
    setHydrated();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const resetDemo = useCallback(() => {
    simRef.current?.cancel();
    simRef.current = null;
    startedAtRef.current = {};
    sessionStorage.removeItem(STORAGE_KEY);
    dispatch({ type: "RESET" });
  }, []);

  const startScenario = useCallback(
    (scenarioId: ScenarioId): string | null => {
      if (scenarioId === "incident-1" && state.incidents.some((i) => i.scenarioId === "incident-1")) {
        const existing = state.incidents.find((i) => i.scenarioId === "incident-1");
        return existing?.id ?? null;
      }
      if (scenarioId === "incident-2") {
        if (!state.incident1Complete) return null;
        if (state.incidents.some((i) => i.scenarioId === "incident-2")) {
          const existing = state.incidents.find((i) => i.scenarioId === "incident-2");
          return existing?.id ?? null;
        }
      }

      const def = getScenario(scenarioId);
      const id = scenarioId === "incident-1" ? "inc-1" : "inc-2";
      const startedAt = new Date().toISOString();
      const incident: Incident = {
        id,
        ...def.incident,
        status: "active",
        startedAt,
      };

      startedAtRef.current[id] = startedAt;
      simRef.current?.cancel();

      dispatch({
        type: "CREATE_INCIDENT",
        incident,
        runtime: emptyRuntime(id),
      });

      const handle = runScenarioSimulation(scenarioId, (step) => {
        dispatch({
          type: "APPLY_STEP",
          incidentId: id,
          step,
          startedAt: startedAtRef.current[id] ?? startedAt,
        });
      });

      simRef.current = handle;
      handle.done.then(() => {
        dispatch({ type: "SET_SIMULATING", incidentId: id, isSimulating: false });
      });

      return id;
    },
    [state.incident1Complete, state.incidents],
  );

  const value = useMemo<DemoContextValue>(
    () => ({
      state,
      metrics: computeMetrics(state),
      hydrated,
      startScenario,
      resetDemo,
      getIncident: (id) => state.incidents.find((i) => i.id === id),
      getRuntime: (id) => state.runtimes[id],
    }),
    [state, hydrated, startScenario, resetDemo],
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const ctx = useContext(DemoContext);
  if (!ctx) {
    throw new Error("useDemo must be used within DemoProvider");
  }
  return ctx;
}
