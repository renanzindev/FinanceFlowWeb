
import React, { useState, useEffect } from "react";
import { Budget } from "@/api/entities";
import { Category } from "@/api/entities";
import { Transaction } from "@/api/entities";
import { User } from "@/api/entities";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Plus, 
  Edit, 
  Trash2, 
  PieChart, 
  DollarSign, 
  Search, 
  Filter, 
  ArrowUpDown,
  BarChart 
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  Cell
} from "recharts";
import BudgetDialog from "../components/budgets/BudgetDialog";

export default function Budgets() {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortOption, setSortOption] = useState("name");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentBudget, setCurrentBudget] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [period, setPeriod] = useState("monthly");
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Get current user
      const user = await User.me();
      setCurrentUser(user);
      
      // Fetch budgets for current user only
      const budgetsData = await Budget.filter({
        user_id: user.id
      });
      setBudgets(budgetsData);
      
      // Fetch categories for current user only
      const categoriesData = await Category.filter({
        user_id: user.id
      });
      setCategories(categoriesData);
      
      // Fetch transactions for the current month and current user
      const currentDate = new Date();
      const firstDay = startOfMonth(currentDate);
      const lastDay = endOfMonth(currentDate);
      
      const transactionsData = await Transaction.filter({
        user_id: user.id
      });
      
      const currentMonthTransactions = transactionsData.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate >= firstDay && transactionDate <= lastDay;
      });
      
      setTransactions(currentMonthTransactions);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setLoading(false);
  };

  const handleCreateBudget = async (budgetData) => {
    try {
      // Add user_id to budget
      if (!budgetData.user_id && currentUser) {
        budgetData.user_id = currentUser.id;
      }
      
      await Budget.create(budgetData);
      fetchData();
      setDialogOpen(false);
    } catch (error) {
      console.error("Error creating budget:", error);
    }
  };

  const handleUpdateBudget = async (budgetData) => {
    try {
      // Add user_id to budget
      if (!budgetData.user_id && currentUser) {
        budgetData.user_id = currentUser.id;
      }
      
      await Budget.update(currentBudget.id, budgetData);
      fetchData();
      setDialogOpen(false);
      setCurrentBudget(null);
    } catch (error) {
      console.error("Error updating budget:", error);
    }
  };

  const handleDeleteBudget = async (budget) => {
    if (window.confirm(`Tem certeza que deseja excluir o orçamento "${budget.name}"?`)) {
      try {
        await Budget.delete(budget.id);
        fetchData();
      } catch (error) {
        console.error("Error deleting budget:", error);
      }
    }
  };

  const handleEditBudget = (budget) => {
    setCurrentBudget(budget);
    setDialogOpen(true);
  };

  const handleSaveBudget = (budgetData) => {
    if (currentBudget) {
      handleUpdateBudget(budgetData);
    } else {
      handleCreateBudget(budgetData);
    }
  };

  // Get category name by ID
  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : "Categoria não encontrada";
  };

  // Calculate spent amount for each budget
  const budgetsWithSpent = budgets.map(budget => {
    // Find transactions for this category
    const categoryTransactions = transactions.filter(
      transaction => transaction.category === budget.category_id
    );
    
    const spent = Math.abs(
      categoryTransactions.reduce((sum, transaction) => {
        if (transaction.type === "expense") {
          return sum + Math.abs(transaction.amount);
        }
        return sum;
      }, 0)
    );
    
    const percentUsed = budget.amount ? Math.min(100, Math.round((spent / budget.amount) * 100)) : 0;
    
    return {
      ...budget,
      spent,
      percentUsed,
      remaining: Math.max(0, budget.amount - spent)
    };
  });

  // Filter and sort budgets
  const filteredBudgets = budgetsWithSpent
    .filter(budget => {
      return (
        budget.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        getCategoryName(budget.category_id).toLowerCase().includes(searchQuery.toLowerCase())
      );
    })
    .sort((a, b) => {
      switch (sortOption) {
        case "name":
          return a.name.localeCompare(b.name);
        case "amount_high":
          return b.amount - a.amount;
        case "amount_low":
          return a.amount - b.amount;
        case "percent_used":
          return b.percentUsed - a.percentUsed;
        default:
          return 0;
      }
    });

  // Generate chart data
  const chartData = filteredBudgets.slice(0, 10).map(budget => ({
    name: budget.name,
    budget: budget.amount,
    spent: budget.spent,
    percentUsed: budget.percentUsed
  }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Orçamentos</h1>
          <p className="text-muted-foreground">
            Gerencie seus limites de gastos por categoria
          </p>
        </div>
        <Button 
          onClick={() => {
            setCurrentBudget(null);
            setDialogOpen(true);
          }}
          className="bg-primary"
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Orçamento
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar orçamento..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex gap-2">
              <ArrowUpDown className="h-4 w-4" />
              <span className="hidden sm:inline">Ordenar</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuRadioGroup value={sortOption} onValueChange={setSortOption}>
              <DropdownMenuRadioItem value="name">Nome (A-Z)</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="amount_high">Valor (Maior-Menor)</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="amount_low">Valor (Menor-Maior)</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="percent_used">% Utilizado (Maior-Menor)</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Budget Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Visão Geral</CardTitle>
          <CardDescription>
            Utilização dos orçamentos no mês de {format(new Date(), 'MMMM yyyy', { locale: ptBR })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <Skeleton className="h-full w-full rounded-lg" />
              </div>
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis 
                    type="number" 
                    tickFormatter={(value) => 
                      new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                        notation: "compact"
                      }).format(value)
                    }
                  />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    width={150}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value) => 
                      new Intl.NumberFormat("pt-BR", { 
                        style: "currency", 
                        currency: "BRL" 
                      }).format(value)
                    }
                  />
                  <Bar 
                    dataKey="budget" 
                    fill="#e5e7eb" 
                    name="Orçamento"
                    radius={[0, 4, 4, 0]}
                  />
                  <Bar 
                    dataKey="spent" 
                    name="Gasto atual"
                    radius={[0, 4, 4, 0]}
                  >
                    {
                      chartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={
                            entry.percentUsed >= 90 ? '#ef4444' : 
                            entry.percentUsed >= 75 ? '#f97316' : 
                            entry.percentUsed >= 50 ? '#3b82f6' : 
                            '#10b981'
                          }
                        />
                      ))
                    }
                    <LabelList 
                      dataKey="percentUsed" 
                      position="right" 
                      formatter={(value) => `${value}%`}
                    />
                  </Bar>
                </RechartsBarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <BarChart className="h-16 w-16 mb-4 opacity-30" />
                <p className="text-lg">Nenhum orçamento encontrado</p>
                <p className="text-sm mt-1">Adicione um orçamento para visualizar seus gastos</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Budget List */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Período</TableHead>
              <TableHead>Orçamento</TableHead>
              <TableHead>Gasto</TableHead>
              <TableHead>Restante</TableHead>
              <TableHead>Progresso</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              // Loading state
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : filteredBudgets.length > 0 ? (
              // Budget rows
              filteredBudgets.map((budget) => (
                <TableRow key={budget.id}>
                  <TableCell className="font-medium">{budget.name}</TableCell>
                  <TableCell>{getCategoryName(budget.category_id)}</TableCell>
                  <TableCell>
                    {budget.period === "monthly" ? "Mensal" : 
                     budget.period === "weekly" ? "Semanal" : 
                     budget.period === "yearly" ? "Anual" : budget.period}
                  </TableCell>
                  <TableCell>
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(budget.amount)}
                  </TableCell>
                  <TableCell>
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(budget.spent)}
                  </TableCell>
                  <TableCell>
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(budget.remaining)}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 w-32">
                      <Progress 
                        value={budget.percentUsed} 
                        className={
                          budget.percentUsed >= 90 ? "bg-rose-600" : 
                          budget.percentUsed >= 75 ? "bg-amber-500" : 
                          budget.percentUsed >= 50 ? "bg-blue-500" : 
                          "bg-emerald-600"
                        }
                      />
                      <p className="text-xs text-muted-foreground text-right">
                        {budget.percentUsed}% usado
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditBudget(budget)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-rose-600"
                        onClick={() => handleDeleteBudget(budget)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              // Empty state
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <PieChart className="h-8 w-8 mb-2" />
                    <p>Nenhum orçamento encontrado</p>
                    <p className="text-sm">
                      {searchQuery
                        ? "Tente ajustar sua busca"
                        : "Clique em 'Novo Orçamento' para adicionar seu primeiro orçamento"}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <BudgetDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSaveBudget}
        budget={currentBudget}
        categories={categories.filter(category => category.type === "expense")}
      />
    </div>
  );
}
