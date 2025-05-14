import React from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function BudgetProgress({ budgets }) {
  return (
    <Card className="col-span-1 md:col-span-2">
      <CardHeader className="pb-3">
        <CardTitle>Orçamentos</CardTitle>
        <CardDescription>
          Progresso dos seus orçamentos atuais
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-5">
          {budgets.slice(0, 5).map((budget) => {
            // Calculate progress percentage
            const progressPercentage = Math.min(100, Math.round((budget.spent / budget.amount) * 100));
            
            // Determine status color
            let statusColor = "bg-emerald-600";
            if (progressPercentage >= 90) {
              statusColor = "bg-rose-600";
            } else if (progressPercentage >= 75) {
              statusColor = "bg-amber-500";
            } else if (progressPercentage >= 50) {
              statusColor = "bg-blue-500";
            }
            
            return (
              <div key={budget.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{budget.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {budget.category}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {new Intl.NumberFormat('pt-BR', { 
                        style: 'currency', 
                        currency: 'BRL' 
                      }).format(budget.spent)}
                      <span className="text-muted-foreground"> / </span>
                      {new Intl.NumberFormat('pt-BR', { 
                        style: 'currency', 
                        currency: 'BRL' 
                      }).format(budget.amount)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {progressPercentage}% utilizado
                    </p>
                  </div>
                </div>
                <Progress 
                  value={progressPercentage} 
                  className={statusColor}
                />
              </div>
            );
          })}
          
          {budgets.length === 0 && (
            <div className="text-center py-4 text-muted-foreground">
              <p>Nenhum orçamento definido</p>
              <a href="#" className="text-primary text-sm mt-1 inline-block">
                Criar orçamento
              </a>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}