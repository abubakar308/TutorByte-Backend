import dotenv from "dotenv";
dotenv.config();

async function listAllModels() {
  const apiKey = process.env.GEMINI_API_KEY || "";
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );
    const data = await response.json() as any;
    if (data.models) {
      console.log("All available models:");
      data.models.forEach((m: any) => {
        if (m.supportedGenerationMethods.includes("generateContent")) {
          console.log(`- ${m.name}`);
        }
      });
    } else {
      console.log("No models found or error:", data);
    }
  } catch (err: any) {
    console.log("Error listing models:", err.message);
  }
}

listAllModels();
