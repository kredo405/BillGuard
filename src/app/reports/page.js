'use client'
import { useEffect, useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { TrendingUp, TrendingDown, Wallet, BarChart2, Loader2, DollarSign } from 'lucide-react';

import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28DFF', '#FF6666'];


// Вспомогательный компонент для карточек с метриками
const MetricCard = ({ title, value, icon: Icon, colorClass, bgColorClass }) => (
    <div className={`p-5 rounded-xl shadow-lg flex items-center space-x-4 ${bgColorClass} border-l-4 ${colorClass}`}>
        <div className={`p-3 rounded-full ${bgColorClass} bg-opacity-70 text-white ${colorClass.replace('text-', 'bg-')}`}>
            <Icon className="w-6 h-6" />
        </div>
        <div>
            <h2 className="text-sm font-medium text-gray-500">{title}</h2>
            <p className="text-3xl font-extrabold text-gray-900 mt-1">{value}</p>
        </div>
    </div>
);

// Основной компонент отчетов
export default function ReportsPage() {
  const [user, setUser] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [income, setIncome] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUserAndData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUser(user);

          // Fetch expenses (Mocked)
          const { data: expensesData } = await supabase
            .from('expenses')
            .select('*')
            .eq('user_id', user.id)
            .order('date', { ascending: false });
          setExpenses(expensesData || []);

          // Fetch income (Mocked)
          const { data: incomeData } = await supabase
            .from('income')
            .select('*')
            .eq('user_id', user.id)
            .order('date', { ascending: false });
          setIncome(incomeData || []);
        } else {
          // router.push('/login'); // Mocked push
        }
      } catch (error) {
          console.error('Error during data fetch (Mocked):', error);
      } finally {
          setIsLoading(false);
      }
    };
    fetchUserAndData();
  }, [router]);

  // Мемоизация расчетов для оптимизации
  const { totalExpenses, totalIncome, balance, pieChartData, sortedIncomeByMonth } = useMemo(() => {
    const totalExpenses = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
    const totalIncome = income.reduce((sum, item) => sum + parseFloat(item.amount), 0);
    const balance = totalIncome - totalExpenses;

    // Group expenses by category for Pie Chart
    const expensesByCategory = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + parseFloat(expense.amount);
      return acc;
    }, {});
    const pieChartData = Object.keys(expensesByCategory).map((category) => ({
      name: category,
      value: expensesByCategory[category],
    }));

    // Prepare income data for Line Chart (monthly)
    const incomeByMonth = income.reduce((acc, item) => {
      // Использование 'en-US' для правильного парсинга Date в заглушке sort
      const month = new Date(item.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      acc[month] = (acc[month] || 0) + parseFloat(item.amount);
      return acc;
    }, {});
    
    // Sort data by month for line chart
    const sortedIncomeByMonth = Object.keys(incomeByMonth)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
      .map(month => ({ name: month, income: incomeByMonth[month] }));

    return { totalExpenses, totalIncome, balance, pieChartData, sortedIncomeByMonth };
  }, [expenses, income]);


  if (isLoading) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <Loader2 className="w-8 h-8 text-teal-500 animate-spin mr-2" />
            <p className="text-lg text-teal-600">Загрузка данных отчетов...</p>
        </div>
    );
  }

  // Форматирование чисел для отображения
  const formatCurrency = (value) => `$${value.toFixed(2)}`;

  return (
    <div className="flex flex-col items-center min-h-screen py-8 bg-gray-50 p-4 sm:p-6">
      <div className="w-full max-w-6xl p-6 bg-white rounded-3xl shadow-2xl border-t-8 border-teal-500">
        <h1 className="text-3xl font-extrabold text-gray-900 text-center border-b pb-4 mb-8">
          Финансовые Отчеты и Аналитика
        </h1>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <MetricCard 
            title="Общий Доход"
            value={formatCurrency(totalIncome)}
            icon={TrendingUp}
            colorClass="text-green-600"
            bgColorClass="bg-green-50"
          />
          <MetricCard 
            title="Общие Расходы"
            value={formatCurrency(totalExpenses)}
            icon={TrendingDown}
            colorClass="text-red-600"
            bgColorClass="bg-red-50"
          />
          <MetricCard 
            title="Баланс"
            value={formatCurrency(balance)}
            icon={Wallet}
            colorClass={balance >= 0 ? "text-teal-600" : "text-red-600"}
            bgColorClass={balance >= 0 ? "bg-teal-50" : "bg-red-50"}
          />
        </div>
        
        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Expenses by Category - Pie Chart */}
          <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100">
            <h2 className="text-xl font-bold text-gray-700 mb-4 flex items-center">
                <BarChart2 className="w-5 h-5 mr-2 text-teal-500" />
                Расходы по Категориям
            </h2>
            {pieChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    dataKey="value"
                    // Отображение имени категории и процента в подписи
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => formatCurrency(value)}
                    labelFormatter={(label) => `Категория: ${label}`}
                  />
                  <Legend layout="vertical" verticalAlign="middle" align="right" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-500 p-8">Нет данных о расходах для отображения круговой диаграммы.</p>
            )}
          </div>

          {/* Income Over Time - Line Chart */}
          <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100">
            <h2 className="text-xl font-bold text-gray-700 mb-4 flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-teal-500" />
                Доход за Период
            </h2>
            {sortedIncomeByMonth.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={sortedIncomeByMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0f2f1" />
                  <XAxis dataKey="name" stroke="#374151" />
                  <YAxis stroke="#374151" tickFormatter={formatCurrency} />
                  <Tooltip 
                    formatter={(value) => formatCurrency(value)}
                    labelFormatter={(label) => `Месяц: ${label}`}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="income" 
                    name="Доход"
                    stroke="#047878" // Темно-бирюзовый
                    strokeWidth={2}
                    activeDot={{ r: 6, fill: '#047878', stroke: '#fff', strokeWidth: 2 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-500 p-8">Нет данных о доходах для отображения линейного графика.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
