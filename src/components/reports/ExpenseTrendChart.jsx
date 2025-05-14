import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ExpenseTrendChart({ data, showIncome = false }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        Nenhuma transação encontrada no período selecionado
      </div>
    );
  }

  // Função para formatar os valores em reais
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 0
    }).format(value);
  };

  // Formatar data para exibição
  const formatDate = (dateString) => {
    return format(parseISO(dateString), 'dd/MM', { locale: ptBR });
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={data}
        margin={{
          top: 10,
          right: 30,
          left: 0,
          bottom: 0,
        }}
      >
        <defs>
          <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
          </linearGradient>
          {showIncome && (
            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
            </linearGradient>
          )}
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis 
          dataKey="date" 
          tickFormatter={formatDate}
          tick={{ fontSize: 12 }}
        />
        <YAxis 
          tickFormatter={(value) => {
            return new Intl.NumberFormat('pt-BR', { 
              style: 'currency', 
              currency: 'BRL',
              notation: 'compact',
            }).format(value);
          }}
          tick={{ fontSize: 12 }}
        />
        <Tooltip 
          formatter={(value) => formatCurrency(value)}
          labelFormatter={(value) => format(parseISO(value), 'dd MMMM yyyy', { locale: ptBR })}
          contentStyle={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)' }}
        />
        <Legend />
        {showIncome && (
          <Area 
            type="monotone" 
            dataKey="income" 
            name="Receitas" 
            stroke="#10b981" 
            fill="url(#colorIncome)" 
            activeDot={{ r: 6 }}
          />
        )}
        <Area 
          type="monotone" 
          dataKey="expense" 
          name="Despesas" 
          stroke="#ef4444" 
          fill="url(#colorExpense)" 
          activeDot={{ r: 6 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}