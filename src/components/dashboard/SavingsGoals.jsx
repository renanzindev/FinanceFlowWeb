import React from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function SavingsGoals({ goals }) {
  return (
    <Card className="col-span-1 md:col-span-2">
      <CardHeader className="pb-3">
        <CardTitle>Metas de Economia</CardTitle>
        <CardDescription>
          Progresso das suas metas de economia
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-5">
          {goals.slice(0, 3).map((goal) => {
            // Calculate progress percentage
            const progressPercentage = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
            
            return (
              <div key={goal.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{goal.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Meta: {new Date(goal.targetDate).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {new Intl.NumberFormat('pt-BR', { 
                        style: 'currency', 
                        currency: 'BRL' 
                      }).format(goal.currentAmount)}
                      <span className="text-muted-foreground"> / </span>
                      {new Intl.NumberFormat('pt-BR', { 
                        style: 'currency', 
                        currency: 'BRL' 
                      }).format(goal.targetAmount)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {progressPercentage}% concluído
                    </p>
                  </div>
                </div>
                <Progress 
                  value={progressPercentage} 
                  className="bg-primary"
                />
              </div>
            );
          })}
          
          {goals.length === 0 && (
            <div className="text-center py-4 text-muted-foreground">
              <p>Nenhuma meta de economia definida</p>
              <a href="#" className="text-primary text-sm mt-1 inline-block">
                Criar meta
              </a>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}