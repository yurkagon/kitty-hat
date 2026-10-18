import persons from "../data/persons/data.json";

export const avatarIds = persons.map((person) => person.img);
export type AvatarId = (typeof avatarIds)[number];
export type Player = { id: string; name: string; avatar: AvatarId };
export type Team = {
  id: string;
  name: string;
  players: Player[];
  scores: [number, number, number];
  nextPlayer: number;
};
export type Settings = {
  wordsPerPlayer: number;
  duration: number;
  skip: "free" | "penalty" | "disabled";
  timeout: "confirm" | "strict";
  sound: boolean;
};
export type Word = { id: string; text: string; playerId: string };
export type Stage =
  | "teams"
  | "settings"
  | "word-handoff"
  | "words"
  | "round-intro"
  | "turn-handoff"
  | "playing"
  | "paused"
  | "timeout"
  | "turn-summary"
  | "finished";
export type Turn = {
  playerId: string;
  teamId: string;
  guessed: string[];
  skips: number;
  penalty: number;
  deadline: number | null;
  remainingMs: number;
};
export type GameState = {
  version: 1;
  stage: Stage;
  teams: Team[];
  settings: Settings;
  drafts: Record<string, string[]>;
  collectionIndex: number;
  words: Word[];
  deck: string[];
  round: number;
  teamIndex: number;
  turn: Turn | null;
};
export type Action =
  | { type: "NEW_GAME"; state: GameState }
  | { type: "ADD_TEAM"; team: Team }
  | { type: "REMOVE_TEAM"; id: string }
  | {
      type: "UPDATE_TEAM";
      id: string;
      patch: Partial<Pick<Team, "name">>;
    }
  | { type: "ADD_PLAYER"; teamId: string; player: Player }
  | { type: "REMOVE_PLAYER"; teamId: string; playerId: string }
  | {
      type: "UPDATE_PLAYER";
      teamId: string;
      playerId: string;
      patch: Partial<Pick<Player, "name" | "avatar">>;
    }
  | { type: "SET_SETTINGS"; patch: Partial<Settings> }
  | { type: "TOGGLE_SOUND" }
  | { type: "GO_SETTINGS" }
  | { type: "BACK_TEAMS" }
  | { type: "BEGIN_WORDS" }
  | { type: "OPEN_WORDS" }
  | { type: "DRAFT_WORD"; index: number; text: string }
  | { type: "SUBMIT_WORDS"; order: string[] }
  | { type: "ACK_ROUND" }
  | { type: "START_TURN"; now: number }
  | { type: "GUESS" | "SKIP" | "EXPIRE" | "PAUSE" | "RESUME"; now: number }
  | { type: "RESOLVE_TIMEOUT"; guessed: boolean }
  | { type: "NEXT_TURN"; order: string[] };

const makeId = () =>
  crypto.randomUUID?.() ??
  Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");

export const makePlayer = (person: (typeof persons)[number]): Player => ({
  id: makeId(),
  name: person.img.startsWith("cat-generic-") ? "" : person.name,
  avatar: person.img,
});

export const makeTeam = (index: number): Team => ({
  id: makeId(),
  name: `Команда ${index + 1}`,
  players: [],
  scores: [0, 0, 0],
  nextPlayer: 0,
});

export const createGame = (previous?: GameState): GameState => ({
  version: 1,
  stage: "teams",
  teams: previous
    ? previous.teams.map((team) => ({
        ...team,
        scores: [0, 0, 0],
        nextPlayer: 0,
      }))
    : [makeTeam(0), makeTeam(1)],
  settings: previous
    ? { ...previous.settings }
    : {
        wordsPerPlayer: 5,
        duration: 60,
        skip: "free",
        timeout: "confirm",
        sound: true,
      },
  drafts: {},
  collectionIndex: 0,
  words: [],
  deck: [],
  round: 0,
  teamIndex: 0,
  turn: null,
});

export const getPlayers = (state: GameState) =>
  state.teams.flatMap((team) => team.players);
export const getTeam = (state: GameState) => state.teams[state.teamIndex];
export const getExplainer = (state: GameState) =>
  getTeam(state).players[getTeam(state).nextPlayer];
export const totalScore = (team: Team) =>
  team.scores.reduce((sum, score) => sum + score, 0);
export const normalizeWord = (text: string) => text.trim().replace(/\s+/g, " ");

export const setupIsValid = (state: GameState) =>
  state.teams.length >= 2 &&
  state.teams.every(
    (team) =>
      team.name.trim().length > 0 &&
      team.players.length >= 2 &&
      team.players.every((player) => player.name.trim().length > 0),
  );

export const wordsAreValid = (words: string[], count: number) => {
  const normalized = words.map((word) =>
    normalizeWord(word).toLocaleLowerCase("uk"),
  );
  return (
    normalized.length === count &&
    normalized.every((word) => word.length > 0 && word.length <= 100) &&
    new Set(normalized).size === count
  );
};

export const collectWords = (state: GameState): Word[] =>
  getPlayers(state).flatMap((player) =>
    (state.drafts[player.id] ?? []).map((text, index) => ({
      id: `${player.id}:${index}`,
      playerId: player.id,
      text: normalizeWord(text),
    })),
  );

export const shuffle = <T>(items: T[], random = Math.random): T[] => {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
};

const addScore = (state: GameState, amount: number) =>
  state.teams.map((team, index) => {
    if (index !== state.teamIndex) return team;
    const scores: Team["scores"] = [...team.scores];
    scores[state.round] += amount;
    return { ...team, scores };
  });

const expireTurn = (state: GameState): GameState => ({
  ...state,
  stage:
    state.settings.timeout === "confirm" && state.deck.length > 0
      ? "timeout"
      : "turn-summary",
  turn: state.turn ? { ...state.turn, remainingMs: 0, deadline: null } : null,
});

const guessWord = (state: GameState): GameState => {
  if (!state.turn || !state.deck.length) return state;
  const deck = state.deck.slice(1);
  return {
    ...state,
    teams: addScore(state, 1),
    deck,
    stage: deck.length ? state.stage : "turn-summary",
    turn: {
      ...state.turn,
      guessed: [...state.turn.guessed, state.deck[0]],
      deadline: deck.length ? state.turn.deadline : null,
    },
  };
};

export const gameReducer = (state: GameState, action: Action): GameState => {
  if (action.type === "NEW_GAME") return action.state;
  if (action.type === "TOGGLE_SOUND")
    return {
      ...state,
      settings: { ...state.settings, sound: !state.settings.sound },
    };
  if (state.stage === "teams") {
    switch (action.type) {
      case "ADD_TEAM":
        return { ...state, teams: [...state.teams, action.team] };
      case "REMOVE_TEAM":
        return state.teams.length > 2
          ? {
              ...state,
              teams: state.teams.filter((team) => team.id !== action.id),
            }
          : state;
      case "UPDATE_TEAM":
        return {
          ...state,
          teams: state.teams.map((team) =>
            team.id === action.id ? { ...team, ...action.patch } : team,
          ),
        };
      case "ADD_PLAYER":
        return {
          ...state,
          teams: state.teams.map((team) =>
            team.id === action.teamId
              ? { ...team, players: [...team.players, action.player] }
              : team,
          ),
        };
      case "REMOVE_PLAYER":
        return {
          ...state,
          teams: state.teams.map((team) =>
            team.id === action.teamId
              ? {
                  ...team,
                  players: team.players.filter(
                    (player) => player.id !== action.playerId,
                  ),
                }
              : team,
          ),
        };
      case "UPDATE_PLAYER":
        return {
          ...state,
          teams: state.teams.map((team) =>
            team.id === action.teamId
              ? {
                  ...team,
                  players: team.players.map((player) =>
                    player.id === action.playerId
                      ? { ...player, ...action.patch }
                      : player,
                  ),
                }
              : team,
          ),
        };
      case "GO_SETTINGS":
        return setupIsValid(state)
          ? {
              ...state,
              stage: "settings",
              teams: state.teams.map((team) => ({
                ...team,
                name: team.name.trim(),
                players: team.players.map((player) => ({
                  ...player,
                  name: player.name.trim(),
                })),
              })),
            }
          : state;
    }
  }
  if (state.stage === "settings") {
    switch (action.type) {
      case "BACK_TEAMS":
        return { ...state, stage: "teams" };
      case "SET_SETTINGS":
        return { ...state, settings: { ...state.settings, ...action.patch } };
      case "BEGIN_WORDS":
        return {
          ...state,
          stage: "word-handoff",
          drafts: Object.fromEntries(
            getPlayers(state).map((player) => [
              player.id,
              Array<string>(state.settings.wordsPerPlayer).fill(""),
            ]),
          ),
        };
    }
  }
  if (action.type === "OPEN_WORDS" && state.stage === "word-handoff")
    return { ...state, stage: "words" };
  if (action.type === "DRAFT_WORD" && state.stage === "words") {
    const playerId = getPlayers(state)[state.collectionIndex].id;
    return {
      ...state,
      drafts: {
        ...state.drafts,
        [playerId]: state.drafts[playerId].map((word, index) =>
          index === action.index ? action.text.slice(0, 100) : word,
        ),
      },
    };
  }
  if (action.type === "SUBMIT_WORDS" && state.stage === "words") {
    const players = getPlayers(state);
    if (
      !wordsAreValid(
        state.drafts[players[state.collectionIndex].id],
        state.settings.wordsPerPlayer,
      )
    )
      return state;
    if (state.collectionIndex < players.length - 1)
      return {
        ...state,
        stage: "word-handoff",
        collectionIndex: state.collectionIndex + 1,
      };
    return {
      ...state,
      stage: "round-intro",
      words: collectWords(state),
      drafts: {},
      deck: action.order,
    };
  }
  if (action.type === "ACK_ROUND" && state.stage === "round-intro")
    return { ...state, stage: "turn-handoff" };
  if (action.type === "START_TURN" && state.stage === "turn-handoff")
    return {
      ...state,
      stage: "playing",
      turn: {
        teamId: getTeam(state).id,
        playerId: getExplainer(state).id,
        guessed: [],
        skips: 0,
        penalty: 0,
        remainingMs: state.settings.duration * 1000,
        deadline: action.now + state.settings.duration * 1000,
      },
    };
  if (
    state.stage === "playing" &&
    state.turn?.deadline !== null &&
    state.turn &&
    "now" in action
  ) {
    if (action.now >= state.turn.deadline) return expireTurn(state);
    if (action.type === "GUESS") return guessWord(state);
    if (action.type === "SKIP" && state.settings.skip !== "disabled") {
      const penalty = state.settings.skip === "penalty" ? 1 : 0;
      return {
        ...state,
        deck: [...state.deck.slice(1), state.deck[0]],
        teams: addScore(state, -penalty),
        turn: {
          ...state.turn,
          skips: state.turn.skips + 1,
          penalty: state.turn.penalty + penalty,
        },
      };
    }
    if (action.type === "PAUSE")
      return {
        ...state,
        stage: "paused",
        turn: {
          ...state.turn,
          remainingMs: state.turn.deadline - action.now,
          deadline: null,
        },
      };
  }
  if (action.type === "RESUME" && state.stage === "paused" && state.turn)
    return {
      ...state,
      stage: "playing",
      turn: { ...state.turn, deadline: action.now + state.turn.remainingMs },
    };
  if (action.type === "RESOLVE_TIMEOUT" && state.stage === "timeout") {
    const result = action.guessed ? guessWord(state) : state;
    return { ...result, stage: "turn-summary" };
  }
  if (action.type === "NEXT_TURN" && state.stage === "turn-summary") {
    const teams = state.teams.map((team, index) =>
      index === state.teamIndex
        ? { ...team, nextPlayer: (team.nextPlayer + 1) % team.players.length }
        : team,
    );
    const nextState = {
      ...state,
      teams,
      teamIndex: (state.teamIndex + 1) % teams.length,
      turn: null,
    };
    if (state.deck.length) return { ...nextState, stage: "turn-handoff" };
    if (state.round === 2) return { ...nextState, stage: "finished" };
    return {
      ...nextState,
      stage: "round-intro",
      round: state.round + 1,
      deck: action.order,
    };
  }
  return state;
};
