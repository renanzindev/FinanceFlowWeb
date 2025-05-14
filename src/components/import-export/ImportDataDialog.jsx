import React, { useState, useEffect, useRef } from "react";
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
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  File,
  Upload,
  AlertCircle,
  FileSpreadsheet,
  Check,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format, parse } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";

// Função para ler arquivos Excel/CSV no formato brasileiro
const readExcelFile = async (file) => {
  // Esta é uma implementação simplificada para arquivos CSV com formato brasileiro
  const text = await file.text();
  const lines = text.split("\n");
  
  // Detectar o separador (geralmente ";" no formato BR, mas pode ser "," em alguns casos)
  const firstLine = lines[0];
  const delimiter = firstLine.includes(';') ? ';' : ',';
  
  const headers = lines[0].split(delimiter).map(h => h.trim().replace(/"/g, ''));
  
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    
    // Processar linha considerando possíveis campos com delimitadores dentro de aspas
    let row = {};
    let values = [];
    
    // Processamento simples para CSV sem campos complexos
    values = lines[i].split(delimiter).map(v => v.trim().replace(/"/g, ''));
    
    headers.forEach((header, index) => {
      row[header] = values[index] || "";
    });
    
    data.push(row);
  }
  
  return { headers, data };
};

export default function ImportDataDialog({ open, onOpenChange }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [file, setFile] = useState(null);
  const [fileData, setFileData] = useState(null);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(1);
  const [columnMappings, setColumnMappings] = useState({});
  const [defaultAccount, setDefaultAccount] = useState("");
  const [createMissingCategories, setCreateMissingCategories] = useState(true);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importedCount, setImportedCount] = useState(0);
  const [previewData, setPreviewData] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  
  const fileInputRef = useRef(null);

  const requiredFields = [
    { field: "description", label: "Descrição" },
    { field: "amount", label: "Valor" },
    { field: "date", label: "Data" },
    { field: "type", label: "Tipo" }
  ];
  
  const optionalFields = [
    { field: "category", label: "Categoria" },
    { field: "account_id", label: "Conta" },
    { field: "notes", label: "Observações" },
    { field: "is_paid", label: "Pago" }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);
        
        const accountsData = await Account.filter({ user_id: user.id });
        const categoriesData = await Category.filter({ user_id: user.id });
        
        setAccounts(accountsData);
        setCategories(categoriesData);
        
        if (accountsData.length > 0) {
          setDefaultAccount(accountsData[0].id);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    
    if (open) {
      fetchData();
    }
  }, [open]);

  // Reset state when dialog is closed
  useEffect(() => {
    if (!open) {
      setFile(null);
      setFileData(null);
      setError(null);
      setStep(1);
      setColumnMappings({});
      setImporting(false);
      setProgress(0);
      setImportedCount(0);
      setPreviewData([]);
      setDragActive(false);
    }
  }, [open]);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };
  
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };
  
  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFile(e.dataTransfer.files[0]);
    }
  };
  
  const handleFileSelect = async (e) => {
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0]);
    }
  };
  
  const processFile = async (uploadedFile) => {
    try {
      setError(null);
      
      if (!uploadedFile) return;
      
      // Check file type
      const fileType = uploadedFile.type;
      const isExcel = 
        fileType === "application/vnd.ms-excel" || 
        fileType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        fileType === "text/csv" ||
        uploadedFile.name.endsWith(".csv") ||
        uploadedFile.name.endsWith(".xls") ||
        uploadedFile.name.endsWith(".xlsx");
      
      if (!isExcel) {
        setError("O arquivo deve ser uma planilha Excel ou CSV");
        return;
      }
      
      setFile(uploadedFile);
      
      // Read file data
      const data = await readExcelFile(uploadedFile);
      setFileData(data);
      
      // Auto-map columns based on similarity
      const mappings = {};
      const allFields = [...requiredFields, ...optionalFields];
      
      data.headers.forEach(header => {
        const lowerHeader = header.toLowerCase();
        
        // Try to find a matching field
        for (const field of allFields) {
          const lowerField = field.label.toLowerCase();
          if (lowerHeader === lowerField || 
              lowerHeader.includes(lowerField) || 
              lowerField.includes(lowerHeader)) {
            mappings[header] = field.field;
            break;
          }
        }
      });
      
      setColumnMappings(mappings);
      
      // Create preview data
      if (data.data.length > 0) {
        setPreviewData(data.data.slice(0, 5));
      }
      
      // Move to next step
      setStep(2);
    } catch (error) {
      console.error("Error reading file:", error);
      setError("Erro ao ler o arquivo. Verifique se o formato é válido.");
    }
  };

  const handleMappingChange = (header, field) => {
    setColumnMappings(prev => ({
      ...prev,
      [header]: field
    }));
  };

  const validateMappings = () => {
    // Check if all required fields are mapped
    for (const required of requiredFields) {
      const isMapped = Object.values(columnMappings).includes(required.field);
      if (!isMapped) {
        return `Campo obrigatório não mapeado: ${required.label}`;
      }
    }
    
    return null;
  };

  const transformRowToTransaction = (row) => {
    const transaction = {
      user_id: currentUser.id
    };
    
    // Map fields from the row based on column mappings
    Object.entries(columnMappings).forEach(([header, field]) => {
      if (field && row[header] !== undefined) {
        // Handle special cases
        if (field === "amount") {
          // Convert amount string to number for Brazilian format (1.234,56)
          let amount = row[header].replace(/\./g, ""); // Remove thousand separators
          amount = amount.replace(",", "."); // Replace comma with dot
          transaction[field] = parseFloat(amount) || 0;
        } else if (field === "date") {
          // Try to parse date in Brazilian formats
          try {
            const dateStr = row[header];
            let date;
            
            if (dateStr.includes("/")) {
              // Format: DD/MM/YYYY
              const parts = dateStr.split("/");
              date = new Date(parts[2], parts[1] - 1, parts[0]);
            } else if (dateStr.includes("-")) {
              // Format: YYYY-MM-DD
              date = new Date(dateStr);
            } else {
              // Try direct parsing
              date = new Date(dateStr);
            }
            
            if (!isNaN(date.getTime())) {
              transaction[field] = format(date, "yyyy-MM-dd");
            }
          } catch (error) {
            console.error("Error parsing date:", error);
          }
        } else if (field === "type") {
          // Convert type text to enum value
          const typeText = row[header].toLowerCase();
          
          if (typeText.includes("rec") || typeText.includes("entrada") || typeText.includes("cred")) {
            transaction[field] = "income";
          } else if (typeText.includes("desp") || typeText.includes("saida") || typeText.includes("deb")) {
            transaction[field] = "expense";
          } else if (typeText.includes("trans")) {
            transaction[field] = "transfer";
          } else {
            // Default to expense
            transaction[field] = "expense";
          }
        } else if (field === "is_paid") {
          // Convert to boolean
          const value = row[header].toLowerCase();
          transaction[field] = !(value === "false" || value === "não" || value === "nao" || value === "n" || value === "0");
        } else {
          transaction[field] = row[header];
        }
      }
    });
    
    // Set default account if not mapped
    if (!transaction.account_id && defaultAccount) {
      transaction.account_id = defaultAccount;
    }
    
    // Adjust amount sign based on type
    if (transaction.amount && transaction.type) {
      if (transaction.type === "expense") {
        transaction.amount = -Math.abs(transaction.amount);
      } else {
        transaction.amount = Math.abs(transaction.amount);
      }
    }
    
    return transaction;
  };
  
  const handleImport = async () => {
    if (!fileData || !fileData.data || fileData.data.length === 0) {
      setError("Nenhum dado para importar");
      return;
    }
    
    const validationError = validateMappings();
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setImporting(true);
    setProgress(0);
    setImportedCount(0);
    
    try {
      const totalRows = fileData.data.length;
      let successCount = 0;
      
      for (let i = 0; i < totalRows; i++) {
        const row = fileData.data[i];
        const transaction = transformRowToTransaction(row);
        
        // Check for missing category
        if (transaction.category && createMissingCategories) {
          // Check if category exists
          const categoryExists = categories.some(cat => 
            cat.name && cat.name.toLowerCase() === transaction.category.toLowerCase()
          );
          
          if (!categoryExists) {
            // Create new category
            const newCategory = await Category.create({
              name: transaction.category,
              type: transaction.type === "income" ? "income" : "expense",
              color: transaction.type === "income" ? "#10b981" : "#ef4444",
              is_active: true,
              user_id: currentUser.id
            });
            
            // Add to local categories
            setCategories(prev => [...prev, newCategory]);
          }
        }
        
        // Import transaction
        await Transaction.create(transaction);
        
        successCount++;
        setImportedCount(successCount);
        setProgress(Math.round((i + 1) / totalRows * 100));
      }
      
      // Import completed
      setTimeout(() => {
        setStep(3);
        setImporting(false);
      }, 1000);
      
    } catch (error) {
      console.error("Error importing transactions:", error);
      setError("Erro ao importar transações: " + error.message);
      setImporting(false);
    }
  };

  const renderStep = () => {
    if (step === 1) {
      return (
        <ScrollArea className="max-h-[60vh]">
          <div className="px-1 py-2">
            <DialogDescription className="text-center mb-6">
              Selecione uma planilha Excel ou CSV para importar
            </DialogDescription>
            
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                ${dragActive ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}
            >
              <input 
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
              />
              <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              {dragActive ? (
                <p className="text-lg font-medium">Solte o arquivo aqui...</p>
              ) : (
                <div>
                  <p className="text-lg font-medium mb-2">
                    Arraste e solte uma planilha aqui
                  </p>
                  <p className="text-muted-foreground">
                    ou clique para selecionar um arquivo
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Formatos suportados: .xlsx, .xls, .csv
                  </p>
                </div>
              )}
            </div>
            
            {file && (
              <div className="flex items-center gap-2 p-4 bg-muted rounded-lg mt-4">
                <File className="h-6 w-6 text-primary" />
                <div className="flex-1">
                  <p className="font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                {fileData && (
                  <div className="text-xs text-muted-foreground">
                    {fileData.data.length} registros
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      );
    } else if (step === 2) {
      return (
        <ScrollArea className="max-h-[60vh]">
          <div className="px-1 py-2">
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Configuração de Mapeamento</h3>
              <p className="text-sm text-muted-foreground">
                Associe as colunas da sua planilha aos campos do sistema
              </p>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Campos Obrigatórios</h4>
                <Card className="p-4">
                  {fileData && fileData.headers && requiredFields.map(field => {
                    const mappedHeader = Object.entries(columnMappings)
                      .find(([_, value]) => value === field.field)?.[0];
                    
                    return (
                      <div key={field.field} className="flex items-center justify-between mb-3 last:mb-0">
                        <Label className="font-medium text-sm">{field.label}:</Label>
                        <Select
                          value={mappedHeader || ""}
                          onValueChange={(header) => handleMappingChange(header, field.field)}
                        >
                          <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Selecione uma coluna" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={null}>Não mapeado</SelectItem>
                            {fileData.headers.map(header => (
                              <SelectItem key={header} value={header}>
                                {header}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  })}
                </Card>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Campos Opcionais</h4>
                <Card className="p-4">
                  {fileData && fileData.headers && optionalFields.map(field => {
                    const mappedHeader = Object.entries(columnMappings)
                      .find(([_, value]) => value === field.field)?.[0];
                    
                    return (
                      <div key={field.field} className="flex items-center justify-between mb-3 last:mb-0">
                        <Label className="font-medium text-sm">{field.label}:</Label>
                        <Select
                          value={mappedHeader || ""}
                          onValueChange={(header) => handleMappingChange(header, field.field)}
                        >
                          <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Selecione uma coluna" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={null}>Não mapeado</SelectItem>
                            {fileData.headers.map(header => (
                              <SelectItem key={header} value={header}>
                                {header}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  })}
                </Card>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Configurações Adicionais</h4>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm">Conta Padrão</Label>
                    <p className="text-xs text-muted-foreground">
                      Usada quando não houver conta especificada
                    </p>
                  </div>
                  <Select
                    value={defaultAccount}
                    onValueChange={setDefaultAccount}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Selecione uma conta" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map(account => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm">Criar Categorias Automaticamente</Label>
                    <p className="text-xs text-muted-foreground">
                      Criar categorias que não existem no sistema
                    </p>
                  </div>
                  <Switch
                    checked={createMissingCategories}
                    onCheckedChange={setCreateMissingCategories}
                  />
                </div>
              </div>
              
              {previewData.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Prévia dos Dados</h4>
                  <ScrollArea className="h-[200px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {fileData.headers.map(header => (
                            <TableHead key={header}>
                              {header}
                              {columnMappings[header] && (
                                <span className="block text-xs text-primary">
                                  → {columnMappings[header]}
                                </span>
                              )}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previewData.map((row, index) => (
                          <TableRow key={index}>
                            {fileData.headers.map(header => (
                              <TableCell key={header}>
                                {row[header] || ""}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      );
    } else if (step === 3) {
      return (
        <div className="text-center py-8">
          <div className="mb-6">
            {importing ? (
              <>
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-3">Importando Dados</h3>
                  <Progress value={progress} className="w-full h-3" />
                  <p className="text-sm text-muted-foreground mt-2">
                    Importados {importedCount} de {fileData.data.length} registros
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-medium">Importação Concluída</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  {importedCount} registros foram importados com sucesso
                </p>
              </>
            )}
          </div>
        </div>
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] h-auto">
        <DialogHeader className="mb-2">
          <DialogTitle>Importar Dados</DialogTitle>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="my-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs value={`step-${step}`} className="mb-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger 
              value="step-1" 
              disabled={importing}
              onClick={() => !importing && setStep(1)}
            >
              1. Selecionar Arquivo
            </TabsTrigger>
            <TabsTrigger 
              value="step-2" 
              disabled={!fileData || importing}
              onClick={() => fileData && !importing && setStep(2)}
            >
              2. Mapear Colunas
            </TabsTrigger>
            <TabsTrigger 
              value="step-3" 
              disabled={step < 3}
            >
              3. Importar
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {renderStep()}

        <DialogFooter className="mt-6">
          {step === 1 && (
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
          )}
          
          {step === 2 && (
            <>
              <Button 
                variant="outline" 
                onClick={() => setStep(1)}
                disabled={importing}
              >
                Voltar
              </Button>
              <Button
                onClick={() => {
                  const error = validateMappings();
                  if (error) {
                    setError(error);
                  } else {
                    setError(null);
                    handleImport();
                  }
                }}
                disabled={importing}
              >
                <Upload className="mr-2 h-4 w-4" />
                Importar Dados
              </Button>
            </>
          )}
          
          {step === 3 && !importing && (
            <Button onClick={() => onOpenChange(false)}>
              Concluir
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}