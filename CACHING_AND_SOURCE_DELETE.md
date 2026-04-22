# Caching System and Source-Specific Lead Deletion

## Overview
Implemented a caching system for mapping leads sync and added the ability to delete all leads from a specific source.

## 1. Caching System for Mapping Leads

### Implementation
The mapping leads sync now uses localStorage to cache sync results and avoid unnecessary API calls.

### Cache Duration
- **5 minutes** (300,000 milliseconds)
- After 5 minutes, the next page visit will trigger a fresh sync

### How It Works

1. **First Visit**
   - Checks if cache exists and is valid
   - If not, syncs mapping leads from external API
   - Stores timestamp in `localStorage.setItem('mappingLeadsLastSync', timestamp)`
   - Marks cache as valid with `localStorage.setItem('mappingLeadsCached', 'true')`

2. **Subsequent Visits (within 5 minutes)**
   - Checks cache timestamp
   - If less than 5 minutes old, skips sync
   - Directly loads leads from database

3. **Cache Invalidation**
   - Automatically expires after 5 minutes
   - Manually cleared when deleting mapping leads
   - Updated when new mapping leads are synced

### Benefits
- Reduces API calls to external mapping service
- Faster page load times
- Less server load
- Better user experience

### Code Changes

**ClientManagement.jsx:**
```javascript
useEffect(() => {
  const initializeData = async () => {
    // Check cache for mapping sync
    const lastSyncTime = localStorage.getItem('mappingLeadsLastSync')
    const now = Date.now()
    const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
    
    // Sync only if cache expired or doesn't exist
    if (user.role === 'admin') {
      if (!lastSyncTime || (now - parseInt(lastSyncTime)) > CACHE_DURATION) {
        await syncMappingLeads()
        localStorage.setItem('mappingLeadsLastSync', now.toString())
        localStorage.setItem('mappingLeadsCached', 'true')
      }
      await fetchUsers()
    }
    
    await fetchClients()
    await fetchProjectSources()
  }
  
  initializeData()
}, [user.role])
```

## 2. Source-Specific Lead Deletion

### Feature
Added a delete button in the grouped view that allows admins to delete all leads from a specific source (CSV file, Facebook campaign, etc.) with one click.

### Location
- Appears in the header of each source group (CSV files, campaigns, etc.)
- Only visible to admin users
- Shows a trash icon button next to the lead count

### How It Works

1. **Delete Button**
   - Located in each source group header
   - Shows trash icon
   - Hover shows "Delete all leads from this source"

2. **Confirmation**
   - Clicking shows a confirmation dialog
   - Displays: "Are you sure you want to delete all X lead(s) from 'Source Name'? This action cannot be undone."

3. **Deletion Process**
   - Deletes all leads from that specific source
   - Clears cache if deleting mapping leads
   - Refreshes the leads list
   - Shows success toast notification

4. **Cache Handling**
   - If deleting mapping leads, clears the cache
   - Forces a fresh sync on next visit
   - Ensures data consistency

### Code Changes

**LeadsGroupedView.jsx:**
```javascript
// Added delete button in CSV File Header
{user.role === 'admin' && onDeleteSourceLeads && (
  <button
    onClick={(e) => {
      e.stopPropagation()
      onDeleteSourceLeads(groupLeads, groupInfo.name)
    }}
    className="px-2 py-1 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
    title="Delete all leads from this source"
  >
    <Trash2 className="h-3.5 w-3.5" />
  </button>
)}
```

**ClientManagement.jsx:**
```javascript
const handleDeleteSourceLeads = async (leads, sourceName) => {
  if (!window.confirm(`Are you sure you want to delete all ${leads.length} lead(s) from "${sourceName}"? This action cannot be undone.`)) {
    return
  }

  try {
    await Promise.all(
      leads.map(lead => axios.delete(`/api/clients/${lead._id}`))
    )
    
    // Clear cache if deleting mapping leads
    if (leads.some(l => l.importMethod === 'mapping')) {
      localStorage.removeItem('mappingLeadsLastSync')
      localStorage.removeItem('mappingLeadsCached')
    }
    
    await fetchClients()
    setSelectedLeads([])
    onUpdate()
    showToast(`Successfully deleted ${leads.length} lead(s) from "${sourceName}"`, 'success')
  } catch (error) {
    console.error('Error deleting source leads:', error)
    showToast('Failed to delete leads', 'error')
  }
}
```

## Benefits

### Caching System
1. **Performance**: Reduces unnecessary API calls
2. **Speed**: Faster page loads after initial sync
3. **Reliability**: Less dependent on external API availability
4. **User Experience**: Smoother navigation between pages

### Source-Specific Deletion
1. **Efficiency**: Delete entire source with one click
2. **Organization**: Easy cleanup of test imports or old campaigns
3. **Safety**: Confirmation dialog prevents accidental deletion
4. **Feedback**: Toast notifications confirm successful deletion
5. **Consistency**: Automatic cache clearing maintains data integrity

## Usage

### For Admins

**Viewing Cache Status:**
- Cache is transparent to users
- Sync happens automatically when needed
- Toast notification shows sync results when new data is imported

**Deleting Source Leads:**
1. Navigate to Leads page
2. Switch to Grouped view
3. Find the source you want to delete
4. Click the trash icon in the source header
5. Confirm the deletion
6. All leads from that source will be removed

**Manual Cache Refresh:**
To force a fresh sync, you can:
1. Wait 5 minutes for cache to expire, OR
2. Delete mapping leads (clears cache automatically), OR
3. Open browser console and run:
   ```javascript
   localStorage.removeItem('mappingLeadsLastSync')
   localStorage.removeItem('mappingLeadsCached')
   ```
   Then refresh the page

## Technical Details

### localStorage Keys
- `mappingLeadsLastSync`: Timestamp of last sync (milliseconds)
- `mappingLeadsCached`: Boolean flag indicating cache validity

### Cache Duration
- Default: 5 minutes (300,000 ms)
- Configurable in code: `const CACHE_DURATION = 5 * 60 * 1000`

### Permissions
- Caching: Admin users only
- Source deletion: Admin users only
- Individual lead checkboxes: Already existed, still work as before

## Future Enhancements

Potential improvements:
1. Make cache duration configurable in settings
2. Add manual "Force Sync" button
3. Show cache status indicator
4. Add bulk source deletion (select multiple sources)
5. Export leads before deletion option
6. Undo functionality for accidental deletions
