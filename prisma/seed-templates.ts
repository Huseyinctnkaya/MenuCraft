import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

async function main() {
    const templatesDir = path.join(process.cwd(), "Template library json files");

    console.log(`📁 Reading templates from: ${templatesDir}`);

    if (!fs.existsSync(templatesDir)) {
        console.error(`❌ Directory not found: ${templatesDir}`);
        process.exit(1);
    }

    const files = fs.readdirSync(templatesDir).filter(file => file.endsWith(".json"));

    if (files.length === 0) {
        console.log("⚠️  No JSON files found in template directory");
        return;
    }

    console.log(`📄 Found ${files.length} JSON file(s)\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const file of files) {
        try {
            const filePath = path.join(templatesDir, file);
            const fileContent = fs.readFileSync(filePath, "utf-8");
            const templateData = JSON.parse(fileContent);

            // Validate required fields
            if (!templateData.name) {
                console.error(`❌ ${file}: Missing required field "name"`);
                errorCount++;
                continue;
            }

            if (!templateData.items || !Array.isArray(templateData.items)) {
                console.error(`❌ ${file}: Missing or invalid "items" field`);
                errorCount++;
                continue;
            }

            // Prepare data with defaults for optional fields
            const data = {
                name: templateData.name,
                category: templateData.category || "General",
                description: templateData.description || null,
                items: templateData.items,
                settings: templateData.settings || {},
                isPro: templateData.isPro ?? false,
                isNew: templateData.isNew ?? false,
                previewUrl: templateData.previewUrl || null,
            };

            // Upsert template (insert or update based on unique name)
            const template = await prisma.menuTemplate.upsert({
                where: { name: data.name },
                update: {
                    category: data.category,
                    description: data.description,
                    items: data.items as any,
                    settings: data.settings as any,
                    isPro: data.isPro,
                    isNew: data.isNew,
                    previewUrl: data.previewUrl,
                },
                create: {
                    name: data.name,
                    category: data.category,
                    description: data.description,
                    items: data.items as any,
                    settings: data.settings as any,
                    isPro: data.isPro,
                    isNew: data.isNew,
                    previewUrl: data.previewUrl,
                },
            });

            console.log(`✅ ${file} → "${template.name}" (ID: ${template.id})`);
            successCount++;
        } catch (error) {
            console.error(`❌ ${file}: ${error instanceof Error ? error.message : String(error)}`);
            errorCount++;
        }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📦 Total: ${files.length}`);
}

main()
    .catch((e) => {
        console.error("Fatal error:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
