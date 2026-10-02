import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, Award, BarChart3, BookOpen, BrainCircuit, CalendarDays, ChevronLeft, ChevronRight, CircleDollarSign, Clock3, Download, FlaskConical, Plus, ShieldCheck, Target, TrendingUp, Upload } from "lucide-react";
import { createBacktestBackup } from "./backtestBackup.mjs";

export function createJournalViews({ faDigits, money, monthNames, getMaxDrawdown, PageTitle, PanelHead, Calendar, Stat }) {
function BacktestPage({ month, setMonth, trades, query, plan, setPlan, language, onDay, onTrade, onAdd, onImport, importBusy, importStatus, cloudConnected }) {
  const [tab, setTab] = useState("journal");
  const balance = Number(plan.backtestBalance || 0);
  const total = trades.reduce((sum, trade) => sum + Number(trade.pnl || 0), 0);
  const winners = trades.filter((trade) => Number(trade.pnl) > 0);
  const losers = trades.filter((trade) => Number(trade.pnl) < 0);
  const winrate = trades.length ? Math.round(winners.length / trades.length * 100) : 0;
  const grossProfit = winners.reduce((sum, trade) => sum + Number(trade.pnl), 0);
  const grossLoss = Math.abs(losers.reduce((sum, trade) => sum + Number(trade.pnl), 0));
  const profitFactor = grossLoss ? grossProfit / grossLoss : grossProfit || 0;
  const equity = useMemo(() => {
    let value = balance;
    return [{ name: "شروع", value }, ...[...trades]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((trade) => ({ name: faDigits(trade.date.slice(5)), value: (value += Number(trade.pnl || 0)) }))];
  }, [trades, balance]);
  const downloadBackup = () => {
    const blob = new Blob([JSON.stringify(createBacktestBackup(trades, balance))], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `ETT-backtest-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(link.href), 60_000);
  };
  return (
    <div className="backtest-workspace">
      <PageTitle
        eyebrow={language === "fa" ? "فضای مستقل" : "SEPARATE WORKSPACE"}
        title={language === "fa" ? "آزمایشگاه بک‌تست" : "Backtest workspace"}
        text={language === "fa" ? "استراتژی‌ات را روی داده‌های گذشته ثبت و تحلیل کن. نتایج این بخش وارد حساب لایو نمی‌شوند." : "Record and analyze historical tests. These results stay separate from your live account."}
      />
      <div className="backtest-toolbar">
        <div className="backtest-mode-pill"><FlaskConical /> {language === "fa" ? "فقط معاملات بک‌تست" : "Backtest trades only"}</div>
        <div className="backtest-toolbar-actions">
          <button type="button" className="backtest-backup" onClick={downloadBackup}><Download /> {language === "fa" ? "دانلود بک‌تست و عکس‌ها" : "Download trades & photos"}</button>
          <label className={`backtest-backup backtest-import ${importBusy ? "busy" : ""}`}><Upload /> {importBusy ? (language === "fa" ? "در حال بازیابی..." : "Restoring...") : (language === "fa" ? "آپلود و بازیابی" : "Upload & restore")}
            <input type="file" accept=".json,application/json" disabled={importBusy} onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onImport(file);
              event.target.value = "";
            }} />
          </label>
          <button type="button" className="primary backtest-add" onClick={onAdd}><Plus /> {language === "fa" ? "ثبت معامله بک‌تست" : "Add backtest trade"}</button>
        </div>
      </div>
      <p className="backtest-transfer-hint">{language === "fa"
        ? `فایل دانلودی همهٔ مشخصات و عکس‌های هر معامله را دارد. بعداً همین فایل را اینجا آپلود کن تا بدون دست‌زدن به معاملات لایو بازیابی شود.${cloudConnected ? " اکنون بازیابی در پایگاه‌داده هم ذخیره می‌شود." : " تا زمان اتصال پایگاه‌داده، فایل را نزد خودت نگه دار."}`
        : `The download includes every trade and photo. Upload it here later to restore your backtest without affecting live trades.${cloudConnected ? " Restored trades are saved to the database." : " Keep the file until the database is connected."}`}</p>
      {importStatus && <p className={`backtest-import-status ${importStatus.type}`} role="status">{importStatus.message}</p>}
      <section className="backtest-summary-grid">
        <div className="backtest-summary-card"><span><BookOpen /> {language === "fa" ? "معاملات ثبت‌شده" : "Recorded trades"}</span><b>{faDigits(trades.length)}</b><small>{language === "fa" ? "فقط در فضای بک‌تست" : "Backtest only"}</small></div>
        <div className="backtest-summary-card"><span><Target /> {language === "fa" ? "نرخ برد" : "Win rate"}</span><b>{faDigits(winrate)}٪</b><small>{language === "fa" ? "کل معاملات آزمایشی" : "All simulated trades"}</small></div>
        <div className="backtest-summary-card"><span><TrendingUp /> {language === "fa" ? "نتیجهٔ کل" : "Total result"}</span><b className={total >= 0 ? "green" : "red"}>{money(total)}</b><small>{language === "fa" ? "بدون تأثیر بر حساب لایو" : "No effect on live balance"}</small></div>
        <label className="backtest-summary-card backtest-balance"><span><CircleDollarSign /> {language === "fa" ? "سرمایهٔ فرضی" : "Simulated balance"}</span><div><span>$</span><input type="number" min="0" step="any" value={plan.backtestBalance ?? 0} onChange={(event) => setPlan((current) => ({ ...current, backtestBalance: Number(event.target.value) || 0 }))} /></div><small>{language === "fa" ? "برای محاسبهٔ منحنی و بازده" : "For the equity curve and return"}</small></label>
      </section>
      <div className="backtest-tabs" role="tablist" aria-label={language === "fa" ? "بخش‌های بک‌تست" : "Backtest sections"}>
        <button type="button" role="tab" aria-selected={tab === "journal"} className={tab === "journal" ? "active" : ""} onClick={() => setTab("journal")}><CalendarDays /> {language === "fa" ? "تقویم و ژورنال" : "Calendar & journal"}</button>
        <button type="button" role="tab" aria-selected={tab === "analytics"} className={tab === "analytics" ? "active" : ""} onClick={() => setTab("analytics")}><BarChart3 /> {language === "fa" ? "تحلیل بک‌تست" : "Backtest analytics"}</button>
      </div>
      {tab === "journal" ? (
        <JournalPage month={month} setMonth={setMonth} trades={trades} query={query} onDay={onDay} onTrade={onTrade} hideTitle />
      ) : (
        <AnalyticsPage trades={trades} equity={equity} winrate={winrate} total={total} profitFactor={profitFactor} accountBalance={balance} mode="backtest" hideTitle />
      )}
    </div>
  );
}

function JournalPage({ month, setMonth, trades, query, onDay, onTrade, hideTitle = false }) {
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
      {!hideTitle && <PageTitle
        eyebrow="ژورنال"
        title="همه معاملات، یک‌جا"
        text="روزهای معاملاتی را مرور، جستجو و ویرایش کن."
      />}
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

function AnalyticsPage({ trades, equity, winrate, total, profitFactor, accountBalance, mode = "live", hideTitle = false }) {
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
      {!hideTitle && <PageTitle
        eyebrow="تحلیل عملکرد"
        title="اعداد، داستان معاملاتت را می‌گویند"
        text="تمام گزارش‌ها مستقیماً از معاملات ثبت‌شده محاسبه شده‌اند."
      />}
      <section className="stats analytic-stats">
        <Stat
          icon={TrendingUp}
          label={mode === "backtest" ? "نتیجهٔ کل بک‌تست" : "سود خالص ماه"}
          value={money(total)}
          detail="خالص نتایج"
        />
        <Stat
          icon={Target}
          label="نرخ برد"
          value={faDigits(winrate) + "٪"}
          detail={mode === "backtest" ? "در همهٔ معاملات آزمایشی" : "در ماه انتخابی"}
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

return { BacktestPage, JournalPage, AnalyticsPage };
}
