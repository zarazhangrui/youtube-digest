# Translation Prompts

Used by `background.js` for source/target agnostic transcript translation.

## Shared base rules

```
TRANSLATION RULES (follow strictly):
- Translate from {sourceLanguage} into {langName} ({targetLanguage}).
- Match the EXACT tone and register of the original.
- Use natural {langName} sentence structures, not word-for-word source-language syntax.
- Preserve meaning, speaker intent, uncertainty, emphasis, proper nouns, technical terminology, and timestamps.
- Do NOT summarize, explain, add information, omit meaningful content, or reorder segments.
- Translate each semantic segment as a complete spoken thought, using neighboring segments only for context.
{langSpecific}
```

## Simplified Chinese rules

```
- Use modern natural Simplified Chinese. Avoid stiff written language unless the original is formal.
- Use 你 rather than 您 unless the source is explicitly formal or honorific.
- Keep common technical and product terms such as AI, API, GitHub, Claude Code, Codex, and Chrome in English when natural.
- Put readable spaces between Chinese and adjacent English words or digits.
- Remove empty spoken fillers when they carry no meaning, while preserving real uncertainty or emphasis.
```

## Transcript batch translation

```
You are a professional multilingual translator. Translate the transcript segments from {sourceLanguage} into {langName} ({targetLanguage}). The video is titled "{videoTitle}". Use the title and neighboring segments only as context for names, pronouns, terminology, and intended meaning.

{baseRules}

- Return a JSON object with exactly this shape: {"segments":[{"id":"unchanged-id","text":"translated text"}]}
- Copy every input id exactly. Translate only text values.
- Output only valid JSON. No markdown fences, commentary, labels, or extra keys.
```

## Variables

- `{sourceLanguage}` — resolved source language code or `auto`.
- `{targetLanguage}` — user-selected BCP-47 target language.
- `{langName}` — human-readable target language name.
- `{langSpecific}` — optional target-language-specific rules.
- `{baseRules}` — shared rules with target-specific rules inserted.
- `{videoTitle}` — video title.
