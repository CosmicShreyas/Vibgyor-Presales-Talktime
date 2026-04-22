# Brand Partner Image Upload API Documentation

## Overview
This document describes the image upload and management endpoints for brand partners. Brand partners can upload images associated with their leads, including metadata like title and tags.

## Image Storage
- Images are stored in the `server/images/` directory
- Image metadata is stored in MongoDB using the `LeadImage` model
- Maximum file size: 10MB
- Allowed formats: All image types (jpg, png, gif, webp, etc.)

## Authentication
All endpoints require JWT authentication with a brand partner token. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

## Endpoints

### 1. Upload Image

**Endpoint:** `POST /api/brand-partners/images/upload`

**Description:** Upload an image for a specific lead with title and tags.

**Content-Type:** `multipart/form-data`

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| image | File | Yes | Image file to upload (max 10MB) |
| leadUniqueId | String | Yes | Unique ID of the lead this image belongs to |
| title | String | Yes | Title/description of the image |
| tags | String | No | Comma-separated tags (e.g., "exterior,front-view,completed") |

**Example Request (using FormData in JavaScript):**
```javascript
const formData = new FormData();
formData.append('image', imageFile); // File object from input
formData.append('leadUniqueId', 'LEAD-12345');
formData.append('title', 'Property Front View');
formData.append('tags', 'exterior,front-view,completed');

const response = await fetch('/api/brand-partners/images/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "image": {
    "imageId": "IMG-VP001-1713724800000-123456",
    "title": "Property Front View",
    "tags": ["exterior", "front-view", "completed"],
    "leadName": "John Doe",
    "leadUniqueId": "LEAD-12345",
    "filename": "lead-1713724800000-123456.jpg",
    "size": 2048576,
    "uploadedAt": "2024-04-21T10:30:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Missing required fields or no image file
- `403 Forbidden`: Trying to upload image for another brand partner's lead
- `404 Not Found`: Lead with specified uniqueId not found
- `500 Server Error`: Server-side error

**Notes:**
- The image ID format is: `IMG-{partnerCode}-{timestamp}-{random}`
- Only the brand partner who owns the lead can upload images for it
- Tags are automatically trimmed and empty tags are filtered out
- If validation fails, the uploaded file is automatically deleted

---

### 2. Get All Images

**Endpoint:** `GET /api/brand-partners/images`

**Description:** Retrieve all images with metadata uploaded by the authenticated brand partner.

**Request:** No body required

**Example Request:**
```javascript
const response = await fetch('/api/brand-partners/images', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

**Success Response (200):**
```json
{
  "success": true,
  "count": 3,
  "images": [
    {
      "imageId": "IMG-VP001-1713724800000-123456",
      "title": "Property Front View",
      "tags": ["exterior", "front-view", "completed"],
      "leadName": "John Doe",
      "leadUniqueId": "LEAD-12345",
      "filename": "lead-1713724800000-123456.jpg",
      "size": 2048576,
      "uploadedAt": "2024-04-21T10:30:00.000Z"
    },
    {
      "imageId": "IMG-VP001-1713724900000-789012",
      "title": "Interior Living Room",
      "tags": ["interior", "living-room"],
      "leadName": "Jane Smith",
      "leadUniqueId": "LEAD-67890",
      "filename": "lead-1713724900000-789012.jpg",
      "size": 1536000,
      "uploadedAt": "2024-04-21T10:45:00.000Z"
    }
  ]
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing token
- `500 Server Error`: Server-side error

**Notes:**
- Images are sorted by upload date (most recent first)
- Only returns images uploaded by the authenticated brand partner
- Response includes metadata but not the actual image files

---

### 3. Get/Render Image File

**Endpoint:** `GET /api/brand-partners/images/:imageId`

**Description:** Retrieve and render the actual image file by imageId.

**Parameters:**
| Parameter | Type | Location | Description |
|-----------|------|----------|-------------|
| imageId | String | Path | The unique image ID |

**Example Request:**
```javascript
const response = await fetch('/api/brand-partners/images/IMG-VP001-1713724800000-123456', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Get the image as blob
const imageBlob = await response.blob();
const imageUrl = URL.createObjectURL(imageBlob);

// Use in img tag
document.getElementById('myImage').src = imageUrl;
```

**Example Usage in HTML:**
```html
<!-- Direct image display (requires token in header) -->
<img id="leadImage" alt="Lead Image" />

<script>
  async function loadImage(imageId) {
    const response = await fetch(`/api/brand-partners/images/${imageId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    const blob = await response.blob();
    const imageUrl = URL.createObjectURL(blob);
    document.getElementById('leadImage').src = imageUrl;
  }
  
  loadImage('IMG-VP001-1713724800000-123456');
</script>
```

**Success Response (200):**
- Content-Type: `image/jpeg`, `image/png`, etc. (based on uploaded file)
- Content-Disposition: `inline; filename="original-filename.jpg"`
- Body: Binary image data

**Error Responses:**
- `403 Forbidden`: Trying to access another brand partner's image
- `404 Not Found`: Image not found in database or file not found on server
- `500 Server Error`: Server-side error

**Notes:**
- The response is the actual image file, not JSON
- Images are served with `inline` disposition for browser display
- Only the brand partner who uploaded the image can access it

---

### 4. Delete Image

**Endpoint:** `DELETE /api/brand-partners/images/:imageId`

**Description:** Delete an image by imageId. Removes both the file and database record.

**Parameters:**
| Parameter | Type | Location | Description |
|-----------|------|----------|-------------|
| imageId | String | Path | The unique image ID to delete |

**Example Request:**
```javascript
const response = await fetch('/api/brand-partners/images/IMG-VP001-1713724800000-123456', {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Image deleted successfully",
  "imageId": "IMG-VP001-1713724800000-123456"
}
```

**Error Responses:**
- `403 Forbidden`: Trying to delete another brand partner's image
- `404 Not Found`: Image not found
- `500 Server Error`: Server-side error

**Notes:**
- Deletes both the physical file from `server/images/` and the database record
- Only the brand partner who uploaded the image can delete it
- If the file doesn't exist on disk but the record exists, only the record is deleted

---

## Complete Frontend Example

Here's a complete example of implementing image upload functionality in a React component:

```jsx
import React, { useState, useEffect } from 'react';

const LeadImageManager = ({ leadUniqueId, leadName }) => {
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  const token = localStorage.getItem('brandPartnerToken');

  // Fetch all images
  const fetchImages = async () => {
    try {
      const response = await fetch('/api/brand-partners/images', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        // Filter images for this specific lead
        const leadImages = data.images.filter(img => img.leadUniqueId === leadUniqueId);
        setImages(leadImages);
      }
    } catch (error) {
      console.error('Error fetching images:', error);
    }
  };

  // Upload image
  const handleUpload = async (e) => {
    e.preventDefault();
    const fileInput = document.getElementById('imageFile');
    const file = fileInput.files[0];

    if (!file) {
      alert('Please select an image');
      return;
    }

    if (!title) {
      alert('Please enter a title');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('leadUniqueId', leadUniqueId);
      formData.append('title', title);
      formData.append('tags', tags);

      const response = await fetch('/api/brand-partners/images/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        alert('Image uploaded successfully!');
        setTitle('');
        setTags('');
        fileInput.value = '';
        fetchImages(); // Refresh the list
      } else {
        alert(data.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // Delete image
  const handleDelete = async (imageId) => {
    if (!confirm('Are you sure you want to delete this image?')) {
      return;
    }

    try {
      const response = await fetch(`/api/brand-partners/images/${imageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        alert('Image deleted successfully!');
        fetchImages(); // Refresh the list
      } else {
        alert(data.message || 'Delete failed');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('Delete failed');
    }
  };

  // Get image URL
  const getImageUrl = (imageId) => {
    return `/api/brand-partners/images/${imageId}`;
  };

  useEffect(() => {
    fetchImages();
  }, [leadUniqueId]);

  return (
    <div className="lead-image-manager">
      <h3>Images for {leadName}</h3>

      {/* Upload Form */}
      <form onSubmit={handleUpload} className="upload-form">
        <div>
          <label>Image File:</label>
          <input 
            type="file" 
            id="imageFile" 
            accept="image/*" 
            required 
          />
        </div>
        <div>
          <label>Title:</label>
          <input 
            type="text" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            required 
            placeholder="e.g., Property Front View"
          />
        </div>
        <div>
          <label>Tags (comma-separated):</label>
          <input 
            type="text" 
            value={tags} 
            onChange={(e) => setTags(e.target.value)} 
            placeholder="e.g., exterior, front-view, completed"
          />
        </div>
        <button type="submit" disabled={uploading}>
          {uploading ? 'Uploading...' : 'Upload Image'}
        </button>
      </form>

      {/* Image Gallery */}
      <div className="image-gallery">
        {images.length === 0 ? (
          <p>No images uploaded yet</p>
        ) : (
          images.map((image) => (
            <div key={image.imageId} className="image-card">
              <img 
                src={getImageUrl(image.imageId)} 
                alt={image.title}
                onLoad={(e) => {
                  // Fetch with auth header for display
                  fetch(getImageUrl(image.imageId), {
                    headers: { 'Authorization': `Bearer ${token}` }
                  })
                  .then(res => res.blob())
                  .then(blob => {
                    e.target.src = URL.createObjectURL(blob);
                  });
                }}
              />
              <div className="image-info">
                <h4>{image.title}</h4>
                <p>Tags: {image.tags.join(', ') || 'None'}</p>
                <p>Size: {(image.size / 1024).toFixed(2)} KB</p>
                <p>Uploaded: {new Date(image.uploadedAt).toLocaleDateString()}</p>
                <button onClick={() => handleDelete(image.imageId)}>
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LeadImageManager;
```

---

## Database Schema

The `LeadImage` model stores the following information:

```javascript
{
  imageId: String,           // Unique: IMG-{partnerCode}-{timestamp}-{random}
  filename: String,          // Generated filename on server
  originalName: String,      // Original uploaded filename
  filepath: String,          // Full path to file on server
  mimetype: String,          // Image MIME type
  size: Number,              // File size in bytes
  title: String,             // User-provided title
  tags: [String],            // Array of tags
  leadUniqueId: String,      // Associated lead's unique ID
  leadName: String,          // Lead's name (cached)
  brandPartnerId: ObjectId,  // Brand partner who uploaded
  brandPartnerCode: String,  // Brand partner code (cached)
  brandPartnerName: String,  // Brand partner name (cached)
  createdAt: Date,           // Auto-generated
  updatedAt: Date            // Auto-generated
}
```

---

## Security Features

1. **Authentication Required**: All endpoints require valid JWT token
2. **Ownership Verification**: Brand partners can only access their own images
3. **Lead Ownership Check**: Can only upload images for leads they own
4. **File Type Validation**: Only image files are accepted
5. **File Size Limit**: Maximum 10MB per image
6. **Automatic Cleanup**: Failed uploads are automatically deleted from disk

---

## Error Handling

All endpoints follow a consistent error response format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message (in development)"
}
```

Common error scenarios:
- Missing or invalid JWT token → 401 Unauthorized
- Accessing another brand partner's resources → 403 Forbidden
- Resource not found → 404 Not Found
- Validation errors → 400 Bad Request
- Server errors → 500 Internal Server Error

---

## Testing the Endpoints

You can test these endpoints using tools like Postman or curl:

### Upload Image (curl example):
```bash
curl -X POST http://localhost:5000/api/brand-partners/images/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "image=@/path/to/image.jpg" \
  -F "leadUniqueId=LEAD-12345" \
  -F "title=Property Front View" \
  -F "tags=exterior,front-view"
```

### Get All Images:
```bash
curl -X GET http://localhost:5000/api/brand-partners/images \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Specific Image:
```bash
curl -X GET http://localhost:5000/api/brand-partners/images/IMG-VP001-1713724800000-123456 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  --output downloaded-image.jpg
```

### Delete Image:
```bash
curl -X DELETE http://localhost:5000/api/brand-partners/images/IMG-VP001-1713724800000-123456 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Summary

The image upload system provides brand partners with a complete solution for managing lead-related images:

- Upload images with metadata (title, tags)
- Associate images with specific leads
- Retrieve all uploaded images with metadata
- Display/render individual images
- Delete images when no longer needed

All operations are secured with JWT authentication and ownership verification to ensure data privacy and security.
