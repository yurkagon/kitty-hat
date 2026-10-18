---
name: "Капелюх"
description: "A cozy illustrated Ukrainian party game played on one shared phone."
colors:
  paper: "#f6f1e6"
  ink: "#2d493a"
  green: "#315a43"
  green-hover: "#284c38"
  green-light: "#e2e8d7"
  coral: "#b94230"
  coral-light: "#f2d6c8"
  coral-ink: "#83301e"
  yellow: "#ead19a"
  muted: "#626b58"
  line: "#d8d5c4"
  control-paper: "#fffaf0"
  action-paper: "#fff9ed"
  slip-paper: "#fffcf4"
  team-paper: "#ece9d8"
  team-peach: "#efe1d3"
  team-lilac: "#e9e1ef"
  team-sage: "#e0e7d8"
  team-butter: "#f1e5c7"
  team-blue: "#dde7e9"
  score-paper: "#ebeadd"
  field-line: "#d4d3c0"
  placeholder: "#70745f"
  focus: "#ad7030"
typography:
  display:
    fontFamily: "Comfortaa, sans-serif"
    fontSize: "clamp(28px, 4.8vw, 36px)"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Nunito, sans-serif"
    fontSize: "19px"
    fontWeight: 800
  body:
    fontFamily: "Nunito, sans-serif"
    fontWeight: 400
    lineHeight: 1.6
  intro:
    fontFamily: "Nunito, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Nunito, sans-serif"
    fontSize: "17px"
    fontWeight: 800
    lineHeight: 1.4
  supporting:
    fontFamily: "Nunito, sans-serif"
    fontSize: "13px"
    fontWeight: 400
  timer:
    fontFamily: "Nunito, sans-serif"
    fontSize: "58px"
    fontWeight: 800
    lineHeight: 1.2
rounded:
  field: "12px"
  slip: "14px"
  team: "16px"
  button: "18px"
  dialog: "20px"
  badge: "24px"
  progress-step: "30px"
  circle: "50%"
spacing:
  xs: "4px"
  sm: "8px"
  control-gap: "12px"
  md: "16px"
  lg: "20px"
  gutter: "24px"
  section: "28px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.green}"
    textColor: "{colors.action-paper}"
    typography: "{typography.label}"
    rounded: "{rounded.button}"
    padding: "15px 22px"
    width: "100%"
  button-primary-hover:
    backgroundColor: "{colors.green-hover}"
  button-secondary:
    backgroundColor: "{colors.green-light}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.button}"
    padding: "15px 22px"
    width: "100%"
  button-coral:
    backgroundColor: "{colors.coral-light}"
    textColor: "{colors.coral-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.button}"
    padding: "15px 22px"
    width: "100%"
  button-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.button}"
    padding: "15px 22px"
    width: "100%"
  text-field:
    backgroundColor: "{colors.control-paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "12px"
  setup-navigation:
    textColor: "{colors.muted}"
    padding: "7px 15px"
    rounded: "{rounded.progress-step}"
  team-badge:
    backgroundColor: "{colors.green-light}"
    textColor: "{colors.ink}"
    rounded: "{rounded.badge}"
    padding: "7px 16px"
  team-card:
    backgroundColor: "{colors.team-paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.team}"
    padding: "16px"
  word-slip:
    backgroundColor: "{colors.slip-paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.slip}"
    padding: "24px 20px"
  stepper:
    backgroundColor: "{colors.green-light}"
    textColor: "{colors.green}"
    rounded: "{rounded.slip}"
    size: "48px"
---

# Design System: Капелюх

## Overview

**Creative North Star: "The Cozy Illustrated Board Game"**

Cream paper, forest-green actions, warm accents and gouache artwork make the shared phone feel like a small tabletop game. The illustrated hat and player-owned cat portraits, combining photo-based people with fictional base avatars, supply character; rounded controls and quiet paper surfaces keep the interface welcoming and readable.

The system stays compact and centered, even on desktop. Headings, the current player, a visible countdown and one clearly drawn word slip carry the game. Private handoffs and pauses replace the word with a calm confirmation screen, while Ukrainian copy addresses the player directly.

**Key Characteristics:**
- Cream paper with forest-green ink and actions.
- Gouache hat, trophy and player-owned cat portraits.
- Comfortaa headings paired with self-hosted Nunito Sans body text.
- Large rounded touch controls and restrained tactile depth.
- A centered mobile column with private handoffs and visible timer feedback.

## Colors

The palette combines warm paper neutrals, botanical greens and restrained coral and butter accents. The frontmatter owns the exact color values.

### Primary
- **Forest Green** (`green`): primary actions, wordmark, scores, stepper controls and timer progress. Its darker hover tone is `green-hover`.
- **Light Sage** (`green-light`): secondary actions, active setup steps, team badges, selected score rows and privacy symbols.

### Secondary
- **Coral** (`coral`): the wordmark dot and the last-ten-seconds timer state.
- **Soft Coral** (`coral-light`) with **Coral Ink** (`coral-ink`): skip buttons. The plus and minus labels state the action and scoring consequence alongside the color.

### Tertiary
- **Butter Yellow** (`yellow`): round-number discs, round tips, winning result rows and text selection.

### Neutral
- **Cream Paper** (`paper`): the page and dialog ground.
- **Forest Ink** (`ink`): readable primary text.
- **Muted Olive** (`muted`): supporting copy, labels and metadata.
- **Control Paper**, **Action Paper** and **Slip Paper**: slightly different warm whites for fields, primary-button text and the drawn word.
- **Team Paper**, **Peach**, **Lilac**, **Sage**, **Butter** and **Blue**: the six softly tinted team-editor surfaces. Teams are identified by their names and scores; portraits belong to individual players.
- **Score Paper** (`score-paper`): quiet scoreboard and results rows.
- **Line** and **Field Line**: separators and input borders. **Placeholder** retains readable olive text inside fields.
- **Warm Focus** (`focus`): the visible keyboard focus outline.

### Named Rules

**The Action Color Rule.** Green advances or confirms; soft coral identifies skipping; yellow marks round guidance and winners. Keep the labels and symbols that explain those roles.

## Typography

**Display Font:** Comfortaa, with sans-serif fallback.

**Body Font:** Nunito Sans, registered locally as `Nunito`, with sans-serif fallback.

**Character:** Rounded Comfortaa gives headings the friendly character of a board-game title. Nunito Sans carries instructions, controls and numerical feedback without competing with the artwork. The frontmatter preserves the shipped CSS family stack `Nunito, sans-serif`; `Nunito` is the local alias for the bundled Nunito Sans files, confirmed by their OFL license.

### Hierarchy
- **Display:** the frontmatter's responsive heading treatment. The home headline uses `clamp(27px, 5vw, 36px)` and becomes (39px) from (700px); the word slip uses `clamp(25px, 6vw, 38px)`.
- **Title:** bold Nunito Sans section titles. Setting-row titles are smaller (17px); dialog titles use Comfortaa (22px, line-height 1.5).
- **Body:** Nunito Sans regular; paragraphs use line-height (1.6). The body size inherits the browser default rather than an explicit root size.
- **Intro:** enlarged instructions and introductory copy. Home supporting copy becomes (18px) from (700px).
- **Label:** strong sentence-case action text. Supporting metadata usually uses (12–14px); there is no uppercase eyebrow system.
- **Timer:** large, bold tabular numerals. Scores also use tabular numerals; round numbers use Comfortaa (76px), while turn-earned scores use Nunito Sans (74px).

### Named Rules

**The Readable Word Rule.** Keep the active word in Comfortaa, centered on its paper slip, with wrapping for long words and phrases. Animation never delays its visibility.

## Layout

The outer shell has a maximum width of (960px), horizontal gutters of (24px), safe-area top/bottom padding and a minimum height of (100svh). Its header spans the shell; the main content remains a centered column of at most (560px). The footer follows content through a flex-column shell rather than covering controls.

The home action group is capped at (340px). Handoff and finish actions may be capped at (380px). Setup forms stack team cards with (22px) gaps. Most supporting groups use repeated gaps or padding drawn from the frontmatter spacing tokens; the code also uses context-specific values rather than a strict mathematical scale.

At (700px) and above, the header, screens and center layouts gain vertical room; team-card padding increases to (22px), and the word slip increases from (210px) to (240px) minimum height. Desktop keeps the same single-column game flow.

The avatar dialog keeps its image-only choices in two equal grid columns with (12px) gaps at every supported width. At (359px) and below, shell gutters become (16px), team-card padding becomes (12px), setting labels move above full-width steppers, play buttons tighten, and result-number columns narrow. The supported body minimum is (320px).

**The Shared Phone Rule.** Prioritize the current player, private content and the next action inside the centered column; retain explicit handoff screens before revealing private words.

## Elevation & Depth

Paper surfaces use soft tonal layering. The word slip has a diffuse ambient shadow, and dialogs float above a dim green backdrop. Large action controls carry a short shaded lower edge plus a faint ambient shadow; pressing them moves them down (3px) and removes the shadow. This describes the shipped control treatment rather than establishing hard offset shadows as a general decoration rule.

### Shadow Vocabulary
- **Primary control:** `0 5px 0 -1px #254533, 0 8px 12px -7px #315a4350`.
- **Secondary control:** `0 4px 0 -1px #c6cfb4, 0 7px 12px -9px #315a4350`.
- **Coral control:** `0 4px 0 -1px #d8aa96, 0 7px 12px -9px #aa493450`.
- **Stepper control:** `0 3px 0 -1px #c6cfb4, 0 5px 8px -8px #315a4350`.
- **Word slip:** `0 6px 22px -8px #64553735`.
- **Dialog:** `0 22px 90px #182d3850`; backdrop `#203e32a6`.

The word-draw motion lasts (0.26s), moving from a slight rotation (-2deg) and vertical offset (5px) to rest with `cubic-bezier(0.16, 1, 0.3, 1)`. Button transitions last (0.15s), icon-background transitions (0.16s). Reduced-motion preferences remove animations and transitions.

## Shapes

Gentle rounded rectangles distinguish fields, slips, team cards, actions and dialogs through the frontmatter radius tokens. Team badges and setup steps have tighter capsule silhouettes; utility icon controls and round markers are circular. Paper fields and avatar-choice buttons use thin borders and control-paper backgrounds; avatar choices are immediate actions rather than selected toggles. Team-name editing instead uses a transparent, square field with a single bottom border.

The twenty-seven generated raster assets are the hat and trophy in `public/art/`, and twenty-five approved cat portraits (`cat-generic-man.webp`, `cat-generic-woman.webp`, `cat-man.webp`, `cat-woman.webp`, `cat-andrii.webp`, `cat-nazar.webp`, `cat-artur.webp`, `cat-yura.webp`, `cat-ilona.webp`, `cat-valeriia-1.webp`, `cat-valeriia-2.webp`, `cat-natalia.webp`, `cat-nika.webp`, `cat-natalia-2.webp`, `cat-dania.webp`, `cat-liosha.webp`, `cat-ihor.webp`, `cat-andrii-2.webp`, `cat-yura-2.webp`, `cat-levko.webp`, `cat-rozaliia.webp`, `cat-nastia.webp`, `cat-yehor.webp`, `cat-robert.webp` and `cat-milana.webp`) in `data/persons/img/`, all with provenance sidecars. `data/persons/data.json` pairs the internal reference names Базовий кіт, Базова кішка, Кирил, Квітка, Назар, Артур, Ілона, Ніка, Даня, Льоша, Ігор, Левко, Розалія, Настя, Єгор, Роберт, Мілана, two separate people both labeled Юра, two separate people both labeled Андрій, two separate people both labeled Валерія and two separate people both labeled Наталя with their image filenames. These catalog names identify source portraits internally and are not shown in the avatar picker. The first two entries are fictional base avatars with no human identity references; existing portraits guided the medium only. Базовий кіт (`cat-generic-man.webp`) has warm gray/cream fur, brown eyes, a small dark tuft and a muted sage overshirt over a cream T-shirt. The final neutral Базова кішка (`cat-generic-woman.webp`) has muted taupe/cream fur, simple short-to-medium light-brown side-parted hair, natural brown eyes, a restrained expression and a plain light stone/beige crewneck sweater, without elaborate curls or accessories. Her revised portrait retains its production filename; the manifest records the initial/correction prompts and immutable intermediate path. Левко (`cat-levko.webp`) has dark shaggy wavy hair, brown eyes, a small beauty mark on the lower left cheek, a gentle half-smile and a navy T-shirt. Розалія (`cat-rozaliia.webp`) has long center-parted light-chestnut hair, brown eyes, a calm half-smile, a beige trench over cream knitwear and a tiny gold pendant. Both are transparent gouache cat busts with two cat ears. Настя (`cat-nastia.webp`) has center-parted shoulder-length light-chestnut hair with softly curved ends, a wide open toothy smile, lifted cheeks and dimples, smiling brown-hazel eyes, a head tilt and a cream/oatmeal rib-knit turtleneck; the transparent cat bust has two cat ears. Єгор (`cat-yehor.webp`) has short medium-brown messy hair with a spiky tuft toward image right, brown eyes, a gentle half-smile, faint chin stubble and a gray mock neck. Роберт (`cat-robert.webp`) has short side-swept light-auburn hair, pale gray-blue-green eyes, a short red-blond beard and a black crewneck with gray fabric at the neckline. Мілана (`cat-milana.webp`) has long straight dark burgundy/chestnut hair with a center part, light blue-gray eyes, gently rounded cheeks, a calm small closed smile and a zipped coral-pink quilted puffer with a cream chest band and dusty-rose lower panel; the transparent gouache bust has exactly two cat ears. The Юра profiles are separate people (`cat-yura.webp` and `cat-yura-2.webp`); the second has short dense messy light-brown curls with cropped sides, full rounded cheeks, a broad neck and shoulders, brown-hazel eyes, a gentle closed half-smile, a head tilt toward image right, a clean-shaven face, a gray hoodie with drawstrings and no text, and exactly two cat ears. The original Юра and filename remain unchanged. The Андрій profiles are separate people (`cat-andrii.webp` and `cat-andrii-2.webp`); the second has long dark center-parted hair swept behind the temples, a broad rounded face, dark-brown eyes, a neutral direct gaze, sparse moustache/chin stubble, a black crewneck sweatshirt with a thin teal undershirt collar and exactly two top cat ears. The original Андрій and filename remain unchanged. The Валерія portraits remain distinct: dark straight hair and a red floral dress in `cat-valeriia-1.webp`, short light curls and a white T-shirt in `cat-valeriia-2.webp`. The Наталя profiles also remain separate (`cat-natalia.webp` and `cat-natalia-2.webp`); the second has dark long waves, two silver clips and a white shirt. Даня (`cat-dania.webp`) has short dark curls, a leftward gaze, a black shirt with a blue/yellow sunflower and a backpack. Льоша (`cat-liosha.webp`) has chin-length straight dark-blond/light-brown hair swept back off-center, blue eyes, a gentle closed smile, a charcoal standing-collar half-zip fleece and exactly two cat ears. Ігор (`cat-ihor.webp`) has short tousled side-swept light-brown/dark-blond hair, gray-blue eyes, a reserved direct gaze, sparse chin stubble and a black hoodie. Ілона’s frontal portrait was regenerated using only her first photo as its human reference; `cat-ilona.webp` is retained for existing saved selections. Their painted edges supply texture; interface surfaces remain clean rather than adding synthetic paper grain.

## Components

### Buttons

Confident, rounded controls with a generous tap area.

- Primary, secondary, coral and quiet variants share the frontmatter geometry, a minimum height of (60px), an internal gap of (12px) and bold labels.
- Primary hover darkens the green; all main controls translate down (3px) on press. Disabled controls use opacity (0.45) and a default cursor.
- Keyboard focus uses a warm (3px) outline offset by (4px).
- Play actions sit side by side with a (14px) gap, a minimum height of (78px), and (30px) plus/minus SVG symbols. They include a smaller line explaining score consequences.
- Text actions are transparent, green and bold with (48px) minimum height; an underline appears on hover. Icon actions are circular (48px) controls with a light-sage hover surface.

### Chips

Team badges identify the current team on handoff screens. They use light sage, (13px) bold text, the badge radius and wrapping for long names. They are labels rather than toggle buttons.

### Cards / Containers

Team editors use the softly tinted team surfaces and team radius. Their ordinary padding is in the frontmatter, with responsive adjustments documented in Layout. Editable team names and player rows give each team a compact identity block. Each player row contains that player’s chosen portrait. New team cards show a zero-player count and a muted (14px) empty-state message; “Додати гравця” opens avatar selection. Players can be added or removed manually, and the next-step action remains disabled until each team has at least two players with names. Scoreboard and final-results rows show team names and scores without portraits. Score rows use (12px) corners and highlight the active team in light sage; final winner rows use butter yellow.

### Player Portraits

Avatar selection belongs to each player and uses the shared native modal dialog. “Додати гравця” opens “Обери аватар” with twenty-five image-only choices and the instruction “Обери картинку для гравця. Ім’я введи в команді.” Catalog names remain internal and are neither displayed nor announced by the picker; buttons use generic accessible labels “Аватар N”. Choosing an image creates a player with that avatar and an empty name field, then closes the dialog. The player’s name is entered manually in the team row. The player-row portrait itself is a native button that opens the same picker titled “Змінити аватар”; there is no separate text action. Its accessible label identifies the player and team (“Змінити аватар гравця N, команда N”). Replacement updates only the image and preserves the existing player name. Existing saved names and selections remain intact.

The choices form two equal columns with (12px) gaps and container padding of (8px 0 12px); the twenty-five avatars occupy thirteen rows, with one choice in the last row. The native dialog scrolls within its existing height cap so the final choice remains reachable on small screens. Each button uses a (1px) field-line border, control-paper background, (12px) corners, (12px 8px) padding. Buttons contain only the portrait, without visible name labels. Hover shifts the background to `#e5ebdc` over (0.16s); the shared keyboard focus outline remains visible. These are immediate selection actions without a persistent pressed state.

The player-row portrait and its clickable native-button target are (56px × 56px). The button centers the image in a grid, does not shrink, uses no padding or border, has (12px) corners and a transparent background, and receives the shared keyboard focus outline. Dialog-choice portraits are (112px × 128px) with maximum width (100%); word-entry portraits remain (88px × 96px), centered above the heading. Playing uses (72px × 80px), while word handoff, turn handoff, privacy cover and turn summary use (160px × 176px). Portraits accompany the player’s visible name, and the playing header leads with the player name above team and round metadata. Team score and results rows remain text-only.

### Inputs / Fields

Player fields have control-paper backgrounds, (1px) field-line borders, (48px) minimum height and visible placeholder text. Private word fields share the style but increase minimum height to (56px). Team-name inputs are transparent, bold (19px) and underlined. A native “Готова назва” select offers the five suggestions from `data/teams.ts` plus “Власна назва”; the text field remains editable. The select has (48px) minimum height, (10px) padding, a (1px) field-line border, (12px) corners and a control-paper background. All receive the shared keyboard focus outline; word validation appears as a warm coral-toned alert rather than relying on field color alone.

Numeric settings use (48px) plus/minus controls surrounding a bold (24px), tabular output. Controls disable at their limits. Radio and checkbox settings remain native controls with the forest-green accent color and explicit labels.

### Navigation

The header combines a Comfortaa wordmark with inline hat SVG and (48px) sound/help icon controls. The wordmark returns to home; returning home during a turn pauses it. Setup progress is a row of three text steps, with the current step rendered as a light-sage capsule; these are indicators rather than clickable navigation tabs. Back actions use the shared text-button treatment.

### Private Handoffs and Word Slip

Handoffs present the current player’s chosen cat portrait, player name and team badge before a confirmation action reveals private input or begins the turn. A privacy cover with the current player’s portrait reappears when secret content returns from a hidden browser tab or restored session. Pause screens hide the current word and preserve the remaining time.

The active word sits on slip paper with contextual round instruction above and remaining-word count below. Each newly drawn slip triggers the brief paper motion. Instructions change for explanation, mime and a single-word clue. Above the slip, the timer and progress bar become coral during the final (10 seconds), paired with optional audio countdown feedback. Sound availability does not replace the visual timer.

### Dialogs

Native modal dialogs carry the cream ground, (20px) radius and (28px 24px) content padding. Width is `min(480px, calc(100vw - 32px))`; maximum height is `calc(100svh - 48px)`. Rules, reset confirmation and avatar selection use the same dialog structure. Close control, Escape and backdrop click dismiss them. Closing explicitly restores focus to the opening control when it remains connected.

## Do's and Don'ts

### Do:
- **Do** retain cream paper, forest-green actions, soft coral skips and butter-yellow guidance.
- **Do** use the existing local gouache hat and trophy, and attach an approved catalog cat portrait to each player rather than to their team.
- **Do** pair Comfortaa headings with the shipped Nunito Sans fonts and visible, wrapping Ukrainian labels.
- **Do** preserve 48px touch controls, the warm keyboard focus outline and reduced-motion behavior.
- **Do** keep the active word visible immediately, with round-specific instruction and visible countdown feedback.
- **Do** hide private words behind handoff, privacy-cover and pause screens.

### Don't:
- **Don't** substitute emoji, glyph icons or generic stock illustrations for the shipped SVG controls and gouache artwork.
- **Don't** depend on color or sound alone to explain actions, scoring or time remaining.
- **Don't** replace the centered mobile game flow with a dense desktop dashboard.
- **Don't** expose private words on handoff or pause screens, or animate their appearance after a delay.
- **Don't** expand the control shadows into a general hard-shadow decoration system.
