#!/usr/bin/env node

/**
 * Script de corrección automática
 * Corrige errores comunes detectados en la validación
 */

const fs = require('fs');
const path = require('path');

class AutoFixer {
  constructor() {
    this.rootDir = path.join(__dirname, '..');
    this.fixes = [];
  }

  // Fix 1: Corregir meta tags obsoletos
  fixDeprecatedMetaTags() {
    const htmlPath = path.join(this.rootDir, 'client', 'index.html');
    
    if (!fs.existsSync(htmlPath)) {
      console.log('❌ index.html no encontrado');
      return;
    }

    let content = fs.readFileSync(htmlPath, 'utf-8');
    let modified = false;

    // Reemplazar apple-mobile-web-app-capable
    if (content.includes('apple-mobile-web-app-capable')) {
      content = content.replace(
        /<meta name="apple-mobile-web-app-capable" content="yes"\s*\/?>/g,
        '<meta name="mobile-web-app-capable" content="yes" />'
      );
      modified = true;
      this.addFix('Meta tag obsoleto corregido en index.html');
    }

    if (modified) {
      fs.writeFileSync(htmlPath, content, 'utf-8');
      console.log('✅ index.html corregido');
    } else {
      console.log('ℹ️  index.html ya está correcto');
    }
  }

  // Fix 2: Limpiar manifest.json de iconos inexistentes
  fixManifestIcons() {
    const manifestPath = path.join(this.rootDir, 'client', 'public', 'manifest.json');
    
    if (!fs.existsSync(manifestPath)) {
      console.log('❌ manifest.json no encontrado');
      return;
    }

    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      let modified = false;

      if (manifest.icons) {
        const validIcons = manifest.icons.filter(icon => {
          const iconPath = path.join(this.rootDir, 'client', 'public', icon.src.replace(/^\//, ''));
          const exists = fs.existsSync(iconPath);
          if (!exists) {
            console.log(`  🗑️  Removiendo icono inexistente: ${icon.src}`);
            modified = true;
          }
          return exists;
        });

        if (modified) {
          manifest.icons = validIcons;
          fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
          this.addFix('Iconos inexistentes removidos de manifest.json');
          console.log('✅ manifest.json corregido');
        } else {
          console.log('ℹ️  manifest.json ya está correcto');
        }
      }
    } catch (error) {
      console.log('❌ Error procesando manifest.json:', error.message);
    }
  }

  // Fix 3: Mejorar Service Worker
  fixServiceWorker() {
    const swPath = path.join(this.rootDir, 'client', 'public', 'sw.js');
    
    if (!fs.existsSync(swPath)) {
      console.log('ℹ️  sw.js no encontrado (no es crítico)');
      return;
    }

    let content = fs.readFileSync(swPath, 'utf-8');
    let modified = false;

    // Agregar validación de status code si no existe
    if (!content.includes('response.status') && content.includes('cache.put')) {
      console.log('  ⚠️  Service Worker necesita validación manual de respuestas');
      console.log('     Ya tiene la versión mejorada del código');
    }

    console.log('ℹ️  Service Worker verificado');
  }

  // Fix 4: Crear .gitignore si no existe
  fixGitignore() {
    const gitignorePath = path.join(this.rootDir, '.gitignore');
    
    if (fs.existsSync(gitignorePath)) {
      console.log('ℹ️  .gitignore ya existe');
      return;
    }

    const gitignoreContent = `# Dependencies
node_modules/
client/node_modules/

# Build outputs
client/dist/
.vercel/
.railway/

# Environment
.env
.env.local
.env.production

# Logs
*.log
npm-debug.log*

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Temporary
*.tmp
.cache/
`;

    fs.writeFileSync(gitignorePath, gitignoreContent, 'utf-8');
    this.addFix('.gitignore creado');
    console.log('✅ .gitignore creado');
  }

  // Agregar fix aplicado
  addFix(description) {
    this.fixes.push(description);
  }

  // Generar reporte de fixes
  generateReport() {
    console.log('\n' + '='.repeat(70));
    console.log('🔧 REPORTE DE CORRECCIONES');
    console.log('='.repeat(70) + '\n');

    if (this.fixes.length === 0) {
      console.log('ℹ️  No se aplicaron correcciones (todo estaba bien)\n');
    } else {
      console.log('✅ Correcciones aplicadas:\n');
      this.fixes.forEach((fix, i) => {
        console.log(`${i + 1}. ${fix}`);
      });
      console.log('');
    }

    console.log('='.repeat(70) + '\n');

    if (this.fixes.length > 0) {
      console.log('📝 SIGUIENTE PASO:');
      console.log('   Commitear y redesplegar:\n');
      console.log('   git add .');
      console.log('   git commit -m "Auto-fix: correcciones automáticas"');
      console.log('   git push\n');
    }
  }

  // Ejecutar todas las correcciones
  runAll() {
    console.log('🔧 Iniciando corrección automática...\n');
    
    this.fixDeprecatedMetaTags();
    this.fixManifestIcons();
    this.fixServiceWorker();
    this.fixGitignore();
    
    this.generateReport();
  }
}

// Ejecutar corrección
if (require.main === module) {
  const fixer = new AutoFixer();
  fixer.runAll();
}

module.exports = AutoFixer;
