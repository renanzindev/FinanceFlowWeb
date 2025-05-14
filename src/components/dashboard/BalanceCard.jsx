import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUp, ArrowDown, Wallet } from "lucide-react";

export default function BalanceCard({ totalBalance, monthlyIncome, monthlyExpenses, accounts = [] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-md font-medium text-muted-foreground flex items-center">
            <Wallet className="mr-2 h-4 w-4 text-blue-500" />
            Saldo Total
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-500">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalBalance)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">{accounts.length} contas ativas</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-md font-medium text-muted-foreground flex items-center">
            <ArrowUp className="mr-2 h-4 w-4 text-emerald-500" />
            Receitas do Mês
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-emerald-500">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthlyIncome)}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-md font-medium text-muted-foreground flex items-center">
            <ArrowDown className="mr-2 h-4 w-4 text-rose-500" />
            Despesas do Mês
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-rose-500">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthlyExpenses)}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-md font-medium text-muted-foreground">
            Saldo do Mês
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${monthlyIncome - monthlyExpenses >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthlyIncome - monthlyExpenses)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}