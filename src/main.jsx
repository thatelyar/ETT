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
  Flame,
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
  cloudEnabled,
  loadCloudData,
  saveCloudSettings,
  saveCloudTrades,
  supabase,
} from "./supabase";
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

async function prepareTradeImage(file) {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await loadImage(objectUrl);
    const maxSide = 1600;
    const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.78));
    if (!blob) throw new Error("Image conversion failed");
    return await fileToDataUrl(blob);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

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
  "دانلود عکس": "Download image",
  "جستجو در معاملات...": "Search trades...",
  "موجودی حساب": "Account balance",
  "موجودی فعلی": "Current balance",
  "سرمایه اولیه": "Initial balance",
  "سود و زیان کل": "Total P&L",
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
  "میز کار حرفه‌ای معامله‌گر": "Professional trading workspace",
  "برآیند ماهت مثبت است؛ کیفیت اجرا را حفظ کن.": "Your month is positive; protect execution quality.",
  "روی کنترل ریسک و اجرای بدون هیجان تمرکز کن.": "Focus on risk control and calm execution.",
  "محاسبه ریسک": "Risk calculator",
  "ماشین حساب ریسک": "Risk calculator",
  "همگام و امن": "Synced & secure",
  "در حال ذخیره": "Saving",
  "ذخیره محلی": "Saved locally",
  "امتیاز عملکرد": "Performance score",
  "لبهٔ قوی": "Strong edge",
  "رو به رشد": "Improving",
  "در حال ساخت": "Building your edge",
  "ترکیبی از نرخ برد، سوددهی و نظم ژورنال‌نویسی": "A blend of win rate, profitability, and journal consistency",
  "امید ریاضی هر معامله": "Trade expectancy",
  "بازده به ریسک واقعی": "Realized risk return",
  "بیشترین افت ماه": "Monthly max drawdown",
  "محاسبه حجم معامله": "Calculate position size",
  "کوچ هوشمند": "Smart coach",
  "امید ریاضی": "Expectancy",
  "میانگین خروجی هر معامله": "Average outcome per trade",
  "توان جبران افت سرمایه": "Drawdown recovery strength",
  "بازده کل": "Total return",
  "نسبت به سرمایه اولیه": "Relative to starting balance",
  "ماشین حساب حجم و ریسک": "Position size & risk calculator",
  "قبل از ورود، اندازه پوزیشن و نسبت سود به ضرر را دقیق ببین.": "Size the position and preview reward-to-risk before entry.",
  "حجم پیشنهادی": "Suggested position size",
  "واحد دارایی بر اساس فاصله حد ضرر": "Asset units based on stop distance",
  "سرمایه در معرض ریسک": "Capital at risk",
  "سود بالقوه": "Potential reward",
  "بدون تغییر در اطلاعاتت": "Your data stays unchanged",
  "این ابزار فقط محاسبه می‌کند و چیزی در ژورنال یا دیتابیس ذخیره نمی‌کند.": "This tool only calculates and saves nothing to your journal or database.",
  "متوجه شدم": "Done",
  "برای اجرای پلن آماده‌ای": "You're ready to execute the plan",
  "چک‌لیست کامل است؛ ریسک تعریف‌شده را حفظ کن.": "Checklist complete. Keep risk within the plan.",
  "باز کردن منوی کناری": "Open sidebar",
  "بستن منوی کناری": "Close sidebar",
  "باز کردن منوی کناری (⌘B)": "Open sidebar (⌘B)",
  "بستن منوی کناری (⌘B)": "Close sidebar (⌘B)",
});
const toLatinDigits = (value) =>
  value.replace(/[۰-۹]/g, (d) => "0123456789"["۰۱۲۳۴۵۶۷۸۹".indexOf(d)]);
function dynamicEnglish(value) {
  let out = enMap[value] || value;
  out = out
    .replace(/سلام (.+)، امروز با پلن جلو می‌ریم\./g, "Hi $1, let's trade the plan today.")
    .replace(/(.+) لبهٔ معاملاتی این ماه توست/g, "$1 is your edge this month")
    .replace(/(\S+) معامله با نرخ برد (\S+)٪ و نتیجهٔ (.+) ثبت شده است\./g, "$1 trades at a $2% win rate, returning $3.")
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
  const [accountBalance, setAccountBalance] = useState(() =>
    Number(localStorage.getItem("tradeflow_balance") || 0),
  );
  const [view, setView] = useState("dashboard");
  const [month, setMonth] = useState(new Date(2026, 8, 1));
  const [modal, setModal] = useState(null);
  const [daySheet, setDaySheet] = useState(null);
  const [riskCalculatorOpen, setRiskCalculatorOpen] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem("tradeflow_sidebar_collapsed") === "true",
  );
  const [query, setQuery] = useState("");
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
    } catch (error) {
      // Large screenshots can exceed Safari's small localStorage quota. Cloud
      // sync still keeps the image; the lightweight local copy prevents a crash.
      console.warn("Local trade cache exceeded its quota", error);
      try {
        localStorage.setItem(
          "tradeflow_trades",
          JSON.stringify(trades.map((trade) => ({ ...trade, image: "" }))),
        );
      } catch (fallbackError) {
        console.warn("Unable to update the local trade cache", fallbackError);
      }
    }
  }, [trades]);
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
      .then(async ({ settings, trades: remoteTrades }) => {
        if (!active) return;
        const hasLocalTrades = localStorage.getItem("tradeflow_trades") !== null;
        const hasRemoteData = Boolean(settings || remoteTrades.length);
        if (hasRemoteData) {
          setTrades(remoteTrades);
          if (settings) {
            setProfile(settings.profile);
            setAccountBalance(Number(settings.balance || 0));
            setPlan(settings.plan);
          }
        } else if (hasLocalTrades) {
          await Promise.all([
            saveCloudSettings(session.user.id, { profile, balance: accountBalance, plan }),
            saveCloudTrades(session.user.id, trades),
          ]);
        } else {
          setTrades([]);
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
    if (!cloudEnabled || !cloudReady || !session?.user?.id) return;
    setCloudState("saving");
    const timer = window.setTimeout(() => {
      Promise.all([
        saveCloudSettings(session.user.id, { profile, balance: accountBalance, plan }),
        saveCloudTrades(session.user.id, trades),
      ])
        .then(() => setCloudState("synced"))
        .catch((error) => {
          console.error(error);
          setCloudState("error");
        });
    }, 700);
    return () => window.clearTimeout(timer);
  }, [trades, accountBalance, profile, plan, cloudReady, session?.user?.id]);
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
  const allTimePnl = trades.reduce((sum, trade) => sum + Number(trade.pnl || 0), 0);
  const currentBalance = accountBalance + allTimePnl;
  const equity = useMemo(() => {
    const monthStart = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-01`;
    const previousPnl = trades
      .filter((trade) => trade.date < monthStart)
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
  const journalStreak = useMemo(() => getJournalStreak(trades), [trades]);
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
  async function logout() {
    await supabase?.auth.signOut();
    ["tradeflow_trades", "tradeflow_balance", "tradeflow_profile", "tradeflow_plan", "tradeflow_cloud_owner"].forEach((key) => localStorage.removeItem(key));
    window.location.reload();
  }
  const nav = [
    ["dashboard", "نمای کلی", LayoutDashboard],
    ["calendar", "ژورنال معاملاتی", CalendarDays],
    ["analytics", "تحلیل عملکرد", BarChart3],
    ["playbook", "پلن معاملاتی", BookOpen],
  ];
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
      <aside className={mobileNav ? "open" : ""}>
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
      <main>
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
              placeholder="جستجو در معاملات..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
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
              clearTrades={() => setTrades([])}
              theme={theme}
              setTheme={setTheme}
              language={language}
              setLanguage={setLanguage}
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
      {mobileNav && (
        <div className="scrim" onClick={() => setMobileNav(false)} />
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

function AnalyticsPage({ trades, equity, winrate, total, profitFactor, accountBalance }) {
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
  const averageWin = trades.filter((trade) => Number(trade.pnl) > 0);
  const averageLoss = trades.filter((trade) => Number(trade.pnl) < 0);
  const avgWin = averageWin.length ? sum(averageWin) / averageWin.length : 0;
  const avgLoss = averageLoss.length ? Math.abs(sum(averageLoss) / averageLoss.length) : 0;
  const payoffRatio = avgLoss ? avgWin / avgLoss : 0;
  const expectancy = trades.length ? sum(trades) / trades.length : 0;
  const maxDrawdown = getMaxDrawdown(equity);
  const recoveryFactor = maxDrawdown ? Math.max(0, total) / maxDrawdown : 0;
  const returnPercent = accountBalance ? (sum(trades) / accountBalance) * 100 : 0;
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
      <section className="pro-metrics">
        <div><span><BrainCircuit /> امید ریاضی</span><b className={expectancy >= 0 ? "green" : "red"}>{money(expectancy)}</b><small>میانگین خروجی هر معامله</small></div>
        <div><span><Award /> Payoff ratio</span><b>{payoffRatio.toFixed(2)}</b><small>میانگین برد ÷ میانگین باخت</small></div>
        <div><span><ShieldCheck /> Recovery factor</span><b>{recoveryFactor.toFixed(2)}</b><small>توان جبران افت سرمایه</small></div>
        <div><span><Activity /> بازده کل</span><b className={returnPercent >= 0 ? "green" : "red"}>{returnPercent.toFixed(2)}%</b><small>نسبت به سرمایه اولیه</small></div>
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
  clearTrades,
  theme,
  setTheme,
  language,
  setLanguage,
  session,
  cloudState,
  onLogout,
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
            sub={`${faDigits(trades.length)} معامله ذخیره‌شده`}
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

function TradeModal({ trade, onSave, onDelete, onClose }) {
  const [f, setF] = useState(trade);
  const [imageBusy, setImageBusy] = useState(false);
  const [imageError, setImageError] = useState("");
  const put = (k, v) => setF((x) => ({ ...x, [k]: v }));
  async function image(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImageBusy(true);
    setImageError("");
    try {
      put("image", await prepareTradeImage(file));
    } catch (error) {
      console.error(error);
      setImageError("این تصویر قابل پردازش نیست؛ لطفاً یک تصویر JPG یا PNG انتخاب کنید.");
    } finally {
      setImageBusy(false);
      e.target.value = "";
    }
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
          <div className="wide upload-wrap">
            <label className="upload">
              {f.image ? (
                <img src={f.image} alt="اسکرین‌شات چارت معامله" />
              ) : (
                <>
                  <ImagePlus />
                  <b>{imageBusy ? "در حال آماده‌سازی تصویر…" : "اسکرین‌شات چارت"}</b>
                  <small>{imageBusy ? "چند لحظه صبر کنید" : "برای انتخاب تصویر کلیک کنید"}</small>
                </>
              )}
              <input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" onChange={image} disabled={imageBusy} />
            </label>
            {f.image && (
              <a
                className="image-download"
                href={f.image}
                download={`ETT-${f.date}-${String(f.market || "trade").replace(/[^a-zA-Z0-9_-]/g, "-")}.png`}
                onClick={(event) => event.stopPropagation()}
              >
                <Download />
                <span>دانلود عکس</span>
              </a>
            )}
          </div>
          {imageError && <p className="image-error">{imageError}</p>}
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
          <button className="primary" disabled={imageBusy}>ذخیره معامله</button>
        </div>
      </form>
    </div>
  );
}
createRoot(document.getElementById("root")).render(<App />);

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`));
}
