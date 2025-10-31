'use client';
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { UploadCloud, Loader2, ScanLine, Save } from "lucide-react";

const prompt = `
Проанализируй это изображение чека.
Извлеки дату чека в формате YYYY-MM-DD и каждый товар, его количество (если есть) и его цену.
Верни ТОЛЬКО один JSON-объект. Не добавляй никакого текста до или после JSON.
Объект должен иметь следующую структуру:
{
  "date": "YYYY-MM-DD",
  "items": [
    { "item": "Название товара", "quantity": 1, "price": 99.99 }
  ]
}

Если количество не указано, ставь 1.
Если не можешь что-то распознать, пропускай.
Не включай в список скидки, налоги или итоговую сумму, только сами товары.
Если дата не найдена, используй null.
`;

export default function ReceiptsPage() {
  const [file, setFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setAnalysisResult(null);
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError("Пожалуйста, выберите файл");
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("prompt", prompt);

    try {
      const response = await fetch("/api/scan-receipt", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Ошибка сервера");
      }

      const data = await response.json();
      setAnalysisResult(data);

    } catch (err) {
      setError(err.message || "Не удалось обработать запрос");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveExpenses = async () => {
    if (!analysisResult || !analysisResult.items || analysisResult.items.length === 0) {
      alert("Нет данных для сохранения.");
      return;
    }

    setIsSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Пожалуйста, войдите в систему, чтобы сохранить расходы.");
      setIsSaving(false);
      return;
    }

    const expensesToInsert = analysisResult.items.map(item => ({
      amount: item.price,
      description: item.item,
      category: item.item.split(' ')[0],
      date: analysisResult.date || new Date().toISOString().split('T')[0],
      user_id: user.id,
    }));

    const { error: dbError } = await supabase.from("expenses").insert(expensesToInsert);

    if (dbError) {
      setError(`Ошибка при сохранении: ${dbError.message}`);
    } else {
      router.push("/expenses");
    }

    setIsSaving(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-10">
        <div className="max-w-3xl mx-auto">
            <header className="text-center mb-10">
                <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight">🧾 Cканер чеков</h1>
                <p className="mt-2 text-lg text-gray-600">Загрузите изображение чека, чтобы извлечь данные</p>
            </header>

            <div className="bg-white p-8 rounded-2xl shadow-2xl border border-gray-100 space-y-6">
                <div>
                    <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-1">Изображение чека</label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                        <div className="space-y-1 text-center">
                            <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                            <div className="flex text-sm text-gray-600">
                                <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                                    <span>Загрузите файл</span>
                                    <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/png, image/jpeg, image/webp" onChange={handleFileChange} disabled={isAnalyzing} />
                                </label>
                                <p className="pl-1">или перетащите его сюда</p>
                            </div>
                            <p className="text-xs text-gray-500">PNG, JPG, WEBP до 10MB</p>
                            {file && <p className="text-sm text-green-600 mt-2">Выбран файл: {file.name}</p>}
                        </div>
                    </div>
                </div>

                <button
                    type="button"
                    className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-md text-white font-bold transition duration-300 ease-in-out bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transform hover:scale-[1.01]"
                    onClick={handleAnalyze}
                    disabled={!file || isAnalyzing}
                >
                    {isAnalyzing ? <><Loader2 className="animate-spin h-5 w-5 mr-3" />Анализ...</> : <><ScanLine className="h-5 w-5 mr-2"/>Анализировать чек</>}
                </button>
            </div>

            {error && <div className="mt-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative" role="alert">
              <strong className="font-bold">Ошибка: </strong>
              <span className="block sm:inline">{error}</span>
            </div>}

            {analysisResult && (
                <div className="mt-8 bg-white p-6 rounded-xl shadow-2xl border border-gray-100">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Результат сканирования:</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Товар</th>
                                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Кол-во</th>
                                    <th className="py-3 px-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Цена</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {analysisResult.items.map((item, index) => (
                                    <tr key={index} className="hover:bg-gray-50 transition duration-150">
                                        <td className="py-4 px-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.item}</td>
                                        <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-600">{item.quantity}</td>
                                        <td className="py-4 px-4 whitespace-nowrap text-sm text-right font-mono text-gray-800">{item.price.toFixed(2)} BYN</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <button
                        type="button"
                        className="w-full mt-6 flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-md text-white font-bold transition duration-300 ease-in-out bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transform hover:scale-[1.01]"
                        onClick={handleSaveExpenses}
                        disabled={isSaving}
                    >
                        {isSaving ? <><Loader2 className="animate-spin h-5 w-5 mr-3" />Сохранение...</> : <><Save className="h-5 w-5 mr-2"/>Сохранить расходы</>}
                    </button>
                </div>
            )}
        </div>
    </div>
  );
}
