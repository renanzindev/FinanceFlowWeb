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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CreditCard,
  Wallet,
  LineChart,
  PiggyBank,
  Building,
  CalendarIcon,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const ACCOUNT_COLORS = [
  "#4f46e5", // azul índigo
  "#8b5cf6", // roxo
  "#d946ef", // fúcsia
  "#f43f5e", // rosa
  "#ec4899", // rosa escuro
  "#0ea5e9", // azul claro
  "#0284c7", // azul
  "#14b8a6", // turquesa
  "#10b981", // verde esmeralda
  "#84cc16", // verde limão
  "#eab308", // amarelo
  "#f59e0b", // âmbar
  "#f97316", // laranja
  "#ef4444", // vermelho
  "#6366f1", // azul violeta
];

export default function AccountDialog({ open, onOpenChange, onSave, account = null }) {
  const [activeTab, setActiveTab] = useState("bank");
  const [formData, setFormData] = useState({
    name: "",
    type: "checking",
    balance: 0,
    institution: "",
    color: ACCOUNT_COLORS[0],
    currency: "BRL",
    is_active: true,
    credit_limit: 0,
    available_credit_limit: 0,
    due_date: 1,
    closing_date: 15,
  });
  
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedDueDate, setSelectedDueDate] = useState(new Date());

  useEffect(() => {
    // Fetch current user when component mounts
    const fetchUser = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);
      } catch (error) {
        console.error("Erro ao buscar usuário:", error);
      }
    };
    
    fetchUser();
  }, []);

  useEffect(() => {
    if (account) {
      setFormData({
        ...account,
        balance: account.balance || 0,
        credit_limit: account.credit_limit || 0,
        available_credit_limit: account.available_credit_limit || 0,
        due_date: account.due_date || 1,
        closing_date: account.closing_date || 15,
        color: account.color || ACCOUNT_COLORS[0],
      });
      
      // Set the active tab based on account type
      if (account.type === "credit_card") {
        setActiveTab("credit");
      } else {
        setActiveTab("bank");
      }
      
      // Set due date for calendar
      if (account.due_date) {
        const today = new Date();
        setSelectedDueDate(new Date(today.getFullYear(), today.getMonth(), account.due_date));
      }
    } else {
      setFormData({
        name: "",
        type: "checking",
        balance: 0,
        institution: "",
        color: ACCOUNT_COLORS[0],
        currency: "BRL",
        is_active: true,
        credit_limit: 0,
        available_credit_limit: 0,
        due_date: 1,
        closing_date: 15,
      });
      setActiveTab("bank");
      setSelectedDueDate(new Date());
    }
  }, [account, open]);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Prepare final form data based on account type
    const finalFormData = {
      ...formData,
      // If credit card, ensure type is set correctly
      type: activeTab === "credit" ? "credit_card" : formData.type,
      // If it's a new credit card, set available limit equal to total limit
      available_credit_limit: activeTab === "credit" && !account ? formData.credit_limit : formData.available_credit_limit,
      // Add user_id to the form data
      user_id: currentUser?.id
    };
    
    if (currentUser) {
      onSave(finalFormData);
    } else {
      alert("Erro: Usuário não identificado. Por favor, tente novamente.");
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    
    // Update form data based on tab
    if (tab === "credit") {
      handleChange("type", "credit_card");
    } else {
      // Reset to checking if coming from credit card
      if (formData.type === "credit_card") {
        handleChange("type", "checking");
      }
    }
  };

  const handleDueDateSelect = (date) => {
    if (date) {
      const day = date.getDate();
      setSelectedDueDate(date);
      handleChange("due_date", day);
    }
  };

  // Get color name for better UI
  const getColorName = (color) => {
    const colorMap = {
      "#4f46e5": "Azul Índigo",
      "#8b5cf6": "Roxo",
      "#d946ef": "Fúcsia",
      "#f43f5e": "Rosa",
      "#ec4899": "Rosa Escuro",
      "#0ea5e9": "Azul Claro",
      "#0284c7": "Azul",
      "#14b8a6": "Turquesa",
      "#10b981": "Verde Esmeralda",
      "#84cc16": "Verde Limão",
      "#eab308": "Amarelo",
      "#f59e0b": "Âmbar",
      "#f97316": "Laranja",
      "#ef4444": "Vermelho",
      "#6366f1": "Azul Violeta"
    };
    
    return colorMap[color] || "Cor personalizada";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {account ? "Editar Conta" : "Adicionar Nova Conta"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="bank" className="flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                <span>Conta</span>
              </TabsTrigger>
              <TabsTrigger value="credit" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                <span>Cartão de Crédito</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {activeTab === "bank" ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Conta</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="Ex: Conta Corrente, Poupança, etc."
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type">Tipo de Conta</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleChange("type", value)}
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Selecione o tipo de conta" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="checking">Conta Corrente</SelectItem>
                    <SelectItem value="savings">Poupança</SelectItem>
                    <SelectItem value="investment">Investimento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="balance">Saldo Inicial</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <span className="text-sm text-muted-foreground">R$</span>
                  </div>
                  <Input
                    id="balance"
                    type="number"
                    step="0.01"
                    value={formData.balance}
                    onChange={(e) => handleChange("balance", parseFloat(e.target.value) || 0)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="institution">Instituição Financeira</Label>
                <Input
                  id="institution"
                  value={formData.institution}
                  onChange={(e) => handleChange("institution", e.target.value)}
                  placeholder="Ex: Nubank, Banco do Brasil, etc."
                />
              </div>
              
              <div className="space-y-2">
                <Label>Cor da Conta</Label>
                <div className="grid grid-cols-5 gap-2">
                  {ACCOUNT_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      title={getColorName(color)}
                      className={`w-full h-10 rounded-md ${
                        formData.color === color ? "ring-2 ring-primary ring-offset-2" : ""
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => handleChange("color", color)}
                    />
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Cartão</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="Ex: Nubank, Cartão X, etc."
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="institution">Bandeira / Emissor</Label>
                <Input
                  id="institution"
                  value={formData.institution}
                  onChange={(e) => handleChange("institution", e.target.value)}
                  placeholder="Ex: Visa, Mastercard, etc."
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="credit_limit">Limite de Crédito Total</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <span className="text-sm text-muted-foreground">R$</span>
                  </div>
                  <Input
                    id="credit_limit"
                    type="number"
                    step="0.01"
                    value={formData.credit_limit}
                    onChange={(e) => handleChange("credit_limit", parseFloat(e.target.value) || 0)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="due_date">Dia de Vencimento</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="due_date"
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.due_date 
                          ? `Dia ${formData.due_date}`
                          : "Selecione um dia"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={selectedDueDate}
                        onSelect={handleDueDateSelect}
                        initialFocus
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="closing_date">Dia de Fechamento</Label>
                  <Input
                    id="closing_date"
                    type="number"
                    min="1"
                    max="31"
                    value={formData.closing_date}
                    onChange={(e) => handleChange("closing_date", parseInt(e.target.value) || 1)}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Cor do Cartão</Label>
                <div className="grid grid-cols-5 gap-2">
                  {ACCOUNT_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      title={getColorName(color)}
                      className={`w-full h-10 rounded-md ${
                        formData.color === color ? "ring-2 ring-primary ring-offset-2" : ""
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => handleChange("color", color)}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
          
          <DialogFooter>
            <Button type="submit" className="bg-primary">
              {account ? "Salvar Alterações" : "Adicionar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}