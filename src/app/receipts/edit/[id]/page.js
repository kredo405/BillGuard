
"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useParams } from "next/navigation";

export default function EditReceiptPage() {
  const [file, setFile] = useState(null);
  const [totalAmount, setTotalAmount] = useState("");
  const [date, setDate] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const router = useRouter();
  const { id } = useParams();

  useEffect(() => {
    if (id) {
      fetchReceipt();
    }
  }, [id]);

  async function fetchReceipt() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("receipts")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();
    if (error) {
      console.error("Error fetching receipt:", error);
    } else {
      setTotalAmount(data.total_amount);
      setDate(data.date);
      setCategory(data.category);
      setDescription(data.description);
      setFileUrl(data.file_url);
    }
  }

  async function handleFileChange(e) {
    setFile(e.target.files[0]);
  }

  async function updateReceipt() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let publicUrl = fileUrl;

    if (file) {
      const fileName = `${Date.now()}_${file.name}`;
      const { data: fileData, error: fileError } = await supabase.storage
        .from("receipts")
        .upload(fileName, file);

      if (fileError) {
        console.error("Error uploading file:", fileError);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("receipts")
        .getPublicUrl(fileName);

      publicUrl = urlData.publicUrl;
    }

    const { error: dbError } = await supabase
      .from("receipts")
      .update({
        file_url: publicUrl,
        total_amount: totalAmount,
        date: date,
        category: category,
        description: description,
      })
      .eq("id", id)
      .eq("user_id", user.id);

    if (dbError) {
      console.error("Error updating receipt:", dbError);
    } else {
      router.push("/receipts");
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Edit Receipt</h1>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Receipt File</label>
          <input
            type="file"
            className="mt-1 block w-full"
            onChange={handleFileChange}
          />
          {fileUrl && !file && (
            <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 mt-2 block">
              View Current Receipt
            </a>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Total Amount</label>
          <input
            type="number"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            value={totalAmount}
            onChange={(e) => setTotalAmount(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Date</label>
          <input
            type="date"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Category</label>
          <input
            type="text"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <input
            type="text"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded-md"
          onClick={updateReceipt}
        >
          Update Receipt
        </button>
      </div>
    </div>
  );
}
