#!/usr/bin/env node

/**
 * Verificar deployment - Compara código local vs producción
 * Detecta si el servidor está sirviendo código desactualizado
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

class DeploymentChecker {
  constructor(url) {
    this.url = url || 'https://fulfilling-cooperation-production.up.railway.app';
    this.issues = [];
  }

  // Fetch URL
  async fetch(url) {
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https') ? https : http;
      
      client.get(url, { timeout: 10000 }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ status: res.statusCode, data, headers: res.headers }));
      }).on('error', reject).on('timeout', () => reject(new Error('Timeout')));
    });
  }

  // Check 1: Servidor responde
  async checkServerStatus() {
    console.log('🔍 Verificando estado del servidor...');
    
    try {
      const result = await this.fetch(this.url);
      
      if (result.status === 502 || result.status === 503) {
        this.addIssue('CRITICAL', '❌ Servidor devuelve error 502/503 (Bad Gateway/Service Unavailable)');
        this.addIssue('INFO', '   El deployment está caído o fallando');
        return false;
      }
      
      if (result.status === 404) {
        this.addIssue('CRITICAL', '❌ Servidor devuelve 404 (Not Found)');
        return false;
      }
      
      if (result.status === 200) {
        console.log('✅ Servidor responde correctamente (200 OK)');
        return true;
      }
      
      this.addIssue('WARNING', `⚠️  Servidor responde con código: ${result.status}`);
      return false;
    } catch (error) {
      this.addIssue('CRITICAL', `❌ No se puede conectar al servidor: ${error.message}`);
      return false;
    }
  }

  // Check 2: HTML tiene meta tags correctos
  async checkMetaTags() {
    console.log('🔍 Verificando meta tags...');
    
    try {
      const result = await this.fetch(this.url);
      
      if (result.status !== 200) {
        console.log('⏭️  Saltando (servidor no responde)');
        return;
      }

      const html = result.data;

      // Check meta tag obsoleto
      if (html.includes('apple-mobile-web-app-capable')) {
        this.addIssue('WARNING', '⚠️  HTML contiene meta tag OBSOLETO: apple-mobile-web-app-capable');
        this.addIssue('INFO', '   El servidor está sirviendo código VIEJO');
        this.addIssue('INFO', '   💡 Solución: Redesplegar en Railway');
      } else if (html.includes('mobile-web-app-capable')) {
        console.log('✅ Meta tags actualizados correctamente');
      } else {
        this.addIssue('INFO', 'ℹ️  No se encontró meta tag mobile-web-app-capable');
      }
    } catch (error) {
      console.log('⏭️  No se pudo verificar:', error.message);
    }
  }

  // Check 3: Assets existen
  async checkAssets() {
    console.log('🔍 Verificando assets...');
    
    const assetsToCheck = [
      '/manifest.json',
      '/mail.svg',
      '/sw.js'
    ];

    for (const asset of assetsToCheck) {
      try {
        const result = await this.fetch(this.url + asset);
        
        if (result.status === 404) {
          this.addIssue('ERROR', `❌ Asset no encontrado: ${asset}`);
        } else if (result.status === 502 || result.status === 503) {
          this.addIssue('ERROR', `❌ Error al cargar: ${asset} (502/503)`);
        } else if (result.status === 200) {
          // Verificar MIME type
          const contentType = result.headers['content-type'];
          
          if (asset.endsWith('.json') && !contentType.includes('application/json')) {
            this.addIssue('WARNING', `⚠️  ${asset} tiene MIME type incorrecto: ${contentType}`);
          } else if (asset.endsWith('.svg') && !contentType.includes('image/svg')) {
            this.addIssue('WARNING', `⚠️  ${asset} tiene MIME type incorrecto: ${contentType}`);
          } else {
            console.log(`  ✅ ${asset} OK`);
          }
        }
      } catch (error) {
        this.addIssue('ERROR', `❌ Error verificando ${asset}: ${error.message}`);
      }
    }
  }

  // Check 4: Comparar con local
  async compareWithLocal() {
    console.log('🔍 Comparando con código local...');
    
    const localHTML = path.join(__dirname, '..', 'client', 'index.html');
    
    if (!fs.existsSync(localHTML)) {
      console.log('⏭️  Archivo local no encontrado');
      return;
    }

    try {
      const localContent = fs.readFileSync(localHTML, 'utf-8');
      const remoteResult = await this.fetch(this.url);

      if (remoteResult.status !== 200) {
        console.log('⏭️  No se puede comparar (servidor no responde)');
        return;
      }

      const remoteContent = remoteResult.data;

      // Verificar meta tag
      const hasOldMetaLocal = localContent.includes('apple-mobile-web-app-capable');
      const hasOldMetaRemote = remoteContent.includes('apple-mobile-web-app-capable');

      if (!hasOldMetaLocal && hasOldMetaRemote) {
        this.addIssue('CRITICAL', '❌ CÓDIGO DESINCRONIZADO');
        this.addIssue('INFO', '   Local: Meta tag actualizado ✅');
        this.addIssue('INFO', '   Railway: Meta tag obsoleto ❌');
        this.addIssue('INFO', '   💡 Solución: git push + redesplegar Railway');
      } else if (!hasOldMetaLocal && !hasOldMetaRemote) {
        console.log('✅ Código local y remoto están sincronizados');
      }
    } catch (error) {
      console.log('⏭️  No se pudo comparar:', error.message);
    }
  }

  // Agregar issue
  addIssue(level, message) {
    this.issues.push({ level, message });
  }

  // Generar reporte
  generateReport() {
    console.log('\n' + '='.repeat(70));
    console.log('📊 REPORTE DE DEPLOYMENT');
    console.log('='.repeat(70) + '\n');
    console.log(`URL: ${this.url}\n`);

    if (this.issues.length === 0) {
      console.log('✅ ¡Todo perfecto! El deployment está correcto.\n');
      return;
    }

    const critical = this.issues.filter(i => i.level === 'CRITICAL');
    const errors = this.issues.filter(i => i.level === 'ERROR');
    const warnings = this.issues.filter(i => i.level === 'WARNING');
    const info = this.issues.filter(i => i.level === 'INFO');

    if (critical.length > 0) {
      console.log('🚨 CRÍTICO:\n');
      critical.forEach(i => console.log(i.message));
      console.log('');
    }

    if (errors.length > 0) {
      console.log('❌ ERRORES:\n');
      errors.forEach(i => console.log(i.message));
      console.log('');
    }

    if (warnings.length > 0) {
      console.log('⚠️  ADVERTENCIAS:\n');
      warnings.forEach(i => console.log(i.message));
      console.log('');
    }

    if (info.length > 0) {
      console.log('ℹ️  INFORMACIÓN:\n');
      info.forEach(i => console.log(i.message));
      console.log('');
    }

    console.log('='.repeat(70) + '\n');

    if (critical.length > 0 || errors.length > 0) {
      console.log('📝 PASOS SUGERIDOS:\n');
      console.log('1. Verificar en Railway Dashboard: https://railway.app/dashboard');
      console.log('2. Ver logs: railway logs');
      console.log('3. Redesplegar: railway up');
      console.log('4. O migrar a Vercel: vercel --prod\n');
    }
  }

  // Ejecutar todas las verificaciones
  async runAll() {
    console.log('🔍 Verificando deployment en Railway...\n');
    console.log(`URL: ${this.url}\n`);
    
    const serverOk = await this.checkServerStatus();
    
    if (serverOk) {
      await this.checkMetaTags();
      await this.checkAssets();
      await this.compareWithLocal();
    }
    
    this.generateReport();
  }
}

// Ejecutar verificación
if (require.main === module) {
  const url = process.argv[2];
  const checker = new DeploymentChecker(url);
  checker.runAll().catch(console.error);
}

module.exports = DeploymentChecker;
