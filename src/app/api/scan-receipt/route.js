import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Получаем API-ключ из переменных окружения
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

export async function POST(req) {
  try {
    // Используем FormData для приема файла
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "Файл не найден" }, { status: 400 });
    }

    // Конвертируем файл в Buffer, а затем в base64
    const buffer = await file.arrayBuffer();
    const imageBase64 = Buffer.from(buffer).toString("base64");
    const mimeType = file.type;

    // Выбираем модель, поддерживающую изображения
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); 

    // Это — "сердце" вашего запроса. Промт должен быть очень четким.
const prompt = `
      Проанализируй это изображение чека.
      Извлеки дату чека в формате YYYY-MM-DD(если даты нет, используй сегодняшнюю дату) и каждый товар, его количество (если есть) и его цену.
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

    // Объект изображения для API
    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: mimeType,
      },
    };

    // Отправляем промт и изображение
    const result = await model.generateContent([prompt, imagePart]);
    const response = result.response;
    let text = response.text();

    // Очистка ответа (Gemini может обернуть JSON в markdown ```json ... ```)
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    // Парсим текст в JSON
    const data = JSON.parse(text);

    return NextResponse.json(data);

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
