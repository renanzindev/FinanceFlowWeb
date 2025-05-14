
import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { 
  UserPlus,
  Users,
  Search,
  Shield,
  User as UserIcon,
  ShieldAlert,
  MoreVertical,
  Edit,
  Trash2,
  UserX,
  UserCheck,
  CheckCircle
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import UserDialog from "../components/users/UserDialog";

export default function UsersPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  const sampleUsers = [
    { 
      id: "1", 
      full_name: "Admin User", 
      email: "admin@example.com", 
      role: "admin",
      created_date: "2023-01-15T10:30:00Z",
      status: "active"
    },
    { 
      id: "2", 
      full_name: "John Doe", 
      email: "john@example.com", 
      role: "user",
      created_date: "2023-02-20T14:15:00Z", 
      status: "active"
    },
    { 
      id: "3", 
      full_name: "Jane Smith", 
      email: "jane@example.com", 
      role: "user",
      created_date: "2023-03-05T09:45:00Z", 
      status: "active"
    },
    // Super Admin removido dos dados de exemplo
    { 
      id: "5", 
      full_name: "Inactive User", 
      email: "inactive@example.com", 
      role: "user",
      created_date: "2023-04-10T11:20:00Z", 
      status: "inactive"
    },
  ];

  useEffect(() => {
    const checkAccess = async () => {
      setLoading(true);
      try {
        const userData = await User.me();
        setCurrentUser(userData);
        
        // Simular busca de usuários (em um app real, seria uma API)
        // Se o usuário atual for admin, busca todos os usuários
        // Caso contrário (se for user), idealmente não deveria ter acesso ou veria uma lista limitada
        if (userData.role === 'admin') {
          // const fetchedUsers = await User.list(); // Em um cenário real
          // setUsers(fetchedUsers);
          setUsers(sampleUsers); // Usando dados de exemplo por enquanto
        } else {
          setUsers([]); // Usuários normais não veem a lista de todos os usuários
        }
        setLoading(false);
      } catch (error) {
        console.error("Erro ao verificar acesso ou buscar usuários:", error);
        setLoading(false);
      }
    };
    
    checkAccess();
  }, []);

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === "all") return matchesSearch;
    if (activeTab === "admins") return matchesSearch && user.role === "admin"; // Apenas 'admin'
    if (activeTab === "users") return matchesSearch && user.role === "user";
    if (activeTab === "inactive") return matchesSearch && user.status === "inactive";
    
    return matchesSearch;
  });

  const handleCreateUser = (userData) => {
    // In a real app, this would be an API call
    console.log("Creating user:", userData);
    setShowUserDialog(false);
    // Then refresh the user list
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setShowUserDialog(true);
  };

  const handleUpdateUser = (userData) => {
    // In a real app, this would be an API call
    console.log("Updating user:", userData);
    setShowUserDialog(false);
    setSelectedUser(null);
    // Then refresh the user list
  };

  const handleDeleteUser = (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      // In a real app, this would be an API call
      console.log("Deleting user:", userId);
      // Then refresh the user list
    }
  };

  // Se o usuário não for admin, mostrar acesso negado
  if (currentUser && currentUser.role !== "admin") {
    return (
      <div className="p-6">
        <div className="max-w-md mx-auto text-center p-6 bg-destructive/10 rounded-lg">
          <ShieldAlert className="h-12 w-12 mx-auto text-destructive" />
          <h1 className="text-xl font-bold mt-4">Acesso Restrito</h1>
          <p className="mt-2 text-muted-foreground">
            Você não tem permissão para acessar esta página. Esta funcionalidade é exclusiva para administradores.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gerenciamento de Usuários</h1>
          <p className="text-muted-foreground">
            Administre usuários e permissões do sistema
          </p>
        </div>
        <Button 
          onClick={() => {
            setSelectedUser(null);
            setShowUserDialog(true);
          }}
          className="bg-primary"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Novo Usuário
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar usuários..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="shrink-0">
          <TabsList>
            <TabsTrigger value="all" className="px-3">
              Todos
            </TabsTrigger>
            <TabsTrigger value="admins" className="px-3">
              Admins
            </TabsTrigger>
            <TabsTrigger value="users" className="px-3">
              Usuários
            </TabsTrigger>
            <TabsTrigger value="inactive" className="px-3">
              Inativos
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Lista de Usuários</CardTitle>
          <CardDescription>
            {filteredUsers.length} usuários encontrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div>
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-48 mt-1" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-24" />
                </div>
              ))}
            </div>
          ) : filteredUsers.length > 0 ? (
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 border">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {user.full_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium flex items-center">
                        {user.full_name}
                        {/* Badge de Superadmin removida */}
                        {user.role === "admin" && (
                          <Badge variant="default" className="ml-2 bg-blue-500">Admin</Badge>
                        )}
                        {user.status === "inactive" && (
                          <Badge variant="outline" className="ml-2">Inativo</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditUser(user)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      
                      {user.status === "active" ? (
                        <DropdownMenuItem>
                          <UserX className="mr-2 h-4 w-4" />
                          Desativar
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem>
                          <UserCheck className="mr-2 h-4 w-4" />
                          Ativar
                        </DropdownMenuItem>
                      )}
                      
                      <DropdownMenuSeparator />
                      
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Nenhum usuário encontrado</h3>
              <p className="text-muted-foreground mt-1">
                {searchQuery ? "Tente ajustar sua busca" : "Adicione seu primeiro usuário"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* User Dialog would be implemented as a separate component */}
      {showUserDialog && (
        <UserDialog
          open={showUserDialog}
          onOpenChange={setShowUserDialog}
          user={selectedUser}
          onSave={(data) => {
            if (selectedUser) {
              handleUpdateUser(data);
            } else {
              handleCreateUser(data);
            }
          }}
        />
      )}
    </div>
  );
}
