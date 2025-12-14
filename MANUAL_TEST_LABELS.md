# Manual Test Guide: Labels Functionality

This document describes how to manually test the label functionality that has been implemented.

## Test Environment
- Open `index.html` in a web browser
- Ensure JavaScript console is open (F12)

## Test Case 1: View Default Labels

**Steps:**
1. Open the application
2. Look at the right sidebar under "Etykiety" section

**Expected Result:**
- You should see 3 default labels:
  - "Urlop zaległy" (orange color)
  - "Urlop bieżący" (green color)
  - "Plan" (blue color)
- "Add Label" button (+ Dodaj etykietę) should be visible

## Test Case 2: Add a Custom Label

**Steps:**
1. Click the "+ Dodaj etykietę" button
2. In the prompt dialog, enter a label name (e.g., "Wyjazd służbowy")
3. Click OK

**Expected Result:**
- A new label appears in the list with the name you entered
- The label has a random color assigned
- The label is added to the list without page reload

## Test Case 3: Activate a Label

**Steps:**
1. Click on any label in the list (e.g., "Urlop bieżący")

**Expected Result:**
- The clicked label should have a darker background (active state)
- All other labels should become inactive

## Test Case 4: Apply Label to Calendar Days

**Steps:**
1. Activate a label by clicking it (if not already active)
2. Click on any day in the calendar

**Expected Result:**
- The day changes color to match the active label
- The day shows bold white text
- The day is now marked with that label

## Test Case 5: Remove Label from Day

**Steps:**
1. Click on a day that already has a label applied

**Expected Result:**
- The label is removed from the day
- The day returns to its original appearance
- If it was a holiday or weekend, it returns to those colors

## Test Case 6: Switch Label on Day

**Steps:**
1. Apply a label to a day (e.g., "Urlop zaległy")
2. Activate a different label (e.g., "Plan")
3. Click the same day again

**Expected Result:**
- The day now shows the new label's color
- The previous label is replaced with the new one

## Test Case 7: Verify Leave Statistics

**Steps:**
1. Apply "Urlop zaległy" to 3 weekdays (Mon-Fri, not holidays)
2. Apply "Urlop bieżący" to 5 different weekdays
3. Look at the "Urlop" section in the right sidebar

**Expected Result:**
- "Łącznie: 8 dni"
- "Z poprzedniego roku: 3 dni"
- "Z bieżącego roku: 5 dni"

## Test Case 8: Test Persistence (Reload)

**Steps:**
1. Add a custom label (e.g., "Test Persistence")
2. Apply labels to several days
3. Refresh the page (F5)

**Expected Result:**
- All custom labels are still present
- All labeled days still show their labels
- Active label selection is restored
- Leave statistics are correct

## Test Case 9: Test Clear All

**Steps:**
1. Apply labels to multiple days
2. Click "Wyczyść wszystko" button

**Expected Result:**
- All day labels are removed
- Calendar days return to their original appearance
- Leave statistics show "0 dni" for all categories
- Label definitions remain (not deleted)

## Test Case 10: Console Verification

**Steps:**
1. Open browser console (F12)
2. Type: `window.labels`
3. Press Enter

**Expected Result:**
- You should see an array of label objects
- Each label has properties: `id`, `name`, `color`, `active`
- Custom labels have IDs like "label_1234567890_abc123def"

## Test Case 11: LocalStorage Verification

**Steps:**
1. Open browser console (F12)
2. Type: `localStorage.getItem('kalendarz-pl:v1')`
3. Press Enter

**Expected Result:**
- You should see a JSON string containing:
  - `labels`: array of all labels (default + custom)
  - `dayAssignments`: object mapping dates to label IDs
  - `selectedLabelId`: currently active label ID
  - Other state like `year`, `satMode`

## Known Behavior

- **Multiple clicks on same labeled day**: First click removes the label (toggle)
- **Alt+Click**: Always removes the label from a day
- **Weekend/Holiday Days**: Can be labeled, but don't count in leave statistics
- **Label colors**: Random colors are assigned from a predefined palette
- **Label IDs**: Automatically generated as `label_[timestamp]_[random]`

## Troubleshooting

If labels don't work:
1. Check console for JavaScript errors
2. Clear localStorage: `localStorage.clear()`
3. Refresh the page
4. Check that `config.js` is loaded before `app.js`

## Success Criteria

✅ All test cases pass
✅ No JavaScript errors in console
✅ Labels persist after page reload
✅ Custom labels can be added
✅ Labels apply correctly to calendar days
✅ Leave statistics calculate correctly
