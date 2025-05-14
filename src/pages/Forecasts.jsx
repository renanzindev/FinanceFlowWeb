
import React, { useState, useEffect } from "react";
import { Transaction } from "@/api/entities";
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { ArrowDown, ArrowUp, BarChart3, DollarSign, Wallet, PiggyBank } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import ForecastCard from "../components/forecasts/ForecastCard";
import { User } from "@/api/entities";

export default function Forecasts() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("month");
  const [forecastPeriod, setForecastPeriod] = useState("3");
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Get current user
        const user = await User.me();
        setCurrentUser(user);
        
        // Fetch transactions for current user only
        const transactionData = await Transaction.filter({
          user_id: user.id
        }, "-date");
        
        setTransactions(transactionData);
      } catch (error) {
        console.error("Error fetching transactions:", error);
      }
      setLoading(false);
    }
    
    fetchData();
  }, []);

  // Get transactions for a specific month
  const getMonthTransactions = (date) => {
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    
    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= monthStart && transactionDate <= monthEnd;
    });
  };

  // Calculate monthly statistics
  const calculateMonthStats = (date) => {
    const monthTransactions = getMonthTransactions(date);
    
    const income = monthTransactions
      .filter(transaction => transaction.type === "income")
      .reduce((sum, transaction) => sum + transaction.amount, 0);
      
    const expenses = Math.abs(
      monthTransactions
        .filter(transaction => transaction.type === "expense")
        .reduce((sum, transaction) => sum + transaction.amount, 0)
    );
    
    const balance = income - expenses;
    
    return { income, expenses, balance };
  };

  // Calculate fixed expenses statistics
  const getFixedExpenses = () => {
    return transactions
      .filter(transaction => 
        transaction.type === "expense" && 
        transaction.is_fixed && 
        transaction.recurrence !== "none"
      );
  };

  // Calculate forecast for the next months
  const calculateForecast = () => {
    const currentDate = new Date();
    const forecastMonths = parseInt(forecastPeriod);
    const forecastData = [];
    
    const fixedIncomes = transactions.filter(transaction => 
      transaction.type === "income" && 
      transaction.is_fixed && 
      transaction.recurrence !== "none"
    );
    
    const fixedExpenses = transactions.filter(transaction => 
      transaction.type === "expense" && 
      transaction.is_fixed && 
      transaction.recurrence !== "none"
    );
    
    // Get recurring transaction data
    const fixedIncomesTotal = fixedIncomes.reduce((sum, transaction) => sum + transaction.amount, 0);
    const fixedExpensesTotal = Math.abs(fixedExpenses.reduce((sum, transaction) => sum + transaction.amount, 0));
    
    // Get averages from last 3 months for variable transactions
    let variableIncomeAvg = 0;
    let variableExpenseAvg = 0;
    
    for (let i = 1; i <= 3; i++) {
      const monthDate = subMonths(currentDate, i);
      const monthTransactions = getMonthTransactions(monthDate);
      
      const variableIncomes = monthTransactions
        .filter(transaction => 
          transaction.type === "income" && 
          (!transaction.is_fixed || transaction.recurrence === "none")
        );
      
      const variableExpenses = monthTransactions
        .filter(transaction => 
          transaction.type === "expense" && 
          (!transaction.is_fixed || transaction.recurrence === "none")
        );
      
      variableIncomeAvg += variableIncomes.reduce((sum, transaction) => sum + transaction.amount, 0);
      variableExpenseAvg += Math.abs(variableExpenses.reduce((sum, transaction) => sum + transaction.amount, 0));
    }
    
    variableIncomeAvg /= 3;
    variableExpenseAvg /= 3;
    
    // Current month stats
    const currentMonthStats = calculateMonthStats(currentDate);
    
    // Calculate forecast for future months
    for (let i = 0; i <= forecastMonths; i++) {
      const monthDate = addMonths(currentDate, i);
      
      if (i === 0) {
        // Current month (actual data)
        forecastData.push({
          month: format(monthDate, "MMM yyyy", { locale: ptBR }),
          income: currentMonthStats.income,
          expenses: currentMonthStats.expenses,
          balance: currentMonthStats.balance
        });
      } else {
        // Projected months
        const projectedIncome = fixedIncomesTotal + variableIncomeAvg;
        const projectedExpenses = fixedExpensesTotal + variableExpenseAvg;
        const projectedBalance = projectedIncome - projectedExpenses;
        
        forecastData.push({
          month: format(monthDate, "MMM yyyy", { locale: ptBR }),
          income: projectedIncome,
          expenses: projectedExpenses,
          balance: projectedBalance
        });
      }
    }
    
    return forecastData;
  };

  const forecastData = calculateForecast();
  
  // Get current and next month data
  const currentMonthData = forecastData[0] || { income: 0, expenses: 0, balance: 0 };
  const nextMonthData = forecastData[1] || { income: 0, expenses: 0, balance: 0 };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Previsões Financeiras</h1>
        <p className="text-muted-foreground">
          Visualize e planeje suas finanças futuras
        </p>
      </div>
      
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <Tabs value={viewMode} onValueChange={setViewMode}>
          <TabsList>
            <TabsTrigger value="month">Mensal</TabsTrigger>
            <TabsTrigger value="category">Por Categoria</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Período:</span>
          <Select value={forecastPeriod} onValueChange={setForecastPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Período de previsão" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 mês</SelectItem>
              <SelectItem value="3">3 meses</SelectItem>
              <SelectItem value="6">6 meses</SelectItem>
              <SelectItem value="12">12 meses</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Forecast Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <ForecastCard
          title="Receitas Previstas"
          currentMonth={currentMonthData.income}
          nextMonth={nextMonthData.income}
          trend="com base em padrões anteriores"
          iconColor="emerald-600"
        />
        <ForecastCard
          title="Despesas Previstas"
          currentMonth={currentMonthData.expenses}
          nextMonth={nextMonthData.expenses}
          trend="com base em padrões anteriores"
          iconColor="rose-600"
        />
        <ForecastCard
          title="Saldo Projetado"
          currentMonth={currentMonthData.balance}
          nextMonth={nextMonthData.balance}
          trend="com base nas previsões de receitas e despesas"
          iconColor="blue-600"
        />
      </div>
      
      {/* Forecast Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Projeção de Fluxo de Caixa</CardTitle>
          <CardDescription>
            Previsão para os próximos {forecastPeriod} meses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={forecastData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis
                  tickFormatter={(value) =>
                    new Intl.NumberFormat("pt-BR", {
                      notation: "compact",
                      compactDisplay: "short",
                      style: "currency",
                      currency: "BRL",
                    }).format(value)
                  }
                />
                <Tooltip
                  formatter={(value) =>
                    new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(value)
                  }
                />
                <Legend />
                <Bar
                  name="Receitas"
                  dataKey="income"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  name="Despesas"
                  dataKey="expenses"
                  fill="#ef4444"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  name="Saldo"
                  dataKey="balance"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      {/* Fixed Expenses Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Análise de Despesas Fixas</CardTitle>
            <CardDescription>
              Despesas recorrentes que impactam seu orçamento mensal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {getFixedExpenses().length > 0 ? (
                <>
                  <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center">
                        <ArrowDown className="h-5 w-5 text-rose-600" />
                      </div>
                      <div>
                        <p className="font-medium">Total de Despesas Fixas</p>
                        <p className="text-sm text-muted-foreground">
                          {getFixedExpenses().length} despesas recorrentes
                        </p>
                      </div>
                    </div>
                    <p className="text-xl font-bold text-rose-600">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(
                        Math.abs(
                          getFixedExpenses().reduce((sum, expense) => sum + expense.amount, 0)
                        )
                      )}
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    {getFixedExpenses()
                      .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
                      .slice(0, 5)
                      .map((expense) => (
                        <div key={expense.id} className="flex justify-between items-center p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{expense.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {expense.recurrence === "monthly" ? "Mensal" : 
                               expense.recurrence === "weekly" ? "Semanal" : 
                               expense.recurrence === "yearly" ? "Anual" : "Recorrente"}
                            </p>
                          </div>
                          <p className="text-rose-600 font-medium">
                            {new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(Math.abs(expense.amount))}
                          </p>
                        </div>
                      ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                  <Wallet className="h-12 w-12 mb-3 opacity-50" />
                  <p>Nenhuma despesa fixa cadastrada</p>
                  <p className="text-sm mt-1">
                    Adicione transações recorrentes para visualizar suas despesas fixas
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Dicas para Economizar</CardTitle>
            <CardDescription>
              Sugestões para melhorar suas finanças
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center flex-shrink-0">
                  <PiggyBank className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-medium text-blue-600 dark:text-blue-400">Reserva de Emergência</h3>
                  <p className="text-sm mt-1 text-muted-foreground">
                    Tente reservar o equivalente a 3-6 meses de despesas para emergências.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-800 rounded-full flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-medium text-emerald-600 dark:text-emerald-400">Regra 50/30/20</h3>
                  <p className="text-sm mt-1 text-muted-foreground">
                    Destine 50% da renda para necessidades, 30% para desejos e 20% para economias.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <div className="w-10 h-10 bg-amber-100 dark:bg-amber-800 rounded-full flex items-center justify-center flex-shrink-0">
                  <DollarSign className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="font-medium text-amber-600 dark:text-amber-400">Revisão de Despesas</h3>
                  <p className="text-sm mt-1 text-muted-foreground">
                    Revise suas assinaturas e serviços mensais para eliminar gastos desnecessários.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-800 rounded-full flex items-center justify-center flex-shrink-0">
                  <Wallet className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-medium text-purple-600 dark:text-purple-400">Orçamento Consciente</h3>
                  <p className="text-sm mt-1 text-muted-foreground">
                    Estabeleça um orçamento realista e monitore regularmente seus gastos.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
