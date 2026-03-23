import { useState, useEffect, useCallback } from "react";
import { patterns } from "./data";

// Count total checkboxes: each link for multi-link questions, 1 for single-link
const totalCheckboxes = patterns.reduce(
  (sum, p) =>
    sum +
    p.questions.reduce(
      (s, q) => s + (q.links.length > 1 ? q.links.length : 1),
      0,
    ),
  0,
);

const STORAGE_KEY = "dsa-tracker-solved";

function getDifficultyColor(difficulty) {
  switch (difficulty?.toLowerCase()) {
    case "easy":
      return { color: "var(--easy)", bg: "var(--easy-bg)" };
    case "medium":
      return { color: "var(--medium)", bg: "var(--medium-bg)" };
    case "hard":
      return { color: "var(--hard)", bg: "var(--hard-bg)" };
    default:
      return { color: "var(--text-muted)", bg: "transparent" };
  }
}

function DifficultyBadge({ difficulty }) {
  const { color, bg } = getDifficultyColor(difficulty);
  return (
    <span
      style={{
        fontSize: "0.7rem",
        fontWeight: 600,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        color,
        background: bg,
        border: `1px solid ${color}33`,
        borderRadius: "4px",
        padding: "1px 7px",
        flexShrink: 0,
      }}
    >
      {difficulty || "—"}
    </span>
  );
}

function CircularCheckbox({ checked, onChange }) {
  return (
    <button
      onClick={onChange}
      aria-label={checked ? "Mark unsolved" : "Mark solved"}
      style={{
        width: 22,
        height: 22,
        borderRadius: "50%",
        border: checked
          ? "2px solid var(--easy)"
          : "2px solid var(--border-hover)",
        background: checked ? "var(--easy)" : "transparent",
        cursor: "pointer",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.15s ease",
        padding: 0,
      }}
      onMouseEnter={(e) => {
        if (!checked) e.currentTarget.style.borderColor = "var(--easy)";
      }}
      onMouseLeave={(e) => {
        if (!checked) e.currentTarget.style.borderColor = "var(--border-hover)";
      }}
    >
      {checked && (
        <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
          <path
            d="M1 4L4 7.5L10 1"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}

function LinkButton({ label, url }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        fontSize: "0.72rem",
        fontWeight: 500,
        color: "var(--accent-blue)",
        background: "var(--accent-blue-dim)",
        border: "1px solid #58a6ff33",
        borderRadius: "5px",
        padding: "2px 9px",
        textDecoration: "none",
        whiteSpace: "nowrap",
        transition: "background 0.15s",
        flexShrink: 0,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#1f6feb55")}
      onMouseLeave={(e) =>
        (e.currentTarget.style.background = "var(--accent-blue-dim)")
      }
    >
      {label}
    </a>
  );
}

function QuestionRow({ question, solved, onToggle }) {
  const hasMultiLinks = question.links.length > 1;

  if (hasMultiLinks) {
    const linkIds = question.links.map((_, i) => `${question.id}-link-${i}`);
    const allDone = linkIds.every((id) => solved.has(id));
    const anyDone = linkIds.some((id) => solved.has(id));

    return (
      <div style={{ borderBottom: "1px solid var(--border)" }}>
        {/* Parent row — auto-completes when all sub-links done */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 16px",
            opacity: allDone ? 0.6 : 1,
          }}
        >
          {/* Locked parent checkbox */}
          <button
            disabled
            aria-label={
              allDone
                ? "All variants solved"
                : "Complete all variants to mark solved"
            }
            style={{
              width: 22,
              height: 22,
              borderRadius: "50%",
              border: allDone
                ? "2px solid var(--easy)"
                : anyDone
                  ? "2px solid var(--medium)"
                  : "2px solid var(--border-hover)",
              background: allDone
                ? "var(--easy)"
                : anyDone
                  ? "var(--medium-bg)"
                  : "transparent",
              cursor: "not-allowed",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
              transition: "all 0.15s ease",
            }}
          >
            {allDone && (
              <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                <path
                  d="M1 4L4 7.5L10 1"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>

          <span
            style={{
              flex: 1,
              fontSize: "0.88rem",
              color: allDone ? "var(--text-muted)" : "var(--text-primary)",
              textDecoration: allDone ? "line-through" : "none",
              minWidth: 0,
            }}
          >
            {question.name}
          </span>

          <DifficultyBadge difficulty={question.difficulty} />
        </div>

        {/* One sub-row per link */}
        {question.links.map((link, i) => {
          const linkId = linkIds[i];
          const isDone = solved.has(linkId);
          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "7px 16px 7px 48px",
                opacity: isDone ? 0.55 : 1,
                transition: "background 0.12s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "var(--bg-hover)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <CircularCheckbox
                checked={isDone}
                onChange={() => onToggle(linkId)}
              />
              <span
                style={{
                  flex: 1,
                  fontSize: "0.82rem",
                  color: isDone ? "var(--text-muted)" : "var(--text-secondary)",
                  textDecoration: isDone ? "line-through" : "none",
                }}
              >
                {link.label}
              </span>
              <LinkButton label="LeetCode" url={link.url} />
            </div>
          );
        })}
      </div>
    );
  }

  // Single link — original behaviour
  const isSolved = solved.has(question.id);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 16px",
        borderBottom: "1px solid var(--border)",
        transition: "background 0.12s",
        opacity: isSolved ? 0.6 : 1,
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.background = "var(--bg-hover)")
      }
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <CircularCheckbox
        checked={isSolved}
        onChange={() => onToggle(question.id)}
      />

      <span
        style={{
          flex: 1,
          fontSize: "0.88rem",
          color: isSolved ? "var(--text-muted)" : "var(--text-primary)",
          textDecoration: isSolved ? "line-through" : "none",
          minWidth: 0,
        }}
      >
        {question.name}
      </span>

      <div
        style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}
      >
        <DifficultyBadge difficulty={question.difficulty} />
        {question.links.length === 1 && (
          <LinkButton
            label={question.links[0].label}
            url={question.links[0].url}
          />
        )}
        {question.links.length === 0 && (
          <span
            style={{
              fontSize: "0.72rem",
              color: "var(--text-muted)",
              fontStyle: "italic",
            }}
          >
            no link
          </span>
        )}
      </div>
    </div>
  );
}

function PatternCard({ pattern, solved, onToggle, globalExpanded }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (globalExpanded !== null) setOpen(globalExpanded);
  }, [globalExpanded]);

  const total = pattern.questions.reduce(
    (s, q) => s + (q.links.length > 1 ? q.links.length : 1),
    0,
  );
  const done = pattern.questions.reduce((s, q) => {
    if (q.links.length > 1)
      return (
        s + q.links.filter((_, i) => solved.has(`${q.id}-link-${i}`)).length
      );
    return s + (solved.has(q.id) ? 1 : 0);
  }, 0);
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  const ringColor =
    pct === 100 ? "var(--easy)" : pct > 0 ? "var(--medium)" : "var(--border)";

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: `1px solid ${open ? "var(--border-hover)" : "var(--border)"}`,
        borderRadius: "var(--radius)",
        overflow: "hidden",
        transition: "border-color 0.15s",
      }}
    >
      {/* Header */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "14px 18px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: "var(--text-primary)",
          textAlign: "left",
        }}
      >
        {/* Mini progress ring */}
        <svg width="38" height="38" style={{ flexShrink: 0 }}>
          <circle
            cx="19"
            cy="19"
            r="15"
            fill="none"
            stroke="var(--progress-track)"
            strokeWidth="3"
          />
          <circle
            cx="19"
            cy="19"
            r="15"
            fill="none"
            stroke={ringColor}
            strokeWidth="3"
            strokeDasharray={`${2 * Math.PI * 15}`}
            strokeDashoffset={`${2 * Math.PI * 15 * (1 - pct / 100)}`}
            strokeLinecap="round"
            transform="rotate(-90 19 19)"
            style={{ transition: "stroke-dashoffset 0.4s ease" }}
          />
          <text
            x="19"
            y="23"
            textAnchor="middle"
            fontSize="9"
            fontWeight="600"
            fill={ringColor}
            fontFamily="Inter, sans-serif"
          >
            {pct}%
          </text>
        </svg>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontWeight: 600,
              fontSize: "0.95rem",
              color: "var(--text-primary)",
            }}
          >
            {pattern.title}
          </div>
          <div
            style={{
              fontSize: "0.78rem",
              color: "var(--text-muted)",
              marginTop: 2,
            }}
          >
            {done} / {total} solved
          </div>
        </div>

        {/* Difficulty summary pills */}
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          {["easy", "medium", "hard"].map((d) => {
            const count = pattern.questions.filter(
              (q) => q.difficulty === d,
            ).length;
            if (!count) return null;
            const { color, bg } = getDifficultyColor(d);
            return (
              <span
                key={d}
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  color,
                  background: bg,
                  border: `1px solid ${color}33`,
                  borderRadius: 4,
                  padding: "1px 7px",
                }}
              >
                {count} {d}
              </span>
            );
          })}
        </div>

        {/* Chevron */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          style={{
            flexShrink: 0,
            transform: open ? "rotate(180deg)" : "rotate(0)",
            transition: "transform 0.2s",
          }}
          fill="none"
        >
          <path
            d="M4 6l4 4 4-4"
            stroke="var(--text-muted)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Question list */}
      {open && (
        <div style={{ borderTop: "1px solid var(--border)" }}>
          {pattern.questions.map((q) => (
            <QuestionRow
              key={q.id}
              question={q}
              solved={solved}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [solved, setSolved] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  });

  const [globalExpanded, setGlobalExpanded] = useState(null);
  const [expandKey, setExpandKey] = useState(0);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...solved]));
  }, [solved]);

  const toggle = useCallback((id) => {
    setSolved((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const solvedCount = solved.size;
  const pct = totalCheckboxes === 0 ? 0 : (solvedCount / totalCheckboxes) * 100;

  function triggerExpand(val) {
    setGlobalExpanded(val);
    setExpandKey((k) => k + 1);
  }

  const progressColor =
    pct === 100
      ? "var(--easy)"
      : pct >= 50
        ? "var(--medium)"
        : "var(--accent-blue)";

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      {/* Top header */}
      <header
        style={{
          background: "var(--bg-secondary)",
          borderBottom: "1px solid var(--border)",
          padding: "20px 24px",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  letterSpacing: "-0.01em",
                }}
              >
                DSA Pattern Tracker
              </h1>
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                  marginTop: 2,
                }}
              >
                {solvedCount} of {totalCheckboxes} solved &mdash;{" "}
                {Math.round(pct)}% complete
              </p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => triggerExpand(true)} style={btnStyle}>
                Expand All
              </button>
              <button onClick={() => triggerExpand(false)} style={btnStyle}>
                Collapse All
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div
            style={{
              marginTop: 14,
              background: "var(--progress-track)",
              borderRadius: 99,
              height: 8,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${pct}%`,
                background: progressColor,
                borderRadius: 99,
                transition: "width 0.4s ease, background 0.4s ease",
              }}
            />
          </div>
        </div>
      </header>

      {/* Pattern list */}
      <main
        style={{
          maxWidth: 860,
          margin: "0 auto",
          padding: "24px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {patterns.map((pattern) => (
          <PatternCard
            key={`${pattern.id}-${expandKey}`}
            pattern={pattern}
            solved={solved}
            onToggle={toggle}
            globalExpanded={globalExpanded}
          />
        ))}
      </main>

      <footer
        style={{
          textAlign: "center",
          padding: "24px 16px",
          color: "var(--text-muted)",
          fontSize: "0.78rem",
        }}
      >
        Progress saved in browser &bull; {totalCheckboxes} checkboxes across{" "}
        {patterns.length} patterns
      </footer>
    </div>
  );
}

const btnStyle = {
  fontSize: "0.78rem",
  fontWeight: 500,
  color: "var(--text-secondary)",
  background: "var(--bg-hover)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-sm)",
  padding: "5px 12px",
  cursor: "pointer",
  transition: "border-color 0.15s",
};
