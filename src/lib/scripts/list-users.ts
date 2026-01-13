
import { db } from '../db';
async function run() {
    try {
        const users = await db.user.findMany({
            select: { id: true, clerkId: true, email: true }
        });
        console.log(JSON.stringify(users, null, 2));
    } catch (e) {
        console.error(e);
    }
}
run().finally(() => db.$disconnect());
