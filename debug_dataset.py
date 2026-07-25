import os
from PIL import Image
import numpy as np

# Check a few dataset images
dataset_path = r'Dataset photos\train\OSCC'
images = [f for f in os.listdir(dataset_path) if f.lower().endswith(('.jpg', '.png', '.jpeg'))][:3]

for img_name in images:
    img_path = os.path.join(dataset_path, img_name)
    img = Image.open(img_path).convert('RGB')
    pixels = np.array(img)
    
    print(f'\n{img_name}:')
    print(f'  Shape: {pixels.shape}')
    
    # Sample some pixel values
    h, w = pixels.shape[:2]
    sample_y, sample_x = h//2, w//2
    r, g, b = pixels[sample_y, sample_x]
    print(f'  Center pixel RGB: ({r}, {g}, {b})')
    
    # Check purple pixels (b > r and b > g)
    purple_mask = (pixels[:,:,2] > pixels[:,:,0]) & (pixels[:,:,2] > pixels[:,:,1])
    purple_count = np.sum(purple_mask)
    purple_ratio = purple_count / (h*w)
    
    # Check pink pixels (r > g)
    pink_mask = (pixels[:,:,0] > pixels[:,:,1])
    pink_count = np.sum(pink_mask)
    pink_ratio = pink_count / (h*w)
    
    print(f'  Purple ratio (b>r and b>g): {purple_ratio:.4f}')
    print(f'  Pink ratio (r>g): {pink_ratio:.4f}')
    
    # Find actual color ranges
    print(f'  R range: {pixels[:,:,0].min()}-{pixels[:,:,0].max()}')
    print(f'  G range: {pixels[:,:,1].min()}-{pixels[:,:,1].max()}')
    print(f'  B range: {pixels[:,:,2].min()}-{pixels[:,:,2].max()}')

# Also check normal images
print('\n\n=== NORMAL IMAGES ===')
dataset_path_normal = r'Dataset photos\train\Normal'
images_normal = [f for f in os.listdir(dataset_path_normal) if f.lower().endswith(('.jpg', '.png', '.jpeg'))][:3]

for img_name in images_normal:
    img_path = os.path.join(dataset_path_normal, img_name)
    img = Image.open(img_path).convert('RGB')
    pixels = np.array(img)
    
    print(f'\n{img_name}:')
    h, w = pixels.shape[:2]
    
    purple_mask = (pixels[:,:,2] > pixels[:,:,0]) & (pixels[:,:,2] > pixels[:,:,1])
    purple_ratio = np.sum(purple_mask) / (h*w)
    
    pink_mask = (pixels[:,:,0] > pixels[:,:,1])
    pink_ratio = np.sum(pink_mask) / (h*w)
    
    print(f'  Purple ratio: {purple_ratio:.4f}')
    print(f'  Pink ratio: {pink_ratio:.4f}')
    print(f'  R range: {pixels[:,:,0].min()}-{pixels[:,:,0].max()}')
    print(f'  G range: {pixels[:,:,1].min()}-{pixels[:,:,1].max()}')
    print(f'  B range: {pixels[:,:,2].min()}-{pixels[:,:,2].max()}')
