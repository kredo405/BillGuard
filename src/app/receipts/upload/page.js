"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function UploadReceiptPage() {
  const [file, setFile] = useState(null);
  const [totalAmount, setTotalAmount] = useState("");
  const [date, setDate] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const router = useRouter();

  async function handleFileChange(e) {
    setFile(e.target.files[0]);
  }

  async function uploadReceipt() {
    if (!file) {
      alert("Please select a file to upload.");
      return;
    }

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

    const publicUrl = urlData.publicUrl;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        console.error("User not logged in");
        return;
    }

    const { error: dbError } = await supabase.from("receipts").insert([
      {
        file_url: publicUrl,
        total_amount: totalAmount,
        date: date,
        category: category,
        description: description,
        user_id: user.id,
      },
    ]);

    if (dbError) {
      console.error("Error saving receipt to database:", dbError);
    } else {
      router.push("/receipts");
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Upload Receipt</h1>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Receipt File</label>
          <input
            type="file"
            className="mt-1 block w-full"
            onChange={handleFileChange}
          />
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
          onClick={uploadReceipt}
        >
          Upload Receipt
        </button>
      </div>
    </div>
  );
}