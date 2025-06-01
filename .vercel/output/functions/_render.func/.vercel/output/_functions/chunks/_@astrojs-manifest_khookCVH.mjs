import 'cookie';
import { bold, red, yellow, dim, blue } from 'kleur/colors';
import './astro/server_Dx38DLQz.mjs';
import 'clsx';
import 'html-escaper';
import { compile } from 'path-to-regexp';

const dateTimeFormat = new Intl.DateTimeFormat([], {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false
});
const levels = {
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  silent: 90
};
function log(opts, level, label, message, newLine = true) {
  const logLevel = opts.level;
  const dest = opts.dest;
  const event = {
    label,
    level,
    message,
    newLine
  };
  if (!isLogLevelEnabled(logLevel, level)) {
    return;
  }
  dest.write(event);
}
function isLogLevelEnabled(configuredLogLevel, level) {
  return levels[configuredLogLevel] <= levels[level];
}
function info(opts, label, message, newLine = true) {
  return log(opts, "info", label, message, newLine);
}
function warn(opts, label, message, newLine = true) {
  return log(opts, "warn", label, message, newLine);
}
function error(opts, label, message, newLine = true) {
  return log(opts, "error", label, message, newLine);
}
function debug(...args) {
  if ("_astroGlobalDebug" in globalThis) {
    globalThis._astroGlobalDebug(...args);
  }
}
function getEventPrefix({ level, label }) {
  const timestamp = `${dateTimeFormat.format(/* @__PURE__ */ new Date())}`;
  const prefix = [];
  if (level === "error" || level === "warn") {
    prefix.push(bold(timestamp));
    prefix.push(`[${level.toUpperCase()}]`);
  } else {
    prefix.push(timestamp);
  }
  if (label) {
    prefix.push(`[${label}]`);
  }
  if (level === "error") {
    return red(prefix.join(" "));
  }
  if (level === "warn") {
    return yellow(prefix.join(" "));
  }
  if (prefix.length === 1) {
    return dim(prefix[0]);
  }
  return dim(prefix[0]) + " " + blue(prefix.splice(1).join(" "));
}
if (typeof process !== "undefined") {
  let proc = process;
  if ("argv" in proc && Array.isArray(proc.argv)) {
    if (proc.argv.includes("--verbose")) ; else if (proc.argv.includes("--silent")) ; else ;
  }
}
class Logger {
  options;
  constructor(options) {
    this.options = options;
  }
  info(label, message, newLine = true) {
    info(this.options, label, message, newLine);
  }
  warn(label, message, newLine = true) {
    warn(this.options, label, message, newLine);
  }
  error(label, message, newLine = true) {
    error(this.options, label, message, newLine);
  }
  debug(label, ...messages) {
    debug(label, ...messages);
  }
  level() {
    return this.options.level;
  }
  forkIntegrationLogger(label) {
    return new AstroIntegrationLogger(this.options, label);
  }
}
class AstroIntegrationLogger {
  options;
  label;
  constructor(logging, label) {
    this.options = logging;
    this.label = label;
  }
  /**
   * Creates a new logger instance with a new label, but the same log options.
   */
  fork(label) {
    return new AstroIntegrationLogger(this.options, label);
  }
  info(message) {
    info(this.options, this.label, message);
  }
  warn(message) {
    warn(this.options, this.label, message);
  }
  error(message) {
    error(this.options, this.label, message);
  }
  debug(message) {
    debug(this.label, message);
  }
}

function sanitizeParams(params) {
  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => {
      if (typeof value === "string") {
        return [key, value.normalize().replace(/#/g, "%23").replace(/\?/g, "%3F")];
      }
      return [key, value];
    })
  );
}
function getRouteGenerator(segments, addTrailingSlash) {
  const template = segments.map((segment) => {
    return "/" + segment.map((part) => {
      if (part.spread) {
        return `:${part.content.slice(3)}(.*)?`;
      } else if (part.dynamic) {
        return `:${part.content}`;
      } else {
        return part.content.normalize().replace(/\?/g, "%3F").replace(/#/g, "%23").replace(/%5B/g, "[").replace(/%5D/g, "]").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      }
    }).join("");
  }).join("");
  let trailing = "";
  if (addTrailingSlash === "always" && segments.length) {
    trailing = "/";
  }
  const toPath = compile(template + trailing);
  return (params) => {
    const sanitizedParams = sanitizeParams(params);
    const path = toPath(sanitizedParams);
    return path || "/";
  };
}

function deserializeRouteData(rawRouteData) {
  return {
    route: rawRouteData.route,
    type: rawRouteData.type,
    pattern: new RegExp(rawRouteData.pattern),
    params: rawRouteData.params,
    component: rawRouteData.component,
    generate: getRouteGenerator(rawRouteData.segments, rawRouteData._meta.trailingSlash),
    pathname: rawRouteData.pathname || void 0,
    segments: rawRouteData.segments,
    prerender: rawRouteData.prerender,
    redirect: rawRouteData.redirect,
    redirectRoute: rawRouteData.redirectRoute ? deserializeRouteData(rawRouteData.redirectRoute) : void 0,
    fallbackRoutes: rawRouteData.fallbackRoutes.map((fallback) => {
      return deserializeRouteData(fallback);
    }),
    isIndex: rawRouteData.isIndex
  };
}

function deserializeManifest(serializedManifest) {
  const routes = [];
  for (const serializedRoute of serializedManifest.routes) {
    routes.push({
      ...serializedRoute,
      routeData: deserializeRouteData(serializedRoute.routeData)
    });
    const route = serializedRoute;
    route.routeData = deserializeRouteData(serializedRoute.routeData);
  }
  const assets = new Set(serializedManifest.assets);
  const componentMetadata = new Map(serializedManifest.componentMetadata);
  const inlinedScripts = new Map(serializedManifest.inlinedScripts);
  const clientDirectives = new Map(serializedManifest.clientDirectives);
  return {
    // in case user middleware exists, this no-op middleware will be reassigned (see plugin-ssr.ts)
    middleware(_, next) {
      return next();
    },
    ...serializedManifest,
    assets,
    componentMetadata,
    inlinedScripts,
    clientDirectives,
    routes
  };
}

const manifest = deserializeManifest({"adapterName":"@astrojs/vercel/serverless","routes":[{"file":"admin/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/admin","isIndex":false,"type":"page","pattern":"^\\/admin\\/?$","segments":[[{"content":"admin","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/admin.astro","pathname":"/admin","prerender":true,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"api/auth/auth","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/auth/auth","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/auth\\/auth\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"auth","dynamic":false,"spread":false}],[{"content":"auth","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/auth/auth.ts","pathname":"/api/auth/auth","prerender":true,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[{"type":"external","value":"/_astro/page.C66G14YQ.js"}],"styles":[],"routeData":{"type":"endpoint","isIndex":false,"route":"/_image","pattern":"^\\/_image$","segments":[[{"content":"_image","dynamic":false,"spread":false}]],"params":[],"component":"node_modules/astro/dist/assets/endpoint/generic.js","pathname":"/_image","prerender":false,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[{"type":"external","value":"/_astro/page.C66G14YQ.js"}],"styles":[],"routeData":{"route":"/api/contact/mailgun","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/contact\\/mailgun\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"contact","dynamic":false,"spread":false}],[{"content":"mailgun","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/contact/mailgun.ts","pathname":"/api/contact/mailgun","prerender":false,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[{"type":"external","value":"/_astro/page.C66G14YQ.js"}],"styles":[],"routeData":{"route":"/api/contact/postmark","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/contact\\/postmark\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"contact","dynamic":false,"spread":false}],[{"content":"postmark","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/contact/postmark.ts","pathname":"/api/contact/postmark","prerender":false,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[{"type":"external","value":"/_astro/page.C66G14YQ.js"}],"styles":[],"routeData":{"route":"/api/contact/slack","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/contact\\/slack\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"contact","dynamic":false,"spread":false}],[{"content":"slack","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/contact/slack.ts","pathname":"/api/contact/slack","prerender":false,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[{"type":"external","value":"/_astro/page.C66G14YQ.js"}],"styles":[],"routeData":{"route":"/api/newsletter/mailchimp","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/newsletter\\/mailchimp\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"newsletter","dynamic":false,"spread":false}],[{"content":"mailchimp","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/newsletter/mailchimp.ts","pathname":"/api/newsletter/mailchimp","prerender":false,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}}],"site":"https://starfunnel.unfolding.io","base":"/","trailingSlash":"ignore","compressHTML":true,"componentMetadata":[["C:/Users/Pipedev/Downloads/StarFunnel-master/La-Comarca/src/pages/images/[slug].astro",{"propagation":"in-tree","containsHead":true}],["\u0000@astro-page:src/pages/images/[slug]@_@astro",{"propagation":"in-tree","containsHead":false}],["\u0000@astrojs-ssr-virtual-entry",{"propagation":"in-tree","containsHead":false}],["C:/Users/Pipedev/Downloads/StarFunnel-master/La-Comarca/src/components/hero/HeroImage.astro",{"propagation":"in-tree","containsHead":false}],["C:/Users/Pipedev/Downloads/StarFunnel-master/La-Comarca/src/layouts/PageLayout.astro",{"propagation":"in-tree","containsHead":false}],["C:/Users/Pipedev/Downloads/StarFunnel-master/La-Comarca/src/pages/news/[...page].astro",{"propagation":"in-tree","containsHead":true}],["\u0000@astro-page:src/pages/news/[...page]@_@astro",{"propagation":"in-tree","containsHead":false}],["C:/Users/Pipedev/Downloads/StarFunnel-master/La-Comarca/src/pages/news/[...slug].astro",{"propagation":"in-tree","containsHead":true}],["\u0000@astro-page:src/pages/news/[...slug]@_@astro",{"propagation":"in-tree","containsHead":false}],["C:/Users/Pipedev/Downloads/StarFunnel-master/La-Comarca/src/pages/news/tag/[...slug].astro",{"propagation":"in-tree","containsHead":true}],["\u0000@astro-page:src/pages/news/tag/[...slug]@_@astro",{"propagation":"in-tree","containsHead":false}],["C:/Users/Pipedev/Downloads/StarFunnel-master/La-Comarca/src/components/hero/HeroFunnel.astro",{"propagation":"in-tree","containsHead":false}],["C:/Users/Pipedev/Downloads/StarFunnel-master/La-Comarca/src/layouts/PageLayoutFunnel.astro",{"propagation":"in-tree","containsHead":false}],["C:/Users/Pipedev/Downloads/StarFunnel-master/La-Comarca/src/pages/[...slug].astro",{"propagation":"in-tree","containsHead":true}],["\u0000@astro-page:src/pages/[...slug]@_@astro",{"propagation":"in-tree","containsHead":false}],["C:/Users/Pipedev/Downloads/StarFunnel-master/La-Comarca/src/components/mdx/MdxImg.astro",{"propagation":"in-tree","containsHead":false}],["C:/Users/Pipedev/Downloads/StarFunnel-master/La-Comarca/src/content/_components.ts",{"propagation":"in-tree","containsHead":false}],["C:/Users/Pipedev/Downloads/StarFunnel-master/La-Comarca/src/content/blog/lombricompost-100-orgánico.mdx",{"propagation":"in-tree","containsHead":false}],["C:/Users/Pipedev/Downloads/StarFunnel-master/La-Comarca/src/content/blog/lombricompost-100-orgánico.mdx?astroPropagatedAssets",{"propagation":"in-tree","containsHead":false}],["\u0000astro:content",{"propagation":"in-tree","containsHead":false}],["C:/Users/Pipedev/Downloads/StarFunnel-master/La-Comarca/src/components/BaseHead.astro",{"propagation":"in-tree","containsHead":false}],["C:/Users/Pipedev/Downloads/StarFunnel-master/La-Comarca/src/layouts/BaseLayout.astro",{"propagation":"in-tree","containsHead":false}],["C:/Users/Pipedev/Downloads/StarFunnel-master/La-Comarca/src/components/Footer.astro",{"propagation":"in-tree","containsHead":false}],["C:/Users/Pipedev/Downloads/StarFunnel-master/La-Comarca/src/components/block/AnnoyingPopup.astro",{"propagation":"in-tree","containsHead":false}],["C:/Users/Pipedev/Downloads/StarFunnel-master/La-Comarca/src/components/block/Block.astro",{"propagation":"in-tree","containsHead":false}],["C:/Users/Pipedev/Downloads/StarFunnel-master/La-Comarca/src/components/block/RecentItems.astro",{"propagation":"in-tree","containsHead":false}],["C:/Users/Pipedev/Downloads/StarFunnel-master/La-Comarca/src/content/config/about.mdx",{"propagation":"in-tree","containsHead":false}],["C:/Users/Pipedev/Downloads/StarFunnel-master/La-Comarca/src/content/config/about.mdx?astroPropagatedAssets",{"propagation":"in-tree","containsHead":false}],["C:/Users/Pipedev/Downloads/StarFunnel-master/La-Comarca/src/content/config/blog.mdx",{"propagation":"in-tree","containsHead":false}],["C:/Users/Pipedev/Downloads/StarFunnel-master/La-Comarca/src/content/config/blog.mdx?astroPropagatedAssets",{"propagation":"in-tree","containsHead":false}],["C:/Users/Pipedev/Downloads/StarFunnel-master/La-Comarca/src/content/config/contact.mdx",{"propagation":"in-tree","containsHead":false}],["C:/Users/Pipedev/Downloads/StarFunnel-master/La-Comarca/src/content/config/contact.mdx?astroPropagatedAssets",{"propagation":"in-tree","containsHead":false}],["C:/Users/Pipedev/Downloads/StarFunnel-master/La-Comarca/src/content/config/navigation.mdx",{"propagation":"in-tree","containsHead":false}],["C:/Users/Pipedev/Downloads/StarFunnel-master/La-Comarca/src/content/config/navigation.mdx?astroPropagatedAssets",{"propagation":"in-tree","containsHead":false}],["C:/Users/Pipedev/Downloads/StarFunnel-master/La-Comarca/src/content/config/style.mdx",{"propagation":"in-tree","containsHead":false}],["C:/Users/Pipedev/Downloads/StarFunnel-master/La-Comarca/src/content/config/style.mdx?astroPropagatedAssets",{"propagation":"in-tree","containsHead":false}],["C:/Users/Pipedev/Downloads/StarFunnel-master/La-Comarca/src/content/page/index.mdx",{"propagation":"in-tree","containsHead":false}],["C:/Users/Pipedev/Downloads/StarFunnel-master/La-Comarca/src/content/page/index.mdx?astroPropagatedAssets",{"propagation":"in-tree","containsHead":false}],["C:/Users/Pipedev/Downloads/StarFunnel-master/La-Comarca/src/pages/admin.astro",{"propagation":"none","containsHead":true}],["C:/Users/Pipedev/Downloads/StarFunnel-master/La-Comarca/src/components/block/ImageGallery.astro",{"propagation":"in-tree","containsHead":false}],["C:/Users/Pipedev/Downloads/StarFunnel-master/La-Comarca/src/components/cards/ItemCard.astro",{"propagation":"in-tree","containsHead":false}],["C:/Users/Pipedev/Downloads/StarFunnel-master/La-Comarca/src/components/navigation/ItemNav.astro",{"propagation":"in-tree","containsHead":false}],["C:/Users/Pipedev/Downloads/StarFunnel-master/La-Comarca/src/components/Header.astro",{"propagation":"in-tree","containsHead":false}]],"renderers":[],"clientDirectives":[["idle","(()=>{var i=t=>{let e=async()=>{await(await t())()};\"requestIdleCallback\"in window?window.requestIdleCallback(e):setTimeout(e,200)};(self.Astro||(self.Astro={})).idle=i;window.dispatchEvent(new Event(\"astro:idle\"));})();"],["load","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).load=e;window.dispatchEvent(new Event(\"astro:load\"));})();"],["media","(()=>{var s=(i,t)=>{let a=async()=>{await(await i())()};if(t.value){let e=matchMedia(t.value);e.matches?a():e.addEventListener(\"change\",a,{once:!0})}};(self.Astro||(self.Astro={})).media=s;window.dispatchEvent(new Event(\"astro:media\"));})();"],["only","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).only=e;window.dispatchEvent(new Event(\"astro:only\"));})();"],["visible","(()=>{var l=(s,i,o)=>{let r=async()=>{await(await s())()},t=typeof i.value==\"object\"?i.value:void 0,c={rootMargin:t==null?void 0:t.rootMargin},n=new IntersectionObserver(e=>{for(let a of e)if(a.isIntersecting){n.disconnect(),r();break}},c);for(let e of o.children)n.observe(e)};(self.Astro||(self.Astro={})).visible=l;window.dispatchEvent(new Event(\"astro:visible\"));})();"]],"entryModules":{"\u0000@astro-page:node_modules/astro/dist/assets/endpoint/generic@_@js":"pages/_image.astro.mjs","\u0000@astro-page:src/pages/admin@_@astro":"pages/admin.astro.mjs","\u0000@astro-page:src/pages/api/auth/auth@_@ts":"pages/api/auth/auth.astro.mjs","\u0000@astro-page:src/pages/api/contact/mailgun@_@ts":"pages/api/contact/mailgun.astro.mjs","\u0000@astro-page:src/pages/api/contact/postmark@_@ts":"pages/api/contact/postmark.astro.mjs","\u0000@astro-page:src/pages/api/contact/slack@_@ts":"pages/api/contact/slack.astro.mjs","\u0000@astro-page:src/pages/api/newsletter/mailchimp@_@ts":"pages/api/newsletter/mailchimp.astro.mjs","\u0000@astro-page:src/pages/images/[slug]@_@astro":"pages/images/_slug_.astro.mjs","\u0000@astro-page:src/pages/news/tag/[...slug]@_@astro":"pages/news/tag/_---slug_.astro.mjs","\u0000@astro-page:src/pages/news/[...page]@_@astro":"pages/news/_---page_.astro.mjs","\u0000@astro-page:src/pages/news/[...slug]@_@astro":"pages/news/_---slug_.astro.mjs","\u0000@astro-page:src/pages/[...slug]@_@astro":"pages/_---slug_.astro.mjs","\u0000noop-middleware":"_noop-middleware.mjs","\u0000@astrojs-ssr-virtual-entry":"entry.mjs","\u0000@astro-renderers":"renderers.mjs","/src/pages/api/auth/auth.ts":"chunks/auth_l0sNRNKZ.mjs","/src/pages/api/contact/mailgun.ts":"chunks/mailgun_BPokCWhl.mjs","/src/pages/api/contact/postmark.ts":"chunks/postmark_CJF-l-GB.mjs","/src/pages/api/contact/slack.ts":"chunks/slack_46_oXSVb.mjs","/src/pages/api/newsletter/mailchimp.ts":"chunks/mailchimp__EfGKwYk.mjs","/src/pages/news/tag/[...slug].astro":"chunks/_...slug__DNuzyWpM.mjs","/src/pages/news/[...page].astro":"chunks/_...page__DJANGQZ2.mjs","C:/Users/Pipedev/Downloads/StarFunnel-master/La-Comarca/src/assets/hero-fonndo.jpg":"chunks/hero-fonndo_ChJiZ14b.mjs","C:/Users/Pipedev/Downloads/StarFunnel-master/La-Comarca/src/assets/hero-imagen-video.jpg":"chunks/hero-imagen-video_CufVbTqk.mjs","C:/Users/Pipedev/Downloads/StarFunnel-master/La-Comarca/src/assets/lombricompoz.png":"chunks/lombricompoz_D89aXPAs.mjs","C:/Users/Pipedev/Downloads/StarFunnel-master/La-Comarca/src/assets/organicos-la-comarca.png":"chunks/organicos-la-comarca_BFn0czRf.mjs","C:/Users/Pipedev/Downloads/StarFunnel-master/La-Comarca/src/assets/producto-image-lombricompost.jpg":"chunks/producto-image-lombricompost_W90no_4t.mjs","C:/Users/Pipedev/Downloads/StarFunnel-master/La-Comarca/src/assets/video-hero.mp4":"chunks/video-hero__bgQcMlz.mjs","C:/Users/Pipedev/Downloads/StarFunnel-master/La-Comarca/src/content/blog/lombricompost-100-orgánico.mdx?astroContentCollectionEntry=true":"chunks/lombricompost-100-orgánico_BH7k4BSc.mjs","C:/Users/Pipedev/Downloads/StarFunnel-master/La-Comarca/src/content/config/about.mdx?astroContentCollectionEntry=true":"chunks/about_Cfr0tfuU.mjs","C:/Users/Pipedev/Downloads/StarFunnel-master/La-Comarca/src/content/config/blog.mdx?astroContentCollectionEntry=true":"chunks/blog_CQrxh4m9.mjs","C:/Users/Pipedev/Downloads/StarFunnel-master/La-Comarca/src/content/config/contact.mdx?astroContentCollectionEntry=true":"chunks/contact_56sYO4Du.mjs","C:/Users/Pipedev/Downloads/StarFunnel-master/La-Comarca/src/content/config/navigation.mdx?astroContentCollectionEntry=true":"chunks/navigation_D0Ma1Xn9.mjs","C:/Users/Pipedev/Downloads/StarFunnel-master/La-Comarca/src/content/config/style.mdx?astroContentCollectionEntry=true":"chunks/style_B3hthzt5.mjs","C:/Users/Pipedev/Downloads/StarFunnel-master/La-Comarca/src/content/page/index.mdx?astroContentCollectionEntry=true":"chunks/index_c9fHu6Rh.mjs","C:/Users/Pipedev/Downloads/StarFunnel-master/La-Comarca/src/content/blog/lombricompost-100-orgánico.mdx?astroPropagatedAssets":"chunks/lombricompost-100-orgánico_DO-IEzaD.mjs","C:/Users/Pipedev/Downloads/StarFunnel-master/La-Comarca/src/content/config/about.mdx?astroPropagatedAssets":"chunks/about_DorIw9WO.mjs","C:/Users/Pipedev/Downloads/StarFunnel-master/La-Comarca/src/content/config/blog.mdx?astroPropagatedAssets":"chunks/blog_ASPL769i.mjs","C:/Users/Pipedev/Downloads/StarFunnel-master/La-Comarca/src/content/config/contact.mdx?astroPropagatedAssets":"chunks/contact_D4c6HZEb.mjs","C:/Users/Pipedev/Downloads/StarFunnel-master/La-Comarca/src/content/config/navigation.mdx?astroPropagatedAssets":"chunks/navigation_DizX7GBY.mjs","C:/Users/Pipedev/Downloads/StarFunnel-master/La-Comarca/src/content/config/style.mdx?astroPropagatedAssets":"chunks/style_D2LVz6h-.mjs","C:/Users/Pipedev/Downloads/StarFunnel-master/La-Comarca/src/content/page/index.mdx?astroPropagatedAssets":"chunks/index_CAELoVvL.mjs","C:/Users/Pipedev/Downloads/StarFunnel-master/La-Comarca/src/content/blog/lombricompost-100-orgánico.mdx":"chunks/lombricompost-100-orgánico_CEAPzb9Z.mjs","C:/Users/Pipedev/Downloads/StarFunnel-master/La-Comarca/src/content/config/about.mdx":"chunks/about_CfXmPtap.mjs","C:/Users/Pipedev/Downloads/StarFunnel-master/La-Comarca/src/content/config/blog.mdx":"chunks/blog_CMG5HVgF.mjs","C:/Users/Pipedev/Downloads/StarFunnel-master/La-Comarca/src/content/config/contact.mdx":"chunks/contact_BdmG8CiZ.mjs","C:/Users/Pipedev/Downloads/StarFunnel-master/La-Comarca/src/content/config/navigation.mdx":"chunks/navigation_1FltVED0.mjs","C:/Users/Pipedev/Downloads/StarFunnel-master/La-Comarca/src/content/config/style.mdx":"chunks/style_BuLfXCVU.mjs","C:/Users/Pipedev/Downloads/StarFunnel-master/La-Comarca/src/content/page/index.mdx":"chunks/index_Cy6pHJOc.mjs","/node_modules/astro/dist/assets/endpoint/generic.js":"chunks/generic_V2WqG4HD.mjs","/src/pages/images/[slug].astro":"chunks/_slug__DxuoNgyR.mjs","/src/pages/news/[...slug].astro":"chunks/_...slug__CMhUKiQr.mjs","/src/pages/[...slug].astro":"chunks/_...slug__Du338jjp.mjs","C:/Users/Pipedev/Downloads/StarFunnel-master/La-Comarca/src/image-service/image-service.ts":"chunks/image-service_B9RoDD7Z.mjs","/src/pages/admin.astro":"chunks/admin_Cnt9efsf.mjs","\u0000@astrojs-manifest":"manifest_DBCw0U-U.mjs","astro:scripts/page.js":"_astro/page.C66G14YQ.js","/astro/hoisted.js?q=0":"_astro/hoisted.CuKSjmrg.js","@components/navigation/ImageNav.vue":"_astro/ImageNav.N_vgOL6E.js","@components/media/VideoDialogBtn.vue":"_astro/VideoDialogBtn.BczzjjIO.js","@components/common/FaqItem.vue":"_astro/FaqItem.DknA24jF.js","@components/dialog/Popup.vue":"_astro/Popup.TjKrYDku.js","@components/navigation/NavMobile.vue":"_astro/NavMobile.CeTSQzaS.js","@components/common/ColorSwitch.vue":"_astro/ColorSwitch.DhjIsA5w.js","@components/common/Intersecting.vue":"_astro/Intersecting.CGy3uAUa.js","@components/dialog/Dialog.vue":"_astro/Dialog.CZY9hPiO.js","@components/form/Newsletter.vue":"_astro/Newsletter.09__kVOm.js","@components/media/VideoInline.vue":"_astro/VideoInline.CVDN0iUH.js","@astrojs/vue/client.js":"_astro/client.A9bF3qJL.js","@components/form/Auth.vue":"_astro/Auth.DBqEgxjU.js","@components/common/Init.vue":"_astro/Init.dfSpYvZK.js","@components/form/Contact.vue":"_astro/Contact.CgRtRK-5.js","@components/media/PanZoom.vue":"_astro/PanZoom.BU0uUehH.js","/astro/hoisted.js?q=1":"_astro/hoisted.Ayu2u87P.js","@components/dialog/VideoDialog.vue":"_astro/VideoDialog.DtmCWG_Z.js","C:/Users/Pipedev/Downloads/StarFunnel-master/La-Comarca/node_modules/plyr/dist/plyr.min.mjs":"_astro/plyr.min.DTjjHomp.js","astro:scripts/before-hydration.js":""},"inlinedScripts":[],"assets":["/_astro/video-hero.Bew60qOy.mp4","/_astro/hero-imagen-video.BncYefSy.jpg","/_astro/hero-fonndo.BSoTYelc.jpg","/_astro/producto-image-lombricompost.p6z-Jk7F.jpg","/_astro/logo.BYx0UEGZ.svg","/_astro/news.C1HHuBWt.svg","/_astro/organicos-la-comarca.C9yWCPHd.png","/_astro/menu.LB34RTpz.svg","/_astro/page.DLd1T0Mp.svg","/_astro/portfolio.C4czYnP-.svg","/_astro/settings.C9Bdfzdn.svg","/_astro/shop.DHWHfpyH.svg","/_astro/lombricompoz.CjehrcRi.png","/_astro/dm-sans-latin-wght-normal.DeBecvsH.woff2","/_astro/dm-sans-latin-ext-wght-normal.D1bw2c55.woff2","/favicon.svg","/logo.svg","/scroll-timeline.js","/_headers","/icons/checkmark.svg","/icons/plyr.svg","/video/bob-bg.mp4","/video/feature-video.mp4","/video/hamster_coder.mp4","/video/video-hero.mp4","/screenshots/bymeacoffee.webp","/screenshots/screenshot_1.jpg","/screenshots/screenshot_2.jpg","/screenshots/screenshot_3.jpg","/screenshots/screenshot_4.jpg","/screenshots/screenshot_5.jpg","/screenshots/screenshot_6.jpg","/screenshots/screenshot_7.jpg","/screenshots/screenshot_8.jpg","/screenshots/screenshot_9.jpg","/_astro/Auth.DBqEgxjU.js","/_astro/bodyScrollLock.esm.CT-oBNdc.js","/_astro/client.A9bF3qJL.js","/_astro/ColorSwitch.DhjIsA5w.js","/_astro/Contact.CgRtRK-5.js","/_astro/Dialog.CZY9hPiO.js","/_astro/FaqItem.DknA24jF.js","/_astro/hoisted.Ayu2u87P.js","/_astro/hoisted.CuKSjmrg.js","/_astro/ImageNav.N_vgOL6E.js","/_astro/index.C3gK8y6v.js","/_astro/index.Cm2xnGYQ.js","/_astro/index.CxR5AyqT.js","/_astro/index.D_RYY94p.js","/_astro/index.PXxL51Wy.js","/_astro/Init.dfSpYvZK.js","/_astro/Intersecting.CGy3uAUa.js","/_astro/Loading.Dn9e7L4o.js","/_astro/NavMobile.CeTSQzaS.js","/_astro/Newsletter.09__kVOm.js","/_astro/page.C66G14YQ.js","/_astro/PanZoom.BU0uUehH.js","/_astro/plyr.min.DTjjHomp.js","/_astro/popper.esm.Cekn14Y_.js","/_astro/Popup.TjKrYDku.js","/_astro/store.D9UzEAUg.js","/_astro/translate.B06VLW-j.js","/_astro/VideoDialog.DtmCWG_Z.js","/_astro/VideoDialogBtn.BczzjjIO.js","/_astro/VideoInline.CVDN0iUH.js","/_astro/_page_.kd3mlC8L.css","/_astro/_plugin-vue_export-helper.DlAUqK2U.js","/_astro/_slug_.Dq5OgB2W.css","/_astro/page.C66G14YQ.js","/admin/index.html","/api/auth/auth"],"buildFormat":"directory","checkOrigin":false,"rewritingEnabled":false,"experimentalEnvGetSecretEnabled":false});

export { AstroIntegrationLogger as A, Logger as L, getEventPrefix as g, levels as l, manifest as m };
