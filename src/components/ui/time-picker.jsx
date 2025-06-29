import { useState, useEffect } from "react"
import { Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"

export default function TimePicker({
  title = "Select Time",
  startIcon = <Clock className="h-3 w-3" />,
  buttonText = "Confirm Time",
  onTimeChange,
  onConfirm,
  defaultTime,
}) {
  const parseDefaultTime = () => {
    if (defaultTime) {
      const date = new Date(defaultTime);
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const period = hours >= 12 ? "PM" : "AM";
      const hour = hours % 12 || 12;
      return {
        hour: hour.toString().padStart(2, "0"),
        minute: minutes.toString().padStart(2, "0"),
        period
      };
    }
    return { hour: "12", minute: "00", period: "AM" };
  };

  const { hour: defaultHour, minute: defaultMinute, period: defaultPeriod } = parseDefaultTime();
  const [hour, setHour] = useState(defaultHour)
  const [minute, setMinute] = useState(defaultMinute)
  const [period, setPeriod] = useState(defaultPeriod)

  const hours = Array.from({ length: 12 }, (_, i) => {
    const h = i + 1
    return h.toString().padStart(2, "0");
  })

  const minutes = Array.from({ length: 60 }, (_, i) => {
    return i.toString().padStart(2, "0");
  })

  const formatTime = () => {
    const date = new Date();
    date.setHours(parseInt(hour, 10) + (period === "PM" && hour !== "12" ? 12 : 0));
    date.setMinutes(parseInt(minute, 10));
    date.setSeconds(0);
    return date.toISOString();
  }

  useEffect(() => {
    if (onTimeChange) {
      onTimeChange(formatTime())
    }
  }, [hour, minute, period, onTimeChange, formatTime])

  return (
    <div className="flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-xs">
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-medium text-gray-700">
              {startIcon}
              {title}
            </div>

            <div className="flex items-center gap-2">
              <Select value={hour} onValueChange={setHour}>
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {hours.map((h) => (
                    <SelectItem key={h} value={h}>
                      {h}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <span className="text-sm font-medium text-gray-500">:</span>

              <Select value={minute} onValueChange={setMinute}>
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {minutes.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AM">AM</SelectItem>
                  <SelectItem value="PM">PM</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="pt-1">
              <div className="text-lg font-mono font-semibold text-center text-gray-900">{`${hour}:${minute} ${period}`}</div>
            </div>

            <Button
              className="w-full h-8 text-sm"
              onClick={() => (onConfirm ? onConfirm(formatTime()) : console.log("Selected time:", formatTime()))}>
              {buttonText}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
