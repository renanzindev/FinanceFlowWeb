import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Account } from "@/api/entities";
import { Category } from "@/api/entities";
import { GlobalCategory } from "@/api/entities";
import { GlobalAccount } from "@/api/entities";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function InitialSetupDialog({ open, onOpenChange }) {
  const [loading, setLoading] = useState(true);
  const [globalCategories, setGlobalCategories] = useState([]);
  const [globalAccounts, setGlobalAccounts] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);
        
        const categories = await GlobalCategory.list();
        const accounts = await GlobalAccount.list();
        
        setGlobalCategories(categories);
        setGlobalAccounts(accounts);
        
        // Pre-select all by default
        setSelectedCategories(categories.map(cat => cat.id));
        setSelectedAccounts(accounts.map(acc => acc.id));
        
      } catch (error) {
        console.error("Error fetching data:", error);
      }
      setLoading(false);
    };

    if (open) {
      fetchData();
    }
  }, [open]);

  const handleSave = async () => {
    try {
      if (!currentUser) return;

      // Create selected categories
      const categoriesToCreate = globalCategories
        .filter(cat => selectedCategories.includes(cat.id))
        .map(cat => ({
          name: cat.name,
          type: cat.type,
          color: cat.color,
          icon: cat.icon,
          user_id: currentUser.id
        }));

      // Create selected accounts
      const accountsToCreate = globalAccounts
        .filter(acc => selectedAccounts.includes(acc.id))
        .map(acc => ({
          name: acc.name,
          type: acc.type,
          color: acc.color,
          icon: acc.icon,
          balance: 0,
          user_id: currentUser.id
        }));

      // Bulk create categories and accounts
      await Promise.all([
        ...categoriesToCreate.map(cat => Category.create(cat)),
        ...accountsToCreate.map(acc => Account.create(acc))
      ]);

      onOpenChange(false);
    } catch (error) {
      console.error("Error creating initial data:", error);
      alert("Erro ao criar dados iniciais. Por favor, tente novamente.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Configuração Inicial</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-6">Carregando...</div>
        ) : (
          <div className="py-6">
            <div className="space-y-6">
              <div>
                <h3 className="font-medium mb-3">Categorias Padrão</h3>
                <ScrollArea className="h-[200px] rounded-md border p-4">
                  <div className="space-y-4">
                    {globalCategories.map((category) => (
                      <div key={category.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`category-${category.id}`}
                          checked={selectedCategories.includes(category.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedCategories([...selectedCategories, category.id]);
                            } else {
                              setSelectedCategories(selectedCategories.filter(id => id !== category.id));
                            }
                          }}
                        />
                        <label
                          htmlFor={`category-${category.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {category.name} ({category.type === 'income' ? 'Receita' : 'Despesa'})
                        </label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              <div>
                <h3 className="font-medium mb-3">Contas Padrão</h3>
                <ScrollArea className="h-[200px] rounded-md border p-4">
                  <div className="space-y-4">
                    {globalAccounts.map((account) => (
                      <div key={account.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`account-${account.id}`}
                          checked={selectedAccounts.includes(account.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedAccounts([...selectedAccounts, account.id]);
                            } else {
                              setSelectedAccounts(selectedAccounts.filter(id => id !== account.id));
                            }
                          }}
                        />
                        <label
                          htmlFor={`account-${account.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {account.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button onClick={handleSave} className="bg-primary">
            Criar Dados Iniciais
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}