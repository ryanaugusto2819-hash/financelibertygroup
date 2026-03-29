import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useState } from "react";
import { useFinance } from "@/context/FinanceContext";
import { getNowBR, getTodayBR } from "@/lib/finance-data";

type FilterPreset = "hoje" | "ontem" | "7dias" | "15dias" | "30dias" | "total" | "personalizado";
const presets: { key: FilterPreset; label: string }[] = [
  { key: "hoje", label: "Hoje" },
  { key: "ontem", label: "Ontem" },
  { key: "7dias", label: "Últimos 7 dias" },
  { key: "15dias", label: "Últimos 15 dias" },
  { key: "30dias", label: "Últimos 30 dias" },
  { key: "total", label: "Total" },
  { key: "personalizado", label: "Personalizado" },
];

function getToday() {
  return new Date();
}

export function DateFilter() {
  const { setSelectedDate, setDateRange } = useFinance();
  const [activePreset, setActivePreset] = useState<FilterPreset>("hoje");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [customDate, setCustomDate] = useState<Date | undefined>(undefined);

  const applyPreset = (preset: FilterPreset) => {
    setActivePreset(preset);
    const today = getToday();
    const todayStr = format(today, "yyyy-MM-dd");

    switch (preset) {
      case "hoje":
        setSelectedDate(todayStr);
        setDateRange({ from: todayStr, to: todayStr });
        break;
      case "ontem": {
        const d = format(subDays(today, 1), "yyyy-MM-dd");
        setSelectedDate(d);
        setDateRange({ from: d, to: d });
        break;
      }
      case "7dias": {
        const from = format(subDays(today, 6), "yyyy-MM-dd");
        setSelectedDate(todayStr);
        setDateRange({ from, to: todayStr });
        break;
      }
      case "15dias": {
        const from = format(subDays(today, 14), "yyyy-MM-dd");
        setSelectedDate(todayStr);
        setDateRange({ from, to: todayStr });
        break;
      }
      case "30dias": {
        const from = format(subDays(today, 29), "yyyy-MM-dd");
        setSelectedDate(todayStr);
        setDateRange({ from, to: todayStr });
        break;
      }
      case "total":
        setSelectedDate(todayStr);
        setDateRange({ from: "2024-01-01", to: "2099-12-31" });
        break;
      case "personalizado":
        setCalendarOpen(true);
        break;
    }
  };

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {presets.map((p) => (
        <Button
          key={p.key}
          size="sm"
          variant={activePreset === p.key ? "default" : "outline"}
          className="text-[11px] h-7 px-2.5"
          onClick={() => applyPreset(p.key)}
        >
          {p.label}
        </Button>
      ))}

      {activePreset === "personalizado" && (
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-7 px-2.5 text-[11px] justify-start font-normal",
                !customDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-1.5 h-3 w-3" />
              {customDate ? format(customDate, "dd/MM/yyyy") : "Selecionar"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={customDate}
              onSelect={(d) => {
                if (d) {
                  const dateStr = format(d, "yyyy-MM-dd");
                  setCustomDate(d);
                  setSelectedDate(dateStr);
                  setDateRange({ from: dateStr, to: dateStr });
                  setCalendarOpen(false);
                }
              }}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
