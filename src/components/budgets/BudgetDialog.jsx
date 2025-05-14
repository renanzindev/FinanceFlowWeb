
import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";

export default function BudgetDialog({ open, onOpenChange, onSave, budget = null, categories = [] }) {
  const [formData, setFormData] = useState({
    name: "",
    amount: 0,
    period: "monthly",
    start_date: new Date().toISOString().split('T')[0],
    end_date: "",
    category_id: "",
    is_active: true
  });
  
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Fetch current user when component mounts
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
    if (budget) {
      setFormData({
        ...budget,
        amount: budget.amount || 0,
        start_date: budget.start_date || new Date().toISOString().split('T')[0],
        end_date: budget.end_date || "",
        is_active: budget.is_active !== false
      });
    } else {
      // Default for new budget
      setFormData({
        name: "",
        amount: 0,
        period: "monthly",
        start_date: new Date().toISOString().split('T')[0],
        end_date: "",
        category_id: categories.length > 0 ? categories[0].id : "",
        is_active: true
      });
    }
  }, [budget, open, categories]);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Add user_id to the form data
    if (currentUser) {
      const completeData = {
        ...formData,
        user_id: currentUser.id
      };
      onSave(completeData);
    } else {
      alert("Erro: Usuário não identificado. Por favor, tente novamente.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>
            {budget ? "Editar Orçamento" : "Adicionar Novo Orçamento"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Budget Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Orçamento</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Ex: Alimentação, Transporte, etc."
              required
            />
          </div>
          
          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Select
              value={formData.category_id}
              onValueChange={(value) => handleChange("category_id", value)}
              required
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Amount and Period */}
          <div className="grid grid-cols-2 gap-4">
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
            
            <div className="space-y-2">
              <Label htmlFor="period">Período</Label>
              <Select
                value={formData.period}
                onValueChange={(value) => handleChange("period", value)}
                required
              >
                <SelectTrigger id="period">
                  <SelectValue placeholder="Selecione o período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="yearly">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Start Date */}
          <div className="space-y-2">
            <Label htmlFor="start_date">Data de Início</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.start_date ? (
                    format(new Date(formData.start_date), "PPP", { locale: ptBR })
                  ) : (
                    <span>Selecione a data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.start_date ? new Date(formData.start_date) : undefined}
                  onSelect={(date) => handleChange("start_date", date ? date.toISOString().split('T')[0] : "")}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          {/* End Date (optional) */}
          <div className="space-y-2">
            <Label htmlFor="end_date">Data Final (opcional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.end_date ? (
                    format(new Date(formData.end_date), "PPP", { locale: ptBR })
                  ) : (
                    <span>Selecione a data (opcional)</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.end_date ? new Date(formData.end_date) : undefined}
                  onSelect={(date) => handleChange("end_date", date ? date.toISOString().split('T')[0] : "")}
                  initialFocus
                  fromDate={formData.start_date ? new Date(formData.start_date) : undefined}
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <DialogFooter>
            <Button type="submit" className="bg-primary">
              {budget ? "Salvar Alterações" : "Adicionar Orçamento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
