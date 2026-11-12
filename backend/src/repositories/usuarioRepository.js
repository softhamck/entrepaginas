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

function buscarPorId(id) {
  return prisma.usuario.findUnique({ where: { id } });
}

// SC-001: activa o revoca el consentimiento de recomendaciones.
function actualizarConsentimiento(id, consentimiento) {
  return prisma.usuario.update({ where: { id }, data: { consentimiento } });
}

module.exports = { buscarPorCorreo, crear, buscarPorId, actualizarConsentimiento };