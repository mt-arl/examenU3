FROM node:18-alpine

# 1. INSTALACIÓN DE LIBRERÍAS DEL SISTEMA
# openssl: Necesario para que el motor de Prisma funcione.
# libc6-compat: Ayuda a la compatibilidad de binarios en Alpine.
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# 2. INSTALACIÓN DE DEPENDENCIAS NODE
COPY package*.json ./
RUN npm install

# 3. COPIA DEL CÓDIGO Y GENERACIÓN DE PRISMA
COPY . .

# Generar el cliente de Prisma dentro del entorno Linux-Alpine del contenedor
RUN npm run gen

EXPOSE 5000

# Health check (manteniendo tu configuración)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# 4. ARRANQUE
CMD ["npm", "start"]