import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  CreditCard,
  Wallet,
  LineChart,
  Landmark,
  PiggyBank,
  ChevronRight
} from "lucide-react";

const getAccountIcon = (type) => {
  switch (type) {
    case "checking":
      return <Wallet className="h-5 w-5" />;
    case "savings":
      return <PiggyBank className="h-5 w-5" />;
    case "investment":
      return <LineChart className="h-5 w-5" />;
    case "credit_card":
      return <CreditCard className="h-5 w-5" />;
    default:
      return <Landmark className="h-5 w-5" />;
  }
};

const getAccountTypeLabel = (type) => {
  switch (type) {
    case "checking":
      return "Conta Corrente";
    case "savings":
      return "Poupança";
    case "investment":
      return "Investimento";
    case "credit_card":
      return "Cartão de Crédito";
    default:
      return type;
  }
};

export default function AccountsList({ accounts }) {
  // Sort accounts: first by type, then by balance
  const sortedAccounts = [...accounts].sort((a, b) => {
    if (a.type !== b.type) {
      return a.type.localeCompare(b.type);
    }
    return b.balance - a.balance;
  });

  return (
    <div className="relative h-full">
      <div className="sticky top-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Suas Contas</CardTitle>
            <CardDescription>
              {accounts.length} contas ativas
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/30 max-h-[400px] overflow-y-auto">
              {sortedAccounts.map((account) => (
                <Link
                  key={account.id}
                  to={createPageUrl("Accounts")}
                  className="flex items-center justify-between px-6 py-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center mr-3"
                      style={{ backgroundColor: account.color || "#e5e7eb" }}
                    >
                      {getAccountIcon(account.type)}
                    </div>
                    <div>
                      <p className="font-medium">{account.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {getAccountTypeLabel(account.type)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="text-right mr-2">
                      <p className="font-medium">
                        {new Intl.NumberFormat('pt-BR', { 
                          style: 'currency', 
                          currency: account.currency || 'BRL'
                        }).format(account.balance)}
                      </p>
                      {account.type === "credit_card" && (
                        <p className="text-xs text-muted-foreground">
                          Limite: {new Intl.NumberFormat('pt-BR', { 
                            style: 'currency', 
                            currency: account.currency || 'BRL'
                          }).format(account.credit_limit || 0)}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
              ))}
              
              {accounts.length === 0 && (
                <div className="px-6 py-4 text-center text-muted-foreground">
                  <p>Nenhuma conta cadastrada</p>
                  <Link
                    to={createPageUrl("Accounts")}
                    className="text-primary text-sm mt-1 inline-block"
                  >
                    Adicionar conta
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}