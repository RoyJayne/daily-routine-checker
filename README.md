# Daily Routine Checker — Dark Mode

A small static website for tracking a daily routine.

## Features

- Add your own daily routine
- See the full routine every day
- Click a task to mark it **Complete**
- Click it again to undo completion
- Daily completion automatically resets on a new calendar day
- Your routine stays saved in the browser using `localStorage`
- Reorder and delete routine items
- Export/import your routine as JSON
- No backend, account, database, or paid hosting required

## Files

- `index.html`
- `style.css`
- `app.js`

## Upload to GitHub Pages

1. Create a new GitHub repository.
2. Upload `index.html`, `style.css`, and `app.js` to the repository root.
3. Commit the files.
4. In GitHub, open **Settings → Pages**.
5. Under **Build and deployment**, choose **Deploy from a branch**.
6. Select your main branch and `/ (root)`.
7. Save.

GitHub will provide the public website URL.

## Important note about saved data

This version stores your routine and completion history in the browser's `localStorage`.

That means:
- Refreshing the page will **not** erase your data.
- Closing and reopening the browser will **not** erase your data.
- Your data does **not automatically sync between devices or browsers**.
- Clearing browser/site data can erase it, so use **Export** if you want a backup.

## Changing the design

Most design settings are near the top of `style.css` under `:root`.

## Suggested next upgrades

Possible future versions could add:
- Login + cloud sync
- Calendar/history view
- Weekly routines
- Different routines for weekdays/weekends
- Streaks
- Notes
- Reminders
- Time-of-day sections


## Dark mode update

This version uses a dark color scheme by default. The app functionality is unchanged.

## Completion history

This version adds a **History** button. It shows completed tasks grouped by day, newest first.

- Today's completions appear immediately.
- Past days stay visible.
- Deleting a routine item no longer deletes its past completion history.
- New completion records save a snapshot of the task name so the history remains readable later.
