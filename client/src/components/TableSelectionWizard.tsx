import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Table } from '@shared/schema';
import { TableIcon, Check, ChevronLeft, ChevronRight, X, HelpCircle } from 'lucide-react';

interface TableSelectionWizardProps {
  isOpen: boolean;
  onClose: (selectedTableId?: number) => void;
  restaurantId: number;
  defaultTableNumber?: number;
}

export default function TableSelectionWizard({
  isOpen,
  onClose,
  restaurantId,
  defaultTableNumber,
}: TableSelectionWizardProps) {
  const [step, setStep] = useState(0);
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [selectedTableNumber, setSelectedTableNumber] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch tables for the restaurant
  useEffect(() => {
    if (isOpen && restaurantId) {
      setLoading(true);
      setError(null);
      
      apiRequest("GET", `/api/tables?restaurantId=${restaurantId}`)
        .then(res => res.json())
        .then(data => {
          setTables(data || []);
          setLoading(false);
          
          // If default table number is provided, try to select it
          if (defaultTableNumber && data.length > 0) {
            const defaultTable = data.find((table: Table) => table.tableNumber === defaultTableNumber);
            if (defaultTable) {
              setSelectedTableId(defaultTable.id);
              setSelectedTableNumber(defaultTable.tableNumber);
            }
          }
        })
        .catch(err => {
          console.error("Error fetching tables:", err);
          setError("Failed to load tables. Please try again.");
          setLoading(false);
        });
    }
  }, [isOpen, restaurantId, defaultTableNumber]);

  const handleTableSelect = (tableId: number, tableNumber: number) => {
    setSelectedTableId(tableId);
    setSelectedTableNumber(tableNumber);
  };

  const handleNext = () => {
    if (step < 2) {
      setStep(step + 1);
    } else {
      // On last step, confirm selection
      handleConfirm();
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    } else {
      // On first step, cancel
      handleCancel();
    }
  };

  const handleConfirm = () => {
    if (selectedTableId !== null) {
      toast({
        title: "Table Selected",
        description: `You've selected table #${selectedTableNumber}`,
      });
      onClose(selectedTableId);
    } else {
      toast({
        title: "No Table Selected",
        description: "Please select a table to continue",
        variant: "destructive"
      });
    }
  };

  const handleCancel = () => {
    onClose();
  };

  if (!isOpen) return null;

  const steps = [
    {
      title: "Welcome",
      description: "Let's find your table",
      content: (
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 rounded-full bg-orange-100 flex items-center justify-center">
              <TableIcon className="w-12 h-12 text-orange-500" />
            </div>
          </div>
          <h3 className="text-xl font-semibold mb-2">Welcome to Table Selection</h3>
          <p className="text-gray-600 mb-6">
            Please select the table you're currently sitting at. 
            This helps us deliver your order to the right place.
          </p>
          <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">
            <HelpCircle className="w-4 h-4 inline-block mr-1" />
            <span>You can find your table number displayed on your table or QR code.</span>
          </div>
        </div>
      )
    },
    {
      title: "Select Table",
      description: "Choose your table",
      content: (
        <div>
          <h3 className="text-xl font-semibold mb-4">Select Your Table</h3>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
          ) : error ? (
            <div className="text-center py-6">
              <div className="text-red-500 mb-2">{error}</div>
              <button 
                onClick={() => {
                  setLoading(true);
                  apiRequest("GET", `/api/tables?restaurantId=${restaurantId}`)
                    .then(res => res.json())
                    .then(data => {
                      setTables(data || []);
                      setLoading(false);
                      setError(null);
                    })
                    .catch(() => {
                      setError("Failed to load tables. Please try again.");
                      setLoading(false);
                    });
                }}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
              >
                Retry
              </button>
            </div>
          ) : tables.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              No tables available for this restaurant
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4">
              {tables.map((table: Table) => (
                <motion.button
                  key={table.id}
                  onClick={() => handleTableSelect(table.id, table.tableNumber)}
                  className={`relative p-4 rounded-lg border-2 transition duration-200 ${
                    selectedTableId === table.id 
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="text-lg font-bold">{table.tableNumber}</div>
                  <div className="text-sm text-gray-500">Table</div>
                  {selectedTableId === table.id && (
                    <div className="absolute -top-2 -right-2 bg-orange-500 text-white rounded-full p-1">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                </motion.button>
              ))}
            </div>
          )}
        </div>
      )
    },
    {
      title: "Confirm",
      description: "Verify your selection",
      content: (
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="w-10 h-10 text-green-500" />
            </div>
          </div>
          <h3 className="text-xl font-semibold mb-2">Confirm Your Table</h3>
          
          {selectedTableId === null ? (
            <div className="text-red-500 mb-4">
              No table selected. Please go back and select a table.
            </div>
          ) : (
            <>
              <div className="text-3xl font-bold text-gray-800 mb-4">
                Table #{selectedTableNumber}
              </div>
              <p className="text-gray-600 mb-6">
                You're confirming that you're currently seated at table #{selectedTableNumber}.
                Your order will be delivered to this table.
              </p>
            </>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden transition-opacity duration-300">
      {/* Backdrop */}
      <div 
        onClick={handleCancel} 
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity"
      ></div>
      
      {/* Dialog */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <motion.div 
          className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Table Selection</h2>
            <button 
              onClick={handleCancel}
              className="p-1 rounded-full hover:bg-gray-100 transition"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          
          {/* Progress indicators */}
          <div className="px-6 pt-4">
            <div className="flex items-center mb-6">
              {steps.map((s, i) => (
                <React.Fragment key={i}>
                  <div 
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      i === step 
                        ? 'bg-orange-500 text-white font-semibold'
                        : i < step 
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {i < step ? <Check className="w-4 h-4" /> : i + 1}
                  </div>
                  {i < steps.length - 1 && (
                    <div 
                      className={`flex-1 h-1 mx-2 ${
                        i < step ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    ></div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
          
          {/* Content */}
          <div className="px-6 pb-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {steps[step].content}
              </motion.div>
            </AnimatePresence>
          </div>
          
          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 flex justify-between">
            <button
              onClick={handleBack}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition flex items-center"
            >
              {step === 0 ? 'Cancel' : (
                <>
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back
                </>
              )}
            </button>
            
            <button
              onClick={handleNext}
              disabled={step === 1 && selectedTableId === null}
              className={`px-4 py-2 rounded-lg text-white flex items-center transition ${
                step === 1 && selectedTableId === null
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-orange-500 hover:bg-orange-600'
              }`}
            >
              {step === 2 ? 'Confirm' : (
                <>
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}