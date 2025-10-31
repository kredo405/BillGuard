'use client';
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";

export default function EditReceiptPage({ params }) {
  const [receipt, setReceipt] = useState(null);
  const [totalAmount, setTotalAmount] = useState("");
  const [date, setDate] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [updating, setUpdating] = useState(false);
  const router = useRouter();
  const { id } = params;

  useEffect(() => {
    fetchReceipt();
  }, []);

  async function fetchReceipt() {
    const { data, error } = await supabase
      .from("receipts")
      .select("*")
      .eq("id", id)
      .single();
    if (error) {
      console.error("Error fetching receipt:", error);
    } else {
      setReceipt(data);
      setTotalAmount(data.total_amount);
      // Format date for input[type=date]
      const formattedDate = new Date(data.date).toISOString().split('T')[0];
      setDate(formattedDate);
      setCategory(data.category);
      setDescription(data.description);
    }
  }

  async function updateReceipt() {
    setUpdating(true);
    const { error } = await supabase
      .from("receipts")
      .update({
        total_amount: totalAmount,
        date: date,
        category: category,
        description: description,
      })
      .eq("id", id);

    if (error) {
      console.error("Error updating receipt:", error);
    } else {
      router.push("/receipts");
    }
    setUpdating(false);
  }

  if (!receipt) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-white p-8 rounded-2xl shadow-2xl border border-gray-100">
            <h1 className="text-3xl font-extrabold text-gray-800 mb-6 text-center">Редактировать Чек</h1>
            
            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Сумма</label>
                    <input
                        type="number"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        value={totalAmount}
                        onChange={(e) => setTotalAmount(e.target.value)}
                        placeholder="123.45"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Дата</label>
                    <input
                        type="date"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Категория</label>
                    <input
                        type="text"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        placeholder="Продукты, транспорт..."
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Описание</label>
                    <input
                        type="text"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Покупка в супермаркете"
                    />
                </div>

                <button
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
                    onClick={updateReceipt}
                    disabled={updating}
                >
                    {updating ? <Loader2 className="animate-spin h-5 w-5" /> : <><Save className="h-5 w-5 mr-2"/>Сохранить изменения</>}</button>
            </div>
        </div>
    </div>
  );
}