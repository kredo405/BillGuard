"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { PlusCircle, Edit, Trash2, TrendingUp, TrendingDown, DollarSign } from "lucide-react";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Имитация данных для карточек статистики
  const totalExpenses = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0).toFixed(2);
  const totalItems = expenses.length;
  // Условно-положительный/отрицательный тренд (для демонстрации)
  const isTrendPositive = expenses.length % 2 === 0; 
  const trendPercentage = isTrendPositive ? "5.2%" : "3.1%";

  useEffect(() => {
    fetchExpenses();
  }, []);

  async function fetchExpenses() {
    setLoading(true);
    // Сортировка по дате для лучшего отображения
    const { data, error } = await supabase.from("expenses").select("*").order('date', { ascending: false });
    if (error) {
      console.error("Error fetching expenses:", error);
    } else {
      // Преобразование даты для более удобного отображения
      const formattedData = data.map(item => ({
        ...item,
        date: new Date(item.date).toLocaleDateString('ru-RU', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        }),
        amount: parseFloat(item.amount).toFixed(2), // Убедимся, что сумма в формате с двумя знаками
      }));
      setExpenses(formattedData);
    }
    setLoading(false);
  }

  async function deleteExpense(id) {
    if (!confirm("Вы уверены, что хотите удалить эту запись?")) return;
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) {
      console.error("Error deleting expense:", error);
    } else {
      fetchExpenses();
    }
  }

  // --- Компонент Карточки Статистики ---
  const StatCard = ({ title, value, icon: Icon, trend, trendColor, iconBgColor }) => (
    <div className="bg-white p-5 rounded-xl shadow-lg transition duration-300 hover:shadow-xl border border-gray-100">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <div className={`p-2 rounded-full ${iconBgColor}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <div className="mt-1 flex items-baseline">
        {title === "Общая Сумма" ?
         <p className="text-3xl font-extrabold text-gray-900">BYN {value}</p> 
         : 
         <p className="text-3xl font-extrabold text-gray-900">{value}</p>}
        
        {trend && (
          <span className={`ml-2 text-sm font-semibold ${trendColor}`}>
            {isTrendPositive ? "↑" : "↓"} {trend}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6 sm:p-10">
      <header className="flex justify-between items-center mb-8 sm:mb-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-800 tracking-tight">
          Учет Расходов
        </h1>
        <button
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 sm:px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-[1.01] flex items-center text-sm"
          onClick={() => (window.location.href = "/expenses/add")}
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          Добавить Расход
        </button>
      </header>

      {/* Секция Статистики (Карточки) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Общая Сумма"
          value={totalExpenses}
          icon={DollarSign}
          iconBgColor="bg-indigo-500"
        />
        <StatCard
          title="Количество Записей"
          value={totalItems}
          icon={TrendingUp} // Иконка для демонстрации
          iconBgColor="bg-sky-500"
        />
        <StatCard
          title="Тренд за Месяц"
          value="—"
          icon={isTrendPositive ? TrendingUp : TrendingDown}
          trend={trendPercentage}
          trendColor={isTrendPositive ? "text-green-600" : "text-red-600"}
          iconBgColor={isTrendPositive ? "bg-green-500" : "bg-red-500"}
        />
      </div>

      <div className="bg-white p-6 rounded-xl shadow-2xl border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Список Операций</h2>
        
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <p className="text-lg text-gray-600">Загрузка данных...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {["Дата", "Описание", "Сумма", "Категория", "Действия"].map((header) => (
                    <th
                      key={header}
                      className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {expenses.length === 0 ? (
                    <tr>
                        <td colSpan="5" className="py-8 text-center text-gray-500 italic">
                            Нет добавленных записей о расходах.
                        </td>
                    </tr>
                ) : (
                    expenses.map((expense) => (
                        <tr key={expense.id} className="hover:bg-gray-50 transition duration-150">
                            <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-700">
                                {expense.date}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-700 font-medium">
                                {expense.description}
                            </td>
                            <td className={`py-3 px-4 whitespace-nowrap text-sm font-bold ${expense.amount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                BYN{expense.amount}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                                <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                    {expense.category || "Без категории"}
                                </span>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap text-sm font-medium">
                                <button
                                    className="text-indigo-600 hover:text-indigo-900 mr-3 transition duration-150"
                                    onClick={() => (window.location.href = `/expenses/edit/${expense.id}`)}
                                    title="Редактировать"
                                >
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button
                                    className="text-red-600 hover:text-red-900 transition duration-150"
                                    onClick={() => deleteExpense(expense.id)}
                                    title="Удалить"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </td>
                        </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}