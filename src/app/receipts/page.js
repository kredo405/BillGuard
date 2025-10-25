
"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { PlusCircle, Edit, Trash2 } from "lucide-react";

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReceipts();
  }, []);

  async function fetchReceipts() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        setLoading(false);
        return;
    }
    const { data, error } = await supabase.from("receipts").select("*").eq("user_id", user.id);
    if (error) {
      console.error("Error fetching receipts:", error);
    } else {
      setReceipts(data);
    }
    setLoading(false);
  }

  async function deleteReceipt(id) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("receipts").delete().eq("id", id).eq("user_id", user.id);
    if (error) {
      console.error("Error deleting receipt:", error);
    } else {
      fetchReceipts();
    }
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Receipts</h1>
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded-md flex items-center"
          onClick={() => (window.location.href = "/receipts/upload")}
        >
          <PlusCircle className="mr-2" />
          Upload Receipt
        </button>
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b">Date</th>
                <th className="py-2 px-4 border-b">Description</th>
                <th className="py-2 px-4 border-b">Amount</th>
                <th className="py-2 px-4 border-b">Category</th>
                <th className="py-2 px-4 border-b">Receipt</th>
                <th className="py-2 px-4 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {receipts.map((receipt) => (
                <tr key={receipt.id}>
                  <td className="py-2 px-4 border-b">{receipt.date}</td>
                  <td className="py-2 px-4 border-b">{receipt.description}</td>
                  <td className="py-2 px-4 border-b">${receipt.total_amount}</td>
                  <td className="py-2 px-4 border-b">{receipt.category}</td>
                  <td className="py-2 px-4 border-b">
                    <a href={receipt.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-500">
                      View Receipt
                    </a>
                  </td>
                  <td className="py-2 px-4 border-b">
                    <button
                      className="text-blue-500 mr-2"
                      onClick={() => (window.location.href = `/receipts/edit/${receipt.id}`)}
                    >
                      <Edit />
                    </button>
                    <button
                      className="text-red-500"
                      onClick={() => deleteReceipt(receipt.id)}
                    >
                      <Trash2 />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
