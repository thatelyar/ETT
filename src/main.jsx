import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createRoot } from "react-dom/client";
import { createPortal } from "react-dom";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  Award,
  BarChart3,
  BookOpen,
  BrainCircuit,
  Calculator,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Command,
  Download,
  Eye,
  Flame,
  FlaskConical,
  Gauge,
  ImagePlus,
  LayoutDashboard,
  Languages,
  LogOut,
  Menu,
  Moon,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  Sun,
  Trash2,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import {
  addCloudBacktestTrades,
  addCloudLiveTrades,
  cloudEnabled,
  loadCloudData,
  saveCloudSettings,
  saveCloudTrades,
  supabase,
} from "./supabase";
import {
  DEFAULT_SESSION_CHECK,
  getDueSessionChecks,
  getNextSessionOpening,
  SESSION_DEFINITIONS,
  sessionAcknowledgementKey,
  sessionRuleSignature,
} from "./sessionGate.mjs";
import { nextBacktestTradeId, nextLiveTradeId } from "./tradeJournal.mjs";
import { backtestImages, tradePreviewImage } from "./backtestImages.mjs";
import { executedTrades, isNoEntry } from "./backtestEntries.mjs";
import { mergeBacktestBackup, parseBacktestBackup } from "./backtestBackup.mjs";
import { createLiveBackup, mergeLiveBackup, parseLiveBackup, reconcileLiveTrades } from "./liveBackup.mjs";
import { translateUI } from "./translation.mjs";
import { createJournalViews } from "./journalViews.jsx";
import PhotoLightbox from "./PhotoLightbox.jsx";
import "./styles.css";
import "./theme.css";
import "./responsive.css";
import "./premium.css";

const faDigits = (n) => String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);
const money = (n) => {
  const value = Number(n) || 0;
  return `${value >= 0 ? "+" : "-"}$${Math.abs(value).toLocaleString("en-US")}`;
};
const monthNames = [
  "ژانویه",
  "فوریه",
  "مارس",
  "آوریل",
  "مه",
  "ژوئن",
  "ژوئیه",
  "اوت",
  "سپتامبر",
  "اکتبر",
  "نوامبر",
  "دسامبر",
];
const week = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function getJournalStreak(trades) {
  const dates = [...new Set(trades.map((trade) => trade.date))]
    .filter(Boolean)
    .sort((a, b) => b.localeCompare(a));
  if (!dates.length) return 0;
  let streak = 1;
  for (let index = 1; index < dates.length; index += 1) {
    const newer = new Date(`${dates[index - 1]}T12:00:00`);
    const older = new Date(`${dates[index]}T12:00:00`);
    const gap = Math.round((newer - older) / 86400000);
    if (gap <= 3) streak += 1;
    else break;
  }
  return streak;
}

function getMaxDrawdown(points) {
  let peak = Number(points[0]?.value || 0);
  let maxDrawdown = 0;
  points.forEach((point) => {
    const value = Number(point.value || 0);
    peak = Math.max(peak, value);
    maxDrawdown = Math.max(maxDrawdown, peak - value);
  });
  return maxDrawdown;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = url;
  });
}

async function prepareTradeImage(file, { maxSide = 1600, quality = 0.78 } = {}) {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await loadImage(objectUrl);
    const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (!blob) throw new Error("Image conversion failed");
    return await fileToDataUrl(blob);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

const demoTrades = [
  {
    id: 1,
    date: "2026-09-01",
    market: "XAU/USD",
    side: "Long",
    entry: "3488.2",
    exit: "3501.4",
    pnl: 264,
    risk: 100,
    setup: "شکست مقاومت",
    emotion: "متمرکز",
    notes: "ورود بعد از پولبک و تأیید حجم. طبق پلن خارج شدم.",
    image: "",
  },
  {
    id: 2,
    date: "2026-09-03",
    market: "BTC/USDT",
    side: "Short",
    entry: "109400",
    exit: "110050",
    pnl: -130,
    risk: 100,
    setup: "بازگشت به میانگین",
    emotion: "عجول",
    notes: "زودتر از تأیید وارد شدم. نیاز به صبر بیشتر داشتم.",
    image: "",
  },
  {
    id: 3,
    date: "2026-09-06",
    market: "EUR/USD",
    side: "Long",
    entry: "1.164",
    exit: "1.169",
    pnl: 185,
    risk: 80,
    setup: "پولبک روند",
    emotion: "آرام",
    notes: "ستاپ تمیز در سشن لندن.",
    image: "",
  },
  {
    id: 4,
    date: "2026-09-09",
    market: "NAS100",
    side: "Long",
    entry: "23540",
    exit: "23618",
    pnl: 312,
    risk: 120,
    setup: "شکست محدوده",
    emotion: "متمرکز",
    notes: "مدیریت پوزیشن عالی بود.",
    image: "",
  },
  {
    id: 5,
    date: "2026-09-11",
    market: "XAU/USD",
    side: "Short",
    entry: "3520",
    exit: "3527",
    pnl: -95,
    risk: 100,
    setup: "شکست کاذب",
    emotion: "خسته",
    notes: "خارج از ساعت معاملاتی؛ تکرار نشود.",
    image: "",
  },
  {
    id: 6,
    date: "2026-09-15",
    market: "BTC/USDT",
    side: "Long",
    entry: "112000",
    exit: "114100",
    pnl: 420,
    risk: 150,
    setup: "پولبک روند",
    emotion: "مطمئن",
    notes: "بهترین معامله ماه تا اینجا.",
    image: "",
  },
];

function Spark({ down = false }) {
  return (
    <svg viewBox="0 0 140 44" className={"spark " + (down ? "down" : "")}>
      <path
        d={
          down
            ? "M2 10 C18 8 22 30 38 23 S58 38 72 28 S91 36 104 25 S124 32 138 38"
            : "M2 36 C17 39 23 20 38 27 S58 10 73 17 S91 5 106 13 S124 4 138 6"
        }
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        d={
          down
            ? "M2 10 C18 8 22 30 38 23 S58 38 72 28 S91 36 104 25 S124 32 138 38 L138 44 L2 44Z"
            : "M2 36 C17 39 23 20 38 27 S58 10 73 17 S91 5 106 13 S124 4 138 6 L138 44 L2 44Z"
        }
        fill="currentColor"
        opacity=".08"
      />
    </svg>
  );
}

const { BacktestPage, JournalPage, AnalyticsPage } = createJournalViews({
  faDigits, money, monthNames, getMaxDrawdown, PageTitle, PanelHead, Calendar, Stat,
});

function App() {
  const appRef = useRef(null);
  const searchRef = useRef(null);
  const [theme, setTheme] = useState(
    () => localStorage.getItem("tradeflow_theme") || "dark",
  );
  const [language, setLanguage] = useState(
    () => localStorage.getItem("tradeflow_language") || "fa",
  );
  const [trades, setTrades] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("tradeflow_trades")) || demoTrades;
    } catch {
      return demoTrades;
    }
  });
  const [backtestTrades, setBacktestTrades] = useState(() => {
    if (cloudEnabled) return [];
    try {
      return JSON.parse(localStorage.getItem("tradeflow_backtest_trades")) || [];
    } catch {
      return [];
    }
  });
  const [backtestStorageError, setBacktestStorageError] = useState(false);
  const [liveStorageError, setLiveStorageError] = useState(false);
  const [liveImportBusy, setLiveImportBusy] = useState(false);
  const [liveImportStatus, setLiveImportStatus] = useState(null);
  const [backtestImportBusy, setBacktestImportBusy] = useState(false);
  const [backtestImportStatus, setBacktestImportStatus] = useState(null);
  const cloudSavePromise = useRef(Promise.resolve());
  const liveImportInProgress = useRef(false);
  const backtestImportInProgress = useRef(false);
  const [accountBalance, setAccountBalance] = useState(() =>
    Number(localStorage.getItem("tradeflow_balance") || 0),
  );
  const [view, setView] = useState("dashboard");
  const [month, setMonth] = useState(new Date(2026, 8, 1));
  const [backtestMonth, setBacktestMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [modal, setModal] = useState(null);
  const [daySheet, setDaySheet] = useState(null);
  const [backtestModal, setBacktestModal] = useState(null);
  const [backtestDaySheet, setBacktestDaySheet] = useState(null);
  const [riskCalculatorOpen, setRiskCalculatorOpen] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem("tradeflow_sidebar_collapsed") === "true",
  );
  const [sessionClock, setSessionClock] = useState(() => Date.now());
  const [, refreshSessionGate] = useState(0);
  const [query, setQuery] = useState("");
  const [backtestQuery, setBacktestQuery] = useState("");
  const [session, setSession] = useState(null);
  const [cloudReady, setCloudReady] = useState(!cloudEnabled);
  const [cloudState, setCloudState] = useState(cloudEnabled ? "loading" : "local");
  const [profile, setProfile] = useState(() => {
    try {
      return (
        JSON.parse(localStorage.getItem("tradeflow_profile")) || {
          name: "الیار احمدی",
          currency: "USD",
        }
      );
    } catch {
      return { name: "الیار احمدی", currency: "USD" };
    }
  });
  const [plan, setPlan] = useState(() => {
    try {
      return (
        JSON.parse(localStorage.getItem("tradeflow_plan")) || {
          maxRisk: 1,
          dailyLoss: 3,
          hours: "۱۱:۰۰ تا ۱۷:۰۰",
          rules: [
            "فقط ورود بعد از تأیید",
            "حد ضرر قبل از ورود مشخص باشد",
            "بعد از دو باخت معامله متوقف شود",
          ],
        }
      );
    } catch {
      return { maxRisk: 1, dailyLoss: 3, hours: "۱۱:۰۰ تا ۱۷:۰۰", rules: [] };
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem("tradeflow_trades", JSON.stringify(trades));
      setLiveStorageError(false);
    } catch (error) {
      // Large screenshots can exceed Safari's small localStorage quota. Cloud
      // sync still keeps the image; the lightweight local copy prevents a crash.
      console.warn("Local trade cache exceeded its quota", error);
      if (!cloudEnabled) setLiveStorageError(true);
      try {
        localStorage.setItem(
          "tradeflow_trades",
          JSON.stringify(trades.map((trade) => ({ ...trade, image: "", images: [] }))),
        );
      } catch (fallbackError) {
        console.warn("Unable to update the local trade cache", fallbackError);
      }
    }
  }, [trades]);
  useEffect(() => {
    if (cloudEnabled && (!cloudReady || !session?.user?.id)) return;
    const key = cloudEnabled ? `tradeflow_backtest_trades_${session.user.id}` : "tradeflow_backtest_trades";
    try {
      localStorage.setItem(key, JSON.stringify(backtestTrades));
      setBacktestStorageError(false);
    } catch (error) {
      console.warn("Local backtest cache exceeded its quota", error);
      if (cloudEnabled) {
        try {
          localStorage.setItem(key, JSON.stringify(backtestTrades.map((trade) => ({ ...trade, image: "", images: [] }))));
        } catch (fallbackError) {
          console.warn("Unable to update the local backtest cache", fallbackError);
        }
      } else {
        setBacktestStorageError(true);
      }
    }
  }, [backtestTrades, cloudReady, session?.user?.id]);
  useEffect(
    () => localStorage.setItem("tradeflow_balance", String(accountBalance)),
    [accountBalance],
  );
  useEffect(
    () => localStorage.setItem("tradeflow_profile", JSON.stringify(profile)),
    [profile],
  );
  useEffect(
    () => localStorage.setItem("tradeflow_plan", JSON.stringify(plan)),
    [plan],
  );
  useEffect(() => {
    localStorage.setItem("tradeflow_theme", theme);
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  useEffect(
    () => localStorage.setItem("tradeflow_language", language),
    [language],
  );
  useEffect(() => {
    const handleShortcut = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "b") {
        event.preventDefault();
        setSidebarCollapsed((current) => !current);
      }
      if (event.key === "Escape") setRiskCalculatorOpen(false);
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);
  useEffect(() => {
    localStorage.setItem(
      "tradeflow_sidebar_collapsed",
      String(sidebarCollapsed),
    );
  }, [sidebarCollapsed]);
  useEffect(() => {
    const refresh = () => setSessionClock(Date.now());
    const timer = window.setInterval(refresh, 15000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  useEffect(() => {
    if (!cloudEnabled) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) setCloudReady(false);
    });
    return () => data.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (!cloudEnabled || !session?.user?.id) return;
    let active = true;
    setCloudState("loading");
    loadCloudData(session.user.id)
      .then(async ({ settings, trades: remoteTrades, backtestTrades: remoteBacktestTrades }) => {
        if (!active) return;
        const hasLocalTrades = localStorage.getItem("tradeflow_trades") !== null;
        const hasRemoteData = Boolean(settings || remoteTrades.length || remoteBacktestTrades.length);
        if (hasRemoteData) {
          setTrades(remoteTrades);
          setBacktestTrades(remoteBacktestTrades);
          if (settings) {
            setProfile(settings.profile);
            setAccountBalance(Number(settings.balance || 0));
            setPlan(settings.plan);
          }
        } else if (hasLocalTrades) {
          setBacktestTrades([]);
          await Promise.all([
            saveCloudSettings(session.user.id, { profile, balance: accountBalance, plan }),
            saveCloudTrades(session.user.id, trades),
          ]);
        } else {
          setTrades([]);
          setBacktestTrades([]);
          await saveCloudSettings(session.user.id, { profile, balance: accountBalance, plan });
        }
        if (active) {
          localStorage.setItem("tradeflow_cloud_owner", session.user.id);
          setCloudReady(true);
          setCloudState("synced");
        }
      })
      .catch((error) => {
        console.error(error);
        if (active) setCloudState("error");
      });
    return () => { active = false; };
    // Initial cloud hydration must only run when the signed-in user changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);
  useEffect(() => {
    if (!cloudEnabled || !cloudReady || !session?.user?.id || backtestImportBusy || liveImportBusy) return;
    setCloudState("saving");
    const timer = window.setTimeout(() => {
      if (backtestImportInProgress.current || liveImportInProgress.current) return;
      cloudSavePromise.current = Promise.all([
        saveCloudSettings(session.user.id, { profile, balance: accountBalance, plan }),
        saveCloudTrades(session.user.id, trades),
        saveCloudTrades(session.user.id, backtestTrades, "backtest"),
      ])
        .then(() => setCloudState("synced"))
        .catch((error) => {
          console.error(error);
          setCloudState("error");
        });
    }, 700);
    return () => window.clearTimeout(timer);
  }, [trades, backtestTrades, accountBalance, profile, plan, cloudReady, session?.user?.id, backtestImportBusy, liveImportBusy]);
  useLayoutEffect(() => {
    if (language === "en") translateUI(appRef.current);
  }, [
    language,
    view,
    modal,
    daySheet,
    backtestModal,
    backtestDaySheet,
    trades,
    backtestTrades,
    plan,
    profile,
    month,
    backtestMonth,
    accountBalance,
  ]);
  const monthEntries = useMemo(
    () =>
      trades.filter((t) => {
        const d = new Date(t.date + "T12:00");
        return (
          d.getMonth() === month.getMonth() &&
          d.getFullYear() === month.getFullYear()
        );
      }),
    [trades, month],
  );
  const monthTrades = useMemo(() => executedTrades(monthEntries), [monthEntries]);
  const total = monthTrades.reduce((s, t) => s + Number(t.pnl || 0), 0),
    wins = monthTrades.filter((t) => Number(t.pnl) > 0),
    losses = monthTrades.filter((t) => Number(t.pnl) < 0);
  const winrate = monthTrades.length
    ? Math.round((wins.length / monthTrades.length) * 100)
    : 0;
  const grossProfit = wins.reduce((s, t) => s + Number(t.pnl), 0),
    grossLoss = Math.abs(losses.reduce((s, t) => s + Number(t.pnl), 0));
  const profitFactor = grossLoss
    ? grossProfit / grossLoss
    : grossProfit
      ? grossProfit
      : 0;
  const allTimePnl = executedTrades(trades).reduce((sum, trade) => sum + Number(trade.pnl || 0), 0);
  const currentBalance = accountBalance + allTimePnl;
  const equity = useMemo(() => {
    const monthStart = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-01`;
    const previousPnl = trades
      .filter((trade) => trade.date < monthStart && !isNoEntry(trade))
      .reduce((sum, trade) => sum + Number(trade.pnl || 0), 0);
    let v = accountBalance + previousPnl;
    return [
      { name: "شروع", value: v },
      ...[...monthTrades]
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((t) => ({
          name: faDigits(+t.date.slice(-2)),
          value: (v += Number(t.pnl)),
        })),
    ];
  }, [monthTrades, accountBalance, trades, month]);
  const journalStreak = useMemo(() => getJournalStreak(executedTrades(trades)), [trades]);
  const maxDrawdown = useMemo(() => getMaxDrawdown(equity), [equity]);
  const expectancy = monthTrades.length ? total / monthTrades.length : 0;
  const averageRisk = monthTrades.length
    ? monthTrades.reduce((sum, trade) => sum + Math.abs(Number(trade.risk || 0)), 0) /
      monthTrades.length
    : 0;
  const realizedRR = averageRisk ? expectancy / averageRisk : 0;
  const edgeScore = clamp(
    Math.round(
      winrate * 0.45 +
        Math.min(profitFactor, 3) * 14 +
        Math.min(journalStreak, 10) * 1.3,
    ),
    0,
    99,
  );
  const smartInsight = useMemo(() => {
    if (!monthTrades.length) {
      return {
        eyebrow: "کوچ هوشمند",
        title: "اولین معامله این ماه را ثبت کن",
        text: "بعد از ثبت معامله، الگوهای عملکرد و نقاط قوتت اینجا نمایش داده می‌شوند.",
      };
    }
    const groups = monthTrades.reduce((result, trade) => {
      const key = trade.setup || trade.market || "بدون ستاپ";
      result[key] ||= { pnl: 0, wins: 0, count: 0 };
      result[key].pnl += Number(trade.pnl || 0);
      result[key].wins += Number(trade.pnl || 0) > 0 ? 1 : 0;
      result[key].count += 1;
      return result;
    }, {});
    const [name, metric] = Object.entries(groups).sort(
      (a, b) => b[1].pnl - a[1].pnl,
    )[0];
    return {
      eyebrow: "کوچ هوشمند",
      title: `${name} لبهٔ معاملاتی این ماه توست`,
      text: `${faDigits(metric.count)} معامله با نرخ برد ${faDigits(Math.round((metric.wins / metric.count) * 100))}٪ و نتیجهٔ ${money(metric.pnl)} ثبت شده است.`,
    };
  }, [monthTrades]);
  function save(data) {
    const entry = { ...data, images: backtestImages(data), image: "", ...(isNoEntry(data) ? { entry: "", exit: "", pnl: 0, risk: "", noEntryReason: data.noEntryReason?.trim() || "" } : { status: "executed", noEntryReason: "" }) };
    setTrades((x) =>
      data.id
        ? x.map((t) => (t.id === data.id ? entry : t))
        : [...x, { ...entry, id: nextLiveTradeId(x) }],
    );
    setModal(null);
  }
  function newTrade(date) {
    setModal({
      date,
      market: "XAU/USD",
      side: "Long",
      entry: "",
      exit: "",
      pnl: "",
      risk: "",
      setup: "",
      emotion: "متمرکز",
      notes: "",
      image: "",
      images: [],
      status: "executed",
      noEntryReason: "",
    });
  }
  function openDay(date, dayTrades = []) {
    if (dayTrades.length) setDaySheet({ date });
    else newTrade(date);
  }
  function downloadLiveBackup() {
    try {
      const blob = new Blob([JSON.stringify(createLiveBackup(trades, accountBalance))], { type: "application/json" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `ETT-live-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(link.href), 60_000);
      setLiveImportStatus(null);
    } catch (error) {
      setLiveImportStatus({ type: "error", message: error.message || "ساخت فایل پشتیبان لایو ناموفق بود." });
    }
  }
  async function importLiveFile(file) {
    if (liveImportBusy) return;
    liveImportInProgress.current = true;
    setLiveImportBusy(true);
    setLiveImportStatus(null);
    try {
      const { balance, trades: imported } = parseLiveBackup(await file.text());
      if (cloudEnabled) await cloudSavePromise.current;
      if (cloudEnabled && (!cloudReady || !session?.user?.id)) {
        throw new Error("اتصال پایگاه‌داده هنوز آماده نیست؛ فایل را نگه دار و دوباره تلاش کن.");
      }
      const existing = cloudEnabled
        ? reconcileLiveTrades(trades, (await loadCloudData(session.user.id)).trades)
        : trades;
      const { trades: merged, added, skipped } = mergeLiveBackup(existing, imported);
      const restoreBalance = existing.length === 0 && Number(accountBalance) === 0 && balance !== 0;
      let warning = "";
      if (cloudEnabled) {
        await addCloudLiveTrades(session.user.id, added);
      } else {
        try {
          localStorage.setItem("tradeflow_trades", JSON.stringify(merged));
          setLiveStorageError(false);
        } catch (error) {
          console.warn("Imported live journal exceeds local browser storage", error);
          setLiveStorageError(true);
          warning = "فضای مرورگر برای ذخیرهٔ همهٔ عکس‌ها کافی نیست. فایل بک‌آپ را نگه دار و قبل از بستن صفحه دوباره دانلود کن.";
        }
      }
      setTrades(merged);
      if (restoreBalance) {
        if (cloudEnabled) {
          try {
            await saveCloudSettings(session.user.id, { profile, balance, plan });
            setAccountBalance(balance);
          } catch (error) {
            console.error("Live balance restore failed", error);
            warning = "موقعیت‌ها بازیابی شدند، اما سرمایهٔ اولیه در پایگاه‌داده ذخیره نشد. فایل بک‌آپ را نگه دار.";
          }
        } else setAccountBalance(balance);
      }
      const shownDate = (added[0] || imported[0])?.date;
      if (shownDate) {
        const date = new Date(`${shownDate}T12:00:00`);
        setMonth(new Date(date.getFullYear(), date.getMonth(), 1));
      }
      setLiveImportStatus(warning ? { type: "warning", message: warning } : {
        type: "success",
        message: `${faDigits(added.length)} موقعیت لایو با عکس‌ها بازیابی شد${skipped ? `؛ ${faDigits(skipped)} مورد تکراری رد شد` : ""}. معاملات بک‌تست تغییر نکردند.${cloudEnabled ? " داده‌ها در پایگاه‌داده ثبت شدند." : " فایل بک‌آپ را برای انتقال بعدی نگه دار."}`,
      });
    } catch (error) {
      console.error(error);
      setLiveImportStatus({ type: "error", message: error.message || "بازیابی لایو ناموفق بود؛ فایل اصلی تغییر نکرده است." });
    } finally {
      liveImportInProgress.current = false;
      setLiveImportBusy(false);
    }
  }
  function saveBacktest(data) {
    const withImages = { ...data, images: backtestImages(data), image: "", ...(isNoEntry(data) ? { entry: "", exit: "", pnl: 0, risk: "", noEntryReason: data.noEntryReason?.trim() || "" } : { status: "executed", noEntryReason: "" }) };
    setBacktestTrades((current) => data.id
      ? current.map((trade) => trade.id === data.id ? withImages : trade)
      : [...current, { ...withImages, id: nextBacktestTradeId(current) }]);
    const date = new Date(`${data.date}T12:00:00`);
    if (!Number.isNaN(date.getTime())) setBacktestMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    setBacktestModal(null);
  }
  async function importBacktestFile(file) {
    if (backtestImportBusy) return;
    backtestImportInProgress.current = true;
    setBacktestImportBusy(true);
    setBacktestImportStatus(null);
    try {
      const { balance, trades: imported } = parseBacktestBackup(await file.text());
      if (cloudEnabled) await cloudSavePromise.current;
      const { trades: merged, added, skipped } = mergeBacktestBackup(backtestTrades, imported);
      const restoreBalance = backtestTrades.length === 0;
      if (cloudEnabled) {
        if (!cloudReady || !session?.user?.id) throw new Error("اتصال پایگاه‌داده هنوز آماده نیست؛ فایل را نگه دار و دوباره تلاش کن.");
        if (restoreBalance) await saveCloudSettings(session.user.id, {
          profile, balance: accountBalance, plan: { ...plan, backtestBalance: balance },
        });
        await addCloudBacktestTrades(session.user.id, added);
      } else {
        try {
          localStorage.setItem("tradeflow_backtest_trades", JSON.stringify(merged));
          setBacktestStorageError(false);
        } catch (error) {
          console.warn("Imported backtest exceeds local browser storage", error);
          setBacktestStorageError(true);
          setBacktestImportStatus({ type: "warning", message: "معاملات فعلاً در این صفحه دیده می‌شوند، اما فضای مرورگر برای ذخیره کافی نیست. فایل بک‌تست را نگه دار و قبل از بستن صفحه دوباره دانلود کن." });
        }
      }
      setBacktestTrades(merged);
      if (restoreBalance) setPlan((current) => ({ ...current, backtestBalance: balance }));
      setBacktestMonth(new Date(`${(added[0] || imported[0])?.date || new Date().toISOString().slice(0, 10)}T12:00:00`));
      setBacktestImportStatus((current) => current?.type === "warning" ? current : {
        type: "success",
        message: `${faDigits(added.length)} معامله با همهٔ عکس‌ها بازیابی شد${skipped ? `؛ ${faDigits(skipped)} معاملهٔ تکراری رد شد` : ""}.${cloudEnabled ? " در پایگاه‌داده ذخیره شد." : " فایل را برای انتقال بعدی نگه دار."}`,
      });
    } catch (error) {
      console.error(error);
      setBacktestImportStatus({ type: "error", message: error.message || "بازیابی بک‌تست ناموفق بود؛ فایل اصلی تغییر نکرده است." });
    } finally {
      backtestImportInProgress.current = false;
      setBacktestImportBusy(false);
    }
  }
  function newBacktestTrade(date) {
    setBacktestModal({
      date,
      market: "XAU/USD",
      side: "Long",
      entry: "",
      exit: "",
      pnl: "",
      risk: "",
      setup: "",
      emotion: "متمرکز",
      notes: "",
      image: "",
      images: [],
      status: "executed",
      noEntryReason: "",
    });
  }
  function openBacktestDay(date, dayTrades = []) {
    if (dayTrades.length) setBacktestDaySheet({ date });
    else newBacktestTrade(date);
  }
  async function logout() {
    const userId = session?.user?.id;
    await supabase?.auth.signOut();
    ["tradeflow_trades", "tradeflow_balance", "tradeflow_profile", "tradeflow_plan", "tradeflow_cloud_owner"].forEach((key) => localStorage.removeItem(key));
    if (userId) localStorage.removeItem(`tradeflow_backtest_trades_${userId}`);
    window.location.reload();
  }
  const nav = [
    ["dashboard", "نمای کلی", LayoutDashboard],
    ["calendar", "ژورنال معاملاتی", CalendarDays],
    ["backtest", "بک‌تست", FlaskConical],
    ["analytics", "تحلیل عملکرد", BarChart3],
    ["playbook", "پلن معاملاتی", BookOpen],
  ];
  const sessionOwner = session?.user?.id || "local";
  const activeSessionCheck = getDueSessionChecks(plan.sessionChecks, sessionClock)
    .find((due) => localStorage.getItem(sessionAcknowledgementKey(sessionOwner, due)) !== sessionRuleSignature(due));
  if (cloudEnabled && !session) return <AuthScreen />;
  if (cloudEnabled && !cloudReady) return <CloudLoading />;
  return (
    <div
      ref={appRef}
      key={language}
      className={`app ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}
      dir={language === "fa" ? "rtl" : "ltr"}
      lang={language}
      data-theme={theme}
    >
      <aside className={mobileNav ? "open" : ""} inert={Boolean(activeSessionCheck)}>
        <div className="brand">
          <span className="brand-mark">
            <TrendingUp />
          </span>
          <div>
            <b>ETT</b><small>Elite Trading Terminal</small>
          </div>
          <button className="closeNav" onClick={() => setMobileNav(false)}>
            <X />
          </button>
        </div>
        <nav>
          {nav.map(([id, label, I]) => (
            <button
              key={id}
              className={view === id ? "active" : ""}
              title={label}
              onClick={() => {
                setView(id);
                setMobileNav(false);
              }}
            >
              <I />
              <span className="nav-label">{label}</span>
              {id === "analytics" && <em>جدید</em>}
            </button>
          ))}
        </nav>
        <div className="nav-bottom">
          <button
            className={view === "settings" ? "active" : ""}
            title="تنظیمات"
            onClick={() => {
              setView("settings");
              setMobileNav(false);
            }}
          >
            <Settings />
            <span className="nav-label">تنظیمات</span>
          </button>
          <div
            className="profile"
            onClick={() => {
              setView("settings");
              setMobileNav(false);
            }}
            role="button"
            tabIndex="0"
          >
            <div className="avatar">
              {(profile.name || "ET")
                .split(" ")
                .slice(0, 2)
                .map((part) => part[0])
                .join("")}
            </div>
            <div>
              <b>{profile.name}</b>
              <small>حساب حرفه‌ای</small>
            </div>
            <ChevronLeft />
          </div>
        </div>
      </aside>
      <main inert={Boolean(activeSessionCheck)}>
        <header>
          <button className="hamb" onClick={() => setMobileNav(true)}>
            <Menu />
          </button>
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarCollapsed((current) => !current)}
            aria-label={sidebarCollapsed ? "باز کردن منوی کناری" : "بستن منوی کناری"}
            title={sidebarCollapsed ? "باز کردن منوی کناری (⌘B)" : "بستن منوی کناری (⌘B)"}
          >
            {sidebarCollapsed ? <PanelRightOpen /> : <PanelRightClose />}
          </button>
          <div className="search">
            <Search />
            <input
              ref={searchRef}
              placeholder={view === "backtest" ? "جستجو در بک‌تست..." : "جستجو در معاملات..."}
              value={view === "backtest" ? backtestQuery : query}
              onChange={(e) => view === "backtest" ? setBacktestQuery(e.target.value) : setQuery(e.target.value)}
            />
            <kbd>⌘ K</kbd>
          </div>
          <div className="header-actions">
            <button
              className="quick-toggle risk-tool"
              aria-label="ماشین حساب ریسک"
              title="ماشین حساب ریسک"
              onClick={() => setRiskCalculatorOpen(true)}
            >
              <Calculator />
              <span>محاسبه ریسک</span>
            </button>
            <button
              className="quick-toggle"
              aria-label="Language"
              onClick={() => setLanguage(language === "fa" ? "en" : "fa")}
            >
              <Languages />
              <span>{language === "fa" ? "EN" : "فا"}</span>
            </button>
            <button
              className="quick-toggle icon-only"
              aria-label="Theme"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            >
              {theme === "light" ? <Moon /> : <Sun />}
            </button>
            <span className={`live ${cloudState === "error" ? "offline" : ""}`}>
              <i /> {cloudState === "saving" ? "در حال ذخیره" : cloudState === "error" ? "ذخیره محلی" : "همگام و امن"}
            </span>
            <button
              className="primary add-trade-button"
              aria-label={view === "backtest" ? (language === "fa" ? "ثبت معامله بک‌تست" : "Add backtest trade") : (language === "fa" ? "ثبت معامله" : "Add trade")}
              title={view === "backtest" ? (language === "fa" ? "ثبت معامله بک‌تست" : "Add backtest trade") : (language === "fa" ? "ثبت معامله" : "Add trade")}
              onClick={() => view === "backtest"
                ? newBacktestTrade(new Date().toISOString().slice(0, 10))
                : newTrade(new Date().toISOString().slice(0, 10))}
            >
              <Plus />
            </button>
          </div>
        </header>
        <div className="content">
          <div
            className={view === "dashboard" ? "view-page" : "view-page hidden"}
          >
            <section className="welcome">
              <div>
                <p className="workspace-status"><Sparkles /> میز کار حرفه‌ای معامله‌گر</p>
                <h1>
                  {language === "fa"
                    ? `سلام ${profile.name?.split(" ")[0] || "معامله‌گر"}، امروز با پلن جلو می‌ریم.`
                    : `Hi ${profile.name?.split(" ")[0] || "Trader"}, let's trade the plan today.`}
                </h1>
                <span>
                  {new Intl.DateTimeFormat(language === "fa" ? "fa-IR" : "en-US", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  }).format(new Date())}
                  {" · "}
                  {total >= 0 ? "برآیند ماهت مثبت است؛ کیفیت اجرا را حفظ کن." : "روی کنترل ریسک و اجرای بدون هیجان تمرکز کن."}
                </span>
              </div>
              <div className="hero-actions">
                <div className="edge-pill">
                  <Gauge />
                  <span><small>Edge score</small><b>{faDigits(edgeScore)} / ۱۰۰</b></span>
                </div>
                <div className="streak">
                <span><Flame /></span>
                <div>
                  <b>{language === "fa" ? `${faDigits(journalStreak)} روز` : `${journalStreak} days`}</b>
                  <small>تداوم ژورنال‌نویسی</small>
                </div>
                </div>
              </div>
            </section>
            <section className="stats">
              <Stat
                icon={CircleDollarSign}
                label="موجودی فعلی"
                value={`$${currentBalance.toLocaleString("en-US")}`}
                secondaryLabel="سرمایه اولیه"
                secondaryValue={`$${accountBalance.toLocaleString("en-US")}`}
                delta={money(allTimePnl)}
                detail="سود و زیان کل"
              />
              <Stat
                icon={TrendingUp}
                label="سود خالص ماه"
                value={money(total)}
                delta={total >= 0 ? "سود" : "زیان"}
                detail={`از ${faDigits(monthTrades.length)} معامله`}
              />
              <Stat
                icon={Target}
                label="نرخ برد"
                value={faDigits(winrate) + "٪"}
                delta={`${faDigits(wins.length)} برد`}
                detail={`از ${faDigits(monthTrades.length)} معامله`}
              />
              <Stat
                icon={BarChart3}
                label="نسبت سود به ضرر"
                value={profitFactor.toFixed(2)}
                delta={
                  profitFactor >= 2
                    ? "عالی"
                    : profitFactor >= 1
                      ? "مثبت"
                      : "نیاز به بهبود"
                }
                detail="بر اساس معاملات این ماه"
              />
            </section>
            <section className="grid-top">
              <div className="panel chart-panel">
                <PanelHead
                  title="روند موجودی"
                  sub="بر اساس معاملات ثبت‌شده این ماه"
                />
                <div className="chart-total">
                  <b>${currentBalance.toLocaleString("en-US")}</b>
                  <span className={total >= 0 ? "green" : "red"}>
                    {money(total)}
                  </span>
                </div>
                <ResponsiveContainer width="100%" height={225}>
                  <AreaChart data={equity}>
                    <defs>
                      <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="0"
                          stopColor="#7C5CFC"
                          stopOpacity=".22"
                        />
                        <stop offset="1" stopColor="#27D7B0" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#EBEDEF" vertical={false} />
                    <XAxis
                      dataKey="name"
                      stroke="#89909A"
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis hide domain={["dataMin-100", "dataMax+100"]} />
                    <Tooltip
                      contentStyle={{
                        background: "var(--surface-popover)",
                        color: "var(--text-strong)",
                        border: "1px solid var(--border-strong)",
                        borderRadius: 14,
                        boxShadow: "var(--shadow-lg)",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#7C5CFC"
                      strokeWidth={3}
                      fill="url(#fill)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="panel summary">
                <PanelHead
                  title="خلاصه ماه"
                  sub={
                    language === "fa"
                      ? `${monthNames[month.getMonth()]} ${faDigits(month.getFullYear())}`
                      : `${dynamicEnglish(monthNames[month.getMonth()])} ${month.getFullYear()}`
                  }
                />
                <Ring value={winrate} />
                <div className="wl">
                  <div>
                    <i className="win" />
                    بردها <b>{faDigits(wins.length)}</b>
                  </div>
                  <div>
                    <i className="loss" />
                    باخت‌ها <b>{faDigits(losses.length)}</b>
                  </div>
                </div>
                <div className="mini">
                  <span>
                    میانگین برد
                    <b>
                      {money(
                        wins.length
                          ? wins.reduce((s, t) => s + Number(t.pnl), 0) /
                              wins.length
                          : 0,
                      )}
                    </b>
                  </span>
                  <span>
                    میانگین باخت
                    <b className="red">
                      {money(
                        losses.length
                          ? losses.reduce((s, t) => s + Number(t.pnl), 0) /
                              losses.length
                          : 0,
                      )}
                    </b>
                  </span>
                </div>
              </div>
            </section>
            <EdgeSnapshot
              score={edgeScore}
              expectancy={expectancy}
              realizedRR={realizedRR}
              maxDrawdown={maxDrawdown}
              onRisk={() => setRiskCalculatorOpen(true)}
            />
            <section className="panel calendar">
              <div className="cal-head">
                <PanelHead
                  title="تقویم معاملاتی"
                  sub="عملکرد روزانه و ثبت معاملات"
                />
                <div className="month-nav">
                  <button
                    onClick={() =>
                      setMonth(
                        new Date(month.getFullYear(), month.getMonth() + 1, 1),
                      )
                    }
                  >
                    <ChevronRight />
                  </button>
                  <b>
                    {monthNames[month.getMonth()]}{" "}
                    {faDigits(month.getFullYear())}
                  </b>
                  <button
                    onClick={() =>
                      setMonth(
                        new Date(month.getFullYear(), month.getMonth() - 1, 1),
                      )
                    }
                  >
                    <ChevronLeft />
                  </button>
                </div>
              </div>
              <Calendar
                month={month}
                trades={monthEntries.filter(
                  (t) =>
                    !query ||
                    t.market.toLowerCase().includes(query.toLowerCase()),
                )}
                onDay={openDay}
                onTrade={setModal}
              />
            </section>
            <section className="bottom-grid">
              <div className="panel recent">
                <PanelHead
                  title="آخرین معاملات"
                  sub="جدیدترین فعالیت‌های شما"
                />
                <div className="trade-list">
                  {trades
                    .slice(-4)
                    .reverse()
                    .map((t) => (
                      <button key={t.id} onClick={() => setModal(t)}>
                        <span
                          className={
                            "trade-icon " + (isNoEntry(t) ? "no-entry" : Number(t.pnl) >= 0 ? "up" : "dn")
                          }
                        >
                          {isNoEntry(t) ? <Clock3 /> : Number(t.pnl) >= 0 ? (
                            <TrendingUp />
                          ) : (
                            <TrendingDown />
                          )}
                        </span>
                        <span>
                          <b>{t.market}</b>
                          <small>
                            {isNoEntry(t) ? "ورود نداد" : t.side === "Long" ? "خرید" : "فروش"} ·{" "}
                            {faDigits(t.date)}
                          </small>
                        </span>
                        <em className={isNoEntry(t) ? "no-entry-text" : Number(t.pnl) >= 0 ? "green" : "red"}>
                          {isNoEntry(t) ? "بدون ورود" : money(t.pnl)}
                        </em>
                      </button>
                    ))}
                </div>
              </div>
              <div className="panel insight">
                <div className="bulb"><BrainCircuit /></div>
                <span>{smartInsight.eyebrow}</span>
                <h3>{language === "fa" ? smartInsight.title : dynamicEnglish(smartInsight.title)}</h3>
                <p>{language === "fa" ? smartInsight.text : dynamicEnglish(smartInsight.text)}</p>
                <button onClick={() => setView("analytics")}>
                  مشاهده تحلیل کامل <ChevronLeft />
                </button>
              </div>
            </section>
          </div>
          {view === "calendar" && (
            <><JournalPage
              month={month}
              setMonth={setMonth}
              trades={trades}
              query={query}
              onDay={openDay}
              onTrade={setModal}
              liveBackup={{
                language, onDownload: downloadLiveBackup, onImport: importLiveFile,
                importBusy: liveImportBusy, importStatus: liveImportStatus,
                cloudConnected: cloudEnabled && cloudReady && cloudState !== "error",
              }}
            />
            {liveStorageError && <p className="backtest-storage-alert" role="alert">فضای ذخیره‌سازی مرورگر پر شده است. قبل از بستن صفحه، از ژورنال لایو نسخهٔ پشتیبان بگیر.</p>}
            {cloudState === "error" && <p className="backtest-storage-alert" role="alert">همگام‌سازی ابری خطا دارد. فایل بک‌آپ لایو را دانلود و نگه‌داری کن.</p>}
            </>
          )}
          {view === "backtest" && (
            <>
              {backtestStorageError && <p className="backtest-storage-alert" role="alert">فضای ذخیره‌سازی مرورگر پر شده است. قبل از بستن صفحه، از بک‌تست نسخهٔ پشتیبان بگیر و حجم عکس‌ها را کمتر کن.</p>}
              {cloudState === "error" && <p className="backtest-storage-alert" role="alert">همگام‌سازی ابری با خطا روبه‌رو شد. تا برطرف‌شدن مشکل این صفحه را نبند.</p>}
              <BacktestPage
                month={backtestMonth}
                setMonth={setBacktestMonth}
                trades={backtestTrades}
                query={backtestQuery}
                plan={plan}
                setPlan={setPlan}
                language={language}
                onDay={openBacktestDay}
                onTrade={setBacktestModal}
                onAdd={() => newBacktestTrade(new Date().toISOString().slice(0, 10))}
                onImport={importBacktestFile}
                importBusy={backtestImportBusy}
                importStatus={backtestImportStatus}
                cloudConnected={cloudEnabled && cloudReady && cloudState !== "error"}
              />
            </>
          )}
          {view === "analytics" && (
            <AnalyticsPage
              trades={executedTrades(trades)}
              equity={equity}
              winrate={winrate}
              total={total}
              profitFactor={profitFactor}
              accountBalance={accountBalance}
            />
          )}
          {view === "playbook" && (
            <PlaybookPage plan={plan} setPlan={setPlan} />
          )}
          {view === "settings" && (
            <SettingsPage
              profile={profile}
              setProfile={setProfile}
              balance={accountBalance}
              setBalance={setAccountBalance}
              trades={trades}
              backtestTrades={backtestTrades}
              clearTrades={() => setTrades([])}
              theme={theme}
              setTheme={setTheme}
              language={language}
              setLanguage={setLanguage}
              plan={plan}
              setPlan={setPlan}
              sessionClock={sessionClock}
              session={session}
              cloudState={cloudState}
              onLogout={logout}
            />
          )}
        </div>
      </main>
      {modal && (
        <TradeModal
          trade={modal}
          language={language}
          onSave={save}
          onDelete={
            modal.id
              ? () => {
                  setTrades((x) => x.filter((t) => t.id !== modal.id));
                  setModal(null);
                }
              : null
          }
          onClose={() => setModal(null)}
        />
      )}{" "}
      {backtestModal && (
        <TradeModal
          key={backtestModal.id || `new-${backtestModal.date}`}
          trade={backtestModal}
          language={language}
          mode="backtest"
          onSave={saveBacktest}
          onDelete={backtestModal.id ? () => {
            setBacktestTrades((current) => current.filter((trade) => trade.id !== backtestModal.id));
            setBacktestModal(null);
          } : null}
          onClose={() => setBacktestModal(null)}
        />
      )}
      {riskCalculatorOpen && (
        <RiskCalculatorModal
          balance={currentBalance}
          defaultRisk={plan.maxRisk}
          onClose={() => setRiskCalculatorOpen(false)}
        />
      )}
      {daySheet && (
        <DayTradesModal
          date={daySheet.date}
          trades={trades.filter((t) => t.date === daySheet.date)}
          onClose={() => setDaySheet(null)}
          onAdd={() => {
            const date = daySheet.date;
            setDaySheet(null);
            newTrade(date);
          }}
          onEdit={(trade) => {
            setDaySheet(null);
            setModal(trade);
          }}
        />
      )}
      {backtestDaySheet && (
        <DayTradesModal
          date={backtestDaySheet.date}
          mode="backtest"
          trades={backtestTrades.filter((trade) => trade.date === backtestDaySheet.date)}
          onClose={() => setBacktestDaySheet(null)}
          onAdd={() => {
            const date = backtestDaySheet.date;
            setBacktestDaySheet(null);
            newBacktestTrade(date);
          }}
          onEdit={(trade) => {
            setBacktestDaySheet(null);
            setBacktestModal(trade);
          }}
        />
      )}
      {mobileNav && (
        <div className="scrim" onClick={() => setMobileNav(false)} />
      )}
      {activeSessionCheck && (
        <SessionChecklistGate
          key={`${sessionOwner}_${activeSessionCheck.id}_${activeSessionCheck.date}_${sessionRuleSignature(activeSessionCheck)}`}
          due={activeSessionCheck}
          language={language}
          onComplete={() => {
            localStorage.setItem(
              sessionAcknowledgementKey(sessionOwner, activeSessionCheck),
              sessionRuleSignature(activeSessionCheck),
            );
            refreshSessionGate((value) => value + 1);
          }}
        />
      )}
    </div>
  );
}

function EdgeSnapshot({ score, expectancy, realizedRR, maxDrawdown, onRisk }) {
  const status = score >= 75 ? "لبهٔ قوی" : score >= 55 ? "رو به رشد" : "در حال ساخت";
  return (
    <section className="edge-snapshot">
      <div className="edge-score-card">
        <div className="score-orbit" style={{ "--score": `${score * 3.6}deg` }}>
          <span>{faDigits(score)}</span>
        </div>
        <div>
          <span><Activity /> امتیاز عملکرد</span>
          <h3>{status}</h3>
          <p>ترکیبی از نرخ برد، سوددهی و نظم ژورنال‌نویسی</p>
        </div>
      </div>
      <div className="edge-metric">
        <span><Award /> امید ریاضی هر معامله</span>
        <b className={expectancy >= 0 ? "green" : "red"}>{money(expectancy)}</b>
        <small>Expected value</small>
      </div>
      <div className="edge-metric">
        <span><ShieldCheck /> بازده به ریسک واقعی</span>
        <b>{realizedRR.toFixed(2)}R</b>
        <small>Realized R multiple</small>
      </div>
      <div className="edge-metric">
        <span><TrendingDown /> بیشترین افت ماه</span>
        <b className={maxDrawdown ? "red" : "green"}>{money(-maxDrawdown)}</b>
        <small>Maximum drawdown</small>
      </div>
      <button className="edge-action" onClick={onRisk}>
        <Calculator />
        <span><b>محاسبه حجم معامله</b><small>Risk calculator</small></span>
        <ChevronLeft />
      </button>
    </section>
  );
}

function PageTitle({ eyebrow, title, text }) {
  return (
    <div className="page-title">
      <span>{eyebrow}</span>
      <h1>{title}</h1>
      <p>{text}</p>
    </div>
  );
}

function CloudLoading() {
  return (
    <div className="auth-page" dir="rtl">
      <div className="auth-card"><span className="auth-logo"><TrendingUp /></span><h1>ETT</h1><p>در حال همگام‌سازی اطلاعات حساب…</p></div>
    </div>
  );
}

function AuthScreen() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const result = mode === "login"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });
    setBusy(false);
    if (result.error) setMessage(result.error.message);
    else if (mode === "signup" && !result.data.session)
      setMessage("لینک تأیید برایت ایمیل شد. بعد از تأیید وارد شو.");
  }
  return (
    <div className="auth-page" dir="rtl">
      <form className="auth-card" onSubmit={submit}>
        <span className="auth-logo"><TrendingUp /></span>
        <h1>ETT</h1>
        <p>{mode === "login" ? "ورود به ژورنال معاملاتی" : "ساخت حساب رایگان"}</p>
        <label>ایمیل<input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></label>
        <label>رمز عبور<input required minLength="6" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} /></label>
        {message && <div className="auth-message">{message}</div>}
        <button className="primary" disabled={busy}>{busy ? "کمی صبر کن…" : mode === "login" ? "ورود" : "ثبت‌نام"}</button>
        <button type="button" className="auth-switch" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setMessage(""); }}>
          {mode === "login" ? "حساب نداری؟ ثبت‌نام کن" : "حساب داری؟ وارد شو"}
        </button>
      </form>
    </div>
  );
}

function PlaybookPage({ plan, setPlan }) {
  const [rule, setRule] = useState("");
  const readinessKey = `tradeflow_readiness_${new Date().toISOString().slice(0, 10)}`;
  const [checkedRules, setCheckedRules] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(readinessKey)) || [];
    } catch {
      return [];
    }
  });
  const put = (k, v) => setPlan((p) => ({ ...p, [k]: v }));
  const completedRules = checkedRules.filter((item) => plan.rules.includes(item));
  const readiness = plan.rules.length
    ? Math.round((completedRules.length / plan.rules.length) * 100)
    : 0;
  useEffect(() => {
    localStorage.setItem(readinessKey, JSON.stringify(checkedRules));
  }, [checkedRules, readinessKey]);
  return (
    <div className="view-page">
      <PageTitle
        eyebrow="پلن معاملاتی"
        title="قوانینی که از سرمایه‌ات محافظت می‌کنند"
        text="قبل از شروع سشن، محدودیت‌ها و چک‌لیست خودت را مرور کن."
      />
      <section className="plan-grid">
        <div className="panel plan-limits">
          <PanelHead title="مدیریت ریسک" sub="محدودیت‌های اصلی حساب" />
          <label>
            حداکثر ریسک هر معامله (%)
            <input
              type="number"
              value={plan.maxRisk}
              onChange={(e) => put("maxRisk", Number(e.target.value))}
            />
          </label>
          <label>
            حداکثر زیان روزانه (%)
            <input
              type="number"
              value={plan.dailyLoss}
              onChange={(e) => put("dailyLoss", Number(e.target.value))}
            />
          </label>
          <label>
            ساعت مجاز معامله
            <input
              value={plan.hours}
              onChange={(e) => put("hours", e.target.value)}
            />
          </label>
          <div className="risk-note">
            اگر زیان روزانه به {faDigits(plan.dailyLoss)}٪ برسد، معامله را متوقف
            کن.
          </div>
        </div>
        <div className="panel checklist">
          <PanelHead title="چک‌لیست قبل از ورود" sub="قوانین قابل ویرایش شما" />
          <div className="rules">
            {plan.rules.map((r, i) => (
              <label key={`${r}-${i}`} className={checkedRules.includes(r) ? "checked" : ""}>
                <input
                  type="checkbox"
                  checked={checkedRules.includes(r)}
                  onChange={() =>
                    setCheckedRules((current) =>
                      current.includes(r)
                        ? current.filter((item) => item !== r)
                        : [...current, r],
                    )
                  }
                />
                <span>{r}</span>
                <button
                  onClick={() =>
                    put(
                      "rules",
                      plan.rules.filter((_, n) => n !== i),
                    )
                  }
                >
                  <X />
                </button>
              </label>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (rule.trim()) {
                put("rules", [...plan.rules, rule.trim()]);
                setRule("");
              }
            }}
          >
            <input
              value={rule}
              onChange={(e) => setRule(e.target.value)}
              placeholder="قانون جدید..."
            />
            <button className="primary">
              <Plus />
              افزودن
            </button>
          </form>
        </div>
      </section>
      <section className="panel session-box">
        <div className="readiness-icon"><ShieldCheck /></div>
        <div className="readiness-copy">
          <span>وضعیت آمادگی امروز</span>
          <h3>{readiness === 100 ? "برای اجرای پلن آماده‌ای" : "قبل از اولین معامله، تمام قوانین را علامت بزن"}</h3>
          <p>{readiness === 100 ? "چک‌لیست کامل است؛ ریسک تعریف‌شده را حفظ کن." : "داشتن پلن مشخص تصمیم‌های هیجانی را کمتر می‌کند و باعث ثبات عملکرد می‌شود."}</p>
        </div>
        <div className="readiness-progress">
          <strong>{faDigits(readiness)}٪</strong>
          <span><i style={{ width: `${readiness}%` }} /></span>
          <small>{faDigits(completedRules.length)} از {faDigits(plan.rules.length)} قانون</small>
        </div>
      </section>
    </div>
  );
}

function SettingsPage({
  profile,
  setProfile,
  balance,
  setBalance,
  trades,
  backtestTrades,
  clearTrades,
  theme,
  setTheme,
  language,
  setLanguage,
  plan,
  setPlan,
  sessionClock,
  session,
  cloudState,
  onLogout,
}) {
  const exportData = () => {
    const blob = new Blob(
      [JSON.stringify({ profile, balance, plan, trades, backtestTrades }, null, 2)],
      { type: "application/json" },
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "tradeflow-backup.json";
    a.click();
    URL.revokeObjectURL(a.href);
  };
  return (
    <div className="view-page">
      <PageTitle
        eyebrow="تنظیمات"
        title="حساب و اطلاعات شما"
        text="تنظیمات شخصی و داده‌های ژورنال را مدیریت کن."
      />
      <section className="preference-grid">
        <div className="panel preference-card">
          <span className="preference-icon">
            <Sun />
          </span>
          <div>
            <b>ظاهر برنامه</b>
            <small>روشن یا دارک</small>
          </div>
          <div className="segmented">
            <button
              className={theme === "light" ? "selected" : ""}
              onClick={() => setTheme("light")}
            >
              روشن
            </button>
            <button
              className={theme === "dark" ? "selected" : ""}
              onClick={() => setTheme("dark")}
            >
              دارک
            </button>
          </div>
        </div>
        <div className="panel preference-card">
          <span className="preference-icon">
            <Languages />
          </span>
          <div>
            <b>زبان برنامه</b>
            <small>فارسی یا English</small>
          </div>
          <div className="segmented">
            <button
              className={language === "fa" ? "selected" : ""}
              onClick={() => setLanguage("fa")}
            >
              فارسی
            </button>
            <button
              className={language === "en" ? "selected" : ""}
              onClick={() => setLanguage("en")}
            >
              English
            </button>
          </div>
        </div>
      </section>
      <section className="session-settings-section">
        <div className="session-settings-heading">
          <span className="session-settings-icon"><ShieldCheck /></span>
          <div>
            <h2>{language === "fa" ? "قوانین پیش از سشن" : "Pre-session rules"}</h2>
            <p>{language === "fa" ? "نیم ساعت قبل از شروع هر سشن، چک‌لیست همان سشن صفحه را قفل می‌کند تا همه قوانین را تأیید کنی." : "A checklist locks the app 30 minutes before each session until you confirm every rule."}</p>
          </div>
        </div>
        <div className="session-settings-grid">
          {Object.keys(SESSION_DEFINITIONS).map((id) => (
            <SessionRulesSettings
              key={id}
              id={id}
              plan={plan}
              setPlan={setPlan}
              now={sessionClock}
              language={language}
            />
          ))}
        </div>
        <p className="session-settings-footnote">{language === "fa" ? "ساعت شروع به وقت محلی لندن یا نیویورک است. زمان ایران با تغییر ساعت فصلی خودکار محاسبه می‌شود. یادآور فقط زمانی نمایش داده می‌شود که سایت باز باشد." : "Opening times use local London or New York time. Iran times adjust for daylight saving. The reminder appears while the site is open."}</p>
      </section>
      <section className="settings-grid">
        <div className="panel settings-form">
          <PanelHead title="پروفایل معامله‌گر" sub="اطلاعات نمایشی حساب" />
          <label>
            نام و نام خانوادگی
            <input
              value={profile.name}
              onChange={(e) =>
                setProfile((p) => ({ ...p, name: e.target.value }))
              }
            />
          </label>
          <label>
            واحد پول
            <select
              value={profile.currency}
              onChange={(e) =>
                setProfile((p) => ({ ...p, currency: e.target.value }))
              }
            >
              <option value="USD">دلار آمریکا (USD)</option>
              <option value="EUR">یورو (EUR)</option>
              <option value="IRT">تومان (IRT)</option>
            </select>
          </label>
          <label>
            سرمایه اولیه
            <input
              type="number"
              value={balance}
              onChange={(e) => setBalance(Number(e.target.value) || 0)}
            />
          </label>
          <div className="saved-hint">
            تغییرات به‌صورت خودکار ذخیره می‌شوند.
          </div>
        </div>
        <div className="panel data-box">
          <PanelHead
            title="مدیریت داده‌ها"
            sub={`${faDigits(trades.length)} معامله لایو · ${faDigits(backtestTrades.length)} معامله بک‌تست`}
          />
          <button onClick={exportData}>
            دریافت نسخه پشتیبان JSON <ChevronLeft />
          </button>
          <div className="cloud-account">
            <b>{session ? "فضای ابری متصل است" : "ذخیره‌سازی محلی"}</b>
            <p>{session ? `${session.user.email} · ${cloudState === "synced" ? "همگام است" : cloudState === "saving" ? "در حال ذخیره…" : cloudState === "error" ? "خطا در همگام‌سازی" : "در حال اتصال…"}` : "پس از اتصال Supabase، اطلاعات بین دستگاه‌ها همگام می‌شود."}</p>
            {session && <button type="button" onClick={onLogout}><LogOut /> خروج از حساب</button>}
          </div>
          <div className="danger-zone">
            <b>پاک‌کردن معاملات لایو</b>
            <p>
              فقط معاملات ژورنال لایو حذف می‌شوند؛ داده‌های بک‌تست دست‌نخورده می‌مانند. این کار قابل بازگشت نیست.
            </p>
            <button
              onClick={() =>
                window.confirm("همه معاملات لایو حذف شوند؟ معاملات بک‌تست باقی می‌مانند.") && clearTrades()
              }
            >
              <Trash2 />
              حذف معاملات لایو
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function SessionRulesSettings({ id, plan, setPlan, now, language }) {
  const [newRule, setNewRule] = useState("");
  const definition = SESSION_DEFINITIONS[id];
  const config = { ...DEFAULT_SESSION_CHECK, ...plan.sessionChecks?.[id] };
  const rules = Array.isArray(config.rules) ? config.rules : [];
  const nextOpening = getNextSessionOpening(id, config, now);
  const nextTrigger = nextOpening === null ? null : nextOpening - 30 * 60 * 1000;
  const formatIran = (instant) => new Intl.DateTimeFormat(language === "fa" ? "fa-IR" : "en-GB", {
    timeZone: "Asia/Tehran", weekday: "long", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).format(new Date(instant));
  const update = (patch) => setPlan((current) => ({
    ...current,
    sessionChecks: {
      ...current.sessionChecks,
      [id]: { ...DEFAULT_SESSION_CHECK, ...current.sessionChecks?.[id], ...patch },
    },
  }));
  const addRule = (event) => {
    event.preventDefault();
    const rule = newRule.trim();
    if (!rule || rules.some((item) => item.toLocaleLowerCase() === rule.toLocaleLowerCase())) return;
    update({ rules: [...rules, rule] });
    setNewRule("");
  };
  return (
    <div className="panel session-settings-card">
      <div className="session-settings-card-head">
        <div className="session-city-icon"><Clock3 /></div>
        <div>
          <span>{definition.english.toUpperCase()} SESSION</span>
          <h3>{language === "fa" ? `سشن ${definition.label}` : `${definition.english} session`}</h3>
        </div>
        <span className="session-switch-status">{config.enabled && rules.length ? (language === "fa" ? "فعال" : "On") : (language === "fa" ? "خاموش" : "Off")}</span>
        <label className="session-switch">
          <input
            type="checkbox"
            checked={Boolean(config.enabled && rules.length)}
            disabled={!rules.length}
            onChange={(event) => update({ enabled: event.target.checked })}
            aria-label={language === "fa" ? `فعال‌سازی سشن ${definition.label}` : `Enable ${definition.english} session`}
          />
          <span />
        </label>
      </div>
      <div className="session-time-row">
        <label>
          {language === "fa" ? "ساعت شروع به وقت محلی" : "Local opening time"}
          <input type="time" value={config.open || "08:00"} onChange={(event) => update({ open: event.target.value })} />
        </label>
        <span>{language === "fa" ? "دوشنبه تا جمعه" : "Monday to Friday"}</span>
      </div>
      <div className="session-iran-preview">
        <CalendarDays />
        <div>
          <small>{language === "fa" ? "نوبت بعدی به وقت ایران" : "Next session in Iran"}</small>
          <b>{nextOpening === null ? "—" : formatIran(nextOpening)}</b>
          <span>{language === "fa" ? "نمایش چک‌لیست:" : "Checklist opens:"} {nextTrigger === null ? "—" : formatIran(nextTrigger)}</span>
        </div>
      </div>
      <div className="session-rules-title">
        <b>{language === "fa" ? "قوانین این سشن" : "Session rules"}</b>
        <small>{language === "fa" ? `${faDigits(rules.length)} قانون` : `${rules.length} rules`}</small>
      </div>
      {rules.length ? (
        <div className="session-edit-rules">
          {rules.map((rule, index) => (
            <div className="session-edit-rule" key={`${id}-${index}`}>
              <span>{faDigits(index + 1).padStart(2, "۰")}</span>
              <input
                aria-label={language === "fa" ? `قانون ${faDigits(index + 1)} سشن ${definition.label}` : `Rule ${index + 1} for ${definition.english}`}
                value={rule}
                onChange={(event) => update({ rules: rules.map((item, itemIndex) => itemIndex === index ? event.target.value : item) })}
                onBlur={() => update({ rules: rules.map((item) => item.trim()).filter(Boolean) })}
              />
              <button type="button" aria-label={language === "fa" ? "حذف قانون" : "Delete rule"} onClick={() => {
                const remaining = rules.filter((_, itemIndex) => itemIndex !== index);
                update({ rules: remaining, enabled: remaining.length ? config.enabled : false });
              }}><Trash2 /></button>
            </div>
          ))}
        </div>
      ) : <p className="session-empty-rules">{language === "fa" ? "اولین قانون را اضافه کن، سپس سوییچ بالا را روشن کن." : "Add a rule, then turn on the switch above."}</p>}
      <form className="session-add-rule" onSubmit={addRule}>
        <input value={newRule} onChange={(event) => setNewRule(event.target.value)} placeholder={language === "fa" ? "قانون جدید برای این سشن..." : "New rule for this session..."} />
        <button type="submit" aria-label={language === "fa" ? "افزودن قانون" : "Add rule"}><Plus /></button>
      </form>
    </div>
  );
}

function SessionChecklistGate({ due, language, onComplete }) {
  const [checked, setChecked] = useState([]);
  const dialogRef = useRef(null);
  const definition = SESSION_DEFINITIONS[due.id];
  const allChecked = due.rules.length > 0 && checked.length === due.rules.length;
  const openingIran = new Intl.DateTimeFormat(language === "fa" ? "fa-IR" : "en-GB", {
    timeZone: "Asia/Tehran", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).format(new Date(due.opening));
  useEffect(() => {
    dialogRef.current?.querySelector("input")?.focus();
    const keepFocus = (event) => {
      if (event.key !== "Tab") return;
      const focusable = [...dialogRef.current.querySelectorAll("input, button:not(:disabled)")];
      if (!focusable.length) return;
      if (event.shiftKey && document.activeElement === focusable[0]) {
        event.preventDefault(); focusable.at(-1).focus();
      } else if (!event.shiftKey && document.activeElement === focusable.at(-1)) {
        event.preventDefault(); focusable[0].focus();
      }
    };
    window.addEventListener("keydown", keepFocus);
    return () => window.removeEventListener("keydown", keepFocus);
  }, []);
  return (
    <div className="session-gate-wrap">
      <div className="session-gate modal" role="dialog" aria-modal="true" aria-labelledby="session-gate-title" ref={dialogRef}>
        <div className="session-gate-top">
          <span className="session-gate-badge"><ShieldCheck /> {language === "fa" ? "پیش از سشن" : "PRE-SESSION CHECK"}</span>
          <span className="session-gate-city">{definition.english.toUpperCase()}</span>
        </div>
        <div className="session-gate-intro">
          <div className="session-gate-emblem"><Clock3 /></div>
          <h2 id="session-gate-title">{language === "fa" ? `آمادهٔ سشن ${definition.label} هستی؟` : `Ready for the ${definition.english} session?`}</h2>
          <p>{language === "fa" ? `شروع سشن به وقت ایران: ${openingIran}. قوانینت را با دقت بخوان و یک‌به‌یک تأیید کن.` : `Session opens at ${openingIran} Iran time. Read and confirm each rule.`}</p>
        </div>
        <div className="session-gate-progress">
          <span>{language === "fa" ? "پیشرفت چک‌لیست" : "Checklist progress"}</span>
          <b>{language === "fa" ? `${faDigits(checked.length)} از ${faDigits(due.rules.length)}` : `${checked.length} of ${due.rules.length}`}</b>
          <div><i style={{ width: `${checked.length / due.rules.length * 100}%` }} /></div>
        </div>
        <div className="session-gate-rules">
          {due.rules.map((rule, index) => (
            <label key={`${index}-${rule}`} className={checked.includes(index) ? "checked" : ""}>
              <input type="checkbox" checked={checked.includes(index)} onChange={() => setChecked((current) => current.includes(index) ? current.filter((item) => item !== index) : [...current, index])} />
              <span className="session-gate-check"><CheckCircle2 /></span>
              <span className="session-gate-rule"><small>{language === "fa" ? `قانون ${faDigits(index + 1)}` : `RULE ${index + 1}`}</small><strong>{rule}</strong></span>
            </label>
          ))}
        </div>
        <button className="session-gate-confirm" type="button" disabled={!allChecked} onClick={onComplete}>
          <ShieldCheck /> {language === "fa" ? "همه قوانین را خواندم؛ ورود به ژورنال" : "I read every rule; enter the journal"}
        </button>
        <p className="session-gate-note">{language === "fa" ? "این تأیید فقط برای سشن امروز ثبت می‌شود." : "This confirmation applies to today's session only."}</p>
      </div>
    </div>
  );
}

function Stat({ icon: I, label, value, delta, detail, editable, onChange, secondaryLabel, secondaryValue }) {
  return (
    <div className="stat">
      <div className="stat-top">
        <span className="stat-icon">
          <I />
        </span>
        <Spark down={false} />
      </div>
      <small>{label}</small>
      {secondaryLabel ? (
        <div className="balance-summary">
          <h2>{value}</h2>
          <span><small>{secondaryLabel}</small><b dir="ltr">{secondaryValue}</b></span>
        </div>
      ) : editable ? (
        <div className="balance-edit">
          <span>$</span>
          <input
            aria-label="موجودی حساب"
            type="number"
            step="any"
            value={value}
            onChange={(event) => onChange(Number(event.target.value) || 0)}
          />
        </div>
      ) : (
        <h2>{value}</h2>
      )}
      <p>
        {delta && <b>{delta}</b>} {detail}
      </p>
    </div>
  );
}
function PanelHead({ title, sub }) {
  return (
    <div className="panel-head">
      <div>
        <h3>{title}</h3>
        <p>{sub}</p>
      </div>
      <button>
        مشاهده همه <ChevronLeft />
      </button>
    </div>
  );
}
function Ring({ value }) {
  return (
    <div className="ring" style={{ "--p": `${value * 3.6}deg` }}>
      <div>
        <b>{faDigits(value)}٪</b>
        <small>نرخ برد</small>
      </div>
    </div>
  );
}
function DayTradesModal({ date, trades, onClose, onAdd, onEdit, mode = "live" }) {
  const executed = executedTrades(trades);
  const total = executed.reduce((sum, trade) => sum + Number(trade.pnl || 0), 0);
  return (
    <div
      className="modal-wrap day-trades-modal-wrap"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className="modal day-trades-modal">
        <div className="modal-head">
          <div>
            <span>{mode === "backtest" ? "معاملات بک‌تست روز" : "معاملات روز"}</span>
            <h2>{faDigits(date)}</h2>
            <p>
              {faDigits(executed.length)} معامله · {faDigits(trades.length - executed.length)} فرصت بدون ورود · نتیجه کل {money(total)}
            </p>
          </div>
          <button onClick={onClose}>
            <X />
          </button>
        </div>
        <div className="day-trades-list">
          {trades.map((trade, index) => (
            <button key={trade.id} onClick={() => onEdit(trade)}>
              <span
                className={
                  isNoEntry(trade) ? "trade-icon no-entry" : Number(trade.pnl) >= 0 ? "trade-icon up" : "trade-icon dn"
                }
              >
                {isNoEntry(trade) ? <Clock3 /> : Number(trade.pnl) >= 0 ? <TrendingUp /> : <TrendingDown />}
              </span>
              <span>
                <small>{isNoEntry(trade) ? "فرصت بدون ورود" : "معامله"} {faDigits(index + 1)}</small>
                <b dir="ltr">{trade.market}</b>
                <em>
                  {isNoEntry(trade) ? trade.noEntryReason || "ورود نداد" : `${trade.side === "Long" ? "خرید" : "فروش"} · ${trade.setup || "بدون ستاپ"}`}
                </em>
              </span>
              <strong className={isNoEntry(trade) ? "no-entry-text" : Number(trade.pnl) >= 0 ? "green" : "red"}>
                {isNoEntry(trade) ? "بدون ورود" : money(trade.pnl)}
              </strong>
              <ChevronLeft />
            </button>
          ))}
        </div>
        <div className="modal-foot day-actions">
          <button className="cancel" onClick={onClose}>
            بستن
          </button>
          <span />
          <button className="primary" onClick={onAdd}>
            <Plus />
            افزودن معامله دیگر
          </button>
        </div>
      </div>
    </div>
  );
}

function Calendar({ month, trades, onDay }) {
  const y = month.getFullYear(),
    m = month.getMonth(),
    days = new Date(y, m + 1, 0).getDate();
  let offset = (new Date(y, m, 1).getDay() + 1) % 7;
  const cells = [
    ...Array(offset).fill(null),
    ...Array.from({ length: days }, (_, i) => i + 1),
  ];
  while (cells.length % 7) cells.push(null);
  return (
    <>
      <div className="weekdays">
        {week.map((x) => (
          <b key={x}>{x}</b>
        ))}
      </div>
      <div className="days">
        {cells.map((d, i) => {
          if (!d) return <div className="day blank" key={i} />;
          const ds = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
            ts = trades.filter((t) => t.date === ds),
            executed = executedTrades(ts),
            p = executed.reduce((s, t) => s + Number(t.pnl || 0), 0),
            previewImage = tradePreviewImage(ts[0]);
          return (
            <button
              key={ds}
              className={
                "day " +
                (ts.length
                  ? p > 0
                    ? "profit"
                    : p < 0
                      ? "loss"
                      : executed.length ? "flat" : "no-entry"
                  : "") +
                (previewImage ? " has-image" : "")
              }
              onClick={() => onDay(ds, ts)}
            >
              {previewImage && (
                <img
                  className="day-image"
                  src={previewImage}
                  alt="چارت معامله"
                />
              )}
              <span className="daynum">{faDigits(d)}</span>
              {ts.length ? (
                <>
                  <div className="day-market">
                    {ts[0].market}
                    <small>{isNoEntry(ts[0]) ? "ورود نداد" : ts[0].side === "Long" ? "خرید" : "فروش"}</small>
                  </div>
                  <b className="day-pnl">{executed.length ? money(p) : "بدون ورود"}</b>
                  {ts.length > 1 && (
                    <em className="trade-count">
                      {faDigits(ts.length)} ثبت
                    </em>
                  )}
                  <span className="dot" />
                </>
              ) : (
                <Plus className="add" />
              )}
            </button>
          );
        })}
      </div>
      <div className="legend">
        <span>
          <i className="win" />
          سودده
        </span>
        <span>
          <i className="loss" />
          زیان‌ده
        </span>
        <span>
          <i className="no-entry" />
          ورود نداد
        </span>
        <span>
          <i />
          بدون معامله
        </span>
        <em>برای ثبت یا مشاهده معامله روی روز مورد نظر کلیک کنید</em>
      </div>
    </>
  );
}

function RiskCalculatorModal({ balance, defaultRisk, onClose }) {
  const [values, setValues] = useState({
    balance: Number(balance || 0),
    riskPercent: Number(defaultRisk || 1),
    entry: "",
    stop: "",
    target: "",
  });
  const put = (key, value) => setValues((current) => ({ ...current, [key]: value }));
  const riskCapital = (Number(values.balance) * Number(values.riskPercent)) / 100;
  const stopDistance = Math.abs(Number(values.entry) - Number(values.stop));
  const targetDistance = Math.abs(Number(values.target) - Number(values.entry));
  const positionSize = stopDistance ? riskCapital / stopDistance : 0;
  const rewardRisk = stopDistance && targetDistance ? targetDistance / stopDistance : 0;
  const potentialReward = riskCapital * rewardRisk;
  return (
    <div className="modal-wrap" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="modal risk-calculator-modal">
        <div className="modal-head">
          <div>
            <span>Risk Intelligence</span>
            <h2>ماشین حساب حجم و ریسک</h2>
            <p>قبل از ورود، اندازه پوزیشن و نسبت سود به ضرر را دقیق ببین.</p>
          </div>
          <button onClick={onClose}><X /></button>
        </div>
        <div className="risk-calculator-body">
          <div className="risk-form">
            <label>موجودی حساب ($)<input type="number" step="any" value={values.balance} onChange={(event) => put("balance", event.target.value)} /></label>
            <label>ریسک معامله (%)<input type="number" step="0.1" min="0" value={values.riskPercent} onChange={(event) => put("riskPercent", event.target.value)} /></label>
            <label>قیمت ورود<input type="number" step="any" value={values.entry} onChange={(event) => put("entry", event.target.value)} placeholder="0.00" /></label>
            <label>حد ضرر<input type="number" step="any" value={values.stop} onChange={(event) => put("stop", event.target.value)} placeholder="0.00" /></label>
            <label className="wide">حد سود<input type="number" step="any" value={values.target} onChange={(event) => put("target", event.target.value)} placeholder="اختیاری" /></label>
          </div>
          <div className="risk-results">
            <div className="risk-hero-result">
              <span>حجم پیشنهادی</span>
              <b>{positionSize ? positionSize.toLocaleString("en-US", { maximumFractionDigits: 4 }) : "—"}</b>
              <small>واحد دارایی بر اساس فاصله حد ضرر</small>
            </div>
            <div><span>سرمایه در معرض ریسک</span><b className="red">{money(-riskCapital)}</b></div>
            <div><span>نسبت سود به ضرر</span><b>{rewardRisk ? `${rewardRisk.toFixed(2)}R` : "—"}</b></div>
            <div><span>سود بالقوه</span><b className="green">{rewardRisk ? money(potentialReward) : "—"}</b></div>
          </div>
          <div className="risk-safety"><ShieldCheck /><span><b>بدون تغییر در اطلاعاتت</b><small>این ابزار فقط محاسبه می‌کند و چیزی در ژورنال یا دیتابیس ذخیره نمی‌کند.</small></span></div>
        </div>
        <div className="modal-foot"><span /><button className="primary" onClick={onClose}><CheckCircle2 /> متوجه شدم</button></div>
      </div>
    </div>
  );
}

function TradeModal({ trade, onSave, onDelete, onClose, mode = "live", language = "fa" }) {
  const [f, setF] = useState(() => ({ ...trade, images: backtestImages(trade), image: "", status: isNoEntry(trade) ? "no-entry" : "executed", noEntryReason: trade.noEntryReason || "" }));
  const [imageBusy, setImageBusy] = useState(false);
  const [imageError, setImageError] = useState("");
  const [reasonError, setReasonError] = useState("");
  const [previewIndex, setPreviewIndex] = useState(null);
  const put = (k, v) => setF((x) => ({ ...x, [k]: v }));
  async function image(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setImageBusy(true);
    setImageError("");
    try {
      const images = await Promise.all(files.map(async (file, index) => ({
        id: `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
        timeframe: "",
        src: await prepareTradeImage(file, { maxSide: 1280, quality: 0.72 }),
      })));
      setF((current) => ({ ...current, images: [...backtestImages(current), ...images], image: "" }));
    } catch (error) {
      console.error(error);
      setImageError("یکی از تصاویر قابل پردازش نیست؛ لطفاً فایل JPG، PNG یا WebP انتخاب کنید.");
    } finally {
      setImageBusy(false);
      e.target.value = "";
    }
  }
  return (<>
    <div
      className="modal-wrap trade-modal-wrap"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <form
        className="modal"
        onSubmit={(e) => {
          e.preventDefault();
          if (isNoEntry(f) && !f.noEntryReason.trim()) {
            setReasonError("دلیل ورود ندادن را بنویس.");
            return;
          }
          onSave(isNoEntry(f)
            ? { ...f, entry: "", exit: "", pnl: 0, risk: "", noEntryReason: f.noEntryReason.trim() }
            : { ...f, pnl: Number(f.pnl), risk: Number(f.risk) });
        }}
      >
        <div className="modal-head">
          <div>
            <span>{mode === "backtest" ? "ثبت در بک‌تست" : "ثبت در ژورنال"}</span>
            <h2>{trade.id ? "ویرایش ثبت" : isNoEntry(f) ? "فرصت بدون ورود" : mode === "backtest" ? "معامله بک‌تست جدید" : "معامله جدید"}</h2>
            <p>{faDigits(f.date)} · {isNoEntry(f) ? "در آمار معاملات و موجودی حساب نمی‌شود" : mode === "backtest" ? "بدون تأثیر بر حساب لایو" : "اطلاعات معامله را دقیق وارد کنید"}</p>
          </div>
          <button type="button" onClick={onClose}>
            <X />
          </button>
        </div>
        <div className="modal-body">
          <div className="entry-status-picker" role="group" aria-label="نتیجهٔ فرصت معاملاتی">
            <button type="button" className={!isNoEntry(f) ? "active" : ""} aria-pressed={!isNoEntry(f)} onClick={() => put("status", "executed")}>ورود انجام شد</button>
            <button type="button" className={isNoEntry(f) ? "active" : ""} aria-pressed={isNoEntry(f)} onClick={() => put("status", "no-entry")}>ورود نداد</button>
          </div>
          {isNoEntry(f) && <label className="no-entry-reason">چرا ورود ندادی؟
            <textarea required rows="3" value={f.noEntryReason} onChange={(event) => { put("noEntryReason", event.target.value); setReasonError(""); }} placeholder="مثلاً BOS تأیید نشد، پولبک به FVG نرسید یا نسبت سود به ریسک کافی نبود..." />
            {reasonError && <small className="image-error" role="alert">{reasonError}</small>}
          </label>}
            <section className="backtest-images">
              <div className="backtest-images-head">
                <div><b>تصاویر تایم‌فریم‌ها</b><small>برای دیدن عکس در اندازهٔ کامل روی آن بزن؛ می‌توانی تایم‌فریم هر عکس را هم بنویسی.</small></div>
                <span>{faDigits(backtestImages(f).length)} عکس</span>
              </div>
              <div className="backtest-images-grid">
                {backtestImages(f).map((item, index) => (
                  <div className="backtest-image-card" key={item.id || `${index}-${item.src.slice(0, 30)}`}>
                    <button type="button" className="trade-image-preview" onClick={() => setPreviewIndex(index)} aria-label={`نمایش تمام‌صفحهٔ عکس ${item.timeframe || index + 1}`}>
                      <img src={item.src} alt={`چارت ${item.timeframe || index + 1}`} />
                      <span><Eye /> پیش‌نمایش</span>
                    </button>
                    <label>تایم‌فریم
                      <input
                        list="backtest-timeframe-options"
                        value={item.timeframe || ""}
                        onChange={(event) => setF((current) => ({
                          ...current,
                          images: backtestImages(current).map((image, imageIndex) => imageIndex === index
                            ? { ...image, timeframe: event.target.value }
                            : image),
                        }))}
                        placeholder="مثلاً 4H یا 15M"
                      />
                    </label>
                    <div className="backtest-image-actions">
                      <a href={item.src} download={`ETT-${mode}-${f.date}-${item.timeframe || index + 1}.jpg`} title="دانلود عکس" aria-label="دانلود عکس"><Download /></a>
                      <button type="button" onClick={() => setF((current) => ({ ...current, images: backtestImages(current).filter((_, imageIndex) => imageIndex !== index) }))} title="حذف عکس" aria-label="حذف عکس"><Trash2 /></button>
                    </div>
                  </div>
                ))}
                <label className="backtest-image-add">
                  <ImagePlus />
                  <b>{imageBusy ? "در حال آماده‌سازی…" : "افزودن عکس"}</b>
                  <small>می‌توانی چند عکس را هم‌زمان انتخاب کنی</small>
                  <input type="file" multiple accept="image/jpeg,image/png,image/webp,image/heic,image/heif" onChange={image} disabled={imageBusy} />
                </label>
              </div>
              <datalist id="backtest-timeframe-options">
                <option value="1D" /><option value="4H" /><option value="1H" />
                <option value="30M" /><option value="15M" /><option value="5M" /><option value="1M" />
              </datalist>
            </section>
          {imageError && <p className="image-error">{imageError}</p>}
          <div className="form-grid">
            <label>
              تاریخ {isNoEntry(f) ? "فرصت" : "معامله"}
              <input type="date" required value={f.date} onChange={(e) => put("date", e.target.value)} />
            </label>
            <label>
              بازار
              <input
                required
                value={f.market}
                onChange={(e) => put("market", e.target.value)}
                placeholder="BTC/USDT"
              />
            </label>
            <label>
              {isNoEntry(f) ? "جهت موردنظر" : "نوع پوزیشن"}
              <select
                value={f.side}
                onChange={(e) => put("side", e.target.value)}
              >
                <option value="Long">Long — خرید</option>
                <option value="Short">Short — فروش</option>
              </select>
            </label>
            {!isNoEntry(f) && <><label>
              قیمت ورود
              <input
                type="number"
                step="any"
                value={f.entry}
                onChange={(e) => put("entry", e.target.value)}
              />
            </label>
            <label>
              قیمت خروج
              <input
                type="number"
                step="any"
                value={f.exit}
                onChange={(e) => put("exit", e.target.value)}
              />
            </label>
            <label>
              سود / زیان ($)
              <input
                required
                type="number"
                step="any"
                className={Number(f.pnl) < 0 ? "negative" : ""}
                value={f.pnl}
                onChange={(e) => put("pnl", e.target.value)}
                placeholder="مثلاً 250 یا -100"
              />
            </label>
            <label>
              میزان ریسک ($)
              <input
                type="number"
                step="any"
                value={f.risk}
                onChange={(e) => put("risk", e.target.value)}
              />
            </label></>}
            <label>
              ستاپ معاملاتی
              <input
                value={f.setup}
                onChange={(e) => put("setup", e.target.value)}
                placeholder="پولبک، شکست مقاومت..."
              />
            </label>
            <label>
              حالت ذهنی
              <select
                value={f.emotion}
                onChange={(e) => put("emotion", e.target.value)}
              >
                <option>متمرکز</option>
                <option>آرام</option>
                <option>مطمئن</option>
                <option>عجول</option>
                <option>خسته</option>
              </select>
            </label>
            <label className="wide">
              {isNoEntry(f) ? "یادداشت تکمیلی" : "یادداشت معامله"}
              <textarea
                rows="4"
                value={f.notes}
                onChange={(e) => put("notes", e.target.value)}
                placeholder="دلیل ورود، تحلیل بازار، اشتباهات و درس‌هایی که گرفتی..."
              />
            </label>
          </div>
        </div>
        <div className="modal-foot">
          {onDelete && (
            <button type="button" className="delete" onClick={onDelete}>
              <Trash2 />
              حذف
            </button>
          )}
          <span />
          <button type="button" className="cancel" onClick={onClose}>
            انصراف
          </button>
          <button className="primary" disabled={imageBusy}>ذخیره {isNoEntry(f) ? "فرصت" : "معامله"}</button>
        </div>
      </form>
    </div>
    {previewIndex !== null && createPortal(
      <PhotoLightbox
        images={backtestImages(f)}
        initialIndex={previewIndex}
        market={f.market}
        date={f.date}
        language={language}
        onClose={() => setPreviewIndex(null)}
      />,
      document.body,
    )}
  </>);
}
createRoot(document.getElementById("root")).render(<App />);

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`));
}
