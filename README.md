# Капелюх

A complete Ukrainian word party game for friends sharing one phone. React, Vite and TypeScript; no backend or account required.

## Run

Use Node.js 22.12+ or 24 and pnpm 11:

```sh
pnpm install
pnpm dev
```

Open the address printed by Vite. To play on a phone, connect it to the same Wi-Fi and open the printed network address. Keep the same browser and address to resume a saved game.

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm preview
```

The production website is the `dist/` directory. Development and preview use the `/kitty-hat/` path so assets match the GitHub Pages deployment.

## Publish to GitHub Pages

```sh
pnpm run deploy
```

This builds locally and uses [gh-pages](https://github.com/tschaub/gh-pages) to publish only `dist/` to the `gh-pages` branch of `origin`. A `.nojekyll` file bypasses Jekyll. Git access to `git@github.com:yurkagon/kitty-hat.git` is required.

The site is [yurkagon.github.io/kitty-hat](https://yurkagon.github.io/kitty-hat/). In repository Settings → Pages, use **Deploy from a branch**, branch **gh-pages**, folder **/ (root)**. Repeat `pnpm run deploy` after changes to publish a fresh build. Use the explicit `run`: `pnpm deploy` is a different built-in workspace command. If `pn` is your pnpm alias, use `pn run deploy`.

## Browser tests

```sh
pnpm exec playwright install chromium
pnpm test:e2e
```

Tests cover a complete party, empty and partial setups, suggested/custom team names, character selection, keyboard dialog navigation, private drafts, both timer policies, sound scheduling, pause/resume, blocked storage, local HTTP access, and layouts at 320, 390, 430 and 1440px. Visual evidence is written to `.impeccable/review/`.

## Play

1. Choose suggested team names or enter your own. New teams have no players: use “Додати гравця” to choose an avatar, then enter the player's name manually. The picker starts with two fictional base avatars, a male cat and a female cat. It shows only images; catalog names stay in the data. Tap the player's avatar to change it while preserving the entered name. Add at least two players per team; the chosen portrait appears on that player's turn.
2. Choose words per player (1–20), turn duration (15–180 seconds), skip policy and timeout policy.
3. Pass the phone so each player privately writes their words or short phrases.
4. Play three rounds using the same notes: explanation, mime, then one-word clues.
5. Guess for one point, skip according to the chosen rule, and compare the combined three-round scores.

The next team starts each turn. Explainers rotate within each team and continue rotating across rounds. A tied score means a shared victory. Replay keeps the teams and settings but clears words and scores.

## Persistence and sound

Game state, player portraits and word drafts are stored under `hat.game.v1` in `localStorage`. Older saves with team mascots migrate to player portraits without losing words, scores or turns. A running turn uses an absolute deadline: reloading or switching tabs never adds time. Explicit pause freezes the remaining time. Words are covered when returning to the app. Invalid saves offer a new game; unavailable storage falls back to the current tab's memory.

Sound uses Web Audio, activated by a user action. The final ten seconds beep and expiration plays a three-note signal. Browser suspension, device mute settings and locked screens can prevent audible playback. The visible timer remains authoritative.

Words are private within the interface, not encrypted. Clearing browser data removes the party; there is no remote backup or device synchronization.

## Editable game data

```text
data/
  persons/
    data.json
    img/
      cat-generic-man.webp
      cat-generic-woman.webp
      cat-man.webp
      cat-woman.webp
      cat-andrii.webp
      cat-nazar.webp
      cat-artur.webp
      cat-yura.webp
      cat-ilona.webp
      cat-valeriia-1.webp
      cat-valeriia-2.webp
      cat-natalia.webp
      cat-nika.webp
      cat-natalia-2.webp
      cat-dania.webp
      cat-liosha.webp
      cat-ihor.webp
      cat-andrii-2.webp
      cat-yura-2.webp
      cat-levko.webp
      cat-rozaliia.webp
      cat-nastia.webp
      cat-yehor.webp
      cat-robert.webp
      cat-milana.webp
  teams.ts
```

`data/persons/data.json` is the character catalog:

```json
[
  { "name": "Базовий кіт", "img": "cat-generic-man.webp" },
  { "name": "Базова кішка", "img": "cat-generic-woman.webp" },
  { "name": "Кирил", "img": "cat-man.webp" },
  { "name": "Квітка", "img": "cat-woman.webp" },
  { "name": "Андрій", "img": "cat-andrii.webp" },
  { "name": "Назар", "img": "cat-nazar.webp" },
  { "name": "Артур", "img": "cat-artur.webp" },
  { "name": "Юра", "img": "cat-yura.webp" },
  { "name": "Ілона", "img": "cat-ilona.webp" },
  { "name": "Валерія", "img": "cat-valeriia-1.webp" },
  { "name": "Валерія", "img": "cat-valeriia-2.webp" },
  { "name": "Наталя", "img": "cat-natalia.webp" },
  { "name": "Ніка", "img": "cat-nika.webp" },
  { "name": "Наталя", "img": "cat-natalia-2.webp" },
  { "name": "Даня", "img": "cat-dania.webp" },
  { "name": "Льоша", "img": "cat-liosha.webp" },
  { "name": "Ігор", "img": "cat-ihor.webp" },
  { "name": "Андрій", "img": "cat-andrii-2.webp" },
  { "name": "Юра", "img": "cat-yura-2.webp" },
  { "name": "Левко", "img": "cat-levko.webp" },
  { "name": "Розалія", "img": "cat-rozaliia.webp" },
  { "name": "Настя", "img": "cat-nastia.webp" },
  { "name": "Єгор", "img": "cat-yehor.webp" },
  { "name": "Роберт", "img": "cat-robert.webp" },
  { "name": "Мілана", "img": "cat-milana.webp" }
]
```

To add a character, place their PNG, JPEG, WebP or AVIF image in `data/persons/img/` and append an entry with its filename. Keep existing filenames stable: saved games use them to remember portraits. Vite includes these images in the static build. `data/teams.ts` exports the suggested names; custom names can always be entered in the team-name field.

The two Андрій entries, the two Юра entries, the two Валерія entries and the two Наталя entries represent separate people, distinguished by their portraits and image filenames. Ilona's current portrait uses only her first, front-facing photo. For character-only additions, do not run automated tests, as requested by the user.

## Design and assets

The design follows [Impeccable](https://github.com/pbakaus/impeccable), installed locally at `.agents/skills/impeccable/`, and the code follows [Ponytail](https://github.com/DietrichGebert/ponytail) full mode. `PRODUCT.md`, `SURFACE.md` and `DESIGN.md` document product and design decisions. The local Impeccable skill is available to Codex on the next turn.

Twenty-seven transparent illustrations were generated using the built-in ImageGen tool and optimized into WebP: the hat and victory trophy in `public/art/`, plus twenty-five cat portraits (twenty-three based on user-provided photos and two fictional base avatars) in `data/persons/img/`. Exact prompts are in `art-prompts.json` and asset sidecars. Self-hosted Comfortaa and Nunito Sans fonts include their OFL licenses in `public/fonts/`.
