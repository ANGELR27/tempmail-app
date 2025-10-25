// Servicio para obtener logos de compañías desde emails
const axios = require('axios');

class LogoService {
  constructor() {
    // Cache de logos para evitar requests repetidos
    this.cache = new Map();
    
    // Mapeo manual de dominios conocidos a logos
    this.knownLogos = {
      'discord.com': 'https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png',
      'instagram.com': 'https://static.cdninstagram.com/rsrc.php/v3/yt/r/30PrGfR3xhB.png',
      'facebook.com': 'https://static.xx.fbcdn.net/rsrc.php/y8/r/dF5SId3UHWd.svg',
      'tiktok.com': 'https://sf16-website-login.neutral.ttwstatic.com/obj/tiktok_web_login_static/tiktok/webapp/main/webapp-desktop/8152caf0c8e8bc67ae0d.png',
      'github.com': 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png',
      'twitter.com': 'https://abs.twimg.com/responsive-web/client-web/icon-ios.77d25eba.png',
      'x.com': 'https://abs.twimg.com/responsive-web/client-web/icon-ios.77d25eba.png',
      'linkedin.com': 'https://static.licdn.com/sc/h/al2o9zrvru7aqj8e1x2rzsrca',
      'slack.com': 'https://a.slack-edge.com/80588/marketing/img/icons/icon_slack_hash_colored.png',
      'notion.so': 'https://www.notion.so/images/logo-ios.png',
      'shopify.com': 'https://cdn.shopify.com/shopifycloud/brochure/assets/brand-assets/shopify-logo-primary-logo-456baa801ee66a0a435671082365958316831c9960c480451dd0330bcdae304f.svg',
      'stripe.com': 'https://images.ctfassets.net/fzn2n1nzq965/HTTOloNPhisV9P4hlMPNA/cacf1bb88b9fc492dfad34378d844280/Stripe_icon_-_square.svg',
      'paypal.com': 'https://www.paypalobjects.com/webstatic/icon/pp258.png',
      'spotify.com': 'https://storage.googleapis.com/pr-newsroom-wp/1/2018/11/Spotify_Logo_RGB_Green.png',
      'netflix.com': 'https://assets.nflxext.com/us/ffe/siteui/common/icons/nficon2016.png',
      'amazon.com': 'https://m.media-amazon.com/images/G/01/gc/designs/livepreview/amazon_dkblue_noto_email_v2016_us-main._CB468775337_.png'
    };
  }

  // Extraer dominio del email
  extractDomain(email) {
    try {
      const match = email.match(/@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
      return match ? match[1].toLowerCase() : null;
    } catch (error) {
      console.error('Error extrayendo dominio:', error);
      return null;
    }
  }

  // Obtener logo desde Clearbit
  async getClearbitLogo(domain) {
    try {
      const url = `https://logo.clearbit.com/${domain}`;
      const response = await axios.head(url, { timeout: 2000 });
      if (response.status === 200) {
        return url;
      }
    } catch (error) {
      // Clearbit devuelve 404 si no encuentra el logo
      return null;
    }
    return null;
  }

  // Obtener favicon de Google
  getGoogleFavicon(domain, size = 128) {
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`;
  }

  // Extraer logo del HTML del email (si existe)
  extractLogoFromHTML(html) {
    if (!html) return null;

    try {
      // Buscar primera imagen que parezca un logo
      const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
      const matches = html.matchAll(imgRegex);

      for (const match of matches) {
        const src = match[1];
        // Filtrar imágenes que parecen logos (contienen 'logo', 'brand', 'icon' en la URL)
        if (
          src.includes('logo') ||
          src.includes('brand') ||
          src.includes('icon') ||
          src.includes('header')
        ) {
          // Verificar que sea una URL absoluta
          if (src.startsWith('http')) {
            return src;
          }
        }
      }
    } catch (error) {
      console.error('Error extrayendo logo del HTML:', error);
    }

    return null;
  }

  // Obtener logo (método principal con fallbacks)
  async getLogo(fromEmail, html = null) {
    const domain = this.extractDomain(fromEmail);
    if (!domain) {
      return this.getDefaultLogo();
    }

    // Verificar cache
    const cacheKey = domain;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    let logo = null;

    // 1. Verificar logos conocidos manualmente
    if (this.knownLogos[domain]) {
      logo = this.knownLogos[domain];
      this.cache.set(cacheKey, logo);
      return logo;
    }

    // 2. Intentar extraer del HTML del email
    if (html) {
      logo = this.extractLogoFromHTML(html);
      if (logo) {
        this.cache.set(cacheKey, logo);
        return logo;
      }
    }

    // 3. Intentar Clearbit
    logo = await this.getClearbitLogo(domain);
    if (logo) {
      this.cache.set(cacheKey, logo);
      return logo;
    }

    // 4. Fallback a Google Favicon
    logo = this.getGoogleFavicon(domain, 128);
    this.cache.set(cacheKey, logo);
    return logo;
  }

  // Logo por defecto
  getDefaultLogo() {
    return null; // Usar iniciales como fallback en el frontend
  }

  // Obtener información de marca (nombre + logo)
  async getBrandInfo(fromEmail, html = null) {
    const domain = this.extractDomain(fromEmail);
    const logo = await this.getLogo(fromEmail, html);

    // Extraer nombre de la compañía del dominio
    const companyName = domain
      ? domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1)
      : 'Desconocido';

    return {
      domain,
      companyName,
      logo,
      email: fromEmail
    };
  }

  // Limpiar cache (útil para desarrollo)
  clearCache() {
    this.cache.clear();
    console.log('🧹 Cache de logos limpiado');
  }

  // Agregar logo personalizado
  addCustomLogo(domain, logoUrl) {
    this.knownLogos[domain] = logoUrl;
    this.cache.delete(domain);
    console.log(`✅ Logo personalizado agregado para ${domain}`);
  }
}

module.exports = new LogoService();
