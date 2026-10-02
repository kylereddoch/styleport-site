export function absoluteUrl(path, origin) {
  return new URL(path, `${origin}/`).href;
}

// JSON in a script element must not contain a literal closing script tag.
export function jsonLd(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
}

export function structuredData(site, title, description, pathname) {
  const home = absoluteUrl("/", site.url);
  const url = absoluteUrl(pathname, site.url);
  const websiteId = `${home}#website`;
  const developerId = `${home}#developer`;
  const appId = `${home}#app`;
  const graph = [
    {
      "@type": "WebSite", "@id": websiteId,
      url: home, name: site.name, description: site.description,
      inLanguage: "en-US", publisher: { "@id": developerId },
    },
    {
      "@type": "Person", "@id": developerId, name: site.developerName,
      brand: { "@type": "Brand", name: site.publisherBrand, url: site.publisherUrl },
    },
    {
      "@type": "WebPage", "@id": `${url}#webpage`, url,
      name: title, description: description || site.description,
      inLanguage: "en-US", isPartOf: { "@id": websiteId },
      primaryImageOfPage: {
        "@type": "ImageObject", url: absoluteUrl(site.socialImage.path, site.url),
        width: site.socialImage.width, height: site.socialImage.height,
        caption: site.socialImage.alt,
      },
      ...(pathname === "/" ? { mainEntity: { "@id": appId } } : {}),
    },
  ];

  if (pathname === "/") {
    graph.push({
      "@type": "SoftwareApplication", "@id": appId,
      name: site.name, url: home, description: site.description,
      applicationCategory: "UtilitiesApplication", operatingSystem: "macOS 14 or newer",
      softwareRequirements: "Safari", isAccessibleForFree: true,
      image: absoluteUrl("/styleport-icon.png", site.url),
      screenshot: absoluteUrl("/press/import-style.png", site.url),
      license: "https://www.gnu.org/licenses/gpl-3.0.html",
      author: { "@id": developerId }, publisher: { "@id": developerId },
      // The app is still in development: no offers, download URLs, or invented ratings.
      featureList: ["CSS and UserCSS import", "Configurable theme variables", "Website URL matching", "Style editing and backups"],
    });
  }
  return jsonLd({ "@context": "https://schema.org", "@graph": graph });
}
