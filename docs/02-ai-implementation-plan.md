# Drupal AI: Implementation Plan

This plan turns the research in [01-ai-research.md](./01-ai-research.md) into small, testable steps for this project. The goal is to start with the smallest setup that proves AI works, then add features one at a time.

Module versions were checked against packages.drupal.org on 2026-10-15.

## Problems with the research document

The research is a useful overview, but don't follow its "blueprint" section as written:

- **It assumes a brand-new project on PHP 8.3.** This repo is already a Drupal 11.4 site on PHP 8.4 running on DDEV, so we only need to add modules to it.
- **Some versions are wrong or don't exist.** `field_widget_actions:^1.59` doesn't exist (the latest is 1.5.0), and `ai_vdb_provider_milvus:~1.030` is really 1.1.0-beta.
- **Several "production-ready" modules aren't stable yet.** `ai_knowledge_connector` and `ai_search` are alpha, the Milvus provider is beta, `ai_context` is a release candidate, and `ai_provider_ollama` is a release candidate.
- **It starts with the heaviest setup: Ollama, LiteLLM and Milvus all at once.** That is the opposite of a minimal start. The dev container has about 7 GB of RAM and no GPU, and a local model would not work on Silta deployments anyway.

## Step-by-step plan

### Step 1: the smallest setup that proves AI works

Provider: [MIRAI](#mirai-internal-tool) with the model `google_genai.gemini-2.5-flash`.

What is already in the repo:

- `drupal/ai` (1.5.1) and `drupal/ai_provider_openai_compatible` (1.2.1) in `composer.json`. `drupal/key` comes in as a dependency. Drupal core was updated to 11.4.10 (security release) at the same time, because Composer refused to install the stable AI module next to the insecure 11.4.8.
- The recipe [recipes/ai_mirai](../recipes/ai_mirai/recipe.yml). It enables `key`, `ai`, `ai_api_explorer` and `ai_provider_openai_compatible`, creates the Key entity `mirai_api_key`, configures the provider and sets it as the default for "Chat".

The API key and the MIRAI hostname are never stored in config. This repository is public, so the exported endpoint is the placeholder `https://mirai.example.com/api`; `settings.php` replaces it at runtime with the `MIRAI_API_URL` environment variable (see below). The Key entity reads the key from the `MIRAI_API_KEY` environment variable. The project root `.env` does not work for this: [load.environment.php](../load.environment.php) only fills `$_ENV`/`$_SERVER`, and the Key module reads `getenv()`. So the variables go into DDEV's web container instead.

1. Create `.ddev/.env.web` (ignored by git):

   ```bash
   MIRAI_API_URL=https://<mirai-host>/api
   MIRAI_API_KEY=<your MIRAI API key>
   ```

2. Make sure `web/sites/default/settings.php` contains the endpoint override:

   ```php
   // MIRAI endpoint for the AI module. Config only holds a placeholder, because this repository is public.
   if ($mirai_api_url = getenv('MIRAI_API_URL')) {
     $config['ai_provider_openai_compatible.settings']['endpoint'] = $mirai_api_url;
   }
   ```

   The override is not exported by `drush cex`, so the placeholder stays in `config/sync`.

3. Restart DDEV and run the database updates from the core update:

   ```bash
   ddev restart
   ddev drush updb -y
   ```

4. Apply the recipe (the path is relative to `web/`):

   ```bash
   ddev drush recipe ../recipes/ai_mirai -y
   ```

   To use another model, add `--input=ai_mirai.chat_model=<model-id>`.

5. **Test:** log in (`ddev drush uli`), open `/admin/config/ai/explorers`, choose the Chat Generation explorer, send a prompt and check that you get an answer.
6. Export the config and commit `config/sync`:

   ```bash
   ddev drush cex -y
   ```

   Check that `ai_provider_openai_compatible.settings.yml` still contains the placeholder endpoint, not the real MIRAI host. If the endpoint was ever entered in the provider settings form, the real host is stored in the database and `cex` exports it. Reset the stored value first (the `settings.php` override still applies at runtime):

   ```bash
   ddev drush cset ai_provider_openai_compatible.settings endpoint 'https://mirai.example.com/api' -y
   ```

Other environments (Silta) need `MIRAI_API_URL` and `MIRAI_API_KEY` as environment variables (the key as a secret), and MIRAI must be reachable from there. Without them the site still deploys, but AI requests fail.

### Step 2: the first feature editors can use

The CKEditor AI assistant is set up by the recipe [recipes/ai_ckeditor](../recipes/ai_ckeditor/recipe.yml). It:

- enables `ai_ckeditor` and `taxonomy`;
- adds the **AI Assistant** button (`aickeditor`) and the text selection menu (`ai_balloon_menu`) to the Basic HTML and Full HTML editors;
- enables all tools: Generate, Modify with a prompt, Reformat HTML, Fix spelling, Summarize, Tone, Translate and Help. The tools have no model of their own, so they use the default chat provider from step 1;
- creates the vocabularies "Tone of voice" (`ai_tone`) and "Translation languages" (`ai_translation_languages`) with starter terms. The tone tool sends the term description to the AI as the tone description;
- gives the Content editor role the `use ai ckeditor` permission.

1. Apply the recipe:

   ```bash
   ddev drush recipe ../recipes/ai_ckeditor -y
   ```

2. **Test:** open `/node/add/article`, type a few sentences in Body and select them. Choose **AI Assistant** in the menu that appears next to the selection (or under "Show more items" in the toolbar), then try Summarize, Tone > Friendly and Translate > Finnish.
3. Export the config and commit `config/sync`:

   ```bash
   ddev drush cex -y
   ```

Notes:

- `ai_ckeditor` inside the AI module is deprecated and will be removed in AI 1.6.0. The standalone [drupal/ai_ckeditor](https://www.drupal.org/project/ai_ckeditor) project replaces it, but has no stable 1.5 release yet, and AI 1.5.1 doesn't require it. We use the bundled module for now. When upgrading to AI 1.6, run `composer require drupal/ai_ckeditor` first: the machine name and config are the same.
- The recipe has `config: import: ai_ckeditor: '*'`. Recipes don't create a module's default config entities otherwise, so the AI prompts (`ai.ai_prompt.ai_ckeditor_*`) would be missing and every tool would send an empty prompt. The model then answers with generic text that has nothing to do with the selection.
- The tone and language terms are content, not config. `drush cim` on another environment creates the vocabularies but not the terms, so apply the recipe there too, or add the terms by hand.
- The browser console shows the CKEditor warning `toolbarview-item-unavailable {item: ai_balloon_menu}`. It is harmless: that toolbar item only switches on the selection menu and has no button of its own.

### Step 3: help with fields and metadata

Add AI Automators plus Field Widget Actions, for example a "Generate tags" button on `field_tags`. Optionally add AI Content Suggestions.

### Step 4: control and logging

- Turn on AI logging or observability.
- Set role permissions.
- Decide whether AI config should be local-only or deployed to Silta. This repo already has config splits for that (see [config/](../config)).

### Step 5 and later, only if needed

- AI Translate.
- AI Search / RAG with a vector database. This is the heaviest and least mature part.

## Choosing an AI provider

| Provider | Cost | Module status | Notes |
| --- | --- | --- | --- |
| **GitHub Models** (GitHub token) | Free with rate limits, higher with Copilot Business | `ai_provider_openai_compatible` 1.2.1 stable | Can use your work GitHub account. See [GitHub Copilot](#github-copilot) below. |
| **Google Gemini** (AI Studio key) | Free tier | `gemini_provider` 1.1.0 stable | Easiest zero-cost start. On the free tier Google may use the data, so test with dummy content only. |
| **OpenAI** | Pay per use, cents for testing | `ai_provider_openai` 1.2.5 stable | The best-supported provider in the Drupal AI ecosystem. |
| **amazee.io AI** | Free trial key | `ai_provider_amazeeio` 1.4.6 stable | What Drupal CMS uses by default; hosted in the EU. |
| **Anthropic Claude** | Pay per use | `ai_provider_anthropic` 1.2.2 stable | Good quality for writing text. |
| **Azure OpenAI** | Company subscription | `ai_provider_azure` beta | Probably the answer if the company already has an Azure contract. |
| **Ollama** (local) | Free | `ai_provider_ollama` release candidate | Private, but needs to run on your own machine, ideally one with a GPU or Apple Silicon. Not usable on Silta. |

### Options available through work

#### GitHub Copilot

A Copilot subscription itself **cannot** be used as an API from Drupal. Its endpoint is only meant for Copilot clients (IDEs, CLI), and using it through unofficial proxies breaks GitHub's terms.

The related product **GitHub Models** can be used:

- OpenAI-compatible endpoint: `https://models.github.ai/inference`.
- Authentication: a fine-grained GitHub personal access token with the `models:read` permission.
- Model names include the vendor, for example `openai/gpt-4.1` or `openai/gpt-4o-mini`.
- Free with rate limits; Copilot Business/Enterprise users get higher limits. The GitHub organization admins may have disabled it, so check first.
- Drupal module: `drupal/ai_provider_openai_compatible` (1.2.1 stable). Set the API endpoint to the URL above and the API key to the token.

This is a good fit for step 1 testing with dummy content.

#### MIRAI (internal tool)

The Mearra Quality System describes MIRAI as "AI chat with premium LLMs", and says to use its Gemini models for client or personal data.

MIRAI runs on [Open WebUI](https://docs.openwebui.com/), which has an OpenAI-compatible API ([API endpoints](https://docs.openwebui.com/reference/api-endpoints/), [API keys](https://docs.openwebui.com/features/authentication-access/api-keys/)):

| Endpoint | Purpose |
| --- | --- |
| `GET /api/models` | List the models your account can use. |
| `POST /api/chat/completions` | OpenAI-compatible chat completions. |

API keys are personal: each user has one key that acts with that user's permissions. An admin must switch on **API Keys** globally (Settings > Admin > Authentication) and give non-admin users the **API Keys** feature permission. Admins can also restrict which endpoints keys may call.

**Status (2026-10-15):** checked with [scripts/ai-endpoint-check.sh](../scripts/ai-endpoint-check.sh). API keys are enabled, `https://<mirai-host>/api/models` returns the model list with a personal key, and `/api/chat/completions` answers.

The model list includes OpenAI (GPT-4.1, GPT-5, o-series), Anthropic Claude, Google Gemini, Mistral and self-hosted Ollama models. Model IDs must be used exactly as listed, including any prefix:

| Use | Model ID | Why |
| --- | --- | --- |
| Chat, step 1 default | `google_genai.gemini-2.5-flash` | Gemini (required for client data), fast and cheap. |
| Chat, higher quality | `google_genai.gemini-2.5-pro` | Gemini, better for longer or harder texts. |
| Embeddings, later (AI Search) | `nomic-embed-text:latest` | Listed, but whether MIRAI serves embeddings through the API is not checked yet. |

Avoid `gpt-3.5-turbo`: it has a shutdown date of 2026-10-23.

##### Checking MIRAI with curl

Set the address (replace with the real MIRAI URL):

```bash
MIRAI_URL="https://mirai.example.com"
```

1. **No login needed:** check that it's Open WebUI and whether API keys are switched on. In the config output, look for `enable_api_key`.

   ```bash
   curl -s "$MIRAI_URL/api/version"
   curl -s "$MIRAI_URL/api/config"
   ```

   If these return a login page or redirect instead of JSON, MIRAI is behind SSO or a VPN, and the admins must allow API access through it.

2. **Get a key:** in MIRAI open your profile > Settings > Account > API keys > Show > Create new secret key. If the section is missing, ask the MIRAI admins to enable API keys for you. Read the key without saving it in shell history:

   ```bash
   read -rs MIRAI_API_KEY && export MIRAI_API_KEY
   ```

3. **List models** and note the exact `id` of the model you want (for example a Gemini model):

   ```bash
   curl -s -H "Authorization: Bearer $MIRAI_API_KEY" "$MIRAI_URL/api/models" \
     | python3 -c 'import json,sys; [print(m["id"]) for m in json.load(sys.stdin)["data"]]'
   ```

4. **Send a test prompt:**

   ```bash
   curl -s "$MIRAI_URL/api/chat/completions" \
     -H "Authorization: Bearer $MIRAI_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"model": "MODEL_ID", "messages": [{"role": "user", "content": "Say hello in one sentence."}]}'
   ```

5. **Check from the Drupal container:** Drupal calls MIRAI from the DDEV web container, so repeat step 1 there:

   ```bash
   ddev exec curl -s "$MIRAI_URL/api/version"
   ```

##### Troubleshooting

`curl -s -f` hides errors. To see what actually happens, use [scripts/ai-endpoint-check.sh](../scripts/ai-endpoint-check.sh). It calls `/models` and `/chat/completions` and prints the curl exit code, HTTP status and the start of each response. It never prints the key.

`OPENAI_API_URL` is the base URL that `/chat/completions` is added to. For Open WebUI that is `https://<mirai-host>/api`, so don't add `/api` twice.

Run it in a terminal on your own machine, from the project folder (with VPN on, if MIRAI needs it):

```bash
export OPENAI_API_URL="https://<mirai-host>/api"
read -rs OPENAI_API_KEY && export OPENAI_API_KEY   # paste the key, press Enter (nothing is shown)
./scripts/ai-endpoint-check.sh                     # lists models
./scripts/ai-endpoint-check.sh MODEL_ID            # also sends a test prompt to that model
```

To test from the DDEV web container, where Drupal runs, run `ddev ssh` first and then the same commands.

How to read the result:

| Result | Meaning |
| --- | --- |
| curl exit `6` or `7`, or `28` | Host not found, connection refused, or timeout: usually VPN, or a firewall in the container you ran it from. |
| curl exit `60` | TLS certificate problem, for example a company proxy certificate. |
| `302` or `text/html` | SSO or a login page is in front of the API. |
| `401` / `403` | Key is wrong, or API keys are not enabled for your account. |
| `404` / `405` | Wrong base URL, for example `/api` missing or added twice. |
| `400` | Endpoint works, but the model ID or payload is wrong. Use an `id` from `/models`. |
| `200` with `application/json` | Works. |

Note: the agent dev container (`.devcontainer`) has an outbound firewall, so test from your own machine or the DDEV web container, not from there.

##### Using MIRAI in Drupal

If the checks work, use `drupal/ai_provider_openai_compatible` with:

- **API endpoint:** `$MIRAI_URL/api`, because the module adds `/chat/completions` and `/models` itself.
- **API key:** a Key entity that reads the MIRAI key from an environment variable.
- **Model:** the `id` from step 3. Use a Gemini model for client content, as the company policy requires.

Open questions for the MIRAI admins:

1. Is using a personal API key from a Drupal site allowed, or should a project have its own service account?
2. Can MIRAI be called from Silta environments, or only from the office network or VPN?
3. Does MIRAI offer an embeddings endpoint? It's needed later for AI Search.

Because the policy prefers Gemini for client data, it is also worth asking whether the company has a Gemini API or Google Cloud (Vertex AI) agreement that projects can use directly.

### Recommendation

1. **Now:** prove step 1 works with **GitHub Models** and a personal access token (or Gemini's free tier), using dummy content only.
2. **In parallel:** run the [MIRAI curl checks](#checking-mirai-with-curl), and ask which AI vendors are approved for client content.
3. **Later:** switch the provider to the approved company option before using real client content.

Because the Drupal AI module works the same way with any provider, switching later is just a settings change.
