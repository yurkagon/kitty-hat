import persons from "../data/persons/data.json";

export const avatarIds = persons.map((person) => person.img);
export type AvatarId = (typeof avatarIds)[number];
// Departed players remain as authors and in the party's scoring history.
export type Player = { id: string; name: string; avatar: AvatarId; active?: boolean };
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
  lastWordForAll: boolean;
  sound: boolean;
};
export type Word = { id: string; text: string; playerId: string };
export type TurnResult = {
  wordId: string;
  status: "guessed" | "skipped" | "unanswered";
  teamId?: string | null;
  playerId?: string;
};
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
  results?: TurnResult[];
  skips: number;
  penalty: number;
  deadline: number | null;
  remainingMs: number;
};
export type CompletedTurn = {
  playerId: string;
  results: TurnResult[];
};
export type GameState = {
  version: 1;
  stage: Stage;
  teams: Team[];
  settings: Settings;
  drafts: Record<string, string[]>;
  collectionIndex: number;
  collectionQueue?: string[];
  words: Word[];
  deck: string[];
  round: number;
  teamIndex: number;
  turn: Turn | null;
  history?: CompletedTurn[];
};
export type Action =
  | { type: "NEW_GAME"; state: GameState }
  | { type: "SET_ROSTER"; teams: Pick<Team, "id" | "players">[]; order?: string[] }
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
  | { type: "RESOLVE_TIMEOUT"; guessed: boolean; playerId?: string }
  | { type: "UPDATE_TURN_RESULT"; index: number; status: TurnResult["status"]; playerId?: string }
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
        players: getTeamPlayers(team),
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
        lastWordForAll: true,
        sound: true,
      },
  drafts: {},
  collectionIndex: 0,
  words: [],
  deck: [],
  round: 0,
  teamIndex: 0,
  turn: null,
  history: [],
});

export const getPlayers = (state: GameState) =>
  state.teams.flatMap((team) => team.players);
export const getTeamPlayers = (team: Team) =>
  team.players.filter((player) => player.active !== false);
export const getCollectionQueue = (state: GameState) =>
  state.collectionQueue ?? getPlayers(state).slice(state.collectionIndex).map((player) => player.id);
export const getTeam = (state: GameState) => state.teams[state.teamIndex];
export const getExplainer = (state: GameState) =>
  state.turn
    ? getTeam(state).players.find((player) => player.id === state.turn!.playerId)!
    : getTeam(state).players[getTeam(state).nextPlayer];
export const totalScore = (team: Team) =>
  team.scores.reduce((sum, score) => sum + score, 0);
export const normalizeWord = (text: string) => text.trim().replace(/\s+/g, " ");

export const setupIsValid = (state: GameState) =>
  state.teams.length >= 2 &&
  state.teams.every(
    (team) =>
      team.name.trim().length > 0 &&
      getTeamPlayers(team).length >= 2 &&
      getTeamPlayers(team).every((player) => player.name.trim().length > 0),
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
    })).filter((word) => word.text.length > 0),
  );

export const shuffle = <T>(items: T[], random = Math.random): T[] => {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
};

const addScore = (state: GameState, amount: number, teamId = getTeam(state).id) =>
  state.teams.map((team) => {
    if (team.id !== teamId) return team;
    const scores: Team["scores"] = [...team.scores];
    scores[state.round] += amount;
    return { ...team, scores };
  });

const getPlayerTeam = (state: GameState, playerId: string | undefined) =>
  state.teams.find((team) => getTeamPlayers(team).some((player) => player.id === playerId));

const nextActivePlayer = (team: Team, start: number) => {
  for (let offset = 0; offset < team.players.length; offset++) {
    const index = (start + offset) % team.players.length;
    if (team.players[index].active !== false) return index;
  }
  return 0;
};

const finishCollection = (state: GameState, order?: string[]): GameState => {
  const words = collectWords(state);
  return {
    ...state,
    stage: "round-intro",
    collectionQueue: [],
    words,
    drafts: {},
    deck: order ?? words.map((word) => word.id),
  };
};

export const getTurnResults = (state: GameState): TurnResult[] =>
  state.turn?.results ??
  (state.turn?.guessed ?? []).map((wordId) => ({ wordId, status: "guessed" }));

export const getGameStats = (state: GameState) => {
  if (!state.history) return null;
  const players = getPlayers(state).map((player) => ({ player, guessed: 0 }));
  const words = state.words.map((word) => ({
    word,
    author: players.find(({ player }) => player.id === word.playerId)!.player,
    guessed: 0,
    attempts: 0,
  }));
  const playersById = new Map(players.map((entry) => [entry.player.id, entry]));
  const playerTeams = new Map(
    state.teams.flatMap((team) => team.players.map((player) => [player.id, team.id])),
  );
  const wordsById = new Map(words.map((entry) => [entry.word.id, entry]));
  for (const turn of state.history) {
    for (const result of turn.results) {
      const word = wordsById.get(result.wordId)!;
      word.attempts++;
      if (result.status === "guessed") {
        word.guessed++;
        if (result.playerId !== undefined)
          playersById.get(result.playerId)!.guessed++;
        else if (result.teamId === undefined || result.teamId === playerTeams.get(turn.playerId))
          playersById.get(turn.playerId)!.guessed++;
      }
    }
  }
  players.sort((first, second) =>
    second.guessed - first.guessed || first.player.name.localeCompare(second.player.name, "uk"),
  );
  const attempted = words.filter((word) => word.attempts > 0);
  const rates = attempted.map((word) => word.guessed / word.attempts);
  const highestRate = Math.max(...rates);
  const lowestRate = Math.min(...rates);
  return {
    players,
    easiest: attempted.filter((word) => word.guessed / word.attempts === highestRate),
    hardest: attempted.filter((word) => word.guessed / word.attempts === lowestRate),
  };
};

const expireTurn = (state: GameState): GameState => ({
  ...state,
  stage:
    (state.settings.lastWordForAll || state.settings.timeout === "confirm") && state.deck.length > 0
      ? "timeout"
      : "turn-summary",
  turn: state.turn
    ? {
        ...state.turn,
        remainingMs: 0,
        deadline: null,
        results: [
          ...getTurnResults(state),
          ...(state.deck.length
            ? [{
                wordId: state.deck[0],
                status: "unanswered" as const,
                ...(state.settings.lastWordForAll ? { teamId: null } : {}),
              }]
            : []),
        ],
      }
    : null,
});

const guessWord = (state: GameState, playerId?: string): GameState => {
  const winner = playerId === undefined ? getTeam(state) : getPlayerTeam(state, playerId);
  if (!state.turn || !state.deck.length || !winner) return state;
  const deck = state.deck.slice(1);
  const results = getTurnResults(state);
  const lastResult = results.at(-1);
  return {
    ...state,
    teams: addScore(state, 1, winner.id),
    deck,
    stage: deck.length ? state.stage : "turn-summary",
    turn: {
      ...state.turn,
      guessed: [...state.turn.guessed, state.deck[0]],
      results:
        state.stage === "timeout" &&
        lastResult?.wordId === state.deck[0] &&
        lastResult.status === "unanswered"
          ? [
              ...results.slice(0, -1),
              {
                ...lastResult,
                status: "guessed",
                ...(state.settings.lastWordForAll ? { teamId: winner.id, playerId } : {}),
              },
            ]
          : [...results, { wordId: state.deck[0], status: "guessed" }],
      deadline: deck.length ? state.turn.deadline : null,
    },
  };
};

export const gameReducer = (state: GameState, action: Action): GameState => {
  if (action.type === "NEW_GAME") return action.state;
  if (action.type === "SET_ROSTER" && state.stage !== "playing") {
    const incoming = action.teams.flatMap((team) => team.players);
    if (
      action.teams.length !== state.teams.length ||
      new Set(action.teams.map((team) => team.id)).size !== state.teams.length ||
      new Set(incoming.map((player) => player.id)).size !== incoming.length ||
      action.teams.some((team) => !state.teams.some((item) => item.id === team.id)) ||
      incoming.some((player) => !player.id || !player.name.trim() || player.name.length > 40 || !avatarIds.includes(player.avatar) || player.active === false) ||
      state.teams.some((team) => action.teams.some((other) => other.id !== team.id && other.players.some((player) => team.players.some((existing) => existing.id === player.id))))
    ) return state;
    const beforeCollection = state.stage === "teams" || state.stage === "settings";
    const oldPlayers = new Set(getPlayers(state).map((player) => player.id));
    const teams = state.teams.map((team) => {
      const players = action.teams.find((item) => item.id === team.id)!.players;
      const updated = {
        ...team,
        players: beforeCollection ? players : [
          ...team.players.map((player) => {
            const replacement = players.find((item) => item.id === player.id);
            return replacement ? { ...replacement, active: true } : { ...player, active: false };
          }),
          ...players.filter((player) => !oldPlayers.has(player.id)),
        ],
      };
      return { ...updated, nextPlayer: nextActivePlayer(updated, team.nextPlayer) };
    });
    let updated: GameState = { ...state, teams };
    if (state.stage === "words" || state.stage === "word-handoff") {
      const activeIds = new Set(teams.flatMap((team) => getTeamPlayers(team).map((player) => player.id)));
      const queue = getCollectionQueue(state).filter((id) => activeIds.has(id));
      const added = incoming.filter((player) => !oldPlayers.has(player.id));
      queue.push(...added.map((player) => player.id));
      updated = {
        ...updated,
        collectionQueue: queue,
        drafts: {
          ...state.drafts,
          ...Object.fromEntries(added.map((player) => [player.id, Array<string>(state.settings.wordsPerPlayer).fill("")])),
        },
        stage: queue[0] === getCollectionQueue(state)[0] ? state.stage : "word-handoff",
      };
      if (!queue.length && collectWords(updated).length)
        return finishCollection(updated, action.order);
    }
    if (state.stage === "paused" && state.turn &&
      !getTeamPlayers(getTeam(updated)).some((player) => player.id === state.turn!.playerId))
      return { ...expireTurn(updated), stage: "turn-summary" };
    return updated;
  }
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
        if (!setupIsValid(state)) return state;
        return {
          ...state,
          stage: "word-handoff",
          collectionQueue: state.teams.flatMap((team) => getTeamPlayers(team).map((player) => player.id)),
          drafts: Object.fromEntries(
            state.teams.flatMap(getTeamPlayers).map((player) => [
              player.id,
              Array<string>(state.settings.wordsPerPlayer).fill(""),
            ]),
          ),
        };
    }
  }
  if (action.type === "OPEN_WORDS" && state.stage === "word-handoff" && setupIsValid(state) && getCollectionQueue(state).length)
    return { ...state, stage: "words" };
  if (action.type === "DRAFT_WORD" && state.stage === "words") {
    const playerId = getCollectionQueue(state)[0];
    if (!playerId) return state;
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
    if (!setupIsValid(state)) return state;
    const queue = getCollectionQueue(state);
    if (
      !wordsAreValid(
        state.drafts[queue[0]] ?? [],
        state.settings.wordsPerPlayer,
      )
    )
      return state;
    if (queue.length > 1)
      return {
        ...state,
        stage: "word-handoff",
        collectionIndex: state.collectionIndex + 1,
        collectionQueue: queue.slice(1),
      };
    return finishCollection(state, action.order);
  }
  if (action.type === "ACK_ROUND" && state.stage === "round-intro" && setupIsValid(state))
    return { ...state, stage: "turn-handoff" };
  if (action.type === "START_TURN" && state.stage === "turn-handoff" && setupIsValid(state))
    return {
      ...state,
      stage: "playing",
      turn: {
        teamId: getTeam(state).id,
        playerId: getExplainer(state).id,
        guessed: [],
        results: [],
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
          results: [
            ...getTurnResults(state),
            { wordId: state.deck[0], status: "skipped" },
          ],
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
  if (action.type === "RESUME" && state.stage === "paused" && state.turn && setupIsValid(state))
    return {
      ...state,
      stage: "playing",
      turn: { ...state.turn, deadline: action.now + state.turn.remainingMs },
    };
  if (action.type === "RESOLVE_TIMEOUT" && state.stage === "timeout") {
    if (state.settings.lastWordForAll && action.guessed &&
      !getPlayerTeam(state, action.playerId)) return state;
    const recorded = state.turn?.results ? state : expireTurn(state);
    const result = action.guessed
      ? guessWord(recorded, state.settings.lastWordForAll ? action.playerId : undefined)
      : recorded;
    return { ...result, stage: "turn-summary" };
  }
  if (
    action.type === "UPDATE_TURN_RESULT" &&
    state.stage === "turn-summary" &&
    state.turn
  ) {
    const results = getTurnResults(state);
    const previous = results[action.index];
    const previousTeamId = previous?.teamId ?? getTeam(state).id;
    const playerId = action.playerId ?? previous?.playerId;
    const winner = getPlayerTeam(state, playerId);
    const teamId = winner?.id ?? previousTeamId;
    if (
      !previous ||
      (previous.status === action.status && previous.playerId === playerId) ||
      (action.playerId !== undefined && (previous.teamId === undefined || !winner)) ||
      (previous.teamId !== undefined && action.status === "skipped") ||
      (previous.teamId !== undefined && action.status === "guessed" && !winner) ||
      (action.status === "guessed" &&
        previous.status !== "guessed" &&
        state.turn.guessed.includes(previous.wordId)) ||
      (action.status === "skipped" && state.settings.skip === "disabled")
    )
      return state;
    const guessedChange =
      Number(action.status === "guessed") - Number(previous.status === "guessed");
    const skipsChange =
      Number(action.status === "skipped") - Number(previous.status === "skipped");
    const penaltyChange = state.settings.skip === "penalty" ? skipsChange : 0;
    let teams = state.teams;
    if (previous.status === "guessed")
      teams = addScore({ ...state, teams }, -1, previousTeamId);
    if (action.status === "guessed")
      teams = addScore({ ...state, teams }, 1, teamId);
    if (penaltyChange)
      teams = addScore({ ...state, teams }, -penaltyChange);
    return {
      ...state,
      teams,
      deck:
        action.status === "guessed"
          ? state.deck.filter((id) => id !== previous.wordId)
          : previous.status === "guessed"
            ? [...state.deck, previous.wordId]
            : state.deck,
      turn: {
        ...state.turn,
        guessed:
          guessedChange > 0
            ? [...state.turn.guessed, previous.wordId]
            : guessedChange < 0
              ? state.turn.guessed.filter((id) => id !== previous.wordId)
              : state.turn.guessed,
        skips: state.turn.skips + skipsChange,
        penalty: state.turn.penalty + penaltyChange,
        results: results.map((result, index) =>
          index === action.index
            ? { ...result, status: action.status, ...(action.playerId ? { teamId, playerId } : {}) }
            : result,
        ),
      },
    };
  }
  if (action.type === "NEXT_TURN" && state.stage === "turn-summary" && setupIsValid(state)) {
    const teams = state.teams.map((team, index) =>
      index === state.teamIndex
        ? { ...team, nextPlayer: nextActivePlayer(team, team.players.findIndex((player) => player.id === state.turn!.playerId) + 1) }
        : team,
    );
    const nextState = {
      ...state,
      teams,
      teamIndex: (state.teamIndex + 1) % teams.length,
      turn: null,
      history: state.history
        ? [...state.history, { playerId: state.turn!.playerId, results: getTurnResults(state) }]
        : undefined,
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
