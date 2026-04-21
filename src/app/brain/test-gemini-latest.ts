import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

async function testGeminiLatest() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
  const name = "gemini-flash-latest";
  
  console.log(`Testing model: ${name}`);
  try {
    const model = genAI.getGenerativeModel({ model: name });
    const result = await model.generateContent("High five!");
    console.log(`✅ Success with ${name}: ${result.response.text().substring(0, 50)}...`);
  } catch (err: any) {
    console.log(`❌ Fail with ${name}: ${err.message}`);
  }
}

testGeminiLatest();
