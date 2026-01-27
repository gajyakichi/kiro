"use client";

import { ActivityEntry } from "@/lib/types";
import { useMemo } from "react";

interface ActivityHeatmapProps {
  activityMap: Record<string, ActivityEntry[]>;
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  appLang: string;
  translations: any;
}

export default function ActivityHeatmap({ 
  activityMap, 
  selectedDate, 
  onSelectDate, 
  appLang, 
  translations: t 
}: ActivityHeatmapProps) {

  // Calculate Weeks
  const { weeks, getColor } = useMemo(() => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 365);
    
    // Adjust to start on Sunday
    while (startDate.getDay() !== 0) {
      startDate.setDate(startDate.getDate() - 1);
    }
  
    const weeksList = [];
    const current = new Date(startDate);
  
    for (let i = 0; i < 53; i++) {
      const days = [];
      for (let j = 0; j < 7; j++) {
        const dStr = current.toISOString().split('T')[0];
        const dayData = activityMap[dStr] || [];
        days.push({
          date: new Date(current),
          dateStr: dStr,
          data: dayData
        });
        current.setDate(current.getDate() + 1);
      }
      weeksList.push(days);
    }

    const getColor = (count: number) => {
        if (count === 0) return 'bg-neutral-100';
        if (count <= 2) return 'bg-green-200';
        if (count <= 5) return 'bg-green-300';
        if (count <= 8) return 'bg-green-400';
        return 'bg-green-500';
    };

    return { weeks: weeksList, getColor };
  }, [activityMap]);

  return (
    <div className="bg-white border border-(--border-color) p-8 rounded-3xl shadow-sm">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl font-black tracking-tight">{t.system_calendar}</h2>
          <p className="text-sm notion-text-subtle">{t.calendar_desc}</p>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-bold text-neutral-400 uppercase tracking-widest bg-neutral-50 px-4 py-2 rounded-xl border border-neutral-100">
          <span>{t.less}</span>
          <div className="flex gap-1">
            {[0, 2, 5, 10, 15].map(v => <div key={v} className={`w-3 h-3 rounded-sm ${getColor(v)}`} />)}
          </div>
          <span>{t.more}</span>
        </div>
      </div>

      <div className="flex gap-4">
          {/* Labels Column */}
          <div className="flex flex-col gap-1.5 pt-[26px] pr-1 select-none">
            {[0, 1, 2, 3, 4, 5, 6].map(d => (
              <div key={d} className="h-4 flex items-center text-[9px] font-bold text-neutral-300 uppercase leading-none">
                  {(d === 1 || d === 3 || d === 5) ? t.days_short[d] : ''}
              </div>
            ))}
          </div>

          {/* Graph Container */}
          <div className="overflow-x-auto pb-4 custom-scrollbar flex-1">
            {/* Month Headers */}
            <div className="flex gap-1.5 min-w-max mb-1.5 h-5 select-none">
              {weeks.map((week, wi) => {
                  const date = week[0].date;
                  const prevDate = wi > 0 ? weeks[wi-1][0].date : null;
                  const showMonth = wi === 0 || (prevDate && date.getMonth() !== prevDate.getMonth());
                  return (
                    <div key={wi} className="w-4 flex flex-col justify-end overflow-visible relative">
                        {showMonth && (
                          <span className="absolute left-0 bottom-0 text-[10px] font-bold text-neutral-400 whitespace-nowrap">
                              {date.toLocaleDateString(appLang, { month: 'short' })}
                          </span>
                        )}
                    </div>
                  );
              })}
            </div>
            
            {/* Heatmap Grid */}
            <div className="flex gap-1.5 min-w-max">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-1.5">
                  {week.map((day, di) => (
                    <button
                      key={di}
                      onClick={() => onSelectDate(day.dateStr)}
                      title={t.activity_level.replace('{count}', day.data.length.toString()).replace('{date}', day.dateStr)}
                      className={`w-4 h-4 rounded-sm transition-all hover:scale-125 hover:z-10 ${getColor(day.data.length)} ${selectedDate === day.dateStr ? 'ring-2 ring-(--theme-primary) ring-offset-2' : ''}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
      </div>
    </div>
  );
}
