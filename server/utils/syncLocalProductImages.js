import fs from 'fs';
import path from 'path';
import { Product } from '../models/Product.js';

const imageExtensions = new Set(['.avif', '.jpg', '.jpeg', '.png', '.webp']);

export const categoryMap = {
  accesories: { category: 'Accessories', subcategory: 'Accessories' },
  Certifield_Products: { category: 'Certified Products', subcategory: 'Certified Accessories' },
  Furniture: { category: 'Furniture', subcategory: 'All Furniture' },
  kitchen: { category: 'Kitchen', subcategory: 'All Kitchen Items' },
  lightning: { category: 'Lighting', subcategory: 'All Lighting' },
  Outdoor_living: { category: 'Outdoor Living', subcategory: 'All Outdoor Living Items' },
  rug: { category: 'Rugs', subcategory: 'All Rugs' },
  Sofas: { category: 'Sofas', subcategory: 'All Sofas' },
  spare_parts: { category: 'Spare Parts', subcategory: 'All Spare Parts' },
  Textiles: { category: 'Textiles', subcategory: 'All Textiles' },
};

const categoryFolderOrder = Object.entries(categoryMap).reduce((acc, [folderName, value]) => {
  acc[value.category] = folderName;
  return acc;
}, {});

const localImageCategoryFallback = {
  Highlights: 'Accessories',
};

function slugify(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export function titleCase(value) {
  return String(value || '')
    .replace(/\.[^.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function toAssetPath(imgRoot, filePath) {
  const relativePath = path.relative(imgRoot, filePath).split(path.sep).map(encodeURIComponent).join('/');
  return `/assets/img/${relativePath}`;
}

function getProductKey(imgRoot, filePath) {
  const folderName = path.relative(imgRoot, path.dirname(filePath)).split(path.sep)[0];
  const stem = path.basename(filePath, path.extname(filePath));
  const longCodes = stem.match(/\d{7,}/g);
  const key = longCodes?.[longCodes.length - 1] || stem.replace(/([_-])\d+([_-][a-z]+)?$/i, '');
  return `${folderName}:${key}`;
}

function sortImages(files) {
  return [...files].sort((a, b) => {
    const aStem = path.basename(a, path.extname(a));
    const bStem = path.basename(b, path.extname(b));
    const aIndex = Number(aStem.match(/(\d+)(?!.*\d)/)?.[1] || 0);
    const bIndex = Number(bStem.match(/(\d+)(?!.*\d)/)?.[1] || 0);
    return aIndex - bIndex || a.localeCompare(b);
  });
}

function getImageFiles(directory) {
  if (!fs.existsSync(directory)) return [];

  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return getImageFiles(fullPath);
    return imageExtensions.has(path.extname(entry.name).toLowerCase()) ? [fullPath] : [];
  });
}

function makeLocalProducts(projectRoot, imgRoot) {
  const imageFiles = getImageFiles(imgRoot);
  const productGroups = new Map();

  imageFiles.forEach((filePath) => {
    const key = getProductKey(imgRoot, filePath);
    const current = productGroups.get(key) || [];
    current.push(filePath);
    productGroups.set(key, current);
  });

  return Array.from(productGroups.entries()).map(([groupKey, files]) => {
    const sortedFiles = sortImages(files);
    const firstFile = sortedFiles[0];
    const folderName = path.relative(imgRoot, path.dirname(firstFile)).split(path.sep)[0];
    const rawProductKey = groupKey.split(':')[1];
    const categoryInfo = categoryMap[folderName] || { category: titleCase(folderName), subcategory: titleCase(folderName) };
    const productId = `img-${slugify(folderName)}-${slugify(rawProductKey)}`;
    const name = `${categoryInfo.category} ${titleCase(rawProductKey)}`;
    const images = sortedFiles.map((filePath) => toAssetPath(imgRoot, filePath));
    const imageUrl = images[0];

    return {
      productId,
      name,
      slug: slugify(productId),
      folderName,
      rawProductKey,
      matchKeys: [
        productId,
        slugify(productId),
        rawProductKey,
        slugify(rawProductKey),
        `${slugify(folderName)}-${slugify(rawProductKey)}`,
      ].filter(Boolean),
      category: categoryInfo.category,
      subcategory: categoryInfo.subcategory,
      images,
      imageUrl,
      inStock: true,
    };
  });
}

function productMatchKeys(product) {
  return [
    product.productId,
    String(product.productId || '').replace(/^img-/, ''),
    product.slug,
    product.name,
    product.details?.itemNumber,
  ]
    .filter(Boolean)
    .flatMap((value) => {
      const normalized = slugify(value);
      return [value, normalized, normalized.replace(/^img-/, '')];
    })
    .filter(Boolean);
}

function buildImageIndexes(localProducts) {
  const byCategory = new Map();
  const byKey = new Map();

  localProducts.forEach((localProduct) => {
    const categoryProducts = byCategory.get(localProduct.category) || [];
    categoryProducts.push(localProduct);
    byCategory.set(localProduct.category, categoryProducts);

    localProduct.matchKeys.forEach((key) => {
      byKey.set(slugify(key), localProduct);
    });
  });

  byCategory.forEach((categoryProducts, category) => {
    const folderName = categoryFolderOrder[category] || category;
    categoryProducts.sort((a, b) => {
      const aFolderIndex = a.productId.includes(slugify(folderName)) ? 0 : 1;
      const bFolderIndex = b.productId.includes(slugify(folderName)) ? 0 : 1;
      return aFolderIndex - bFolderIndex || a.productId.localeCompare(b.productId, undefined, { numeric: true });
    });
  });

  return { byCategory, byKey };
}

function findImageSource(product, imageIndexes, categoryIndexes) {
  for (const key of productMatchKeys(product)) {
    const imageSource = imageIndexes.byKey.get(slugify(key));
    if (imageSource) return imageSource;
  }

  const imageCategory = product.category in localImageCategoryFallback ? localImageCategoryFallback[product.category] : product.category;
  const categoryImages = imageIndexes.byCategory.get(imageCategory) || [];
  if (!categoryImages.length) return null;

  const categoryIndex = categoryIndexes.get(imageCategory) || 0;
  categoryIndexes.set(imageCategory, categoryIndex + 1);
  return categoryImages[categoryIndex % categoryImages.length];
}

export async function syncLocalProductImages({ projectRoot, imgRoot = path.join(projectRoot, 'img') }) {
  const products = makeLocalProducts(projectRoot, imgRoot);

  if (!products.length) {
    return { count: 0 };
  }

  const generatedNamesById = new Map(products.map((product) => [product.productId, product.name]));
  const productIds = products.map((product) => product.productId);
  const generatedProducts = await Product.find({ productId: { $in: productIds } }).select('productId name category').lean();
  const generatedProductIds = generatedProducts
    .filter((product) => product.name === generatedNamesById.get(product.productId))
    .map((product) => product.productId);

  if (generatedProductIds.length) {
    await Product.deleteMany({ productId: { $in: generatedProductIds } });
  }

  const existingProducts = await Product.find({ productId: { $nin: generatedProductIds } })
    .sort({ category: 1, productId: 1 })
    .select('productId slug name category details.itemNumber')
    .lean();

  const imageIndexes = buildImageIndexes(products);
  const categoryIndexes = new Map();
  const updateOperations = [];

  existingProducts.forEach((product) => {
    const imageSource = findImageSource(product, imageIndexes, categoryIndexes);
    if (!imageSource) return;

    updateOperations.push({
      updateOne: {
        filter: { productId: product.productId },
        update: {
          $set: {
            images: imageSource.images,
            imageUrl: imageSource.imageUrl,
            inStock: true,
            updatedAt: new Date(),
          },
        },
      },
    });
  });

  if (updateOperations.length) {
    await Product.bulkWrite(updateOperations);
  }

  return {
    count: products.length,
    updatedExistingCount: updateOperations.length,
    deletedGeneratedCount: generatedProductIds.length,
  };
}
