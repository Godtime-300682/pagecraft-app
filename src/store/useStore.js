import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useStore = create(
  persist(
    (set) => ({
      projects: [],
      currentProject: null,

      addProject: (project) =>
        set((state) => ({ projects: [project, ...state.projects] })),

      updateProject: (id, data) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, ...data } : p
          ),
        })),

      deleteProject: (id) =>
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
        })),

      setCurrentProject: (project) => set({ currentProject: project }),

      clearCurrentProject: () => set({ currentProject: null }),
    }),
    { name: 'pagecraft-storage' }
  )
)

export default useStore
