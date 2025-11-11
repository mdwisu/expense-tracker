const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '../public/icon.svg');
const publicPath = path.join(__dirname, '../public');

async function generateIcons() {
  console.log('🎨 Generating PWA icons...');

  const svgBuffer = fs.readFileSync(svgPath);

  // Generate 192x192
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicPath, 'icon-192.png'));
  console.log('✅ Generated icon-192.png');

  // Generate 512x512
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicPath, 'icon-512.png'));
  console.log('✅ Generated icon-512.png');

  // Generate 180x180 for iOS
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicPath, 'apple-touch-icon.png'));
  console.log('✅ Generated apple-touch-icon.png');

  // Generate favicon
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(path.join(publicPath, 'favicon-32x32.png'));
  console.log('✅ Generated favicon-32x32.png');

  await sharp(svgBuffer)
    .resize(16, 16)
    .png()
    .toFile(path.join(publicPath, 'favicon-16x16.png'));
  console.log('✅ Generated favicon-16x16.png');

  console.log('🎉 All icons generated successfully!');
}

generateIcons().catch(console.error);
