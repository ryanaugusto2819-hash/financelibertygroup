import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useState } from "react";

interface DateFilterProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

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

export function DateFilter({ selectedDate, onDateChange }: DateFilterProps) {
  const [activePreset, setActivePreset] = useState<FilterPreset>("hoje");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date(selectedDate + "T12:00:00"));

  const handlePreset = (preset: FilterPreset) => {
    setActivePreset(preset);
    const today = new Date();

    switch (preset) {
      case "hoje": {
        const d = today;
        setDate(d);
        onDateChange(format(d, "yyyy-MM-dd"));
        break;
      }
      case "ontem": {
        const d = subDays(today, 1);
        setDate(d);
        onDateChange(format(d, "yyyy-MM-dd"));
        break;
      }
      case "7dias": {
        const d = subDays(today, 7);
        setDate(d);
        onDateChange(format(d, "yyyy-MM-dd"));
        break;
      }
      case "15dias": {
        const d = subDays(today, 15);
        setDate(d);
        onDateChange(format(d, "yyyy-MM-dd"));
        break;
      }
      case "30dias": {
        const d = subDays(today, 30);
        setDate(d);
        onDateChange(format(d, "yyyy-MM-dd"));
        break;
      }
      case "total": {
        const d = new Date("2024-01-01T12:00:00");
        setDate(d);
        onDateChange(format(d, "yyyy-MM-dd"));
        break;
      }
      case "personalizado": {
        setCalendarOpen(true);
        break;
      }
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
          onClick={() => handlePreset(p.key)}
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
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-1.5 h-3 w-3" />
              {date ? format(date, "dd/MM/yyyy") : "Selecionar"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => {
                if (d) {
                  setDate(d);
                  onDateChange(format(d, "yyyy-MM-dd"));
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
