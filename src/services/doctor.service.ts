import { DoctorRepository, DoctorFilterOptions } from '../repositories/doctor.repository';
import { AuditRepository } from '../repositories/audit.repository';
import { Doctor, Prisma } from '@prisma/client';

export class DoctorService {
  private doctorRepository: DoctorRepository;
  private auditRepository: AuditRepository;

  constructor() {
    this.doctorRepository = new DoctorRepository();
    this.auditRepository = new AuditRepository();
  }

  async createDoctor(data: Prisma.DoctorCreateInput, actorId: string, actorRole: string): Promise<Doctor> {
    const doctor = await this.doctorRepository.create(data);
    await this.auditRepository.log(
      actorId,
      actorRole,
      'Doctor Created',
      `Doctor ${doctor.name} registered under department ${doctor.department}.`
    );
    return doctor;
  }

  async getDoctorById(id: string): Promise<Doctor | null> {
    return this.doctorRepository.findById(id);
  }

  async updateDoctor(id: string, data: Prisma.DoctorUpdateInput, actorId: string, actorRole: string): Promise<Doctor> {
    const doctor = await this.doctorRepository.update(id, data);
    await this.auditRepository.log(
      actorId,
      actorRole,
      'Doctor Updated',
      `Doctor ${doctor.name} profile updated.`
    );
    return doctor;
  }

  async deleteDoctor(id: string, actorId: string, actorRole: string): Promise<Doctor> {
    const doctor = await this.doctorRepository.delete(id);
    await this.auditRepository.log(
      actorId,
      actorRole,
      'Doctor Deleted',
      `Doctor ${doctor.name} deleted from database.`
    );
    return doctor;
  }

  async getAllDoctors(options: DoctorFilterOptions) {
    return this.doctorRepository.findAll(options);
  }
}
export default DoctorService;
