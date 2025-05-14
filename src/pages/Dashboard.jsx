
import React, { useState, useEffect } from "react";
import { Account } from "@/api/entities";
import { Transaction } from "@/api/entities";
import { Category } from "@/api/entities";
import { User } from "@/api/entities";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

import BalanceCard from "../components/dashboard/BalanceCard";
import ExpenseChart from "../components/dashboard/ExpenseChart";
import CashFlowChart from "../components/dashboard/CashFlowChart";
import AccountsList from "../components/dashboard/AccountsList";
import RecentTransactions from "../components/dashboard/RecentTransactions";
import UpcomingBills from "../components/dashboard/UpcomingBills";

export default function Dashboard() {
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const user = await User.me();
        setCurrentUser(user);
        
        const [accountData, transactionData, categoriesData] = await Promise.all([
          Account.filter({ user_id: user.id }),
          Transaction.filter({ user_id: user.id }, "-date", 100), // Aumentar limite para buscar mais transações
          Category.filter({ user_id: user.id })
        ]);
        
        setAccounts(accountData);
        setTransactions(transactionData);
        setCategories(categoriesData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
      setLoading(false);
    }
    
    fetchData();
  }, []);
    
  // Calculate total balance
  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
  
  // Get current month's transactions
  const currentDate = new Date();
  const firstDayOfMonth = startOfMonth(currentDate);
  const lastDayOfMonth = endOfMonth(currentDate);
  
  const currentMonthTransactions = transactions.filter(transaction => {
    const transactionDate = new Date(transaction.date);
    return transactionDate >= firstDayOfMonth && transactionDate <= lastDayOfMonth;
  });
  
  // Calculate monthly income and expenses
  const monthlyIncome = currentMonthTransactions
    .filter(transaction => transaction.type === "income")
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  
  const monthlyExpenses = currentMonthTransactions
    .filter(transaction => transaction.type === "expense")
    .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);

  // Get upcoming bills (unpaid expenses with future dates)
  const upcomingBills = transactions
    .filter(transaction => 
      transaction.type === "expense" && 
      !transaction.is_paid &&
      new Date(transaction.date) >= new Date()
    )
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  
  // Calculate expenses by category for chart
  const expensesByCategory = {};
  currentMonthTransactions
    .filter(transaction => transaction.type === "expense")
    .forEach(transaction => {
      if (!transaction.category) return;
      
      const categoryId = transaction.category;
      expensesByCategory[categoryId] = (expensesByCategory[categoryId] || 0) + Math.abs(transaction.amount);
    });
  
  // Generate cash flow data for chart (last 6 months)
  const cashFlowData = [];
  for (let i = 5; i >= 0; i--) {
    const monthDate = subMonths(currentDate, i);
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    
    const monthTransactions = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= monthStart && transactionDate <= monthEnd;
    });
    
    const income = monthTransactions
      .filter(transaction => transaction.type === "income")
      .reduce((sum, transaction) => sum + transaction.amount, 0);
      
    const expense = Math.abs(
      monthTransactions
        .filter(transaction => transaction.type === "expense")
        .reduce((sum, transaction) => sum + transaction.amount, 0)
    );
    
    cashFlowData.push({
      date: monthStart.toISOString(),
      income,
      expense
    });
  }

    // Prepare data for expense chart
    const expensesChartData = {};
    currentMonthTransactions
      .filter(transaction => transaction.type === "expense")
      .forEach(transaction => {
        if (!transaction.category) return;
        
        const categoryId = transaction.category;
        expensesChartData[categoryId] = (expensesChartData[categoryId] || 0) + Math.abs(transaction.amount);
      });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Bem-vindo ao seu Dashboard
        </h1>
        <p className="text-muted-foreground">
          Visão geral das suas finanças - {format(new Date(), "MMMM yyyy", { locale: ptBR })}
        </p>
      </div>
      
      <BalanceCard 
        totalBalance={totalBalance}
        monthlyIncome={monthlyIncome}
        monthlyExpenses={monthlyExpenses}
        accounts={accounts}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ExpenseChart 
          expensesByCategory={expensesByCategory}
          categories={categories} 
        />
        <CashFlowChart cashFlowData={cashFlowData} />
        <AccountsList accounts={accounts} />
        <RecentTransactions transactions={transactions} accounts={accounts} />
        <UpcomingBills upcomingBills={upcomingBills} />
      </div>
    </div>
  );
}
