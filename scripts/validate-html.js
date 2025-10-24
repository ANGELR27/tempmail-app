#!/usr/bin/env node

/**
 * Script de validación HTML
 * Detecta meta tags obsoletos, errores comunes y problemas de configuración
 */

const fs = require('fs');
const path = require('path');

const ERRORS = {
  DEPRECATED_META: 'deprecated_meta_tag',
  MISSING_FILE: 'missing_file',
  INVALID_MANIFEST: 'invalid_manifest',
  INCORRECT_MIME: 'incorrect_mime_type'
};

class HTMLValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.rootDir = path.join(__dirname, '..');
  }

  // Validar index.html
  validateHTML() {
    const htmlPath = path.join(this.rootDir, 'client', 'index.html');
    
    if (!fs.existsSync(htmlPath)) {
      this.addError(ERRORS.MISSING_FILE, 'index.html no encontrado');
      return;
    }

    const content = fs.readFileSync(htmlPath, 'utf-8');

    // Check 1: Meta tags obsoletos
    if (content.includes('apple-mobile-web-app-capable')) {
      this.addError(
        ERRORS.DEPRECATED_META,
        'Meta tag "apple-mobile-web-app-capable" está obsoleto',
        'Usar "mobile-web-app-capable" en su lugar',
        htmlPath
      );
    }

    // Check 2: Manifest link
    if (!content.includes('link rel="manifest"')) {
      this.addWarning('Falta link a manifest.json');
    }

    // Check 3: Service Worker registration
    if (content.includes('serviceWorker.register') && !content.includes('catch')) {
      this.addWarning('Service Worker sin manejo de errores adecuado');
    }

    console.log('✅ Validación de HTML completada');
  }

  // Validar manifest.json
  validateManifest() {
    const manifestPath = path.join(this.rootDir, 'client', 'public', 'manifest.json');
    
    if (!fs.existsSync(manifestPath)) {
      this.addError(ERRORS.MISSING_FILE, 'manifest.json no encontrado');
      return;
    }

    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

      // Check 1: Iconos existen
      if (manifest.icons) {
        manifest.icons.forEach(icon => {
          const iconPath = path.join(this.rootDir, 'client', 'public', icon.src.replace(/^\//, ''));
          if (!fs.existsSync(iconPath)) {
            this.addError(
              ERRORS.MISSING_FILE,
              `Icono ${icon.src} no existe`,
              'Crear el archivo o remover del manifest',
              iconPath
            );
          }
        });
      }

      // Check 2: Campos requeridos
      const required = ['name', 'short_name', 'start_url', 'display'];
      required.forEach(field => {
        if (!manifest[field]) {
          this.addWarning(`manifest.json: campo "${field}" faltante o vacío`);
        }
      });

      console.log('✅ Validación de manifest completada');
    } catch (error) {
      this.addError(ERRORS.INVALID_MANIFEST, 'manifest.json inválido: ' + error.message);
    }
  }

  // Validar archivos estáticos
  validateStaticFiles() {
    const publicDir = path.join(this.rootDir, 'client', 'public');
    const requiredFiles = ['mail.svg', 'manifest.json'];

    requiredFiles.forEach(file => {
      const filePath = path.join(publicDir, file);
      if (!fs.existsSync(filePath)) {
        this.addError(ERRORS.MISSING_FILE, `Archivo requerido ${file} no encontrado`, '', filePath);
      }
    });

    console.log('✅ Validación de archivos estáticos completada');
  }

  // Validar Service Worker
  validateServiceWorker() {
    const swPath = path.join(this.rootDir, 'client', 'public', 'sw.js');
    
    if (!fs.existsSync(swPath)) {
      this.addWarning('sw.js no encontrado (opcional)');
      return;
    }

    const content = fs.readFileSync(swPath, 'utf-8');

    // Check: Manejo de errores en fetch
    if (!content.includes('catch')) {
      this.addWarning('Service Worker: falta manejo de errores en fetch');
    }

    // Check: Validación de respuestas antes de cachear
    if (!content.includes('response.status') && content.includes('cache.put')) {
      this.addWarning('Service Worker: puede estar cacheando errores 404/500');
    }

    console.log('✅ Validación de Service Worker completada');
  }

  // Agregar error
  addError(type, message, solution = '', file = '') {
    this.errors.push({ type, message, solution, file });
  }

  // Agregar warning
  addWarning(message) {
    this.warnings.push(message);
  }

  // Generar reporte
  generateReport() {
    console.log('\n' + '='.repeat(70));
    console.log('📊 REPORTE DE VALIDACIÓN');
    console.log('='.repeat(70) + '\n');

    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('✅ ¡Todo perfecto! No se encontraron problemas.\n');
      return true;
    }

    // Errores críticos
    if (this.errors.length > 0) {
      console.log('❌ ERRORES CRÍTICOS:\n');
      this.errors.forEach((error, i) => {
        console.log(`${i + 1}. [${error.type}] ${error.message}`);
        if (error.solution) {
          console.log(`   💡 Solución: ${error.solution}`);
        }
        if (error.file) {
          console.log(`   📁 Archivo: ${error.file}`);
        }
        console.log('');
      });
    }

    // Warnings
    if (this.warnings.length > 0) {
      console.log('⚠️  ADVERTENCIAS:\n');
      this.warnings.forEach((warning, i) => {
        console.log(`${i + 1}. ${warning}`);
      });
      console.log('');
    }

    console.log('='.repeat(70) + '\n');
    return this.errors.length === 0;
  }

  // Ejecutar todas las validaciones
  runAll() {
    console.log('🔍 Iniciando validación completa...\n');
    
    this.validateHTML();
    this.validateManifest();
    this.validateStaticFiles();
    this.validateServiceWorker();
    
    const passed = this.generateReport();
    
    if (!passed) {
      console.log('💡 TIP: Ejecuta "npm run fix-errors" para corregir automáticamente\n');
      process.exit(1);
    }
    
    process.exit(0);
  }
}

// Ejecutar validación
if (require.main === module) {
  const validator = new HTMLValidator();
  validator.runAll();
}

module.exports = HTMLValidator;
