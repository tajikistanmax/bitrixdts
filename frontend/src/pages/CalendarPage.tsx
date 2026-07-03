import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { calendarService } from '../services/calendar.service';
import { useAuthStore } from '../store/auth.store';
import {
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
  TagIcon,
} from '@heroicons/react/24/outline';
import {
  PageHeader,
  Card,
  Badge,
  EmptyState,
  Modal,
  Button,
  Input,
  LoadingState,
  useToast,
} from '../components/ui';

const months = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];
const weekDays = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];

// Цвета чипов по типу события
const typeStyles: Record<string, { chip: string; dot: string; badge: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'default'; label: string }> = {
  meeting: { chip: 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-200', dot: 'bg-primary-500', badge: 'primary', label: 'Встреча' },
  event: { chip: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-200', dot: 'bg-violet-500', badge: 'purple', label: 'Событие' },
  holiday: { chip: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200', dot: 'bg-red-500', badge: 'danger', label: 'Праздник' },
  vacation: { chip: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200', dot: 'bg-emerald-500', badge: 'success', label: 'Отпуск' },
  deadline: { chip: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200', dot: 'bg-amber-500', badge: 'warning', label: 'Дедлайн' },
  task: { chip: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-200', dot: 'bg-sky-500', badge: 'info', label: 'Задача' },
};

const typeFor = (type?: string) => typeStyles[type || ''] || {
  chip: 'bg-ink-100 text-ink-700 dark:bg-ink-800 dark:text-ink-200',
  dot: 'bg-ink-400',
  badge: 'default' as const,
  label: type || 'Другое',
};

const toKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

const fmtTime = (iso?: string) =>
  iso ? new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : '';

const fmtDateTime = (iso?: string) =>
  iso ? new Date(iso).toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : '—';

export default function CalendarPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const user = useAuthStore((s) => s.user);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [showCreate, setShowCreate] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [activeEvent, setActiveEvent] = useState<any | null>(null);
  const [form, setForm] = useState({ title: '', description: '', type: 'meeting', startDate: '', endDate: '' });

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['calendar'],
    queryFn: () => calendarService.getAll(),
  });

  const eventList: any[] = Array.isArray(events) ? events : [];

  const createMutation = useMutation({
    mutationFn: (data: any) => calendarService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      toast.success('Событие создано');
      closeCreate();
    },
    onError: () => toast.error('Не удалось создать событие'),
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = new Date();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = (firstDay.getDay() + 6) % 7; // с понедельника
  const daysInMonth = lastDay.getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => setCurrentDate(new Date());

  // Индекс событий по дню месяца
  const eventsByKey = useMemo(() => {
    const map = new Map<string, any[]>();
    eventList.forEach((e) => {
      const raw = e.startDate || e.startTime;
      if (!raw) return;
      const d = new Date(raw);
      if (isNaN(d.getTime())) return;
      const key = toKey(d);
      const arr = map.get(key) || [];
      arr.push(e);
      map.set(key, arr);
    });
    return map;
  }, [eventList]);

  // Ячейки сетки
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);

  const eventsForDay = (d: Date) => eventsByKey.get(toKey(d)) || [];
  const isToday = (d: Date) => toKey(d) === toKey(today);

  const openCreate = (day?: Date) => {
    const base = day || new Date();
    const iso = new Date(base.getFullYear(), base.getMonth(), base.getDate(), 9, 0)
      .toISOString()
      .slice(0, 16);
    setForm({ title: '', description: '', type: 'meeting', startDate: iso, endDate: '' });
    setShowCreate(true);
  };

  const closeCreate = () => {
    setShowCreate(false);
    setForm({ title: '', description: '', type: 'meeting', startDate: '', endDate: '' });
  };

  const submitCreate = () => {
    createMutation.mutate({
      title: form.title,
      description: form.description || undefined,
      type: form.type,
      startDate: form.startDate ? new Date(form.startDate).toISOString() : undefined,
      endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined,
      organizationId: user?.organizationId,
      employeeId: user?.id,
    });
  };

  const selectedDayEvents = selectedDay ? eventsForDay(selectedDay) : [];

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="Календарь"
        icon={<CalendarDaysIcon />}
        action={
          <Button leftIcon={<PlusIcon className="w-4 h-4" />} onClick={() => openCreate(new Date())}>
            Создать событие
          </Button>
        }
        tabs={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <button
                onClick={prevMonth}
                className="p-1.5 rounded-md text-ink-500 hover:bg-[var(--surface-muted)] transition-colors"
                aria-label="Предыдущий месяц"
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </button>
              <button
                onClick={goToday}
                className="px-2.5 py-1 rounded-md text-xs font-medium text-ink-600 dark:text-ink-300 hover:bg-[var(--surface-muted)] transition-colors"
              >
                Сегодня
              </button>
              <button
                onClick={nextMonth}
                className="p-1.5 rounded-md text-ink-500 hover:bg-[var(--surface-muted)] transition-colors"
                aria-label="Следующий месяц"
              >
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
            <span className="text-sm font-semibold text-ink-900 dark:text-ink-50">
              {months[month]} {year}
            </span>
          </div>
        }
      />

      <div className="flex-1 overflow-auto p-5">
        {isLoading ? (
          <LoadingState />
        ) : (
          <Card padding="none" className="overflow-hidden">
            {/* Заголовки дней недели */}
            <div className="grid grid-cols-7 border-b border-[var(--border)] bg-[var(--surface-muted)]">
              {weekDays.map((d, i) => (
                <div
                  key={d}
                  className={`py-2.5 text-center text-xs font-semibold uppercase tracking-wide ${
                    i >= 5 ? 'text-red-400' : 'text-ink-500'
                  }`}
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Сетка дней */}
            <div className="grid grid-cols-7">
              {cells.map((day, idx) => {
                if (!day) {
                  return (
                    <div
                      key={idx}
                      className="min-h-[104px] border-b border-r border-[var(--border)] bg-[var(--surface-muted)]"
                    />
                  );
                }
                const dayEvents = eventsForDay(day);
                const weekend = (idx % 7) >= 5;
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDay(day)}
                    className="text-left min-h-[104px] border-b border-r border-[var(--border)] p-1.5 flex flex-col gap-1 hover:bg-primary-50/50 dark:hover:bg-primary-900/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500"
                  >
                    <span
                      className={`w-7 h-7 flex items-center justify-center text-xs rounded-full ${
                        isToday(day)
                          ? 'bg-primary-600 text-white font-bold'
                          : weekend
                          ? 'text-red-400 font-medium'
                          : 'text-ink-600 dark:text-ink-300 font-medium'
                      }`}
                    >
                      {day.getDate()}
                    </span>
                    <div className="flex-1 space-y-1 overflow-hidden">
                      {dayEvents.slice(0, 3).map((ev, ei) => {
                        const st = typeFor(ev.type);
                        return (
                          <span
                            key={ei}
                            role="button"
                            tabIndex={0}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveEvent(ev);
                            }}
                            className={`block text-[11px] leading-tight rounded px-1.5 py-0.5 truncate ${st.chip} hover:opacity-80`}
                          >
                            {ev.startDate || ev.startTime ? (
                              <span className="opacity-70 mr-1">{fmtTime(ev.startDate || ev.startTime)}</span>
                            ) : null}
                            {ev.title}
                          </span>
                        );
                      })}
                      {dayEvents.length > 3 && (
                        <span className="block text-[11px] text-ink-400 px-1">
                          +{dayEvents.length - 3} ещё
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        )}

        {!isLoading && eventList.length === 0 && (
          <div className="mt-5">
            <EmptyState
              icon={<CalendarDaysIcon />}
              title="Событий пока нет"
              description="Создайте первое событие — оно появится в календаре."
              action={
                <Button leftIcon={<PlusIcon className="w-4 h-4" />} onClick={() => openCreate(new Date())}>
                  Создать событие
                </Button>
              }
            />
          </div>
        )}
      </div>

      {/* Модалка: события выбранного дня */}
      <Modal
        isOpen={!!selectedDay}
        onClose={() => setSelectedDay(null)}
        title={selectedDay ? selectedDay.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
        description={`Событий: ${selectedDayEvents.length}`}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setSelectedDay(null)}>Закрыть</Button>
            <Button
              leftIcon={<PlusIcon className="w-4 h-4" />}
              onClick={() => {
                const d = selectedDay;
                setSelectedDay(null);
                openCreate(d || new Date());
              }}
            >
              Добавить событие
            </Button>
          </>
        }
      >
        {selectedDayEvents.length === 0 ? (
          <div className="py-6 text-center text-sm text-ink-500">На этот день событий нет.</div>
        ) : (
          <div className="space-y-2">
            {selectedDayEvents.map((ev, i) => {
              const st = typeFor(ev.type);
              return (
                <button
                  key={i}
                  onClick={() => setActiveEvent(ev)}
                  className="w-full text-left flex items-start gap-3 p-3 rounded-lg bg-[var(--surface-muted)] border border-[var(--border)] hover:shadow-sm transition-shadow"
                >
                  <span className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${st.dot}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink-900 dark:text-ink-100 truncate">{ev.title}</p>
                    <p className="text-xs text-ink-500 mt-0.5">
                      {fmtTime(ev.startDate || ev.startTime)}
                      {ev.endDate ? ` – ${fmtTime(ev.endDate)}` : ''}
                    </p>
                  </div>
                  <Badge variant={st.badge} size="sm">{st.label}</Badge>
                </button>
              );
            })}
          </div>
        )}
      </Modal>

      {/* Модалка: детали события */}
      <Modal
        isOpen={!!activeEvent}
        onClose={() => setActiveEvent(null)}
        title={activeEvent?.title || 'Событие'}
        size="lg"
        footer={<Button variant="ghost" onClick={() => setActiveEvent(null)}>Закрыть</Button>}
      >
        {activeEvent && (
          <div className="space-y-4">
            <div>
              <Badge variant={typeFor(activeEvent.type).badge} dot>
                {typeFor(activeEvent.type).label}
              </Badge>
            </div>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center gap-2 text-ink-700 dark:text-ink-200">
                <ClockIcon className="w-4 h-4 text-ink-400 shrink-0" />
                <span>
                  {fmtDateTime(activeEvent.startDate || activeEvent.startTime)}
                  {activeEvent.endDate ? ` — ${fmtDateTime(activeEvent.endDate)}` : ''}
                </span>
              </div>
              {activeEvent.location && (
                <div className="flex items-center gap-2 text-ink-700 dark:text-ink-200">
                  <MapPinIcon className="w-4 h-4 text-ink-400 shrink-0" />
                  <span>{activeEvent.location}</span>
                </div>
              )}
              {activeEvent.type && (
                <div className="flex items-center gap-2 text-ink-700 dark:text-ink-200">
                  <TagIcon className="w-4 h-4 text-ink-400 shrink-0" />
                  <span>{typeFor(activeEvent.type).label}</span>
                </div>
              )}
            </div>
            {activeEvent.description && (
              <p className="text-sm text-ink-600 dark:text-ink-300 whitespace-pre-line border-t border-[var(--border)] pt-4">
                {activeEvent.description}
              </p>
            )}
          </div>
        )}
      </Modal>

      {/* Модалка: создание события */}
      <Modal
        isOpen={showCreate}
        onClose={closeCreate}
        title="Новое событие"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={closeCreate}>Отмена</Button>
            <Button
              isLoading={createMutation.isPending}
              disabled={!form.title || !form.startDate}
              onClick={submitCreate}
            >
              Создать
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Название"
            autoFocus
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Название события"
          />
          <div>
            <label className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5">Тип</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="field"
            >
              <option value="meeting">Встреча</option>
              <option value="event">Событие</option>
              <option value="deadline">Дедлайн</option>
              <option value="task">Задача</option>
              <option value="holiday">Праздник</option>
              <option value="vacation">Отпуск</option>
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Начало"
              type="datetime-local"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            />
            <Input
              label="Завершение"
              type="datetime-local"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5">Описание</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="field resize-none"
              placeholder="Детали события…"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
