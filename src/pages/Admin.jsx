
import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Account } from "@/api/entities";
import { Category } from "@/api/entities";
import { Transaction } from "@/api/entities";
import { Shield, Users, UserCheck, Settings, DatabaseIcon, Wallet, Activity } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createPageUrl } from "@/utils";

export default function AdminPage() {
  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAccounts: 0,
    totalTransactions: 0,
    totalCategories: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const user = await User.me();
        setUserData(user);
        
        if (user.role === 'admin') { // Somente admin busca estatísticas
            const accounts = await Account.list(); // Idealmente, seria User.list() e outros para estatísticas globais
            const transactions = await Transaction.list();
            const categories = await Category.list();
            // const allUsers = await User.list(); // Para contagem de usuários
            
            setStats({
              totalUsers: 10, // Substituir por allUsers.length em um app real
              totalAccounts: accounts.length,
              totalTransactions: transactions.length,
              totalCategories: categories.length
            });
        }
        
      } catch (error) {
        console.error("Error loading admin data:", error);
      }
      setLoading(false);
    };
    
    fetchData();
  }, []);


  // Check if user has admin access
  if (userData && userData.role !== "admin") { // Apenas 'admin'
    return (
      <div className="p-6">
        <div className="max-w-md mx-auto text-center p-6 bg-destructive/10 rounded-lg">
          <Shield className="h-12 w-12 mx-auto text-destructive" />
          <h1 className="text-xl font-bold mt-4">Acesso Restrito</h1>
          <p className="mt-2 text-muted-foreground">
            Você não tem permissão para acessar esta área. Esta página está disponível apenas para administradores.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Painel Administrativo</h1>
        <p className="text-muted-foreground">
          Gerencie os aspectos do sistema como administrador
        </p>
      </div>
      
      {/* Admin Dashboard Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/90 to-blue-600">
          <CardHeader className="pb-2">
            <CardTitle className="text-md font-medium text-white opacity-90 flex items-center">
              <Users className="mr-2 h-4 w-4" />
              Total de Usuários
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {loading ? "..." : stats.totalUsers}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md font-medium text-muted-foreground flex items-center">
              <Wallet className="mr-2 h-4 w-4" />
              Contas Registradas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : stats.totalAccounts}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md font-medium text-muted-foreground flex items-center">
              <Activity className="mr-2 h-4 w-4" />
              Transações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : stats.totalTransactions}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md font-medium text-muted-foreground flex items-center">
              <DatabaseIcon className="mr-2 h-4 w-4" />
              Categorias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : stats.totalCategories}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid grid-cols-3 sm:w-[400px]">
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="system">Sistema</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestão de Usuários</CardTitle>
              <CardDescription>
                Visualize e gerencie usuários do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-md p-4 text-center">
                <UserCheck className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p>A gestão completa de usuários está disponível na página de Usuários.</p>
                {/* Verificação de superadmin removida, admin já tem acesso à página de Usuários */}
                <Button className="mt-2" onClick={() => window.location.href = createPageUrl("Users")}>
                  Gerenciar Usuários
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Sistema</CardTitle>
              <CardDescription>
                Gerencie configurações globais do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b pb-4">
                  <div>
                    <h3 className="font-medium">Manutenção do Sistema</h3>
                    <p className="text-sm text-muted-foreground">Coloque o sistema em modo de manutenção</p>
                  </div>
                  <Button variant="outline">Configurar</Button>
                </div>
                
                <div className="flex justify-between items-center border-b pb-4">
                  <div>
                    <h3 className="font-medium">Backup do Banco de Dados</h3>
                    <p className="text-sm text-muted-foreground">Crie um backup completo de todos os dados</p>
                  </div>
                  <Button variant="outline">Executar Backup</Button>
                </div>
                
                <div className="flex justify-between items-center pb-4">
                  <div>
                    <h3 className="font-medium">Configurações Globais</h3>
                    <p className="text-sm text-muted-foreground">Atualize configurações aplicáveis a todos os usuários</p>
                  </div>
                  <Button variant="outline">Gerenciar</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Logs do Sistema</CardTitle>
              <CardDescription>
                Visualize logs de atividade e erros
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-hidden">
                <div className="bg-muted p-2 text-xs font-mono text-muted-foreground">
                  <p>[{new Date().toISOString()}] Sistema inicializado</p>
                  <p>[{new Date().toISOString()}] Usuário admin conectado</p>
                  <p>[{new Date().toISOString()}] Backup automático executado</p>
                  <p>[{new Date().toISOString()}] Sincronização de dados concluída</p>
                  <p>[{new Date().toISOString()}] Verificação de segurança realizada</p>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button variant="outline">Ver Todos os Logs</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
