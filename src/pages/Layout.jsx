

import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Home, PieChart, CreditCard, Calendar, Settings, 
  TrendingUp, Menu, X, Moon, Sun, DollarSign,
  Users, FileSpreadsheet, LogOut
} from "lucide-react";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { User } from "@/api/entities";
import { setAuthToken } from "@/api/client";

export default function Layout({ children, currentPageName }) {
  const [darkMode, setDarkMode] = useState(false);
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("user");
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await User.me();
        setUserName(userData.full_name || "");
        setUserRole(userData.role || "user");
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    
    fetchUserData();
    
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);
  
  const toggleTheme = () => {
    setDarkMode(!darkMode);
    if (darkMode) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setAuthToken(null);
    navigate('/login');
  };

  const menuItems = [
    { name: "Dashboard", icon: Home, link: createPageUrl("Dashboard") },
    { name: "Contas", icon: CreditCard, link: createPageUrl("Accounts") },
    { name: "Cartões", icon: CreditCard, link: createPageUrl("CreditCards") },
    { name: "Transações", icon: DollarSign, link: createPageUrl("Transactions") },
    { name: "Relatórios", icon: PieChart, link: createPageUrl("Reports") },
    { name: "Calendário", icon: Calendar, link: createPageUrl("Calendar") },
    { name: "Importar/Exportar", icon: FileSpreadsheet, link: createPageUrl("ImportExport") }
  ];
  
  // Adicionar opções de administrador se o usuário for admin
  if (userRole === "admin") {
    menuItems.push({ name: "Administração", icon: Settings, link: createPageUrl("Admin") });
    menuItems.push({ name: "Usuários", icon: Users, link: createPageUrl("Users") }); // Página de usuários para admin
  }
  
  // Adicionar configurações para todos os usuários
  menuItems.push({ name: "Configurações", icon: Settings, link: createPageUrl("Settings") });

  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? "dark" : ""}`}>
      <style jsx global>{`
        :root {
          --primary: 250 95% 59%;
          --primary-foreground: 0 0% 100%;
          
          --background: 0 0% 100%;
          --foreground: 222 47% 11%;
          
          --card: 0 0% 100%;
          --card-foreground: 222 47% 11%;
          
          --popover: 0 0% 100%;
          --popover-foreground: 222 47% 11%;
          
          --secondary: 210 40% 96%;
          --secondary-foreground: 222 47% 11%;
          
          --muted: 210 40% 96%;
          --muted-foreground: 215 16% 47%;
          
          --accent: 210 40% 96%;
          --accent-foreground: 222 47% 11%;
          
          --destructive: 0 84% 60%;
          --destructive-foreground: 210 40% 98%;
          
          --border: 214 32% 91%;
          --input: 214 32% 91%;
          --ring: 222 47% 11%;
          
          --radius: 0.5rem;
        }
        
        .dark {
          --background: 0 0% 6.3%;  /* #101010 - cor exata como solicitado */
          --foreground: 210 40% 98%;
          
          --card: 0 0% 8.3%;  /* #151515 */
          --card-foreground: 210 40% 98%;
          
          --popover: 0 0% 8.3%;
          --popover-foreground: 210 40% 98%;
          
          --primary: 250 95% 65%;
          --primary-foreground: 210 40% 98%;
          
          --secondary: 0 0% 12%;
          --secondary-foreground: 210 40% 98%;
          
          --muted: 0 0% 12%;
          --muted-foreground: 215 20% 75%;
          
          --accent: 0 0% 12%;
          --accent-foreground: 210 40% 98%;
          
          --destructive: 0 84% 60%;
          --destructive-foreground: 210 40% 98%;
          
          --border: 0 0% 15%;
          --input: 0 0% 15%;
          --ring: 212.7 26.8% 83.9%;
        }
        
        body {
          color: hsl(var(--foreground));
          background: hsl(var(--background));
          transition: background-color 0.3s ease;
        }

        /* Ajustes de contraste para modo escuro */
        .dark .text-muted-foreground {
          color: hsl(215 20% 75%);
        }

        .dark .border-border\/40 {
          border-color: hsl(0 0% 20% / 0.4);
        }
        
        /* Melhorar o estilo dos diálogos para scroll */
        .Dialog {
          max-height: 90vh;
          overflow: hidden;
        }

        /* Corrigir problema de leitura em textos */
        .text-white {
          color: #ffffff;
        }
      `}</style>

      {/* Desktop Navigation */}
      <div className="flex h-screen">
        <aside className="hidden lg:flex h-screen w-64 flex-col fixed inset-y-0 z-50 border-r border-border/40 bg-card">
          <div className="p-6">
            <div className="flex items-center gap-2 font-bold text-xl text-foreground">
              <DollarSign className="w-6 h-6 text-primary" />
              <span>Finance Flow</span>
            </div>
          </div>
          
          <div className="mt-2 px-3">
            <nav className="space-y-1">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.link;
                return (
                  <Link
                    key={item.name}
                    to={item.link}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                      isActive
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-secondary/80"
                    }`}
                  >
                    <item.icon className={`w-5 h-5 ${isActive ? "text-primary" : ""}`} />
                    <span>{item.name}</span>
                    {isActive && (
                      <div className="w-1 h-6 bg-primary absolute right-0 rounded-l-md" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
          
          <div className="mt-auto p-4 border-t border-border/40">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                  {userName.charAt(0) || "U"}
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground">{userName || "Usuário"}</div>
                  <div className="text-xs text-muted-foreground">
                    {userRole === "admin" ? "Administrador" : "Usuário"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className="rounded-full"
                >
                  {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  className="rounded-full text-red-500 hover:text-red-600 hover:bg-red-50"
                  title="Sair"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile Navigation */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border/40 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-xl text-foreground">
              <DollarSign className="w-6 h-6 text-primary" />
              <span>Finance Flow</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="rounded-full"
              >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
              
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64 p-0">
                  <div className="p-6 border-b border-border/40">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-xl text-foreground">
                        <DollarSign className="w-6 h-6 text-primary" />
                        <span>Finance Flow</span>
                      </div>
                      <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-full">
                          <X className="w-5 h-5" />
                        </Button>
                      </SheetTrigger>
                    </div>
                  </div>
                  
                  <nav className="p-4 space-y-1">
                    {menuItems.map((item) => {
                      const isActive = location.pathname === item.link;
                      return (
                        <Link
                          key={item.name}
                          to={item.link}
                          className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                            isActive
                              ? "bg-primary/10 text-primary font-medium"
                              : "text-muted-foreground hover:bg-secondary/80"
                          }`}
                        >
                          <item.icon className={`w-5 h-5 ${isActive ? "text-primary" : ""}`} />
                          <span>{item.name}</span>
                        </Link>
                      );
                    })}
                  </nav>
                  
                  <div className="mt-auto p-4 border-t border-border/40">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                          {userName.charAt(0) || "U"}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-foreground">{userName || "Usuário"}</div>
                          <div className="text-xs text-muted-foreground">
                            {userRole === "admin" ? "Administrador" : "Usuário"}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleLogout}
                        className="rounded-full text-red-500 hover:text-red-600 hover:bg-red-50"
                        title="Sair"
                      >
                        <LogOut className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 lg:ml-64">
          <div className="lg:p-0 pt-16">{children}</div>
        </main>
      </div>
    </div>
  );
}

