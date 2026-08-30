// lib/store/branch-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface BranchStore {
  selectedBranchId: string | null;
  setSelectedBranchId: (id: string | null) => void;
}

export const useBranchStore = create<BranchStore>()(
  persist(
    (set) => ({
      selectedBranchId: null,
      setSelectedBranchId: (id) => set({ selectedBranchId: id }),
    }),
    {
      name: 'branch-store',
    }
  )
);
