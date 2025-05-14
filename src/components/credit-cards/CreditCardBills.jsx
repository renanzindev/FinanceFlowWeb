
import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Transaction } from "@/api/entities";
import { CreditCardBill } from "@/api/entities";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CreditCard,
  ShoppingBag,
  CheckCircle2,
  Clock,
  AlertCircle
} from "lucide-react";

export default function CreditCardBills({ cards = [], onUpdate }) {
  const [bills, setBills] = useState([]);
  const [billTransactions, setBillTransactions] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    fetchData();
  }, [cards]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const user = await User.me();
      setCurrentUser(user);

      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();

      // Criar faturas para todos os cartões se não existirem
      for (const card of cards) {
        const existingBill = await CreditCardBill.filter({
          account_id: card.id,
          month: currentMonth,
          year: currentYear,
          user_id: user.id
        });

        if (existingBill.length === 0) {
          await CreditCardBill.create({
            account_id: card.id,
            month: currentMonth,
            year: currentYear,
            user_id: user.id,
            status: "open",
            total_amount: 0
          });
        }
      }

      // Buscar todas as faturas atualizadas
      const allBills = await CreditCardBill.filter({
        user_id: user.id,
        month: currentMonth,
        year: currentYear
      });

      setBills(allBills);

      // Buscar transações do mês atual
      const transactions = await Transaction.filter({
        user_id: user.id
      });

      // Agrupar transações por fatura
      const billTransactionsMap = {};
      allBills.forEach(bill => {
        const cardTransactions = transactions.filter(tx => {
          const txDate = new Date(tx.date);
          return tx.account_id === bill.account_id &&
                 txDate.getMonth() === currentMonth - 1 &&
                 txDate.getFullYear() === currentYear &&
                 tx.type === "expense";
        });
        billTransactionsMap[bill.id] = cardTransactions;
      });

      setBillTransactions(billTransactionsMap);
    } catch (error) {
      console.error("Erro ao buscar faturas:", error);
    }
    setLoading(false);
  };

  const calculateBillTotal = (billId) => {
    const transactions = billTransactions[billId] || [];
    return transactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  };

  const getBillStatus = (bill) => {
    if (bill.status === "paid") {
      return {
        label: "Paga",
        variant: "outline",
        color: "bg-emerald-100 text-emerald-700",
        icon: <CheckCircle2 className="h-3 w-3 mr-1" />
      };
    } else if (bill.status === "closed") {
      return {
        label: "Fechada",
        variant: "outline",
        color: "bg-orange-100 text-orange-700",
        icon: <Clock className="h-3 w-3 mr-1" />
      };
    } else {
      return {
        label: "Aberta",
        variant: "outline",
        color: "bg-blue-100 text-blue-700",
        icon: <AlertCircle className="h-3 w-3 mr-1" />
      };
    }
  };

  const handlePayBill = async (bill) => {
    try {
      await CreditCardBill.update(bill.id, {
        status: "paid",
        payment_date: new Date().toISOString(),
        payment_amount: calculateBillTotal(bill.id)
      });
      
      fetchData(); // Recarregar dados
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Erro ao pagar fatura:", error);
    }
  };

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="grid gap-4">
          {Array.from({ length: cards.length }).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : bills.length > 0 ? (
        <div className="grid gap-4">
          {cards.map(card => {
            const bill = bills.find(b => b.account_id === card.id);
            if (!bill) return null;

            const billTransactionsForBill = billTransactions[bill.id] || [];
            const total = calculateBillTotal(bill.id);
            const status = getBillStatus(bill);
            
            return (
              <Card key={card.id} className="overflow-hidden" style={{borderColor: card.color, borderWidth: "2px"}}>
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center">
                        <div 
                          className="h-8 w-8 rounded-full flex items-center justify-center mr-2"
                          style={{backgroundColor: card.color || "#6366f1"}}
                        >
                          <CreditCard className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{card.name}</CardTitle>
                          <CardDescription>{card.institution}</CardDescription>
                        </div>
                      </div>
                      <CardDescription className="mt-1">
                        Fatura atual - Vencimento: {card.due_date}/
                        {format(new Date(), "MM/yyyy", { locale: ptBR })}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="text-xl font-bold">
                        {new Intl.NumberFormat('pt-BR', { 
                          style: 'currency', 
                          currency: 'BRL' 
                        }).format(total)}
                      </div>
                      <Badge 
                        variant="outline"
                        className={`flex items-center mt-1 ${status.color}`}
                      >
                        {status.icon} {status.label}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pb-4">
                  <div className="space-y-4">
                    {billTransactionsForBill.length > 0 ? (
                      <div className="space-y-2">
                        {billTransactionsForBill.map(transaction => (
                          <div
                            key={transaction.id}
                            className="flex items-center justify-between py-2 border-b last:border-0"
                          >
                            <div className="flex items-center gap-2">
                              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <div className="font-medium">{transaction.description}</div>
                                <div className="text-sm text-muted-foreground">
                                  {format(new Date(transaction.date), "dd MMM", { locale: ptBR })}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">
                                {new Intl.NumberFormat('pt-BR', { 
                                  style: 'currency', 
                                  currency: 'BRL' 
                                }).format(Math.abs(transaction.amount))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground py-4">
                        Nenhuma transação na fatura atual
                      </div>
                    )}
                    
                    {/* Mostrar botão independente do status */}
                    <Button 
                      className="w-full"
                      onClick={() => handlePayBill(bill)}
                      disabled={bill.status === "paid"}
                      variant={bill.status === "paid" ? "outline" : "default"}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      {bill.status === "paid" ? "Fatura Paga" : "Marcar Fatura como Paga"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium">Nenhuma fatura encontrada</h3>
          <p className="text-muted-foreground mt-1">
            Adicione um cartão de crédito para gerenciar suas faturas
          </p>
        </div>
      )}
    </div>
  );
}
