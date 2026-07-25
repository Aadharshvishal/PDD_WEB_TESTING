from PIL import Image
import numpy as np

# Load a sample OSCC image
img = Image.open('Dataset photos/train/OSCC/OSCC_100x_1.jpg').convert('RGB')
img = img.resize((224, 224))
pixels = np.array(img)

print('=== OSCC Image Pixel Analysis ===')
print(f'Shape: {pixels.shape}')
print(f'Mean RGB: {pixels.mean(axis=(0,1))}')
print(f'Min RGB: {pixels.min(axis=(0,1))}')
print(f'Max RGB: {pixels.max(axis=(0,1))}')

# Analyze color distribution
total_pixels = pixels.shape[0] * pixels.shape[1]
purple_pixels = 0
pink_pixels = 0

for y in range(pixels.shape[0]):
    for x in range(pixels.shape[1]):
        r, g, b = pixels[y, x]
        # Purple nuclei: high red and blue, very low green
        if r >= 80 and b >= 100 and g <= 100 and b > g and r >= b - 20:
            purple_pixels += 1
        # Pink cytoplasm: high red, moderate blue, low green
        elif r >= 140 and b >= 80 and g <= 140 and r > g and (r - g) >= 40:
            pink_pixels += 1

print(f'\nCurrent validator finds:')
print(f'  Purple pixels: {purple_pixels} ({purple_pixels/total_pixels*100:.2f}%)')
print(f'  Pink pixels: {pink_pixels} ({pink_pixels/total_pixels*100:.2f}%)')
print(f'  Total stain: {(purple_pixels + pink_pixels)/total_pixels*100:.2f}%')

# Show some actual pixel values
print(f'\nSample pixels from OSCC image:')
for i in [50, 100, 150]:
    for j in [50, 100, 150]:
        r, g, b = pixels[i, j]
        print(f'  [{i},{j}]: R={r} G={g} B={b}')
