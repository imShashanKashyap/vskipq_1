import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Table } from "@shared/schema";

export default function QRGenerator() {
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  
  // Fetch tables
  const { data: tables = [], isLoading } = useQuery<Table[]>({
    queryKey: ["/api/tables"],
  });
  
  // Generate QR code for selected table
  useEffect(() => {
    if (selectedTable) {
      fetch(`/api/tables/${selectedTable}/qrcode`)
        .then(res => res.json())
        .then(data => {
          setQrCodeUrl(data.qrCodeUrl);
        })
        .catch(err => {
          console.error("Failed to fetch QR code:", err);
        });
    } else {
      setQrCodeUrl(null);
    }
  }, [selectedTable]);
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-neutral-100 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-lg mx-auto bg-white rounded-lg shadow-sm p-6">
          <h1 className="font-['Poppins'] font-semibold text-2xl mb-6 text-center">Table QR Generator</h1>
          
          <div className="mb-6">
            <label className="block text-sm text-neutral-600 mb-2">Select Table</label>
            <select 
              value={selectedTable || ""}
              onChange={(e) => setSelectedTable(parseInt(e.target.value, 10))}
              className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#FF5722] focus:border-[#FF5722] outline-none transition"
            >
              <option value="">Select a table</option>
              {tables.map(table => (
                <option key={table.id} value={table.tableNumber}>
                  Table {table.tableNumber}
                </option>
              ))}
            </select>
          </div>
          
          {qrCodeUrl && (
            <div className="text-center">
              <div className="mb-4">
                <h2 className="font-medium text-lg mb-2">Table {selectedTable} QR Code</h2>
                <p className="text-sm text-neutral-500 mb-4">Scan this code to place an order at Table {selectedTable}</p>
                
                {/* We're using a client-side QR code generator */}
                <div className="bg-white p-4 rounded-lg inline-block">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrCodeUrl)}&size=200x200`}
                    alt={`QR Code for Table ${selectedTable}`}
                    className="mx-auto"
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <p className="text-sm text-neutral-600 mb-2">QR Code URL:</p>
                <div className="bg-neutral-100 p-2 rounded text-sm text-neutral-800 break-all">
                  {qrCodeUrl}
                </div>
              </div>
              
              <button
                onClick={() => window.print()}
                className="mt-6 py-2 px-4 bg-[#FF5722] text-white rounded-lg inline-flex items-center">
                <i className="ri-printer-line mr-2"></i> Print QR Code
              </button>
            </div>
          )}
          
          {!qrCodeUrl && selectedTable && (
            <div className="text-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF5722] mx-auto"></div>
              <p className="mt-4 text-neutral-600">Generating QR code...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
