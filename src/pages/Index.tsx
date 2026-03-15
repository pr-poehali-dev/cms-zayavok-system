import { useState } from "react";
import Icon from "@/components/ui/icon";

// ─── Types ───────────────────────────────────────────────────────────────────

type Role = "user" | "engineer" | "manager" | "chief_engineer" | "admin";

interface User {
  id: number;
  name: string;
  role: Role;
  department: string;
  email: string;
}

type ModuleId =
  | "dashboard"
  | "tickets"
  | "monitoring"
  | "ppr"
  | "inspections"
  | "reports"
  | "warehouse"
  | "crm"
  | "sales"
  | "calendar"
  | "mail"
  | "timekeeping"
  | "map"
  | "directories"
  | "admin";

interface NavItem {
  id: ModuleId;
  label: string;
  icon: string;
  roles: Role[];
  group: string;
}

// ─── Data ────────────────────────────────────────────────────────────────────

const DEMO_USERS: User[] = [
  { id: 1, name: "Иванов Алексей Петрович", role: "admin", department: "Администрация", email: "ivanov@techservice.ru" },
  { id: 2, name: "Петрова Мария Сергеевна", role: "manager", department: "Отдел контроля", email: "petrova@techservice.ru" },
  { id: 3, name: "Сидоров Дмитрий Иванович", role: "engineer", department: "Технический отдел", email: "sidorov@techservice.ru" },
  { id: 4, name: "Козлов Андрей Николаевич", role: "chief_engineer", department: "Главный инженер", email: "kozlov@techservice.ru" },
  { id: 5, name: "Новикова Елена Владимировна", role: "user", department: "Клиент", email: "novikova@client.ru" },
];

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

const DEMO_TICKETS = [
  { id: "ЗВ-2026-0847", title: "Протечка трубы в кабинете 214", client: "ООО «Техпром»", status: "new", priority: "high", engineer: "Сидоров Д.И.", created: "15.03.2026", due: "16.03.2026", system: "Водоснабжение" },
  { id: "ЗВ-2026-0846", title: "Не работает кондиционер", client: "ЗАО «Стройтех»", status: "inwork", priority: "medium", engineer: "Сидоров Д.И.", created: "14.03.2026", due: "17.03.2026", system: "Вентиляция" },
  { id: "ЗВ-2026-0845", title: "Замена лампочек в коридоре", client: "ООО «Техпром»", status: "done", priority: "low", engineer: "Морозов В.А.", created: "13.03.2026", due: "15.03.2026", system: "Электроснабжение" },
  { id: "ЗВ-2026-0844", title: "Ремонт системы отопления", client: "ИП Захаров А.П.", status: "inwork", priority: "high", engineer: "Козлов А.Н.", created: "12.03.2026", due: "18.03.2026", system: "Отопление" },
  { id: "ЗВ-2026-0843", title: "Проверка пожарной сигнализации", client: "ООО «Альфа»", status: "closed", priority: "medium", engineer: "Морозов В.А.", created: "10.03.2026", due: "14.03.2026", system: "Пожарная безопасность" },
  { id: "ЗВ-2026-0842", title: "Замена уплотнителей окон", client: "ЗАО «Стройтех»", status: "new", priority: "low", engineer: "—", created: "15.03.2026", due: "20.03.2026", system: "Окна и двери" },
];

const PPR_SCHEDULE = [
  { id: 1, client: "ООО «Техпром»", system: "Вентиляция и кондиционирование", type: "ТО-1 (квартальное)", dateStart: "01.04.2026", dateEnd: "03.04.2026", engineer: "Сидоров Д.И.", status: "planned" },
  { id: 2, client: "ЗАО «Стройтех»", system: "Система отопления", type: "ТО-2 (полугодовое)", dateStart: "05.04.2026", dateEnd: "07.04.2026", engineer: "Козлов А.Н.", status: "planned" },
  { id: 3, client: "ИП Захаров А.П.", system: "Электроснабжение", type: "ТО-1 (квартальное)", dateStart: "10.04.2026", dateEnd: "10.04.2026", engineer: "Морозов В.А.", status: "planned" },
  { id: 4, client: "ООО «Альфа»", system: "Водоснабжение", type: "ТО-3 (годовое)", dateStart: "15.03.2026", dateEnd: "17.03.2026", engineer: "Сидоров Д.И.", status: "active" },
];

const DIRECTORIES = [
  { id: 1, name: "Сотрудники и физ. лица", icon: "UserCheck", count: 24, desc: "ФИО, должности, роли, контакты" },
  { id: 2, name: "Должности", icon: "Briefcase", count: 12, desc: "Справочник должностей организации" },
  { id: 3, name: "Структура учреждения", icon: "Building2", count: 6, desc: "Подразделения и отделы" },
  { id: 4, name: "Контрагенты", icon: "Building", count: 18, desc: "Клиенты, здания, характеристики" },
  { id: 5, name: "Системы и оборудование", icon: "Cpu", count: 47, desc: "Марки, состав, производительность" },
  { id: 6, name: "Виды работ", icon: "ClipboardList", count: 31, desc: "Типы обслуживания и ремонтов" },
];

const WAREHOUSE_ITEMS = [
  { id: 1, name: "Уплотнитель оконный EPDM 9×5мм", category: "Строительные", unit: "м.п.", quantity: 145, min: 50, price: 18, location: "Стеллаж А-3" },
  { id: 2, name: "Фильтр для кондиционера G4 500×250", category: "Вентиляция", unit: "шт.", quantity: 8, min: 10, price: 320, location: "Стеллаж Б-1" },
  { id: 3, name: "Лампа LED 10W E27 4000K", category: "Электрика", unit: "шт.", quantity: 62, min: 20, price: 95, location: "Стеллаж В-2" },
  { id: 4, name: "Радиаторный термостат Danfoss RA-N", category: "Отопление", unit: "шт.", quantity: 4, min: 5, price: 1240, location: "Стеллаж А-1" },
  { id: 5, name: "Герметик силиконовый санитарный 280мл", category: "Расходники", unit: "шт.", quantity: 23, min: 10, price: 180, location: "Стеллаж Г-4" },
];

const EMPLOYEES_DATA = [
  { id: 1, name: "Сидоров Дмитрий Иванович", role: "engineer" as Role, position: "Инженер-сантехник", department: "Технический отдел", phone: "+7 (916) 234-56-78", email: "sidorov@ts.ru" },
  { id: 2, name: "Морозов Василий Александрович", role: "engineer" as Role, position: "Электрик", department: "Технический отдел", phone: "+7 (916) 345-67-89", email: "morozov@ts.ru" },
  { id: 3, name: "Петрова Мария Сергеевна", role: "manager" as Role, position: "Нач. отдела контроля", department: "Отдел контроля", phone: "+7 (916) 456-78-90", email: "petrova@ts.ru" },
  { id: 4, name: "Козлов Андрей Николаевич", role: "chief_engineer" as Role, position: "Главный инженер", department: "Руководство", phone: "+7 (916) 567-89-01", email: "kozlov@ts.ru" },
  { id: 5, name: "Новикова Елена Владимировна", role: "user" as Role, position: "Офис-менеджер", department: "Клиент (ООО Альфа)", phone: "+7 (916) 678-90-12", email: "novikova@client.ru" },
];

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

// ─── Modules ──────────────────────────────────────────────────────────────────

function Dashboard({ role }: { role: Role }) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Дашборд</h1>
          <p className="text-sm text-muted-foreground mt-0.5">15 марта 2026 — оперативная сводка</p>
        </div>
        {role !== "user" && (
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm rounded-md hover:bg-primary/90 transition-colors">
            <Icon name="Plus" size={15} />
            Новая заявка
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Новые заявки", value: "12", icon: "FileText", color: "text-blue-600", bg: "bg-blue-50", delta: "+3 за сегодня" },
          { label: "В работе", value: "28", icon: "Wrench", color: "text-orange-600", bg: "bg-orange-50", delta: "5 просрочено" },
          { label: "Выполнено (месяц)", value: "143", icon: "CheckCircle2", color: "text-green-600", bg: "bg-green-50", delta: "+12% к прошлому" },
          { label: "Объектов", value: "18", icon: "Building2", color: "text-purple-600", bg: "bg-purple-50", delta: "4 новых" },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{s.label}</p>
                <p className="text-2xl font-bold text-foreground mt-1">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.delta}</p>
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
            <button className="text-xs text-primary hover:underline">Все заявки →</button>
          </div>
          <div className="divide-y divide-border">
            {DEMO_TICKETS.slice(0, 4).map((t) => (
              <div key={t.id} className="px-5 py-3 table-row-hover flex items-center gap-4 cursor-pointer">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-muted-foreground font-mono">{t.id}</span>
                    <StatusBadge status={t.status} />
                    <PriorityDot priority={t.priority} />
                  </div>
                  <p className="text-sm font-medium text-foreground mt-0.5 truncate">{t.title}</p>
                  <p className="text-xs text-muted-foreground">{t.client} · {t.system}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-muted-foreground">до {t.due}</p>
                  <p className="text-xs text-foreground mt-0.5">{t.engineer}</p>
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
            {[
              { name: "Сидоров Д.И.", tasks: 8, max: 12, color: "bg-blue-500" },
              { name: "Морозов В.А.", tasks: 5, max: 12, color: "bg-green-500" },
              { name: "Козлов А.Н.", tasks: 10, max: 12, color: "bg-orange-500" },
              { name: "Романов С.П.", tasks: 3, max: 12, color: "bg-purple-500" },
            ].map((eng) => (
              <div key={eng.name}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-medium text-foreground">{eng.name}</span>
                  <span className="text-muted-foreground">{eng.tasks}/{eng.max}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${eng.color} rounded-full`} style={{ width: `${(eng.tasks / eng.max) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="px-5 pb-4 pt-2 border-t border-border space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Статусы</p>
            {[
              { label: "Новые", count: 12, color: "bg-blue-600" },
              { label: "В работе", count: 28, color: "bg-orange-500" },
              { label: "Выполнено", count: 143, color: "bg-green-500" },
              { label: "Просрочено", count: 5, color: "bg-red-500" },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${s.color}`} />
                  <span className="text-foreground">{s.label}</span>
                </div>
                <span className="font-semibold text-foreground">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TicketsModule({ role }: { role: Role }) {
  const [filter, setFilter] = useState("all");
  const [showNew, setShowNew] = useState(false);
  const filtered = filter === "all" ? DEMO_TICKETS : DEMO_TICKETS.filter(t => t.status === filter);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Заявки</h1>
          <p className="text-sm text-muted-foreground">Управление заявками на техническое обслуживание</p>
        </div>
        <button onClick={() => setShowNew(!showNew)} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm rounded-md hover:bg-primary/90 transition-colors">
          <Icon name="Plus" size={15} />
          {role === "user" ? "Подать заявку" : "Новая заявка"}
        </button>
      </div>

      {showNew && (
        <div className="bg-white border border-border rounded-lg p-5 animate-fade-in">
          <h3 className="font-semibold text-sm mb-4">Новая заявка</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs text-muted-foreground mb-1">Тема заявки *</label>
              <input className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Кратко опишите проблему" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Система / Оборудование</label>
              <select className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary bg-white">
                <option>Водоснабжение</option>
                <option>Отопление</option>
                <option>Вентиляция</option>
                <option>Электроснабжение</option>
                <option>Пожарная безопасность</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Приоритет</label>
              <select className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary bg-white">
                <option value="low">Низкий</option>
                <option value="medium">Средний</option>
                <option value="high">Высокий</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-muted-foreground mb-1">Подробное описание *</label>
              <textarea rows={3} className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none" placeholder="Опишите проблему подробно..." />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button className="px-4 py-2 bg-primary text-primary-foreground text-sm rounded hover:bg-primary/90">Отправить</button>
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
          <input className="border border-border rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary w-44" placeholder="Поиск по заявкам..." />
          <button className="flex items-center gap-1 px-3 py-1.5 border border-border rounded text-xs bg-white hover:bg-secondary">
            <Icon name="Filter" size={13} />
            Фильтры
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary/60 border-b border-border">
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">№ Заявки</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Описание</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Клиент</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Статус</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Приоритет</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Инженер</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Срок</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((t) => (
              <tr key={t.id} className="table-row-hover cursor-pointer">
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{t.id}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-foreground">{t.title}</p>
                  <p className="text-xs text-muted-foreground">{t.system}</p>
                </td>
                <td className="px-4 py-3 text-xs text-foreground">{t.client}</td>
                <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                <td className="px-4 py-3"><PriorityDot priority={t.priority} /></td>
                <td className="px-4 py-3 text-xs text-foreground">{t.engineer}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{t.due}</td>
                <td className="px-4 py-3">
                  <button className="p-1 hover:bg-secondary rounded">
                    <Icon name="MoreHorizontal" size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MonitoringModule() {
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Мониторинг заявок</h1>
          <p className="text-sm text-muted-foreground">Состояние всех заявок в реальном времени</p>
        </div>
        <div className="flex gap-2">
          <select className="border border-border rounded px-3 py-1.5 text-xs bg-white">
            <option>Все клиенты</option>
            <option>ООО «Техпром»</option>
            <option>ЗАО «Стройтех»</option>
          </select>
          <select className="border border-border rounded px-3 py-1.5 text-xs bg-white">
            <option>Все статусы</option>
            <option>Новые</option>
            <option>В работе</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Всего активных", value: 40, border: "border-l-blue-500" },
          { label: "Просрочено", value: 5, border: "border-l-red-500" },
          { label: "Без исполнителя", value: 3, border: "border-l-orange-500" },
          { label: "Закрыто сегодня", value: 7, border: "border-l-green-500" },
        ].map((s, i) => (
          <div key={i} className={`bg-white border border-border border-l-4 ${s.border} rounded-lg p-4`}>
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-lg border border-border overflow-hidden">
        <div className="px-5 py-3 border-b border-border bg-secondary/40 flex items-center gap-3">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Автоназначение включено</span>
          <span className="flex items-center gap-1 text-xs text-green-600">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
            Система работает
          </span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary/30 border-b border-border">
              {["№", "Заявка", "Клиент", "Система", "Статус", "Инженер", "Срок"].map(h => (
                <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {DEMO_TICKETS.map(t => (
              <tr key={t.id} className="table-row-hover">
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{t.id}</td>
                <td className="px-4 py-3 text-sm font-medium">{t.title}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{t.client}</td>
                <td className="px-4 py-3 text-xs">{t.system}</td>
                <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                <td className="px-4 py-3 text-xs">{t.engineer}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{t.due}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PPRModule() {
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Планово-предупредительные ремонты</h1>
          <p className="text-sm text-muted-foreground">Графики ТО для каждого клиента</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm rounded-md hover:bg-primary/90">
          <Icon name="Plus" size={15} />
          Добавить ТО
        </button>
      </div>
      <div className="bg-white rounded-lg border border-border overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border bg-secondary/40">
          <h3 className="font-semibold text-sm">График ППР — II квартал 2026</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary/30 border-b border-border">
              {["Клиент", "Система", "Вид ТО", "Дата начала", "Дата окончания", "Исполнитель", "Статус", ""].map(h => (
                <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {PPR_SCHEDULE.map(p => (
              <tr key={p.id} className="table-row-hover">
                <td className="px-4 py-3 text-sm font-medium">{p.client}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{p.system}</td>
                <td className="px-4 py-3 text-xs">{p.type}</td>
                <td className="px-4 py-3 text-xs">{p.dateStart}</td>
                <td className="px-4 py-3 text-xs">{p.dateEnd}</td>
                <td className="px-4 py-3 text-xs">{p.engineer}</td>
                <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                <td className="px-4 py-3">
                  <button className="p-1 hover:bg-secondary rounded"><Icon name="Pencil" size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DirectoriesModule() {
  const [active, setActive] = useState<number | null>(null);
  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold">Справочники</h1>
        <p className="text-sm text-muted-foreground">Нормативно-справочная информация системы</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {DIRECTORIES.map((d) => (
          <button key={d.id} onClick={() => setActive(active === d.id ? null : d.id)}
            className={`bg-white border rounded-lg p-5 text-left transition-all hover:shadow-md ${active === d.id ? "border-primary ring-1 ring-primary" : "border-border"}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="bg-primary/10 text-primary p-2.5 rounded-lg">
                <Icon name={d.icon} size={20} />
              </div>
              <span className="text-xs font-semibold text-muted-foreground bg-secondary px-2 py-0.5 rounded">{d.count}</span>
            </div>
            <h3 className="font-semibold text-sm text-foreground">{d.name}</h3>
            <p className="text-xs text-muted-foreground mt-1">{d.desc}</p>
          </button>
        ))}
      </div>
      {active === 1 && (
        <div className="bg-white rounded-lg border border-border overflow-hidden animate-fade-in">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
            <h3 className="font-semibold text-sm">Сотрудники и физические лица</h3>
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-xs rounded hover:bg-primary/90">
              <Icon name="Plus" size={13} />
              Добавить
            </button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-secondary/40 border-b border-border">
                {["ФИО", "Роль", "Должность", "Подразделение", "Телефон", "Email", ""].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {EMPLOYEES_DATA.map(e => (
                <tr key={e.id} className="table-row-hover">
                  <td className="px-4 py-3 font-medium text-sm">{e.name}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${ROLE_COLORS[e.role]}`}>{ROLE_LABELS[e.role]}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{e.position}</td>
                  <td className="px-4 py-3 text-xs">{e.department}</td>
                  <td className="px-4 py-3 text-xs font-mono">{e.phone}</td>
                  <td className="px-4 py-3 text-xs text-primary">{e.email}</td>
                  <td className="px-4 py-3">
                    <button className="p-1 hover:bg-secondary rounded"><Icon name="Pencil" size={13} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function WarehouseModule() {
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Склад и ТМЦ</h1>
          <p className="text-sm text-muted-foreground">Учёт материалов, расход, контроль запасов</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2 border border-border bg-white text-sm rounded hover:bg-secondary">
            <Icon name="ArrowDownToLine" size={15} />
            Приходный акт
          </button>
          <button className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-sm rounded hover:bg-primary/90">
            <Icon name="Plus" size={15} />
            Выдача материалов
          </button>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Позиций на складе", value: "47", icon: "Package", color: "text-blue-600 bg-blue-50" },
          { label: "Ниже минимума", value: "3", icon: "AlertTriangle", color: "text-red-600 bg-red-50" },
          { label: "Расход за месяц", value: "₽ 124 800", icon: "TrendingDown", color: "text-orange-600 bg-orange-50" },
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
      <div className="bg-white rounded-lg border border-border overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <h3 className="font-semibold text-sm">Номенклатура ТМЦ</h3>
          <input className="border border-border rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary w-48" placeholder="Поиск..." />
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary/30 border-b border-border">
              {["Наименование", "Категория", "Ед.", "Кол-во", "Мин.", "Цена", "Место хранения"].map(h => (
                <th key={h} className={`px-4 py-2.5 text-xs font-semibold text-muted-foreground ${h === "Кол-во" || h === "Мин." || h === "Цена" ? "text-right" : "text-left"}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {WAREHOUSE_ITEMS.map(w => (
              <tr key={w.id} className="table-row-hover">
                <td className="px-4 py-3 font-medium text-sm">{w.name}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{w.category}</td>
                <td className="px-4 py-3 text-xs">{w.unit}</td>
                <td className={`px-4 py-3 text-right text-sm font-bold ${w.quantity <= w.min ? "text-red-600" : "text-green-600"}`}>{w.quantity}</td>
                <td className="px-4 py-3 text-right text-xs text-muted-foreground">{w.min}</td>
                <td className="px-4 py-3 text-right text-xs font-mono">{w.price} ₽</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{w.location}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm rounded-md hover:bg-primary/90">
          <Icon name="Plus" size={15} />
          Новый отчёт
        </button>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[
          { name: "Заявки по исполнителям", type: "Таблица", period: "Март 2026", icon: "Table" },
          { name: "Расход ТМЦ по объектам", type: "График", period: "I квартал 2026", icon: "BarChart2" },
          { name: "KPI инженеров", type: "Сводная таблица", period: "Март 2026", icon: "Target" },
          { name: "Просроченные заявки", type: "Таблица", period: "Неделя", icon: "AlertCircle" },
          { name: "ППР — план/факт", type: "График", period: "II кв. 2026", icon: "CalendarCheck" },
          { name: "Расходы на обслуживание", type: "Диаграмма", period: "Год", icon: "PieChart" },
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

function AdminModule() {
  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold">Администрирование</h1>
        <p className="text-sm text-muted-foreground">Полный доступ к настройкам системы</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Пользователи и роли", icon: "ShieldCheck", desc: "Доступ и права", color: "bg-blue-50 text-blue-600" },
          { title: "Поля заявок", icon: "Sliders", desc: "Конфигурация форм", color: "bg-purple-50 text-purple-600" },
          { title: "Уведомления", icon: "Bell", desc: "Email, SMS, push", color: "bg-orange-50 text-orange-600" },
          { title: "Автоназначение", icon: "Zap", desc: "Правила распределения", color: "bg-yellow-50 text-yellow-600" },
          { title: "Журнал действий", icon: "ScrollText", desc: "История операций", color: "bg-gray-50 text-gray-600" },
          { title: "Резервные копии", icon: "Database", desc: "Настройки бэкапа", color: "bg-green-50 text-green-600" },
          { title: "Интеграции", icon: "Plug", desc: "API и вебхуки", color: "bg-red-50 text-red-600" },
          { title: "Конфигурация", icon: "Cog", desc: "Общие параметры", color: "bg-teal-50 text-teal-600" },
        ].map((item, i) => (
          <div key={i} className="bg-white border border-border rounded-lg p-5 cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5 group">
            <div className={`${item.color} p-3 rounded-xl w-fit mb-3 group-hover:scale-105 transition-transform`}>
              <Icon name={item.icon} size={22} />
            </div>
            <h3 className="font-semibold text-sm text-foreground">{item.title}</h3>
            <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
          </div>
        ))}
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
        <h3 className="text-base font-semibold text-foreground mb-2">Модуль «{title}»</h3>
        <p className="text-sm text-muted-foreground max-w-xs">Модуль будет настроен и подключён к базе данных на следующем шаге разработки</p>
        <button className="mt-5 px-4 py-2 bg-primary text-primary-foreground text-sm rounded hover:bg-primary/90">
          Настроить модуль
        </button>
      </div>
    </div>
  );
}

// ─── Login ────────────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: (user: User) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    const user = DEMO_USERS.find(u => u.email === email);
    if (user && password === "demo123") {
      onLogin(user);
    } else {
      setError("Неверный email или пароль");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "linear-gradient(135deg, #0f1e35 0%, #1a3a5c 50%, #0f1e35 100%)" }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 shadow-xl" style={{ background: "hsl(213 75% 35%)" }}>
            <Icon name="Wrench" size={26} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">ТехСервис CMS</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(180,210,255,0.6)" }}>Система управления заявками</p>
        </div>

        <div className="rounded-xl p-7 animate-fade-in" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", animationDelay: "0.1s" }}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(180,210,255,0.8)" }}>Email</label>
              <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(""); }}
                placeholder="user@company.ru"
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                className="w-full rounded-lg px-4 py-2.5 text-white placeholder-white/30 text-sm focus:outline-none transition-all"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(180,210,255,0.8)" }}>Пароль</label>
              <input type="password" value={password} onChange={e => { setPassword(e.target.value); setError(""); }}
                placeholder="••••••••"
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                className="w-full rounded-lg px-4 py-2.5 text-white placeholder-white/30 text-sm focus:outline-none transition-all"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }} />
            </div>
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <button onClick={handleLogin}
              className="w-full font-semibold py-2.5 rounded-lg text-sm text-white transition-all hover:opacity-90 active:scale-95"
              style={{ background: "hsl(213 75% 40%)" }}>
              Войти в систему
            </button>
          </div>
        </div>

        <div className="mt-4 rounded-xl p-4 animate-fade-in" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", animationDelay: "0.2s" }}>
          <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "rgba(180,210,255,0.5)" }}>Демо-аккаунты (пароль: demo123)</p>
          <div className="space-y-1">
            {DEMO_USERS.map(u => (
              <button key={u.id} onClick={() => { setEmail(u.email); setPassword("demo123"); }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all text-left hover:bg-white/10">
                <span className="text-xs text-white/70 hover:text-white">{u.name}</span>
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

  if (!currentUser) {
    return <LoginScreen onLogin={(user) => {
      setCurrentUser(user);
      setActiveModule(user.role === "user" ? "tickets" : "dashboard");
    }} />;
  }

  const allowedNav = NAV_ITEMS.filter(n => n.roles.includes(currentUser.role));
  const groups = [...new Set(allowedNav.map(n => n.group))];

  const renderModule = () => {
    switch (activeModule) {
      case "dashboard": return <Dashboard role={currentUser.role} />;
      case "tickets": return <TicketsModule role={currentUser.role} />;
      case "monitoring": return <MonitoringModule />;
      case "ppr": return <PPRModule />;
      case "directories": return <DirectoriesModule />;
      case "warehouse": return <WarehouseModule />;
      case "reports": return <ReportsModule />;
      case "admin": return <AdminModule />;
      case "inspections": return <PlaceholderModule title="Периодические осмотры" desc="Графики обходов для каждого клиента" icon="Search" />;
      case "calendar": return <PlaceholderModule title="Календарь" desc="События из всех модулей системы" icon="Calendar" />;
      case "crm": return <PlaceholderModule title="CRM" desc="Управление клиентами и сделками" icon="Users" />;
      case "sales": return <PlaceholderModule title="Продажи" desc="Воронка продаж и сделки" icon="TrendingUp" />;
      case "mail": return <PlaceholderModule title="Внутренняя почта" desc="Переписка между сотрудниками" icon="Mail" />;
      case "timekeeping": return <PlaceholderModule title="Учёт рабочего времени" desc="Табели, графики, выезды" icon="Clock" />;
      case "map": return <PlaceholderModule title="Карта объектов" desc="Объекты клиентов и маршруты" icon="Map" />;
      default: return <Dashboard role={currentUser.role} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
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
                <p className="text-xs font-semibold uppercase tracking-wider px-3 py-2" style={{ color: "rgba(180,210,255,0.35)" }}>
                  {group}
                </p>
              )}
              {allowedNav.filter(n => n.group === group).map(item => (
                <button key={item.id} onClick={() => setActiveModule(item.id)} title={collapsed ? item.label : ""}
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

      {/* Content area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Topbar */}
        <header className="bg-white border-b border-border flex items-center gap-3 px-4 h-12 shrink-0">
          <button onClick={() => setCollapsed(!collapsed)} className="p-1.5 hover:bg-secondary rounded text-muted-foreground shrink-0">
            <Icon name={collapsed ? "PanelLeftOpen" : "PanelLeftClose"} size={17} />
          </button>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
            <span className="shrink-0">ТехСервис</span>
            <Icon name="ChevronRight" size={13} />
            <span className="font-medium text-foreground truncate">{NAV_ITEMS.find(n => n.id === activeModule)?.label}</span>
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
