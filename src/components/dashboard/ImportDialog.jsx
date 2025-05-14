import React, { useState } from "react";
import { Transaction } from "@/api/entities";
import { User } from "@/api/entities";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, AlertCircle } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ImportDialog({ open, onOpenChange }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const onDrop = async (acceptedFiles) => {
    try {
      setUploading(true);
      setError(null);

      const file = acceptedFiles[0];
      if (!file) return;

      const user = await User.me();
      
      // Read file content
      const text = await file.text();
      const rows = text.split('\n');
      
      // Parse CSV headers
      const headers = rows[0].split(',');
      
      // Parse transactions
      const transactions = rows.slice(1).map(row => {
        const values = row.split(',');
        return headers.reduce((obj, header, index) => {
          obj[header.trim()] = values[index]?.trim();
          return obj;
        }, {});
      });

      // Validate and create transactions
      for (const transaction of transactions) {
        if (!transaction.description || !transaction.amount || !transaction.date) continue;

        await Transaction.create({
          description: transaction.description,
          amount: parseFloat(transaction.amount),
          type: transaction.type || 'expense',
          category: transaction.category,
          account_id: transaction.account_id,
          date: transaction.date,
          notes: transaction.notes,
          user_id: user.id
        });
      }

      onOpenChange(false);
    } catch (error) {
      console.error("Error importing transactions:", error);
      setError("Erro ao importar transações. Verifique o formato do arquivo.");
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv']
    },
    maxFiles: 1
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Importar Transações</DialogTitle>
        </DialogHeader>

        <div className="py-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}
          >
            <input {...getInputProps()} />
            <Upload className="w-8 h-8 mx-auto mb-4 text-muted-foreground" />
            {isDragActive ? (
              <p>Solte o arquivo aqui...</p>
            ) : (
              <div>
                <p className="text-muted-foreground">
                  Arraste e solte um arquivo CSV aqui, ou clique para selecionar
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Formato: description, amount, type, category, account_id, date, notes
                </p>
              </div>
            )}
          </div>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={uploading}
          >
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}