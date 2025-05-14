import React, { useState, useEffect } from "react";
import { Transaction } from "@/api/entities";
import { Account } from "@/api/entities";
import { Category } from "@/api/entities";
import { User } from "@/api/entities";
import { format, subDays, subMonths, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  BarChart3,
  PieChart,
  ArrowDown,
  ArrowUp,
  Calendar,
  Filter,
  FilePieChart,
  Download,
  LineChart,
  TrendingUp,
  ChevronDown,
  Activity
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { DatePickerWithRange } from "../components/ui/date-range-picker";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";

import ExpenseTrendChart from "../components/reports/ExpenseTrendChart";
import CategoryReport from "../components/reports/CategoryReport";
import MonthlyComparisonChart from "../components/reports/MonthlyComparisonChart";
import AccountBreakdown from "../components/reports/AccountBreakdown";

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Período selecionado para análise
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: new Date()
  });
  
  // Filtro para tipo de transação
  const [transactionType, setTransactionType] = useState("all");
  
  // Dados processados para relatórios
  const [reportData, setReportData] = useState({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    categoryBreakdown: [],
    dailyTrend: [],
    monthlyComparison: []
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (transactions.length > 0 && categories.length > 0) {
      processData();
    }
  }, [transactions, categories, dateRange, transactionType]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Obter usuário atual
      const user = await User.me();
      setCurrentUser(user);
      
      // Buscar transações dos últimos 6 meses para ter dados suficientes para comparação
      const sixMonthsAgo = subMonths(new Date(), 6);
      
      // Buscar transações, contas e categorias
      const [transactionsData, accountsData, categoriesData] = await Promise.all([
        Transaction.filter({ user_id: user.id, date: { $gte: format(sixMonthsAgo, 'yyyy-MM-dd') } }),
        Account.filter({ user_id: user.id }),
        Category.filter({ user_id: user.id })
      ]);
      
      setTransactions(transactionsData);
      setAccounts(accountsData);
      setCategories(categoriesData);
      
      setLoading(false);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
      setLoading(false);
    }
  };

  const processData = () => {
    // Filtrar transações pelo período selecionado
    const filteredTransactions = transactions.filter(transaction => {
      const transactionDate = parseISO(transaction.date);
      return (
        (!dateRange.from || transactionDate >= dateRange.from) &&
        (!dateRange.to || transactionDate <= dateRange.to) &&
        (transactionType === "all" || transaction.type === transactionType)
      );
    });
    
    // Calcular totais
    let totalIncome = 0;
    let totalExpense = 0;
    
    filteredTransactions.forEach(transaction => {
      if (transaction.type === "income") {
        totalIncome += transaction.amount;
      } else if (transaction.type === "expense") {
        totalExpense += Math.abs(transaction.amount);
      }
    });
    
    // Agrupar por categoria
    const categoryData = {};
    
    filteredTransactions.forEach(transaction => {
      if (!transaction.category) return;
      
      const categoryId = transaction.category;
      const amount = Math.abs(transaction.amount);
      
      if (!categoryData[categoryId]) {
        categoryData[categoryId] = {
          id: categoryId,
          amount: 0,
          count: 0
        };
      }
      
      categoryData[categoryId].amount += amount;
      categoryData[categoryId].count += 1;
    });
    
    // Converter para array e adicionar nomes de categorias
    const categoryBreakdown = Object.values(categoryData).map(item => {
      const category = categories.find(c => c.id === item.id);
      return {
        ...item,
        name: category ? category.name : "Categoria Desconhecida",
        color: category ? category.color : "#cccccc"
      };
    }).sort((a, b) => b.amount - a.amount);
    
    // Criar dados de tendência diária
    const dailyData = {};
    
    filteredTransactions.forEach(transaction => {
      const dateStr = transaction.date;
      
      if (!dailyData[dateStr]) {
        dailyData[dateStr] = {
          date: dateStr,
          income: 0,
          expense: 0
        };
      }
      
      if (transaction.type === "income") {
        dailyData[dateStr].income += transaction.amount;
      } else if (transaction.type === "expense") {
        dailyData[dateStr].expense += Math.abs(transaction.amount);
      }
    });
    
    // Converter para array e ordenar por data
    const dailyTrend = Object.values(dailyData)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Criar dados de comparação mensal (últimos 6 meses)
    const today = new Date();
    const monthlyData = {};
    
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(today, i);
      const monthStr = format(monthDate, 'yyyy-MM');
      
      monthlyData[monthStr] = {
        month: monthStr,
        income: 0,
        expense: 0
      };
    }
    
    transactions.forEach(transaction => {
      const transactionDate = parseISO(transaction.date);
      const monthStr = format(transactionDate, 'yyyy-MM');
      
      if (monthlyData[monthStr]) {
        if (transaction.type === "income") {
          monthlyData[monthStr].income += transaction.amount;
        } else if (transaction.type === "expense") {
          monthlyData[monthStr].expense += Math.abs(transaction.amount);
        }
      }
    });
    
    // Converter para array
    const monthlyComparison = Object.values(monthlyData);
    
    setReportData({
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      categoryBreakdown,
      dailyTrend,
      monthlyComparison
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Relatórios Financeiros</h1>
          <p className="text-muted-foreground">
            Análise detalhada das suas finanças no período selecionado
          </p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Exportar Relatório
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-md">Período da Análise</CardTitle>
          </CardHeader>
          <CardContent>
            <DatePickerWithRange
              date={dateRange}
              onDateChange={setDateRange}
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-md">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Filter className="mr-2 h-4 w-4" />
                    Tipo de Transação
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => setTransactionType("all")}>
                    Todas as Transações
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTransactionType("income")}>
                    <ArrowUp className="mr-2 h-4 w-4 text-emerald-500" />
                    Apenas Receitas
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTransactionType("expense")}>
                    <ArrowDown className="mr-2 h-4 w-4 text-rose-500" />
                    Apenas Despesas
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              <ArrowUp className="inline-block h-4 w-4 mr-1 text-emerald-500" />
              Total de Receitas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-6 w-24" />
            ) : (
              <div className="text-2xl font-bold text-emerald-500">
                {formatCurrency(reportData.totalIncome)}
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              <ArrowDown className="inline-block h-4 w-4 mr-1 text-rose-500" />
              Total de Despesas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-6 w-24" />
            ) : (
              <div className="text-2xl font-bold text-rose-500">
                {formatCurrency(reportData.totalExpense)}
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              <Activity className="inline-block h-4 w-4 mr-1 text-blue-500" />
              Saldo no Período
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-6 w-24" />
            ) : (
              <div className={`text-2xl font-bold ${reportData.balance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {formatCurrency(reportData.balance)}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span>Visão Geral</span>
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            <span>Categorias</span>
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <LineChart className="h-4 w-4" />
            <span>Tendências</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Comparativo Mensal</CardTitle>
                <CardDescription>
                  Receitas vs. Despesas nos últimos 6 meses
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[350px]">
                {loading ? (
                  <div className="h-full flex items-center justify-center">
                    <Skeleton className="h-full w-full" />
                  </div>
                ) : (
                  <MonthlyComparisonChart data={reportData.monthlyComparison} />
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Maiores Categorias de Despesas</CardTitle>
                <CardDescription>
                  Distribuição por categoria no período selecionado
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[350px]">
                {loading ? (
                  <div className="h-full flex items-center justify-center">
                    <Skeleton className="h-full w-full" />
                  </div>
                ) : (
                  <CategoryReport 
                    data={reportData.categoryBreakdown.filter(item => {
                      const category = categories.find(c => c.id === item.id);
                      return category && category.type === "expense";
                    })} 
                  />
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Evolução de Despesas</CardTitle>
                <CardDescription>
                  Tendência de gastos no período selecionado
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[350px]">
                {loading ? (
                  <div className="h-full flex items-center justify-center">
                    <Skeleton className="h-full w-full" />
                  </div>
                ) : (
                  <ExpenseTrendChart data={reportData.dailyTrend} />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="categories">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Despesas por Categoria</CardTitle>
                <CardDescription>
                  Detalhamento dos gastos por categoria
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="mb-4">
                        <Skeleton className="h-6 w-48 mb-2" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    ))
                  ) : (
                    <div className="space-y-6">
                      {reportData.categoryBreakdown
                        .filter(item => {
                          const category = categories.find(c => c.id === item.id);
                          return category && category.type === "expense";
                        })
                        .map((category) => (
                          <div key={category.id} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div 
                                  className="w-4 h-4 rounded-full mr-2" 
                                  style={{ backgroundColor: category.color || "#cccccc" }}
                                ></div>
                                <span className="font-medium">{category.name}</span>
                              </div>
                              <span className="font-medium">{formatCurrency(category.amount)}</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                              <div 
                                className="h-full rounded-full" 
                                style={{
                                  width: `${Math.min(100, (category.amount / reportData.totalExpense) * 100)}%`,
                                  backgroundColor: category.color || "#cccccc"
                                }}
                              ></div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {Math.round((category.amount / reportData.totalExpense) * 100)}% do total • {category.count} transações
                            </p>
                          </div>
                        ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Receitas por Categoria</CardTitle>
                <CardDescription>
                  Detalhamento das receitas por categoria
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="mb-4">
                        <Skeleton className="h-6 w-48 mb-2" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    ))
                  ) : (
                    <div className="space-y-6">
                      {reportData.categoryBreakdown
                        .filter(item => {
                          const category = categories.find(c => c.id === item.id);
                          return category && category.type === "income";
                        })
                        .map((category) => (
                          <div key={category.id} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div 
                                  className="w-4 h-4 rounded-full mr-2" 
                                  style={{ backgroundColor: category.color || "#cccccc" }}
                                ></div>
                                <span className="font-medium">{category.name}</span>
                              </div>
                              <span className="font-medium">{formatCurrency(category.amount)}</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                              <div 
                                className="h-full rounded-full" 
                                style={{
                                  width: `${Math.min(100, (category.amount / reportData.totalIncome) * 100)}%`,
                                  backgroundColor: category.color || "#cccccc"
                                }}
                              ></div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {Math.round((category.amount / reportData.totalIncome) * 100)}% do total • {category.count} transações
                            </p>
                          </div>
                        ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="trends">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Evolução de Receitas e Despesas</CardTitle>
                <CardDescription>
                  Comparativo de valores ao longo do tempo
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                {loading ? (
                  <div className="h-full flex items-center justify-center">
                    <Skeleton className="h-full w-full" />
                  </div>
                ) : (
                  <ExpenseTrendChart data={reportData.dailyTrend} showIncome={true} />
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Contas</CardTitle>
                <CardDescription>
                  Análise de transações por conta
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                {loading ? (
                  <div className="h-full flex items-center justify-center">
                    <Skeleton className="h-full w-full" />
                  </div>
                ) : (
                  <AccountBreakdown 
                    transactions={transactions.filter(transaction => {
                      const transactionDate = parseISO(transaction.date);
                      return (
                        (!dateRange.from || transactionDate >= dateRange.from) &&
                        (!dateRange.to || transactionDate <= dateRange.to)
                      );
                    })} 
                    accounts={accounts}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}