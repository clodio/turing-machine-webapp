import { RootState } from ".";

let saveTimeout: ReturnType<typeof setTimeout> | null = null;

// Get store version safely
const getStoreVersion = (): number => {
  const version = parseInt(process.env.REACT_APP_STORE_VERSION || "1");
  return isNaN(version) ? 1 : version;
};

export const loadState: () => Undefinable<RootState> = () => {
  try {
    const serializedState = localStorage.getItem("state");
    
    if (serializedState === null) {
      console.log("[StorageDebug] No state in localStorage");
      return undefined;
    }

    const preloadedState = JSON.parse(serializedState) as RootState;
    const currentVersion = getStoreVersion();
    const savedVersion = preloadedState.settings?.storeVersion;
    
    console.log("[StorageDebug] Loaded state from localStorage", {
      savedVersion,
      currentVersion,
      hasPartyInfo: !!preloadedState.registration.partyInfo,
      registrationStatus: preloadedState.registration.status,
    });

    // Accept if versions match, or if saved version is valid and current is valid
    if (savedVersion === currentVersion) {
      console.log("[StorageDebug] ✅ State restored successfully");
      return preloadedState;
    } else if (savedVersion && currentVersion && savedVersion !== currentVersion) {
      console.log("[StorageDebug] ⚠️ Version mismatch, state not restored");
      return undefined;
    } else {
      console.log("[StorageDebug] ✅ State restored (no version check)");
      return preloadedState;
    }
  } catch (error) {
    console.error("[StorageDebug] Error loading state from localStorage:", error);
    return undefined;
  }
};

// Debounce save to avoid excessive writes
export const saveState = (state: RootState) => {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }

  saveTimeout = setTimeout(() => {
    saveStateImmediate(state);
  }, 500); // Save 500ms after last change
};

// Immediate save (without debounce) - used for critical moments like beforeunload
export const saveStateImmediate = (state: RootState) => {
  try {
    // Ensure storeVersion is always a valid number
    const stateToSave = {
      ...state,
      settings: {
        ...state.settings,
        storeVersion: getStoreVersion(),
      },
    };
    
    const serializedState = JSON.stringify(stateToSave);
    localStorage.setItem("state", serializedState);
    
    console.log("[StorageDebug] ✅ State saved to localStorage", {
      registrationStatus: state.registration.status,
      hasPartyInfo: !!state.registration.partyInfo,
      roundsCount: state.rounds.length,
      storeVersion: getStoreVersion(),
    });
  } catch (error) {
    console.error("[StorageDebug] Error saving state to localStorage:", error);
  }
};
