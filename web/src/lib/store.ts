import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface GameState {
  energy: number;
  integrity: number;
  inventory: string[];
  currentChapterId: string;
  currentStepId: string;
  unlockedChapters: string[];
  unlockedAchievements: string[];
  consecutiveSuccesses: number;
  updateEnergy: (amount: number) => void;
  addItem: (item: string) => void;
  setChapter: (chapterId: string) => void;
  setStep: (stepId: string) => void;
  unlockChapter: (chapterId: string) => void;
  unlockAchievement: (id: string) => void;
  setConsecutiveSuccesses: (n: number) => void;
  resetAll: () => void;
  resetChapter: () => void;
  _hasHydrated: boolean;
  setHasHydrated: (val: boolean) => void;
}

const INITIAL_STATE = {
  energy: 100,
  integrity: 100,
  inventory: [] as string[],
  currentChapterId: "chapter-1",
  currentStepId: "step-1",
  unlockedChapters: ["chapter-1"] as string[],
  unlockedAchievements: [] as string[],
  consecutiveSuccesses: 0,
};

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      ...INITIAL_STATE,
      _hasHydrated: false,

      updateEnergy: (amount) =>
        set((state) => ({
          energy: Math.max(0, Math.min(100, state.energy + amount)),
        })),

      addItem: (item) =>
        set((state) => ({
          inventory: [...state.inventory, item],
        })),

      setChapter: (id) => set({ currentChapterId: id }),
      setStep: (stepId) => set({ currentStepId: stepId }),

      unlockChapter: (id) =>
        set((state) => ({
          unlockedChapters: state.unlockedChapters.includes(id)
            ? state.unlockedChapters
            : [...state.unlockedChapters, id],
        })),

      unlockAchievement: (id) =>
        set((state) => ({
          unlockedAchievements: state.unlockedAchievements.includes(id)
            ? state.unlockedAchievements
            : [...state.unlockedAchievements, id],
        })),

      setConsecutiveSuccesses: (n) => set({ consecutiveSuccesses: n }),
      resetAll: () => set({ ...INITIAL_STATE }),
      resetChapter: () =>
        set({
          energy: 100,
          integrity: 100,
          currentStepId: "step-1",
          consecutiveSuccesses: 0,
        }),
      setHasHydrated: (val) => set({ _hasHydrated: val }),
    }),
    {
      name: "auracs-save",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
