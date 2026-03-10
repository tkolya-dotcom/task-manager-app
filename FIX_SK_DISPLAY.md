# Fix: SK Information Not Displaying in Installation Detail

## Problem
When opening the installation detail tab, the following information is not displayed:
- Air conditioner ID (ID СК)
- Name/Model (Наименование)
- Status (Статус)
- Contract type (Тип по договору)
- Planned date (Плановая дата)
- Material request status (создана ли заявка на материалы)

## Root Cause
The database `installations` table is missing the SK (air conditioner) columns. The frontend form collects this data but it cannot be stored or retrieved from the database.

## Solution

### Step 1: Add Database Columns
Execute the SQL file already created:
```sql
-- Run in Supabase SQL Editor
c:\Users\Tkolya\Desktop\мои\планировщик\sql\add_sk_fields_to_installations.sql
```

This adds the following columns:
- `id_ploshadki`, `servisnyy_id`, `rayon`, `planovaya_data_1_kv_2026`
- `id_sk1` through `id_sk6`
- `naimenovanie_sk1` through `naimenovanie_sk6`
- `status_oborudovaniya1` through `status_oborudovaniya6`
- `tip_sk_po_dogovoru1` through `tip_sk_po_dogovoru6`

### Step 2: Update Frontend - Add Planned Date Display

The planned date field needs to be added to the main information section. Update `frontend/src/pages/InstallationDetail.jsx`:

**Current line 116:**
```jsx
<p><strong>Дата монтажа:</strong> {installation.scheduled_at ? new Date(installation.scheduled_at).toLocaleString('ru-RU') : '-'}</p>
```

**Add after line 118:**
```jsx
<p><strong>Плановая дата:</strong> {installation.planovaya_data_1_kv_2026 ? new Date(installation.planovaya_data_1_kv_2026).toLocaleDateString('ru-RU') : '-'}</p>
```

### Step 3: Update Frontend - Show Material Request Status

The material request section already shows the count at line 235:
```jsx
<h3 className="card-title">Заявки на материалы ({installation.purchaseRequests?.length || 0})</h3>
```

To make it more visible whether a request exists, add a badge indicator after line 119:

```jsx
<p><strong>Заявка на материалы:</strong> {installation.purchaseRequests && installation.purchaseRequests.length > 0 
  ? <span style={{ color: 'green', fontWeight: 'bold' }}>✓ Создана ({installation.purchaseRequests.length})</span>
  : <span style={{ color: 'red' }}>✗ Не создана</span>}</p>
```

### Step 4: Backend Already Correct

The backend `GET /:id` endpoint uses `.select('*')` which will automatically include all new columns once they're added to the database. No backend changes needed.

## Testing

After completing the steps above:
1. Create a new installation or edit an existing one
2. Fill in the SK information fields
3. Save the installation
4. Open the detail view
5. Verify all SK fields are displayed correctly
6. Verify the planned date is shown
7. Verify material request status is visible

## Files Changed
- ✅ `sql/add_sk_fields_to_installations.sql` (created)
- ⏳ `frontend/src/pages/InstallationDetail.jsx` (needs update)
- ✅ Backend works correctly (no changes needed)

## Next Steps
1. Execute SQL migration in Supabase
2. Update frontend InstallationDetail.jsx
3. Test with real data
