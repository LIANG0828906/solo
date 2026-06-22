export interface Patient {
  id: string;
  name: string;
  phone: string;
  createdAt: string;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  usage: string;
  days: number;
  dispensed: boolean;
}

export interface Prescription {
  id: string;
  prescriptionNo: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  doctorName: string;
  medications: Medication[];
  status: 'pending' | 'dispensed';
  createdAt: string;
  expiresAt: string;
  reminders: string[];
}

export interface CreatePrescriptionRequest {
  patientPhone: string;
  patientName: string;
  doctorName: string;
  medications: Omit<Medication, 'id' | 'dispensed'>[];
}

export interface UpdateStatusRequest {
  status: 'dispensed';
  dispensedMedications: string[];
}

export interface UpdateRemindersRequest {
  reminders: string[];
}
