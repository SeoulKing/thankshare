import { FormEvent, useEffect, useMemo, useState } from "react";
import { GROUP_NAMES } from "./config/groups";
import {
  createDraw,
  createShare,
  getFirestoreErrorMessage,
  getDrawsByDate,
  getSharesByDate,
  subscribeDraws,
  subscribeShares,
} from "./services/firestore";
import {
  addKoreaDays,
  formatKoreaDate,
  formatKoreaDateTime,
  getKoreaDateKey,
} from "./lib/date";
import { isFirebaseConfigured, missingFirebaseEnv } from "./lib/firebase";
import type { Draw, NewShareInput, Share } from "./types";

const ADMIN_SESSION_KEY = "thankyou-admin-unlocked";

type Route = "/" | "/write" | "/board" | "/draw";

function getRoute(pathname: string): Route {
  if (pathname === "/write" || pathname === "/board" || pathname === "/draw") {
    return pathname;
  }

  return "/";
}

function App() {
  const [route, setRoute] = useState<Route>(() => getRoute(window.location.pathname));
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const selectedDateKey = getKoreaDateKey(selectedDate);

  useEffect(() => {
    const onPopState = () => setRoute(getRoute(window.location.pathname));
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigate = (nextRoute: Route) => {
    window.history.pushState(null, "", nextRoute);
    setRoute(nextRoute);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className={`app-shell ${route === "/" ? "home-shell" : "page-shell"}`}>
      <div className="topbar">
        <button className="brand-button" type="button" onClick={() => navigate("/")}>
          전체나눔
        </button>
        {route !== "/" && (
          <button className="ghost-button" type="button" onClick={() => navigate("/")}>
            처음으로
          </button>
        )}
      </div>

      {!isFirebaseConfigured && <ConfigWarning />}

      {route === "/" && (
        <HomePage
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          onNavigate={navigate}
        />
      )}
      {route === "/write" && (
        <WritePage
          selectedDate={selectedDate}
          selectedDateKey={selectedDateKey}
          onNavigate={navigate}
        />
      )}
      {route === "/board" && <BoardPage />}
      {route === "/draw" && (
        <DrawPage selectedDate={selectedDate} selectedDateKey={selectedDateKey} />
      )}
    </main>
  );
}

function ConfigWarning() {
  return (
    <section className="notice error-notice" role="alert">
      <strong>Firebase 설정이 필요합니다.</strong>
      <span>.env.local에 {missingFirebaseEnv.join(", ")} 값을 넣어주세요.</span>
    </section>
  );
}

function HomePage({
  selectedDate,
  onDateChange,
  onNavigate,
}: {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onNavigate: (route: Route) => void;
}) {
  return (
    <section className="home-stage">
      <div className="home-copy">
        <DateSelector selectedDate={selectedDate} onDateChange={onDateChange} />
      </div>

      <div className="home-actions" aria-label="주요 메뉴">
        <button type="button" className="nav-action write" onClick={() => onNavigate("/write")}>
          <span>작성하기</span>
        </button>
        <button type="button" className="nav-action board" onClick={() => onNavigate("/board")}>
          <span>전체 나눔 보기</span>
        </button>
        <button type="button" className="nav-action draw" onClick={() => onNavigate("/draw")}>
          <span>추첨하기</span>
        </button>
      </div>
    </section>
  );
}

function DateSelector({
  selectedDate,
  onDateChange,
}: {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}) {
  return (
    <div className="date-selector" aria-label="나눔 날짜 선택">
      <button
        type="button"
        className="date-step-button"
        aria-label="이전 날짜"
        onClick={() => onDateChange(addKoreaDays(selectedDate, -1))}
      >
        ‹
      </button>
      <time className="today-label" dateTime={getKoreaDateKey(selectedDate)}>
        {formatKoreaDate(selectedDate)}
      </time>
      <button
        type="button"
        className="date-step-button"
        aria-label="다음 날짜"
        onClick={() => onDateChange(addKoreaDays(selectedDate, 1))}
      >
        ›
      </button>
    </div>
  );
}

function WritePage({
  selectedDate,
  selectedDateKey,
  onNavigate,
}: {
  selectedDate: Date;
  selectedDateKey: string;
  onNavigate: (route: Route) => void;
}) {
  const [form, setForm] = useState<NewShareInput>({
    groupName: GROUP_NAMES[0] ?? "",
    name: "",
    content: "",
  });
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [error, setError] = useState("");

  const updateForm = (key: keyof NewShareInput, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setError("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.groupName || !form.content.trim()) {
      setError("속회와 감사 내용을 입력해주세요.");
      return;
    }

    setStatus("submitting");
    setError("");

    try {
      await createShare(form, selectedDateKey);
      setForm((current) => ({ ...current, name: "", content: "" }));
      setStatus("success");
    } catch (submitError) {
      setError(getFirestoreErrorMessage(submitError));
      setStatus("idle");
    }
  };

  return (
    <section className="page-panel form-panel">
      <div className="section-heading">
        <p className="eyebrow">작성하기</p>
        <h1>한 주간 감사했던 일</h1>
        <p className="section-date">{formatKoreaDate(selectedDate)}</p>
      </div>

      <form className="share-form" onSubmit={handleSubmit}>
        <label>
          <span>속회</span>
          <select
            value={form.groupName}
            onChange={(event) => updateForm("groupName", event.target.value)}
          >
            {GROUP_NAMES.map((groupName) => (
              <option value={groupName} key={groupName}>
                {groupName}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>이름</span>
          <input
            type="text"
            value={form.name}
            maxLength={40}
            onChange={(event) => updateForm("name", event.target.value)}
          />
        </label>

        <label>
          <span>감사 내용</span>
          <textarea
            value={form.content}
            maxLength={1000}
            rows={8}
            onChange={(event) => updateForm("content", event.target.value)}
          />
        </label>

        {error && <p className="form-message error-text">{error}</p>}
        {status === "success" && (
          <p className="form-message success-text">감사 나눔이 제출되었습니다.</p>
        )}

        <div className="form-actions">
          <button
            className="primary-button"
            type="submit"
            disabled={status === "submitting" || !isFirebaseConfigured}
          >
            {status === "submitting" ? "제출 중" : "제출하기"}
          </button>
          {status === "success" && (
            <button className="secondary-button" type="button" onClick={() => onNavigate("/board")}>
              전체 나눔 보기
            </button>
          )}
        </div>
      </form>
    </section>
  );
}

function BoardPage() {
  const [shares, setShares] = useState<Share[]>([]);
  const [drawnShareIds, setDrawnShareIds] = useState<Set<string>>(() => new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    const unsubscribeShares = subscribeShares(
      (nextShares) => {
        setShares(nextShares);
        setLoading(false);
      },
      (snapshotError) => {
        setError(getFirestoreErrorMessage(snapshotError));
        setLoading(false);
      },
    );
    const unsubscribeDraws = subscribeDraws(
      (nextDraws) => {
        setDrawnShareIds(new Set(nextDraws.map((draw) => draw.shareId)));
      },
      (snapshotError) => {
        setError(getFirestoreErrorMessage(snapshotError));
      },
    );

    return () => {
      unsubscribeShares();
      unsubscribeDraws();
    };
  }, []);

  return (
    <section className="page-panel board-panel">
      <div className="section-heading">
        <p className="eyebrow">전체 나눔 보기</p>
        <h1>감사 나눔 게시판</h1>
      </div>

      {loading && <p className="state-text">불러오는 중입니다.</p>}
      {error && <p className="form-message error-text">{error}</p>}
      {!loading && !error && shares.length === 0 && (
        <p className="state-text">아직 작성된 감사 나눔이 없습니다.</p>
      )}

      <div className="share-list">
        {shares.map((share) => {
          const isWinner = drawnShareIds.has(share.id);

          return (
            <article className={`share-card ${isWinner ? "is-winner" : ""}`} key={share.id}>
              {isWinner && (
                <span className="winner-confetti" aria-hidden="true">
                  🎊
                </span>
              )}
              <div className="share-meta">
                <strong>{share.groupName}</strong>
                {share.name && <span>{share.name}</span>}
                {isWinner && (
                  <span className="winner-badge" aria-label="당첨된 나눔">
                    🎉 당첨 ✨
                  </span>
                )}
                <time>
                  {share.createdAt
                    ? formatKoreaDateTime(share.createdAt.toDate())
                    : "방금 전"}
                </time>
              </div>
              <p>{share.content}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function DrawPage({
  selectedDate,
  selectedDateKey,
}: {
  selectedDate: Date;
  selectedDateKey: string;
}) {
  const adminPassword =
    import.meta.env.VITE_ADMIN_PASSWORD ??
    (import.meta.env.DEV ? "change-this-password" : "");
  const [isUnlocked, setIsUnlocked] = useState(
    () => window.sessionStorage.getItem(ADMIN_SESSION_KEY) === "true",
  );

  if (!isUnlocked) {
    return (
      <AdminGate
        hasPassword={Boolean(adminPassword)}
        onUnlock={(password) => {
          if (password === adminPassword && adminPassword) {
            window.sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
            setIsUnlocked(true);
            return true;
          }

          return false;
        }}
      />
    );
  }

  return <DrawManager selectedDate={selectedDate} selectedDateKey={selectedDateKey} />;
}

function AdminGate({
  hasPassword,
  onUnlock,
}: {
  hasPassword: boolean;
  onUnlock: (password: string) => boolean;
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!hasPassword) {
      setError(".env.local에 VITE_ADMIN_PASSWORD를 설정해주세요.");
      return;
    }

    if (!onUnlock(password)) {
      setError("비밀번호가 맞지 않습니다.");
      return;
    }
  };

  return (
    <section className="page-panel auth-panel">
      <div className="section-heading">
        <p className="eyebrow">관리자</p>
        <h1>추첨하기</h1>
      </div>

      <form className="share-form narrow-form" onSubmit={handleSubmit}>
        <label>
          <span>관리자 비밀번호</span>
          <input
            type="password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setError("");
            }}
          />
        </label>
        {error && <p className="form-message error-text">{error}</p>}
        <button className="primary-button" type="submit">
          들어가기
        </button>
      </form>
    </section>
  );
}

function DrawManager({
  selectedDate,
  selectedDateKey,
}: {
  selectedDate: Date;
  selectedDateKey: string;
}) {
  const [shares, setShares] = useState<Share[]>([]);
  const [draws, setDraws] = useState<Draw[]>([]);
  const [latestWinner, setLatestWinner] = useState<Share | null>(null);
  const [loading, setLoading] = useState(true);
  const [drawing, setDrawing] = useState(false);
  const [error, setError] = useState("");

  const shareById = useMemo(
    () => new Map(shares.map((share) => [share.id, share])),
    [shares],
  );
  const drawnIds = useMemo(
    () => new Set(draws.map((draw) => draw.shareId)),
    [draws],
  );
  const remainingShares = useMemo(
    () => shares.filter((share) => !drawnIds.has(share.id)),
    [drawnIds, shares],
  );

  const loadDrawData = async () => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    setError("");
    setLoading(true);

    try {
      const [dateShares, dateDraws] = await Promise.all([
        getSharesByDate(selectedDateKey),
        getDrawsByDate(selectedDateKey),
      ]);
      setShares(dateShares);
      setDraws(dateDraws);
    } catch (loadError) {
      setError(getFirestoreErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLatestWinner(null);
    void loadDrawData();
  }, [selectedDateKey]);

  const handleDraw = async () => {
    if (remainingShares.length === 0) {
      return;
    }

    const winner = remainingShares[Math.floor(Math.random() * remainingShares.length)];
    setDrawing(true);
    setError("");

    try {
      await createDraw(winner.id, selectedDateKey);
      setLatestWinner(winner);
      await loadDrawData();
    } catch (drawError) {
      setError(getFirestoreErrorMessage(drawError));
    } finally {
      setDrawing(false);
    }
  };

  return (
    <section className="page-panel draw-panel">
      <div className="section-heading draw-heading">
        <div>
          <p className="eyebrow">추첨하기</p>
          <h1>감사 나눔 추첨</h1>
        </div>
        <p className="date-pill">{formatKoreaDate(selectedDate)}</p>
      </div>

      <div className="draw-stats" aria-label="추첨 현황">
        <div>
          <span>선택 날짜 글</span>
          <strong>{shares.length}</strong>
        </div>
        <div>
          <span>당첨</span>
          <strong>{draws.length}</strong>
        </div>
        <div>
          <span>남은 글</span>
          <strong>{remainingShares.length}</strong>
        </div>
      </div>

      {loading && <p className="state-text">불러오는 중입니다.</p>}
      {error && <p className="form-message error-text">{error}</p>}

      {latestWinner && (
        <article className="winner-card">
          <p className="eyebrow">당첨</p>
          <h2>
            {latestWinner.groupName} · {latestWinner.name}
          </h2>
          <p>{latestWinner.content}</p>
        </article>
      )}

      <button
        className="draw-button"
        type="button"
        onClick={handleDraw}
        disabled={loading || drawing || remainingShares.length === 0 || !isFirebaseConfigured}
      >
        {drawing ? "추첨 중" : draws.length > 0 ? "추가 추첨하기" : "추첨하기"}
      </button>

      {!loading && remainingShares.length === 0 && shares.length > 0 && (
        <p className="state-text">선택한 날짜의 모든 글이 추첨되었습니다.</p>
      )}
      {!loading && shares.length === 0 && (
        <p className="state-text">선택한 날짜에 작성된 감사 나눔이 아직 없습니다.</p>
      )}

      {draws.length > 0 && (
        <div className="draw-history">
          <h2>당첨 기록</h2>
          <div className="share-list compact-list">
            {draws.map((draw, index) => {
              const share = shareById.get(draw.shareId);

              return (
                <article className="share-card" key={draw.id}>
                  <div className="share-meta">
                    <strong>{index + 1}번째</strong>
                    <span>{share ? `${share.groupName} · ${share.name}` : "삭제된 글"}</span>
                    <time>
                      {draw.drawnAt ? formatKoreaDateTime(draw.drawnAt.toDate()) : "방금 전"}
                    </time>
                  </div>
                  {share && <p>{share.content}</p>}
                </article>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

export default App;
