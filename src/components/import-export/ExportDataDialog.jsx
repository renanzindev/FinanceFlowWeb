import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Account } from "@/api/entities";
import { Category } from "@/api/entities";
import { Transaction } from "@/api/entities";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DatePickerWithRange } from "../ui/date-range-picker";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  FileDown,
  Download,
  Check,
  FileSpreadsheet
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";

// Função para gerar arquivo Excel/CSV no formato brasileiro
const generateExcelFile = async (data, fileName) => {
  // No formato brasileiro, usamos ";" como separador e "," para decimais
  let csv = "";
  
  // Headers
  const headers = Object.keys(data[0] || {});
  csv += headers.join(";") + "\n";
  
  // Rows
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      
      // Handle different types of values
      if (value === null || value === undefined) return '';
      
      if (typeof value === 'number') {
        // Format numbers with comma for decimals and no thousands separator
        return value.toString().replace(".", ",");
      }
      
      if (typeof value === 'string') {
        // Quote strings containing semicolons
        if (value.includes(';')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }
      
      return value;
    });
    
    csv += values.join(";") + "\n";
  }
  
  // Create "download" by returning the CSV
  return csv;
};

// Função para converter transações para formato de exportação
const formatTransactionsForExport = (transactions, accounts, categories) => {
  return transactions.map(transaction => {
    const account = accounts.find(a => a.id === transaction.account_id);
    const category = categories.find(c => c.id === transaction.category);
    
    return {
      Descrição: transaction.description,
      Valor: Math.abs(transaction.amount),
      Tipo: transaction.type === "income" 
              ? "Receita" 
              : transaction.type === "expense" 
                ? "Despesa" 
                : "Transferência",
      Data: format(new Date(transaction.date), "dd/MM/yyyy", { locale: ptBR }),
      Categoria: category ? category.name : "",
      Conta: account ? account.name : "",
      Observações: transaction.notes || "",
      Pago: transaction.is_paid ? "Sim" : "Não",
      Fixo: transaction.is_fixed ? "Sim" : "Não"
    };
  });
};

// Função para converter contas para formato de exportação
const formatAccountsForExport = (accounts) => {
  return accounts.map(account => {
    return {
      Nome: account.name,
      Tipo: account.type === "checking" 
              ? "Conta Corrente" 
              : account.type === "savings" 
                ? "Poupança" 
                : account.type === "investment" 
                  ? "Investimento" 
                  : "Cartão de Crédito",
      Saldo: account.balance,
      Instituição: account.institution || "",
      LimiteCrediário: account.credit_limit || "",
      Ativo: account.is_active ? "Sim" : "Não"
    };
  });
};

// Função para converter categorias para formato de exportação
const formatCategoriesForExport = (categories) => {
  return categories.map(category => {
    return {
      Nome: category.name,
      Tipo: category.type === "income" ? "Receita" : "Despesa",
      Orçamento: category.budget || "",
      Cor: category.color || "",
      Ativo: category.is_active ? "Sim" : "Não"
    };
  });
};

export default function ExportDataDialog({ 
  open,
  onOpenChange, 
  dataType = "transactions",
  dateRange
}) {
  const [currentUser, setCurrentUser] = useState(null);
  const [exportFormat, setExportFormat] = useState("excel");
  const [includeHeaders, setIncludeHeaders] = useState(true);
  const [exportDateRange, setExportDateRange] = useState(dateRange || {
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
  });
  const [selectedDataType, setSelectedDataType] = useState(dataType);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [exportComplete, setExportComplete] = useState(false);
  const [exportedData, setExportedData] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };
    
    if (open) {
      fetchUser();
      setSelectedDataType(dataType);
      setExportDateRange(dateRange);
      setExportComplete(false);
      setExportedData(null);
    }
  }, [open, dataType, dateRange]);

  const handleExport = async () => {
    if (!currentUser) return;
    
    setIsExporting(true);
    setProgress(0);
    
    try {
      let data = [];
      
      if (selectedDataType === "transactions") {
        // Get transactions for date range
        const transactions = await Transaction.filter({ user_id: currentUser.id });
        
        // Filter by date range
        const filteredTransactions = transactions.filter(transaction => {
          if (!exportDateRange.from || !exportDateRange.to) return true;
          
          const transactionDate = new Date(transaction.date);
          return transactionDate >= exportDateRange.from && 
                 transactionDate <= exportDateRange.to;
        });
        
        // Add account and category names
        const accounts = await Account.filter({ user_id: currentUser.id });
        const categories = await Category.filter({ user_id: currentUser.id });
        
        // Format data for export
        data = formatTransactionsForExport(filteredTransactions, accounts, categories);
        
      } else if (selectedDataType === "accounts") {
        const accounts = await Account.filter({ user_id: currentUser.id });
        data = formatAccountsForExport(accounts);
      } else if (selectedDataType === "categories") {
        const categories = await Category.filter({ user_id: currentUser.id });
        data = formatCategoriesForExport(categories);
      }
      
      // Simulate progress
      for (let i = 0; i <= 100; i += 20) {
        setProgress(i);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Generate file name
      const today = format(new Date(), "yyyy-MM-dd", { locale: ptBR });
      const fileName = `${selectedDataType}_${today}`;
      
      // Generate export file
      const fileContent = await generateExcelFile(data, fileName);
      setExportedData({
        fileName: `${fileName}.csv`,
        data: fileContent
      });
      
      setExportComplete(true);
      setProgress(100);
    } catch (error) {
      console.error("Error exporting data:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownload = () => {
    if (!exportedData) return;
    
    // Create download link with proper charset for Brazilian format
    const blob = new Blob([exportedData.data], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', exportedData.fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] h-auto">
        <DialogHeader>
          <DialogTitle>Exportar Dados</DialogTitle>
          <DialogDescription>
            Configure e exporte seus dados financeiros
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          {!exportComplete ? (
            <div className="py-4 px-1 space-y-6">
              <div className="space-y-3">
                <Label>Tipo de Dados</Label>
                <RadioGroup 
                  value={selectedDataType} 
                  onValueChange={setSelectedDataType}
                  className="flex flex-col space-y-3"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="transactions" id="transactions" />
                    <Label htmlFor="transactions" className="cursor-pointer">Transações</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="accounts" id="accounts" />
                    <Label htmlFor="accounts" className="cursor-pointer">Contas</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="categories" id="categories" />
                    <Label htmlFor="categories" className="cursor-pointer">Categorias</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <Separator />
              
              {selectedDataType === "transactions" && (
                <div className="space-y-3">
                  <Label>Período</Label>
                  <DatePickerWithRange
                    date={exportDateRange}
                    onDateChange={setExportDateRange}
                  />
                </div>
              )}
              
              <div className="space-y-3">
                <Label>Formato de Exportação</Label>
                <RadioGroup 
                  value={exportFormat} 
                  onValueChange={setExportFormat}
                  className="flex flex-col space-y-3"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="excel" id="excel" />
                    <Label htmlFor="excel" className="cursor-pointer">CSV (Excel)</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="includeHeaders">Incluir Cabeçalhos</Label>
                  <p className="text-xs text-muted-foreground">
                    Incluir nomes das colunas no arquivo
                  </p>
                </div>
                <Switch
                  id="includeHeaders"
                  checked={includeHeaders}
                  onCheckedChange={setIncludeHeaders}
                />
              </div>

              <div className="bg-muted p-3 rounded-md mt-2">
                <div className="flex items-center mb-2">
                  <FileSpreadsheet className="h-4 w-4 mr-2 text-primary" />
                  <span className="font-medium text-sm">Formato Brasileiro</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  O arquivo será gerado com ponto-e-vírgula (;) como separador e vírgula (,) para decimais,
                  formato compatível com Excel brasileiro.
                </p>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-medium">Exportação Concluída</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Seus dados foram exportados com sucesso
              </p>
              
              <Button 
                className="mt-6 w-full"
                onClick={handleDownload}
              >
                <FileDown className="mr-2 h-4 w-4" />
                Baixar Arquivo
              </Button>
            </div>
          )}
        </ScrollArea>

        {isExporting && (
          <div className="mb-6">
            <Progress value={progress} className="w-full h-3" />
            <p className="text-sm text-muted-foreground mt-2 text-center">
              Processando exportação...
            </p>
          </div>
        )}

        <DialogFooter>
          {!exportComplete ? (
            <>
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isExporting}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleExport}
                disabled={isExporting}
              >
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </Button>
            </>
          ) : (
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Fechar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}