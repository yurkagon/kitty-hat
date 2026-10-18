import {
  useEffect,
  useRef,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { totalScore, type AvatarId, type Team } from "./game";

export const Icon = ({
  name,
  size = 22,
}: {
  name:
    | "hat"
    | "plus"
    | "minus"
    | "arrow"
    | "back"
    | "sound"
    | "mute"
    | "pause"
    | "play"
    | "check"
    | "close"
    | "help"
    | "lock";
  size?: number;
}) => {
  const paths = {
    hat: (
      <>
        <path d="M7 4h10l-1 13H8z" />
        <path d="M8 13h8M3 18c0-3 18-3 18 0s-18 3-18 0" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    minus: <path d="M5 12h14" />,
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
    back: <path d="M19 12H5m6-6-6 6 6 6" />,
    sound: (
      <>
        <path d="M11 5 6 9H3v6h3l5 4zM15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" />
      </>
    ),
    mute: (
      <>
        <path d="M11 5 6 9H3v6h3l5 4zM16 9l5 6m0-6-5 6" />
      </>
    ),
    pause: <path d="M8 5v14M16 5v14" />,
    play: <path d="m8 4 12 8-12 8z" />,
    check: <path d="m5 12 4 4L19 6" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    help: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M9 9a3 3 0 0 1 6 0c0 2-3 2-3 4m0 3h.01" />
      </>
    ),
    lock: (
      <>
        <rect x="5" y="10" width="14" height="11" rx="3" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3m-4 4v3" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
};

export const Button = ({
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "coral" | "quiet";
  children: ReactNode;
}) => (
  <button
    type="button"
    {...props}
    className={`button button-${variant} ${className}`}
  >
    {children}
  </button>
);

const avatarImages = import.meta.glob<string>(
  "../data/persons/img/*.{png,jpg,jpeg,webp,avif}",
  {
    eager: true,
    query: "?url",
    import: "default",
  },
);

export const Avatar = ({
  avatar,
  className = "",
}: {
  avatar: AvatarId;
  className?: string;
}) => (
  <img
    className={`avatar ${className}`}
    src={avatarImages[`../data/persons/img/${avatar}`]}
    alt=""
    width="88"
    height="88"
  />
);

export const Stepper = ({
  label,
  description,
  value,
  min,
  max,
  step = 1,
  unit,
  onChange,
}: {
  label: string;
  description: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
}) => (
  <div className="setting-row">
    <div>
      <h2>{label}</h2>
      <p>{description}</p>
    </div>
    <div className="stepper">
      <button
        type="button"
        className="stepper-button"
        disabled={value <= min}
        aria-label={`Зменшити: ${label}`}
        onClick={() => onChange(value - step)}
      >
        <Icon name="minus" />
      </button>
      <output aria-label={label}>
        {value}
        <small>{unit}</small>
      </output>
      <button
        type="button"
        className="stepper-button"
        disabled={value >= max}
        aria-label={`Збільшити: ${label}`}
        onClick={() => onChange(value + step)}
      >
        <Icon name="plus" />
      </button>
    </div>
  </div>
);

export const Scoreboard = ({
  teams,
  activeId,
}: {
  teams: Team[];
  activeId?: string;
}) => (
  <div className="scoreboard" aria-label="Рахунок команд">
    {teams.map((team) => (
      <div
        className={`score-item ${team.id === activeId ? "score-active" : ""}`}
        key={team.id}
      >
        <span>{team.name}</span>
        <strong>{totalScore(team)}</strong>
      </div>
    ))}
  </div>
);

export const Modal = ({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) => {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    const opener = document.activeElement;
    dialog?.showModal();
    return () => {
      dialog?.close();
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby="dialog-title"
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="dialog-content">
        <button
          type="button"
          className="icon-button dialog-close"
          aria-label="Закрити"
          onClick={onClose}
        >
          <Icon name="close" />
        </button>
        <h2 id="dialog-title">{title}</h2>
        {children}
      </div>
    </dialog>
  );
};
