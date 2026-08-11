const form = document.getElementById("settingsForm");
const aiApiKeyInput = document.getElementById("aiApiKey");
const supadataApiKeyInput = document.getElementById("supadataApiKey");
const customizationPrompt = document.getElementById("customizationPrompt");
const copyCustomizationPromptBtn = document.getElementById(
  "copyCustomizationPromptBtn",
);
const copyStatus = document.getElementById("copyStatus");
const saveStatus = document.getElementById("saveStatus");
const dataStatus = document.getElementById("dataStatus");

document.addEventListener("DOMContentLoaded", loadSettings);
form.addEventListener("submit", saveSettings);
copyCustomizationPromptBtn.addEventListener("click", copyCustomizationPrompt);
document
  .getElementById("clearCacheBtn")
  .addEventListener("click", clearCachedDigests);
document
  .getElementById("clearNotesBtn")
  .addEventListener("click", clearNotes);
document.getElementById("resetBtn").addEventListener("click", resetAllData);

async function loadSettings() {
  const stored = await chrome.storage.local.get(YTD_SETTINGS.STORAGE_KEY);
  const migration = YTD_SETTINGS.migrateLegacyCustom(
    stored[YTD_SETTINGS.STORAGE_KEY],
  );
  const settings = migration.settings;

  aiApiKeyInput.value = settings.aiApiKey;
  supadataApiKeyInput.value = settings.supadataApiKey;
  if (migration.migrated) {
    await chrome.storage.local.set({
      [YTD_SETTINGS.STORAGE_KEY]: settings,
    });
    saveStatus.textContent =
      "Custom provider settings were removed safely. Your Supadata key was kept, but the AI key was cleared. Enter a DeepSeek API key to continue.";
  }
}

async function saveSettings(event) {
  event.preventDefault();
  saveStatus.textContent = "Saving…";

  try {
    const settings = YTD_SETTINGS.normalize({
      aiApiKey: aiApiKeyInput.value,
      supadataApiKey: supadataApiKeyInput.value,
    });

    if (!settings.supadataApiKey) {
      throw new Error("Add a Supadata API key.");
    }
    if (!settings.aiApiKey) {
      throw new Error("Add a DeepSeek API key.");
    }

    await chrome.storage.local.set({
      [YTD_SETTINGS.STORAGE_KEY]: settings,
    });

    saveStatus.textContent = "Saved. Reopen YouTube Digest to use these settings.";
  } catch (error) {
    saveStatus.textContent = error.message;
  }
}

async function copyCustomizationPrompt() {
  copyStatus.textContent = "Copying…";
  try {
    await navigator.clipboard.writeText(customizationPrompt.value);
    copyStatus.textContent = "Customization prompt copied.";
  } catch (_error) {
    copyStatus.textContent =
      "Could not copy the prompt. Select the prompt text and copy it manually.";
  }
}

async function clearCachedDigests() {
  const all = await chrome.storage.local.get(null);
  const keys = Object.keys(all).filter((key) => key.startsWith("digest_"));
  if (keys.length) await chrome.storage.local.remove(keys);
  dataStatus.textContent = `Cleared ${keys.length} cached digest${keys.length === 1 ? "" : "s"}.`;
}

async function clearNotes() {
  await chrome.storage.local.remove("ytd_notes");
  dataStatus.textContent = "Deleted all saved notes.";
}

async function resetAllData() {
  const confirmed = window.confirm(
    "Delete API keys, cached digests, translations, and saved notes from this Chrome profile?",
  );
  if (!confirmed) return;

  await chrome.storage.local.clear();
  await loadSettings();
  dataStatus.textContent = "All YouTube Digest data was deleted.";
}
