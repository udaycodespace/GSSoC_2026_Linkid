import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting backfill: set sequential `order` per user')
  const users = await prisma.user.findMany({ select: { id: true } })
  let updated = 0
  let processedLinks = 0

  for (const u of users) {
    const links = await prisma.link.findMany({
      where: { userId: u.id },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      select: { id: true, order: true }
    })

    const tx: any[] = []
    for (let i = 0; i < links.length; i++) {
      processedLinks++
      const desired = i + 1
      if (links[i].order !== desired) {
        tx.push(prisma.link.update({ where: { id: links[i].id }, data: { order: desired } }))
        updated++
      }
    }

    if (tx.length) {
      await prisma.$transaction(tx)
    }
  }

  const total = await prisma.link.count()
  const withOrder = await prisma.link.count({ where: { order: { gt: 0 } } })

  console.log(`Done. Total links: ${total}, with order>0: ${withOrder}, updated: ${updated}, processedLinks: ${processedLinks}`)
}

main()
  .catch((e) => {
    console.error('Backfill error', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
