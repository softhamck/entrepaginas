const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function buscarPorCorreo(correo) {
  return prisma.usuario.findUnique({ where: { correo } });
}

function crear({ nombre, correo, telefono, contrasenaHash }) {
  return prisma.usuario.create({
    data: { nombre, correo, telefono, contrasenaHash }
  });
}

module.exports = { buscarPorCorreo, crear };