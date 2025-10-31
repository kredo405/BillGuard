'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Loader2, ChevronRight, FileText } from 'lucide-react';

export default function ReportsHistoryPage() {
  const [user, setUser] = useState(null);
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUserAndReports = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUser(user);
          const { data: reportsData, error } = await supabase
            .from('ai_reports')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
          if (error) {
            console.error('Error fetching reports:', error);
          } else {
            setReports(reportsData || []);
          }
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error('Error during data fetch:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserAndReports();
  }, [router]);

  if (isLoading) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <Loader2 className="w-8 h-8 text-teal-500 animate-spin mr-2" />
            <p className="text-lg text-teal-600">Загрузка истории отчетов...</p>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-3xl shadow-2xl border-t-8 border-teal-500">
        <h1 className="text-3xl font-extrabold text-gray-900 text-center border-b pb-4 mb-8">
          История Анализов
        </h1>

        {reports.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Нет сохраненных отчетов</h3>
            <p className="mt-1 text-sm text-gray-500">Вы можете сгенерировать новый отчет на странице "Отчеты".</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {reports.map(report => (
              <li key={report.id} className="border rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <button onClick={() => setSelectedReport(selectedReport?.id === report.id ? null : report)} className="w-full text-left p-4 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-lg text-gray-800">{report.report_name}</p>
                    <p className="text-sm text-gray-500">{new Date(report.created_at).toLocaleString('ru-RU')}</p>
                  </div>
                  <ChevronRight className={`transition-transform ${selectedReport?.id === report.id ? 'transform rotate-90' : ''}`} />
                </button>
                {selectedReport?.id === report.id && (
                  <div className="p-4 border-t prose max-w-none text-gray-900" dangerouslySetInnerHTML={{ __html: selectedReport.report_content.replace(/\n/g, '<br />') }} />
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
