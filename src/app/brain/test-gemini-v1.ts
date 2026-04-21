import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

async function testGeminiV1() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
  
  // Try v1 instead of v1beta
  console.log("Testing with apiVersion: v1");
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }, { apiVersion: 'v1' });
    const result = await model.generateContent("Hello!");
    console.log(`✅ Success with v1: ${result.response.text().substring(0, 20)}...`);
  } catch (err: any) {
    console.log(`❌ Fail with v1: ${err.message}`);
  }

  // Try gemini-1.5-flash-latest with v1
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" }, { apiVersion: 'v1' });
    const result = await model.generateContent("Hello!");
    console.log(`✅ Success with gemini-1.5-flash-latest and v1: ${result.response.text().substring(0, 20)}...`);
  } catch (err: any) {
    console.log(`❌ Fail with gemini-1.5-flash-latest and v1: ${err.message}`);
  }
}

testGeminiV1();
