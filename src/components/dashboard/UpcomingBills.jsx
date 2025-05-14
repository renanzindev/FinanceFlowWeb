import React from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowDown, CalendarIcon, Clock } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function UpcomingBills({ upcomingBills }) {
  // Get days remaining until the bill is due
  const getDaysRemaining = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(date);
    const days = differenceInDays(dueDate, today);
    
    if (days < 0) {
      return `Atrasado por ${Math.abs(days)} ${Math.abs(days) === 1 ? 'dia' : 'dias'}`;
    } else if (days === 0) {
      return "Vence hoje";
    } else if (days === 1) {
      return "Vence amanhã";
    } else {
      return `Vence em ${days} dias`;
    }
  };
  
  // Get status color based on days remaining
  const getStatusColor = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(date);
    const days = differenceInDays(dueDate, today);
    
    if (days < 0) {
      return "destructive";
    } else if (days <= 3) {
      return "warning";
    } else {
      return "info";
    }
  };

  return (
    <Card className="col-span-1 md:col-span-2 lg:col-span-1">
      <CardHeader className="pb-3">
        <CardTitle>Próximas Contas</CardTitle>
        <CardDescription>
          Contas a pagar nos próximos dias
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border/30">
          {upcomingBills.slice(0, 4).map((bill) => (
            <div key={bill.id} className="px-6 py-3">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center mr-3">
                    <ArrowDown className="h-4 w-4 text-rose-600" />
                  </div>
                  <p className="font-medium">{bill.description}</p>
                </div>
                <p className="font-medium text-rose-600">
                  {new Intl.NumberFormat('pt-BR', { 
                    style: 'currency', 
                    currency: 'BRL' 
                  }).format(bill.amount)}
                </p>
              </div>
              <div className="flex items-center justify-between pl-11">
                <div className="flex items-center text-xs text-muted-foreground">
                  <CalendarIcon className="h-3 w-3 mr-1" />
                  {format(new Date(bill.date), "dd MMM yyyy", { locale: ptBR })}
                </div>
                <Badge variant={getStatusColor(bill.date)} className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {getDaysRemaining(bill.date)}
                </Badge>
              </div>
            </div>
          ))}
          
          {upcomingBills.length === 0 && (
            <div className="px-6 py-4 text-center text-muted-foreground">
              <p>Nenhuma conta pendente nos próximos dias</p>
            </div>
          )}
        </div>
      </CardContent>
      {upcomingBills.length > 0 && (
        <CardFooter className="pt-3 pb-4 px-6">
          <Link 
            to={createPageUrl("Transactions")} 
            className="w-full"
          >
            <Button variant="outline" className="w-full">
              Ver todas as contas pendentes
            </Button>
          </Link>
        </CardFooter>
      )}
    </Card>
  );
}