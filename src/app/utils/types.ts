export type ClinicStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Clinic {
  id: string;
  name: string;
  address: string;
  phone: string;
  description: string;
  image?: string;
  documentUrl: string;
  status: ClinicStatus;
  ownerId: string;
  owner: {
    id: string;
    name?: string | null;
    email: string;
  };
  createdAt: string;
  updatedAt: string;

  // Optional relations
  doctors?: Doctor[];
  slots?: Slot[];
  services?: Service[];
  workingHours?: ClinicWorkingHours[];
}

export type ServiceStatus = 'ACTIVE' | 'INACTIVE';

export interface Service {
  id: string;
  name: string;
  description?: string;
  price?: number;
  category: string;
  isActive: ServiceStatus;
  clinicId?: string;
  createdAt: string;
  updatedAt: string;

  // Optional back-reference
  clinic?: Pick<Clinic, 'id' | 'name'>;
}

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  image?: string;
  clinicId: string;
  createdAt: string;
  updatedAt: string;
}

export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

export interface ClinicWorkingHours {
  day: DayOfWeek
  openTime: string
  closeTime: string
  duration: number
  isEnabled: boolean
}

export type SlotStatus = 'AVAILABLE' | 'BOOKED' | 'BLOCKED';

export interface Slot {
  id: string;
  clinicId: string;
  startTime: string;
  endTime: string;
  status: SlotStatus;
  createdAt: string;
}
