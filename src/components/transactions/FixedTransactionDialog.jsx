import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Transaction } from "@/api/entities";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ArrowDown, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function FixedTransactionDialog({ 
  open, 
  onOpenChange, 
  onSave, 
  transaction = null, 
  accounts = [], 
  categories = [] 
}) {
  const [formData, setFormData] = useState({
    description: "",
    amount: 0,
    type: "expense", // Sempre despesa para contas fixas
    category: "",
    account_id: "",
    date: new Date().toISOString().split('T')[0],
    is_fixed: true, // Sempre true para contas fixas
    recurrence: "monthly", // Padrão para contas fixas
    is_paid: false,
    notes: "",
  });

  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };
    
    fetchUser();
  }, []);

  useEffect(() => {
    if (transaction) {
      setFormData({
        ...transaction,
        amount: Math.abs(transaction.amount), // Garantir valor positivo na UI
      });
    } else {
      setFormData({
        description: "",
        amount: 0,
        type: "expense",
        category: categories.length > 0 ? categories[0].id : "",
        account_id: accounts.length > 0 ? accounts[0].id : "",
        date: new Date().toISOString().split('T')[0],
        is_fixed: true,
        recurrence: "monthly",
        is_paid: false,
        notes: "",
      });
    }
  }, [transaction, accounts, categories, open]);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Para despesas, garantir que o valor seja negativo
      const submitData = {
        ...formData,
        amount: Math.abs(formData.amount) * -1,
        is_fixed: true,
        type: "expense"
      };

      // Adicionar user_id caso não exista
      if (!submitData.user_id && currentUser) {
        submitData.user_id = currentUser.id;
      }

      if (transaction?.id) {
        await Transaction.update(transaction.id, submitData);
      } else {
        await Transaction.create(submitData);
      }

      onSave();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving transaction:", error);
      alert("Erro ao salvar despesa fixa. Por favor, tente novamente.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>
            {transaction ? "Editar Despesa Fixa" : "Adicionar Nova Despesa Fixa"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Ex: Aluguel, Conta de Luz, Internet, etc."
              required
            />
          </div>
          
          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Valor</Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <span className="text-sm text-muted-foreground">R$</span>
              </div>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => handleChange("amount", parseFloat(e.target.value) || 0)}
                className="pl-10"
                required
              />
            </div>
          </div>
          
          {/* Account and Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="account">Conta</Label>
              <Select
                value={formData.account_id}
                onValueChange={(value) => handleChange("account_id", value)}
                required
              >
                <SelectTrigger id="account">
                  <SelectValue placeholder="Selecione a conta" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleChange("category", value)}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories
                    .filter(category => category.type === "expense")
                    .map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Due Date */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="date">Dia do Vencimento</Label>
              <span className="text-sm text-muted-foreground">
                {formData.date ? `Dia ${new Date(formData.date).getDate()}` : "Selecione"}
              </span>
            </div>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.date 
                    ? `Dia ${new Date(formData.date).getDate()} de cada mês`
                    : "Selecione uma data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.date ? new Date(formData.date) : undefined}
                  onSelect={(date) => handleChange("date", date ? date.toISOString().split('T')[0] : "")}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          {/* Recurrence */}
          <div className="space-y-2">
            <Label htmlFor="recurrence">Recorrência</Label>
            <Select
              value={formData.recurrence}
              onValueChange={(value) => handleChange("recurrence", value)}
              required
            >
              <SelectTrigger id="recurrence">
                <SelectValue placeholder="Selecione a recorrência" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Mensal</SelectItem>
                <SelectItem value="weekly">Semanal</SelectItem>
                <SelectItem value="yearly">Anual</SelectItem>
                <SelectItem value="daily">Diário</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações (opcional)</Label>
            <Textarea
              id="notes"
              value={formData.notes || ""}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Observações sobre esta conta fixa..."
              className="min-h-[80px]"
            />
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {transaction ? "Atualizar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}