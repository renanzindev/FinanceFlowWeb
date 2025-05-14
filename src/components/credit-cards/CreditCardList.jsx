
import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Account } from "@/api/entities";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  CreditCard as CreditCardIcon, 
  Edit2, 
  Trash2,
  CircleOff, 
  CheckCircle 
} from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";

export default function CreditCardList({ cards = [], loading = false, onEdit, onUpdate }) {
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [cardToDelete, setCardToDelete] = useState(null);

  const handleDeleteCard = async () => {
    if (!cardToDelete) return;
    
    try {
      await Account.delete(cardToDelete.id);
      onUpdate();
      setCardToDelete(null);
      setConfirmDialogOpen(false);
    } catch (error) {
      console.error("Erro ao excluir cartão:", error);
      alert("Ocorreu um erro ao excluir o cartão. Por favor, tente novamente.");
    }
  };

  const handleToggleActive = async (card) => {
    try {
      await Account.update(card.id, { is_active: !card.is_active });
      onUpdate();
    } catch (error) {
      console.error("Erro ao atualizar cartão:", error);
      alert("Ocorreu um erro ao atualizar o cartão. Por favor, tente novamente.");
    }
  };
  
  const handleConfirmDelete = (card) => {
    setCardToDelete(card);
    setConfirmDialogOpen(true);
  };

  const getCardGradientClass = (color) => {
    if (!color) return "bg-gradient-to-r from-gray-700 to-gray-900";
    
    // Mapeamento de cores para gradientes com melhor contraste
    const colorMap = {
      "#4f46e5": "bg-gradient-to-r from-indigo-600 to-indigo-800", // Indigo
      "#1e40af": "bg-gradient-to-r from-blue-700 to-blue-900", // Dark Blue
      "#1e3a8a": "bg-gradient-to-r from-blue-800 to-blue-950", // Navy
      "#047857": "bg-gradient-to-r from-emerald-600 to-emerald-800", // Emerald
      "#0f766e": "bg-gradient-to-r from-teal-600 to-teal-800", // Teal
      "#7e22ce": "bg-gradient-to-r from-purple-600 to-purple-800", // Purple
      "#831843": "bg-gradient-to-r from-pink-700 to-pink-900", // Dark Pink
      "#9f1239": "bg-gradient-to-r from-rose-700 to-rose-900", // Rose
      "#7f1d1d": "bg-gradient-to-r from-red-700 to-red-900", // Dark Red
      "#292524": "bg-gradient-to-r from-stone-700 to-stone-900", // Stone
      "#171717": "bg-gradient-to-r from-neutral-700 to-neutral-900", // Neutral
      "#0f172a": "bg-gradient-to-r from-slate-700 to-slate-900", // Slate
    };

    return colorMap[color] || "bg-gradient-to-r from-gray-700 to-gray-900";
  };

  return (
    <div>
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2].map((_, index) => (
            <div key={index} className="relative">
              <Card className="h-52 bg-muted">
                <CardContent className="p-0">
                  <Skeleton className="h-52 w-full" />
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      ) : cards.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map(card => (
            <div key={card.id} className="relative">
              <Card className={`h-52 ${getCardGradientClass(card.color)} text-white overflow-hidden`}>
                <CardContent className="p-6 flex flex-col h-full justify-between relative overflow-hidden">
                  {!card.is_active && (
                    <div className="absolute top-0 left-0 w-full h-full bg-black/40 flex items-center justify-center z-10">
                      <div className="bg-black/70 px-4 py-2 rounded-md text-white">
                        Cartão Inativo
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-6">
                    <div className="flex justify-between items-start">
                      <CreditCardIcon className="h-8 w-8 text-white" />
                      <div className="text-right">
                        <h3 className="font-bold text-white">{card.name}</h3>
                        <p className="text-sm text-white/80">{card.institution}</p>
                      </div>
                    </div>
                    
                    <div className="flex justify-between">
                      <div>
                        <p className="text-xs text-white/70">Limite Disponível</p>
                        <p className="font-bold text-white">
                          {new Intl.NumberFormat('pt-BR', { 
                            style: 'currency', 
                            currency: card.currency || 'BRL' 
                          }).format(card.available_credit_limit || 0)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-white/70">Limite Total</p>
                        <p className="font-bold text-white">
                          {new Intl.NumberFormat('pt-BR', { 
                            style: 'currency', 
                            currency: card.currency || 'BRL' 
                          }).format(card.credit_limit || 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-white/80">
                      <span>Fechamento: Dia {card.closing_date || "-"}</span>
                      <span>Vencimento: Dia {card.due_date || "-"}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="absolute top-2 right-2 flex gap-1">
                <Button 
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 bg-white/20 hover:bg-white/40 text-white"
                  onClick={() => onEdit(card)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button 
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 bg-white/20 hover:bg-white/40 text-white"
                  onClick={() => handleToggleActive(card)}
                >
                  {card.is_active ? (
                    <CircleOff className="h-4 w-4" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                </Button>
                <Button 
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 bg-white/20 hover:bg-rose-500 text-white"
                  onClick={() => handleConfirmDelete(card)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <div className="text-center py-8 text-muted-foreground">
              <CreditCardIcon className="mx-auto h-12 w-12 mb-4 opacity-30" />
              <h3 className="text-lg font-medium">Nenhum Cartão de Crédito</h3>
              <p className="mt-2">
                Clique em "Novo Cartão" para adicionar seu primeiro cartão de crédito
              </p>
            </div>
          </CardHeader>
        </Card>
      )}
      
      <ConfirmDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        title="Excluir Cartão"
        description={
          cardToDelete 
            ? `Tem certeza que deseja excluir o cartão "${cardToDelete.name}"? Esta ação não pode ser desfeita.`
            : "Confirmar exclusão do cartão?"
        }
        onConfirm={handleDeleteCard}
      />
    </div>
  );
}
