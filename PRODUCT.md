# Hat

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React, Vite, strict TypeScript. Client-only application with localStorage persistence.

## Users

Ukrainian-speaking friends playing a word guessing party game together and passing one phone around.

## Product Purpose

Run a complete three-round game, from team creation and private player-written words through timed turns to final scores.

## Operating Context

Mobile-first, shared device, in-person teams. Players must not see other players' word submissions. The phone moves between players before word entry and explaining turns.

## Capabilities and Constraints

At least two teams with at least two players each before play can begin. New teams start with no players; an avatar-selection modal adds players manually. The catalog in root `data/persons/data.json` retains names and image filenames; artwork lives in `data/persons/img/`. The picker shows only portraits, with generic numbered accessible labels. Selecting an avatar creates a player with an empty name for manual entry; replacing an avatar changes only the image and preserves the entered name. Catalog names remain internal and never autofill player inputs. Portraits appear during word entry, phone handoffs and explaining turns. `data/teams.ts` provides five suggested team names while custom names remain editable. Teams have names and scores. Configurable words per player, turn duration, skip penalty, timeout policy, and sound. Three rounds use the same words: explanation, mime, one word. Save partial setups, drafts, portraits, turns, scores and deadlines locally. Existing saves with team mascots or previous player-avatar IDs migrate without losing game progress. Replay keeps the chosen players, teams and settings. No backend, accounts, word packs, online multiplayer, PWA or deployment.

## Brand Commitments

Name: Капелюх. Ukrainian UI. Cozy illustrated board-game style: cream paper, gouache artwork, recognizable cat portraits of players, tactile large plus/minus buttons. Code and identifiers in English.

## Accessibility & Inclusion

Readable contrast, 48px touch controls, keyboard focus, reduced motion, sound paired with visible timer feedback.

## Character Asset Workflow

Do not run automated tests when adding character portraits. The two Андрій entries, the two Юра entries, the two Валерія entries and the two Наталя entries represent distinct people with separate images and internal catalog names. Player names are entered manually and independently from the avatar. Ilona’s replacement portrait uses only her first, front-facing photograph; keep its existing filename so saved selections remain valid.
