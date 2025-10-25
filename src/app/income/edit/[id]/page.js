"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useParams } from "next/navigation";
import { CheckCircle, X, Loader2 } from "lucide-react";

export default function EditIncomePage() {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(""); // Используем category вместо source
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const router = useRouter();
  const { id } = useParams();

  const categories = [
    "Зарплата", "Фриланс", "Инвестиции", "Подарок", "Прочее"
  ];

  useEffect(() => {
    if (id) {
      fetchIncome();
    }
  }, [id]);

  async function fetchIncome() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        setLoading(false);
        router.push('/login'); // Перенаправить, если нет пользователя
        return;
    }

    const { data, error } = await supabase
      .from("income")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();
      
    if (error) {
      console.error("Error fetching income:", error);
      setErrorMsg("Запись не найдена или нет доступа.");
    } else {
      setAmount(parseFloat(data.amount).toFixed(2));
      setDescription(data.description);
      // Устанавливаем category. Если в БД хранится source, используйте setSource(data.source)
      setCategory(data.category || data.source || ""); 
      setDate(data.date);
    }
    setLoading(false);
  }

  async function updateIncome() {
    setErrorMsg("");
    
    // Валидация
    if (!amount || parseFloat(amount) <= 0 || !description || !date) {
        setErrorMsg("Пожалуйста, заполните все обязательные поля (Сумма, Описание, Дата) и убедитесь, что Сумма > 0.");
        return;
    }

    setIsSubmitting(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        setIsSubmitting(false);
        return;
    }

    const incomeAmount = parseFloat(amount);
    
    const { error } = await supabase
      .from("income")
      .update({ 
          amount: incomeAmount, 
          description: description.trim(), 
          date, 
          category: category || "Без категории" 
      }) // Используем category
      .eq("id", id)
      .eq("user_id", user.id);
      
    if (error) {
      console.error("Error updating income:", error);
      setErrorMsg(`Ошибка при обновлении: ${error.message}`);
    } else {
      router.push("/income");
    }
    setIsSubmitting(false);
  }

  if (loading) {
      return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-green-600" />
              <p className="ml-3 text-lg text-gray-600">Загрузка данных...</p>
          </div>
      );
  }
  
  // Если запись не найдена после загрузки
  if (!amount && !errorMsg) {
       return (
          <div className="min-h-screen bg-gray-50 flex items-start justify-center p-10">
              <p className="text-xl text-red-600 mt-10">Ошибка: запись о доходе не найдена.</p>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center p-6">
      <div className="w-full max-w-lg bg-white p-8 rounded-xl shadow-2xl border border-gray-100 mt-10">
        <header className="mb-6 flex justify-between items-center">
            <h1 className="text-3xl font-extrabold text-gray-800">
                Редактировать Доход
            </h1>
            <button
                onClick={() => router.push("/income")}
                className="text-gray-400 hover:text-gray-600 transition"
                aria-label="Отмена и закрытие"
            >
                <X className="w-6 h-6" />
            </button>
        </header>

        {/* Сообщение об ошибке */}
        {errorMsg && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center">
                <span className="font-medium mr-2">Ошибка!</span> {errorMsg}
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
              placeholder="Введите сумму"
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-green-500 focus:border-green-500 transition duration-150 sm:text-base"
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
              placeholder="Например, Зарплата за месяц"
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-green-500 focus:border-green-500 transition duration-150 sm:text-base"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          {/* Поле Категория (Source) */}
          <div>
            <label htmlFor="category" className="block text-sm font-semibold text-gray-700 mb-1">
              Категория
            </label>
            <select
                id="category"
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-green-500 focus:border-green-500 transition duration-150 sm:text-base bg-white appearance-none"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
            >
                <option value="">Выберите категорию</option>
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
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-green-500 focus:border-green-500 transition duration-150 sm:text-base"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          
          {/* Кнопка Обновить */}
          <button
            className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-md text-white font-bold transition duration-300 ease-in-out ${
              isSubmitting
                ? "bg-green-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700 transform hover:scale-[1.01]"
            }`}
            onClick={updateIncome}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Обновление...
                </>
            ) : (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Обновить Доход
                </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}