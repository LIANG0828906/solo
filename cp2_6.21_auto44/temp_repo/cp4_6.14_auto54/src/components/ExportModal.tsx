import React, { useEffect, useRef, useState } from 'react';
import { FileDown } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { Trip, TripEvent } from '@/types';

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
  trip: Trip;
}

const ExportModal: React.FC<ExportModalProps> = ({ open, onClose, trip }) => {
  const [progress, setProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const downloadTriggeredRef = useRef(false);

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yOffset = 20;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text(`Trip: ${trip.name}`, pageWidth / 2, yOffset, { align: 'center' });
    yOffset += 15;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text(`Date: ${trip.startDate} ~ ${trip.endDate}`, pageWidth / 2, yOffset, { align: 'center' });
    yOffset += 10;
    doc.text(`Budget: ${trip.budget.toFixed(2)} | Spent: ${trip.totalSpent.toFixed(2)}`, pageWidth / 2, yOffset, { align: 'center' });
    yOffset += 20;

    trip.days.forEach((day, dayIndex) => {
      if (yOffset > pageHeight - 40) {
        doc.addPage();
        yOffset = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(`Day ${dayIndex + 1} - ${day.date}`, 20, yOffset);
      yOffset += 8;
      doc.setDrawColor(200, 200, 200);
      doc.line(20, yOffset, pageWidth - 20, yOffset);
      yOffset += 10;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Day Cost: ${day.totalCost.toFixed(2)}`, 20, yOffset);
      yOffset += 10;

      day.events.forEach((event: TripEvent) => {
        if (yOffset > pageHeight - 60) {
          doc.addPage();
          yOffset = 20;
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text(event.title, 25, yOffset);
        yOffset += 7;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        const startTime = event.startTime ? event.startTime.slice(11, 16) : '--';
        const endTime = event.endTime ? event.endTime.slice(11, 16) : '--';
        doc.text(`Time: ${startTime} - ${endTime}`, 25, yOffset);
        yOffset += 6;
        doc.text(`Location: ${event.location || '--'}`, 25, yOffset);
        yOffset += 6;
        if (event.notes) {
          const notesLines = doc.splitTextToSize(event.notes, pageWidth - 50);
          doc.text(`Notes: ${notesLines[0]}`, 25, yOffset);
          for (let i = 1; i < notesLines.length; i++) {
            yOffset += 6;
            if (yOffset > pageHeight - 20) {
              doc.addPage();
              yOffset = 20;
            }
            doc.text(notesLines[i], 30, yOffset);
          }
          yOffset += 6;
        }
        if (event.cost !== undefined) {
          doc.text(`Cost: ${event.cost.toFixed(2)}`, 25, yOffset);
          yOffset += 6;
        }
        if (event.tags && event.tags.length > 0) {
          doc.text(`Tags: ${event.tags.join(', ')}`, 25, yOffset);
          yOffset += 6;
        }
        yOffset += 6;
      });

      yOffset += 10;
    });

    const fileName = `行程_${trip.startDate}_${trip.endDate}.pdf`;
    doc.save(fileName);
  };

  useEffect(() => {
    if (!open) {
      setProgress(0);
      setIsCompleted(false);
      downloadTriggeredRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    setProgress(0);
    setIsCompleted(false);
    downloadTriggeredRef.current = false;

    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 5;
        if (next >= 100) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setIsCompleted(true);
          if (!downloadTriggeredRef.current) {
            downloadTriggeredRef.current = true;
            setTimeout(() => {
              generatePDF();
            }, 400);
          }
          return 100;
        }
        return next;
      });
    }, 80);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [open, trip.id]);

  if (!open) return null;

  const fileName = `行程_${trip.startDate}_${trip.endDate}.pdf`;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000 }}>
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          backgroundColor: '#ffffff',
          borderRadius: 16,
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
          padding: 32,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              backgroundColor: '#fff7ed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}
          >
            <FileDown size={48} color="#f97316" strokeWidth={1.5} />
          </div>

          <h3
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: '#1e293b',
              margin: '0 0 8px',
            }}
          >
            导出行程PDF
          </h3>

          <div
            style={{
              fontSize: 12,
              color: '#94a3b8',
              marginBottom: 24,
              wordBreak: 'break-all',
            }}
          >
            {fileName}
          </div>

          <div
            style={{
              width: '100%',
              height: 8,
              backgroundColor: '#f1f5f9',
              borderRadius: 4,
              overflow: 'hidden',
              marginBottom: 12,
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: '100%',
                backgroundColor: '#3b82f6',
                borderRadius: 4,
                transition: 'width 80ms linear',
              }}
            />
          </div>

          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: '#334155',
              marginBottom: isCompleted ? 20 : 0,
            }}
          >
            {progress}%
          </div>

          {isCompleted && (
            <>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: '#10b981',
                  marginBottom: 20,
                }}
              >
                导出完成！
              </div>

              <button
                onClick={onClose}
                style={{
                  width: '100%',
                  padding: '12px 24px',
                  backgroundColor: '#3b82f6',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#2563eb';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#3b82f6';
                }}
              >
                关闭
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
