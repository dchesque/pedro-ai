
import { db } from '../db'

async function debugStyles() {
    console.log('--- DEBUG STYLES ---')
    try {
        const styles = await db.$queryRawUnsafe('SELECT * FROM "Style"')
        console.log('Total styles found:', (styles as any[]).length)
        console.log(JSON.stringify(styles, null, 2))

        const userStyles = await db.$queryRawUnsafe('SELECT id, "userId", name FROM "UserStyle"')
        console.log('Legacy UserStyles:', JSON.stringify(userStyles, null, 2))

        const users = await db.$queryRawUnsafe('SELECT id, "clerkId", email FROM "User"')
        console.log('Current Users:', JSON.stringify(users, null, 2))
    } catch (e) {
        console.error('Error during debug:', e)
    }
    console.log('--- END DEBUG ---')
}

debugStyles()
    .finally(() => db.$disconnect())
