import React from "react";
import { Card } from "@/components/ui/card";
import { 
  CreditCard,
  Wallet,
  LineChart,
  PiggyBank,
  MoreVertical,
  Pencil,
  Trash2,
  Eye,
  EyeOff
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const getAccountIcon = (type) => {
  switch (type) {
    case "checking":
      return <Wallet className="h-6 w-6 text-white" />;
    case "savings":
      return <PiggyBank className="h-6 w-6 text-white" />;
    case "investment":
      return <LineChart className="h-6 w-6 text-white" />;
    case "credit_card":
      return <CreditCard className="h-6 w-6 text-white" />;
    default:
      return <Wallet className="h-6 w-6 text-white" />;
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

export default function AccountCard({ account, onEdit, onDelete, onToggleActivity }) {
  // Determina se deve usar texto branco ou preto dependendo da cor de fundo
  const isDarkColor = (color) => {
    // Cores que são consideradas escuras e precisam de texto branco
    const darkColors = ['#4f46e5', '#1e40af', '#1e3a8a', '#047857', '#7e22ce', '#831843', '#9f1239', '#7f1d1d', '#292524', '#171717', '#0f172a'];
    return darkColors.includes(color) || !color;
  };
  
  const textColor = isDarkColor(account.color) ? "text-white" : "text-gray-900";
  const iconBgColor = isDarkColor(account.color) ? "bg-white/10" : "bg-black/10";

  return (
    <Card 
      className={`rounded-xl overflow-hidden hover:shadow-md transition-shadow ${
        !account.is_active ? "opacity-70" : ""
      }`}
    >
      <div 
        className="h-24 p-4 flex items-start justify-between"
        style={{ backgroundColor: account.color || "#4f46e5" }}
      >
        <div>
          <div className={`${iconBgColor} p-2 inline-block rounded-lg`}>
            {getAccountIcon(account.type)}
          </div>
          <h3 className={`mt-1 ${textColor} font-semibold text-lg`}>{account.name}</h3>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className={`${textColor} hover:bg-black/10`}>
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(account)}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onToggleActivity(account)}>
              {account.is_active ? (
                <>
                  <EyeOff className="mr-2 h-4 w-4" />
                  Desativar
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-4 w-4" />
                  Ativar
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-rose-600"
              onClick={() => onDelete(account)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="p-4 bg-card text-card-foreground">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs text-muted-foreground">
              {getAccountTypeLabel(account.type)}
              {account.institution && ` • ${account.institution}`}
            </p>
            <p className="text-2xl font-bold mt-1">
              {new Intl.NumberFormat('pt-BR', { 
                style: 'currency', 
                currency: account.currency || 'BRL'
              }).format(account.balance)}
            </p>
          </div>
          {account.type === "credit_card" && account.credit_limit > 0 && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Limite</p>
              <p className="font-medium">
                {new Intl.NumberFormat('pt-BR', { 
                  style: 'currency', 
                  currency: account.currency || 'BRL'
                }).format(account.credit_limit)}
              </p>
            </div>
          )}
        </div>
        {account.type === "credit_card" && account.due_date && (
          <p className="text-xs text-muted-foreground mt-2">
            Vencimento: dia {account.due_date}
          </p>
        )}
      </div>
    </Card>
  );
}