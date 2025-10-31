'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

const InputField = ({ label, id, type = 'text', value, onChange, required = false, placeholder = '', list = '' }) => (
  <div className="space-y-1">
    <label htmlFor={id} className="block text-sm font-medium text-gray-700">
      {label}
      {required && <span className="text-red-500">*</span>}
    </label>
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      list={list}
      {...(type === 'number' && { step: "0.01" })}
      className="w-full p-3 border border-gray-200 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-4 focus:ring-teal-500/50 focus:border-teal-500 transition duration-150 ease-in-out text-gray-900"
      required={required}
    />
  </div>
);

export default function ManagePaymentsPage() {
  const [user, setUser] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState('Кредит');
  const [categories, setCategories] = useState([]);
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const fetchExpenses = async (userId) => {
    const { data: expensesData, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching expenses:', error);
    } else {
      setExpenses(expensesData);
      const uniqueCategories = [...new Set(expensesData.map(item => item.category))];
      setCategories(uniqueCategories);
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        await fetchExpenses(user.id);
      } else {
        router.push('/login');
      }
    };
    fetchUser();
  }, [router]);

  const handleAddExpense = async (e) => {
    e.preventDefault();
    setMessage(null);
    setIsLoading(true);

    if (!description || !amount || !date) {
        setMessage('Пожалуйста, заполните все обязательные поля.');
        setIsLoading(false);
        return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase.from('expenses').insert([
          { description, amount: parseFloat(amount), date: date, category, user_id: user.id },
        ]);
        if (error) {
          setMessage(`Ошибка при добавлении расхода: ${error.message}`);
        } else {
          setMessage('Расход успешно добавлен!');
          setDescription('');
          setAmount('');
          setDate('');
          await fetchExpenses(user.id);
        }
      } else {
        setMessage('Вы должны быть авторизованы, чтобы добавить расход.');
      }
    } catch (err) {
        console.error('Непредвиденная ошибка:', err);
        setMessage('Непредвиденная ошибка при добавлении расхода.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <p className="text-lg text-teal-600 animate-pulse">Загрузка данных...</p>
        </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen py-8 bg-gray-50 p-4 sm:p-6">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl p-6 sm:p-10 border-t-8 border-teal-500 transform transition duration-300">
        <h1 className="text-3xl font-extrabold text-center text-gray-900 border-b pb-4 mb-8">
          Управление Расходами
        </h1>

        <form
          onSubmit={handleAddExpense}
          className="w-full max-w-md mx-auto p-6 space-y-6 bg-teal-50/70 rounded-2xl shadow-xl mb-12"
        >
          <h2 className="text-2xl font-bold text-teal-800 border-b border-teal-200 pb-3">
            Добавить Новый Расход
          </h2>

          <InputField
            id="description"
            label="Описание"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            placeholder="Аренда, Кредит, Подписка"
          />
          <InputField
            id="amount"
            label="Сумма"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            placeholder="0.00"
          />
          <InputField
            id="date"
            label="Дата"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">Категория</label>
            <input
              id="category"
              type="text"
              list="categories-list"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-4 focus:ring-teal-500/50 focus:border-teal-500 transition duration-150 ease-in-out text-gray-900"
            />
            <datalist id="categories-list">
              {categories.map((cat) => (
                <option key={cat} value={cat} />
              ))}
              <option value="Кредит" />
              <option value="Рассрочка" />
              <option value="Другое" />
            </datalist>
          </div>

          <button
            type="submit"
            className={`w-full py-3 text-white font-bold text-lg rounded-xl shadow-lg transition duration-300 ease-in-out transform hover:scale-[1.01] active:scale-[0.99]
                ${isLoading ? 'bg-teal-400 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700 hover:shadow-xl'}
            `}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Загрузка...</span>
              </div>
            ) : (
              'Добавить Расход'
            )}
          </button>

          {message && (
            <div
              className={`p-3 rounded-xl text-center text-sm font-medium border
                ${message.includes('успешно')
                  ? 'bg-green-50 border-green-300 text-green-700'
                  : 'bg-red-50 border-red-300 text-red-700'
                }`}
            >
              {message}
            </div>
          )}
        </form>

        <h2 className="text-2xl font-bold text-gray-700 mb-4 pt-4 border-t border-gray-100">
          Ваши Расходы
        </h2>
        <div className="w-full overflow-x-auto rounded-xl shadow-lg border border-gray-100">
          <table className="min-w-full bg-white">
            <thead className="bg-teal-100/70 border-b border-teal-200">
              <tr>
                <th className="text-left p-4 text-sm font-semibold text-teal-800 uppercase tracking-wider">Описание</th>
                <th className="text-left p-4 text-sm font-semibold text-teal-800 uppercase tracking-wider">Сумма</th>
                <th className="text-left p-4 text-sm font-semibold text-teal-800 uppercase tracking-wider">Дата</th>
                <th className="text-left p-4 text-sm font-semibold text-teal-800 uppercase tracking-wider">Категория</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {expenses.length > 0 ? (
                expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-teal-50/50 transition-colors duration-150">
                    <td className="p-4 whitespace-nowrap text-gray-800 font-medium">{expense.description}</td>
                    <td className="p-4 whitespace-nowrap text-gray-600 font-mono">BYN{parseFloat(expense.amount).toFixed(2)}</td>
                    <td className="p-4 whitespace-nowrap text-gray-600">{expense.date}</td>
                    <td className="p-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider"
                            style={{
                                backgroundColor: expense.category === 'Кредит' ? '#e0f7fa' : expense.category === 'Рассрочка' ? '#f0f4c3' : '#e3f2fd',
                                color: expense.category === 'Кредит' ? '#006064' : expense.category === 'Рассрочка' ? '#558b2f' : '#1976d2'
                            }}>
                            {expense.category}
                        </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="p-4 text-center text-gray-500 italic">
                      Нет записанных расходов. Добавьте первый расход выше!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
