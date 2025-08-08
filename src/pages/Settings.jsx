
import React, { useState, useEffect, useRef } from "react";
import { User } from "@/api/entities";
import { Category } from "@/api/entities";
import { Account } from "@/api/entities";
import { Transaction } from "@/api/entities";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Settings as SettingsIcon, 
  User as UserIcon, 
  Palette, 
  Database, 
  Tags,
  Moon,
  Sun,
  Download,
  Upload,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Tag,
  Camera
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import CategoryDialog from "../components/settings/CategoryDialog";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { CustomAlert } from "@/components/ui/alert-dialog";

const ProfileSection = ({ userData, setUserData, loading }) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleProfilePictureUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      
      // For now, just show a message that upload is not available
      alert("Upload de imagem não disponível no momento");
      
    } catch (error) {
      console.error("Error uploading profile picture:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Perfil do Usuário</CardTitle>
        <CardDescription>
          Visualize e atualize suas informações pessoais
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Avatar className="w-20 h-20">
              {userData?.profile_picture ? (
                <AvatarImage src={userData.profile_picture} alt={userData.full_name} />
              ) : (
                <AvatarFallback className="text-2xl">
                  {userData?.full_name?.charAt(0) || "U"}
                </AvatarFallback>
              )}
            </Avatar>
            <Button
              variant="outline"
              size="icon"
              className="absolute bottom-0 right-0 rounded-full"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Camera className="h-4 w-4" />
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleProfilePictureUpload}
            />
          </div>
          <div>
            <h3 className="font-medium text-lg">
              {loading ? (
                <Skeleton className="h-6 w-40" />
              ) : (
                userData?.full_name || "Usuário"
              )}
            </h3>
            <p className="text-muted-foreground">
              {loading ? (
                <Skeleton className="h-4 w-60" />
              ) : (
                userData?.email || ""
              )}
            </p>
          </div>
        </div>

        <Separator />

        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome Completo</Label>
            <Input 
              id="name" 
              value={userData?.full_name || ""} 
              disabled 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              value={userData?.email || ""} 
              disabled 
            />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <p className="text-sm text-muted-foreground">
          Seu perfil é gerenciado pelo provedor de autenticação.
        </p>
      </CardFooter>
    </Card>
  );
};

export default function SettingsPage() {
  const [userData, setUserData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [currency, setCurrency] = useState("BRL");
  const [dateFormat, setDateFormat] = useState("dd/MM/yyyy");
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [stats, setStats] = useState({
    totalAccounts: 0,
    totalCategories: 0,
    totalTransactions: 0,
    lastActivity: null
  });
  const [alertConfig, setAlertConfig] = useState({
    open: false,
    title: "",
    description: "",
    type: "error"
  });

  useEffect(() => {
    fetchData();
    
    // Check if dark mode is enabled
    const savedTheme = localStorage.getItem("theme");
    setDarkMode(savedTheme === "dark");
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch user data
      const user = await User.me();
      setUserData(user);
      
      // Load user preferences if they exist
      setCurrency(user.currency || "BRL");
      setDateFormat(user.dateFormat || "dd/MM/yyyy");
      
      // Fetch categories
      const categoriesData = await Category.list();
      setCategories(categoriesData);
      
      // Fetch stats
      const accounts = await Account.list();
      const transactions = await Transaction.list("-updated_date", 1);
      
      setStats({
        totalAccounts: accounts.length,
        totalCategories: categoriesData.length,
        totalTransactions: transactions.length,
        lastActivity: transactions.length > 0 ? transactions[0].updated_date : null
      });
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setLoading(false);
  };

  const handleToggleDarkMode = async () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    
    if (newDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const savePreferences = async () => {
    try {
      await User.updateMyUserData({
        currency,
        dateFormat
      });
      alert("Preferências salvas com sucesso!");
    } catch (error) {
      console.error("Error saving preferences:", error);
      alert("Erro ao salvar preferências.");
    }
  };

  const handleCreateCategory = async (categoryData) => {
    try {
      await Category.create(categoryData);
      setCategoryDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error creating category:", error);
    }
  };

  const handleUpdateCategory = async (categoryData) => {
    try {
      await Category.update(currentCategory.id, categoryData);
      setCategoryDialogOpen(false);
      setCurrentCategory(null);
      fetchData();
    } catch (error) {
      console.error("Error updating category:", error);
    }
  };

  const handleDeleteCategory = async (category) => {
    try {
      const transactions = await Transaction.filter({
        user_id: userData.id,
        category: category.id
      });
      
      if (transactions.length > 0) {
        setAlertConfig({
          open: true,
          title: "Não é possível excluir",
          description: `A categoria "${category.name}" não pode ser excluída pois existem ${transactions.length} transações associadas a ela. Altere as transações para outra categoria primeiro.`,
          type: "error"
        });
        return;
      }
      
      // Se não houver transações, mostrar confirmação
      setAlertConfig({
        open: true,
        title: "Confirmar exclusão",
        description: `Tem certeza que deseja excluir a categoria "${category.name}"?`,
        type: "error",
        showCancel: true,
        onConfirm: async () => {
          await Category.delete(category.id);
          fetchData();
        }
      });
    } catch (error) {
      console.error("Error deleting category:", error);
      setAlertConfig({
        open: true,
        title: "Erro",
        description: "Ocorreu um erro ao tentar excluir a categoria.",
        type: "error"
      });
    }
  };

  const handleEditCategory = (category) => {
    setCurrentCategory(category);
    setCategoryDialogOpen(true);
  };

  const handleSaveCategory = (categoryData) => {
    if (currentCategory) {
      handleUpdateCategory(categoryData);
    } else {
      handleCreateCategory(categoryData);
    }
  };

  return (
    <>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
          <p className="text-muted-foreground">
            Gerencie suas preferências e dados
          </p>
        </div>

        <Tabs defaultValue="personal" className="space-y-4">
          <TabsList>
            <TabsTrigger value="personal">Perfil</TabsTrigger>
            <TabsTrigger value="preferences">Preferências</TabsTrigger>
            <TabsTrigger value="categories">Categorias</TabsTrigger>
            <TabsTrigger value="data">Dados</TabsTrigger>
          </TabsList>
          
          {/* Personal Tab */}
          <TabsContent value="personal" className="space-y-4">
            <ProfileSection userData={userData} setUserData={setUserData} loading={loading} />

            <Card>
              <CardHeader>
                <CardTitle>Estatísticas da Conta</CardTitle>
                <CardDescription>
                  Resumo dos seus dados na plataforma
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {loading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Contas Registradas:</p>
                      <p className="font-medium text-lg">{stats.totalAccounts}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Categorias Criadas:</p>
                      <p className="font-medium text-lg">{stats.totalCategories}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Total de Transações:</p>
                      <p className="font-medium text-lg">{stats.totalTransactions}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Última Atividade:</p>
                      <p className="font-medium text-lg">
                        {stats.lastActivity ? 
                          format(new Date(stats.lastActivity), "PPP", { locale: ptBR }) : 
                          "Nenhuma atividade"}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Aparência</CardTitle>
                <CardDescription>
                  Personalize a aparência da aplicação
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {darkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                    <Label htmlFor="dark-mode" className="cursor-pointer">Modo Escuro</Label>
                  </div>
                  <Switch
                    id="dark-mode"
                    checked={darkMode}
                    onCheckedChange={handleToggleDarkMode}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Configurações Regionais</CardTitle>
                <CardDescription>
                  Defina como números e datas são exibidos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="currency">Moeda</Label>
                    <select
                      id="currency"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full rounded-md border border-input px-3 py-2 bg-background text-sm"
                    >
                      <option value="BRL">Real Brasileiro (R$)</option>
                      <option value="USD">Dólar Americano ($)</option>
                      <option value="EUR">Euro (€)</option>
                      <option value="GBP">Libra Esterlina (£)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date-format">Formato de Data</Label>
                    <select
                      id="date-format"
                      value={dateFormat}
                      onChange={(e) => setDateFormat(e.target.value)}
                      className="w-full rounded-md border border-input px-3 py-2 bg-background text-sm"
                    >
                      <option value="dd/MM/yyyy">DD/MM/AAAA</option>
                      <option value="MM/dd/yyyy">MM/DD/AAAA</option>
                      <option value="yyyy-MM-dd">AAAA-MM-DD</option>
                    </select>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={savePreferences}>Salvar Preferências</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Gerenciar Categorias</h3>
              <Button 
                onClick={() => {
                  setCurrentCategory(null);
                  setCategoryDialogOpen(true);
                }}
                className="bg-primary"
              >
                <Plus className="mr-2 h-4 w-4" />
                Nova Categoria
              </Button>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Orçamento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    // Loading state
                    Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell><Skeleton className="h-6 w-6 rounded-full" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : categories.length > 0 ? (
                    // Category rows
                    categories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell>
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: category.color || "#e5e7eb" }}
                          >
                            <Tag className="h-4 w-4 text-white" />
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell>
                          {category.type === "income" ? "Receita" : "Despesa"}
                        </TableCell>
                        <TableCell>
                          {category.budget ? new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(category.budget) : "-"}
                        </TableCell>
                        <TableCell>
                          {category.is_active ? (
                            <div className="flex items-center">
                              <CheckCircle className="h-4 w-4 text-emerald-600 mr-1" />
                              <span>Ativa</span>
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <XCircle className="h-4 w-4 text-rose-600 mr-1" />
                              <span>Inativa</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditCategory(category)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-rose-600"
                              onClick={() => handleDeleteCategory(category)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    // Empty state
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <Tags className="h-8 w-8 mb-2" />
                          <p>Nenhuma categoria encontrada</p>
                          <p className="text-sm">
                            Clique em 'Nova Categoria' para adicionar sua primeira categoria
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          
          {/* Data Tab */}
          <TabsContent value="data" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Exportar e Importar Dados</CardTitle>
                <CardDescription>
                  Faça backup dos seus dados ou importe de outro sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Exportar Dados</CardTitle>
                      <CardDescription>
                        Baixe seus dados para backup
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <p className="text-sm text-muted-foreground mb-4">
                        Exporte todas as suas transações, contas e categorias em formato CSV.
                      </p>
                      <div className="flex flex-col gap-2">
                        <Button variant="outline" className="w-full justify-start">
                          <Download className="mr-2 h-4 w-4" />
                          Exportar Transações
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                          <Download className="mr-2 h-4 w-4" />
                          Exportar Contas
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                          <Download className="mr-2 h-4 w-4" />
                          Exportar Categorias
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Importar Dados</CardTitle>
                      <CardDescription>
                        Importe dados de arquivos CSV
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <p className="text-sm text-muted-foreground mb-4">
                        Selecione um arquivo CSV para importar. O formato deve seguir o padrão do sistema.
                      </p>
                      <div className="flex flex-col gap-2">
                        <Button variant="outline" className="w-full justify-start">
                          <Upload className="mr-2 h-4 w-4" />
                          Importar Transações
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                          <Upload className="mr-2 h-4 w-4" />
                          Importar Contas
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                          <Upload className="mr-2 h-4 w-4" />
                          Importar Categorias
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <CategoryDialog
          open={categoryDialogOpen}
          onOpenChange={setCategoryDialogOpen}
          onSave={handleSaveCategory}
          category={currentCategory}
        />
      </div>
      
      <CustomAlert
        open={alertConfig.open}
        onOpenChange={(open) => setAlertConfig(prev => ({ ...prev, open }))}
        title={alertConfig.title}
        description={alertConfig.description}
        type={alertConfig.type}
        showCancel={alertConfig.showCancel}
        onConfirm={alertConfig.onConfirm}
      />
    </>
  );
}
