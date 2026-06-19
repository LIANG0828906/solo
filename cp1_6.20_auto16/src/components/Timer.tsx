import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface TimerProps {
  duration: number;
  onTimeUp?: () => void;
  isRunning?: boolean;
}

export default function Timer({ duration, onTimeUp, isRunning = true }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const prevTimeRef = useRef(timeLeft);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onTimeUp?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, onTimeUp]);

  useEffect(() => {
    prevTimeRef.current = timeLeft;
  }, [timeLeft]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const isWarning = timeLeft <= 30 && timeLeft > 10;
  const isCritical = timeLeft <= 10 && timeLeft > 0;
  const isFlashing = isCritical && timeLeft !== prevTimeRef.current;

  return (
    <div
      className={cn(
        "text-3xl font-bold font-mono tracking-wider",
        isWarning && "text-arena-warning",
        isCritical && "text-arena-danger animate-flash-red",
        isFlashing && "animate-pulse-fast"
      )}
    >
      {formattedTime}
    </div>
  );
}
