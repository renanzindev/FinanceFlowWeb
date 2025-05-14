
import React, { useState, useEffect } from "react";
import { Account } from "@/api/entities";
import { User } from "@/api/entities";
import { Transaction } from "@/api/entities";
import { Category } from "@/api/entities";
import { Plus, Search, SlidersHorizontal, SortDesc } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import AccountCard from "../components/accounts/AccountCard";
import AccountDialog from "../components/accounts/AccountDialog";
import FixedTransactionDialog from "../components/transactions/FixedTransactionDialog";

export default function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("name");
  const [filterTab, setFilterTab] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentAccount, setCurrentAccount] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [fixedTransactions, setFixedTransactions] = useState([]);
  const [fixedTransactionDialogOpen, setFixedTransactionDialogOpen] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState(null);
  const [categories, setCategories] = useState([]);

  const fetchCategories = async () => {
    try {
      const user = await User.me();
      const categoryData = await Category.filter({
        user_id: user.id
      });
      setCategories(categoryData);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };
  
  const fetchFixedAccounts = async () => {
    setLoading(true);
    try {
      const user = await User.me();
      const fixedTransactions = await Transaction.filter({
        user_id: user.id,
        is_fixed: true
      });
      setFixedTransactions(fixedTransactions);
    } catch (error) {
      console.error("Error fetching fixed accounts:", error);
    }
    setLoading(false);
  };
  
  useEffect(() => {
    fetchAccounts();
    fetchFixedAccounts();
    fetchCategories();
  }, []);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const user = await User.me();
      setCurrentUser(user);
      const data = await Account.filter({
        user_id: user.id
      });
      setAccounts(data);
    } catch (error) {
      console.error("Error fetching accounts:", error);
    }
    setLoading(false);
  };

  const handleCreateAccount = async (accountData) => {
    try {
      if (!accountData.user_id && currentUser) {
        accountData.user_id = currentUser.id;
      }
      
      await Account.create(accountData);
      fetchAccounts();
      setDialogOpen(false);
    } catch (error) {
      console.error("Error creating account:", error);
    }
  };

  const handleUpdateAccount = async (accountData) => {
    try {
      await Account.update(currentAccount.id, accountData);
      fetchAccounts();
      setDialogOpen(false);
      setCurrentAccount(null);
    } catch (error) {
      console.error("Error updating account:", error);
    }
  };

  const handleDeleteAccount = async (account) => {
    if (window.confirm(`Tem certeza que deseja excluir a conta "${account.name}"?`)) {
      try {
        await Account.delete(account.id);
        fetchAccounts();
      } catch (error) {
        console.error("Error deleting account:", error);
      }
    }
  };

  const handleEditAccount = (account) => {
    setCurrentAccount(account);
    setDialogOpen(true);
  };

  const handleToggleActivity = async (account) => {
    try {
      await Account.update(account.id, { is_active: !account.is_active });
      fetchAccounts();
    } catch (error) {
      console.error("Error toggling account activity:", error);
    }
  };

  const handleSaveAccount = (accountData) => {
    if (currentAccount) {
      handleUpdateAccount(accountData);
    } else {
      handleCreateAccount(accountData);
    }
  };
  
  const handleEditFixedTransaction = (transaction) => {
    setCurrentTransaction(transaction);
    setFixedTransactionDialogOpen(true);
  };

  const handleSaveFixedTransaction = () => {
    fetchFixedAccounts();
    setCurrentTransaction(null);
  };

  const filteredAccounts = accounts
    .filter(account => {
      const matchesSearch = account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (account.institution && account.institution.toLowerCase().includes(searchQuery.toLowerCase()));
      
      if (filterTab === "all") return matchesSearch;
      if (filterTab === "active") return matchesSearch && account.is_active;
      if (filterTab === "inactive") return matchesSearch && !account.is_active;
      
      return matchesSearch && account.type === filterTab;
    })
    .sort((a, b) => {
      switch (sortOption) {
        case "name":
          return a.name.localeCompare(b.name);
        case "balance_high":
          return b.balance - a.balance;
        case "balance_low":
          return a.balance - b.balance;
        case "recently_updated":
          return new Date(b.updated_date) - new Date(a.updated_date);
        default:
          return 0;
      }
    });

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Suas Contas</h1>
          <p className="text-muted-foreground">
            Gerencie suas contas bancárias e cartões
          </p>
        </div>
        <Button 
          onClick={() => {
            setCurrentAccount(null);
            setDialogOpen(true);
          }}
          className="bg-primary"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nova Conta
        </Button>
      </div>

      <div className="flex space-x-2 border-b">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2 ${
            activeTab === "all"
              ? "border-b-2 border-primary font-medium text-primary"
              : "text-muted-foreground"
          }`}
        >
          Contas Bancárias
        </button>
        <button
          onClick={() => setActiveTab("fixed")}
          className={`px-4 py-2 ${
            activeTab === "fixed"
              ? "border-b-2 border-primary font-medium text-primary"
              : "text-muted-foreground"
          }`}
        >
          Contas Fixas
        </button>
      </div>

      {activeTab === "all" ? (
        <>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar conta..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex gap-2">
                  <SortDesc className="h-4 w-4" />
                  <span className="hidden sm:inline">Ordenar</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuRadioGroup value={sortOption} onValueChange={setSortOption}>
                  <DropdownMenuRadioItem value="name">Nome (A-Z)</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="balance_high">Saldo (Maior-Menor)</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="balance_low">Saldo (Menor-Maior)</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="recently_updated">Recentemente Atualizadas</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  <span className="hidden sm:inline">Filtrar</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuRadioGroup value={filterTab} onValueChange={setFilterTab}>
                  <DropdownMenuRadioItem value="all">Todas</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="active">Ativas</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="inactive">Inativas</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="checking">Contas Correntes</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="savings">Poupanças</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="credit_card">Cartões de Crédito</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="investment">Investimentos</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="rounded-xl overflow-hidden bg-card">
                  <Skeleton className="h-24 w-full" />
                  <div className="p-4 space-y-3">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-6 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredAccounts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAccounts.map((account) => (
                <AccountCard
                  key={account.id}
                  account={account}
                  onEdit={handleEditAccount}
                  onDelete={handleDeleteAccount}
                  onToggleActivity={handleToggleActivity}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium">Nenhuma conta encontrada</h3>
              <p className="text-muted-foreground mt-1">
                {searchQuery
                  ? "Tente ajustar sua busca ou filtros"
                  : "Clique em 'Nova Conta' para adicionar sua primeira conta"}
              </p>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Despesas Fixas</h2>
            <Button 
              variant="outline" 
              onClick={() => {
                setCurrentTransaction(null);
                setFixedTransactionDialogOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova Despesa Fixa
            </Button>
          </div>
          
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <Skeleton className="h-6 w-1/3 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-1" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
              ))}
            </div>
          ) : fixedTransactions.length > 0 ? (
            <div className="space-y-4">
              {fixedTransactions
                .filter(t => t.type === "expense")
                .map(transaction => {
                  const account = accounts.find(acc => acc.id === transaction.account_id);
                  const category = categories?.find(cat => cat.id === transaction.category);
                  
                  return (
                    <div 
                      key={transaction.id} 
                      className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => handleEditFixedTransaction(transaction)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-lg">{transaction.description}</h3>
                          <p className="text-sm text-muted-foreground">
                            {account ? account.name : "Conta não encontrada"}
                            {category && ` • ${category.name}`}
                            {transaction.recurrence && ` • ${getRecurrenceLabel(transaction.recurrence)}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-rose-600 font-medium text-lg">
                            {new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(transaction.amount)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Todo dia {new Date(transaction.date).getDate()}
                          </p>
                        </div>
                      </div>
                      {transaction.notes && (
                        <p className="mt-2 text-sm text-muted-foreground">{transaction.notes}</p>
                      )}
                    </div>
                  );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium">Nenhuma despesa fixa cadastrada</h3>
              <p className="text-muted-foreground mt-1">
                Adicione suas contas recorrentes para melhor controle financeiro
              </p>
            </div>
          )}
        </>
      )}

      <AccountDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        account={currentAccount}
        onSave={handleSaveAccount}
      />
      
      <FixedTransactionDialog
        open={fixedTransactionDialogOpen}
        onOpenChange={setFixedTransactionDialogOpen}
        transaction={currentTransaction}
        accounts={accounts}
        categories={categories}
        onSave={handleSaveFixedTransaction}
      />
    </div>
  );
}

function getRecurrenceLabel(recurrence) {
  switch(recurrence) {
    case "monthly": return "Mensal";
    case "weekly": return "Semanal";
    case "yearly": return "Anual";
    case "daily": return "Diário";
    default: return "Recorrente";
  }
}
