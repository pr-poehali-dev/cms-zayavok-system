import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";

const API = "https://functions.poehali.dev/abf93478-da2a-429d-b057-f5e639ac5ae1";

// ─── Types ───────────────────────────────────────────────────────────────────

type Role = "user" | "engineer" | "manager" | "chief_engineer" | "admin";

interface User {
  id: number;
  name: string;
  role: Role;
  department: string;
  email: string;
  position?: string;
  phone?: string;
}

type ModuleId =
  | "dashboard" | "tickets" | "monitoring" | "ppr" | "inspections"
  | "reports" | "warehouse" | "crm" | "sales" | "calendar"
  | "mail" | "timekeeping" | "map" | "directories" | "admin";

interface NavItem {
  id: ModuleId;
  label: string;
  icon: string;
  roles: Role[];
  group: string;
}

interface Ticket {
  id: number;
  number: string;
  title: string;
  status: string;
  priority: string;
  system_type: string;
  due_date: string | null;
  created_at: string;
  client_name: string;
  engineer_name: string | null;
  engineer_id: number | null;
}

interface DashboardData {
  stats: { new: number; inwork: number; done_month: number; overdue: number; clients: number };
  engineers: Array<{ id: number; name: string; active_tasks: number }>;
  recent_tickets: Ticket[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<Role, string> = {
  user: "Пользователь",
  engineer: "Инженер",
  manager: "Руководитель",
  chief_engineer: "Гл. инженер",
  admin: "Администратор",
};

const ROLE_COLORS: Record<Role, string> = {
  user: "bg-gray-100 text-gray-700",
  engineer: "bg-blue-100 text-blue-700",
  manager: "bg-purple-100 text-purple-700",
  chief_engineer: "bg-orange-100 text-orange-700",
  admin: "bg-red-100 text-red-700",
};

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Дашборд", icon: "LayoutDashboard", roles: ["engineer", "manager", "chief_engineer", "admin"], group: "Главное" },
  { id: "tickets", label: "Заявки", icon: "FileText", roles: ["user", "engineer", "manager", "chief_engineer", "admin"], group: "Главное" },
  { id: "monitoring", label: "Мониторинг", icon: "Activity", roles: ["manager", "chief_engineer", "admin"], group: "Главное" },
  { id: "ppr", label: "ППР", icon: "Wrench", roles: ["chief_engineer", "admin"], group: "Планирование" },
  { id: "inspections", label: "Осмотры", icon: "Search", roles: ["chief_engineer", "admin"], group: "Планирование" },
  { id: "calendar", label: "Календарь", icon: "Calendar", roles: ["engineer", "manager", "chief_engineer", "admin"], group: "Планирование" },
  { id: "reports", label: "Отчёты", icon: "BarChart3", roles: ["manager", "chief_engineer", "admin"], group: "Аналитика" },
  { id: "warehouse", label: "Склад и ТМЦ", icon: "Package", roles: ["engineer", "manager", "admin"], group: "Ресурсы" },
  { id: "crm", label: "CRM", icon: "Users", roles: ["manager", "admin"], group: "Ресурсы" },
  { id: "sales", label: "Продажи", icon: "TrendingUp", roles: ["manager", "admin"], group: "Ресурсы" },
  { id: "timekeeping", label: "Учёт времени", icon: "Clock", roles: ["manager", "chief_engineer", "admin"], group: "HR" },
  { id: "mail", label: "Почта", icon: "Mail", roles: ["engineer", "manager", "chief_engineer", "admin"], group: "Коммуникации" },
  { id: "map", label: "Карта объектов", icon: "Map", roles: ["chief_engineer", "admin"], group: "Объекты" },
  { id: "directories", label: "Справочники", icon: "BookOpen", roles: ["chief_engineer", "admin"], group: "Настройки" },
  { id: "admin", label: "Администрирование", icon: "Settings", roles: ["admin"], group: "Настройки" },
];

// ─── API ──────────────────────────────────────────────────────────────────────

async function apiFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  return res.json();
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { label: string; cls: string }> = {
    new: { label: "Новая", cls: "badge-new" },
    inwork: { label: "В работе", cls: "badge-inwork" },
    done: { label: "Выполнена", cls: "badge-done" },
    closed: { label: "Закрыта", cls: "badge-closed" },
    planned: { label: "Запланировано", cls: "bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded font-medium" },
    active: { label: "Выполняется", cls: "badge-inwork" },
  };
  const s = map[status] || { label: status, cls: "badge-closed" };
  return <span className={s.cls}>{s.label}</span>;
};

const PriorityDot = ({ priority }: { priority: string }) => {
  const map: Record<string, { label: string; cls: string }> = {
    high: { label: "Высокий", cls: "text-red-600 font-semibold" },
    medium: { label: "Средний", cls: "text-amber-600 font-semibold" },
    low: { label: "Низкий", cls: "text-gray-400" },
  };
  const p = map[priority] || { label: priority, cls: "text-gray-400" };
  return <span className={`text-xs ${p.cls}`}>{p.label}</span>;
};

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ru-RU");
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );
}

// ─── Modules ──────────────────────────────────────────────────────────────────

function Dashboard({ user }: { user: User }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/dashboard").then(d => { setData(d); setLoading(false); });
  }, []);

  if (loading) return <Spinner />;
  if (!data) return null;

  const { stats, engineers, recent_tickets } = data;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Дашборд</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })} — оперативная сводка</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Новые заявки", value: stats.new, icon: "FileText", color: "text-blue-600", bg: "bg-blue-50" },
          { label: "В работе", value: stats.inwork, icon: "Wrench", color: "text-orange-600", bg: "bg-orange-50" },
          { label: "Выполнено (месяц)", value: stats.done_month, icon: "CheckCircle2", color: "text-green-600", bg: "bg-green-50" },
          { label: "Просрочено", value: stats.overdue, icon: "AlertTriangle", color: "text-red-600", bg: "bg-red-50" },
          { label: "Клиентов", value: stats.clients, icon: "Building2", color: "text-purple-600", bg: "bg-purple-50" },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{s.label}</p>
                <p className="text-2xl font-bold text-foreground mt-1">{s.value}</p>
              </div>
              <div className={`${s.bg} ${s.color} p-2.5 rounded-lg`}>
                <Icon name={s.icon} size={20} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-lg border border-border">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
            <h3 className="font-semibold text-sm">Последние заявки</h3>
          </div>
          <div className="divide-y divide-border">
            {recent_tickets.map((t) => (
              <div key={t.id} className="px-5 py-3 table-row-hover flex items-center gap-4 cursor-pointer">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-muted-foreground font-mono">{t.number}</span>
                    <StatusBadge status={t.status} />
                    <PriorityDot priority={t.priority} />
                  </div>
                  <p className="text-sm font-medium text-foreground mt-0.5 truncate">{t.title}</p>
                  <p className="text-xs text-muted-foreground">{t.client_name} · {t.system_type}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-muted-foreground">до {formatDate(t.due_date)}</p>
                  <p className="text-xs text-foreground mt-0.5">{t.engineer_name || "—"}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-border">
          <div className="px-5 py-3.5 border-b border-border">
            <h3 className="font-semibold text-sm">Загрузка инженеров</h3>
          </div>
          <div className="p-5 space-y-4">
            {engineers.map((eng, idx) => {
              const maxTasks = Math.max(...engineers.map(e => e.active_tasks), 1);
              const pct = (eng.active_tasks / (maxTasks * 1.2)) * 100;
              const colors = ["bg-blue-500", "bg-green-500", "bg-orange-500", "bg-purple-500", "bg-teal-500"];
              return (
                <div key={eng.id}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-medium text-foreground truncate max-w-[130px]">{eng.name.split(" ").slice(0, 2).join(" ")}</span>
                    <span className="text-muted-foreground shrink-0 ml-2">{eng.active_tasks} зав.</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${colors[idx % colors.length]} rounded-full`} style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="px-5 pb-4 pt-2 border-t border-border space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Сводка</p>
            {[
              { label: "Новые", count: stats.new, color: "bg-blue-600" },
              { label: "В работе", count: stats.inwork, color: "bg-orange-500" },
              { label: "Выполнено", count: stats.done_month, color: "bg-green-500" },
              { label: "Просрочено", count: stats.overdue, color: "bg-red-500" },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${s.color}`} />
                  <span>{s.label}</span>
                </div>
                <span className="font-semibold">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TicketsModule({ user }: { user: User }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [clients, setClients] = useState<Array<{ id: number; name: string }>>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", system_type: "Водоснабжение",
    priority: "medium", client_id: "", due_date: ""
  });

  const loadTickets = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter !== "all") params.set("status", filter);
    if (search) params.set("q", search);
    if (user.role === "engineer") params.set("engineer_id", String(user.id));
    apiFetch(`/tickets?${params}`).then(d => { setTickets(d.tickets || []); setLoading(false); });
  }, [filter, search, user]);

  useEffect(() => { loadTickets(); }, [loadTickets]);
  useEffect(() => {
    apiFetch("/clients").then(d => setClients(d.clients || []));
  }, []);

  const submitTicket = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    await apiFetch("/tickets", {
      method: "POST",
      body: JSON.stringify({
        ...form,
        client_id: form.client_id ? Number(form.client_id) : null,
        created_by: user.id,
        auto_assign: true,
      }),
    });
    setSaving(false);
    setShowNew(false);
    setForm({ title: "", description: "", system_type: "Водоснабжение", priority: "medium", client_id: "", due_date: "" });
    loadTickets();
  };

  const changeStatus = async (ticketId: number, status: string) => {
    await apiFetch(`/tickets/${ticketId}`, { method: "PATCH", body: JSON.stringify({ status }) });
    loadTickets();
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Заявки</h1>
          <p className="text-sm text-muted-foreground">Управление заявками на техническое обслуживание</p>
        </div>
        <button onClick={() => setShowNew(!showNew)} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm rounded-md hover:bg-primary/90 transition-colors">
          <Icon name="Plus" size={15} />
          {user.role === "user" ? "Подать заявку" : "Новая заявка"}
        </button>
      </div>

      {showNew && (
        <div className="bg-white border border-border rounded-lg p-5 animate-fade-in">
          <h3 className="font-semibold text-sm mb-4">Новая заявка</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs text-muted-foreground mb-1">Тема заявки *</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Кратко опишите проблему" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Система</label>
              <select value={form.system_type} onChange={e => setForm(f => ({ ...f, system_type: e.target.value }))}
                className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary bg-white">
                {["Водоснабжение", "Отопление", "Вентиляция", "Электроснабжение", "Пожарная безопасность", "Окна и двери", "Прочее"].map(s => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Приоритет</label>
              <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary bg-white">
                <option value="low">Низкий</option>
                <option value="medium">Средний</option>
                <option value="high">Высокий</option>
              </select>
            </div>
            {clients.length > 0 && (
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Клиент</label>
                <select value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}
                  className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary bg-white">
                  <option value="">— не выбран —</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Желаемый срок</label>
              <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-muted-foreground mb-1">Описание</label>
              <textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none" placeholder="Опишите проблему подробно..." />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={submitTicket} disabled={saving}
              className="px-4 py-2 bg-primary text-primary-foreground text-sm rounded hover:bg-primary/90 disabled:opacity-50">
              {saving ? "Отправляем..." : "Отправить"}
            </button>
            <button onClick={() => setShowNew(false)} className="px-4 py-2 bg-secondary text-foreground text-sm rounded hover:bg-secondary/80">Отмена</button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        {[
          { key: "all", label: "Все" },
          { key: "new", label: "Новые" },
          { key: "inwork", label: "В работе" },
          { key: "done", label: "Выполнено" },
          { key: "closed", label: "Закрыто" },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${filter === f.key ? "bg-primary text-primary-foreground" : "bg-white border border-border text-foreground hover:bg-secondary"}`}>
            {f.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <input value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === "Enter" && loadTickets()}
            className="border border-border rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary w-44" placeholder="Поиск..." />
        </div>
      </div>

      {loading ? <Spinner /> : (
        <div className="bg-white rounded-lg border border-border overflow-hidden">
          {tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="bg-secondary p-4 rounded-xl mb-3">
                <Icon name="FileText" size={28} className="text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">Заявок не найдено</p>
              <p className="text-xs text-muted-foreground mt-1">Попробуйте изменить фильтры</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary/60 border-b border-border">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">№</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Описание</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Клиент</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Статус</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Приоритет</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Инженер</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Срок</th>
                  {["manager", "chief_engineer", "admin", "engineer"].includes(user.role) && (
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Сменить</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tickets.map((t) => (
                  <tr key={t.id} className="table-row-hover cursor-pointer">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{t.number}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{t.title}</p>
                      <p className="text-xs text-muted-foreground">{t.system_type}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-foreground">{t.client_name || "—"}</td>
                    <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                    <td className="px-4 py-3"><PriorityDot priority={t.priority} /></td>
                    <td className="px-4 py-3 text-xs text-foreground">{t.engineer_name || "—"}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(t.due_date)}</td>
                    {["manager", "chief_engineer", "admin", "engineer"].includes(user.role) && (
                      <td className="px-4 py-3">
                        <select value={t.status} onChange={e => changeStatus(t.id, e.target.value)}
                          onClick={e => e.stopPropagation()}
                          className="border border-border rounded px-2 py-1 text-xs bg-white focus:outline-none">
                          <option value="new">Новая</option>
                          <option value="inwork">В работе</option>
                          <option value="done">Выполнена</option>
                          <option value="closed">Закрыта</option>
                        </select>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

function MonitoringModule({ user }: { user: User }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/tickets").then(d => { setTickets(d.tickets || []); setLoading(false); });
  }, []);

  const stats = {
    active: tickets.filter(t => ["new", "inwork"].includes(t.status)).length,
    overdue: tickets.filter(t => t.due_date && new Date(t.due_date) < new Date() && ["new", "inwork"].includes(t.status)).length,
    noEngineer: tickets.filter(t => !t.engineer_id && ["new", "inwork"].includes(t.status)).length,
    closed: tickets.filter(t => t.status === "closed").length,
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold">Мониторинг заявок</h1>
        <p className="text-sm text-muted-foreground">Состояние всех заявок в реальном времени</p>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Активных", value: stats.active, border: "border-l-blue-500" },
          { label: "Просрочено", value: stats.overdue, border: "border-l-red-500" },
          { label: "Без исполнителя", value: stats.noEngineer, border: "border-l-orange-500" },
          { label: "Закрыто всего", value: stats.closed, border: "border-l-green-500" },
        ].map((s, i) => (
          <div key={i} className={`bg-white border border-border border-l-4 ${s.border} rounded-lg p-4`}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
      {loading ? <Spinner /> : (
        <div className="bg-white rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-secondary/30 border-b border-border">
                {["№", "Заявка", "Клиент", "Система", "Статус", "Инженер", "Срок"].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tickets.map(t => (
                <tr key={t.id} className="table-row-hover">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{t.number}</td>
                  <td className="px-4 py-3 text-sm font-medium max-w-[200px] truncate">{t.title}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{t.client_name || "—"}</td>
                  <td className="px-4 py-3 text-xs">{t.system_type}</td>
                  <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                  <td className="px-4 py-3 text-xs">{t.engineer_name || "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(t.due_date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

interface PprItem { id: number; client_name: string; system_type: string; maintenance_type: string; date_start: string; date_end: string; engineer_name: string | null; status: string; }

function PPRModule() {
  const [items, setItems] = useState<PprItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/ppr").then(d => { setItems(d.ppr || []); setLoading(false); });
  }, []);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Планово-предупредительные ремонты</h1>
          <p className="text-sm text-muted-foreground">Графики ТО для каждого клиента</p>
        </div>
      </div>
      {loading ? <Spinner /> : (
        <div className="bg-white rounded-lg border border-border overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border bg-secondary/40">
            <h3 className="font-semibold text-sm">График ППР</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-secondary/30 border-b border-border">
                {["Клиент", "Система", "Вид ТО", "Дата начала", "Дата окончания", "Исполнитель", "Статус"].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map(p => (
                <tr key={p.id} className="table-row-hover">
                  <td className="px-4 py-3 text-sm font-medium">{p.client_name}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{p.system_type}</td>
                  <td className="px-4 py-3 text-xs">{p.maintenance_type}</td>
                  <td className="px-4 py-3 text-xs">{formatDate(p.date_start)}</td>
                  <td className="px-4 py-3 text-xs">{formatDate(p.date_end)}</td>
                  <td className="px-4 py-3 text-xs">{p.engineer_name || "—"}</td>
                  <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

interface WarehouseItem { id: number; name: string; category: string; unit: string; quantity: number; min_quantity: number; price: number; location: string; }

function WarehouseModule() {
  const [items, setItems] = useState<WarehouseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lowStock, setLowStock] = useState(0);

  useEffect(() => {
    apiFetch("/warehouse").then(d => { setItems(d.items || []); setLowStock(d.low_stock || 0); setLoading(false); });
  }, []);

  const totalValue = items.reduce((s, i) => s + Number(i.price) * Number(i.quantity), 0);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Склад и ТМЦ</h1>
          <p className="text-sm text-muted-foreground">Учёт материалов, расход, контроль запасов</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Позиций на складе", value: items.length, icon: "Package", color: "text-blue-600 bg-blue-50" },
          { label: "Ниже минимума", value: lowStock, icon: "AlertTriangle", color: "text-red-600 bg-red-50" },
          { label: "Стоимость склада", value: `₽ ${totalValue.toLocaleString("ru-RU")}`, icon: "Banknote", color: "text-green-600 bg-green-50" },
        ].map((s, i) => (
          <div key={i} className="stat-card flex items-center gap-4">
            <div className={`p-3 rounded-lg ${s.color}`}><Icon name={s.icon} size={22} /></div>
            <div>
              <p className="text-xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>
      {loading ? <Spinner /> : (
        <div className="bg-white rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-secondary/30 border-b border-border">
                {["Наименование", "Категория", "Ед.", "Кол-во", "Мин.", "Цена", "Место"].map((h, i) => (
                  <th key={h} className={`px-4 py-2.5 text-xs font-semibold text-muted-foreground ${i >= 3 ? "text-right" : "text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map(w => (
                <tr key={w.id} className="table-row-hover">
                  <td className="px-4 py-3 font-medium text-sm">{w.name}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{w.category}</td>
                  <td className="px-4 py-3 text-xs">{w.unit}</td>
                  <td className={`px-4 py-3 text-right text-sm font-bold ${Number(w.quantity) <= Number(w.min_quantity) ? "text-red-600" : "text-green-600"}`}>{Number(w.quantity)}</td>
                  <td className="px-4 py-3 text-right text-xs text-muted-foreground">{Number(w.min_quantity)}</td>
                  <td className="px-4 py-3 text-right text-xs font-mono">{Number(w.price)} ₽</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{w.location}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

interface Client { id: number; name: string; address: string; phone: string; email: string; contact_person: string; }

function DirectoriesModule() {
  const [users, setUsers] = useState<User[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadData = (key: string) => {
    if (active === key) { setActive(null); return; }
    setActive(key);
    setLoading(true);
    if (key === "users") apiFetch("/users").then(d => { setUsers(d.users || []); setLoading(false); });
    else if (key === "clients") apiFetch("/clients").then(d => { setClients(d.clients || []); setLoading(false); });
    else setLoading(false);
  };

  const dirs = [
    { id: "users", name: "Сотрудники", icon: "UserCheck", desc: "ФИО, должности, роли, контакты" },
    { id: "clients", name: "Контрагенты", icon: "Building", desc: "Клиенты, адреса, контактные лица" },
    { id: "systems", name: "Системы и оборудование", icon: "Cpu", desc: "Марки, состав, производительность" },
    { id: "works", name: "Виды работ", icon: "ClipboardList", desc: "Типы обслуживания и ремонтов" },
    { id: "structure", name: "Структура учреждения", icon: "Building2", desc: "Подразделения и отделы" },
    { id: "positions", name: "Должности", icon: "Briefcase", desc: "Справочник должностей" },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold">Справочники</h1>
        <p className="text-sm text-muted-foreground">Нормативно-справочная информация системы</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {dirs.map((d) => (
          <button key={d.id} onClick={() => loadData(d.id)}
            className={`bg-white border rounded-lg p-5 text-left transition-all hover:shadow-md ${active === d.id ? "border-primary ring-1 ring-primary" : "border-border"}`}>
            <div className="bg-primary/10 text-primary p-2.5 rounded-lg w-fit mb-3"><Icon name={d.icon} size={20} /></div>
            <h3 className="font-semibold text-sm text-foreground">{d.name}</h3>
            <p className="text-xs text-muted-foreground mt-1">{d.desc}</p>
          </button>
        ))}
      </div>

      {loading && <Spinner />}

      {active === "users" && !loading && users.length > 0 && (
        <div className="bg-white rounded-lg border border-border overflow-hidden animate-fade-in">
          <div className="px-5 py-3.5 border-b border-border">
            <h3 className="font-semibold text-sm">Сотрудники ({users.length})</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-secondary/40 border-b border-border">
                {["ФИО", "Роль", "Должность", "Подразделение", "Телефон", "Email"].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map(e => (
                <tr key={e.id} className="table-row-hover">
                  <td className="px-4 py-3 font-medium text-sm">{e.name}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${ROLE_COLORS[e.role as Role] || "bg-gray-100 text-gray-700"}`}>{ROLE_LABELS[e.role as Role] || e.role}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{e.position || "—"}</td>
                  <td className="px-4 py-3 text-xs">{e.department || "—"}</td>
                  <td className="px-4 py-3 text-xs font-mono">{e.phone || "—"}</td>
                  <td className="px-4 py-3 text-xs text-primary">{e.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {active === "clients" && !loading && clients.length > 0 && (
        <div className="bg-white rounded-lg border border-border overflow-hidden animate-fade-in">
          <div className="px-5 py-3.5 border-b border-border">
            <h3 className="font-semibold text-sm">Контрагенты ({clients.length})</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-secondary/40 border-b border-border">
                {["Название", "Адрес", "Телефон", "Email", "Контактное лицо"].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {clients.map((c) => (
                <tr key={c.id} className="table-row-hover">
                  <td className="px-4 py-3 font-medium text-sm">{c.name}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{c.address || "—"}</td>
                  <td className="px-4 py-3 text-xs font-mono">{c.phone || "—"}</td>
                  <td className="px-4 py-3 text-xs text-primary">{c.email || "—"}</td>
                  <td className="px-4 py-3 text-xs">{c.contact_person || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ReportsModule() {
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Отчёты</h1>
          <p className="text-sm text-muted-foreground">Свободно настраиваемые отчёты для руководителя</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[
          { name: "Заявки по исполнителям", type: "Таблица", period: "Март 2026", icon: "Table" },
          { name: "Расход ТМЦ по объектам", type: "График", period: "I квартал 2026", icon: "BarChart2" },
          { name: "KPI инженеров", type: "Сводная", period: "Март 2026", icon: "Target" },
          { name: "Просроченные заявки", type: "Таблица", period: "Неделя", icon: "AlertCircle" },
          { name: "ППР — план/факт", type: "График", period: "II кв. 2026", icon: "CalendarCheck" },
          { name: "Расходы на ТО", type: "Диаграмма", period: "Год", icon: "PieChart" },
        ].map((r, i) => (
          <div key={i} className="bg-white border border-border rounded-lg p-4 cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5">
            <div className="flex items-start gap-3 mb-3">
              <div className="bg-primary/10 text-primary p-2 rounded-lg"><Icon name={r.icon} size={18} /></div>
              <div>
                <h4 className="font-semibold text-sm text-foreground">{r.name}</h4>
                <p className="text-xs text-muted-foreground">{r.type} · {r.period}</p>
              </div>
            </div>
            <button className="w-full text-xs text-primary border border-primary/30 rounded py-1.5 hover:bg-primary/5">Открыть</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminModule({ user }: { user: User }) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/users").then(d => { setUsers(d.users || []); setLoading(false); });
  }, []);

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold">Администрирование</h1>
        <p className="text-sm text-muted-foreground">Полный доступ к настройкам системы</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-2">
        {[
          { title: "Настройка полей", icon: "Sliders", desc: "Конфигурация форм", color: "bg-purple-50 text-purple-600" },
          { title: "Уведомления", icon: "Bell", desc: "Email, SMS, push", color: "bg-orange-50 text-orange-600" },
          { title: "Автоназначение", icon: "Zap", desc: "Правила распределения", color: "bg-yellow-50 text-yellow-600" },
          { title: "Журнал действий", icon: "ScrollText", desc: "История операций", color: "bg-gray-50 text-gray-600" },
        ].map((item, i) => (
          <div key={i} className="bg-white border border-border rounded-lg p-5 cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5 group">
            <div className={`${item.color} p-3 rounded-xl w-fit mb-3 group-hover:scale-105 transition-transform`}>
              <Icon name={item.icon} size={22} />
            </div>
            <h3 className="font-semibold text-sm">{item.title}</h3>
            <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-lg border border-border overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-sm">Пользователи системы</h3>
          <span className="text-xs text-muted-foreground">{users.length} пользователей</span>
        </div>
        {loading ? <Spinner /> : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-secondary/40 border-b border-border">
                {["ФИО", "Email", "Роль", "Должность", "Подразделение", "Телефон"].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map(u => (
                <tr key={u.id} className="table-row-hover">
                  <td className="px-4 py-3 font-medium text-sm">{u.name}</td>
                  <td className="px-4 py-3 text-xs text-primary">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${ROLE_COLORS[u.role as Role] || "bg-gray-100"}`}>{ROLE_LABELS[u.role as Role] || u.role}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{u.position || "—"}</td>
                  <td className="px-4 py-3 text-xs">{u.department || "—"}</td>
                  <td className="px-4 py-3 text-xs font-mono">{u.phone || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function PlaceholderModule({ title, desc, icon }: { title: string; desc: string; icon: string }) {
  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
      <div className="bg-white border border-border rounded-lg flex flex-col items-center justify-center py-20 text-center">
        <div className="bg-primary/10 text-primary p-5 rounded-2xl mb-4">
          <Icon name={icon} size={36} />
        </div>
        <h3 className="text-base font-semibold mb-2">Модуль «{title}»</h3>
        <p className="text-sm text-muted-foreground max-w-xs">Модуль будет настроен на следующем этапе разработки</p>
      </div>
    </div>
  );
}

// ─── Login ────────────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: (user: User, token: string) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { setError("Введите email и пароль"); return; }
    setLoading(true);
    setError("");
    const data = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    });
    setLoading(false);
    if (data.error) { setError(data.error); return; }
    onLogin(data.user, data.token);
  };

  const DEMO_ACCOUNTS = [
    { name: "Иванов А.П.", email: "ivanov@techservice.ru", role: "admin" as Role },
    { name: "Петрова М.С.", email: "petrova@techservice.ru", role: "manager" as Role },
    { name: "Козлов А.Н.", email: "kozlov@techservice.ru", role: "chief_engineer" as Role },
    { name: "Сидоров Д.И.", email: "sidorov@techservice.ru", role: "engineer" as Role },
    { name: "Новикова Е.В.", email: "novikova@client.ru", role: "user" as Role },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "linear-gradient(135deg, #0f1e35 0%, #1a3a5c 50%, #0f1e35 100%)" }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 shadow-xl"
            style={{ background: "hsl(213 75% 40%)" }}>
            <Icon name="Wrench" size={26} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">ТехСервис CMS</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(180,210,255,0.6)" }}>Система управления заявками</p>
        </div>

        <div className="rounded-xl p-7 animate-fade-in"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", animationDelay: "0.1s" }}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(180,210,255,0.8)" }}>Email</label>
              <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(""); }}
                placeholder="user@company.ru" onKeyDown={e => e.key === "Enter" && handleLogin()}
                className="w-full rounded-lg px-4 py-2.5 text-white placeholder-white/30 text-sm focus:outline-none"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(180,210,255,0.8)" }}>Пароль</label>
              <input type="password" value={password} onChange={e => { setPassword(e.target.value); setError(""); }}
                placeholder="••••••••" onKeyDown={e => e.key === "Enter" && handleLogin()}
                className="w-full rounded-lg px-4 py-2.5 text-white placeholder-white/30 text-sm focus:outline-none"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }} />
            </div>
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <button onClick={handleLogin} disabled={loading}
              className="w-full font-semibold py-2.5 rounded-lg text-sm text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
              style={{ background: "hsl(213 75% 40%)" }}>
              {loading ? "Входим..." : "Войти в систему"}
            </button>
          </div>
        </div>

        <div className="mt-4 rounded-xl p-4 animate-fade-in"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", animationDelay: "0.2s" }}>
          <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "rgba(180,210,255,0.5)" }}>
            Демо-аккаунты (пароль: demo123)
          </p>
          <div className="space-y-1">
            {DEMO_ACCOUNTS.map(u => (
              <button key={u.email} onClick={() => { setEmail(u.email); setPassword("demo123"); setError(""); }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all text-left hover:bg-white/10">
                <span className="text-xs text-white/70">{u.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${ROLE_COLORS[u.role]}`}>{ROLE_LABELS[u.role]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function Index() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeModule, setActiveModule] = useState<ModuleId>("dashboard");
  const [collapsed, setCollapsed] = useState(false);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setActiveModule(user.role === "user" ? "tickets" : "dashboard");
  };

  if (!currentUser) return <LoginScreen onLogin={handleLogin} />;

  const allowedNav = NAV_ITEMS.filter(n => n.roles.includes(currentUser.role));
  const groups = [...new Set(allowedNav.map(n => n.group))];

  const renderModule = () => {
    switch (activeModule) {
      case "dashboard": return <Dashboard user={currentUser} />;
      case "tickets": return <TicketsModule user={currentUser} />;
      case "monitoring": return <MonitoringModule user={currentUser} />;
      case "ppr": return <PPRModule />;
      case "directories": return <DirectoriesModule />;
      case "warehouse": return <WarehouseModule />;
      case "reports": return <ReportsModule />;
      case "admin": return <AdminModule user={currentUser} />;
      case "inspections": return <PlaceholderModule title="Периодические осмотры" desc="Графики обходов для каждого клиента" icon="Search" />;
      case "calendar": return <PlaceholderModule title="Календарь" desc="События из всех модулей системы" icon="Calendar" />;
      case "crm": return <PlaceholderModule title="CRM" desc="Управление клиентами и сделками" icon="Users" />;
      case "sales": return <PlaceholderModule title="Продажи" desc="Воронка продаж и сделки" icon="TrendingUp" />;
      case "mail": return <PlaceholderModule title="Внутренняя почта" desc="Переписка между сотрудниками" icon="Mail" />;
      case "timekeeping": return <PlaceholderModule title="Учёт рабочего времени" desc="Табели, графики, выезды" icon="Clock" />;
      case "map": return <PlaceholderModule title="Карта объектов" desc="Объекты клиентов и маршруты" icon="Map" />;
      default: return <Dashboard user={currentUser} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className={`flex flex-col shrink-0 transition-all duration-200 ${collapsed ? "w-14" : "w-56"}`}
        style={{ background: "hsl(var(--sidebar-background))" }}>
        <div className="flex items-center gap-3 px-3 py-4 border-b" style={{ borderColor: "hsl(var(--sidebar-border))" }}>
          <div className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0" style={{ background: "hsl(213 75% 40%)" }}>
            <Icon name="Wrench" size={16} className="text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-bold text-white leading-tight">ТехСервис</p>
              <p className="text-xs truncate" style={{ color: "rgba(180,210,255,0.5)" }}>CMS v1.0</p>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
          {groups.map(group => (
            <div key={group} className="mb-1">
              {!collapsed && (
                <p className="text-xs font-semibold uppercase tracking-wider px-3 py-2"
                  style={{ color: "rgba(180,210,255,0.35)" }}>
                  {group}
                </p>
              )}
              {allowedNav.filter(n => n.group === group).map(item => (
                <button key={item.id} onClick={() => setActiveModule(item.id)}
                  title={collapsed ? item.label : ""}
                  className={`sidebar-item w-full ${activeModule === item.id ? "active" : ""} ${collapsed ? "justify-center px-0" : ""}`}>
                  <Icon name={item.icon} size={16} />
                  {!collapsed && <span className="text-sm">{item.label}</span>}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="border-t px-2 py-3 space-y-1" style={{ borderColor: "hsl(var(--sidebar-border))" }}>
          {!collapsed && (
            <div className="px-3 py-2 rounded-md mb-2" style={{ background: "hsl(var(--sidebar-accent))" }}>
              <p className="text-xs font-semibold text-white truncate">{currentUser.name.split(" ").slice(0, 2).join(" ")}</p>
              <p className="text-xs mt-0.5" style={{ color: "hsl(var(--sidebar-foreground))" }}>{ROLE_LABELS[currentUser.role]}</p>
            </div>
          )}
          <button onClick={() => setCurrentUser(null)}
            className="sidebar-item w-full text-red-400 hover:text-red-300 hover:bg-red-900/20">
            <Icon name="LogOut" size={15} />
            {!collapsed && <span className="text-sm">Выйти</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="bg-white border-b border-border flex items-center gap-3 px-4 h-12 shrink-0">
          <button onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 hover:bg-secondary rounded text-muted-foreground shrink-0">
            <Icon name={collapsed ? "PanelLeftOpen" : "PanelLeftClose"} size={17} />
          </button>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
            <span className="shrink-0">ТехСервис</span>
            <Icon name="ChevronRight" size={13} />
            <span className="font-medium text-foreground truncate">
              {NAV_ITEMS.find(n => n.id === activeModule)?.label}
            </span>
          </div>
          <div className="ml-auto flex items-center gap-2 shrink-0">
            <button className="relative p-1.5 hover:bg-secondary rounded text-muted-foreground">
              <Icon name="Bell" size={17} />
              <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
            </button>
            <div className="flex items-center gap-2 px-2 py-1 rounded hover:bg-secondary cursor-pointer">
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
                {currentUser.name[0]}
              </div>
              <span className="text-xs font-medium text-foreground hidden sm:block">{currentUser.name.split(" ")[1]}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded font-medium hidden md:inline-block ${ROLE_COLORS[currentUser.role]}`}>
                {ROLE_LABELS[currentUser.role]}
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {renderModule()}
        </main>
      </div>
    </div>
  );
}