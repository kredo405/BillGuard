'use client';

import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
// Импортируем иконки для мобильного меню
import { Menu, X, LayoutDashboard, ScrollText, PlusCircle, LogOut } from 'lucide-react';

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  // Состояние для управления мобильным меню
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      // Использование 'user' с помощью деструктуризации
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();

    // Подписка на изменение состояния аутентификации
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      // Отписка при размонтировании компонента
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // Закрываем мобильное меню после выхода
    setIsMobileMenuOpen(false); 
    router.push('/login');
  };
  
  // Базовые стили для всех ссылок
  const linkClass = "hover:text-blue-400 transition-colors duration-200";

  // Ссылки для аутентифицированного пользователя
  const userLinks = [
    { href: "/dashboard", label: "Панель", icon: LayoutDashboard },
    { href: "/reports", label: "Отчеты", icon: ScrollText },
    { href: "/reports/history", label: "История", icon: ScrollText },
    { href: "/expenses", label: "Расходы", icon: PlusCircle },
    { href: "/receipts", label: "Чеки", icon: PlusCircle },
    { href: "/expenses/recurring", label: "Регулярные", icon: PlusCircle },
    // Ссылку на /payments/manage я убрал из-за её специфичности, но вы можете вернуть её при необходимости
  ];
  return (
    // Навигационная панель с эффектом "прилипания" и тенью
    <nav className="sticky top-0 z-50 bg-white shadow-lg border-b border-gray-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Логотип */}
          <Link href="/" className="text-2xl font-extrabold text-blue-600 hover:text-blue-700 transition-colors">
            BillGuard
          </Link>

          {/* Десктопное меню */}
          <div className="hidden md:flex items-center space-x-6 text-gray-600 font-medium">
            {user ? (
              <>
                {userLinks.map((item) => (
                  <Link key={item.href} href={item.href} className={linkClass}>
                    {item.label}
                  </Link>
                ))}
                <button 
                  onClick={handleLogout} 
                  className={`py-1 px-4 bg-red-500 text-white rounded-full ${linkClass} hover:bg-red-600`}
                >
                  Выход
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className={linkClass}>Войти</Link>
                <Link 
                  href="/signup" 
                  className={`py-2 px-4 bg-blue-600 text-white rounded-full ${linkClass} hover:bg-blue-700`}
                >
                  Регистрация
                </Link>
              </>
            )}
          </div>

          {/* Мобильная кнопка-гамбургер */}
          <div className="md:hidden">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
              className="p-2 text-gray-600 hover:text-blue-600 focus:outline-none"
              aria-label="Переключить меню"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>
      
      {/* --- */}

      {/* Мобильное выпадающее меню */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100">
          <div className="px-2 pt-2 pb-3 space-y-2 flex flex-col items-start">
            {user ? (
              <>
                {userLinks.map((item) => (
                  <Link 
                    key={item.href} 
                    href={item.href} 
                    onClick={() => setIsMobileMenuOpen(false)} // Закрыть после клика
                    className="w-full text-left py-2 px-3 rounded-md text-gray-900 hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <item.icon size={18} className="text-blue-500" />
                    <span>{item.label}</span>
                  </Link>
                ))}
                <button 
                  onClick={handleLogout} 
                  className="w-full text-left py-2 px-3 rounded-md text-red-500 hover:bg-red-50 flex items-center space-x-2"
                >
                  <LogOut size={18} />
                  <span>Выход</span>
                </button>
              </>
            ) : (
              <>
                <Link 
                  href="/login" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full text-left py-2 px-3 rounded-md text-gray-900 hover:bg-gray-50"
                >
                  Войти
                </Link>
                <Link 
                  href="/signup" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full text-left py-2 px-3 rounded-md bg-blue-500 text-white hover:bg-blue-600 text-center"
                >
                  Регистрация
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}