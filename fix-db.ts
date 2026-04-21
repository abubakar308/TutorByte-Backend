import { prisma } from "./src/app/lib/prisma";
import dotenv from "dotenv";
dotenv.config();

async function fixDb() {
  console.log("Deleting TutorLanguages rows with broken FK references...");
  
  // First delete all TutorLanguage entries since Language table was dropped  
  await prisma.$executeRawUnsafe(`DELETE FROM "TutorLanguages";`);
  console.log("✅ Cleared TutorLanguages");

  // Check if Language table exists
  const res = await prisma.$queryRawUnsafe(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'Language'
    ) as exists;
  `) as any[];
  
  console.log("Language table exists:", res[0].exists);
  
  await prisma.$disconnect();
}

fixDb().catch(console.error);
