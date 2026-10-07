const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require('sharp');

const root = path.resolve(__dirname, '..');
const appMaster = path.join(root, 'public/brand/styleport/app/styleport-app-1024.png');

async function buildSocialCard() {
  const width = 1200;
  const height = 630;
  const background = Buffer.from(`
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="mint" cx="0" cy="0" r="1" gradientTransform="translate(90 40) rotate(35) scale(520 360)" gradientUnits="userSpaceOnUse">
          <stop stop-color="#5EEAD4" stop-opacity=".24"/>
          <stop offset="1" stop-color="#5EEAD4" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="violet" cx="0" cy="0" r="1" gradientTransform="translate(1120 560) rotate(-145) scale(620 420)" gradientUnits="userSpaceOnUse">
          <stop stop-color="#8B5CF6" stop-opacity=".36"/>
          <stop offset="1" stop-color="#8B5CF6" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="rule" x1="0" x2="1">
          <stop offset="0" stop-color="#5EEAD4"/>
          <stop offset=".58" stop-color="#8B5CF6"/>
          <stop offset="1" stop-color="#FB7185"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="630" fill="#111522"/>
      <rect width="1200" height="630" fill="url(#mint)"/>
      <rect width="1200" height="630" fill="url(#violet)"/>
      <rect x="50" y="48" width="1100" height="4" rx="2" fill="url(#rule)"/>
      <text x="555" y="254" fill="#FFFFFF" font-family="Manrope, Arial, sans-serif" font-size="86" font-weight="800" letter-spacing="-4">StylePort</text>
      <text x="558" y="318" fill="#B9C1D0" font-family="Manrope, Arial, sans-serif" font-size="30" font-weight="500">UserCSS for Safari</text>
      <text x="558" y="426" fill="#5EEAD4" font-family="Manrope, Arial, sans-serif" font-size="24" font-weight="700" letter-spacing="2">THE WEB, WEARING YOUR COLORS.</text>
      <text x="558" y="486" fill="#8993A8" font-family="Manrope, Arial, sans-serif" font-size="23" font-weight="500">Free · Open source · Private by design</text>
    </svg>
  `);
  const icon = await sharp(appMaster)
    .resize(430, 430, { fit: 'contain' })
    .png()
    .toBuffer();
  const socialCard = await sharp(background)
    .composite([{ input: icon, left: 78, top: 108 }])
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();
  await Promise.all([
    fs.writeFile(path.join(root, 'public/social/styleport-og-20261007-full-bleed.png'), socialCard),
    fs.writeFile(path.join(root, 'public/og.png'), socialCard),
  ]);
}

async function main() {
  await buildSocialCard();
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
