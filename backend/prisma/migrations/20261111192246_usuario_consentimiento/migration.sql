-- SC-001: consentimiento del usuario para recomendaciones personalizadas (Habeas Data)
ALTER TABLE "Usuario" ADD COLUMN "consentimiento" BOOLEAN NOT NULL DEFAULT false;
