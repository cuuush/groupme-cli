# GroupMe CLI Improvements Summary

## Overview
Enhanced the GroupMe CLI with better group name matching, improved error handling, fuzzy search capabilities, and enhanced pagination features.

## Changes Made

### 1. New File: `src/utils/search.ts`
Created a comprehensive fuzzy search utility module:
- **stringSimilarity()**: Calculates similarity score between two strings (0-1)
- **levenshteinDistance()**: Computes edit distance for fuzzy matching
- **matchesQuery()**: Word-boundary aware matching
- **fuzzySearch()**: Main search function with configurable threshold and limit
- **findBestMatch()**: Returns single best match or null
- **findMatches()**: Returns all matches above threshold

### 2. Enhanced `src/api.ts`
Improved API layer with structured error handling:
- **GroupMeAPIError class**: Custom error with status codes and endpoint info
- **Response validation**: Ensures non-null responses from API
- **Specific error detection**: 
  - 401 Unauthorized → "Invalid or expired API token" message
  - 404 Not Found → "Resource not found" message
  - 429 Rate Limited → "Rate limit exceeded" message
- **Input validation**: Message length checks (max 1000 chars), empty text validation
- **handleAPIError()**: Consistent error formatting for commands

### 3. Enhanced `src/commands/groups.ts`
Major improvements to group listing and searching:
- **Fuzzy name search**: `-s, --search <query>` flag supports partial and fuzzy matching
- **Exact match option**: `-e, --exact` requires exact group name match
- **Get by ID**: `-i, --id <id>` to fetch specific group
- **Sorting options**: `--sort <field>` supports: name, members, messages, updated
- **resolveGroup() helper**: Exported function for other commands to resolve groups by ID or name
- **Match scoring**: Displays match percentage in search results
- **Suggestions**: Shows available groups when search fails

### 4. Enhanced `src/commands/messages.ts`
Improved message display and group resolution:
- **Fuzzy group resolution**: `-g` flag now accepts group names (not just IDs)
- **Smart ID detection**: Automatically detects numeric IDs vs names
- **Compact view**: `-c, --compact` flag for one-line-per-message output
- **Enhanced message display**: 
  - Multi-line message support
  - Better attachment indicators (📷, 📍, 👥, 💸)
  - System message labeling
- **Improved pagination hints**: Shows both older and newer navigation
- **JSON output**: Enhanced with group name and pagination metadata
- **Confirmation option**: `--confirm` flag for send command safety

### 5. Updated `src/commands/index.ts`
Exported the `resolveGroup` function for cross-command usage.

## New CLI Usage Examples

### Groups Command
```bash
# Search for groups by partial name
groupme groups --search "CS"

# Fuzzy match (e.g., "cs club" matches "Computer Science Club")
groupme groups --search "comp sci"

# Exact match only
groupme groups --search "CS Study Group" --exact

# Sort by message count
groupme groups --sort messages

# Get specific group by ID
groupme groups --id 12345678
```

### Read Command
```bash
# Use group name instead of ID (fuzzy match)
groupme read -g "CS Study Group"

# Compact view for quick scanning
groupme read -g "CS Study Group" --compact

# Show newest first
groupme read -g "CS Study Group" --no-reverse

# JSON output with pagination info
groupme read -g "CS Study Group" --json
```

### Send Command
```bash
# Send using fuzzy group name resolution
groupme send -g "CS" -m "Hello everyone!"

# Confirm before sending
groupme send -g "CS Study Group" -m "Important message" --confirm
```

## Error Handling Improvements

### Before
```
Error: [object Object]
```

### After
```
Error: Authentication failed: Invalid or expired API token. Run "groupme config --token YOUR_TOKEN" to update.
Status: 401
```

Or:
```
Error: No group found matching "mtg"
Tip: Use "groupme groups" to see available groups
```

## Technical Details
- **Fuzzy matching threshold**: Default 0.3 (30% similarity), adjustable per call
- **Levenshtein distance**: Used for calculating string similarity
- **Word boundary matching**: Partial word matches score higher (85%)
- **Substring matching**: Exact substring matches score 95%
- **Exact matching**: Full matches score 100%

## Testing
Build tested successfully with TypeScript 5.9.3.
```bash
npm run build  # ✓ No errors
```

## Backwards Compatibility
All existing commands and options remain unchanged. New features are additive only.
