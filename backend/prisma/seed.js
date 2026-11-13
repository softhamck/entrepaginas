const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const dias = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d; };

async function main() {
  const hash = await bcrypt.hash('Demo1234', 10);

  // ===== Usuarios demo (upsert por correo) =====
  const admin = await prisma.usuario.upsert({
    where: { correo: 'admin.demo@entrepaginas.test' },
    update: {},
    create: { nombre: 'Biblioteca Demo', correo: 'admin.demo@entrepaginas.test', telefono: '3000000000', contrasenaHash: hash, rol: 'ADMIN' },
  });
  const ana = await prisma.usuario.upsert({
    where: { correo: 'ana.demo@entrepaginas.test' },
    update: { consentimiento: true },
    create: { nombre: 'Ana Gómez', correo: 'ana.demo@entrepaginas.test', telefono: '3001111111', contrasenaHash: hash, consentimiento: true },
  });
  const luis = await prisma.usuario.upsert({
    where: { correo: 'luis.demo@entrepaginas.test' },
    update: {},
    create: { nombre: 'Luis Pérez', correo: 'luis.demo@entrepaginas.test', telefono: '3002222222', contrasenaHash: hash },
  });
  const sofia = await prisma.usuario.upsert({
    where: { correo: 'sofia.demo@entrepaginas.test' },
    update: {},
    create: { nombre: 'Sofía Ruiz', correo: 'sofia.demo@entrepaginas.test', telefono: '3003333333', contrasenaHash: hash },
  });

  // ===== Limpiar actividad demo previa (para re-ejecutar sin duplicar) =====
  const demoIds = [admin.id, ana.id, luis.id, sofia.id];
  await prisma.multa.deleteMany({ where: { prestamo: { usuarioId: { in: demoIds } } } });
  await prisma.reserva.deleteMany({ where: { usuarioId: { in: demoIds } } });
  await prisma.prestamo.deleteMany({ where: { usuarioId: { in: demoIds } } });

  // ===== Catálogo demo (upsert por código de ejemplar) =====
  async function libro(titulo, autor, categoria, descripcion, codigos) {
    let l = await prisma.libro.findFirst({ where: { titulo, autor } });
    if (!l) l = await prisma.libro.create({ data: { titulo, autor, categoria, descripcion } });
    for (const codigo of codigos) {
      await prisma.ejemplar.upsert({
        where: { codigo },
        update: { libroId: l.id, estado: 'DISPONIBLE' },
        create: { codigo, libroId: l.id, estado: 'DISPONIBLE', costo: 40000 },
      });
    }
    return l;
  }

  const pilares = await libro('Los pilares de la Tierra', 'Ken Follett', 'Novela histórica', 'Una catedral en la Inglaterra medieval.', ['DEMO-001', 'DEMO-002']);
  const rosa = await libro('El nombre de la rosa', 'Umberto Eco', 'Novela histórica', 'Un misterio en una abadía medieval.', ['DEMO-003']);
  const adriano = await libro('Memorias de Adriano', 'Marguerite Yourcenar', 'Novela histórica', 'Las memorias del emperador romano.', ['DEMO-004']);
  const claudio = await libro('Yo, Claudio', 'Robert Graves', 'Novela histórica', 'La Roma de los Césares.', ['DEMO-005']);
  const dune = await libro('Dune', 'Frank Herbert', 'Ciencia ficción', 'Una épica en el planeta Arrakis.', ['DEMO-006']);
  const fundacion = await libro('Fundación', 'Isaac Asimov', 'Ciencia ficción', 'El declive de un imperio galáctico.', ['DEMO-007']);
  await libro('El principito', 'Antoine de Saint-Exupéry', 'Infantil', 'Un clásico universal.', ['DEMO-008']);

  const ejemplar = (codigo) => prisma.ejemplar.findUnique({ where: { codigo } });
  const prestar = async (ejemplarId, estadoEjemplar) =>
    prisma.ejemplar.update({ where: { id: ejemplarId }, data: { estado: estadoEjemplar } });

  // ===== Ana: 2 devueltos a tiempo + 1 activo (novela histórica) + consentimiento → "Para ti" =====
  const e1 = await ejemplar('DEMO-001');
  await prisma.prestamo.create({ data: { usuarioId: ana.id, ejemplarId: e1.id, fechaPrestamo: dias(-40), fechaVencimiento: dias(-26), fechaDevolucion: dias(-28), estado: 'DEVUELTO' } });
  const e3 = await ejemplar('DEMO-003');
  await prisma.prestamo.create({ data: { usuarioId: ana.id, ejemplarId: e3.id, fechaPrestamo: dias(-20), fechaVencimiento: dias(-6), fechaDevolucion: dias(-8), estado: 'DEVUELTO' } });
  const e4 = await ejemplar('DEMO-004');
  await prisma.prestamo.create({ data: { usuarioId: ana.id, ejemplarId: e4.id, fechaPrestamo: dias(-11), fechaVencimiento: dias(3), estado: 'ACTIVO' } });
  await prestar(e4.id, 'PRESTADO');

  // ===== Luis: devolvió "Fundación" tarde → multa pendiente → bloqueado =====
  const e7 = await ejemplar('DEMO-007');
  const pLuis = await prisma.prestamo.create({ data: { usuarioId: luis.id, ejemplarId: e7.id, fechaPrestamo: dias(-25), fechaVencimiento: dias(-11), fechaDevolucion: dias(-6), estado: 'DEVUELTO' } });
  await prisma.multa.create({ data: { prestamoId: pLuis.id, monto: 5000, pagada: false } }); // 5 días × $1.000

  // ===== Sofía: activo "Dune" (único ejemplar) → libro no disponible =====
  const e6 = await ejemplar('DEMO-006');
  await prisma.prestamo.create({ data: { usuarioId: sofia.id, ejemplarId: e6.id, fechaPrestamo: dias(-5), fechaVencimiento: dias(9), estado: 'ACTIVO' } });
  await prestar(e6.id, 'PRESTADO');

  // ===== Ana en la cola de espera de "Dune" (no disponible) =====
  await prisma.reserva.create({ data: { usuarioId: ana.id, libroId: dune.id, posicion: 1 } });

  console.log('✅ Seed demo completado.');
  console.log('   Admin:    admin.demo@entrepaginas.test');
  console.log('   Asociada: ana.demo@entrepaginas.test (Para ti + reserva)');
  console.log('   Asociado: luis.demo@entrepaginas.test (multa + bloqueo)');
  console.log('   Asociada: sofia.demo@entrepaginas.test (préstamo activo)');
  console.log('   Contraseña para todos: Demo1234');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
