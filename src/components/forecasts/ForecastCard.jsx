import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDown, ArrowDownRight, ArrowUpRight, CalendarIcon } from "lucide-react";

export default function ForecastCard({ title, currentMonth, nextMonth, trend, iconColor }) {
  // Calculate percentage change
  const percentChange = currentMonth !== 0
    ? ((nextMonth - currentMonth) / Math.abs(currentMonth)) * 100
    : nextMonth > 0 
      ? 100 
      : 0;
  
  // Determine if trend is positive, negative or neutral
  const trendType = percentChange > 0 
    ? "up" 
    : percentChange < 0 
      ? "down" 
      : "neutral";
  
  // Format currency values
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Math.abs(value));
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader 
        className="pb-2"
        style={{
          borderBottom: `1px solid rgba(var(--${iconColor}), 0.2)`,
        }}
      >
        <CardTitle className="text-md font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs text-muted-foreground">Mês Atual</p>
            <p className="text-2xl font-bold mt-1">
              {formatCurrency(currentMonth)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Próximo Mês (Previsto)</p>
            <p className="text-2xl font-bold mt-1">
              {formatCurrency(nextMonth)}
            </p>
          </div>
        </div>
        
        <div className="mt-4 flex items-center">
          {trendType === "up" ? (
            <div className="flex items-center text-rose-500">
              <ArrowUpRight className="h-4 w-4 mr-1" />
              <span>+{Math.abs(percentChange).toFixed(1)}%</span>
            </div>
          ) : trendType === "down" ? (
            <div className="flex items-center text-emerald-500">
              <ArrowDownRight className="h-4 w-4 mr-1" />
              <span>-{Math.abs(percentChange).toFixed(1)}%</span>
            </div>
          ) : (
            <div className="flex items-center text-muted-foreground">
              <span>0%</span>
            </div>
          )}
          
          <p className="text-sm text-muted-foreground ml-2">
            {trend}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}