# Dynamic Location Management System - Testing Guide

## Overview
This guide provides comprehensive testing procedures for the new dynamic location management system that replaces the static JSON-based approach with a MongoDB database solution.

## System Architecture

### Database Models
- **State Model**: Stores state information with soft delete capability
- **City Model**: Stores city information linked to states with embedded areas
- **Area Schema**: Embedded in cities, contains area names and 6-digit pincodes

### API Endpoints

#### New Dynamic API (`/api/locations`)
- `GET /api/locations/states` - Get all states
- `GET /api/locations/states/:id` - Get state by ID
- `POST /api/locations/states` - Create new state (Admin)
- `PUT /api/locations/states/:id` - Update state (Admin)
- `DELETE /api/locations/states/:id` - Delete state (Admin)

- `GET /api/locations/states/:stateId/cities` - Get cities by state
- `GET /api/locations/cities/:id` - Get city by ID
- `POST /api/locations/cities` - Create new city (Admin)
- `PUT /api/locations/cities/:id` - Update city (Admin)
- `DELETE /api/locations/cities/:id` - Delete city (Admin)

- `GET /api/locations/cities/:cityId/areas` - Get areas by city
- `POST /api/locations/cities/:cityId/areas` - Add area to city (Admin)
- `PUT /api/locations/areas/:areaId` - Update area (Admin)
- `DELETE /api/locations/areas/:areaId` - Delete area (Admin)

#### Legacy Compatibility API (`/api/location`)
- `GET /api/location/states` - Get all states (compatible format)
- `GET /api/location/states/:state/cities` - Get cities by state
- `GET /api/location/states/:state/cities/:city/pincodes` - Get pincodes by city

#### Admin API (`/api/admin`)
- `GET /api/admin/locations` - Get all locations with stats
- `POST /api/admin/locations/states` - Add new state
- `POST /api/admin/locations/cities` - Add new city
- `DELETE /api/admin/locations/states/:stateName` - Delete state
- `DELETE /api/admin/locations/cities/:stateName/:cityName` - Delete city

## Testing Procedures

### 1. Test State Operations

#### Create a new state:
```bash
curl -X POST http://localhost:8080/api/locations/states \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{"name": "Test State", "country": "India"}'
```

#### Get all states:
```bash
curl http://localhost:8080/api/locations/states
```

#### Search states:
```bash
curl "http://localhost:8080/api/locations/states?search=test&page=1&limit=10"
```

### 2. Test City Operations

#### Create a new city:
```bash
curl -X POST http://localhost:8080/api/locations/cities \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{"name": "Test City", "state": "STATE_ID_HERE"}'
```

#### Get cities by state:
```bash
curl http://localhost:8080/api/locations/states/STATE_ID_HERE/cities
```

### 3. Test Area Operations

#### Add area to city:
```bash
curl -X POST http://localhost:8080/api/locations/cities/CITY_ID_HERE/areas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{"name": "Test Area", "pincode": "123456"}'
```

#### Get areas by city:
```bash
curl http://localhost:8080/api/locations/cities/CITY_ID_HERE/areas
```

### 4. Test Legacy Compatibility

#### Test legacy state endpoint:
```bash
curl http://localhost:8080/api/location/states
```

#### Test legacy cities endpoint:
```bash
curl http://localhost:8080/api/location/states/Test%20State/cities
```

#### Test legacy pincodes endpoint:
```bash
curl http://localhost:8080/api/location/states/Test%20State/cities/Test%20City/pincodes
```

### 5. Test Admin Operations

#### Get location statistics:
```bash
curl http://localhost:8080/api/admin/locations \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

#### Add state via admin API:
```bash
curl -X POST http://localhost:8080/api/admin/locations/states \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{"stateName": "Admin Test State"}'
```

### 6. Test Search and Filtering

#### Search by pincode:
```bash
curl "http://localhost:8080/api/locations/search/pincode/123456"
```

#### Get location statistics:
```bash
curl http://localhost:8080/api/locations/stats
```

### 7. Test Bulk Operations

#### Bulk import locations:
```bash
curl -X POST http://localhost:8080/api/locations/bulk-import \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d @sample-locations.json
```

#### Export all locations:
```bash
curl http://localhost:8080/api/locations/export \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -o exported-locations.json
```

## Expected Results

### Successful Responses
- All endpoints should return JSON responses with `success: true`
- State creation should return the new state with MongoDB `_id`
- City creation should return the new city linked to the correct state
- Area creation should add the area to the city's embedded areas array
- Legacy endpoints should return data in the original format for backward compatibility

### Error Handling
- Duplicate state/city names should return `400 Bad Request`
- Invalid pincode format should return `400 Bad Request`
- Non-existent resources should return `404 Not Found`
- Unauthorized access should return `401 Unauthorized`

## Migration Notes

### Data Migration
The system now uses MongoDB instead of the static `india-pincodes.json` file. To migrate existing data:

1. Use the bulk import endpoint with the old JSON data
2. Verify all data is correctly imported
3. Test all existing functionality
4. Remove the old JSON file (already done)

### Frontend Integration
The legacy API endpoints maintain backward compatibility, so existing frontend code should continue to work without changes. However, new features can utilize the enhanced API endpoints for better functionality.

## Benefits of New System

1. **Dynamic Management**: Add/edit/delete locations without server restarts
2. **Database Integrity**: Proper relationships and constraints
3. **Scalability**: Better performance with database indexing
4. **Audit Trail**: Track who created/modified locations
5. **Soft Deletes**: Maintain data integrity while hiding inactive locations
6. **Search Capabilities**: Advanced search and filtering options
7. **API Consistency**: RESTful endpoints with proper HTTP methods
8. **Validation**: Proper data validation including pincode format checks

## Troubleshooting

### Common Issues
1. **MongoDB Connection**: Ensure MongoDB is running and accessible
2. **Authentication**: Verify admin tokens for protected endpoints
3. **Data Format**: Check JSON payload format for POST/PUT requests
4. **Case Sensitivity**: Location names are case-insensitive for searches
5. **Pincode Format**: Ensure pincodes are exactly 6 digits

### Logs to Check
- Server startup logs for MongoDB connection
- API request/response logs for debugging
- Mongoose schema validation errors
- Authentication middleware logs