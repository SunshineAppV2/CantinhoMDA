/**
 * Script para gerar chave de criptografia segura
 * 
 * Execute: node generate-encryption-key.js
 */

const crypto = require('crypto');

console.log('\n🔐 GERADOR DE CHAVES DE CRIPTOGRAFIA\n');
console.log('═══════════════════════════════════════════════════════════════\n');

// Gerar chaves
const encryptionKey = crypto.randomBytes(32).toString('hex');
const jwtSecret = crypto.randomBytes(32).toString('hex');
const jwtRefreshSecret = crypto.randomBytes(32).toString('hex');

console.log('📋 Copie as variáveis abaixo para seu arquivo .env:\n');
console.log('───────────────────────────────────────────────────────────────\n');
console.log(`ENCRYPTION_KEY="${encryptionKey}"`);
console.log(`JWT_SECRET="${jwtSecret}"`);
console.log(`JWT_REFRESH_SECRET="${jwtRefreshSecret}"`);
console.log('\n───────────────────────────────────────────────────────────────\n');

console.log('⚠️  IMPORTANTE:');
console.log('   1. Guarde essas chaves em local seguro');
console.log('   2. NUNCA commite essas chaves no Git');
console.log('   3. Use variáveis de ambiente no Render/Vercel');
console.log('   4. Faça backup das chaves em local seguro');
console.log('   5. Rotacione as chaves a cada 3-6 meses\n');

console.log('📝 Próximos passos:');
console.log('   1. Adicione ao .env local para desenvolvimento');
console.log('   2. Configure no Render (Settings > Environment Variables)');
console.log('   3. Configure no Vercel (se necessário)');
console.log('   4. Teste a criptografia antes de fazer deploy\n');

console.log('═══════════════════════════════════════════════════════════════\n');
