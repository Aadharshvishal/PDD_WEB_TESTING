export function evaluateOralImagePixels(pixels, width, height) {
  const totalPixels = width * height;
  let hePixels = 0; // Hematoxylin & Eosin pixels

  for (let index = 0; index < pixels.length; index += 4) {
    const r = pixels[index];
    const g = pixels[index + 1];
    const b = pixels[index + 2];

    // H&E Stains (Pink and Purple) typically have very low Green absorption.
    // Therefore, both Red and Blue are significantly higher than Green.
    // Skin/Faces, on the other hand, have Red > Green > Blue (Blue is lowest).
    if (b > g + 10 && r > g + 10) {
      hePixels += 1;
    }
  }

  const heRatio = hePixels / totalPixels;
  console.log(`[VALIDATION DEBUG] H&E Ratio: ${heRatio.toFixed(4)}`);

  // Require a significant portion of the image to be H&E stained (e.g., > 5%)
  const acceptable = heRatio >= 0.05;

  return {
    acceptable,
    heRatio,
    reason: acceptable
      ? null
      : 'Image does not appear to be a histopathology tissue slide. Please upload an H&E stained microscopy image.'
  };
}
