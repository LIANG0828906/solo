import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { Trip, Activity } from '../types';
import { formatDate, getDayLabel, getDayCount } from './dateUtils';

export const generateTripPDF = async (trip: Trip, mapElement?: HTMLElement): Promise<jsPDF> => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  
  let yPos = margin;

  doc.setFillColor(20, 184, 166);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.text(trip.destination, margin, 28);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}`, margin, 35);
  
  yPos = 55;
  
  if (mapElement) {
    try {
      const canvas = await html2canvas(mapElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = contentWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      doc.addImage(imgData, 'PNG', margin, yPos, imgWidth, imgHeight);
      yPos += imgHeight + 10;
    } catch (e) {
      console.warn('Failed to capture map:', e);
    }
  }
  
  doc.addPage();
  yPos = margin;
  
  doc.setTextColor(20, 184, 166);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('每日行程安排', margin, yPos);
  yPos += 12;
  
  doc.setDrawColor(20, 184, 166);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;
  
  const dayCount = getDayCount(trip.startDate, trip.endDate);
  
  for (let dayIndex = 0; dayIndex < dayCount; dayIndex++) {
    if (yPos > pageHeight - 40) {
      doc.addPage();
      yPos = margin;
    }
    
    const dayActivities = trip.activities
      .filter(a => a.dayIndex === dayIndex)
      .sort((a, b) => a.time.localeCompare(b.time));
    
    doc.setTextColor(14, 165, 233);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(getDayLabel(trip.startDate, dayIndex), margin, yPos);
    yPos += 8;
    
    if (dayActivities.length === 0) {
      doc.setTextColor(150, 150, 150);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'italic');
      doc.text('暂无行程安排', margin + 5, yPos);
      yPos += 10;
    } else {
      dayActivities.forEach((activity, actIndex) => {
        if (yPos > pageHeight - 40) {
          doc.addPage();
          yPos = margin;
        }
        
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(margin, yPos - 5, contentWidth, 22, 3, 3, 'F');
        
        doc.setFillColor(20, 184, 166);
        doc.roundedRect(margin, yPos - 5, 4, 22, 3, 3, 'F');
        
        doc.setTextColor(30, 41, 59);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(activity.time, margin + 8, yPos + 2);
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text(`${activity.location} - ${activity.description}`, margin + 30, yPos + 2);
        
        if (activity.notes) {
          doc.setTextColor(100, 116, 139);
          doc.setFontSize(9);
          doc.setFont('helvetica', 'italic');
          doc.text(`备注: ${activity.notes}`, margin + 30, yPos + 10);
        }
        
        yPos += 24;
      });
    }
    
    yPos += 5;
  }
  
  doc.addPage();
  yPos = margin;
  
  doc.setTextColor(20, 184, 166);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('地点标记', margin, yPos);
  yPos += 12;
  
  doc.setDrawColor(20, 184, 166);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;
  
  const sortedLocations = [...trip.locations].sort((a, b) => a.dayIndex - b.dayIndex);
  
  sortedLocations.forEach((loc, index) => {
    if (yPos > pageHeight - 40) {
      doc.addPage();
      yPos = margin;
    }
    
    doc.setFillColor(20, 184, 166);
    doc.roundedRect(margin, yPos - 4, 8, 8, 2, 2, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text(String(index + 1), margin + 2.5, yPos + 2);
    
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(loc.name, margin + 14, yPos + 2);
    
    doc.setTextColor(14, 165, 233);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`第 ${loc.dayIndex + 1} 天`, margin + 14, yPos + 9);
    
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8);
    doc.text(`坐标: ${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`, margin + 14, yPos + 15);
    
    yPos += 20;
  });
  
  doc.setPage(1);
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(`由旅行规划看板生成 | ${new Date().toLocaleDateString('zh-CN')}`, margin, pageHeight - 10);
  
  return doc;
};

export const downloadPDF = async (trip: Trip, mapElement?: HTMLElement): Promise<void> => {
  const doc = await generateTripPDF(trip, mapElement);
  doc.save(`${trip.destination}-旅行规划.pdf`);
};

export const previewPDF = async (trip: Trip, mapElement?: HTMLElement): Promise<string> => {
  const doc = await generateTripPDF(trip, mapElement);
  return doc.output('datauristring');
};
