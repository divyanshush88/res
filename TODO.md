# TODO: Fix Fallback Menu Not Showing

## Information Gathered
- `index.html` fetches menu from backend at `http://localhost:3000/api/menu`.
- If menu is empty, attempts to seed the database by POSTing the `fallbackMenu` array.
- The backend's POST `/api/menu` route uses `insertOne(req.body)`, so POSTing an array inserts the array as a single document.
- When fetching after seeding, `menu` becomes an array containing the array document, causing rendering to fail (tries to access `.name` on the array).
- If fetch fails initially, it falls back to `fallbackMenu` correctly.
- If seeding fails or is incorrect, menu remains empty, showing "Menu could not be loaded."

## Plan
- Modify the seeding logic in `fetchMenu` to POST each item in `fallbackMenu` individually.
- Wrap the seeding loop in a try-catch; if seeding fails, ensure fallback is used.
- After the try-catch block, if `menu.length === 0`, set `menu = fallbackMenu` to guarantee fallback display.

## Dependent Files to be Edited
- `index.html`: Update the `fetchMenu` function's seeding logic.

## Followup Steps
- Test the page to ensure menu items display from fallback or seeded data.
- Verify backend is running if seeding is expected.
