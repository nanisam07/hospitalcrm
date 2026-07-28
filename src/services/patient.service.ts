import { PatientRepository, PatientFilterOptions } from '../repositories/patient.repository';
import { AuditRepository } from '../repositories/audit.repository';
import { Patient, Prisma } from '@prisma/client';

export class PatientService {
  private patientRepository: PatientRepository;
  private auditRepository: AuditRepository;

  constructor() {
    this.patientRepository = new PatientRepository();
    this.auditRepository = new AuditRepository();
  }

  async createPatient(data: Prisma.PatientCreateInput, actorId: string, actorRole: string): Promise<Patient> {
    const patient = await this.patientRepository.create(data);
    await this.auditRepository.log(
      actorId,
      actorRole,
      'Patient Created',
      `Patient ${patient.fullName} (${patient.phone}) manually registered.`
    );
    return patient;
  }

  async getPatientById(id: string): Promise<Patient | null> {
    return this.patientRepository.findById(id);
  }

  async getPatientByPhone(phone: string): Promise<Patient | null> {
    return this.patientRepository.findByPhone(phone);
  }

  async updatePatient(id: string, data: Prisma.PatientUpdateInput, actorId: string, actorRole: string): Promise<Patient> {
    const patient = await this.patientRepository.update(id, data);
    await this.auditRepository.log(
      actorId,
      actorRole,
      'Patient Updated',
      `Patient ${patient.fullName} profile updated.`
    );
    return patient;
  }

  async deletePatient(id: string, actorId: string, actorRole: string): Promise<Patient> {
    const patient = await this.patientRepository.delete(id);
    await this.auditRepository.log(
      actorId,
      actorRole,
      'Patient Deleted',
      `Patient ${patient.fullName} deleted from database.`
    );
    return patient;
  }

  async getAllPatients(options: PatientFilterOptions) {
    return this.patientRepository.findAll(options);
  }
}
export default PatientService;
