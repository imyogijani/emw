# Image Upload System Test Guide

## Overview
The new database-based image storage system has been implemented with the following features:

### Key Improvements
1. **Original Filename Preservation**: Images now keep their original names (sanitized)
2. **Database Storage**: All image metadata is stored in MongoDB collections
3. **Separate Collections**: 
   - `CategoryImage` for category images
   - `SellerImage` for seller-side images  
   - `AdminImage` for admin-side images
4. **Environment-Aware URLs**: Automatic URL generation based on environment

## Testing the System

### 1. Test Category Image Upload
```bash
# Using curl to test category image upload
curl -X POST http://localhost:8080/api/category \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "name=Test Category" \
  -F "image=@/path/to/your/image.png"
```

### 2. Test Image Retrieval
```bash
# Get category images
curl http://localhost:8080/api/images/category/CATEGORY_ID

# Get image by filename
curl http://localhost:8080/api/images/filename/your-image.png
```

### 3. Frontend Integration
The frontend will now receive enhanced category data with `imageInfo` object:
```json
{
  "_id": "category_id",
  "name": "Category Name",
  "image": "/uploads/categories/image.png",
  "imageInfo": {
    "id": "image_record_id",
    "originalName": "original-image-name.png",
    "url": "http://localhost:8080/uploads/categories/image.png",
    "metadata": {
      "description": "Image description",
      "alt": "Alt text"
    }
  }
}
```

## Database Collections

### CategoryImage Schema
- `originalName`: Original filename
- `filename`: Sanitized filename
- `path`: File system path
- `url`: Complete URL for frontend
- `categoryId`: Reference to category
- `isActive`: Soft delete flag
- `metadata`: Additional image info

### API Endpoints
- `GET /api/images/category/:categoryId` - Get category images
- `GET /api/images/seller/:sellerId` - Get seller images
- `GET /api/images/admin` - Get admin images
- `GET /api/images/filename/:filename` - Get image by filename
- `PUT /api/images/metadata/:imageId` - Update image metadata
- `DELETE /api/images/soft/:imageId` - Soft delete image
- `DELETE /api/images/permanent/:imageId` - Permanently delete image (admin)
- `POST /api/images/cleanup` - Cleanup orphaned images (admin)

## Benefits
1. **No More 404 Errors**: Database ensures image references are valid
2. **Better Organization**: Separate collections for different image types
3. **Metadata Support**: Store descriptions, alt text, dimensions
4. **Soft Delete**: Images can be deactivated without losing data
5. **Cleanup Tools**: Automatic orphaned image cleanup
6. **Original Names**: Files keep their original names for better SEO
7. **Environment Aware**: URLs automatically adjust for dev/prod

## Migration Notes
- Existing images will continue to work via fallback mechanism
- New uploads will use the database system
- Frontend components already updated to use environment-aware URLs