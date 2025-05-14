import React, { useState, useEffect } from "react";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Account } from "@/api/entities";

export default function CreditCardDialog({ open, onOpenChange, card, onSave, currentUser }) {
  const [formData, setFormData] = useState({
    name: "",
    institution: "",
    credit_limit: 0,
    available_credit_limit: 0,
    due_date: 1,
    closing_date: 1,
    color: "#ef4444", // Vermelho padrão
    type: "credit_card",
    balance: 0,
    user_id: "",
    is_active: true
  });

  useEffect(() => {
    if (card) {
      // Garante que todos os campos numéricos sejam numbers e não strings
      setFormData({
        ...card,
        credit_limit: Number(card.credit_limit) || 0,
        available_credit_limit: Number(card.available_credit_limit) || 0,
        due_date: Number(card.due_date) || 1,
        closing_date: Number(card.closing_date) || 1,
        balance: Number(card.balance) || 0
      });
    } else {
      setFormData({
        name: "",
        institution: "",
        credit_limit: 0,
        available_credit_limit: 0,
        due_date: 1,
        closing_date: 1,
        color: "#ef4444",
        type: "credit_card",
        balance: 0,
        user_id: currentUser?.id || "",
        is_active: true
      });
    }
  }, [card, currentUser, open]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Tratar valores numéricos
    if (['credit_limit', 'available_credit_limit', 'due_date', 'closing_date'].includes(name)) {
      setFormData(prev => ({
        ...prev,
        [name]: Number(value) || 0
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const submitData = {
        ...formData,
        type: "credit_card" // Garante que o tipo sempre seja credit_card
      };

      // Se não existe available_credit_limit, usar o limite total
      if (!submitData.available_credit_limit && submitData.credit_limit) {
        submitData.available_credit_limit = submitData.credit_limit;
      }
      
      // Validações
      if (submitData.due_date < 1 || submitData.due_date > 31) {
        alert("O dia de vencimento deve estar entre 1 e 31");
        return;
      }
      
      if (submitData.closing_date < 1 || submitData.closing_date > 31) {
        alert("O dia de fechamento deve estar entre 1 e 31");
        return;
      }
      
      if (submitData.credit_limit <= 0) {
        alert("O limite de crédito deve ser maior que zero");
        return;
      }
      
      // Adicionar user_id se estiver faltando
      if (!submitData.user_id && currentUser) {
        submitData.user_id = currentUser.id;
      }
      
      if (card?.id) {
        // Atualizar cartão existente
        await Account.update(card.id, submitData);
      } else {
        // Criar novo cartão
        await Account.create(submitData);
      }
      
      onSave();
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao salvar cartão:", error);
      alert("Erro ao salvar o cartão. Por favor, tente novamente.");
    }
  };

  // Opções de cores para o cartão
  const colorOptions = [
    { name: "Vermelho", value: "#ef4444" },
    { name: "Azul", value: "#3b82f6" },
    { name: "Verde", value: "#10b981" },
    { name: "Roxo", value: "#8b5cf6" },
    { name: "Rosa", value: "#ec4899" },
    { name: "Laranja", value: "#f97316" },
    { name: "Amarelo", value: "#eab308" },
    { name: "Verde-água", value: "#06b6d4" },
    { name: "Cinza", value: "#71717a" },
    { name: "Preto", value: "#171717" }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{card ? "Editar Cartão de Crédito" : "Novo Cartão de Crédito"}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Cartão</Label>
              <Input 
                id="name" 
                name="name"
                value={formData.name} 
                onChange={handleInputChange} 
                placeholder="Ex: Nubank Platinum" 
                required 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="institution">Banco/Emissor</Label>
              <Input 
                id="institution" 
                name="institution"
                value={formData.institution} 
                onChange={handleInputChange} 
                placeholder="Ex: Nubank" 
                required 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="credit_limit">Limite Total</Label>
                <Input 
                  id="credit_limit" 
                  name="credit_limit"
                  type="number" 
                  min="0"
                  step="0.01"
                  value={formData.credit_limit} 
                  onChange={handleInputChange} 
                  required 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="available_credit_limit">Limite Disponível</Label>
                <Input 
                  id="available_credit_limit" 
                  name="available_credit_limit"
                  type="number" 
                  min="0"
                  step="0.01"
                  value={formData.available_credit_limit} 
                  onChange={handleInputChange} 
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="due_date">Dia de Vencimento</Label>
                <Input 
                  id="due_date"
                  name="due_date" 
                  type="number" 
                  min="1"
                  max="31"
                  value={formData.due_date} 
                  onChange={handleInputChange} 
                  required 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="closing_date">Dia de Fechamento</Label>
                <Input 
                  id="closing_date" 
                  name="closing_date"
                  type="number" 
                  min="1"
                  max="31"
                  value={formData.closing_date} 
                  onChange={handleInputChange} 
                  required 
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Cor do Cartão</Label>
              <div className="grid grid-cols-5 gap-2">
                {colorOptions.map((color) => (
                  <div 
                    key={color.value}
                    onClick={() => setFormData(prev => ({ ...prev, color: color.value }))}
                    className={`h-10 rounded-md cursor-pointer transition-all ${
                      formData.color === color.value ? 'ring-2 ring-offset-2 ring-primary' : ''
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {card ? "Salvar Alterações" : "Criar Cartão"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}