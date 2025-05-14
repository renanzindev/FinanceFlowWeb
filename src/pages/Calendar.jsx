
import React, { useState, useEffect } from "react";
import { Transaction } from "@/api/entities";
import { Account } from "@/api/entities";
import { Category } from "@/api/entities";
import { User } from "@/api/entities";
import { 
  format, 
  startOfWeek,
  endOfWeek,
  addDays,
  startOfMonth,
  endOfMonth,
  isToday,
  isSameMonth,
  getWeeksInMonth
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  ArrowDown,
  ArrowUp,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

import TransactionDialog from "../components/transactions/TransactionDialog";

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [viewMode, setViewMode] = useState("month"); // "month" or "week"
  const [currentUser, setCurrentUser] = useState(null);
  
  useEffect(() => {
    fetchData();
  }, [currentDate, viewMode]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Get current user
      const user = await User.me();
      setCurrentUser(user);
      
      // Determine date range based on view mode
      let startDate, endDate;
      
      if (viewMode === "month") {
        startDate = startOfMonth(currentDate);
        endDate = endOfMonth(currentDate);
      } else {
        startDate = startOfWeek(currentDate, { weekStartsOn: 0 });
        endDate = endOfWeek(currentDate, { weekStartsOn: 0 });
      }
      
      // Fetch transactions for the date range and current user
      const transactionsData = await Transaction.filter({
        user_id: user.id
      });
      
      // Filter transactions for the date range
      const filteredTransactions = transactionsData.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate >= startDate && transactionDate <= endDate;
      });
      
      setTransactions(filteredTransactions);
      
      // Fetch accounts and categories for current user
      const accountsData = await Account.filter({
        user_id: user.id
      });
      setAccounts(accountsData);
      
      const categoriesData = await Category.filter({
        user_id: user.id
      });
      setCategories(categoriesData);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setLoading(false);
  };

  const getAccountName = (accountId) => {
    const account = accounts.find(acc => acc.id === accountId);
    return account ? account.name : "N/A";
  };
  
  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : "";
  };

  const handleCreateTransaction = async (transactionData) => {
    try {
      await Transaction.create(transactionData);
      fetchData();
      setDialogOpen(false);
    } catch (error) {
      console.error("Error creating transaction:", error);
    }
  };

  const handleUpdateTransaction = async (transactionData) => {
    try {
      await Transaction.update(currentTransaction.id, transactionData);
      fetchData();
      setDialogOpen(false);
      setCurrentTransaction(null);
    } catch (error) {
      console.error("Error updating transaction:", error);
    }
  };

  const handleSaveTransaction = (transactionData) => {
    if (currentTransaction) {
      handleUpdateTransaction(transactionData);
    } else {
      handleCreateTransaction(transactionData);
    }
  };

  const handleAddTransaction = (date) => {
    setSelectedDate(date);
    setCurrentTransaction(null);
    setDialogOpen(true);
  };

  const handleEditTransaction = (transaction) => {
    setCurrentTransaction(transaction);
    setDialogOpen(true);
  };

  const handlePrevious = () => {
    if (viewMode === "month") {
      setCurrentDate(prevDate => {
        const newDate = new Date(prevDate);
        newDate.setMonth(newDate.getMonth() - 1);
        return newDate;
      });
    } else {
      setCurrentDate(prevDate => {
        const newDate = new Date(prevDate);
        newDate.setDate(newDate.getDate() - 7);
        return newDate;
      });
    }
  };

  const handleNext = () => {
    if (viewMode === "month") {
      setCurrentDate(prevDate => {
        const newDate = new Date(prevDate);
        newDate.setMonth(newDate.getMonth() + 1);
        return newDate;
      });
    } else {
      setCurrentDate(prevDate => {
        const newDate = new Date(prevDate);
        newDate.setDate(newDate.getDate() + 7);
        return newDate;
      });
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const toggleViewMode = () => {
    setViewMode(prev => prev === "month" ? "week" : "month");
  };

  // Get transactions for a specific day
  const getTransactionsForDay = (date) => {
    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return (
        transactionDate.getDate() === date.getDate() &&
        transactionDate.getMonth() === date.getMonth() &&
        transactionDate.getFullYear() === date.getFullYear()
      );
    });
  };

  // Calculate the days for the month view
  const generateMonthDays = () => {
    const firstDayOfMonth = startOfMonth(currentDate);
    const lastDayOfMonth = endOfMonth(currentDate);
    const startDate = startOfWeek(firstDayOfMonth, { weekStartsOn: 0 });
    
    const totalWeeks = getWeeksInMonth(currentDate);
    const days = [];
    
    let day = startDate;
    
    for (let i = 0; i < totalWeeks * 7; i++) {
      days.push(day);
      day = addDays(day, 1);
      
      // If we've gone past the end of the month and filled the week, stop
      if (day > lastDayOfMonth && day.getDay() === 0) {
        break;
      }
    }
    
    return days;
  };

  // Calculate the days for the week view
  const generateWeekDays = () => {
    const startDay = startOfWeek(currentDate, { weekStartsOn: 0 });
    return Array.from({ length: 7 }, (_, i) => addDays(startDay, i));
  };

  // Get total income and expense for a day
  const getDayTotals = (date) => {
    const dayTransactions = getTransactionsForDay(date);
    
    const incomeTotal = dayTransactions
      .filter(t => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
      
    const expenseTotal = Math.abs(
      dayTransactions
        .filter(t => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0)
    );
    
    return { incomeTotal, expenseTotal };
  };

  // Render the calendar based on the view mode
  const renderCalendar = () => {
    const days = viewMode === "month" ? generateMonthDays() : generateWeekDays();
    const daysOfWeek = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    
    return (
      <div className="w-full">
        {/* Header with weekday names */}
        <div className="grid grid-cols-7 bg-muted rounded-t-lg">
          {daysOfWeek.map((day, i) => (
            <div key={i} className="px-2 py-3 text-center text-sm font-medium">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar days */}
        <div className={`grid grid-cols-7 border rounded-b-lg overflow-hidden ${loading ? 'opacity-60' : ''}`}>
          {days.map((day, i) => {
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isCurrentDay = isToday(day);
            const dayTransactions = getTransactionsForDay(day);
            const { incomeTotal, expenseTotal } = getDayTotals(day);
            
            return (
              <div
                key={i}
                className={cn(
                  "min-h-[120px] p-2 border-t border-l relative",
                  !isCurrentMonth && "bg-muted/30 text-muted-foreground",
                  isCurrentDay && "bg-blue-50"
                )}
              >
                <div className="flex justify-between items-start">
                  <span className={cn(
                    "inline-flex items-center justify-center rounded-full text-sm w-7 h-7",
                    isCurrentDay && "bg-primary text-primary-foreground font-bold"
                  )}>
                    {format(day, "d")}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-blue-600 hover:text-blue-800 hover:bg-blue-100"
                    onClick={() => handleAddTransaction(day)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Show income and expense totals */}
                {(incomeTotal > 0 || expenseTotal > 0) && (
                  <div className="mt-1 text-xs space-y-1">
                    {incomeTotal > 0 && (
                      <div className="flex items-center text-emerald-600">
                        <ArrowUp className="h-3 w-3 mr-1" />
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                          notation: "compact"
                        }).format(incomeTotal)}
                      </div>
                    )}
                    {expenseTotal > 0 && (
                      <div className="flex items-center text-rose-600">
                        <ArrowDown className="h-3 w-3 mr-1" />
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                          notation: "compact"
                        }).format(expenseTotal)}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Transaction list */}
                <div className="mt-2 space-y-1 max-h-[80px] overflow-y-auto custom-scrollbar">
                  {loading ? (
                    <Skeleton className="h-4 w-full" />
                  ) : (
                    dayTransactions.slice(0, 3).map((transaction, index) => (
                      <div
                        key={transaction.id}
                        className="flex items-center text-xs py-0.5 px-1 rounded cursor-pointer hover:bg-muted/50"
                        onClick={() => handleEditTransaction(transaction)}
                      >
                        {transaction.type === "income" ? (
                          <ArrowUp className="h-3 w-3 text-emerald-600 mr-1 flex-shrink-0" />
                        ) : transaction.type === "expense" ? (
                          <ArrowDown className="h-3 w-3 text-rose-600 mr-1 flex-shrink-0" />
                        ) : (
                          <ArrowRight className="h-3 w-3 text-blue-600 mr-1 flex-shrink-0" />
                        )}
                        <span className="truncate">{transaction.description}</span>
                      </div>
                    ))
                  )}
                  {dayTransactions.length > 3 && (
                    <div className="text-xs text-center text-muted-foreground">
                      + {dayTransactions.length - 3} transações
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Calendário Financeiro</h1>
          <p className="text-muted-foreground">
            Visualize suas transações em um calendário
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrevious}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleToday}>
            Hoje
          </Button>
          <Button variant="outline" size="sm" onClick={handleNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={toggleViewMode}>
            {viewMode === "month" ? "Semana" : "Mês"}
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-2 md:p-6">
          <div className="mb-4 flex items-center justify-center">
            <h2 className="text-xl font-semibold">
              {format(currentDate, 
                viewMode === "month" ? "MMMM yyyy" : "'Semana de' dd 'de' MMMM", 
                { locale: ptBR }
              )}
            </h2>
          </div>
          
          {renderCalendar()}
        </CardContent>
      </Card>

      <TransactionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSaveTransaction}
        transaction={
          currentTransaction || (selectedDate ? {
            date: format(selectedDate, 'yyyy-MM-dd'),
            account_id: accounts.length > 0 ? accounts[0].id : "",
            type: "expense",
            user_id: currentUser ? currentUser.id : null,
          } : null)
        }
        accounts={accounts}
        categories={categories}
      />
    </div>
  );
}
