import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import persons from "../data/persons/data.json";
import {
  collectWords,
  createGame,
  gameReducer,
  getExplainer,
  getGameStats,
  getPlayers,
  getTeam,
  getTurnResults,
  makePlayer,
  makeTeam,
  shuffle,
  totalScore,
  wordsAreValid,
  type Action,
  type GameState,
  type Settings,
} from "./game";
import { isGameState, loadGame, saveGame } from "./storage";

const namedGame = () => {
  const state = createGame();
  state.teams.forEach((team, index) => {
    team.players = persons.slice(0, 2).map(makePlayer);
    team.players.forEach((player, playerIndex) => {
      player.name = `Player ${index}-${playerIndex}`;
    });
  });
  return state;
};

const readyGame = (settings: Partial<Settings> = {}) => {
  let state = gameReducer(namedGame(), { type: "GO_SETTINGS" });
  state = gameReducer(state, {
    type: "SET_SETTINGS",
    patch: { wordsPerPlayer: 1, duration: 15, ...settings },
  });
  state = gameReducer(state, { type: "BEGIN_WORDS" });
  for (let index = 0; index < getPlayers(state).length; index++) {
    state = gameReducer(state, { type: "OPEN_WORDS" });
    state = gameReducer(state, {
      type: "DRAFT_WORD",
      index: 0,
      text: `Word ${index}`,
    });
    state = gameReducer(state, {
      type: "SUBMIT_WORDS",
      order: collectWords(state).map((word) => word.id),
    });
  }
  return state;
};

const startTurn = (state: GameState, now = 1000) => {
  if (state.stage === "round-intro")
    state = gameReducer(state, { type: "ACK_ROUND" });
  return gameReducer(state, { type: "START_TURN", now });
};

const nextTurn = (state: GameState) =>
  gameReducer(state, {
    type: "NEXT_TURN",
    order: shuffle(
      state.words.map((word) => word.id),
      () => 0.5,
    ),
  });

describe("party lifecycle", () => {
  it("starts with no players and restores empty or partial team setup", () => {
    let state = createGame();
    expect(getPlayers(state)).toEqual([]);
    expect(makeTeam(2).players).toEqual([]);
    expect(loadGame({ getItem: () => JSON.stringify(state) }).state).toEqual(
      state,
    );
    const player = makePlayer(persons[1]);
    expect(player).toMatchObject({ name: "", avatar: "cat-generic-woman.webp" });
    state = gameReducer(state, {
      type: "ADD_PLAYER",
      teamId: state.teams[0].id,
      player,
    });
    expect(loadGame({ getItem: () => JSON.stringify(state) }).state).toEqual(
      state,
    );
    expect(gameReducer(state, { type: "GO_SETTINGS" })).toBe(state);
    state = gameReducer(state, {
      type: "REMOVE_PLAYER",
      teamId: state.teams[0].id,
      playerId: player.id,
    });
    expect(getPlayers(state)).toEqual([]);
    expect(isGameState(state)).toBe(true);
    expect(isGameState({ ...state, stage: "settings" })).toBe(false);
  });

  it("ships every catalog portrait and fills names only for people", () => {
    expect(new Set(persons.map((person) => person.img)).size).toBe(
      persons.length,
    );
    for (const [index, person] of persons.entries()) {
      expect(person.name.trim()).not.toBe("");
      expect(
        existsSync(
          new URL(`../data/persons/img/${person.img}`, import.meta.url),
        ),
      ).toBe(true);
      expect(makePlayer(person)).toMatchObject({
        name: index < 2 ? "" : person.name,
        avatar: person.img,
      });
    }
  });

  it("requires named players before leaving setup", () => {
    const state = createGame();
    expect(gameReducer(state, { type: "GO_SETTINGS" })).toBe(state);
  });

  it("collects only player-written words and preserves identical words from different players", () => {
    const state = readyGame();
    expect(state.words).toHaveLength(4);
    expect(state.deck).toHaveLength(4);
    expect(new Set(state.words.map((word) => word.playerId)).size).toBe(4);
    expect(state.drafts).toEqual({});
    expect(wordsAreValid(["  Лис   ", "лис"], 2)).toBe(false);
    expect(wordsAreValid(["", "книга"], 2)).toBe(false);
    expect(wordsAreValid(["Холодний чай", "Книга"], 2)).toBe(true);
  });

  it("finishes three rounds with the same complete word set and a conserved score", () => {
    let state = readyGame();
    const original = new Set(state.deck);
    for (let round = 0; round < 3; round++) {
      expect(state.round).toBe(round);
      expect(new Set(state.deck)).toEqual(original);
      state = startTurn(state);
      while (state.stage === "playing")
        state = gameReducer(state, { type: "GUESS", now: 1001 });
      expect(state.stage).toBe("turn-summary");
      state = nextTurn(state);
    }
    expect(state.stage).toBe("finished");
    expect(state.teams.reduce((sum, team) => sum + totalScore(team), 0)).toBe(
      12,
    );
    expect(isGameState(state)).toBe(true);
  });

  it("rotates teams and each team’s players across turns", () => {
    let state = startTurn(readyGame({ timeout: "strict" }));
    const firstTeam = getTeam(state).id;
    const firstPlayer = getExplainer(state).id;
    state = nextTurn(gameReducer(state, { type: "EXPIRE", now: 16000 }));
    expect(getTeam(state).id).not.toBe(firstTeam);
    state = startTurn(state);
    state = nextTurn(gameReducer(state, { type: "EXPIRE", now: 16000 }));
    expect(getTeam(state).id).toBe(firstTeam);
    expect(getExplainer(state).id).not.toBe(firstPlayer);
  });

  it("locks setup and rules once word collection begins", () => {
    const state = readyGame();
    expect(
      gameReducer(state, { type: "SET_SETTINGS", patch: { duration: 180 } }),
    ).toBe(state);
    expect(
      gameReducer(state, { type: "REMOVE_TEAM", id: state.teams[0].id }),
    ).toBe(state);
  });

  it("replays with the same teams and settings, fresh words and scores", () => {
    const previous = gameReducer(startTurn(readyGame({ skip: "penalty" })), {
      type: "GUESS",
      now: 1001,
    });
    const state = createGame(previous);
    expect(state.teams.map((team) => team.id)).toEqual(
      previous.teams.map((team) => team.id),
    );
    expect(state.settings).toEqual(previous.settings);
    expect(state.words).toEqual([]);
    expect(
      state.teams.every(
        (team) => totalScore(team) === 0 && team.nextPlayer === 0,
      ),
    ).toBe(true);
  });
});

describe("turn rules", () => {
  it.each(["free", "penalty", "disabled"] as const)(
    "handles %s skips without losing words",
    (skip) => {
      const state = startTurn(readyGame({ skip }));
      const result = gameReducer(state, { type: "SKIP", now: 1001 });
      expect(new Set(result.deck)).toEqual(new Set(state.deck));
      expect(totalScore(getTeam(result))).toBe(skip === "penalty" ? -1 : 0);
      expect(result.deck[0] === state.deck[0]).toBe(skip === "disabled");
    },
  );

  it("supports skipping the last remaining word", () => {
    let state = startTurn(readyGame());
    while (state.deck.length > 1)
      state = gameReducer(state, { type: "GUESS", now: 1001 });
    const result = gameReducer(state, { type: "SKIP", now: 1001 });
    expect(result.deck).toEqual(state.deck);
    expect(result.stage).toBe("playing");
  });

  it("strict timeout rejects late guesses and returns the unguessed word", () => {
    const state = startTurn(readyGame({ timeout: "strict" }));
    const expired = gameReducer(state, { type: "GUESS", now: 16000 });
    expect(expired.stage).toBe("turn-summary");
    expect(expired.deck).toEqual(state.deck);
    expect(totalScore(getTeam(expired))).toBe(0);
    expect(gameReducer(expired, { type: "GUESS", now: 17000 })).toBe(expired);
  });

  it.each([true, false])(
    "resolves the last word once (guessed=%s)",
    (guessed) => {
      const state = startTurn(readyGame());
      const expired = gameReducer(state, { type: "EXPIRE", now: 16000 });
      expect(expired.stage).toBe("timeout");
      const result = gameReducer(expired, { type: "RESOLVE_TIMEOUT", guessed });
      expect(result.stage).toBe("turn-summary");
      expect(result.deck.length).toBe(guessed ? 3 : 4);
      expect(totalScore(getTeam(result))).toBe(guessed ? 1 : 0);
      expect(
        gameReducer(result, { type: "RESOLVE_TIMEOUT", guessed: true }),
      ).toBe(result);
    },
  );

  it("pauses without revealing or losing a word and resumes from the remaining time", () => {
    const state = startTurn(readyGame());
    const paused = gameReducer(state, { type: "PAUSE", now: 4000 });
    expect(paused.turn?.remainingMs).toBe(12000);
    expect(paused.turn?.deadline).toBe(null);
    expect(paused.deck).toEqual(state.deck);
    const resumed = gameReducer(paused, { type: "RESUME", now: 200000 });
    expect(resumed.turn?.deadline).toBe(212000);
    expect(gameReducer(resumed, { type: "EXPIRE", now: 212000 }).stage).toBe(
      "timeout",
    );
  });
});

describe("storage boundary", () => {
  it("migrates team mascots to player portraits without resetting a running party", () => {
    const state = gameReducer(startTurn(readyGame()), {
      type: "GUESS",
      now: 1001,
    });
    const legacy = {
      ...state,
      teams: state.teams.map((team) => ({
        ...team,
        icon: "fox",
        players: team.players.map(({ id, name }) => ({ id, name })),
      })),
    };
    const loaded = loadGame({ getItem: () => JSON.stringify(legacy) });
    expect(loaded.issue).toBe(null);
    expect(loaded.state?.teams).toEqual(state.teams);
    expect(loaded.state?.words).toEqual(state.words);
    expect(loaded.state?.deck).toEqual(state.deck);
    expect(loaded.state?.turn).toEqual(state.turn);
    expect(loaded.state?.stage).toBe("playing");
    expect(
      loadGame({ getItem: () => JSON.stringify(loaded.state) }).state,
    ).toEqual(loaded.state);
  });

  it("persists each player's selected portrait and keeps it for replay", () => {
    const state = namedGame();
    const player = state.teams[0].players[0];
    const updated = gameReducer(state, {
      type: "UPDATE_PLAYER",
      teamId: state.teams[0].id,
      playerId: player.id,
      patch: { avatar: "cat-woman.webp" },
    });
    expect(updated.teams[0].players[0].avatar).toBe("cat-woman.webp");
    expect(updated.teams[0].players[1]).toBe(state.teams[0].players[1]);
    expect(loadGame({ getItem: () => JSON.stringify(updated) }).state).toEqual(
      updated,
    );
    expect(createGame(updated).teams[0].players[0].avatar).toBe(
      "cat-woman.webp",
    );
    expect(
      isGameState({
        ...updated,
        teams: updated.teams.map((team) => ({
          ...team,
          players: team.players.map((player) => ({
            ...player,
            avatar: "not-a-portrait",
          })),
        })),
      }),
    ).toBe(false);
  });

  it("restores the previous player avatar IDs without changing names or progress", () => {
    const state = startTurn(readyGame());
    state.teams.forEach((team) => {
      team.players.forEach((player, index) => {
        player.avatar = index === 0 ? "cat-man.webp" : "cat-woman.webp";
      });
    });
    const legacy = {
      ...state,
      teams: state.teams.map((team) => ({
        ...team,
        players: team.players.map((player) => ({
          ...player,
          avatar: player.avatar.replace(/\.webp$/, ""),
        })),
      })),
    };
    expect(loadGame({ getItem: () => JSON.stringify(legacy) }).state).toEqual(
      state,
    );
  });

  it("accepts every legitimate stage throughout a complete game", () => {
    let state = namedGame();
    const apply = (action: Action) => {
      state = gameReducer(state, action);
      expect(isGameState(state), state.stage).toBe(true);
    };
    expect(isGameState(state)).toBe(true);
    apply({ type: "GO_SETTINGS" });
    apply({ type: "SET_SETTINGS", patch: { wordsPerPlayer: 1 } });
    apply({ type: "BEGIN_WORDS" });
    for (let index = 0; index < 4; index++) {
      apply({ type: "OPEN_WORDS" });
      apply({ type: "DRAFT_WORD", index: 0, text: `Word ${index}` });
      apply({
        type: "SUBMIT_WORDS",
        order: collectWords(state).map((word) => word.id),
      });
    }
    for (let round = 0; round < 3; round++) {
      apply({ type: "ACK_ROUND" });
      apply({ type: "START_TURN", now: 1000 });
      apply({ type: "PAUSE", now: 2000 });
      apply({ type: "RESUME", now: 3000 });
      while (state.stage === "playing") apply({ type: "GUESS", now: 3001 });
      apply({ type: "NEXT_TURN", order: state.words.map((word) => word.id) });
    }
  });

  it("restores the absolute deadline so reload does not extend time", () => {
    const state = startTurn(readyGame());
    const loaded = loadGame({ getItem: () => JSON.stringify(state) });
    expect(loaded.state?.turn?.deadline).toBe(16000);
    expect(
      gameReducer(loaded.state!, { type: "EXPIRE", now: 30000 }).stage,
    ).toBe("timeout");
  });

  it.each(["{broken", "{}", "null", '{"version":2}'])(
    "rejects invalid storage: %s",
    (raw) => {
      expect(loadGame({ getItem: () => raw })).toEqual({
        state: null,
        issue: "corrupt",
      });
    },
  );

  it("rejects broken internal references and invalid deadlines", () => {
    const state = startTurn(readyGame());
    expect(isGameState({ ...state, deck: ["nonexistent"] })).toBe(false);
    expect(isGameState({ ...state, teamIndex: 100 })).toBe(false);
    expect(
      isGameState({ ...state, turn: { ...state.turn, deadline: null } }),
    ).toBe(false);
    expect(
      isGameState({ ...state, settings: { ...state.settings, duration: 5 } }),
    ).toBe(false);
  });

  it("handles blocked reads and full storage without throwing", () => {
    expect(
      loadGame({
        getItem: () => {
          throw new Error("blocked");
        },
      }).issue,
    ).toBe("unavailable");
    expect(
      saveGame(
        {
          setItem: () => {
            throw new Error("full");
          },
        },
        namedGame(),
      ),
    ).toBe(false);
  });
});

describe("party statistics", () => {
  it("records corrected results once and restores them without losing authors", () => {
    let state = startTurn(readyGame({ skip: "penalty", timeout: "strict" }));
    const player = getExplainer(state);
    const original = [...state.deck];
    state = gameReducer(state, { type: "GUESS", now: 1001 });
    state = gameReducer(state, { type: "SKIP", now: 1002 });
    state = gameReducer(state, { type: "EXPIRE", now: 16000 });
    state = gameReducer(state, { type: "UPDATE_TURN_RESULT", index: 1, status: "guessed" });
    expect(state.history).toEqual([]);
    state = nextTurn(state);
    expect(state.history).toHaveLength(1);
    expect(nextTurn(state)).toBe(state);
    const stats = getGameStats(state)!;
    expect(stats.players[0]).toEqual({ player, guessed: 2 });
    expect(stats.easiest.map(({ word }) => word.id)).toEqual(original.slice(0, 2));
    expect(stats.hardest[0]).toMatchObject({
      word: { id: original[2] }, guessed: 0, attempts: 1,
      author: getPlayers(state).find((person) => person.id === state.words[2].playerId),
    });
    expect(loadGame({ getItem: () => JSON.stringify(state) }).state).toEqual(state);
    expect(getGameStats(createGame(state))!.players.every((entry) => entry.guessed === 0)).toBe(true);
    expect(createGame(state).history).toEqual([]);
  });

  it("ranks a complete three-round party by successful attempts, with equal results tied", () => {
    let state = readyGame();
    const skippedId = state.deck[0];
    for (let round = 0; round < 3; round++) {
      state = startTurn(state);
      if (round === 0) state = gameReducer(state, { type: "SKIP", now: 1001 });
      while (state.stage === "playing") state = gameReducer(state, { type: "GUESS", now: 1002 });
      state = nextTurn(state);
      expect(isGameState(state)).toBe(true);
    }
    expect(state.stage).toBe("finished");
    expect(state.history).toHaveLength(3);
    const stats = getGameStats(state)!;
    expect(stats.players.map((entry) => entry.guessed)).toEqual([4, 4, 4, 0]);
    expect(stats.hardest).toHaveLength(1);
    expect(stats.hardest[0]).toMatchObject({ word: { id: skippedId }, guessed: 3, attempts: 4 });
    expect(stats.easiest).toHaveLength(3);
    expect(stats.easiest.every((word) => word.guessed === 3 && word.attempts === 3)).toBe(true);
    state.history = state.history!.map((turn) => ({ ...turn, results: turn.results.filter((result) => result.status === "guessed") }));
    expect(getGameStats(state)!.easiest).toHaveLength(4);
    expect(getGameStats(state)!.hardest).toHaveLength(4);
  });

  it("keeps legacy games playable without fabricating statistics", () => {
    let state = startTurn(readyGame());
    delete state.history;
    while (state.stage === "playing") state = gameReducer(state, { type: "GUESS", now: 1001 });
    state = nextTurn(state);
    expect(getGameStats(state)).toBeNull();
    expect(loadGame({ getItem: () => JSON.stringify(state) }).state).not.toBeNull();
  });

  it("rejects invalid saved statistics", () => {
    const state = readyGame();
    const turn = { playerId: getPlayers(state)[0].id, results: [{ wordId: state.words[0].id, status: "guessed" }] };
    expect(isGameState({ ...state, history: [turn] })).toBe(true);
    expect(isGameState({ ...state, history: [{ ...turn, playerId: "unknown" }] })).toBe(false);
    expect(isGameState({ ...state, history: [{ ...turn, results: [{ wordId: "unknown", status: "guessed" }] }] })).toBe(false);
    expect(isGameState({ ...state, history: [{ ...turn, results: [{ wordId: state.words[0].id, status: "invalid" }] }] })).toBe(false);
    expect(isGameState({ ...state, history: [{ ...turn, results: null }] })).toBe(false);
    expect(isGameState({ ...state, history: null })).toBe(false);
  });
});

describe("turn result corrections", () => {
  it("records only words encountered during the turn", () => {
    let state = startTurn(readyGame({ timeout: "strict" }));
    const original = [...state.deck];
    state = gameReducer(state, { type: "SKIP", now: 1001 });
    state = gameReducer(state, { type: "GUESS", now: 1002 });
    state = gameReducer(state, { type: "EXPIRE", now: 16000 });
    expect(getTurnResults(state)).toEqual([
      { wordId: original[0], status: "skipped" },
      { wordId: original[1], status: "guessed" },
      { wordId: original[2], status: "unanswered" },
    ]);
    expect(isGameState(state)).toBe(true);
  });

  it("reversibly corrects penalized skips and persists the result", () => {
    let state = startTurn(readyGame({ skip: "penalty", timeout: "strict" }));
    const skipped = state.deck[0];
    state = gameReducer(state, { type: "SKIP", now: 1001 });
    state = gameReducer(state, { type: "GUESS", now: 1002 });
    state = gameReducer(state, { type: "EXPIRE", now: 16000 });
    const corrected = gameReducer(state, {
      type: "UPDATE_TURN_RESULT", index: 0, status: "guessed",
    });
    expect(totalScore(getTeam(corrected))).toBe(2);
    expect(corrected.turn?.skips).toBe(0);
    expect(corrected.turn?.penalty).toBe(0);
    expect(corrected.deck).not.toContain(skipped);
    expect(loadGame({ getItem: () => JSON.stringify(corrected) }).state).toEqual(corrected);
    expect(gameReducer(corrected, {
      type: "UPDATE_TURN_RESULT", index: 0, status: "skipped",
    })).toEqual(state);
  });

  it.each([0, 2])("reopens completed round %s before advancing", (round) => {
    let state = readyGame();
    for (let index = 0; index <= round; index++) {
      state = startTurn(state);
      while (state.deck.length)
        state = gameReducer(state, { type: "GUESS", now: 1001 });
      if (index < round) state = nextTurn(state);
    }
    const score = totalScore(getTeam(state));
    const wordId = state.turn!.guessed[0];
    state = gameReducer(state, {
      type: "UPDATE_TURN_RESULT", index: 0, status: "unanswered",
    });
    expect(totalScore(getTeam(state))).toBe(score - 1);
    expect(state.deck).toEqual([wordId]);
    expect(isGameState(state)).toBe(true);
    state = nextTurn(state);
    expect(state.stage).toBe("turn-handoff");
    expect(state.round).toBe(round);
    expect(gameReducer(state, {
      type: "UPDATE_TURN_RESULT", index: 0, status: "guessed",
    })).toBe(state);
  });

  it("never awards a repeated word twice and can remove an accidental skip penalty", () => {
    let state = startTurn(readyGame({ skip: "penalty" }));
    state = gameReducer(state, { type: "SKIP", now: 1001 });
    while (state.deck.length)
      state = gameReducer(state, { type: "GUESS", now: 1002 });
    expect(totalScore(getTeam(state))).toBe(3);
    expect(gameReducer(state, {
      type: "UPDATE_TURN_RESULT", index: 0, status: "guessed",
    })).toBe(state);
    state = gameReducer(state, {
      type: "UPDATE_TURN_RESULT", index: 0, status: "unanswered",
    });
    expect(totalScore(getTeam(state))).toBe(4);
    expect(state.turn?.skips).toBe(0);
    expect(state.deck).toEqual([]);
    expect(isGameState(state)).toBe(true);
  });

  it.each([true, false])("records the timeout word once, without revealing the next (guessed=%s)", (guessed) => {
    let state = startTurn(readyGame());
    const original = [...state.deck];
    state = gameReducer(state, { type: "GUESS", now: 1001 });
    state = gameReducer(state, { type: "EXPIRE", now: 16000 });
    state = gameReducer(state, { type: "RESOLVE_TIMEOUT", guessed });
    expect(getTurnResults(state)).toEqual([
      { wordId: original[0], status: "guessed" },
      { wordId: original[1], status: guessed ? "guessed" : "unanswered" },
    ]);
    expect(isGameState(state)).toBe(true);
  });

  it("keeps older saves and their skip penalties usable", () => {
    let state = startTurn(readyGame({ skip: "penalty", timeout: "strict" }));
    state = gameReducer(state, { type: "GUESS", now: 1001 });
    state = gameReducer(state, { type: "SKIP", now: 1002 });
    state = gameReducer(state, { type: "EXPIRE", now: 16000 });
    delete state.turn!.results;
    expect(loadGame({ getItem: () => JSON.stringify(state) }).state).toEqual(state);
    state = gameReducer(state, {
      type: "UPDATE_TURN_RESULT", index: 0, status: "unanswered",
    });
    expect(totalScore(getTeam(state))).toBe(-1);
    expect(state.turn?.skips).toBe(1);
    expect(state.turn?.penalty).toBe(1);
    expect(isGameState(state)).toBe(true);

    state = startTurn(readyGame());
    state = gameReducer(state, { type: "GUESS", now: 1001 });
    state = gameReducer(state, { type: "EXPIRE", now: 16000 });
    delete state.turn!.results;
    state = gameReducer(state, { type: "RESOLVE_TIMEOUT", guessed: true });
    expect(getTurnResults(state)).toHaveLength(2);
    expect(state.turn?.guessed).toHaveLength(2);
    expect(isGameState(state)).toBe(true);
  });

  it("rejects invalid history and forbidden skip corrections", () => {
    let state = startTurn(readyGame({ skip: "disabled", timeout: "strict" }));
    state = gameReducer(state, { type: "EXPIRE", now: 16000 });
    expect(gameReducer(state, {
      type: "UPDATE_TURN_RESULT", index: 0, status: "skipped",
    })).toBe(state);
    expect(gameReducer(state, {
      type: "UPDATE_TURN_RESULT", index: -1, status: "guessed",
    })).toBe(state);
    expect(isGameState({ ...state, turn: { ...state.turn, results: [{
      wordId: "unknown", status: "unanswered",
    }] } })).toBe(false);
    expect(isGameState({ ...state, turn: { ...state.turn, results: [{
      wordId: state.deck[0], status: "invalid",
    }] } })).toBe(false);
  });
});
