const KEY_PREFIX = "kendrah_install_prompt_seen_";

export const hasSeenInstallPrompt = (userId: string) => {
  try {
    return localStorage.getItem(`${KEY_PREFIX}${userId}`) === "1";
  } catch {
    return true;
  }
};

export const markInstallPromptSeen = (userId: string) => {
  try {
    localStorage.setItem(`${KEY_PREFIX}${userId}`, "1");
  } catch {
    // ignore
  }
};
