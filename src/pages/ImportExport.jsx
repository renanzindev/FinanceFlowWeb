import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Account } from "@/api/entities";
import { Category } from "@/api/entities";
import { Transaction } from "@/api/entities";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { 
  Download, 
  Upload, 
  Calendar,
  ArrowRight,
  FileDown,
  FileUp,
  FileSpreadsheet,
  CheckCircle2,
  Database
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DatePickerWithRange } from "../components/ui/date-range-picker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import ImportDataDialog from "../components/import-export/ImportDataDialog";
import ExportDataDialog from "../components/import-export/ExportDataDialog";

export default function ImportExport() {
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalAccounts: 0,
    totalCategories: 0,
    lastTransaction: null
  });
  
  const [dataType, setDataType] = useState("transactions");
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(subMonths(new Date(), 1)),
    to: endOfMonth(new Date())
  });
  
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Get current user
        const user = await User.me();
        setCurrentUser(user);
        
        // Fetch counts for stats
        const transactions = await Transaction.filter({ user_id: user.id });
        const accounts = await Account.filter({ user_id: user.id });
        const categories = await Category.filter({ user_id: user.id });
        
        setStats({
          totalTransactions: transactions.length,
          totalAccounts: accounts.length,
          totalCategories: categories.length,
          lastTransaction: transactions.length > 0 ? 
            transactions.sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0] : null
        });
        
      } catch (error) {
        console.error("Error fetching data:", error);
      }
      setLoading(false);
    };
    
    fetchData();
  }, []);

  const handleImport = () => {
    setImportDialogOpen(true);
  };
  
  const handleExport = () => {
    setExportDialogOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Importar e Exportar</h1>
        <p className="text-muted-foreground">
          Gerencie seus dados através de importação e exportação
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md font-medium text-muted-foreground flex items-center">
              <Database className="mr-2 h-4 w-4" />
              Transações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Skeleton className="h-8 w-20" /> : stats.totalTransactions}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md font-medium text-muted-foreground flex items-center">
              <Database className="mr-2 h-4 w-4" />
              Contas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Skeleton className="h-8 w-20" /> : stats.totalAccounts}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md font-medium text-muted-foreground flex items-center">
              <Database className="mr-2 h-4 w-4" />
              Categorias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Skeleton className="h-8 w-20" /> : stats.totalCategories}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md font-medium text-muted-foreground flex items-center">
              <Calendar className="mr-2 h-4 w-4" />
              Última Transação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : stats.lastTransaction ? (
                format(new Date(stats.lastTransaction.created_date), "dd/MM/yyyy")
              ) : (
                "N/A"
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="import" className="space-y-4">
        <TabsList>
          <TabsTrigger value="import">Importar Dados</TabsTrigger>
          <TabsTrigger value="export">Exportar Dados</TabsTrigger>
        </TabsList>
        
        <TabsContent value="import" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Importar Dados</CardTitle>
              <CardDescription>
                Importe seus dados de planilhas Excel ou CSV
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-2 hover:border-primary cursor-pointer transition-colors" onClick={handleImport}>
                  <CardContent className="p-6 text-center flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <FileUp className="h-8 w-8 text-primary" />
                    </div>
                    
                    <h3 className="font-semibold text-lg">Importar Dados</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      Importe transações de planilhas Excel ou CSV, com mapeamento de colunas
                    </p>
                    
                    <Button className="mt-4 w-full">
                      <Upload className="mr-2 h-4 w-4" />
                      Iniciar Importação
                    </Button>
                  </CardContent>
                </Card>
                
                <div className="space-y-4">
                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center">
                      <CheckCircle2 className="h-4 w-4 mr-2 text-primary" />
                      Mapeamento Inteligente de Colunas
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Associe automaticamente ou manualmente as colunas da sua planilha com os campos do sistema.
                    </p>
                  </div>
                  
                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center">
                      <CheckCircle2 className="h-4 w-4 mr-2 text-primary" />
                      Criação Automática de Categorias
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Categorias não encontradas são automaticamente criadas durante a importação.
                    </p>
                  </div>
                  
                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center">
                      <CheckCircle2 className="h-4 w-4 mr-2 text-primary" />
                      Suporte a Múltiplos Formatos
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Compatível com arquivos Excel (.xlsx, .xls) e CSV.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Exportar Dados</CardTitle>
              <CardDescription>
                Exporte seus dados para planilhas Excel
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-2 hover:border-primary cursor-pointer transition-colors" onClick={handleExport}>
                  <CardContent className="p-6 text-center flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <FileDown className="h-8 w-8 text-primary" />
                    </div>
                    
                    <h3 className="font-semibold text-lg">Exportar Dados</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      Exporte transações, contas ou categorias para Excel, definindo o período desejado
                    </p>
                    
                    <Button className="mt-4 w-full">
                      <Download className="mr-2 h-4 w-4" />
                      Iniciar Exportação
                    </Button>
                  </CardContent>
                </Card>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Selecione o Tipo de Dados</label>
                    <select
                      value={dataType}
                      onChange={(e) => setDataType(e.target.value)}
                      className="w-full rounded-md border border-input px-3 py-2 bg-background text-sm"
                    >
                      <option value="transactions">Transações</option>
                      <option value="accounts">Contas</option>
                      <option value="categories">Categorias</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Período (para transações)</label>
                    <DatePickerWithRange
                      date={dateRange}
                      onDateChange={setDateRange}
                    />
                  </div>
                  
                  <div className="bg-muted p-4 rounded-lg mt-4">
                    <h4 className="font-medium mb-2 flex items-center">
                      <FileSpreadsheet className="h-4 w-4 mr-2 text-primary" />
                      Formato Excel
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Os dados serão exportados em formato Excel (.xlsx).
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <ImportDataDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
      />
      
      <ExportDataDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        dataType={dataType}
        dateRange={dateRange}
      />
    </div>
  );
}