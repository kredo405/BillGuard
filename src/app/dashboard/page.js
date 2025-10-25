'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [income, setIncome] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // safe parse helpers
  const safeNum = (v) => {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : 0;
  };

  const totalExpenses = useMemo(() => expenses.reduce((s, e) => s + safeNum(e.amount), 0), [expenses]);
  const totalIncome = useMemo(() => income.reduce((s, i) => s + safeNum(i.amount), 0), [income]);
  const balance = totalIncome - totalExpenses;

  useEffect(() => {
    let mounted = true;
    const fetchUserAndData = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const u = data?.user;
        if (!mounted) return;
        if (u) {
          setUser(u);

          // NOTE: Увеличение лимита для более полезных трендов, например, до 12
          const [expensesResponse, incomeResponse] = await Promise.all([
            supabase
              .from('expenses')
              .select('*')
              .eq('user_id', u.id)
              .order('date', { ascending: false })
              .limit(12), // Увеличен лимит
            supabase
              .from('income')
              .select('*')
              .eq('user_id', u.id)
              .order('date', { ascending: false })
              .limit(12), // Увеличен лимит
          ]);

          if (!expensesResponse.error) setExpenses(expensesResponse.data || []);
          if (!incomeResponse.error) setIncome(incomeResponse.data || []);
        } else {
          router.push('/login');
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchUserAndData();
    return () => {
      mounted = false;
    };
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const formatDate = (d) => {
    if (!d) return '';
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return d;
    return dt.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
  };

  // small sparkline generator for cards (Wider for better visibility)
  const sparklinePath = (values = [], w = 120, h = 32) => {
    if (!values || values.length < 2) return '';
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1;
    return values
      .map((v, i) => {
        // Уменьшаем ширину линии для небольшого отступа
        const x = (i / (values.length - 1)) * w; 
        // Инвертируем Y, чтобы низ был внизу SVG
        const y = h - ((v - min) / range) * h; 
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(' ');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-sky-50 p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-sky-600 mx-auto mb-4" />
          <p className="text-xl font-medium text-slate-600">Загружаем данные BillGuard...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  // prepare sparkline data (using last 8-10 entries for a clearer trend)
  const INCOME_HISTORY_LEN = 8;
  const incomeTrend = income.map((i) => safeNum(i.amount)).slice(0, INCOME_HISTORY_LEN).reverse();
  const expensesTrend = expenses.map((e) => safeNum(e.amount)).slice(0, INCOME_HISTORY_LEN).reverse();

  // Balance trend calculation (cumulative over last N entries, padded)
  const maxLen = Math.max(incomeTrend.length, expensesTrend.length);
  const paddedIncome = [...incomeTrend, ...Array(maxLen - incomeTrend.length).fill(0)];
  const paddedExpenses = [...expensesTrend, ...Array(maxLen - expensesTrend.length).fill(0)];
  
  let currentBalance = 0; // Начинаем отсчет от 0 для тренда
  const balanceTrend = paddedIncome.map((ci, i) => {
    // Используем i-1 для получения предыдущего кумулятивного баланса
    currentBalance = (i > 0 ? balanceTrend[i - 1] : 0) + ci - paddedExpenses[i];
    return currentBalance;
  });

  const balanceSparkColor = balance >= 0 ? '#10b981' : '#f43f5e'; // Emerald/Rose 
  
  // Добавляем рубль/тенге/другой символ, если не указано
  const currencySymbol = '$'; 
  const formatAmount = (amount, sign = true) => 
    `${sign ? (amount >= 0 ? '+' : '-') : ''}${currencySymbol}${Math.abs(amount).toFixed(2)}`;


  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-sky-50 p-4 sm:p-6 lg:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Topbar */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              Привет, <span className="text-sky-600">{user.email?.split('@')[0]} 👋</span>
            </h1>
            <p className="text-base text-slate-500 mt-1">
              Ваш финансовый **обзор** на сегодня.
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Поиск (увеличенная адаптивность) */}
            <div className="hidden lg:flex items-center bg-white border border-slate-200 rounded-full px-4 py-2 shadow-sm focus-within:ring-2 focus-within:ring-sky-500 focus-within:border-sky-500 transition-all">
              <svg className="w-5 h-5 text-slate-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35" />
                <circle cx="11" cy="11" r="6" strokeWidth={2} />
              </svg>
              <input aria-label="search" placeholder="Поиск транзакций, чеков..." className="outline-none text-base text-slate-600 w-44 lg:w-64 bg-transparent" />
            </div>

            {/* Профиль и Выход */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-white font-semibold text-lg shadow-md hover:ring-4 ring-sky-300 transition-all cursor-pointer">
              {user.email?.charAt(0)?.toUpperCase()}
            </div>
            
            <button
              onClick={handleLogout}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-500 to-rose-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.03] transition-all duration-200 active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7" />
              </svg>
              Выйти
            </button>
          </div>
        </header>

        {/* --- */}

        {/* Stats - Адаптивная сетка, более крупные иконки */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          
          {/* Баланс */}
          <StatCard 
            title="Текущий Баланс" 
            amount={formatAmount(balance, false)} 
            color={balance >= 0 ? 'text-emerald-600' : 'text-rose-600'} 
            sparkColor={balanceSparkColor}
            trendData={balanceTrend}
            icon={BalanceIcon}
            sparklinePath={sparklinePath}
          />
          
          {/* Доходы */}
          <StatCard 
            title="Общие Доходы" 
            amount={formatAmount(totalIncome, false)} 
            color="text-emerald-600" 
            sparkColor="#10b981"
            trendData={incomeTrend}
            icon={IncomeIcon}
            sparklinePath={sparklinePath}
          />

          {/* Расходы */}
          <StatCard 
            title="Общие Расходы" 
            amount={formatAmount(totalExpenses, false)} 
            color="text-rose-600" 
            sparkColor="#f43f5e"
            trendData={expensesTrend}
            icon={ExpenseIcon}
            sparklinePath={sparklinePath}
          />

          {/* Транзакции */}
          <StatCard 
            title="Транзакций (Недавних)" 
            amount={expenses.length + income.length} 
            color="text-sky-600" 
            sparkColor="#0ea5e9"
            trendData={[]} // Для этого блока тренд не нужен
            icon={TransactionIcon}
            sparklinePath={sparklinePath}
          >
            <p className="mt-3 text-xs text-slate-500">Последние {expenses.length + income.length} операций</p>
          </StatCard>
        </section>

        {/* --- */}

        {/* Quick actions - Более выразительные карточки */}
        <nav className="mb-10">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Быстрые действия</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            <ActionCard href="/expenses/add" title="Добавить расход" bg="bg-rose-50" textColor="text-rose-600" icon={ExpenseIcon} />
            <ActionCard href="/income/add" title="Добавить доход" bg="bg-emerald-50" textColor="text-emerald-600" icon={IncomeIcon} />
            <ActionCard href="/receipts/upload" title="Загрузить чек" bg="bg-purple-50" textColor="text-purple-600" icon={UploadIcon} />
            <ActionCard href="/payments/manage" title="Платежи" bg="bg-indigo-50" textColor="text-indigo-600" icon={CardIcon} />
            <ActionCard href="/reports" title="Отчёты" bg="bg-yellow-50" textColor="text-yellow-600" icon={ReportIcon} />
          </div>
        </nav>

        {/* --- */}
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Expenses */}
          <TransactionSection
            title="Последние расходы"
            link="/expenses"
            items={expenses}
            type="expense"
            formatDate={formatDate}
            safeNum={safeNum}
            currencySymbol={currencySymbol}
          />

          {/* Recent Income */}
          <TransactionSection
            title="Последние доходы"
            link="/income"
            items={income}
            type="income"
            formatDate={formatDate}
            safeNum={safeNum}
            currencySymbol={currencySymbol}
          />
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- */
/* Вспомогательные компоненты для чистоты кода и переиспользования стилей */
/* ---------------------------------- */

// Карточка Статистики
function StatCard({ title, amount, color, icon: Icon, sparkColor, trendData, sparklinePath, children }) {
  const showSparkline = trendData.length >= 2;
  return (
    <article className="group bg-white border border-slate-100 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className={`mt-1 text-3xl font-extrabold ${color}`}>{amount}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center transition-colors group-hover:bg-slate-200">
          <Icon className={`w-5 h-5 ${color} group-hover:scale-110 transition-transform`} />
        </div>
      </div>
      
      {showSparkline && (
        <div className="mt-4">
          <svg width="120" height="32" className="block">
            <path d={sparklinePath(trendData)} fill="none" stroke={sparkColor} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}
      
      {children}
    </article>
  );
}

// Карточка Быстрого Действия
function ActionCard({ href, title, bg, textColor, icon: Icon }) {
  return (
    <Link href={href} className="group block bg-white border border-slate-100 rounded-xl p-4 text-center hover:shadow-lg hover:scale-[1.02] transition-all duration-200 active:scale-95">
      <div className={`w-14 h-14 mx-auto rounded-xl flex items-center justify-center mb-2 ${bg} ${textColor} group-hover:scale-105 transition-transform shadow-md`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">{title}</div>
    </Link>
  );
}

// Секция Транзакций (Расход/Доход)
function TransactionSection({ title, link, items, type, formatDate, safeNum, currencySymbol }) {
  const isExpense = type === 'expense';
  const color = isExpense ? 'text-rose-600' : 'text-emerald-600';
  const bg = isExpense ? 'bg-rose-100' : 'bg-emerald-100';

  return (
    <section className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-xl font-bold text-slate-900">{title}</h3>
        <Link href={link} className="text-sky-600 text-sm font-medium hover:text-sky-700 transition-colors">Посмотреть все &rarr;</Link>
      </div>
      <div className="p-4">
        {items.length > 0 ? (
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-all duration-200">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center ${color} font-bold text-lg shadow-sm`}>
                    {(item.category || item.source || '?').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-base font-medium text-slate-900">{item.description || item.source || 'Без описания'}</div>
                    <div className="text-xs text-slate-500">{formatDate(item.date)}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-base font-bold ${color}`}>
                    {isExpense ? '-' : '+'}{currencySymbol}{safeNum(item.amount).toFixed(2)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState message={isExpense ? "Пока нет записанных расходов." : "Пока нет записанных доходов."} />
        )}
      </div>
    </section>
  );
}

// Empty State
function EmptyState({ message }) {
  return (
    <div className="py-10 text-center text-slate-500 bg-slate-50 rounded-xl m-2 border border-dashed border-slate-200">
      <svg className="w-10 h-10 mx-auto mb-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <div className="text-sm font-medium">{message}</div>
      <Link href="/expenses/add" className="mt-4 inline-flex items-center text-sky-600 hover:text-sky-700 text-sm font-medium">
         Добавить первую запись
      </Link>
    </div>
  );
}


/* SVG Icons */
const BalanceIcon = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2M12 21a9 9 0 110-18 9 9 0 010 18z" />
  </svg>
);
const IncomeIcon = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2M12 21V3m-4 8l4-4 4 4" />
  </svg>
);
const ExpenseIcon = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v8m0 0l-3-3m3 3l3-3M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const TransactionIcon = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 6v12M17 6v12" />
  </svg>
);
const UploadIcon = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v12m0 0l-3-3m3 3l3-3M21 21H3" />
  </svg>
);
const CardIcon = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M21 14V7a2 2 0 00-2-2H5a2 2 0 00-2 2v7" />
  </svg>
);
const ReportIcon = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-6a2 2 0 012-2h2a2 2 0 012 2v6M9 17h6M9 21h6a2 2 0 002-2V5a2 2 0 00-2-2H9a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
);