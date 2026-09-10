# TODO: Analytics PDF Export with Chart Snapshots

## Steps

### Step 1: Create TODO.md ✅
- [x] Create this tracking file

### Step 2: Rewrite handleExportAnalyticsPDF (frontend) ✅
- [x] Capture 6 chart refs using html2canvas → base64 JPEG data URIs
- [x] Build comprehensive HTML report with embedded chart images
- [x] Build metric cards, tables (popular classes, top trainers, daily pass, membership growth)
- [x] Open in new window → user prints/saves as PDF
- [x] Show success/error notifications

### Step 3: Fix handleExportPDF (business recommendation) ✅
- [x] Fix malformed `printWindow` section - added `const printWindow = window.open(url, "_blank")` 
- [x] Ensure proper print-to-PDF flow for business recommendations

### Step 4: Verify ✅
- [x] No new syntax errors introduced (pre-existing TS errors on lines 75, 80 were from original file)
- [x] `html2canvas` is used to capture all 6 chart refs (revenueChartRef, bookingsChartRef, clientGrowthChartRef, membershipStatusChartRef, dailyPassChartRef, membershipGrowthChartRef)
- [x] Backend endpoint unchanged — pure frontend approach
- [x] `handleExportAnalyticsPDF` is wired to the "Export PDF" button in the header

