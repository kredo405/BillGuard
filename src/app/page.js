'use client';

import Link from 'next/link';

export default function HomePage() {
  return (
    // Улучшенный фон и центрирование
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4 sm:p-8">
      
      <main className="w-full max-w-6xl flex flex-col items-center text-center py-16 sm:py-24">
        
        {/* Заголовок с градиентом */}
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-4">
          Добро пожаловать в 
          <span className="block mt-2 bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-blue-500 to-indigo-600">
            BillGuard
          </span>
        </h1>

        {/* Подзаголовок */}
        <p className="mt-4 text-xl sm:text-2xl text-gray-300 max-w-xl mx-auto mb-12">
          Ваш надежный помощник для **управления личными финансами**.
        </p>

        {/* --- */}

        {/* Блоки для Входа и Регистрации (CTA) */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-8 w-full">
          
          {/* Блок Входа */}
          <Link 
            href="/login" 
            className="w-full sm:w-80 p-8 rounded-2xl shadow-2xl transition duration-300 ease-in-out transform hover:scale-[1.03] 
                       bg-white border border-gray-700 text-gray-800 hover:bg-gray-100"
          >
            <h3 className="text-2xl font-bold mb-3 text-blue-600">
              Войти &rarr;
            </h3>
            <p className="mt-2 text-base text-gray-600">
              Уже есть аккаунт? Войдите, чтобы продолжить.
            </p>
          </Link>

          {/* Блок Регистрации (Основной CTA) */}
          <Link 
            href="/signup" 
            className="w-full sm:w-80 p-8 rounded-2xl shadow-2xl transition duration-300 ease-in-out transform hover:scale-[1.03] 
                       bg-blue-600 border border-blue-600 text-white hover:bg-blue-700"
          >
            <h3 className="text-2xl font-bold mb-3">
              Зарегистрироваться &rarr;
            </h3>
            <p className="mt-2 text-base font-light">
              Новичок в BillGuard? Создайте аккаунт и начните управлять бюджетом.
            </p>
          </Link>
        </div>
      </main>
      
      {/* --- */}
      
      {/* Дополнительный декоративный элемент */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
        <div className="w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 absolute top-0 left-0 animate-blob"></div>
        <div className="w-96 h-96 bg-green-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 absolute bottom-0 right-0 animate-blob animation-delay-2000"></div>
      </div>
      
    </div>
  );
}

