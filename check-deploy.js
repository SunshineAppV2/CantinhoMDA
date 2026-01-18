#!/usr/bin/env node

/**
 * Script de Verificação - CantinhoMDA Deploy
 * 
 * Verifica se o backend e frontend estão configurados corretamente
 * 
 * Uso: node check-deploy.js
 */

const https = require('https');
const http = require('http');

// Cores para console
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(url) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;

        protocol.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    data: data
                });
            });
        }).on('error', reject);
    });
}

async function checkBackend(backendUrl) {
    log('\n🔍 Verificando Backend...', 'cyan');

    try {
        // Test health endpoint
        log(`  Testando: ${backendUrl}/health`, 'blue');
        const health = await makeRequest(`${backendUrl}/health`);

        if (health.statusCode === 200) {
            const healthData = JSON.parse(health.data);
            log(`  ✅ Health Check: OK`, 'green');
            log(`     Status: ${healthData.status}`, 'green');
            log(`     Uptime: ${Math.floor(healthData.uptime)}s`, 'green');
            log(`     Environment: ${healthData.environment}`, 'green');
        } else {
            log(`  ❌ Health Check falhou (Status: ${health.statusCode})`, 'red');
            return false;
        }

        // Test API info endpoint
        log(`  Testando: ${backendUrl}/api`, 'blue');
        const api = await makeRequest(`${backendUrl}/api`);

        if (api.statusCode === 200) {
            const apiData = JSON.parse(api.data);
            log(`  ✅ API Info: OK`, 'green');
            log(`     Nome: ${apiData.name}`, 'green');
            log(`     Versão: ${apiData.version}`, 'green');
        } else {
            log(`  ⚠️  API Info não disponível (Status: ${api.statusCode})`, 'yellow');
        }

        return true;
    } catch (error) {
        log(`  ❌ Erro ao conectar com backend: ${error.message}`, 'red');
        return false;
    }
}

async function checkFrontend(frontendUrl) {
    log('\n🔍 Verificando Frontend...', 'cyan');

    try {
        log(`  Testando: ${frontendUrl}`, 'blue');
        const response = await makeRequest(frontendUrl);

        if (response.statusCode === 200) {
            log(`  ✅ Frontend acessível (Status: ${response.statusCode})`, 'green');

            // Check if it's a valid HTML page
            if (response.data.includes('<!DOCTYPE html>') || response.data.includes('<html')) {
                log(`  ✅ HTML válido detectado`, 'green');
            } else {
                log(`  ⚠️  Resposta não parece ser HTML`, 'yellow');
            }

            return true;
        } else {
            log(`  ❌ Frontend retornou status ${response.statusCode}`, 'red');
            return false;
        }
    } catch (error) {
        log(`  ❌ Erro ao conectar com frontend: ${error.message}`, 'red');
        return false;
    }
}

async function main() {
    log('╔════════════════════════════════════════╗', 'cyan');
    log('║  CantinhoMDA - Verificação de Deploy  ║', 'cyan');
    log('╚════════════════════════════════════════╝', 'cyan');

    // URLs para testar
    const BACKEND_URL = process.env.BACKEND_URL || 'https://cantinhomda-backend.onrender.com';
    const FRONTEND_URL = process.env.FRONTEND_URL || 'https://cantinhomda.vercel.app';

    log(`\n📍 URLs configuradas:`, 'blue');
    log(`   Backend:  ${BACKEND_URL}`, 'blue');
    log(`   Frontend: ${FRONTEND_URL}`, 'blue');

    // Check backend
    const backendOk = await checkBackend(BACKEND_URL);

    // Check frontend
    const frontendOk = await checkFrontend(FRONTEND_URL);

    // Summary
    log('\n' + '═'.repeat(50), 'cyan');
    log('📊 RESUMO', 'cyan');
    log('═'.repeat(50), 'cyan');

    if (backendOk && frontendOk) {
        log('\n✅ Todos os serviços estão funcionando!', 'green');
        log('\n🎉 Sistema pronto para uso!', 'green');
        log(`\n🔗 Acesse: ${FRONTEND_URL}`, 'cyan');
    } else {
        log('\n❌ Alguns serviços apresentaram problemas:', 'red');
        if (!backendOk) log('   - Backend não está respondendo corretamente', 'red');
        if (!frontendOk) log('   - Frontend não está acessível', 'red');

        log('\n📚 Consulte os guias de troubleshooting:', 'yellow');
        log('   - DEPLOY_COMPLETO.md', 'yellow');
        log('   - RENDER_CONFIG.md', 'yellow');
        log('   - VERCEL_CONFIG.md', 'yellow');
    }

    log('\n');
}

// Run
main().catch(error => {
    log(`\n❌ Erro fatal: ${error.message}`, 'red');
    process.exit(1);
});
