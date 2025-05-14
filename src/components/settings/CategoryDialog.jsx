
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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CATEGORY_COLORS = [
  "#ef4444", // Red
  "#f97316", // Orange
  "#f59e0b", // Amber
  "#eab308", // Yellow
  "#84cc16", // Lime
  "#22c55e", // Green
  "#10b981", // Emerald
  "#14b8a6", // Teal
  "#06b6d4", // Cyan
  "#0ea5e9", // Sky
  "#3b82f6", // Blue
  "#6366f1", // Indigo
  "#8b5cf6", // Violet
  "#a855f7", // Purple
  "#d946ef", // Fuchsia
  "#ec4899", // Pink
  "#f43f5e", // Rose
];

export default function CategoryDialog({ open, onOpenChange, onSave, category = null }) {
  const [formData, setFormData] = useState({
    name: "",
    type: "expense",
    color: CATEGORY_COLORS[0],
    icon: "Tag",
    budget: 0,
    is_active: true,
    parent_id: ""
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
    if (category) {
      setFormData({
        ...category,
        color: category.color || CATEGORY_COLORS[0],
        icon: category.icon || "Tag",
        budget: category.budget || 0,
        is_active: category.is_active !== false
      });
    } else {
      // Default for new category
      setFormData({
        name: "",
        type: "expense",
        color: CATEGORY_COLORS[0],
        icon: "Tag",
        budget: 0,
        is_active: true,
        parent_id: ""
      });
    }
  }, [category, open]);

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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {category ? "Editar Categoria" : "Adicionar Nova Categoria"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Categoria</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Ex: Alimentação, Transporte, etc."
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="type">Tipo</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => handleChange("type", value)}
              required
            >
              <SelectTrigger id="type">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Receita</SelectItem>
                <SelectItem value="expense">Despesa</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="budget">Orçamento (opcional)</Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <span className="text-sm text-muted-foreground">R$</span>
              </div>
              <Input
                id="budget"
                type="number"
                step="0.01"
                value={formData.budget}
                onChange={(e) => handleChange("budget", parseFloat(e.target.value) || 0)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Cor da Categoria</Label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`w-8 h-8 rounded-full ${
                    formData.color === color ? "ring-2 ring-primary ring-offset-2" : ""
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => handleChange("color", color)}
                />
              ))}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => handleChange("is_active", checked)}
            />
            <Label htmlFor="is_active">Categoria Ativa</Label>
          </div>
          
          <DialogFooter>
            <Button type="submit" className="bg-primary">
              {category ? "Salvar Alterações" : "Adicionar Categoria"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
