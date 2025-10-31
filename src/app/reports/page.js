'use client'
import { useEffect, useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingDown, BarChart2, Loader2, BrainCircuit, X as CloseIcon, Save } from 'lucide-react';

import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF1919', '#19FFD4', '#FF19B8', '#1976D2', '#FF5722'];

const AnalysisModal = ({ analysis, onClose, onSave, isSaving }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-8 relative">
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                <CloseIcon size={24} />
            </button>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">Анализ расходов</h2>
            <div className="prose max-w-full text-gray-900" dangerouslySetInnerHTML={{ __html: analysis.replace(/\n/g, '<br />') }} />
            <div className="text-right mt-6">
                <button onClick={onSave} disabled={isSaving} className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-[1.01] flex items-center disabled:bg-green-400 disabled:cursor-not-allowed">
                    {isSaving ? <><Loader2 className="animate-spin h-5 w-5 mr-3" />Сохранение...</> : <><Save className="w-5 h-5 mr-2"/>Сохранить отчет</>}</button>
            </div>
        </div>
    </div>
);

export default function ReportsPage() {
  const [user, setUser] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('month');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchUserAndData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUser(user);
          const { data: expensesData } = await supabase
            .from('expenses')
            .select('*')
            .eq('user_id', user.id)
            .order('date', { ascending: false });
          setExpenses(expensesData || []);
        } else {
          router.push('/login');
        }
      } catch (error) {
          console.error('Error during data fetch:', error);
      } finally {
          setIsLoading(false);
      }
    };
    fetchUserAndData();
  }, [router]);

  const filteredExpenses = useMemo(() => {
    const now = new Date();
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      if (timeRange === 'week') {
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        return expenseDate >= startOfWeek;
      }
      if (timeRange === 'month') {
        return expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear();
      }
      if (timeRange === 'year') {
        return expenseDate.getFullYear() === now.getFullYear();
      }
      return true; // 'all'
    });
  }, [expenses, timeRange]);

  const { totalExpenses, categoryData } = useMemo(() => {
    const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);

    const expensesByCategory = filteredExpenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + parseFloat(expense.amount);
      return acc;
    }, {});

    const sortedCategories = Object.entries(expensesByCategory)
      .sort(([, a], [, b]) => b - a);

    return { totalExpenses, categoryData: sortedCategories };
  }, [filteredExpenses]);

  const chartData = useMemo(() => {
    const top10 = categoryData.slice(0, 10);
    const other = categoryData.slice(10).reduce((sum, [, amount]) => sum + amount, 0);
    const data = top10.map(([name, value]) => ({ name, value }));
    if (other > 0) {
      data.push({ name: 'Другое', value: other });
    }
    return data;
  }, [categoryData]);

  const handleAnalyze = async () => {
    if (timeRange === 'year' || timeRange === 'all') {
      alert("Анализ доступен только за неделю или месяц. Пожалуйста, выберите соответствующий период.");
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/analyze-expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ expenses: filteredExpenses }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Ошибка сервера");
      }

      const data = await response.json();
      setAnalysisResult(data.analysis);
      setIsAnalysisModalOpen(true);
    } catch (error) {
      alert(error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveReport = async () => {
    if (!analysisResult) {
      alert("Нет данных для сохранения.");
      return;
    }

    setIsSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("Пожалуйста, войдите в систему, чтобы сохранить отчет.");
      setIsSaving(false);
      return;
    }

    const reportName = `Анализ за ${timeRange === 'week' ? 'неделю' : 'месяц'}: ${new Date().toLocaleDateString('ru-RU')}`;

    const { error } = await supabase.from('ai_reports').insert([
      { report_name: reportName, report_content: analysisResult, user_id: user.id },
    ]);

    if (error) {
      alert(`Ошибка при сохранении отчета: ${error.message}`);
    } else {
      alert("Отчет успешно сохранен!");
      setIsAnalysisModalOpen(false);
    }

    setIsSaving(false);
  };


  if (isLoading) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <Loader2 className="w-8 h-8 text-teal-500 animate-spin mr-2" />
            <p className="text-lg text-teal-600">Загрузка данных отчетов...</p>
        </div>
    );
  }

  const formatCurrency = (value) => `BYN${value.toFixed(2)}`;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      {isAnalysisModalOpen && <AnalysisModal analysis={analysisResult} onClose={() => setIsAnalysisModalOpen(false)} onSave={handleSaveReport} isSaving={isSaving} />} 
      <div className="w-full max-w-6xl mx-auto p-6 bg-white rounded-3xl shadow-2xl border-t-8 border-teal-500">
        <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center border-b pb-4 mb-8">
            <h1 className="text-3xl font-extrabold text-gray-900">Финансовые Отчеты</h1>
            <div className="flex flex-wrap items-center gap-2 p-1 rounded-lg bg-gray-100 mt-4 sm:mt-0">
                <button onClick={() => setTimeRange('week')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${timeRange === 'week' ? 'bg-white text-teal-600 shadow' : 'text-gray-600 hover:bg-gray-200'}`}>Неделя</button>
                <button onClick={() => setTimeRange('month')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${timeRange === 'month' ? 'bg-white text-teal-600 shadow' : 'text-gray-600 hover:bg-gray-200'}`}>Месяц</button>
                <button onClick={() => setTimeRange('year')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${timeRange === 'year' ? 'bg-white text-teal-600 shadow' : 'text-gray-600 hover:bg-gray-200'}`}>Год</button>
                <button onClick={() => setTimeRange('all')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${timeRange === 'all' ? 'bg-white text-teal-600 shadow' : 'text-gray-600 hover:bg-gray-200'}`}>Все время</button>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <MetricCard 
            title="Общие Расходы"
            value={formatCurrency(totalExpenses)}
            icon={TrendingDown}
            colorClass="text-red-600"
            bgColorClass="bg-red-50"
          />
          <div className="flex items-center justify-center">
            <button onClick={handleAnalyze} disabled={isAnalyzing} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-[1.01] flex items-center disabled:bg-indigo-400 disabled:cursor-not-allowed">
                {isAnalyzing ? <><Loader2 className="animate-spin h-5 w-5 mr-3" />Анализ...</> : <><BrainCircuit className="w-5 h-5 mr-2" />Анализ расходов через ИИ</>}</button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-10">
          <div className="lg:col-span-3 bg-white p-6 rounded-2xl shadow-xl border border-gray-100">
            <h2 className="text-xl font-bold text-gray-700 mb-4 flex items-center">
                <BarChart2 className="w-5 h-5 mr-2 text-teal-500" />
                Расходы по Категориям
            </h2>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <PieChart margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={150}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {
                      chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))
                    }
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-500 p-8">Нет данных о расходах для отображения графика.</p>
            )}
          </div>
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-xl border border-gray-100">
            <h2 className="text-xl font-bold text-gray-700 mb-4">Все Категории</h2>
            <div className="overflow-y-auto h-96">
                <table className="min-w-full divide-y divide-gray-200">
                    <tbody className="bg-white divide-y divide-gray-100">
                        {categoryData.map(([name, value]) => (
                            <tr key={name}>
                                <td className="px-4 py-3 text-sm font-medium text-gray-800">{name}</td>
                                <td className="px-4 py-3 text-sm text-right font-mono text-red-600">{formatCurrency(value)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}