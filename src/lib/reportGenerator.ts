/**
 * PDF report generator for diagnosis results.
 * Uses jsPDF to create downloadable per-diagnosis reports.
 */
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Diagnosis } from './types'

export async function generateDiagnosisReport(diagnosis: Diagnosis, imageUrl?: string | null) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.width
  const margin = 20

  // Header — green bar
  doc.setFillColor(74, 124, 89)
  doc.rect(0, 0, pageWidth, 35, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('AgriSmart Diagnosis Report', margin, 22)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Intelligent Fertilizer & Pesticide Sprinkling System', margin, 30)

  // Reset text color
  doc.setTextColor(45, 51, 25)

  let yPos = 50

  // Report meta
  doc.setFontSize(9)
  doc.setTextColor(107, 113, 96)
  doc.text(`Report ID: ${diagnosis.id}`, margin, yPos)
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - margin - 70, yPos)
  yPos += 8
  doc.text(`Diagnosis Date: ${new Date(diagnosis.created_at).toLocaleString()}`, margin, yPos)
  doc.text(`Model: ${diagnosis.model_id}`, pageWidth - margin - 70, yPos)
  yPos += 12

  // Image (if available)
  if (imageUrl) {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const reader = new FileReader()
      const dataUrl = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string)
        reader.readAsDataURL(blob)
      })
      doc.addImage(dataUrl, 'JPEG', margin, yPos, 80, 60)
      yPos += 65
    } catch {
      // Skip image if it fails to load
      doc.setTextColor(107, 113, 96)
      doc.setFontSize(9)
      doc.text('[Image could not be loaded]', margin, yPos + 5)
      yPos += 12
    }
  }

  // Diagnosis Result table
  yPos += 5
  doc.setTextColor(45, 51, 25)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Diagnosis Result', margin, yPos)
  yPos += 8

  const d = diagnosis.decision
  autoTable(doc, {
    startY: yPos,
    margin: { left: margin, right: margin },
    head: [['Field', 'Value']],
    body: [
      ['Detected Label', d.label],
      ['Confidence', `${Math.round(d.confidence * 100)}%`],
      ['Action Type', d.actionType.charAt(0).toUpperCase() + d.actionType.slice(1)],
      ['Spray Required', d.spray ? 'Yes' : 'No'],
      ['Recommendation', d.recommendation],
      ['Dosage', d.dosage],
      ['Notes', d.notes],
      ['Reason', d.reason],
      ['Rule Version', d.ruleVersion],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [74, 124, 89],
      textColor: 255,
      fontSize: 10,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [45, 51, 25],
    },
    alternateRowStyles: {
      fillColor: [244, 248, 240],
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 45 },
      1: { cellWidth: 'auto' },
    },
  })

  // Raw predictions table
  const rawPreds = extractPredictions(diagnosis.raw_inference)
  if (rawPreds.length > 0) {
    const finalY = (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? yPos + 80
    const predY = finalY + 15
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Model Predictions', margin, predY)

    autoTable(doc, {
      startY: predY + 5,
      margin: { left: margin, right: margin },
      head: [['Class', 'Confidence']],
      body: rawPreds.map((p) => [p.label, `${Math.round(p.confidence * 100)}%`]),
      theme: 'grid',
      headStyles: { fillColor: [74, 124, 89], textColor: 255, fontSize: 10 },
      bodyStyles: { fontSize: 9, textColor: [45, 51, 25] },
      alternateRowStyles: { fillColor: [244, 248, 240] },
    })
  }

  // Footer
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    const pageHeight = doc.internal.pageSize.height
    doc.setFontSize(8)
    doc.setTextColor(156, 163, 152)
    doc.text('AgriSmart — Intelligent Fertilizer & Pesticide Sprinkling System', margin, pageHeight - 10)
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin - 20, pageHeight - 10)
  }

  // Download
  const fileName = `diagnosis_report_${diagnosis.id.slice(0, 8)}_${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(fileName)
}

function extractPredictions(raw: unknown): Array<{ label: string; confidence: number }> {
  if (!raw || typeof raw !== 'object') return []
  const predictions = (raw as { predictions?: unknown }).predictions

  if (Array.isArray(predictions)) {
    return predictions
      .map((p) => {
        if (!p || typeof p !== 'object') return { label: 'unknown', confidence: 0 }
        const po = p as { class?: unknown; confidence?: unknown }
        return {
          label: typeof po.class === 'string' ? po.class : String(po.class ?? 'unknown'),
          confidence: typeof po.confidence === 'number' ? po.confidence : Number(po.confidence ?? 0),
        }
      })
      .filter((x) => Number.isFinite(x.confidence))
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 10)
  }

  if (predictions && typeof predictions === 'object') {
    return Object.entries(predictions as Record<string, unknown>)
      .map(([label, v]) => {
        const vo = v as { confidence?: unknown }
        return {
          label,
          confidence: typeof vo?.confidence === 'number' ? vo.confidence : Number(vo?.confidence ?? 0),
        }
      })
      .filter((x) => Number.isFinite(x.confidence))
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 10)
  }

  return []
}
