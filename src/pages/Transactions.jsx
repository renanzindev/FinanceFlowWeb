
import React, { useState, useEffect } from "react";
import { Transaction } from "@/api/entities";
import { Account } from "@/api/entities";
import { Category } from "@/api/entities";
import { User } from "@/api/entities";
import { 
  Plus, 
  Search, 
  Filter, 
  ArrowUpDown, 
  ChevronDown,
  Calendar,
  CalendarDays,
  ArrowDown,
  ArrowUp,
  ArrowRight,
  Check,
  Trash2,
  Edit
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import TransactionDialog from "../components/transactions/TransactionDialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Checkbox } from "@/components/ui/checkbox";

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedTransactions, setSelectedTransactions] = useState([]);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);
  
  // Filters
  const [filters, setFilters] = useState({
    type: "all",
    account: "all", // This will now filter by account OR credit card
    category: "all",
    dateRange: "all",
    status: "all",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      // Get current user
      const user = await User.me();
      setCurrentUser(user);
      
      // Fetch transactions for current user
      const transactionData = await Transaction.filter({
        user_id: user.id
      }, "-date");
      setTransactions(transactionData);
      
      // Fetch accounts for current user
      const accountData = await Account.filter({
        user_id: user.id
      });
      setAccounts(accountData);
      
      // Fetch categories for current user
      const categoryData = await Category.filter({
        user_id: user.id
      });
      setCategories(categoryData);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateTransaction = async (transactionData) => {
    try {
      // Add user_id to transaction if not already present
      if (!transactionData.user_id && currentUser) {
        transactionData.user_id = currentUser.id;
      }
      
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

  const handleDeleteTransaction = async () => {
    if (!transactionToDelete) return;
    
    try {
      await Transaction.delete(transactionToDelete.id);
      setTransactionToDelete(null);
      setConfirmDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error deleting transaction:", error);
    }
  };

  const handleDeleteSelected = async () => {
    try {
      for (const transaction of selectedTransactions) {
        await Transaction.delete(transaction.id);
      }
      setSelectedTransactions([]);
      fetchData();
    } catch (error) {
      console.error("Error deleting transactions:", error);
    }
  };

  const handleSaveTransaction = (transactionData) => {
    // The handleSubmit in TransactionDialog now directly calls onSave(processedData)
    // which can be empty if installments are processed. So, we just refresh data.
    if (Object.keys(transactionData).length > 0) { // Check if it's a regular save
        if (currentTransaction) {
          handleUpdateTransaction(transactionData);
        } else {
          handleCreateTransaction(transactionData);
        }
    } else { // Installments were processed, just refresh
        fetchData();
        setDialogOpen(false); // Ensure dialog closes
    }
  };

  const handleTogglePaid = async (transaction) => {
    try {
      await Transaction.update(transaction.id, { 
        is_paid: !transaction.is_paid
      });
      fetchData();
    } catch (error) {
      console.error("Error toggling paid status:", error);
    }
  };

  const handleEditTransaction = (transaction) => {
    setCurrentTransaction(transaction);
    setDialogOpen(true);
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const handleSelectTransaction = (transaction) => {
    setSelectedTransactions(prev => {
      const isSelected = prev.find(t => t.id === transaction.id);
      if (isSelected) {
        return prev.filter(t => t.id !== transaction.id);
      } else {
        return [...prev, transaction];
      }
    });
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedTransactions(filteredTransactions);
    } else {
      setSelectedTransactions([]);
    }
  };
  
  // Get account name by id
  const getAccountName = (accountId) => {
    const account = accounts.find(acc => acc.id === accountId);
    return account ? account.name : "N/A";
  };
  
  // Get category name by id
  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : "";
  };

  // Filter transactions
  const filteredTransactions = transactions.filter(transaction => {
    // Text search
    const matchesSearch = 
      transaction.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (transaction.notes && transaction.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Type filter
    const matchesType = filters.type === "all" || transaction.type === filters.type;
    
    // Account filter (now includes credit cards)
    const matchesAccount = filters.account === "all" || transaction.account_id === filters.account;
    
    // Category filter
    const matchesCategory = filters.category === "all" || transaction.category === filters.category;
    
    // Status filter
    const matchesStatus = 
      filters.status === "all" || 
      (filters.status === "paid" && transaction.is_paid) || 
      (filters.status === "unpaid" && !transaction.is_paid);
    
    // Date range filter
    let matchesDateRange = true;
    const today = new Date();
    // Ensure transaction.date is a valid date string before parsing
    const transactionDate = transaction.date ? new Date(transaction.date) : null;
    
    if(transactionDate) {
        if (filters.dateRange === "today") {
          matchesDateRange = transactionDate.toDateString() === today.toDateString();
        } else if (filters.dateRange === "thisWeek") {
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - today.getDay());
          matchesDateRange = transactionDate >= startOfWeek;
        } else if (filters.dateRange === "thisMonth") {
          matchesDateRange = 
            transactionDate.getMonth() === today.getMonth() && 
            transactionDate.getFullYear() === today.getFullYear();
        } else if (filters.dateRange === "lastMonth") {
          const lastMonth = new Date(today);
          lastMonth.setMonth(today.getMonth() - 1);
          matchesDateRange = 
            transactionDate.getMonth() === lastMonth.getMonth() && 
            transactionDate.getFullYear() === lastMonth.getFullYear();
        }
    } else {
        matchesDateRange = false; // Or handle as per your logic if date can be null
    }
    
    return matchesSearch && matchesType && matchesAccount && matchesCategory && matchesStatus && matchesDateRange;
  });

  const allAccountsAndCards = accounts.filter(acc => acc.is_active); // Used for the filter dropdown

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transações</h1>
          <p className="text-muted-foreground">
            Gerencie suas receitas e despesas
          </p>
        </div>
        <Button 
          onClick={() => {
            setCurrentTransaction(null);
            setDialogOpen(true);
          }}
          className="bg-primary"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nova Transação
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
        <div className="relative w-full sm:flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar transação..."
            className="pl-8 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex gap-2">
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">Tipo</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleFilterChange("type", "all")}>
                <div className="w-4 mr-2">{filters.type === "all" && <Check className="h-4 w-4" />}</div>
                Todos
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterChange("type", "income")}>
                <div className="w-4 mr-2">{filters.type === "income" && <Check className="h-4 w-4" />}</div>
                <ArrowUp className="h-4 w-4 mr-2 text-emerald-600" />
                Receitas
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterChange("type", "expense")}>
                <div className="w-4 mr-2">{filters.type === "expense" && <Check className="h-4 w-4" />}</div>
                <ArrowDown className="h-4 w-4 mr-2 text-rose-600" />
                Despesas
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterChange("type", "transfer")}>
                <div className="w-4 mr-2">{filters.type === "transfer" && <Check className="h-4 w-4" />}</div>
                <ArrowRight className="h-4 w-4 mr-2 text-blue-600" />
                Transferências
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex gap-2">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Data</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleFilterChange("dateRange", "all")}>
                <div className="w-4 mr-2">{filters.dateRange === "all" && <Check className="h-4 w-4" />}</div>
                Todos os períodos
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterChange("dateRange", "today")}>
                <div className="w-4 mr-2">{filters.dateRange === "today" && <Check className="h-4 w-4" />}</div>
                Hoje
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterChange("dateRange", "thisWeek")}>
                <div className="w-4 mr-2">{filters.dateRange === "thisWeek" && <Check className="h-4 w-4" />}</div>
                Esta semana
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterChange("dateRange", "thisMonth")}>
                <div className="w-4 mr-2">{filters.dateRange === "thisMonth" && <Check className="h-4 w-4" />}</div>
                Este mês
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterChange("dateRange", "lastMonth")}>
                <div className="w-4 mr-2">{filters.dateRange === "lastMonth" && <Check className="h-4 w-4" />}</div>
                Mês passado
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {allAccountsAndCards.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex-shrink-0">
                  Conta/Cartão
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleFilterChange("account", "all")}>
                  <div className="w-4 mr-2">{filters.account === "all" && <Check className="h-4 w-4" />}</div>
                  Todas
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {allAccountsAndCards.map(account => (
                  <DropdownMenuItem 
                    key={account.id}
                    onClick={() => handleFilterChange("account", account.id)}
                  >
                    <div className="w-4 mr-2">{filters.account === account.id && <Check className="h-4 w-4" />}</div>
                    {account.name} ({account.type === 'credit_card' ? 'Cartão' : 'Conta'})
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[30px] px-2">
                <Checkbox
                  checked={
                    filteredTransactions.length > 0 &&
                    selectedTransactions.length === filteredTransactions.length
                  }
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead className="min-w-[100px]">Data</TableHead>
              <TableHead>Detalhes</TableHead>
              <TableHead className="text-right min-w-[120px]">Valor</TableHead>
              <TableHead className="text-right min-w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              // Loading state
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : filteredTransactions.length > 0 ? (
              filteredTransactions.map((transaction) => {
                const account = accounts.find(acc => acc.id === transaction.account_id);
                return (
                <TableRow key={transaction.id}>
                  <TableCell className="px-2">
                    <Checkbox
                      checked={selectedTransactions.some(t => t.id === transaction.id)}
                      onCheckedChange={() => handleSelectTransaction(transaction)}
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      {transaction.date ? format(new Date(transaction.date), "dd/MM/yy") : 'N/A'}
                    </div>
                    <div className="mt-1">
                      {transaction.type === "income" ? (
                        <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-0 whitespace-nowrap">
                          <ArrowUp className="h-3 w-3 mr-1" />
                          Receita
                        </Badge>
                      ) : transaction.type === "expense" ? (
                        <Badge variant="outline" className="bg-rose-100 text-rose-700 border-0 whitespace-nowrap">
                          <ArrowDown className="h-3 w-3 mr-1" />
                          Despesa
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-blue-100 text-blue-700 border-0 whitespace-nowrap">
                          <ArrowRight className="h-3 w-3 mr-1" />
                          Transf.
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium line-clamp-2 sm:line-clamp-none">{transaction.description}</div>
                      <div className="text-sm text-muted-foreground">
                        <span className="whitespace-nowrap">{getAccountName(transaction.account_id)}</span>
                        {transaction.category && (
                          <span className="whitespace-nowrap"> • {getCategoryName(transaction.category)}</span>
                        )}
                        {account && account.type === 'credit_card' && transaction.is_installment && (
                           <Badge variant="outline" className="ml-2">
                             {transaction.installment_number}/{transaction.total_installments}
                           </Badge>
                        )}
                      </div>
                      {transaction.notes && (
                        <div className="text-xs text-muted-foreground line-clamp-1">
                          {transaction.notes}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={
                        transaction.type === "income"
                          ? "text-emerald-600 font-medium"
                          : transaction.type === "expense"
                          ? "text-rose-600 font-medium"
                          : "text-blue-600 font-medium"
                      }
                    >
                      {transaction.type === "income" ? "+" : transaction.type === "expense" ? "-" : ""}
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL"
                      }).format(Math.abs(transaction.amount))}
                    </span>
                    {!transaction.is_paid && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Pendente
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right p-2">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleTogglePaid(transaction)}
                        title={transaction.is_paid ? "Marcar como não pago" : "Marcar como pago"}
                      >
                        <Check className={`h-4 w-4 ${transaction.is_paid ? "text-emerald-600" : "text-muted-foreground"}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditTransaction(transaction)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-rose-600"
                        onClick={() => {
                          setTransactionToDelete(transaction);
                          setConfirmDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )})
            ) : (
              // Empty state
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <CalendarDays className="h-8 w-8 mb-2" />
                    <p>Nenhuma transação encontrada</p>
                    <p className="text-sm">
                      {searchQuery || filters.type !== "all" || filters.dateRange !== "all" || filters.account !== "all"
                        ? "Tente ajustar os filtros ou a busca"
                        : "Clique em 'Nova Transação' para adicionar sua primeira transação"}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {selectedTransactions.length > 0 && (
        <div className="fixed bottom-4 right-4 flex items-center gap-2 bg-card p-4 rounded-lg shadow-lg border border-border">
          <span className="text-sm text-muted-foreground">
            {selectedTransactions.length} {selectedTransactions.length === 1 ? 'transação selecionada' : 'transações selecionadas'}
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              setTransactionToDelete(null);
              setConfirmDialogOpen(true);
            }}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir Selecionadas
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        title="Confirmar Exclusão"
        description={
          transactionToDelete
            ? `Tem certeza que deseja excluir a transação "${transactionToDelete.description}"?`
            : `Tem certeza que deseja excluir ${selectedTransactions.length} ${
                selectedTransactions.length === 1 ? 'transação' : 'transações'
              }?`
        }
        onConfirm={transactionToDelete ? handleDeleteTransaction : handleDeleteSelected}
      />

      <TransactionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSaveTransaction}
        transaction={currentTransaction}
        accounts={accounts}
        categories={categories}
      />
    </div>
  );
}
