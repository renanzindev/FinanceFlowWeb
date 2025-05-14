import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardFooter 
} from "@/components/ui/card";
import { ArrowDown, ArrowRight, ArrowUp, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const TransactionIcon = ({ type }) => {
  switch (type) {
    case "income":
      return (
        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
          <ArrowUp className="h-4 w-4 text-emerald-600" />
        </div>
      );
    case "expense":
      return (
        <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center">
          <ArrowDown className="h-4 w-4 text-rose-600" />
        </div>
      );
    case "transfer":
      return (
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
          <ArrowRight className="h-4 w-4 text-blue-600" />
        </div>
      );
    default:
      return null;
  }
};

export default function RecentTransactions({ transactions, accounts }) {
  // Function to get account name by id
  const getAccountName = (accountId) => {
    const account = accounts.find(acc => acc.id === accountId);
    return account ? account.name : "Conta Desconhecida";
  };

  return (
    <Card className="col-span-1 md:col-span-2 lg:col-span-1">
      <CardHeader className="pb-3">
        <CardTitle>Transações Recentes</CardTitle>
        <CardDescription>
          As últimas transações registradas
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border/30">
          {transactions.slice(0, 5).map((transaction) => (
            <div key={transaction.id} className="flex items-center justify-between px-6 py-3">
              <div className="flex items-center">
                <TransactionIcon type={transaction.type} />
                <div className="ml-3">
                  <p className="font-medium">{transaction.description}</p>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <CalendarIcon className="h-3 w-3 mr-1" />
                    {format(new Date(transaction.date), "dd MMM yyyy", { locale: ptBR })}
                    <span className="mx-1">•</span>
                    {getAccountName(transaction.account_id)}
                  </div>
                </div>
              </div>
              <p className={`font-medium ${transaction.type === 'income' ? 'text-emerald-600' : transaction.type === 'expense' ? 'text-rose-600' : 'text-blue-600'}`}>
                {transaction.type === 'income' ? '+' : transaction.type === 'expense' ? '-' : ''}
                {new Intl.NumberFormat('pt-BR', { 
                  style: 'currency', 
                  currency: 'BRL' 
                }).format(Math.abs(transaction.amount))}
              </p>
            </div>
          ))}
          
          {transactions.length === 0 && (
            <div className="px-6 py-4 text-center text-muted-foreground">
              <p>Nenhuma transação registrada</p>
            </div>
          )}
        </div>
      </CardContent>
      {transactions.length > 0 && (
        <CardFooter className="pt-3 pb-4 px-6">
          <Link 
            to={createPageUrl("Transactions")} 
            className="w-full"
          >
            <Button variant="outline" className="w-full">
              Ver todas as transações
            </Button>
          </Link>
        </CardFooter>
      )}
    </Card>
  );
}