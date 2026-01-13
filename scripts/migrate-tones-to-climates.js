const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    console.log('🔄 Iniciando Migração de Tons para Climas...')

    // 1. Buscar todos os shorts que ainda referenciam toneId (se a coluna ainda existir fisicamente)
    // Como renomeamos no schema, o Prisma já mapeia para climateId.
    // Se o banco foi resetado, esta migração é para garantir que novos shorts funcionem.

    // No caso de um 'migrate reset', os dados antigos foram apagados.
    // Esta migração seria útil em ambiente de produção.
    // Aqui vamos focar em garantir que o sistema de seed seja executado.

    console.log('ℹ️ O banco foi resetado durante a migração do schema.')
    console.log('🚀 Executando seed de climas para restaurar sistema...')

    // Importar e rodar o seed
    require('./seed-climates.js')

    console.log('✅ Processo concluído!')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
