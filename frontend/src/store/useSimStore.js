import { create } from 'zustand'

export const useSimStore = create((set) => ({
  simulation:     null,
  results:        [],
  historicalData: [],
  lastResult:     null,

  setSimulation:  (sim)    => set({ simulation: sim }),
  setAllData:     ({ simulation, results, historicalContext }) =>
    set({
      simulation,
      results:        results || [],
      historicalData: historicalContext || [],
      lastResult:     results?.length > 0 ? results[results.length - 1] : null,
    }),
  appendResult:   (result) =>
    set((state) => ({
      results:    [...state.results, result],
      lastResult: result,
    })),
  updateMonth:    (nextMonth) =>
    set((state) => ({
      simulation: state.simulation ? { ...state.simulation, current_month: nextMonth } : null,
    })),
  markCompleted:  () =>
    set((state) => ({
      simulation: state.simulation ? { ...state.simulation, status: 'completed' } : null,
    })),
  reset: () =>
    set({ simulation: null, results: [], historicalData: [], lastResult: null }),
}))
