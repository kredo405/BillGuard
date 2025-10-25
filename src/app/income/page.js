"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { PlusCircle, Edit, Trash2, DollarSign, TrendingUp, TrendingDown } from "lucide-react";

export default function IncomePage() {
  const [income, setIncome] = useState([]);
  const [loading, setLoading] = useState(true);

  // Расчет статистики
  const totalIncome = income.reduce((sum, item) => sum + parseFloat(item.amount), 0).toFixed(2);
  const totalItems = income.length;
  // Имитация данных для тренда (можно заменить реальной логикой)
  const isTrendPositive = income.length > 5; 
  const trendPercentage = isTrendPositive ? "7.8%" : "1.5%";

  useEffect(() => {
    fetchIncome();
  }, []);

  async function fetchIncome() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
        setLoading(false);
        // Можно добавить перенаправление на страницу логина
        return; 
    }
    
    // Сортировка по дате для лучшего отображения
    const { data, error } = await supabase
        .from("income")
        .select("*")
        .eq("user_id", user.id)
        .order('date', { ascending: false }); 
        
    if (error) {
      console.error("Error fetching income:", error);
    } else {
      // Преобразование даты и суммы для удобного отображения
      const formattedData = data.map(item => ({
        ...item,
        date: new Date(item.date).toLocaleDateString('ru-RU', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        }),
        amount: parseFloat(item.amount).toFixed(2),
      }));
      setIncome(formattedData);
    }
    setLoading(false);
  }

  async function deleteIncome(id) {
    if (!confirm("Вы уверены, что хотите удалить эту запись о доходе?")) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("income").delete().eq("id", id).eq("user_id", user.id);
    if (error) {
      console.error("Error deleting income:", error);
    } else {
      fetchIncome();
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
        <p className="text-3xl font-extrabold text-gray-900">${value}</p>
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
          Учет Доходов
        </h1>
        <button
          className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 sm:px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-[1.01] flex items-center text-sm"
          onClick={() => (window.location.href = "/income/add")}
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          Добавить Доход
        </button>
      </header>

      {/* Секция Статистики (Карточки) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Общая Сумма"
          value={totalIncome}
          icon={DollarSign}
          iconBgColor="bg-green-500"
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
                {income.length === 0 ? (
                    <tr>
                        <td colSpan="5" className="py-8 text-center text-gray-500 italic">
                            Нет добавленных записей о доходах.
                        </td>
                    </tr>
                ) : (
                    income.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50 transition duration-150">
                            <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-700">
                                {item.date}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-700 font-medium">
                                {item.description}
                            </td>
                            {/* Выделяем сумму зеленым цветом для акцента на доходе */}
                            <td className={`py-3 px-4 whitespace-nowrap text-sm font-bold text-green-600`}>
                                +${item.amount}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                                <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-emerald-100 text-emerald-800">
                                    {item.category || "Без категории"}
                                </span>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap text-sm font-medium">
                                <button
                                    className="text-green-600 hover:text-green-900 mr-3 transition duration-150"
                                    onClick={() => (window.location.href = `/income/edit/${item.id}`)}
                                    title="Редактировать"
                                >
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button
                                    className="text-red-600 hover:text-red-900 transition duration-150"
                                    onClick={() => deleteIncome(item.id)}
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