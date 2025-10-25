"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { PlusCircle, X } from "lucide-react";

export default function AddExpensePage() {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  // Устанавливаем текущую дату по умолчанию
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const router = useRouter();

  const categories = [
    "Еда", "Транспорт", "Развлечения", "Жилье", "Счета", "Прочее"
  ];

  async function addExpense() {
    setErrorMsg("");
    
    // Простая валидация
    if (!amount || amount <= 0 || !description || !date) {
        setErrorMsg("Пожалуйста, заполните все обязательные поля (Сумма, Описание, Дата) и убедитесь, что Сумма > 0.");
        return;
    }

    setIsSubmitting(true);
    
    // Преобразование суммы в число
    const expenseAmount = parseFloat(amount);
    
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        setErrorMsg("Пожалуйста, войдите в систему, чтобы добавить расход.");
        setIsSubmitting(false);
        return;
    }

    const { error } = await supabase
      .from("expenses")
      .insert([{ 
          amount: expenseAmount, 
          description: description.trim(), 
          category: category || "Без категории", 
          date,
          user_id: user.id
      }]);
      
    if (error) {
      console.error("Error adding expense:", error);
      setErrorMsg(`Ошибка при добавлении: ${error.message}`);
    } else {
      router.push("/expenses");
    }
    setIsSubmitting(false);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center p-6">
      <div className="w-full max-w-lg bg-white p-8 rounded-xl shadow-2xl border border-gray-100 mt-10">
        <header className="mb-6 flex justify-between items-center">
            <h1 className="text-3xl font-extrabold text-gray-800">
                Новый Расход
            </h1>
            <button
                onClick={() => router.push("/expenses")}
                className="text-gray-400 hover:text-gray-600 transition"
                aria-label="Отмена и закрытие"
            >
                <X className="w-6 h-6" />
            </button>
        </header>

        {/* Сообщение об ошибке */}
        {errorMsg && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center">
                <span className="font-medium mr-2">Ой!</span> {errorMsg}
            </div>
        )}

        <div className="space-y-5">
          {/* Поле Сумма */}
          <div>
            <label htmlFor="amount" className="block text-sm font-semibold text-gray-700 mb-1">
              Сумма ($) <span className="text-red-500">*</span>
            </label>
            <input
              id="amount"
              type="number"
              placeholder="Введите сумму, например, 45.99"
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 sm:text-base"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              step="0.01"
              required
            />
          </div>

          {/* Поле Описание */}
          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-1">
              Описание <span className="text-red-500">*</span>
            </label>
            <input
              id="description"
              type="text"
              placeholder="Например, Обед в кафе"
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 sm:text-base"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          {/* Поле Категория (Select для UX) */}
          <div>
            <label htmlFor="category" className="block text-sm font-semibold text-gray-700 mb-1">
              Категория
            </label>
            <select
                id="category"
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 sm:text-base bg-white appearance-none"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
            >
                <option value="">Выберите категорию или введите свою</option>
                {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                ))}
            </select>
          </div>
          
          {/* Поле Дата */}
          <div>
            <label htmlFor="date" className="block text-sm font-semibold text-gray-700 mb-1">
              Дата <span className="text-red-500">*</span>
            </label>
            <input
              id="date"
              type="date"
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 sm:text-base"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          
          {/* Кнопка Добавить */}
          <button
            className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-md text-white font-bold transition duration-300 ease-in-out ${
              isSubmitting
                ? "bg-indigo-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700 transform hover:scale-[1.01]"
            }`}
            onClick={addExpense}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Сохранение...
                </>
            ) : (
                <>
                  <PlusCircle className="w-5 h-5 mr-2" />
                  Сохранить Расход
                </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}