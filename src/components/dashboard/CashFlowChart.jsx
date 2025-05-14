import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function CashFlowChart({ cashFlowData }) {
  return (
    <Card className="col-span-1 md:col-span-2">
      <CardHeader className="pb-2">
        <CardTitle>Fluxo de Caixa</CardTitle>
        <CardDescription>Receitas vs despesas nos últimos 6 meses</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          {cashFlowData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={cashFlowData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="incomeColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return format(date, "MMM", { locale: ptBR });
                  }}
                />
                <YAxis 
                  tickFormatter={(value) => 
                    new Intl.NumberFormat('pt-BR', { 
                      notation: 'compact',
                      compactDisplay: 'short',
                      style: 'currency', 
                      currency: 'BRL' 
                    }).format(value)
                  }
                />
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <Tooltip 
                  formatter={(value) => 
                    new Intl.NumberFormat('pt-BR', { 
                      style: 'currency', 
                      currency: 'BRL' 
                    }).format(value)
                  }
                  labelFormatter={(value) => {
                    const date = new Date(value);
                    return format(date, "MMMM yyyy", { locale: ptBR });
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="income"
                  name="Receitas"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#incomeColor)"
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  name="Despesas"
                  stroke="#ef4444"
                  fillOpacity={1}
                  fill="url(#expenseColor)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              Sem dados de fluxo de caixa para exibir
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}