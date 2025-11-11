# Wildcard Pattern Matching

This action supports wildcard (glob) patterns for the `filename` input, allowing
you to match multiple files with a single pattern.

## Supported Patterns

### Asterisk (`*`)

Matches zero or more characters.

**Examples:**

- `*.txt` - Matches all files ending with `.txt` (e.g., `report.txt`,
  `data.txt`)
- `test-*` - Matches all files starting with `test-` (e.g., `test-1.log`,
  `test-results.csv`)
- `*report*` - Matches all files containing `report` (e.g.,
  `monthly-report.pdf`, `report-2024.xlsx`)

### Question Mark (`?`)

Matches exactly one character.

**Examples:**

- `file?.txt` - Matches `file1.txt`, `fileA.txt`, but not `file10.txt`
- `data-202?.csv` - Matches `data-2021.csv`, `data-2022.csv`, etc.
- `log-??.txt` - Matches `log-01.txt`, `log-99.txt`, but not `log-1.txt`

### Character Classes (`[...]`)

Matches any single character within the brackets.

**Examples:**

- `report-[ABC].pdf` - Matches `report-A.pdf`, `report-B.pdf`, `report-C.pdf`
- `file[0-9].txt` - Matches `file0.txt` through `file9.txt`
- `data-[a-z].csv` - Matches `data-a.csv`, `data-b.csv`, etc.

### Brace Expansion (`{...}`)

Matches any of the comma-separated patterns.

**Examples:**

- `{report,summary}.txt` - Matches `report.txt` and `summary.txt`
- `file.{pdf,docx,txt}` - Matches `file.pdf`, `file.docx`, `file.txt`

## How It Works

### Two-Phase Matching

The action uses a two-phase approach to efficiently match files:

1. **Server-Side Filtering (Google Drive API)**
   - The action analyzes your pattern and constructs an optimized Google Drive
     API query
   - For simple patterns, it uses Drive's native query capabilities to narrow
     results
   - For example, `*report*` becomes `name contains 'report'`

2. **Client-Side Filtering (Regex)**
   - Results from the API are then filtered client-side using precise regex
     matching
   - This ensures exact glob pattern matching even for complex patterns
   - The regex is generated automatically from your glob pattern

### Optimization Examples

| Pattern      | Drive API Query          | Client Filter      |
| ------------ | ------------------------ | ------------------ |
| `report.txt` | `name = 'report.txt'`    | None (exact match) |
| `*.txt`      | `name contains '.txt'`   | `^.*\.txt$`        |
| `test-*`     | `name contains 'test-'`  | `^test-.*$`        |
| `*report*`   | `name contains 'report'` | `^.*report.*$`     |
| `file?.log`  | `name != null`           | `^file.\.log$`     |

### Case Sensitivity

Pattern matching is **case-insensitive** by default, matching Google Drive's
behavior.

## Usage Examples

### Download All CSV Files

```yaml
- uses: logickoder/google-drive-download@main
  with:
    folderId: 'your-folder-id'
    filename: '*.csv'
    destination: './data'
```

### Download Specific Date Pattern

```yaml
- uses: logickoder/google-drive-download@main
  with:
    folderId: 'your-folder-id'
    filename: 'report-2024-??.pdf'
    destination: './reports'
```

### Download Multiple File Types

```yaml
- uses: logickoder/google-drive-download@main
  with:
    folderId: 'your-folder-id'
    filename: 'document.{pdf,docx}'
    destination: './documents'
```

### Complex Pattern

```yaml
- uses: logickoder/google-drive-download@main
  with:
    folderId: 'your-folder-id'
    filename: 'data-[0-9][0-9][0-9][0-9]-*.json'
    destination: './data'
```

## Important Notes

- Patterns only match files in the specified folder (non-recursive)
- If no files match the pattern, the action will complete without error
- Multiple matching files will all be downloaded to the destination
- The original filename is preserved for each downloaded file
- Exact filename matches (no wildcards) use optimized queries for better
  performance
