import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis,
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function MonthlyComparisonChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        Nenhuma transação encontrada para comparação mensal
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
  const formatMonth = (dateString) => {
    const [year, month] = dateString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return format(date, 'MMM', { locale: ptBR });
  };

  const calculateBalance = (data) => {
    return data.map(item => ({
      ...item,
      balance: item.income - item.expense
    }));
  };

  const chartData = calculateBalance(data);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={chartData}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis 
          dataKey="month" 
          tickFormatter={formatMonth} 
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
          contentStyle={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)' }}
          labelFormatter={(label) => {
            const [year, month] = label.split('-');
            const date = new Date(parseInt(year), parseInt(month) - 1);
            return format(date, 'MMMM yyyy', { locale: ptBR });
          }}
        />
        <Legend />
        <Bar dataKey="income" name="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expense" name="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
        <Bar dataKey="balance" name="Saldo" fill="#3b82f6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}