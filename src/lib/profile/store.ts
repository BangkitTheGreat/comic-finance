export interface UserProfile {
  name: string;
  email: string;
  avatar: string;
}

const defaultProfile: UserProfile = {
  name: "Penny User",
  email: "penny@example.com",
  avatar: "https://ui-avatars.com/api/?name=Penny+User&background=BB6BD9&color=fff",
};

interface Store {
  profile: UserProfile;
}

const globalForStore = globalThis as unknown as { __profileStore?: Store };

function getStore(): Store {
  if (!globalForStore.__profileStore) {
    globalForStore.__profileStore = { profile: { ...defaultProfile } };
  }
  return globalForStore.__profileStore;
}

function avatarFor(name: string): string {
  const safe = encodeURIComponent(name.trim() || "User");
  return `https://ui-avatars.com/api/?name=${safe}&background=BB6BD9&color=fff`;
}

export function getProfile(): UserProfile {
  return getStore().profile;
}

export function updateProfile(name: string, email: string): UserProfile {
  const store = getStore();
  store.profile = { name, email, avatar: avatarFor(name) };
  return store.profile;
}

export function resetAllData(): void {
  const g = globalThis as unknown as Record<string, unknown>;
  delete g.__txStore;
  delete g.__accountStore;
  delete g.__goalStore;
  delete g.__billStore;
  delete g.__recurringStore;
  delete g.__budgetStore;
  delete g.__profileStore;
  delete g.__currencyStore;
  delete g.__settingsStore;
}
