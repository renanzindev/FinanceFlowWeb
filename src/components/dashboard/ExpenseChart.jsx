import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Button } from "@/components/ui/button";

const CHART_COLORS = [
  "#4f46e5", "#8b5cf6", "#d946ef", "#f43f5e", "#ec4899", 
  "#0ea5e9", "#0284c7", "#14b8a6", "#10b981", "#84cc16",
  "#eab308", "#f59e0b", "#f97316", "#ef4444", "#6366f1"
];

export default function ExpenseChart({ expensesByCategory, categories, period = "month" }) {
  const [chartType, setChartType] = useState("pie");
  
  // Get category name by ID - MODIFICADO PARA GARANTIR QUE APENAS CATEGORIAS DO USUÁRIO SEJAM USADAS
  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : "Sem categoria";
  };
  
  // Process data to replace category IDs with names
  const chartData = [];
  
  // Verificar dados válidos de expensesByCategory
  if (expensesByCategory && expensesByCategory.length > 0) {
    // Se já estiver no formato correto, usar direto
    chartData.push(...expensesByCategory);
  } else if (typeof expensesByCategory === 'object' && expensesByCategory !== null) {
    // Se for objeto de categorias, converter para o formato do gráfico
    Object.entries(expensesByCategory)
      .map(([categoryId, value]) => ({
        name: getCategoryName(categoryId),
        value: Math.abs(value)
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 7)
      .forEach(item => chartData.push(item));
    
    // Adicionar "Outros" para o resto
    const remainingSum = Object.entries(expensesByCategory)
      .map(([categoryId, value]) => ({
        name: getCategoryName(categoryId),
        value: Math.abs(value)
      }))
      .sort((a, b) => b.value - a.value)
      .slice(7)
      .reduce((sum, item) => sum + item.value, 0);
    
    if (remainingSum > 0) {
      chartData.push({
        name: "Outros",
        value: remainingSum
      });
    }
  }

  const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="#fff" 
        textAnchor="middle" 
        dominantBaseline="central"
        style={{ fontSize: '12px', fontWeight: 'bold' }}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <Card className="col-span-1 md:col-span-2">
      <CardHeader className="pb-2">
        <CardTitle>Despesas por Categoria</CardTitle>
        <CardDescription>
          {period === "month" ? "Distribuição das despesas do mês atual" : "Distribuição geral das despesas"}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2">
        <div className="h-80">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderLabel}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={CHART_COLORS[index % CHART_COLORS.length]} 
                    />
                  ))}
                </Pie>
                <Legend layout="vertical" align="right" verticalAlign="middle" />
                <Tooltip 
                  formatter={(value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center">
              <p className="text-muted-foreground">Nenhuma despesa registrada</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}