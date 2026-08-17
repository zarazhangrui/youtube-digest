# Privacy

Effective: July 28, 2026

YouTube Digest is a GitHub-only, bring-your-own-key Chrome extension. It has no YouTube Digest account, developer-operated backend, analytics, advertising, or telemetry.

## Data the extension handles

Depending on the feature you use, YouTube Digest handles:

- the canonical URL and video ID of the active YouTube video;
- transcript text and timestamps;
- video metadata such as title, channel, description, and duration;
- text you select in the transcript and nearby transcript context;
- transcript context around a timestamped note;
- content you ask to translate;
- notes you save;
- Supadata and AI provider configuration, including API keys; and
- cached transcript, digest, and translation results.

## Where data goes

### Supadata

YouTube Digest sends the canonical YouTube video URL to `https://api.supadata.ai` with your Supadata API key. Supadata returns the transcript and timestamps. A Supadata key is required for transcript retrieval.

### AI providers

Version 1.2.0 can send AI feature content directly to the provider/model selected for that task. Built-in providers include DeepSeek, Google Gemini, and OpenAI; the extension also supports a custom OpenAI-compatible endpoint. The extension does not proxy these requests through a developer server.

The AI request may contain:

- transcript plus relevant title, channel, description, or duration for an overview;
- selected text plus nearby transcript context for an explanation;
- transcript batches for translation; and
- nearby transcript context and video metadata when polishing a saved note.

DeepSeek uses `https://api.deepseek.com`; Google Gemini uses Google's OpenAI-compatible endpoint; OpenAI uses `https://api.openai.com/v1`; custom endpoints are entered by the user and require an HTTPS host permission request from Chrome.

DeepSeek V4 Flash remains the default model. Settings can route translation, explanation, overview/analysis, and note polishing to different configured models.

Those services process data under their own terms, privacy policies, retention practices, and account settings. Do not send confidential, personal, or regulated content unless their terms and your obligations permit it.


## Local storage and retention

YouTube Digest uses Chrome's local extension storage, not a YouTube Digest cloud service.

- Supadata and all AI provider settings and API keys remain on the device in Chrome's extension storage.
- Saved notes remain until you delete them or remove/clear the extension's data. The extension keeps up to 100 notes.
- Recent transcript, digest, and per-segment translation cache entries are stored
  locally. The cache is limited to 20 videos, and entries older than 30 days are
  removed when the side panel opens.

Chrome extension storage is not a password vault. Anyone with sufficient access to your browser profile or device may be able to recover locally stored keys or content. Use scoped keys where providers support them, set spending limits, and rotate or revoke a key if the device or browser profile is compromised.

To remove data:

- delete individual saved notes in YouTube Digest;
- use the Options page to clear cached digests, delete all notes, or reset all extension data;
- remove the extension or clear its stored data from Chrome to delete all local settings, keys, notes, and cache entries; and
- revoke keys in the Supadata or selected AI provider dashboard to stop their future use.

Clearing local data does not delete information already processed or retained by Supadata or an AI provider. Use each service's controls for service-side requests.

## Permissions

YouTube Digest uses Chrome permissions for these purposes:

- `sidePanel`: display the YouTube Digest interface beside YouTube.
- `storage`: store settings, keys, notes, and cached results locally.
- `tabs`: identify and interact with the active YouTube tab.
- `scripting`: coordinate the extension's YouTube page controls.
- YouTube host access: read the active video's URL and metadata and provide timestamp controls.
- Supadata host access: retrieve transcripts.
- DeepSeek, Google Gemini, and OpenAI host access: provide the built-in AI providers.
- Optional HTTPS host access: allow a user-configured custom OpenAI-compatible provider when the user grants the requested origin permission.

YouTube Digest does not use these permissions to monitor general browsing activity.

## No sale or advertising use

YouTube Digest does not sell personal information, build advertising profiles, or share data with data brokers. It does not include analytics SDKs.

## Changes

Privacy-relevant changes will be documented in this file and in the repository history. Review updates before installing a new version.

## Questions

This repository does not provide a public support or issue channel. Review this policy, the source code, and each provider's documentation before using the extension. For a vulnerability or accidental secret exposure, follow the private process in [SECURITY.md](SECURITY.md).
