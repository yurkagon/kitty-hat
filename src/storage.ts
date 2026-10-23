import {
  avatarIds,
  getExplainer,
  getPlayers,
  getTeam,
  setupIsValid,
  type GameState,
} from "./game";

export const storageKey = "hat.game.v1";
const stages = [
  "teams",
  "settings",
  "word-handoff",
  "words",
  "round-intro",
  "turn-handoff",
  "playing",
  "paused",
  "timeout",
  "turn-summary",
  "finished",
];
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const isString = (value: unknown): value is string => typeof value === "string";
const isInteger = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value);
const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);
const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every(isString);

export const isGameState = (value: unknown): value is GameState => {
  if (
    !isRecord(value) ||
    value.version !== 1 ||
    !isString(value.stage) ||
    !stages.includes(value.stage)
  )
    return false;
  if (
    !isRecord(value.settings) ||
    !isRecord(value.drafts) ||
    !Array.isArray(value.teams) ||
    value.teams.length < 2
  )
    return false;
  const settings = value.settings;
  if (
    !isInteger(settings.wordsPerPlayer) ||
    settings.wordsPerPlayer < 1 ||
    settings.wordsPerPlayer > 20
  )
    return false;
  if (
    !isInteger(settings.duration) ||
    settings.duration < 15 ||
    settings.duration > 180 ||
    settings.duration % 15 !== 0
  )
    return false;
  if (
    !["free", "penalty", "disabled"].includes(String(settings.skip)) ||
    !["confirm", "strict"].includes(String(settings.timeout)) ||
    typeof settings.sound !== "boolean"
  )
    return false;
  if (
    !value.teams.every(
      (team) =>
        isRecord(team) &&
        isString(team.id) &&
        team.id.length > 0 &&
        isString(team.name) &&
        team.name.length <= 40 &&
        Array.isArray(team.players) &&
        team.players.every(
          (player) =>
            isRecord(player) &&
            isString(player.id) &&
            player.id.length > 0 &&
            isString(player.name) &&
            player.name.length <= 40 &&
            isString(player.avatar) &&
            (avatarIds as readonly string[]).includes(player.avatar),
        ) &&
        Array.isArray(team.scores) &&
        team.scores.length === 3 &&
        team.scores.every(isInteger) &&
        isInteger(team.nextPlayer) &&
        team.nextPlayer >= 0 &&
        team.nextPlayer < Math.max(1, team.players.length),
    )
  )
    return false;
  if (
    !isInteger(value.round) ||
    value.round < 0 ||
    value.round > 2 ||
    !isInteger(value.teamIndex) ||
    value.teamIndex < 0 ||
    value.teamIndex >= value.teams.length
  )
    return false;
  if (!isInteger(value.collectionIndex) || value.collectionIndex < 0)
    return false;
  if (
    !Array.isArray(value.words) ||
    !value.words.every(
      (word) =>
        isRecord(word) &&
        isString(word.id) &&
        isString(word.playerId) &&
        isString(word.text) &&
        word.text.trim().length > 0 &&
        word.text.length <= 100,
    )
  )
    return false;
  if (
    !isStringArray(value.deck) ||
    new Set(value.deck).size !== value.deck.length
  )
    return false;
  if (
    value.turn !== null &&
    (!isRecord(value.turn) ||
      !isString(value.turn.teamId) ||
      !isString(value.turn.playerId) ||
      !isStringArray(value.turn.guessed) ||
      (value.turn.results !== undefined &&
        (!Array.isArray(value.turn.results) ||
          !value.turn.results.every(
            (result) =>
              isRecord(result) &&
              isString(result.wordId) &&
              ["guessed", "skipped", "unanswered"].includes(String(result.status)),
          ))) ||
      !isInteger(value.turn.skips) ||
      value.turn.skips < 0 ||
      !isInteger(value.turn.penalty) ||
      value.turn.penalty < 0 ||
      !isFiniteNumber(value.turn.remainingMs) ||
      value.turn.remainingMs < 0 ||
      value.turn.remainingMs > settings.duration * 1000 ||
      (value.turn.deadline !== null &&
        (!isFiniteNumber(value.turn.deadline) || value.turn.deadline < 0)))
  )
    return false;
  const state = value as GameState;
  const players = getPlayers(state);
  const playerIds = new Set(players.map((player) => player.id));
  const wordIds = new Set(state.words.map((word) => word.id));
  if (
    new Set(state.teams.map((team) => team.id)).size !== state.teams.length ||
    playerIds.size !== players.length ||
    wordIds.size !== state.words.length
  )
    return false;
  if (
    state.collectionIndex >= Math.max(1, players.length) ||
    state.words.some((word) => !playerIds.has(word.playerId)) ||
    state.deck.some((id) => !wordIds.has(id))
  )
    return false;
  if (
    !Object.entries(state.drafts).every(
      ([id, draft]) =>
        playerIds.has(id) &&
        isStringArray(draft) &&
        draft.length === settings.wordsPerPlayer &&
        draft.every((word) => word.length <= 100),
    )
  )
    return false;
  if (state.stage !== "teams" && !setupIsValid(state)) return false;
  if (
    ["word-handoff", "words"].includes(state.stage) &&
    players.some((player) => !state.drafts[player.id])
  )
    return false;
  if (
    !["teams", "settings", "word-handoff", "words"].includes(state.stage) &&
    state.words.length !== players.length * settings.wordsPerPlayer
  )
    return false;
  if (
    ["round-intro", "turn-handoff", "playing", "paused", "timeout"].includes(
      state.stage,
    ) &&
    !state.deck.length
  )
    return false;
  if (["playing", "paused", "timeout", "turn-summary"].includes(state.stage)) {
    if (
      !state.turn ||
      state.turn.teamId !== getTeam(state).id ||
      state.turn.playerId !== getExplainer(state).id
    )
      return false;
    if (
      new Set(state.turn.guessed).size !== state.turn.guessed.length ||
      state.turn.guessed.some(
        (id) => !wordIds.has(id) || state.deck.includes(id),
      )
    )
      return false;
    if (state.stage === "playing" && state.turn.deadline === null) return false;
    if (state.stage !== "playing" && state.turn.deadline !== null) return false;
    if (state.turn.results) {
      const results = state.turn.results;
      const guessed = results
        .filter((result) => result.status === "guessed")
        .map((result) => result.wordId);
      if (
        guessed.length !== state.turn.guessed.length ||
        new Set(guessed).size !== guessed.length ||
        guessed.some((id) => !state.turn!.guessed.includes(id)) ||
        results.some(
          (result) =>
            !wordIds.has(result.wordId) ||
            (!state.deck.includes(result.wordId) &&
              !state.turn!.guessed.includes(result.wordId)),
        ) ||
        results.filter((result) => result.status === "skipped").length >
          state.turn.skips
      )
        return false;
    }
  } else if (state.turn !== null) return false;
  if (
    state.stage === "finished" &&
    (state.round !== 2 || state.deck.length > 0)
  )
    return false;
  return true;
};

const migratePlayerAvatars = (value: unknown): unknown => {
  if (!isRecord(value) || value.version !== 1 || !Array.isArray(value.teams))
    return value;
  const legacyIcons = ["fox", "bear", "rabbit", "frog", "cat", "owl"];
  return {
    ...value,
    teams: value.teams.map((team: unknown) => {
      if (!isRecord(team) || !Array.isArray(team.players)) return team;
      const migrated: Record<string, unknown> = {
        ...team,
        players: team.players.map((player: unknown, index: number) => {
          if (!isRecord(player)) return player;
          if (
            !("avatar" in player) &&
            isString(team.icon) &&
            legacyIcons.includes(team.icon)
          )
            return { ...player, avatar: avatarIds[index % avatarIds.length] };
          if (player.avatar === "cat-man" || player.avatar === "cat-woman")
            return { ...player, avatar: `${player.avatar}.webp` };
          return player;
        }),
      };
      delete migrated.icon;
      return migrated;
    }),
  };
};

export const loadGame = (
  storage: Pick<Storage, "getItem">,
): { state: GameState | null; issue: "corrupt" | "unavailable" | null } => {
  try {
    const raw = storage.getItem(storageKey);
    if (raw === null) return { state: null, issue: null };
    const parsed = migratePlayerAvatars(JSON.parse(raw));
    return isGameState(parsed)
      ? { state: parsed, issue: null }
      : { state: null, issue: "corrupt" };
  } catch (error) {
    return {
      state: null,
      issue: error instanceof SyntaxError ? "corrupt" : "unavailable",
    };
  }
};

export const saveGame = (
  storage: Pick<Storage, "setItem">,
  state: GameState,
): boolean => {
  try {
    storage.setItem(storageKey, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
};
