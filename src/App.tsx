import { Fragment, useEffect, useReducer, useState } from "react";
import persons from "../data/persons/data.json";
import { teamNames } from "../data/teams";
import { Avatar, Button, Icon, Modal, Scoreboard, Stepper } from "./components";
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
  normalizeWord,
  setupIsValid,
  shuffle,
  totalScore,
} from "./game";
import { loadGame, saveGame } from "./storage";
import { unlockAudio, useTurnTimer } from "./timer";

const avatarOptions = [
  ...persons.slice(0, 2),
  ...persons.slice(2).sort((first, second) =>
    (first.surname + first.name).localeCompare(second.surname + second.name, "uk"),
  ),
];

const rounds = [
  {
    name: "Поясни словами",
    short: "Пояснення",
    instruction: "Пояснюй своїй команді",
    description:
      "Пояснюй як завгодно, але не називай саме слово та спільнокореневі слова.",
    hint: "Розповідай, порівнюй, вигадуй асоціації. Без перекладу слова та підказок про його літери.",
  },
  {
    name: "Покажи без слів",
    short: "Пантоміма",
    instruction: "Показуй без слів і звуків",
    description:
      "Ті самі слова, але тепер лише рухи й міміка. Жодних слів або звуків!",
    hint: "Можна жестикулювати й показувати всім тілом. Не промовляй і не малюй літери.",
  },
  {
    name: "Лише одне слово",
    short: "Одне слово",
    instruction: "Підкажи лише одним словом",
    description:
      "На кожну записку — тільки одне слово-підказка. Команда вже знає, що в капелюсі!",
    hint: "Обери одну влучну асоціацію. Не називай саме слово або спільнокореневе й не додавай жестів.",
  },
];
const secretStages = ["words", "playing", "paused", "timeout"];
const initialLoad = () => {
  try {
    return loadGame(window.localStorage);
  } catch {
    return { state: null, issue: "unavailable" as const };
  }
};

export const App = () => {
  const [initial] = useState(initialLoad);
  const [state, dispatch] = useReducer(
    gameReducer,
    initial.state,
    (saved) => saved ?? createGame(),
  );
  const [home, setHome] = useState(true);
  const [hasSession, setHasSession] = useState(Boolean(initial.state));
  const [storageIssue, setStorageIssue] = useState(initial.issue);
  const [covered, setCovered] = useState(
    Boolean(initial.state && secretStages.includes(initial.state.stage)),
  );
  const [modal, setModal] = useState<"rules" | "reset" | null>(null);
  const [personTarget, setPersonTarget] = useState<{
    teamId: string;
    playerId?: string;
  } | null>(null);
  const [wordError, setWordError] = useState("");
  const [audioIssue, setAudioIssue] = useState(false);
  const { remainingMs, seconds } = useTurnTimer(state, dispatch);
  const players = getPlayers(state);
  const team = getTeam(state);
  const explainer = getExplainer(state);
  const writer = players[state.collectionIndex];
  const round = rounds[state.round];

  useEffect(() => {
    if (!hasSession) return;
    try {
      if (!saveGame(window.localStorage, state)) setStorageIssue("unavailable");
    } catch {
      setStorageIssue("unavailable");
    }
  }, [state, hasSession]);

  useEffect(() => {
    const protect = () => {
      if (
        document.visibilityState === "hidden" &&
        secretStages.includes(state.stage)
      )
        setCovered(true);
    };
    document.addEventListener("visibilitychange", protect);
    return () => document.removeEventListener("visibilitychange", protect);
  }, [state.stage]);

  useEffect(() => {
    window.scrollTo(0, 0);
    setWordError("");
  }, [state.stage, state.collectionIndex, home]);

  const prepareAudio = () => {
    if (state.settings.sound)
      void unlockAudio().then((ok) => setAudioIssue(!ok));
  };
  const startNew = (keepTeams = false) => {
    dispatch({
      type: "NEW_GAME",
      state: createGame(keepTeams ? state : undefined),
    });
    setHasSession(true);
    setHome(false);
    setCovered(false);
    setModal(null);
    setStorageIssue(null);
  };
  const goHome = () => {
    if (state.stage === "playing") dispatch({ type: "PAUSE", now: Date.now() });
    if (secretStages.includes(state.stage)) setCovered(true);
    setHome(true);
  };
  const nextTurn = () =>
    dispatch({
      type: "NEXT_TURN",
      order: shuffle(state.words.map((word) => word.id)),
    });
  const submitWords = () => {
    const draft = state.drafts[writer.id];
    const normalized = draft.map((word) =>
      normalizeWord(word).toLocaleLowerCase("uk"),
    );
    if (normalized.some((word) => !word)) {
      setWordError(
        "Заповни всі записки — кожна має містити слово або коротку фразу.",
      );
      return;
    }
    if (new Set(normalized).size !== normalized.length) {
      setWordError("Деякі записки повторюються. Заміни їх на різні слова.");
      return;
    }
    setWordError("");
    dispatch({
      type: "SUBMIT_WORDS",
      order: shuffle(collectWords(state).map((word) => word.id)),
    });
  };

  const screen = () => {
    if (home)
      return (
        <section className="home-screen">
          <div className="hero-art">
            <img
              src={`${import.meta.env.BASE_URL}art/hat.webp`}
              alt="Мальований зелений капелюх із паперовими записками"
              width="440"
              height="410"
              fetchPriority="high"
            />
          </div>
          <h1>
            Слова зближують.
            <br />
            <span>Капелюх допоможе.</span>
          </h1>
          <p className="home-description">
            Збирайте своїх, загадуйте слова
            <br />і розумійте одне одного з півслова.
          </p>
          <div className="home-actions">
            {hasSession && (
              <Button
                onClick={() => {
                  prepareAudio();
                  setHome(false);
                }}
              >
                {state.stage === "finished"
                  ? "Переглянути результат"
                  : "Продовжити гру"}
                <Icon name="arrow" />
              </Button>
            )}
            <Button
              variant={hasSession ? "secondary" : "primary"}
              onClick={() => {
                if (hasSession && state.stage !== "finished") setModal("reset");
                else startNew(state.stage === "finished");
              }}
            >
              {hasSession ? "Нова гра" : "Почати гру"}
              <Icon name="arrow" />
            </Button>
          </div>
          <div className="round-preview">
            <span>
              <b>1</b>Пояснюй
            </span>
            <span>
              <b>2</b>Показуй
            </span>
            <span>
              <b>3</b>Одне слово
            </span>
          </div>
          <p className="home-note">
            Від 4 гравців · Один телефон · Без зайвого
          </p>
          <button
            type="button"
            className="text-button"
            onClick={() => setModal("rules")}
          >
            <Icon name="help" size={18} /> Як грати?
          </button>
        </section>
      );

    if (covered && secretStages.includes(state.stage))
      return (
        <section className="center-screen privacy-screen">
          <Avatar
            avatar={state.stage === "words" ? writer.avatar : explainer.avatar}
            className="handoff-avatar"
          />
          <h1>Тільки для тебе</h1>
          <p>Передай телефон гравцю</p>
          <h2 className="player-name">
            {state.stage === "words" ? writer.name : explainer.name}
          </h2>
          <p className="muted">
            Записки приховані.{" "}
            {state.stage === "playing"
              ? "Таймер продовжує відлік."
              : "Продовжуй, коли телефон уже в тебе."}
          </p>
          <Button
            onClick={() => {
              prepareAudio();
              setCovered(false);
            }}
          >
            Телефон у мене
            <Icon name="check" />
          </Button>
        </section>
      );

    if (state.stage === "teams")
      return (
        <section className="setup-screen">
          <h1>Хто з нами?</h1>
          <p className="intro">
            Оберіть назви команд
            <br />
            та додайте своїх гравців.
          </p>
          <div className="setup-progress" aria-label="Крок 1 з 3">
            <span className="current">Команди</span>
            <span>Правила</span>
            <span>Слова</span>
          </div>
          <div className="team-list">
            {state.teams.map((item, teamIndex) => (
              <article
                className={`team-editor team-color-${teamIndex % 6}`}
                key={item.id}
              >
                <div className="team-editor-heading">
                  <label className="team-name-label">
                    <span>Назва команди {teamIndex + 1}</span>
                    <input
                      aria-label={`Назва команди ${teamIndex + 1}`}
                      maxLength={40}
                      value={item.name}
                      onChange={(event) =>
                        dispatch({
                          type: "UPDATE_TEAM",
                          id: item.id,
                          patch: { name: event.target.value },
                        })
                      }
                      required
                    />
                  </label>
                  <button
                    type="button"
                    className="icon-button"
                    disabled={state.teams.length <= 2}
                    aria-label={`Видалити команду ${teamIndex + 1}`}
                    onClick={() =>
                      dispatch({ type: "REMOVE_TEAM", id: item.id })
                    }
                  >
                    <Icon name="close" size={18} />
                  </button>
                </div>
                <label className="team-preset-label">
                  Готова назва
                  <select
                    aria-label={`Готова назва команди ${teamIndex + 1}`}
                    value={teamNames.includes(item.name) ? item.name : ""}
                    onChange={(event) =>
                      dispatch({
                        type: "UPDATE_TEAM",
                        id: item.id,
                        patch: { name: event.target.value },
                      })
                    }
                  >
                    <option value="">Власна назва</option>
                    {teamNames.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="players-label">
                  Гравці <span>{item.players.length}</span>
                </div>
                {item.players.length === 0 && (
                  <p className="players-empty">
                    Поки нікого. Додай першого гравця.
                  </p>
                )}
                {item.players.map((player, playerIndex) => (
                  <div className="player-editor" key={player.id}>
                    <div className="player-input">
                      <button
                        type="button"
                        className="avatar-button"
                        aria-label={`Змінити аватар гравця ${playerIndex + 1}, команда ${teamIndex + 1}`}
                        onClick={() =>
                          setPersonTarget({
                            teamId: item.id,
                            playerId: player.id,
                          })
                        }
                      >
                        <Avatar avatar={player.avatar} />
                      </button>
                      <input
                        aria-label={`Ім’я гравця ${playerIndex + 1}, команда ${teamIndex + 1}`}
                        placeholder={`Ім’я гравця ${playerIndex + 1}`}
                        maxLength={40}
                        value={player.name}
                        onChange={(event) =>
                          dispatch({
                            type: "UPDATE_PLAYER",
                            teamId: item.id,
                            playerId: player.id,
                            patch: { name: event.target.value },
                          })
                        }
                        required
                      />
                      <button
                        type="button"
                        className="icon-button"
                        aria-label={`Видалити гравця ${playerIndex + 1}, команда ${teamIndex + 1}`}
                        onClick={() =>
                          dispatch({
                            type: "REMOVE_PLAYER",
                            teamId: item.id,
                            playerId: player.id,
                          })
                        }
                      >
                        <Icon name="minus" size={18} />
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  className="text-button add-player"
                  aria-label={`Додати гравця в команду ${teamIndex + 1}`}
                  onClick={() => setPersonTarget({ teamId: item.id })}
                >
                  <Icon name="plus" size={18} />
                  Додати гравця
                </button>
              </article>
            ))}
          </div>
          <Button
            variant="secondary"
            onClick={() =>
              dispatch({ type: "ADD_TEAM", team: makeTeam(state.teams.length) })
            }
          >
            <Icon name="plus" />
            Додати команду
          </Button>
          <p className="muted setup-hint">
            Щонайменше 2 команди, по 2 гравці в кожній. Заповніть усі імена.
          </p>
          <div className="bottom-actions">
            <Button
              disabled={!setupIsValid(state)}
              onClick={() => dispatch({ type: "GO_SETTINGS" })}
            >
              Далі — правила
              <Icon name="arrow" />
            </Button>
          </div>
        </section>
      );

    if (state.stage === "settings")
      return (
        <section className="settings-screen">
          <h1>
            Гра за вашими
            <br />
            правилами
          </h1>
          <p className="intro">
            Кілька маленьких налаштувань —<br />і можна наповнювати капелюх.
          </p>
          <div className="setup-progress" aria-label="Крок 2 з 3">
            <span>Команди</span>
            <span className="current">Правила</span>
            <span>Слова</span>
          </div>
          <Stepper
            label="Слів від гравця"
            description="Кожен додасть стільки записок"
            value={state.settings.wordsPerPlayer}
            min={1}
            max={20}
            onChange={(value) =>
              dispatch({
                type: "SET_SETTINGS",
                patch: { wordsPerPlayer: value },
              })
            }
          />
          <Stepper
            label="Час на хід"
            description="Для пояснення своїй команді"
            value={state.settings.duration}
            min={15}
            max={180}
            step={15}
            unit="с"
            onChange={(value) =>
              dispatch({ type: "SET_SETTINGS", patch: { duration: value } })
            }
          />
          <fieldset className="choice-group">
            <legend>Як пропускаємо слова?</legend>
            <p>Записка повертається в капелюх.</p>
            {(
              [
                ["free", "Без штрафу", "Пропускайте й рухайтеся далі"],
                [
                  "penalty",
                  "Мінус один бал",
                  "Кожен пропуск коштує команді 1 бал",
                ],
                [
                  "disabled",
                  "Не пропускаємо",
                  "Пояснюємо слово до перемоги або сигналу",
                ],
              ] as const
            ).map(([value, title, description]) => (
              <label className="choice" key={value}>
                <input
                  type="radio"
                  name="skip"
                  value={value}
                  checked={state.settings.skip === value}
                  onChange={() =>
                    dispatch({ type: "SET_SETTINGS", patch: { skip: value } })
                  }
                />
                <span>
                  <strong>{title}</strong>
                  <small>{description}</small>
                </span>
              </label>
            ))}
          </fieldset>
          <fieldset className="choice-group">
            <legend>Коли час закінчився</legend>
            {(
              [
                [
                  "confirm",
                  "Уточнюємо останнє слово",
                  "Можна зарахувати відповідь, що прозвучала до сигналу",
                ],
                [
                  "strict",
                  "Сигнал — і крапка",
                  "Непідтверджене слово повертається в капелюх",
                ],
              ] as const
            ).map(([value, title, description]) => (
              <label className="choice" key={value}>
                <input
                  type="radio"
                  name="timeout"
                  value={value}
                  checked={state.settings.timeout === value}
                  onChange={() =>
                    dispatch({
                      type: "SET_SETTINGS",
                      patch: { timeout: value },
                    })
                  }
                />
                <span>
                  <strong>{title}</strong>
                  <small>{description}</small>
                </span>
              </label>
            ))}
          </fieldset>
          <label className="sound-setting">
            <span>
              <strong>Звук таймера</strong>
              <small>Сигнали в останні 10 секунд і наприкінці</small>
            </span>
            <input
              type="checkbox"
              checked={state.settings.sound}
              onChange={() => dispatch({ type: "TOGGLE_SOUND" })}
            />
          </label>
          <p className="settings-total">
            У капелюсі буде{" "}
            <strong>{players.length * state.settings.wordsPerPlayer}</strong>{" "}
            записок від <strong>{players.length}</strong> гравців.
          </p>
          <div className="bottom-actions">
            <Button onClick={() => dispatch({ type: "BEGIN_WORDS" })}>
              Далі — загадуємо слова
              <Icon name="arrow" />
            </Button>
            <button
              type="button"
              className="text-button"
              onClick={() => dispatch({ type: "BACK_TEAMS" })}
            >
              <Icon name="back" size={18} />
              До команд
            </button>
          </div>
        </section>
      );

    if (state.stage === "word-handoff") {
      const writerTeam = state.teams.find((item) =>
        item.players.some((player) => player.id === writer.id),
      )!;
      return (
        <section className="center-screen handoff-screen">
          <Avatar avatar={writer.avatar} className="handoff-avatar" />
          <h1>
            Твій маленький
            <br />
            секрет
          </h1>
          <p>Передай телефон гравцю</p>
          <h2 className="player-name">{writer.name}</h2>
          <span className="team-badge">{writerTeam.name}</span>
          <p className="muted">
            Загадай {state.settings.wordsPerPlayer} слів або коротких фраз.
            <br />
            Інші гравці їх поки не побачать.
          </p>
          <Button onClick={() => dispatch({ type: "OPEN_WORDS" })}>
            Це я, почнімо
            <Icon name="arrow" />
          </Button>
          <p className="handoff-progress">
            Гравець {state.collectionIndex + 1} із {players.length}
          </p>
        </section>
      );
    }

    if (state.stage === "words") {
      const draft = state.drafts[writer.id];
      const filled = draft.filter((word) => word.trim()).length;
      return (
        <section className="words-screen">
          <Avatar avatar={writer.avatar} className="writer-avatar" />
          <h1>
            {writer.name},<br />
            що в капелюсі?
          </h1>
          <p className="intro">
            Предмети, персонажі, дивні штуки.
            <br />
            Те, що буде весело пояснювати!
          </p>
          <div className="word-count">
            <Icon name="lock" size={18} />
            <span>Тільки твої записки</span>
            <strong>
              {filled} / {state.settings.wordsPerPlayer}
            </strong>
          </div>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              submitWords();
            }}
          >
            <div className="word-inputs">
              {draft.map((word, index) => (
                <label className="word-input" key={`${writer.id}:${index}`}>
                  <span>{index + 1}</span>
                  <input
                    aria-label={`Записка ${index + 1}`}
                    placeholder="Слово або коротка фраза"
                    maxLength={100}
                    autoComplete="off"
                    value={word}
                    onChange={(event) => {
                      dispatch({
                        type: "DRAFT_WORD",
                        index,
                        text: event.target.value,
                      });
                      setWordError("");
                    }}
                  />
                </label>
              ))}
            </div>
            {wordError && (
              <p role="alert" className="form-error">
                {wordError}
              </p>
            )}
            <p className="muted">
              Перед завершенням можеш змінити будь-яку записку. Потім передай
              телефон наступному гравцю.
            </p>
            <div className="bottom-actions">
              <Button type="submit">
                Сховати в капелюх
                <Icon name="check" />
              </Button>
            </div>
          </form>
        </section>
      );
    }

    if (state.stage === "round-intro")
      return (
        <section className="center-screen round-screen">
          <div className="round-number">
            {state.round + 1}
            <span>раунд із 3</span>
          </div>
          <h1>{round.name}</h1>
          <p className="intro">{round.description}</p>
          <div className="round-tip">{round.hint}</div>
          <p className="muted">
            {state.words.length} записок · {state.settings.duration} секунд на
            хід
            <br />
            {state.round > 0
              ? "Усі знайомі слова знову в капелюсі."
              : "Ваші слова перемішані й готові до гри."}
          </p>
          <Button onClick={() => dispatch({ type: "ACK_ROUND" })}>
            Усе зрозуміло
            <Icon name="arrow" />
          </Button>
          <Scoreboard teams={state.teams} />
        </section>
      );

    if (state.stage === "turn-handoff")
      return (
        <section className="center-screen handoff-screen">
          <Avatar avatar={explainer.avatar} className="handoff-avatar" />
          <span className="team-badge">{team.name}</span>
          <h1>
            Твій вихід,
            <br />
            {explainer.name}!
          </h1>
          <p className="intro">
            {state.round === 1 ? "Показуй" : "Пояснюй"} своїй команді.
            <br />
            Слово бачиш тільки ти.
          </p>
          <div className="turn-details">
            <span>
              <strong>{state.settings.duration}</strong>секунд
            </span>
            <span>
              <strong>{state.deck.length}</strong>записок у капелюсі
            </span>
          </div>
          <p className="muted">
            {round.short} · Раунд {state.round + 1} із 3
          </p>
          <Button
            onClick={() => {
              prepareAudio();
              dispatch({ type: "START_TURN", now: Date.now() });
            }}
          >
            Почати хід
            <Icon name="play" />
          </Button>
          <Scoreboard teams={state.teams} activeId={team.id} />
        </section>
      );

    if (state.stage === "playing") {
      const word = state.words.find((item) => item.id === state.deck[0])!;
      return (
        <section
          className={`play-screen ${seconds <= 10 ? "time-urgent" : ""}`}
        >
          <div className="play-heading">
            <Avatar avatar={explainer.avatar} />
            <div>
              <strong>{explainer.name}</strong>
              <span>
                {team.name} · {round.short}
              </span>
            </div>
            <button
              type="button"
              className="icon-button"
              aria-label="Пауза"
              onClick={() => dispatch({ type: "PAUSE", now: Date.now() })}
            >
              <Icon name="pause" />
            </button>
          </div>
          <div className="timer">
            <span>Залишилось</span>
            <strong role="timer" aria-label={`Залишилось ${seconds} секунд`}>
              {seconds}
              <small>с</small>
            </strong>
            <progress
              max={state.settings.duration * 1000}
              value={remainingMs}
              aria-label="Час ходу"
            />
          </div>
          <div className="word-slip" key={word.id}>
            <span>{round.instruction}</span>
            <h1>{word.text}</h1>
            <small>{state.deck.length} записок у капелюсі</small>
          </div>
          <div className="play-actions">
            {state.settings.skip !== "disabled" && (
              <Button
                variant="coral"
                onClick={() => dispatch({ type: "SKIP", now: Date.now() })}
              >
                <Icon name="minus" size={30} />
                <span>
                  Пропустити
                  <small>
                    {state.settings.skip === "penalty"
                      ? "−1 бал"
                      : "без штрафу"}
                  </small>
                </span>
              </Button>
            )}
            <Button
              className="guess-button"
              onClick={() => dispatch({ type: "GUESS", now: Date.now() })}
            >
              <Icon name="plus" size={30} />
              <span>
                Вгадано<small>+1 бал</small>
              </span>
            </Button>
          </div>
          <p className="turn-score" aria-live="polite">
            Цей хід:{" "}
            <strong>
              {(state.turn?.guessed.length ?? 0) - (state.turn?.penalty ?? 0)}
            </strong>{" "}
            балів
          </p>
          <Scoreboard teams={state.teams} activeId={team.id} />
        </section>
      );
    }

    if (state.stage === "paused")
      return (
        <section className="center-screen">
          <div className="privacy-symbol">
            <Icon name="pause" size={40} />
          </div>
          <h1>Перепочинемо?</h1>
          <p className="intro">
            Слово сховане, таймер на паузі.
            <br />
            {explainer.name}, твій хід ще триває.
          </p>
          <div className="paused-time">
            {Math.ceil((state.turn?.remainingMs ?? 0) / 1000)}
            <small> секунд залишилось</small>
          </div>
          <Button
            onClick={() => {
              prepareAudio();
              dispatch({ type: "RESUME", now: Date.now() });
            }}
          >
            Продовжити хід
            <Icon name="play" />
          </Button>
        </section>
      );

    if (state.stage === "timeout")
      return (
        <section className="center-screen timeout-screen">
          <div className="time-up">0:00</div>
          <h1>Час вийшов!</h1>
          <p className="intro">
            Встигли вгадати останню записку
            <br />
            до сигналу?
          </p>
          <div className="last-word">
            {state.words.find((word) => word.id === state.deck[0])?.text}
          </div>
          <Button
            onClick={() => dispatch({ type: "RESOLVE_TIMEOUT", guessed: true })}
          >
            Так, встигли!
            <Icon name="plus" />
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              dispatch({ type: "RESOLVE_TIMEOUT", guessed: false })
            }
          >
            Ні, назад у капелюх
            <Icon name="back" />
          </Button>
          <p className="muted">Підтвердження доступне лише для цієї записки.</p>
        </section>
      );

    if (state.stage === "turn-summary") {
      const gained =
        (state.turn?.guessed.length ?? 0) - (state.turn?.penalty ?? 0);
      return (
        <section className="center-screen summary-screen">
          <Avatar avatar={explainer.avatar} className="handoff-avatar" />
          <h1>{state.deck.length ? "Гарний хід!" : "Капелюх порожній!"}</h1>
          <p className="intro">
            {explainer.name} · {team.name}
          </p>
          <div className="earned-score">
            {gained > 0 ? "+" : ""}
            {gained}
            <span>балів за цей хід</span>
          </div>
          <div className="summary-details">
            <span>
              Вгадано<strong>{state.turn?.guessed.length}</strong>
            </span>
            <span>
              Пропущено<strong>{state.turn?.skips}</strong>
            </span>
            {state.turn?.penalty ? (
              <span>
                Штраф<strong>−{state.turn.penalty}</strong>
              </span>
            ) : null}
          </div>
          <div className="turn-results">
            <h2>Слова цього ходу</h2>
            <p className="muted">Перевір результати й виправ випадкові натискання.</p>
            <ol>
              {getTurnResults(state).map((result, index) => {
                const word = state.words.find((item) => item.id === result.wordId)!;
                return (
                  <li key={index}>
                    <span>{word.text}</span>
                    <button
                      type="button"
                      role="switch"
                      className="word-result-toggle"
                      aria-label={`Результат слова ${index + 1}: ${word.text}`}
                      aria-checked={result.status === "guessed"}
                      disabled={
                        result.status !== "guessed" &&
                        state.turn!.guessed.includes(result.wordId)
                      }
                      onClick={() =>
                        dispatch({
                          type: "UPDATE_TURN_RESULT",
                          index,
                          status:
                            result.status !== "guessed"
                              ? "guessed"
                              : state.settings.skip === "disabled"
                                ? "unanswered"
                                : "skipped",
                        })
                      }
                    >
                      {result.status === "guessed" ? "Вгадано" : "Не вгадано"}
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
          <Scoreboard teams={state.teams} activeId={team.id} />
          <p className="muted">
            {state.deck.length
              ? `Залишилось записок: ${state.deck.length}`
              : state.round < 2
                ? "Попереду новий раунд із тими самими словами."
                : "Усі три раунди завершено. Час святкувати!"}
          </p>
          <Button onClick={nextTurn}>
            {state.deck.length
              ? "Наступна команда"
              : state.round < 2
                ? "До наступного раунду"
                : "До результатів"}
            <Icon name="arrow" />
          </Button>
        </section>
      );
    }

    const ranked = [...state.teams].sort(
      (a, b) => totalScore(b) - totalScore(a),
    );
    const winners = ranked.filter(
      (item) => totalScore(item) === totalScore(ranked[0]),
    );
    const stats = getGameStats(state);
    const wordHighlights = stats
      ? stats.easiest.length === state.words.length
        ? [{ title: "Усі слова вгадували однаково", words: stats.easiest }]
        : [
            { title: "Найбільш вгадувані слова", words: stats.easiest },
            { title: "Найменш вгадувані слова", words: stats.hardest },
          ]
      : [];
    return (
      <section className="finish-screen">
        <img
          className="victory-art"
          src={`${import.meta.env.BASE_URL}art/victory.webp`}
          alt="Золотий капелюх-трофей із конфеті"
          width="220"
          height="220"
        />
        <h1>{winners.length > 1 ? "Дружня нічия!" : "Оце порозуміння!"}</h1>
        <p className="intro">
          {winners.length > 1 ? "Перемогу ділять" : "Переможці сьогодні"}
          <br />
          <strong>{winners.map((item) => item.name).join(" та ")}</strong>
        </p>
        <div className="results-table">
          <div className="results-heading">
            <span>Команда</span>
            <span>Р1</span>
            <span>Р2</span>
            <span>Р3</span>
            <span>Разом</span>
          </div>
          {ranked.map((item) => (
            <div
              className={`result-row ${winners.some((winner) => winner.id === item.id) ? "winner-row" : ""}`}
              key={item.id}
            >
              <div>
                <strong>{item.name}</strong>
              </div>
              {item.scores.map((score, index) => (
                <span key={index}>{score}</span>
              ))}
              <b>{totalScore(item)}</b>
            </div>
          ))}
        </div>
        {stats ? (
          <div className="party-stats">
            <section aria-labelledby="player-ranking-title">
              <h2 id="player-ranking-title">Топ-5 гравців</h2>
              <p className="muted">За словами, які команда вгадала під час пояснення гравця. Без віднімання штрафів. Однаковий результат — спільне місце.</p>
              <ol className="player-ranking">
                {stats.players.slice(0, 5).map(({ player, guessed }) => (
                  <li key={player.id}>
                    <span className="player-rank">{stats.players.findIndex((entry) => entry.guessed === guessed) + 1}</span>
                    <Avatar avatar={player.avatar} />
                    <strong>{player.name}</strong>
                    <span className="player-guessed"><b>{guessed}</b><small>вгадано</small></span>
                  </li>
                ))}
              </ol>
            </section>
            <section aria-labelledby="word-stats-title">
              <h2 id="word-stats-title">Слова партії</h2>
              <p className="muted">Порівнюємо частку успішних спроб: пропуски й невгадані слова після сигналу теж враховуються. За однакового результату показуємо всі слова.</p>
              {wordHighlights.map(({ title, words }) => (
                <section className="word-highlight" key={title}>
                  <h3>{title}</h3>
                  <ul>
                    {words.map(({ word, author, guessed, attempts }) => (
                      <li key={word.id}>
                        <strong>{word.text}</strong>
                        <span>Автор: {author.name}</span>
                        <small>{guessed} з {attempts} спроб успішні · {Math.round(100 * guessed / attempts)}%</small>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </section>
          </div>
        ) : (
          <p className="notice">Детальна статистика доступна для нових партій. У цьому збереженні історія ходів ще не записувалася.</p>
        )}
        <p className="muted">
          Три раунди позаду. А найкращі жарти
          <br />
          залишаться з вами надовго.
        </p>
        <Button onClick={() => startNew(true)}>
          Зіграти ще
          <Icon name="arrow" />
        </Button>
        <button type="button" className="text-button" onClick={goHome}>
          На головну
        </button>
      </section>
    );
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <button
          type="button"
          className="wordmark"
          onClick={goHome}
          aria-label="Капелюх — на головну"
        >
          <Icon name="hat" size={30} />
          <span>
            капелюх<span className="wordmark-dot">.</span>
          </span>
        </button>
        <div className="header-actions">
          <button
            type="button"
            className="icon-button"
            aria-label={
              state.settings.sound ? "Вимкнути звук" : "Увімкнути звук"
            }
            aria-pressed={state.settings.sound}
            onClick={() => {
              if (!state.settings.sound)
                void unlockAudio().then((ok) => setAudioIssue(!ok));
              dispatch({ type: "TOGGLE_SOUND" });
            }}
          >
            <Icon name={state.settings.sound ? "sound" : "mute"} />
          </button>
          <button
            type="button"
            className="icon-button"
            aria-label="Правила гри"
            onClick={() => setModal("rules")}
          >
            <Icon name="help" />
          </button>
        </div>
      </header>
      {storageIssue && (
        <p className="notice" role="status">
          {storageIssue === "corrupt"
            ? "Збереження не вдалося прочитати. Можна почати нову гру."
            : "Браузер не дозволяє зберегти гру. Не закривай цю вкладку."}
        </p>
      )}
      {audioIssue && state.settings.sound && (
        <p className="notice" role="status">
          Звук недоступний. Стеж за таймером на екрані.
        </p>
      )}
      <main id="main-content">{screen()}</main>
      <footer className="app-footer">
        <span>Трохи слів. Багато сміху.</span>
        <span>Зроблено для своїх</span>
      </footer>
      {personTarget && (
        <Modal
          title={
            personTarget.playerId ? "Змінити аватар" : "Обери аватар"
          }
          onClose={() => setPersonTarget(null)}
        >
          <p>Ім’я людини підставиться автоматично. Його можна змінити в команді.</p>
          <div className="person-options">
            {avatarOptions.map((person, index) => {
              const label =
                index === 0 ? "Хлопець" : index === 1 ? "Дівчина" : null;
              const letter = (person.surname || person.name)[0];
              return (
                <Fragment key={person.img}>
                  {index === 2 && <hr className="avatar-divider" />}
                  {index >= 2 &&
                    (index === 2 ||
                      letter !== (avatarOptions[index - 1].surname || avatarOptions[index - 1].name)[0]) && (
                      <h3 className="avatar-letter">{letter}</h3>
                    )}
                  <button
                    type="button"
                    aria-label={label ?? `${person.name}, аватар ${persons.indexOf(person) + 1}`}
                    onClick={() => {
                      if (personTarget.playerId) {
                        dispatch({
                          type: "UPDATE_PLAYER",
                          teamId: personTarget.teamId,
                          playerId: personTarget.playerId,
                          patch: {
                            avatar: person.img,
                            ...(label ? {} : { name: person.name }),
                          },
                        });
                      } else {
                        dispatch({
                          type: "ADD_PLAYER",
                          teamId: personTarget.teamId,
                          player: makePlayer(person),
                        });
                      }
                      setPersonTarget(null);
                    }}
                  >
                    <Avatar avatar={person.img} />
                    <span className={label ? "base-avatar-label" : undefined}>
                      {label ?? person.name}
                    </span>
                  </button>
                </Fragment>
              );
            })}
          </div>
        </Modal>
      )}
      {modal === "reset" && (
        <Modal title="Почати нову гру?" onClose={() => setModal(null)}>
          <p>
            Поточні команди, записки й рахунок буде замінено. Цю партію вже не
            вдасться продовжити.
          </p>
          <Button variant="secondary" autoFocus onClick={() => setModal(null)}>
            Залишити поточну гру
          </Button>
          <Button variant="coral" onClick={() => startNew()}>
            Так, почати нову
          </Button>
        </Modal>
      )}
      {modal === "rules" && (
        <Modal title="Як грати в «Капелюх»" onClose={() => setModal(null)}>
          <p>
            Зберіть щонайменше 2 команди по 2 гравці. Кожен таємно додає слова,
            а всі записки потрапляють в один капелюх.
          </p>
          <ol className="rules-list">
            {rounds.map((item) => (
              <li key={item.name}>
                <strong>{item.name}</strong>
                <p>{item.description}</p>
              </li>
            ))}
          </ol>
          <p>
            Пояснювачі й команди ходять по черзі. Одна вгадана записка — один
            бал. Раунд закінчується, коли вгадано всі слова. Перемагає команда з
            найбільшою сумою за три раунди.
          </p>
          <p>
            Пропуски та останнє слово після сигналу залежать від налаштувань
            партії. Показуй екран зі словом лише пояснювачу.
          </p>
          <Button onClick={() => setModal(null)}>
            Зрозуміло
            <Icon name="check" />
          </Button>
        </Modal>
      )}
    </div>
  );
};
