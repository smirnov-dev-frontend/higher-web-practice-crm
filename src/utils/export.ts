import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import * as XLSX from 'xlsx'

export type ExportCell = string | number | Date
export type ExportColumn = { key: string; label: string; numFmt?: string }
export type ExportRow = Record<string, ExportCell>

export function exportToExcel(filename: string, columns: ExportColumn[], rows: ExportRow[]): void {
   const headers = columns.map((c) => c.label)
   const data = rows.map((row) => columns.map((c) => row[c.key] ?? ''))
   const ws = XLSX.utils.aoa_to_sheet([headers, ...data])

   columns.forEach((col, colIndex) => {
      if (!col.numFmt) return
      const colLetter = XLSX.utils.encode_col(colIndex)
      for (let rowIndex = 1; rowIndex <= rows.length; rowIndex++) {
         const cellRef = `${colLetter}${rowIndex + 1}`
         if (ws[cellRef]) ws[cellRef].z = col.numFmt
      }
   })

   ws['!cols'] = columns.map((col) => {
      const maxLen = rows.reduce((max, row) => {
         const val = row[col.key]
         if (val instanceof Date) return Math.max(max, col.numFmt?.length ?? 10)
         return Math.max(max, val != null ? String(val).length : 0)
      }, col.label.length)
      return { wch: maxLen + 2 }
   })

   const wb = XLSX.utils.book_new()
   XLSX.utils.book_append_sheet(wb, ws, 'Отчёт')
   XLSX.writeFile(wb, `${filename}.xlsx`)
}

export async function exportToPDF(filename: string, columns: ExportColumn[], rows: ExportRow[]): Promise<void> {
   const container = document.createElement('div')
   container.style.cssText =
      'position:fixed;left:-9999px;top:0;background:#ffffff;padding:32px;width:1100px;font-family:Inter,Arial,sans-serif;'

   const table = document.createElement('table')
   table.style.cssText = 'border-collapse:collapse;width:100%;font-size:13px;color:#1f2937;'

   const thead = document.createElement('thead')
   const headerRow = document.createElement('tr')
   columns.forEach((col) => {
      const th = document.createElement('th')
      th.textContent = col.label
      th.style.cssText =
         'padding:8px 12px;text-align:left;font-size:11px;font-weight:400;color:#9ca3af;border-bottom:1px solid #e5e7eb;'
      headerRow.appendChild(th)
   })
   thead.appendChild(headerRow)
   table.appendChild(thead)

   const tbody = document.createElement('tbody')
   rows.forEach((row, i) => {
      const tr = document.createElement('tr')
      tr.style.background = i % 2 === 0 ? '#ffffff' : '#f9fafb'
      columns.forEach((col) => {
         const td = document.createElement('td')
         td.textContent = String(row[col.key] ?? '')
         td.style.cssText = 'padding:10px 12px;border-bottom:1px solid #f3f4f6;font-size:13px;'
         tr.appendChild(td)
      })
      tbody.appendChild(tr)
   })
   table.appendChild(tbody)
   container.appendChild(table)
   document.body.appendChild(container)

   let canvas: HTMLCanvasElement
   try {
      canvas = await html2canvas(container, { scale: 2, useCORS: true, backgroundColor: '#ffffff' })
   } finally {
      document.body.removeChild(container)
   }

   const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
   const pageWidth = pdf.internal.pageSize.getWidth()
   const pageHeight = pdf.internal.pageSize.getHeight()
   const margin = 20
   const imgWidth = pageWidth - 2 * margin
   const pageCanvasHeight = Math.floor((canvas.width * (pageHeight - 2 * margin)) / imgWidth)
   const totalPages = Math.ceil(canvas.height / pageCanvasHeight)

   for (let page = 0; page < totalPages; page++) {
      if (page > 0) pdf.addPage()
      const sliceHeight = Math.min(pageCanvasHeight, canvas.height - page * pageCanvasHeight)
      const sliceCanvas = document.createElement('canvas')
      sliceCanvas.width = canvas.width
      sliceCanvas.height = sliceHeight
      const ctx = sliceCanvas.getContext('2d')!
      ctx.drawImage(canvas, 0, -page * pageCanvasHeight)
      const imgData = sliceCanvas.toDataURL('image/png')
      const imgHeight = (sliceHeight / canvas.width) * imgWidth
      pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight)
   }

   pdf.save(`${filename}.pdf`)
}