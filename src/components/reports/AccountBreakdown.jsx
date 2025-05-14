import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = [
  '#4f46e5', '#8b5cf6', '#d946ef', '#f43f5e', '#ec4899', 
  '#0ea5e9', '#0284c7', '#14b8a6', '#10b981', '#84cc16',
  '#eab308', '#f59e0b', '#f97316', '#ef4444', '#6366f1'
];

export default function AccountBreakdown({ transactions, accounts }) {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    processData();
  }, [transactions, accounts]);

  const processData = () => {
    if (!transactions || !accounts || transactions.length === 0 || accounts.length === 0) {
      setChartData([]);
      return;
    }

    // Agrupar transações por conta
    const accountData = {};

    transactions.forEach(transaction => {
      if (!transaction.account_id) return;

      const accountId = transaction.account_id;

      if (!accountData[accountId]) {
        accountData[accountId] = {
          id: accountId,
          expenses: 0,
          income: 0,
          count: 0
        };
      }

      if (transaction.type === "expense") {
        accountData[accountId].expenses += Math.abs(transaction.amount);
      } else if (transaction.type === "income") {
        accountData[accountId].income += transaction.amount;
      }

      accountData[accountId].count += 1;
    });

    // Converter para array e adicionar nomes de contas
    const data = Object.values(accountData).map(item => {
      const account = accounts.find(acc => acc.id === item.id);
      return {
        ...item,
        name: account ? account.name : "Conta Desconhecida",
        color: account ? account.color : "#cccccc",
        value: item.expenses // Usamos despesas como valor principal para o gráfico
      };
    }).sort((a, b) => b.value - a.value);

    setChartData(data);
  };

  // Função para formatar os valores em reais
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value);
  };

  if (chartData.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        Nenhuma transação encontrada para as contas no período selecionado
      </div>
    );
  }

  return (
    <div className="h-full">
      <ResponsiveContainer width="100%" height="70%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
            nameKey="name"
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            labelLine={false}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value) => formatCurrency(value)}
            contentStyle={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)' }}
          />
          <Legend layout="vertical" verticalAlign="bottom" align="center" />
        </PieChart>
      </ResponsiveContainer>
      
      <div className="grid grid-cols-3 gap-2 pt-4">
        {chartData.slice(0, 3).map((account) => (
          <div 
            key={account.id} 
            className="p-3 rounded-lg border"
            style={{borderColor: account.color || "#cccccc"}}
          >
            <p className="font-medium text-sm truncate" title={account.name}>
              {account.name}
            </p>
            <div className="flex flex-col mt-1">
              <span className="text-xs text-muted-foreground">
                Receitas: <span className="text-emerald-500 font-medium">
                  {formatCurrency(account.income)}
                </span>
              </span>
              <span className="text-xs text-muted-foreground">
                Despesas: <span className="text-rose-500 font-medium">
                  {formatCurrency(account.expenses)}
                </span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}