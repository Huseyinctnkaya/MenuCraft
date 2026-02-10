import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const menus = await prisma.menu.findMany({
        orderBy: { updatedAt: 'desc' },
    });

    if (menus.length === 0) {
        console.log("No menus found in database.");
        return;
    }

    console.log("--- Menu List ---");
    menus.forEach(m => {
        console.log(`ID: ${m.id} | Name: ${m.name} | Status: ${m.status} | Updated: ${m.updatedAt}`);
    });
    console.log("-----------------");

    const activeMenu = menus.find(m => m.status === 'active');
    if (!activeMenu) {
        console.log("CRITICAL: No active menu found!");
    } else {
        console.log("Active Menu Details:");
        console.log("ID:", activeMenu.id);
        console.log("Name:", activeMenu.name);
        // console.log("Settings:", JSON.stringify(activeMenu.settings, null, 2));
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
