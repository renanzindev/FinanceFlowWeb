
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import {
  ArrowDown,
  ArrowUp,
  ArrowRight,
  CalendarIcon,
  CreditCard,
  Wallet,
} from "lucide-react";
import { format, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Transaction } from "@/api/entities";
import { Account } from "@/api/entities";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function TransactionDialog({ 
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
    type: "expense",
    category: "",
    account_id: "",
    date: new Date().toISOString().split('T')[0],
    is_fixed: false,
    recurrence: "none",
    is_paid: true,
    notes: "",
    tags: []
  });
  
  const [isInstallment, setIsInstallment] = useState(false);
  const [installmentCount, setInstallmentCount] = useState(1);
  const [isProcessingInstallments, setIsProcessingInstallments] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("account"); // "account" or "credit_card"

  useEffect(() => {
    // Fetch current user when component mounts
    const fetchUser = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);
      } catch (error) {
        console.error("Error fetching user:", error);
        alert("Erro ao carregar informações do usuário. Por favor, tente novamente.");
      }
    };
    
    fetchUser();
  }, []);

  useEffect(() => {
    if (transaction) {
      setFormData({
        ...transaction,
        amount: Math.abs(transaction.amount) || 0,
        date: transaction.date || new Date().toISOString().split('T')[0],
        is_fixed: transaction.is_fixed || false,
        recurrence: transaction.recurrence || "none",
        is_paid: transaction.is_paid !== false
      });
      setIsInstallment(false);
      setInstallmentCount(1);

      const selectedAccount = accounts.find(acc => acc.id === transaction.account_id);
      if (selectedAccount && selectedAccount.type === 'credit_card') {
        setPaymentMethod('credit_card');
      } else {
        setPaymentMethod('account');
      }
    } else {
      setFormData({
        description: "",
        amount: 0,
        type: "expense",
        category: "",
        account_id: accounts.length > 0 ? accounts[0].id : "",
        date: new Date().toISOString().split('T')[0],
        is_fixed: false,
        recurrence: "none",
        is_paid: true,
        notes: "",
        tags: []
      });
      setPaymentMethod("account"); // Default to account
    }
  }, [transaction, open, accounts]);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      alert("Erro: Usuário não identificado. Por favor, tente novamente.");
      return;
    }
    
    let accountToUse = formData.account_id;
    if (paymentMethod === 'credit_card' && formData.credit_card_id) {
      accountToUse = formData.credit_card_id;
    }
    
    try {
      if (isInstallment && formData.type === "expense" && paymentMethod === 'credit_card') {
        setIsProcessingInstallments(true);
        
        const installmentAmount = Math.abs(formData.amount) / installmentCount;
        const baseDescription = formData.description;
        const startDate = new Date(formData.date);
        
        const selectedCreditCard = accounts.find(acc => acc.id === accountToUse && acc.type === "credit_card");
        if (selectedCreditCard) {
          const totalAmount = Math.abs(formData.amount);
          if (totalAmount > selectedCreditCard.available_credit_limit) {
            alert("Limite de crédito insuficiente");
            setIsProcessingInstallments(false);
            return;
          }
          
          for (let i = 0; i < installmentCount; i++) {
            const installmentDate = addMonths(startDate, i);
            const installmentDescription = `${baseDescription} (${i+1}/${installmentCount})`;
            
            const installmentData = {
              ...formData,
              description: installmentDescription,
              amount: -installmentAmount,
              date: format(installmentDate, 'yyyy-MM-dd'),
              notes: formData.notes ? `${formData.notes} - Parcela ${i+1} de ${installmentCount}` : `Parcela ${i+1} de ${installmentCount}`,
              is_installment: true,
              installment_number: i + 1,
              total_installments: installmentCount,
              user_id: currentUser.id,
              account_id: accountToUse // Use credit card id
            };
            
            await Transaction.create(installmentData);
          }
          
          await Account.update(selectedCreditCard.id, {
            available_credit_limit: selectedCreditCard.available_credit_limit - totalAmount
          });
        } else {
           alert("Cartão de crédito selecionado não encontrado.");
           setIsProcessingInstallments(false);
           return;
        }
        
        setIsProcessingInstallments(false);
        onOpenChange(false); // Close dialog after processing installments
        onSave({}); // Trigger a refresh or callback
      } else {
        const processedData = {
          ...formData,
          amount: formData.type === "expense" ? -Math.abs(formData.amount) : Math.abs(formData.amount),
          user_id: currentUser.id,
          account_id: accountToUse // Make sure to use the correct account/card id
        };
        
        onSave(processedData);
      }
    } catch (error) {
      console.error("Error saving transaction:", error);
      alert("Erro ao salvar transação. Por favor, tente novamente.");
      setIsProcessingInstallments(false);
    }
  };

  // Filter categories based on transaction type and ensure they belong to current user
  const filteredCategories = categories.filter(
    category => (category.type === formData.type || formData.type === "transfer") && category.user_id === currentUser?.id
  );

  const bankAccounts = accounts.filter(acc => acc.type !== 'credit_card' && acc.is_active);
  const creditCards = accounts.filter(acc => acc.type === 'credit_card' && acc.is_active);

  useEffect(() => {
    // Auto-select first available account/card when method changes or on initial load
    if (open) {
      if (paymentMethod === 'account' && bankAccounts.length > 0 && !formData.account_id) {
        handleChange("account_id", bankAccounts[0].id);
      } else if (paymentMethod === 'credit_card' && creditCards.length > 0 && !formData.credit_card_id) {
        handleChange("credit_card_id", creditCards[0].id);
      }
    }
  }, [paymentMethod, open, bankAccounts, creditCards]);


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {transaction ? "Editar Transação" : "Adicionar Nova Transação"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Transaction Type */}
          <div className="grid grid-cols-3 gap-2">
            <Button
              type="button"
              variant={formData.type === "income" ? "default" : "outline"}
              className={`${formData.type === "income" ? "bg-emerald-600 hover:bg-emerald-700" : ""} px-1 sm:px-4`}
              onClick={() => {
                handleChange("type", "income");
                setIsInstallment(false);
              }}
            >
              <ArrowUp className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Receita</span>
            </Button>
            <Button
              type="button"
              variant={formData.type === "expense" ? "default" : "outline"}
              className={`${formData.type === "expense" ? "bg-rose-600 hover:bg-rose-700" : ""} px-1 sm:px-4`}
              onClick={() => handleChange("type", "expense")}
            >
              <ArrowDown className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Despesa</span>
            </Button>
            <Button
              type="button"
              variant={formData.type === "transfer" ? "default" : "outline"}
              className={`${formData.type === "transfer" ? "bg-blue-600 hover:bg-blue-700" : ""} px-1 sm:px-4`}
              onClick={() => {
                handleChange("type", "transfer");
                setIsInstallment(false);
              }}
            >
              <ArrowRight className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Transferência</span>
            </Button>
          </div>

          {/* Description and Amount */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Ex: Supermercado, Salário, etc."
                required
              />
            </div>
            
            <div>
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
          </div>
          
          {/* Payment Method Selection */}
          {formData.type === 'expense' && (
            <div>
              <Label className="mb-2 block">Forma de Pagamento</Label>
              <RadioGroup
                defaultValue="account"
                value={paymentMethod}
                onValueChange={(value) => {
                  setPaymentMethod(value);
                  // Clear other payment method's selection
                  if (value === 'account') {
                    handleChange('credit_card_id', '');
                    if (bankAccounts.length > 0) handleChange('account_id', bankAccounts[0].id);
                  } else {
                    handleChange('account_id', '');
                     if (creditCards.length > 0) handleChange('credit_card_id', creditCards[0].id);
                  }
                }}
                className="grid grid-cols-2 gap-4"
              >
                <div>
                  <RadioGroupItem value="account" id="account-payment" className="peer sr-only" />
                  <Label
                    htmlFor="account-payment"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <Wallet className="mb-3 h-6 w-6" />
                    Conta/Pix
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="credit_card" id="credit_card-payment" className="peer sr-only" />
                  <Label
                    htmlFor="credit_card-payment"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <CreditCard className="mb-3 h-6 w-6" />
                    Cartão de Crédito
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Account and Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {paymentMethod === 'account' || formData.type !== 'expense' ? (
              <div>
                <Label htmlFor="account_id">Conta</Label>
                <Select
                  value={formData.account_id}
                  onValueChange={(value) => handleChange("account_id", value)}
                  required={paymentMethod === 'account' || formData.type !== 'expense'}
                >
                  <SelectTrigger id="account_id">
                    <SelectValue placeholder="Selecione a conta" />
                  </SelectTrigger>
                  <SelectContent>
                    {bankAccounts.map((account) => (
                      <SelectItem 
                        key={account.id} 
                        value={account.id}
                      >
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div>
                <Label htmlFor="credit_card_id">Cartão de Crédito</Label>
                <Select
                  value={formData.credit_card_id}
                  onValueChange={(value) => handleChange("credit_card_id", value)}
                  required={paymentMethod === 'credit_card' && formData.type === 'expense'}
                >
                  <SelectTrigger id="credit_card_id">
                    <SelectValue placeholder="Selecione o cartão" />
                  </SelectTrigger>
                  <SelectContent>
                    {creditCards.map((card) => (
                      <SelectItem key={card.id} value={card.id}>
                        {card.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div>
              <Label htmlFor="category">Categoria</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleChange("category", value)}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {filteredCategories
                    .map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Date field with Popover calendar */}
          <div>
            <Label>Data</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.date 
                    ? format(new Date(formData.date), "PPP", { locale: ptBR })
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
          
          {/* Installment option - only for expenses and credit card */}
          {formData.type === "expense" && paymentMethod === "credit_card" && (
            <div className="space-y-4 border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="is_installment" className="cursor-pointer">Compra Parcelada</Label>
                </div>
                <Switch
                  id="is_installment"
                  checked={isInstallment}
                  onCheckedChange={(checked) => {
                    setIsInstallment(checked);
                    if (checked) {
                      handleChange("is_fixed", false);
                      handleChange("recurrence", "none");
                    }
                  }}
                />
              </div>
              
              {isInstallment && (
                <div className="space-y-2">
                  <Label htmlFor="installment_count">Número de Parcelas</Label>
                  <Select
                    value={installmentCount.toString()}
                    onValueChange={(value) => setInstallmentCount(parseInt(value))}
                  >
                    <SelectTrigger id="installment_count">
                      <SelectValue placeholder="Selecione o número de parcelas" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => i + 1).map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num} {num === 1 ? 'parcela' : 'parcelas'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <div className="mt-2 text-sm text-muted-foreground">
                    <p>Serão criadas {installmentCount} parcelas de {new Intl.NumberFormat('pt-BR', {style: 'currency', currency: 'BRL'}).format(formData.amount / installmentCount)} cada.</p>
                    <p>A primeira parcela será na data selecionada, e as demais nos meses seguintes.</p>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Recurrence options - only if not an installment */}
          {!isInstallment && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="is_fixed" className="cursor-pointer">Transação Fixa/Recorrente</Label>
                <Switch
                  id="is_fixed"
                  checked={formData.is_fixed}
                  onCheckedChange={(checked) => handleChange("is_fixed", checked)}
                />
              </div>
              
              {formData.is_fixed && (
                <div className="space-y-2">
                  <Label htmlFor="recurrence">Frequência</Label>
                  <Select
                    value={formData.recurrence}
                    onValueChange={(value) => handleChange("recurrence", value)}
                  >
                    <SelectTrigger id="recurrence">
                      <SelectValue placeholder="Selecione a frequência" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Mensal</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="yearly">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}
          
          {/* Payment status */}
          <div className="flex items-center justify-between">
            <Label htmlFor="is_paid" className="cursor-pointer">
              {formData.type === "income" ? "Recebido" : "Pago"}
            </Label>
            <Switch
              id="is_paid"
              checked={formData.is_paid}
              onCheckedChange={(checked) => handleChange("is_paid", checked)}
            />
          </div>
          
          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes || ""}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Observações adicionais..."
              rows={3}
            />
          </div>
          
          <DialogFooter className="sm:justify-end">
            <Button
              type="submit"
              className="w-full sm:w-auto bg-primary"
              disabled={isProcessingInstallments || !currentUser}
            >
              {isProcessingInstallments ? "Processando..." : 
                isInstallment ? "Criar Parcelas" : 
                transaction ? "Salvar Alterações" : "Adicionar Transação"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
