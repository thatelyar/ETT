import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createRoot } from "react-dom/client";
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
  BarChart3,
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  ImagePlus,
  LayoutDashboard,
  Languages,
  Menu,
  Moon,
  Plus,
  Search,
  Settings,
  Target,
  Sun,
  Trash2,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import "./styles.css";
import "./theme.css";
import "./responsive.css";

const faDigits = (n) => String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);
const money = (n) =>
  `${Number(n) >= 0 ? "+" : ""}$${Math.abs(Number(n)).toLocaleString("en-US")}`.replace(
    "$-",
    "-$",
  );
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

const enMap = {
  "نمای کلی": "Overview",
  "ژورنال معاملاتی": "Trading Journal",
  "تحلیل عملکرد": "Performance Analytics",
  "پلن معاملاتی": "Trading Plan",
  تنظیمات: "Settings",
  جدید: "New",
  "حساب حرفه‌ای": "Pro account",
  "ژورنال حرفه‌ای معامله‌گری": "Professional trading journal",
  "بازار باز است": "Market is open",
  "ثبت معامله": "Add trade",
  "جستجو در معاملات...": "Search trades...",
  "موجودی حساب": "Account balance",
  "سود خالص ماه": "Monthly net P&L",
  "نرخ برد": "Win rate",
  "نسبت سود به ضرر": "Profit factor",
  "روند موجودی": "Equity curve",
  "خلاصه ماه": "Monthly summary",
  بردها: "Wins",
  باخت‌ها: "Losses",
  "میانگین برد": "Average win",
  "میانگین باخت": "Average loss",
  "تقویم معاملاتی": "Trading calendar",
  "عملکرد روزانه و ثبت معاملات": "Daily performance and trades",
  "مشاهده همه": "View all",
  سودده: "Profit",
  زیان‌ده: "Loss",
  "بدون معامله": "No trade",
  "آخرین معاملات": "Recent trades",
  "جدیدترین فعالیت‌های شما": "Your latest activity",
  "بینش هوشمند": "Smart insight",
  "مشاهده تحلیل کامل": "View full analysis",
  خرید: "Buy",
  فروش: "Sell",
  ژورنال: "Journal",
  "همه معاملات، یک‌جا": "All your trades in one place",
  "روزهای معاملاتی را مرور، جستجو و ویرایش کن.":
    "Review, search and edit your trading days.",
  "تقویم ماهانه": "Monthly calendar",
  "لیست معاملات": "Trade history",
  "برای مشاهده جزئیات روی هر ردیف کلیک کنید": "Click a row to view details",
  تاریخ: "Date",
  بازار: "Market",
  نوع: "Side",
  ستاپ: "Setup",
  ریسک: "Risk",
  نتیجه: "Result",
  "معامله‌ای برای این ماه ثبت نشده است.": "No trades recorded this month.",
  "اعداد، داستان معاملاتت را می‌گویند": "Your numbers tell the story",
  "تمام گزارش‌ها مستقیماً از معاملات ثبت‌شده محاسبه شده‌اند.":
    "All reports are calculated from your recorded trades.",
  "Profit Factor": "Profit Factor",
  "کل معاملات": "Total trades",
  "تمام دوره": "All time",
  "منحنی موجودی": "Equity curve",
  "روند عملکرد حساب": "Account performance trend",
  "جهت معاملات": "Trade direction",
  "عملکرد خرید و فروش": "Long and short performance",
  "عملکرد بازارها": "Market performance",
  "سود و زیان به تفکیک نماد": "P&L by symbol",
  "بهترین ستاپ‌ها": "Top setups",
  "رتبه‌بندی استراتژی‌های ثبت‌شده": "Strategy ranking",
  "پلن معاملاتی": "Trading Plan",
  "قوانینی که از سرمایه‌ات محافظت می‌کنند": "Rules that protect your capital",
  "قبل از شروع سشن، محدودیت‌ها و چک‌لیست خودت را مرور کن.":
    "Review your limits and checklist before each session.",
  "مدیریت ریسک": "Risk management",
  "محدودیت‌های اصلی حساب": "Core account limits",
  "حداکثر ریسک هر معامله (%)": "Max risk per trade (%)",
  "حداکثر زیان روزانه (%)": "Max daily loss (%)",
  "ساعت مجاز معامله": "Trading hours",
  "چک‌لیست قبل از ورود": "Pre-trade checklist",
  "قوانین قابل ویرایش شما": "Your editable rules",
  "قانون جدید...": "New rule...",
  افزودن: "Add",
  "وضعیت آمادگی امروز": "Today's readiness",
  "قبل از اولین معامله، تمام قوانین را علامت بزن":
    "Check every rule before your first trade",
  "حساب و اطلاعات شما": "Your account and data",
  "تنظیمات شخصی و داده‌های ژورنال را مدیریت کن.":
    "Manage your preferences and journal data.",
  "پروفایل معامله‌گر": "Trader profile",
  "اطلاعات نمایشی حساب": "Public account information",
  "نام و نام خانوادگی": "Full name",
  "واحد پول": "Currency",
  "دلار آمریکا (USD)": "US Dollar (USD)",
  "یورو (EUR)": "Euro (EUR)",
  "تومان (IRT)": "Toman (IRT)",
  "تغییرات به‌صورت خودکار ذخیره می‌شوند.": "Changes are saved automatically.",
  "مدیریت داده‌ها": "Data management",
  "دریافت نسخه پشتیبان JSON": "Download JSON backup",
  "پاک‌کردن معاملات": "Delete trades",
  "حذف همه معاملات": "Delete all trades",
  "ثبت در ژورنال": "Journal entry",
  "معامله جدید": "New trade",
  "ویرایش معامله": "Edit trade",
  "اطلاعات معامله را دقیق وارد کنید": "Enter your trade details accurately",
  "اسکرین‌شات چارت": "Chart screenshot",
  "برای انتخاب تصویر کلیک کنید": "Click to select an image",
  "نوع پوزیشن": "Position side",
  "قیمت ورود": "Entry price",
  "قیمت خروج": "Exit price",
  "سود / زیان ($)": "Profit / Loss ($)",
  "میزان ریسک ($)": "Risk amount ($)",
  "ستاپ معاملاتی": "Trading setup",
  "حالت ذهنی": "Mindset",
  "یادداشت معامله": "Trade notes",
  انصراف: "Cancel",
  "ذخیره معامله": "Save trade",
  حذف: "Delete",
  متمرکز: "Focused",
  آرام: "Calm",
  مطمئن: "Confident",
  عجول: "Impatient",
  خسته: "Tired",
  شروع: "Start",
  سود: "Profit",
  زیان: "Loss",
  عالی: "Excellent",
  مثبت: "Positive",
  "نیاز به بهبود": "Needs improvement",
  روشن: "Light",
  دارک: "Dark",
  فارسی: "Persian",
  انگلیسی: "English",
  "ظاهر برنامه": "Appearance",
  "زبان برنامه": "Language",
};
Object.assign(enMap, {
  "معاملات روز": "Daily trades",
  "افزودن معامله دیگر": "Add another trade",
  بستن: "Close",
  "بدون ستاپ": "No setup",
  "سه‌شنبه، ۱۰ شهریور ۱۴۰۵": "Tuesday, September 1, 2026",
  "سلام الیار، آماده‌ای بازار رو شکست بدی؟ 👋":
    "Hi Elyar, ready to beat the market? 👋",
  "عملکردت این ماه عالیه. همین روند رو ادامه بده.":
    "Your performance looks great this month. Keep it up.",
  "تداوم ژورنال‌نویسی": "Journal streak",
  "برای تغییر روی عدد کلیک کنید": "Click the number to edit",
  "بر اساس معاملات این ماه": "Based on this month's trades",
  "بر اساس معاملات ثبت‌شده این ماه": "Based on trades recorded this month",
  "بهترین عملکردت در سشن لندن بوده":
    "Your best performance is during the London session",
  "نرخ برد شما بین ساعت ۱۱ تا ۱۴، حدود ۲۳٪ بیشتر از میانگین است.":
    "Your win rate from 11:00 to 14:00 is about 23% above average.",
  "برای ثبت یا مشاهده معامله روی روز مورد نظر کلیک کنید":
    "Select a day to add or review trades",
  شنبه: "Sat",
  یکشنبه: "Sun",
  دوشنبه: "Mon",
  سه‌شنبه: "Tue",
  چهارشنبه: "Wed",
  پنجشنبه: "Thu",
  جمعه: "Fri",
  ش: "S",
  ی: "S",
  د: "M",
  س: "T",
  چ: "W",
  پ: "T",
  ج: "F",
  ژانویه: "January",
  فوریه: "February",
  مارس: "March",
  آوریل: "April",
  مه: "May",
  ژوئن: "June",
  ژوئیه: "July",
  اوت: "August",
  سپتامبر: "September",
  اکتبر: "October",
  نوامبر: "November",
  دسامبر: "December",
});
const toLatinDigits = (value) =>
  value.replace(/[۰-۹]/g, (d) => "0123456789"["۰۱۲۳۴۵۶۷۸۹".indexOf(d)]);
function dynamicEnglish(value) {
  let out = enMap[value] || value;
  out = out
    .replace(/(\S+) معامله در این ماه/g, "$1 trades this month")
    .replace(/از (\S+) معامله/g, "from $1 trades")
    .replace(/(\S+) معامله ذخیره‌شده/g, "$1 saved trades")
    .replace(/(\S+) معامله/g, "$1 trades")
    .replace(/(\S+) برد/g, "$1 wins")
    .replace(/(\S+) روز/g, "$1 days")
    .replace(/نتیجه کل/g, "Total result")
    .replace(/معامله (\S+)/g, "Trade $1");
  for (const [fa, en] of Object.entries(enMap))
    if (fa.length > 1 && out.includes(fa)) out = out.replaceAll(fa, en);
  return toLatinDigits(out);
}
function translateUI(root) {
  if (!root) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    const raw = node.nodeValue,
      trim = raw.trim();
    const translated = dynamicEnglish(trim);
    if (translated !== trim) node.nodeValue = raw.replace(trim, translated);
  }
  root
    .querySelectorAll("[placeholder],[data-label],[title],[aria-label]")
    .forEach((el) => {
      for (const attr of ["placeholder", "data-label", "title", "aria-label"]) {
        const value = el.getAttribute(attr);
        if (value) el.setAttribute(attr, dynamicEnglish(value));
      }
    });
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

function App() {
  const appRef = useRef(null);
  const [theme, setTheme] = useState(
    () => localStorage.getItem("tradeflow_theme") || "light",
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
  const [accountBalance, setAccountBalance] = useState(() =>
    Number(localStorage.getItem("tradeflow_balance") || 0),
  );
  const [view, setView] = useState("dashboard");
  const [month, setMonth] = useState(new Date(2026, 8, 1));
  const [modal, setModal] = useState(null);
  const [daySheet, setDaySheet] = useState(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [query, setQuery] = useState("");
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
  useEffect(
    () => localStorage.setItem("tradeflow_trades", JSON.stringify(trades)),
    [trades],
  );
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
  useLayoutEffect(() => {
    if (language === "en") translateUI(appRef.current);
  }, [
    language,
    view,
    modal,
    daySheet,
    trades,
    plan,
    profile,
    month,
    accountBalance,
  ]);
  const monthTrades = useMemo(
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
  const equity = useMemo(() => {
    let v = accountBalance - total;
    return [
      { name: "شروع", value: v },
      ...[...monthTrades]
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((t) => ({
          name: faDigits(+t.date.slice(-2)),
          value: (v += Number(t.pnl)),
        })),
    ];
  }, [monthTrades, accountBalance, total]);
  function save(data) {
    setTrades((x) =>
      data.id
        ? x.map((t) => (t.id === data.id ? data : t))
        : [...x, { ...data, id: Date.now() }],
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
    });
  }
  function openDay(date, dayTrades = []) {
    if (dayTrades.length) setDaySheet({ date });
    else newTrade(date);
  }
  const nav = [
    ["dashboard", "نمای کلی", LayoutDashboard],
    ["calendar", "ژورنال معاملاتی", CalendarDays],
    ["analytics", "تحلیل عملکرد", BarChart3],
    ["playbook", "پلن معاملاتی", BookOpen],
  ];
  return (
    <div
      ref={appRef}
      key={language}
      className="app"
      dir={language === "fa" ? "rtl" : "ltr"}
      lang={language}
      data-theme={theme}
    >
      <aside className={mobileNav ? "open" : ""}>
        <div className="brand">
          <span>
            <TrendingUp />
          </span>
          <div>
            TradeFlow<small>ژورنال حرفه‌ای معامله‌گری</small>
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
            onClick={() => {
              setView("settings");
              setMobileNav(false);
            }}
          >
            <Settings />
            تنظیمات
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
            <div className="avatar">EA</div>
            <div>
              <b>{profile.name}</b>
              <small>حساب حرفه‌ای</small>
            </div>
            <ChevronLeft />
          </div>
        </div>
      </aside>
      <main>
        <header>
          <button className="hamb" onClick={() => setMobileNav(true)}>
            <Menu />
          </button>
          <div className="search">
            <Search />
            <input
              placeholder="جستجو در معاملات..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <kbd>⌘ K</kbd>
          </div>
          <div className="header-actions">
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
            <span className="live">
              <i /> بازار باز است
            </span>
            <button
              className="primary add-trade-button"
              aria-label={language === "fa" ? "ثبت معامله" : "Add trade"}
              title={language === "fa" ? "ثبت معامله" : "Add trade"}
              onClick={() => newTrade(new Date().toISOString().slice(0, 10))}
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
                <p>سه‌شنبه، ۱۰ شهریور ۱۴۰۵</p>
                <h1>سلام الیار، آماده‌ای بازار رو شکست بدی؟ 👋</h1>
                <span>عملکردت این ماه عالیه. همین روند رو ادامه بده.</span>
              </div>
              <div className="streak">
                <span>🔥</span>
                <div>
                  <b>۶ روز</b>
                  <small>تداوم ژورنال‌نویسی</small>
                </div>
              </div>
            </section>
            <section className="stats">
              <Stat
                icon={CircleDollarSign}
                label="موجودی حساب"
                value={accountBalance}
                editable
                onChange={setAccountBalance}
                detail="برای تغییر روی عدد کلیک کنید"
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
                  <b>${accountBalance.toLocaleString("en-US")}</b>
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
                          stopColor="#007AFF"
                          stopOpacity=".22"
                        />
                        <stop offset="1" stopColor="#007AFF" stopOpacity="0" />
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
                        background: "#FFFFFF",
                        color: "#171D26",
                        border: "1px solid #D7DADF",
                        borderRadius: 12,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#007AFF"
                      strokeWidth={3}
                      fill="url(#fill)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="panel summary">
                <PanelHead title="خلاصه ماه" sub="شهریور ۱۴۰۵" />
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
                trades={monthTrades.filter(
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
                            "trade-icon " + (Number(t.pnl) >= 0 ? "up" : "dn")
                          }
                        >
                          {Number(t.pnl) >= 0 ? (
                            <TrendingUp />
                          ) : (
                            <TrendingDown />
                          )}
                        </span>
                        <span>
                          <b>{t.market}</b>
                          <small>
                            {t.side === "Long" ? "خرید" : "فروش"} ·{" "}
                            {faDigits(t.date)}
                          </small>
                        </span>
                        <em className={Number(t.pnl) >= 0 ? "green" : "red"}>
                          {money(t.pnl)}
                        </em>
                      </button>
                    ))}
                </div>
              </div>
              <div className="panel insight">
                <div className="bulb">💡</div>
                <span>بینش هوشمند</span>
                <h3>بهترین عملکردت در سشن لندن بوده</h3>
                <p>
                  نرخ برد شما بین ساعت ۱۱ تا ۱۴، حدود ۲۳٪ بیشتر از میانگین است.
                </p>
                <button>
                  مشاهده تحلیل کامل <ChevronLeft />
                </button>
              </div>
            </section>
          </div>
          {view === "calendar" && (
            <JournalPage
              month={month}
              setMonth={setMonth}
              trades={trades}
              query={query}
              onDay={openDay}
              onTrade={setModal}
            />
          )}
          {view === "analytics" && (
            <AnalyticsPage
              trades={trades}
              equity={equity}
              winrate={winrate}
              total={total}
              profitFactor={profitFactor}
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
              clearTrades={() => setTrades([])}
              theme={theme}
              setTheme={setTheme}
              language={language}
              setLanguage={setLanguage}
            />
          )}
        </div>
      </main>
      {modal && (
        <TradeModal
          trade={modal}
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
      {mobileNav && (
        <div className="scrim" onClick={() => setMobileNav(false)} />
      )}
    </div>
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

function JournalPage({ month, setMonth, trades, query, onDay, onTrade }) {
  const visible = trades.filter((t) => {
    const d = new Date(t.date + "T12:00");
    const inMonth =
      d.getMonth() === month.getMonth() &&
      d.getFullYear() === month.getFullYear();
    return (
      inMonth &&
      (!query ||
        [t.market, t.setup, t.notes].some((x) =>
          String(x || "")
            .toLowerCase()
            .includes(query.toLowerCase()),
        ))
    );
  });
  return (
    <div className="view-page">
      <PageTitle
        eyebrow="ژورنال"
        title="همه معاملات، یک‌جا"
        text="روزهای معاملاتی را مرور، جستجو و ویرایش کن."
      />
      <section className="panel calendar journal-calendar">
        <div className="cal-head">
          <PanelHead
            title="تقویم ماهانه"
            sub={`${faDigits(visible.length)} معامله در این ماه`}
          />
          <MonthNav month={month} setMonth={setMonth} />
        </div>
        <Calendar
          month={month}
          trades={visible}
          onDay={onDay}
          onTrade={onTrade}
        />
      </section>
      <section className="panel journal-table">
        <PanelHead
          title="لیست معاملات"
          sub="برای مشاهده جزئیات روی هر ردیف کلیک کنید"
        />
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>تاریخ</th>
                <th>بازار</th>
                <th>نوع</th>
                <th>ستاپ</th>
                <th>ریسک</th>
                <th>نتیجه</th>
              </tr>
            </thead>
            <tbody>
              {visible.length ? (
                [...visible]
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((t) => (
                    <tr key={t.id} onClick={() => onTrade(t)}>
                      <td data-label="تاریخ">{faDigits(t.date)}</td>
                      <td data-label="بازار" dir="ltr">
                        {t.market}
                      </td>
                      <td data-label="نوع">
                        <span
                          className={
                            t.side === "Long" ? "tag-long" : "tag-short"
                          }
                        >
                          {t.side}
                        </span>
                      </td>
                      <td data-label="ستاپ">{t.setup || "—"}</td>
                      <td data-label="ریسک">
                        {money(-Math.abs(Number(t.risk || 0)))}
                      </td>
                      <td
                        data-label="نتیجه"
                        className={Number(t.pnl) >= 0 ? "green" : "red"}
                      >
                        {money(t.pnl)}
                      </td>
                    </tr>
                  ))
              ) : (
                <tr>
                  <td colSpan="6" className="empty-state">
                    معامله‌ای برای این ماه ثبت نشده است.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function MonthNav({ month, setMonth }) {
  return (
    <div className="month-nav">
      <button
        onClick={() =>
          setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))
        }
      >
        <ChevronRight />
      </button>
      <b>
        {monthNames[month.getMonth()]} {faDigits(month.getFullYear())}
      </b>
      <button
        onClick={() =>
          setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))
        }
      >
        <ChevronLeft />
      </button>
    </div>
  );
}

function AnalyticsPage({ trades, equity, winrate, total, profitFactor }) {
  const byMarket = Object.values(
    trades.reduce((a, t) => {
      a[t.market] ||= { name: t.market, pnl: 0, count: 0 };
      a[t.market].pnl += Number(t.pnl);
      a[t.market].count++;
      return a;
    }, {}),
  ).sort((a, b) => b.pnl - a.pnl);
  const bySetup = Object.values(
    trades.reduce((a, t) => {
      const k = t.setup || "بدون ستاپ";
      a[k] ||= { name: k, pnl: 0, count: 0 };
      a[k].pnl += Number(t.pnl);
      a[k].count++;
      return a;
    }, {}),
  ).sort((a, b) => b.pnl - a.pnl);
  const max = Math.max(1, ...byMarket.map((x) => Math.abs(x.pnl)));
  const long = trades.filter((t) => t.side === "Long"),
    short = trades.filter((t) => t.side === "Short");
  const sum = (x) => x.reduce((s, t) => s + Number(t.pnl), 0);
  return (
    <div className="view-page">
      <PageTitle
        eyebrow="تحلیل عملکرد"
        title="اعداد، داستان معاملاتت را می‌گویند"
        text="تمام گزارش‌ها مستقیماً از معاملات ثبت‌شده محاسبه شده‌اند."
      />
      <section className="stats analytic-stats">
        <Stat
          icon={TrendingUp}
          label="سود خالص ماه"
          value={money(total)}
          detail="خالص نتایج"
        />
        <Stat
          icon={Target}
          label="نرخ برد"
          value={faDigits(winrate) + "٪"}
          detail="در ماه انتخابی"
        />
        <Stat
          icon={BarChart3}
          label="Profit Factor"
          value={profitFactor.toFixed(2)}
          detail="سود ناخالص ÷ زیان ناخالص"
        />
        <Stat
          icon={Clock3}
          label="کل معاملات"
          value={faDigits(trades.length)}
          detail="تمام دوره"
        />
      </section>
      <section className="grid-top">
        <div className="panel">
          <PanelHead title="منحنی موجودی" sub="روند عملکرد حساب" />
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={equity}>
              <CartesianGrid stroke="#EBEDEF" vertical={false} />
              <XAxis dataKey="name" stroke="#89909A" />
              <YAxis stroke="#89909A" />
              <Tooltip
                contentStyle={{
                  background: "#FFFFFF",
                  color: "#171D26",
                  border: "1px solid #D7DADF",
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#007AFF"
                fill="#007AFF20"
                strokeWidth={3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="panel">
          <PanelHead title="جهت معاملات" sub="عملکرد خرید و فروش" />
          <div className="direction-cards">
            <div>
              <span>Long</span>
              <b className={sum(long) >= 0 ? "green" : "red"}>
                {money(sum(long))}
              </b>
              <small>{faDigits(long.length)} معامله</small>
            </div>
            <div>
              <span>Short</span>
              <b className={sum(short) >= 0 ? "green" : "red"}>
                {money(sum(short))}
              </b>
              <small>{faDigits(short.length)} معامله</small>
            </div>
          </div>
        </div>
      </section>
      <section className="analytics-grid">
        <div className="panel">
          <PanelHead title="عملکرد بازارها" sub="سود و زیان به تفکیک نماد" />
          <div className="bar-list">
            {byMarket.map((x) => (
              <div key={x.name}>
                <span dir="ltr">{x.name}</span>
                <div>
                  <i
                    className={x.pnl >= 0 ? "pos" : "neg"}
                    style={{
                      width: `${Math.max(5, (Math.abs(x.pnl) / max) * 100)}%`,
                    }}
                  />
                </div>
                <b className={x.pnl >= 0 ? "green" : "red"}>{money(x.pnl)}</b>
              </div>
            ))}
          </div>
        </div>
        <div className="panel">
          <PanelHead
            title="بهترین ستاپ‌ها"
            sub="رتبه‌بندی استراتژی‌های ثبت‌شده"
          />
          <div className="rank-list">
            {bySetup.map((x, i) => (
              <div key={x.name}>
                <em>{faDigits(i + 1)}</em>
                <span>
                  <b>{x.name}</b>
                  <small>{faDigits(x.count)} معامله</small>
                </span>
                <strong className={x.pnl >= 0 ? "green" : "red"}>
                  {money(x.pnl)}
                </strong>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function PlaybookPage({ plan, setPlan }) {
  const [rule, setRule] = useState("");
  const put = (k, v) => setPlan((p) => ({ ...p, [k]: v }));
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
              <label key={i}>
                <input type="checkbox" />
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
        <span>وضعیت آمادگی امروز</span>
        <h3>قبل از اولین معامله، تمام قوانین را علامت بزن</h3>
        <p>
          داشتن پلن مشخص تصمیم‌های هیجانی را کمتر می‌کند و باعث ثبات عملکرد
          می‌شود.
        </p>
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
  clearTrades,
  theme,
  setTheme,
  language,
  setLanguage,
}) {
  const exportData = () => {
    const blob = new Blob(
      [JSON.stringify({ profile, balance, trades }, null, 2)],
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
            موجودی حساب
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
            sub={`${faDigits(trades.length)} معامله ذخیره‌شده`}
          />
          <button onClick={exportData}>
            دریافت نسخه پشتیبان JSON <ChevronLeft />
          </button>
          <div className="danger-zone">
            <b>پاک‌کردن معاملات</b>
            <p>
              این کار تمام معاملات ثبت‌شده را حذف می‌کند و قابل بازگشت نیست.
            </p>
            <button
              onClick={() =>
                window.confirm("همه معاملات حذف شوند؟") && clearTrades()
              }
            >
              <Trash2 />
              حذف همه معاملات
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({ icon: I, label, value, delta, detail, editable, onChange }) {
  return (
    <div className="stat">
      <div className="stat-top">
        <span className="stat-icon">
          <I />
        </span>
        <Spark down={false} />
      </div>
      <small>{label}</small>
      {editable ? (
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
function DayTradesModal({ date, trades, onClose, onAdd, onEdit }) {
  const total = trades.reduce((sum, trade) => sum + Number(trade.pnl || 0), 0);
  return (
    <div
      className="modal-wrap"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className="modal day-trades-modal">
        <div className="modal-head">
          <div>
            <span>معاملات روز</span>
            <h2>{faDigits(date)}</h2>
            <p>
              {faDigits(trades.length)} معامله · نتیجه کل {money(total)}
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
                  Number(trade.pnl) >= 0 ? "trade-icon up" : "trade-icon dn"
                }
              >
                {Number(trade.pnl) >= 0 ? <TrendingUp /> : <TrendingDown />}
              </span>
              <span>
                <small>معامله {faDigits(index + 1)}</small>
                <b dir="ltr">{trade.market}</b>
                <em>
                  {trade.side === "Long" ? "خرید" : "فروش"} ·{" "}
                  {trade.setup || "بدون ستاپ"}
                </em>
              </span>
              <strong className={Number(trade.pnl) >= 0 ? "green" : "red"}>
                {money(trade.pnl)}
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
            p = ts.reduce((s, t) => s + Number(t.pnl || 0), 0);
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
                      : "flat"
                  : "") +
                (ts[0]?.image ? " has-image" : "")
              }
              onClick={() => onDay(ds, ts)}
            >
              {ts[0]?.image && (
                <img
                  className="day-image"
                  src={ts[0].image}
                  alt="چارت معامله"
                />
              )}
              <span className="daynum">{faDigits(d)}</span>
              {ts.length ? (
                <>
                  <div className="day-market">
                    {ts[0].market}
                    <small>{ts[0].side === "Long" ? "خرید" : "فروش"}</small>
                  </div>
                  <b className="day-pnl">{money(p)}</b>
                  {ts.length > 1 && (
                    <em className="trade-count">
                      {faDigits(ts.length)} معامله
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
          <i />
          بدون معامله
        </span>
        <em>برای ثبت یا مشاهده معامله روی روز مورد نظر کلیک کنید</em>
      </div>
    </>
  );
}
function TradeModal({ trade, onSave, onDelete, onClose }) {
  const [f, setF] = useState(trade);
  const put = (k, v) => setF((x) => ({ ...x, [k]: v }));
  function image(e) {
    const file = e.target.files[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = () => put("image", r.result);
    r.readAsDataURL(file);
  }
  return (
    <div
      className="modal-wrap"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <form
        className="modal"
        onSubmit={(e) => {
          e.preventDefault();
          onSave({ ...f, pnl: Number(f.pnl), risk: Number(f.risk) });
        }}
      >
        <div className="modal-head">
          <div>
            <span>ثبت در ژورنال</span>
            <h2>{trade.id ? "ویرایش معامله" : "معامله جدید"}</h2>
            <p>{faDigits(f.date)} · اطلاعات معامله را دقیق وارد کنید</p>
          </div>
          <button type="button" onClick={onClose}>
            <X />
          </button>
        </div>
        <div className="modal-body">
          <label className="wide upload">
            {f.image ? (
              <img src={f.image} />
            ) : (
              <>
                <ImagePlus />
                <b>اسکرین‌شات چارت</b>
                <small>برای انتخاب تصویر کلیک کنید</small>
              </>
            )}
            <input type="file" accept="image/*" onChange={image} />
          </label>
          <div className="form-grid">
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
              نوع پوزیشن
              <select
                value={f.side}
                onChange={(e) => put("side", e.target.value)}
              >
                <option value="Long">Long — خرید</option>
                <option value="Short">Short — فروش</option>
              </select>
            </label>
            <label>
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
            </label>
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
              یادداشت معامله
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
          <button className="primary">ذخیره معامله</button>
        </div>
      </form>
    </div>
  );
}
createRoot(document.getElementById("root")).render(<App />);

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`));
}
