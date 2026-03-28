import { useFinance, CountryFilter as CountryFilterType } from "@/context/FinanceContext";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

const options: { key: CountryFilterType; label: string; flag?: string }[] = [
  { key: "todos", label: "Todos", flag: "🌎" },
  { key: "brasil", label: "Brasil", flag: "🇧🇷" },
  { key: "uruguay", label: "Uruguay", flag: "🇺🇾" },
];

export function CountryFilter() {
  const { countryFilter, setCountryFilter } = useFinance();

  return (
    <div className="flex items-center gap-1">
      <Globe className="w-3.5 h-3.5 text-muted-foreground mr-1" />
      {options.map((opt) => (
        <Button
          key={opt.key}
          size="sm"
          variant={countryFilter === opt.key ? "default" : "outline"}
          className="text-[11px] h-7 px-2.5 gap-1"
          onClick={() => setCountryFilter(opt.key)}
        >
          <span>{opt.flag}</span>
          {opt.label}
        </Button>
      ))}
    </div>
  );
}
