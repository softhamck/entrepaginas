const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('temporal123', 10);
  await prisma.usuario.upsert({
    where: { correo: 'bibliotecario@entrepaginas.test' },
    update: {},
    create: { nombre: 'Bibliotecario Demo', correo: 'bibliotecario@entrepaginas.test', telefono: '3000000000', contrasenaHash: hash, rol: 'ADMIN' }
  });
  await prisma.usuario.upsert({
    where: { correo: 'usuario@entrepaginas.test' },
    update: {},
    create: { nombre: 'Usuario Demo', correo: 'usuario@entrepaginas.test', telefono: '3000000001', contrasenaHash: hash, rol: 'USUARIO' }
  });
}

main().finally(() => prisma.$disconnect());