import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

async function testGemini() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
  const modelNames = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-flash-latest"];
  
  for (const name of modelNames) {
    console.log(`Testing model: ${name}`);
    try {
      const model = genAI.getGenerativeModel({ model: name });
      const result = await model.generateContent("High five!");
      console.log(`✅ Success with ${name}: ${result.response.text().substring(0, 20)}...`);
    } catch (err: any) {
      console.log(`❌ Fail with ${name}: ${err.message}`);
    }
  }
}

testGemini();
