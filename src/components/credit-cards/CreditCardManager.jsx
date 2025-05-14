import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, CreditCard as CreditCardIcon } from "lucide-react";
import CreditCardList from "./CreditCardList";
import CreditCardBills from "./CreditCardBills";
import CreditCardDialog from "./CreditCardDialog";
import { User } from "@/api/entities";
import { Account } from "@/api/entities";
import { Transaction } from "@/api/entities";

export default function CreditCardManager() {
  const [loading, setLoading] = useState(true);
  const [creditCards, setCreditCards] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentCard, setCurrentCard] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const user = await User.me();
      setCurrentUser(user);

      // Buscar todos os cartões de crédito do usuário
      const cardsData = await Account.filter({ 
        user_id: user.id,
        type: "credit_card"
      });
      
      // Buscar todas as transações para os cartões
      const cardIds = cardsData.map(card => card.id);
      
      if (cardIds.length > 0) {
        const transactionsData = await Transaction.filter({
          user_id: user.id,
          account_id: { $in: cardIds }
        });
        setTransactions(transactionsData);
      }
      
      setCreditCards(cardsData);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    }
    setLoading(false);
  };

  const handleAddCard = () => {
    setCurrentCard(null);
    setDialogOpen(true);
  };

  const handleEditCard = (card) => {
    setCurrentCard(card);
    setDialogOpen(true);
  };

  const handleSaveCard = async () => {
    await fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cartões de Crédito</h1>
          <p className="text-muted-foreground">
            Gerencie seus cartões de crédito e faturas
          </p>
        </div>
        <Button 
          onClick={handleAddCard}
          className="bg-primary"
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Cartão
        </Button>
      </div>

      <Tabs defaultValue="cards" className="space-y-4">
        <TabsList>
          <TabsTrigger value="cards">Meus Cartões</TabsTrigger>
          <TabsTrigger value="bills">Faturas</TabsTrigger>
        </TabsList>
        
        <TabsContent value="cards" className="space-y-4">
          <CreditCardList 
            cards={creditCards} 
            loading={loading} 
            onEdit={handleEditCard} 
            onUpdate={fetchData}
          />
        </TabsContent>
        
        <TabsContent value="bills" className="space-y-4">
          <CreditCardBills 
            cards={creditCards}
            onUpdate={fetchData}
          />
        </TabsContent>
      </Tabs>
      
      <CreditCardDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        card={currentCard}
        onSave={handleSaveCard}
        currentUser={currentUser}
      />
    </div>
  );
}