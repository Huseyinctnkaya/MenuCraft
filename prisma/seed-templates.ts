import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

const prisma = new PrismaClient();

// Helper function to extract base64 images and save them as files
function extractBase64Images(obj: any, templateName: string, imageCounter: { count: number }): any {
    const imagesDir = path.join(process.cwd(), "public", "template-images");

    // Create directory if it doesn't exist
    if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, { recursive: true });
    }

    // Recursively walk through the object
    if (Array.isArray(obj)) {
        return obj.map(item => extractBase64Images(item, templateName, imageCounter));
    } else if (obj !== null && typeof obj === "object") {
        const newObj: any = {};
        for (const [key, value] of Object.entries(obj)) {
            // Check if this is a base64 image string
            if (typeof value === "string" && value.startsWith("data:image/")) {
                try {
                    // Extract image format and base64 data
                    const matches = value.match(/^data:image\/(\w+);base64,(.+)$/);
                    if (matches) {
                        const [, format, base64Data] = matches;

                        // Generate unique filename
                        const hash = crypto.createHash('md5').update(base64Data.substring(0, 100)).digest('hex').substring(0, 8);
                        const filename = `${templateName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${imageCounter.count}-${hash}.${format}`;
                        imageCounter.count++;

                        // Convert base64 to buffer and save
                        const buffer = Buffer.from(base64Data, 'base64');
                        const filePath = path.join(imagesDir, filename);
                        fs.writeFileSync(filePath, buffer);

                        // Replace base64 with file path
                        newObj[key] = `/template-images/${filename}`;
                        console.log(`   📸 Extracted image: ${filename} (${(buffer.length / 1024).toFixed(1)}KB)`);
                    } else {
                        newObj[key] = value;
                    }
                } catch (error) {
                    console.warn(`   ⚠️  Failed to extract image: ${error instanceof Error ? error.message : String(error)}`);
                    newObj[key] = ""; // Set to empty string if extraction fails
                }
            } else {
                newObj[key] = extractBase64Images(value, templateName, imageCounter);
            }
        }
        return newObj;
    }
    return obj;
}

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

            console.log(`🔄 Processing: ${file}`);

            // Extract base64 images and replace with file paths
            const imageCounter = { count: 1 };
            const processedItems = extractBase64Images(templateData.items, templateData.name, imageCounter);
            const processedSettings = extractBase64Images(templateData.settings || {}, templateData.name, imageCounter);

            // Prepare data with defaults for optional fields
            const data = {
                name: templateData.name,
                category: templateData.category || "General",
                description: templateData.description || null,
                items: processedItems,
                settings: processedSettings,
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

            console.log(`✅ ${file} → "${template.name}" (ID: ${template.id})\n`);
            successCount++;
        } catch (error) {
            console.error(`❌ ${file}: ${error instanceof Error ? error.message : String(error)}`);
            errorCount++;
        }
    }

    console.log(`📊 Summary:`);
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

