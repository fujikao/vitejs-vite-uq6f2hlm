import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

type Theme = {
  name: string;
  description: string;
  hue: number;
  hueWidth: number;
  lightness: number;
  saturation: number;
  mood: string;
};

type HistoryItem = {
  theme: string;
  colors: string[];
  rating: "GOOD" | "NORMAL" | "BAD";
  points: number;
};

const PALETTE = [
  "#F2A7B5", "#F4C7A1", "#F5E6A8", "#B8D7A8", "#98CDBD", "#A5D5E8",
  "#AFC2E8", "#C4B3E5", "#DDB4D3", "#D99EAD", "#E8C4B2", "#C6D3B5",
  "#E8D9C7", "#B9C7CC", "#9FB4D0", "#E7B5A0", "#D6C09E", "#B8D3CA",
  "#F1C9CE", "#D0E2D2", "#D4D8ED", "#EED3A8", "#B9A8A2", "#A7C2B5",
  "#F0B98D", "#D5B0A7", "#B5C6DD", "#C9D5A6", "#E4BBD0", "#D2BFE5",
  "#A8D1D1", "#E5D2B4", "#C8C8C8", "#98AAB5", "#D4A4A4", "#A3B99F",
];

const THEMES: Theme[] = [
  { name: "春らしい配色", description: "やわらかく、花が咲くような春の色を選ぼう。", hue: 35, hueWidth: 75, lightness: 76, saturation: 48, mood: "明るくやさしい" },
  { name: "夏らしい配色", description: "太陽や海を感じる、明るく爽やかな色を選ぼう。", hue: 190, hueWidth: 85, lightness: 62, saturation: 62, mood: "鮮やかで爽やか" },
  { name: "秋らしい配色", description: "紅葉や木の実を思わせる、深みのある色を選ぼう。", hue: 35, hueWidth: 48, lightness: 48, saturation: 52, mood: "あたたかく落ち着いた" },
  { name: "冬らしい配色", description: "雪や澄んだ空気を感じる、静かな色を選ぼう。", hue: 215, hueWidth: 75, lightness: 70, saturation: 28, mood: "澄んでいて静かな" },
  { name: "かわいい配色", description: "思わず笑顔になる、甘くやさしい色を選ぼう。", hue: 335, hueWidth: 65, lightness: 78, saturation: 45, mood: "甘くてやさしい" },
  { name: "さわやかな配色", description: "風が通り抜けるような、軽やかな色を選ぼう。", hue: 175, hueWidth: 65, lightness: 70, saturation: 38, mood: "軽やかで清潔感のある" },
  { name: "高級感のある配色", description: "上質さを感じる、深みと落ち着きのある色を選ぼう。", hue: 42, hueWidth: 65, lightness: 38, saturation: 38, mood: "深く上品な" },
  { name: "ナチュラルな配色", description: "植物や土のような、自然になじむ色を選ぼう。", hue: 95, hueWidth: 75, lightness: 58, saturation: 32, mood: "自然で穏やかな" },
  { name: "元気な配色", description: "見ているだけで元気になる、明るい色を選ぼう。", hue: 45, hueWidth: 95, lightness: 62, saturation: 78, mood: "明るくエネルギッシュな" },
  { name: "落ち着いた配色", description: "ゆったりした気分になれる、控えめな色を選ぼう。", hue: 205, hueWidth: 95, lightness: 48, saturation: 24, mood: "穏やかで控えめな" },
];

function hexToHsl(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let h = 0;
  const l = (max + min) / 2;
  let s = 0;

  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: s * 100, l: l * 100 };
}

function hueDistance(a: number, b: number) {
  const diff = Math.abs(a - b) % 360;
  return Math.min(diff, 360 - diff);
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function evaluatePalette(colors: string[], theme: Theme) {
  const hsl = colors.map(hexToHsl);
  const hueScore = hsl.reduce((sum, color) => {
    const distance = hueDistance(color.h, theme.hue);
    const normalized = clamp(1 - distance / Math.max(theme.hueWidth, 1), 0, 1);
    return sum + normalized;
  }, 0) / hsl.length;

  const lightnessDistance = hsl.reduce((sum, color) => sum + Math.abs(color.l - theme.lightness), 0) / hsl.length;
  const saturationDistance = hsl.reduce((sum, color) => sum + Math.abs(color.s - theme.saturation), 0) / hsl.length;
  const lightnessScore = clamp(1 - lightnessDistance / 55, 0, 1);
  const saturationScore = clamp(1 - saturationDistance / 75, 0, 1);

  // 安全ガードを追加：3色揃っている場合のみ色相の広がりを計算する
  let harmonyScore = 0.5;
  if (hsl.length >= 3) {
    const hueSpread = hueDistance(hsl[0].h, hsl[1].h) +
      hueDistance(hsl[1].h, hsl[2].h) +
      hueDistance(hsl[2].h, hsl[0].h);
    harmonyScore = clamp(1 - Math.abs(hueSpread - 150) / 300, 0, 1);
  }

  const score = Math.round(
    (hueScore * 0.45 + lightnessScore * 0.25 + saturationScore * 0.20 + harmonyScore * 0.10) * 100
  );

  if (score >= 68) return { rating: "GOOD" as const, points: 10, score };
  if (score >= 38) return { rating: "NORMAL" as const, points: 5, score };
  return { rating: "BAD" as const, points: 1, score };
}

function App() {
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [themeIndex, setThemeIndex] = useState(0);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [lastResult, setLastResult] = useState<HistoryItem | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [copied, setCopied] = useState("");
  const [favorites, setFavorites] = useState<string[][]>([]);
  const timerRef = useRef<number | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const suppressClickRef = useRef(false);

  const theme = THEMES[themeIndex];
  const counts = useMemo(() => ({
    good: history.filter((item) => item.rating === "GOOD").length,
    normal: history.filter((item) => item.rating === "NORMAL").length,
    bad: history.filter((item) => item.rating === "BAD").length,
  }), [history]);

  useEffect(() => {
    if (!gameStarted || gameOver) return;
    timerRef.current = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          setGameOver(true);
          setGameStarted(false);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
    };
  }, [gameStarted, gameOver]);

  useEffect(() => {
    if (gameOver && timerRef.current !== null) {
      window.clearInterval(timerRef.current);
    }
  }, [gameOver]);

  const startGame = () => {
    setTimeLeft(60);
    setScore(0);
    setSelected([]);
    setHistory([]);
    setLastResult(null);
    setThemeIndex(Math.floor(Math.random() * THEMES.length));
    setGameOver(false);
    setGameStarted(true);
  };

  const toggleColor = (color: string) => {
    if (!gameStarted || gameOver || lastResult || timeLeft <= 0) return;
    setSelected((current) => {
      if (current.includes(color)) return current.filter((item) => item !== color);
      if (current.length >= 3) return current;
      return [...current, color];
    });
  };

  const submitPalette = () => {
    if (selected.length !== 3 || !gameStarted || lastResult) return;
    const result = evaluatePalette(selected, theme);
    const item: HistoryItem = {
      theme: theme.name,
      colors: [...selected],
      rating: result.rating,
      points: result.points,
    };
    setScore((current) => current + result.points);
    setHistory((current) => [...current, item]);
    setLastResult(item);
  };

  const nextRound = () => {
    setSelected([]);
    setLastResult(null);
    setThemeIndex((current) => {
      if (THEMES.length <= 1) return 0;
      let next = Math.floor(Math.random() * THEMES.length);
      while (next === current) next = Math.floor(Math.random() * THEMES.length);
      return next;
    });
  };

  const copyHex = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(value);
      window.setTimeout(() => setCopied(""), 1400);
    } catch {
      setCopied("コピーできませんでした");
      window.setTimeout(() => setCopied(""), 1800);
    }
  };

  const copyAll = () => copyHex(selected.join(", "));

  const saveFavorite = () => {
    if (selected.length === 3) {
      setFavorites((current) => [...current, [...selected]]);
    }
  };

  const ratingLabel = lastResult?.rating === "GOOD"
    ? "すばらしい配色！"
    : lastResult?.rating === "NORMAL"
      ? "いい感じ！"
      : "もう一度チャレンジ！";

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">●</span>
          <span>COLOR FLICK</span>
        </div>
        <span className="top-note">FIND YOUR COLOR</span>
      </header>

      <section className="game-wrap">
        <div className="intro">
          <p className="eyebrow">60 SECONDS COLOR GAME</p>
          <h1>色を選んで、センスを磨こう。</h1>
          <p className="intro-copy">お題にぴったりの3色を選んで、ハイスコアを目指そう！</p>
        </div>

        <section className="status-grid" aria-label="ゲーム状況">
          <div className={`status-card timer-card ${timeLeft <= 10 ? "urgent" : ""}`}>
            <span className="status-label">TIME LEFT</span>
            <strong>{`00:${String(timeLeft).padStart(2, "0")}`}</strong>
          </div>
          <div className="status-card score-card">
            <span className="status-label">TOTAL SCORE</span>
            <strong>{score}<small> pt</small></strong>
          </div>
          <div className="status-card round-card">
            <span className="status-label">ROUNDS</span>
            <strong>{history.length}<small> 回</small></strong>
          </div>
        </section>

        {!gameStarted && !gameOver && (
          <section className="welcome-panel">
            <div className="welcome-icon">✦</div>
            <h2>準備はいい？</h2>
            <p>60秒間で、何点獲得できるか挑戦しよう。<br />色を3つ選ぶと自動で評価されるよ。</p>
            <button className="primary-button" onClick={startGame}>ゲームスタート <span>→</span></button>
          </section>
        )}

        {gameOver && (
          <section className="result-panel">
            <p className="eyebrow">TIME'S UP!</p>
            <h2>おつかれさま！</h2>
            <div className="final-score">{score}<span>pt</span></div>
            <p className="rank-label">
              {score >= 100 ? "COLOR MASTER" : score >= 60 ? "COLOR ARTIST" : score >= 30 ? "COLOR LOVER" : "COLOR BEGINNER"}
            </p>
            <div className="result-counts">
              <span>GOOD <b>{counts.good}</b></span>
              <span>NORMAL <b>{counts.normal}</b></span>
              <span>BAD <b>{counts.bad}</b></span>
            </div>
            <button className="primary-button" onClick={startGame}>もう一度遊ぶ <span>↻</span></button>
          </section>
        )}

        {gameStarted && (
          <>
            <section className="theme-card">
              <div>
                <span className="status-label">TODAY'S THEME</span>
                <h2>{theme.name}</h2>
                <p>{theme.description}</p>
              </div>
              <span className="theme-sparkle">✦</span>
            </section>

            <section className="selection-section">
              <div className="section-heading">
                <div>
                  <span className="status-label">YOUR PALETTE</span>
                  <h2>好きな3色を選ぼう</h2>
                </div>
                <span className="selection-count">{selected.length} <i>/ 3</i></span>
              </div>
              <div className="selected-colors">
                {[0, 1, 2].map((index) => {
                  const color = selected[index];
                  return (
                    <div className={`selected-slot ${color ? "has-color" : ""}`} key={index}>
                      {color ? (
                        <>
                          <button className="selected-swatch" style={{ backgroundColor: color }} onClick={() => toggleColor(color)} aria-label={`${color}を選択解除`} />
                          <button className="hex-copy" onClick={() => copyHex(color)}>{copied === color ? "COPIED!" : color.toUpperCase()} <span>▢</span></button>
                        </>
                      ) : <span className="empty-slot">{index + 1}</span>}
                    </div>
                  );
                })}
              </div>
              <div className="palette-heading">
                <h3>COLOR PALETTE <span>36 COLORS</span></h3>
                <p>色をタップして選択。もう一度タップすると解除できます。</p>
              </div>
              <div
                className="color-grid"
                onTouchStart={(event) => {
                  const touch = event.touches[0];
                  touchStartRef.current = { x: touch.clientX, y: touch.clientY };
                  suppressClickRef.current = false;
                }}
                onTouchEnd={(event) => {
                  const start = touchStartRef.current;
                  const touch = event.changedTouches[0];
                  if (start) {
                    const distance = Math.hypot(touch.clientX - start.x, touch.clientY - start.y);
                    if (distance > 18) {
                      const target = document
                        .elementFromPoint(touch.clientX, touch.clientY)
                        ?.closest<HTMLButtonElement>("[data-color]");
                      const swipedColor = target?.dataset.color;
                      if (swipedColor) {
                        suppressClickRef.current = true;
                        toggleColor(swipedColor);
                        window.setTimeout(() => {
                          suppressClickRef.current = false;
                        }, 350);
                      }
                    }
                  }
                  touchStartRef.current = null;
                }}
              >
                {PALETTE.map((color, index) => {
                  const isSelected = selected.includes(color);
                  return (
                    <button
                      key={color}
                      className={`color-tile ${isSelected ? "is-selected" : ""}`}
                      style={{ backgroundColor: color }}
                      onClick={() => { if (!suppressClickRef.current) toggleColor(color); }}
                      data-color={color}
                      aria-label={`色 ${index + 1} ${color}`}
                      aria-pressed={isSelected}
                      title={color}
                    >
                      {isSelected && <span className="tile-check">✓</span>}
                    </button>
                  );
                })}
              </div>
              <div className="action-row">
                <button className="secondary-button" onClick={() => setSelected([])} disabled={selected.length === 0}>選び直す</button>
                <button className="primary-button evaluate-button" onClick={submitPalette} disabled={selected.length !== 3}>この3色に決定 <span>→</span></button>
              </div>
            </section>

            {lastResult && (
              <section className={`feedback-panel ${lastResult.rating.toLowerCase()}`}>
                <div className="feedback-top">
                  <span className="feedback-rating">{lastResult.rating}</span>
                  <span className="feedback-points">+{lastResult.points} pt</span>
                </div>
                <h2>{ratingLabel}</h2>
                <p>「{lastResult.theme}」のお題での評価だよ。</p>
                <div className="feedback-colors">
                  {lastResult.colors.map((color) => (
                    <button key={color} style={{ backgroundColor: color }} onClick={() => copyHex(color)} title={`${color}をコピー`} />
                  ))}
                </div>
                <div className="feedback-actions">
                  <button className="secondary-button" onClick={saveFavorite}>♡ お気に入りに保存</button>
                  <button className="secondary-button" onClick={copyAll}>HEXをまとめてコピー</button>
                  <button className="primary-button" onClick={nextRound}>次のお題へ →</button>
                </div>
                {copied && <span className="copy-message">{copied === "コピーできませんでした" ? copied : "HEXコードをコピーしました！"}</span>}
              </section>
            )}
          </>
        )}

        {history.length > 0 && (
          <section className="history-panel">
            <div className="section-heading">
              <div><span className="status-label">PLAY HISTORY</span><h2>今回の記録</h2></div>
              <span className="history-total">{history.length} ROUND</span>
            </div>
            <div className="history-list">
              {history.slice(-5).reverse().map((item, index) => (
                <div className="history-item" key={`${item.theme}-${history.length - index}`}>
                  <span className="history-theme">{item.theme}</span>
                  <div className="history-swatches">
                    {item.colors.map((color) => <span key={color} style={{ backgroundColor: color }} />)}
                  </div>
                  <span className={`history-rating ${item.rating.toLowerCase()}`}>{item.rating}</span>
                  <b>+{item.points}</b>
                </div>
              ))}
            </div>
          </section>
        )}

        {favorites.length > 0 && (
          <section className="history-panel favorites-panel">
            <div className="section-heading">
              <div><span className="status-label">MY COLLECTION</span><h2>お気に入り</h2></div>
              <span className="history-total">{favorites.length} PALETTES</span>
            </div>
            <div className="favorite-grid">
              {favorites.map((palette, index) => (
                <button className="favorite-item" key={`${palette.join("-")}-${index}`} onClick={() => copyHex(palette.join(", "))} title="クリックしてHEXをコピー">
                  <span className="favorite-strip">
                    {palette.map((color) => <i key={color} style={{ backgroundColor: color }} />)}
                  </span>
                  <span>PALETTE {String(index + 1).padStart(2, "0")}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        <footer className="footer-note">COLOR FLICK <span>·</span> PLAY WITH COLORS, FIND YOUR STYLE.</footer>
      </section>
    </main>
  );
}

export default App;