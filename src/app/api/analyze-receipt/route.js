import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(request) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('receipt');

    if (!imageFile) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });

    const prompt = "Analyze this receipt and extract the total amount, category (e.g., Groceries, Restaurant, Transport), date (YYYY-MM-DD), and a brief description. Return the data in a JSON format like: { \"amount\": 123.45, \"category\": \"Groceries\", \"date\": \"2023-10-26\", \"description\": \"Supermarket purchase\" } If any information is not found, use null.";

    const image = {
      inlineData: {
        data: buffer.toString('base64'),
        mimeType: imageFile.type,
      },
    };

    const result = await model.generateContent([prompt, image]);
    const response = await result.response;
    const text = response.text();

    // Attempt to parse the JSON response from Gemini API
    let parsedData;
    try {
      parsedData = JSON.parse(text);
    } catch (jsonError) {
      console.error('Failed to parse Gemini API response as JSON:', text, jsonError);
      return NextResponse.json({ error: 'Failed to parse Gemini API response' }, { status: 500 });
    }

    return NextResponse.json(parsedData);
  } catch (error) {
    console.error('Error analyzing receipt:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
