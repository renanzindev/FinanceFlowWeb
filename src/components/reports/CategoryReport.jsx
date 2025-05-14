import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = [
  '#4f46e5', '#8b5cf6', '#d946ef', '#f43f5e', '#ec4899', 
  '#0ea5e9', '#0284c7', '#14b8a6', '#10b981', '#84cc16',
  '#eab308', '#f59e0b', '#f97316', '#ef4444', '#6366f1'
];

export default function CategoryReport({ data }) {
  // Se não houver dados ou apenas um item, renderize uma mensagem
  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        Nenhuma categoria encontrada no período selecionado
      </div>
    );
  }

  // Limitar a 7 categorias principais e agrupar o resto como "Outros"
  let chartData = [];
  
  if (data.length <= 7) {
    chartData = data;
  } else {
    // Ordenar por valor e pegar os 6 principais
    const sortedData = [...data].sort((a, b) => b.amount - a.amount);
    const topCategories = sortedData.slice(0, 6);
    
    // Somar o resto como "Outros"
    const otherCategories = sortedData.slice(6);
    const otherAmount = otherCategories.reduce((sum, item) => sum + item.amount, 0);
    
    chartData = [
      ...topCategories,
      {
        id: 'others',
        name: 'Outros',
        amount: otherAmount,
        color: '#9ca3af'
      }
    ];
  }

  // Função para formatar os valores em reais
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value);
  };

  // Configuração para o gráfico
  const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null; // Não mostrar label para fatias pequenas

    return (
      <text 
        x={x} 
        y={y} 
        fill="#fff" 
        textAnchor="middle" 
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderLabel}
          outerRadius={120}
          fill="#8884d8"
          dataKey="amount"
          nameKey="name"
        >
          {chartData.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={entry.color || COLORS[index % COLORS.length]} 
            />
          ))}
        </Pie>
        <Tooltip 
          formatter={(value) => formatCurrency(value)}
          contentStyle={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)' }}
        />
        <Legend 
          layout="vertical" 
          verticalAlign="middle" 
          align="right" 
          formatter={(value, entry, index) => {
            return <span className="text-sm">{value}</span>;
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}