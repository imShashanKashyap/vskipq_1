import { useState, useEffect } from "react";
import { Table as TableIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TableNumberDialogProps {
  isOpen: boolean;
  onClose: (tableNumber?: number) => void;
  defaultTableNumber?: number;
}

export default function TableNumberDialog({ 
  isOpen, 
  onClose, 
  defaultTableNumber = 1 
}: TableNumberDialogProps) {
  const [tableNumber, setTableNumber] = useState<string>(defaultTableNumber.toString());
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      setTableNumber(defaultTableNumber.toString());
      setError("");
    }
  }, [isOpen, defaultTableNumber]);

  const handleSubmit = () => {
    const parsedNumber = parseInt(tableNumber, 10);
    
    if (isNaN(parsedNumber) || parsedNumber < 1) {
      setError("Please enter a valid table number (1 or higher)");
      return;
    }
    
    // Save to localStorage for persistence
    localStorage.setItem("tableNumber", parsedNumber.toString());
    
    // Return the table number to the parent component
    onClose(parsedNumber);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <TableIcon className="h-5 w-5 text-[#FF5722]" />
            Enter Your Table Number
          </DialogTitle>
          <DialogDescription>
            Please enter the table number where you are sitting.
            This helps us deliver your order to the right table.
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="tableNumber" className="block text-sm font-medium text-gray-700 mb-1">
              Table Number
            </label>
            <Input
              id="tableNumber"
              type="number"
              min="1"
              value={tableNumber}
              onChange={(e) => {
                setTableNumber(e.target.value);
                setError("");
              }}
              className="w-full p-2.5 text-lg font-medium"
              placeholder="Enter table number"
              autoFocus
            />
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
          </div>
          
          <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
            <p className="text-sm text-amber-800">
              <span className="font-medium">Your table number</span> should be visible
              on your table, or was provided in the QR code you scanned.
            </p>
          </div>
        </div>
        
        <DialogFooter className="mt-4">
          <Button 
            onClick={handleSubmit} 
            className="w-full bg-gradient-to-r from-[#FF5722] to-[#FF7043] hover:from-[#E64A19] hover:to-[#FF5722] text-white"
          >
            Confirm Table Number
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}