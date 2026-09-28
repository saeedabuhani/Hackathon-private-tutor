import { create } from 'zustand';

const useStore = create((set) => ({
  // Shared between Feed and Tutor
  activeTopic: null,
  activeLanguage: 'he', // 'he' | 'ar' | 'en'
  activeMaterialId: null, // material the topic came from, so Feed can link back

  // Site preferences (persisted in localStorage by components/Preferences.js).
  // These are NOT cleared by reset(): logging out keeps your theme and language.
  theme: 'dark', // 'dark' | 'light' | 'auto'
  siteLanguage: 'en', // 'en' | 'he' | 'ar' — the language of the interface itself

  // User
  user: null,
  xp: 0,

  setTheme: (theme) => set({ theme }),
  setSiteLanguage: (lang) => set({ siteLanguage: lang }),
  setActiveTopic: (topic) => set({ activeTopic: topic }),
  setActiveMaterialId: (id) => set({ activeMaterialId: id }),
  setXP: (xp) => set({ xp }),
  setActiveLanguage: (lang) => set({ activeLanguage: lang }),
  setUser: (user) => set({ user }),
  addXP: (points) => set((state) => ({ xp: state.xp + points })),
  reset: () => set({ activeTopic: null, activeMaterialId: null, user: null, xp: 0 }),
}));

export default useStore;
