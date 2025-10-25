'use client';

import { useEffect, useState } from 'react';
// Исходные импорты '@/lib/supabase' и 'next/navigation' были заменены заглушками для работы в Canvas.

import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

// Компонент InputField, перенесенный для обеспечения единообразия стиля
const InputField = ({ label, id, type = 'text', value, onChange, required = false, placeholder = '' }) => (
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
      // Убедимся, что при вводе чисел используется корректный формат
      {...(type === 'number' && { step: "0.01" })}
      className="w-full p-3 border border-gray-200 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-4 focus:ring-teal-500/50 focus:border-teal-500 transition duration-150 ease-in-out"
      required={required}
    />
  </div>
);

export default function ManagePaymentsPage() {
  const [user, setUser] = useState(null);
  const [payments, setPayments] = useState([]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [type, setType] = useState('loan'); // loan, installment, other
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Отдельная функция для получения и обновления списка платежей
  const fetchPayments = async (userId) => {
    const { data: paymentsData, error } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .order('due_date', { ascending: true }); // Моковая функция order теперь работает с сортировкой payments_mock

    if (error) {
      console.error('Error fetching payments:', error);
    } else {
      setPayments(paymentsData);
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        await fetchPayments(user.id);
      } else {
        // router.push('/login'); // Закомментировано для среды Canvas
      }
    };
    fetchUser();
  }, [router]);

  const handleAddPayment = async (e) => {
    e.preventDefault();
    setMessage(null);
    setIsLoading(true);

    // Basic validation
    if (!description || !amount || !dueDate) {
        setMessage('Пожалуйста, заполните все обязательные поля.');
        setIsLoading(false);
        return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase.from('payments').insert([
          { description, amount: parseFloat(amount), due_date: dueDate, type, user_id: user.id },
        ]);
        if (error) {
          setMessage(`Ошибка при добавлении платежа: ${error.message}`);
        } else {
          setMessage('Платеж успешно добавлен!');
          setDescription('');
          setAmount('');
          setDueDate('');
          // Обновляем список платежей, чтобы увидеть добавленный элемент
          await fetchPayments(user.id);
        }
      } else {
        setMessage('Вы должны быть авторизованы, чтобы добавить платеж.');
      }
    } catch (err) {
        console.error('Непредвиденная ошибка:', err);
        setMessage('Непредвиденная ошибка при добавлении платежа.');
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
      {/* Main Card Container, styled like AddIncomePage */}
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl p-6 sm:p-10 border-t-8 border-teal-500 transform transition duration-300">
        <h1 className="text-3xl font-extrabold text-center text-gray-900 border-b pb-4 mb-8">
          Управление Регулярными Платежами
        </h1>

        {/* Add Payment Form */}
        <form
          onSubmit={handleAddPayment}
          className="w-full max-w-md mx-auto p-6 space-y-6 bg-teal-50/70 rounded-2xl shadow-xl mb-12"
        >
          <h2 className="text-2xl font-bold text-teal-800 border-b border-teal-200 pb-3">
            Добавить Новый Платеж
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
            id="dueDate"
            label="Дата Оплаты"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
          />

          {/* Custom Select for Type, styled to match InputField */}
          <div className="space-y-1">
            <label htmlFor="type" className="block text-sm font-medium text-gray-700">Тип Платежа</label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-4 focus:ring-teal-500/50 focus:border-teal-500 transition duration-150 ease-in-out"
            >
              <option value="loan">Кредит</option>
              <option value="installment">Рассрочка</option>
              <option value="other">Другое</option>
            </select>
          </div>

          {/* Submit Button with Loading Spinner */}
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
              'Добавить Платеж'
            )}
          </button>

          {/* Message Display */}
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

        {/* Payments Table */}
        <h2 className="text-2xl font-bold text-gray-700 mb-4 pt-4 border-t border-gray-100">
          Ваши Платежи
        </h2>
        <div className="w-full overflow-x-auto rounded-xl shadow-lg border border-gray-100">
          <table className="min-w-full bg-white">
            <thead className="bg-teal-100/70 border-b border-teal-200">
              <tr>
                <th className="text-left p-4 text-sm font-semibold text-teal-800 uppercase tracking-wider">Описание</th>
                <th className="text-left p-4 text-sm font-semibold text-teal-800 uppercase tracking-wider">Сумма</th>
                <th className="text-left p-4 text-sm font-semibold text-teal-800 uppercase tracking-wider">Дата Оплаты</th>
                <th className="text-left p-4 text-sm font-semibold text-teal-800 uppercase tracking-wider">Тип</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.length > 0 ? (
                payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-teal-50/50 transition-colors duration-150">
                    <td className="p-4 whitespace-nowrap text-gray-800 font-medium">{payment.description}</td>
                    <td className="p-4 whitespace-nowrap text-gray-600 font-mono">${parseFloat(payment.amount).toFixed(2)}</td>
                    <td className="p-4 whitespace-nowrap text-gray-600">{payment.due_date}</td>
                    <td className="p-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider"
                            style={{
                                backgroundColor: payment.type === 'loan' ? '#e0f7fa' : payment.type === 'installment' ? '#f0f4c3' : '#e3f2fd',
                                color: payment.type === 'loan' ? '#006064' : payment.type === 'installment' ? '#558b2f' : '#1976d2'
                            }}>
                            {payment.type === 'loan' ? 'Кредит' : payment.type === 'installment' ? 'Рассрочка' : 'Другое'}
                        </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="p-4 text-center text-gray-500 italic">
                      Нет записанных регулярных платежей. Добавьте первый платеж выше!
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
