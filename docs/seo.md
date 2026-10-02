# StylePort search and social sharing

## What ships

- Unique page titles and descriptions for the home, roadmap, support, privacy, and press pages.
- Absolute HTTPS canonical URLs and a sitemap containing only those five indexable pages.
- Crawlable `noindex, follow` pages for `/thanks/`, `/404.html`, and the legacy `/updates/` redirect.
- Open Graph and X large-image card metadata, including image dimensions, MIME type, and alternative text.
- A 1200 × 630 PNG social card at `/social/styleport-og-20261002.png`. The dated path avoids reusing the old image URL in social caches. `/og.png` remains available for existing links.
- A 180 × 180 Apple touch icon and the existing square PNG favicon.
- JSON-LD for the website, each indexable page, and the developer. The homepage also describes the software application.
- A deferred below-the-fold homepage screenshot, with explicit dimensions and alternative text.
- Build-time checks for metadata, sitemap coverage, image dimensions, structured data, and broken internal links and anchors. The GitHub Pages workflow runs these before deployment.

`src/_data/site.json` holds the origin, shared description, developer identity, and social-image information. Each page owns its title and description in front matter. Set `noindex: true` on future utility pages; this controls both the robots meta tag and sitemap exclusion. Non-content outputs must stay excluded from collections.

`lib/seo.js` creates structured data with script-safe JSON serialization. Kyle Reddoch is represented as a Person and RelayByte as a Brand. The application remains explicitly in development, with no release version, download link, offer, review, or rating invented for search engines. SoftwareApplication markup is descriptive; it does not currently meet all of Google's software-app rich-result requirements. Add release information only when it is verified and visible on the page.

## Validation and publishing

1. Run `npm ci` and `npm test`. All checks must pass before publication.
2. Commit and push to `main` when ready to publish. The Pages workflow builds, validates, and deploys the site.
3. After successful deployment, verify the live home page, `/sitemap.xml`, `/robots.txt`, the new social image, and a missing route (which should return HTTP 404). Check the live HTML for the new metadata.
4. In the verified Google Search Console property, submit `https://styleport.app/sitemap.xml` and inspect the homepage. Submit or import the site in Bing Webmaster Tools as appropriate. Account ownership verification and sitemap submission are external steps; this code change does not perform them.
5. Use the [Schema.org validator](https://validator.schema.org/) to check the live graph and [Google's Rich Results Test](https://search.google.com/test/rich-results) to inspect Google-specific eligibility. Missing software-app ratings or offers are intentional while the app is unreleased.
6. Check the live URL with [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) and [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/). Refresh their caches after deployment. Preview an actual X share to confirm its rendering; this change does not publish a social post.

Search engines choose their own snippets and crawl schedules. A deployed sitemap and valid metadata do not guarantee indexing, rankings, rich results, or immediate social-cache refreshes.

## Social image source

Created with the built-in image generation tool using `public/styleport-icon.png` as the official icon reference. The generated output was resized to the exact 1200 × 630 delivery dimensions. The original `public/og.png` is preserved. The final project asset is `public/social/styleport-og-20261002.png`.

Generation prompt:

> Create a polished Open Graph social sharing card for StylePort, a Safari UserCSS manager. Use case: ads-marketing. Output landscape 1200 × 630 pixels (1.905:1). The input image is the official app icon, use it faithfully without recoloring or changing its shape. Visual design: refined editorial product card, warm off-white background #f7f3ed with deep navy text, restrained blue and lavender accents from the icon. Large official app icon on left, text on right, generous safe margins of at least 70 px around all important content. Exact text, no additional text: 'StylePort' large and bold; 'UserCSS for Safari' as clear secondary line; 'The web, wearing your colors.' as smaller tagline; 'styleport.app' near bottom right. Subtle abstract layered browser-window outlines as backdrop, no fake application screenshot, no other logos, no badges, no launch or availability claims. Extremely clean legible typography, modern Mac app brand, high contrast, minimal detail readable in small link previews.

## References

- [Open Graph metadata and image properties](https://ogp.me/)
- [Google's sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [Google's noindex guidance](https://developers.google.com/search/docs/crawling-indexing/block-indexing)
- [Google's structured-data policies](https://developers.google.com/search/docs/appearance/structured-data/sd-policies)
- [Google's software-app structured data](https://developers.google.com/search/docs/appearance/structured-data/software-app)
