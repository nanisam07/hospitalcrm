import { PrismaClient, UserRole, AppointmentStatus, SenderType, MessageType, DeliveryStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Clean existing records
  await prisma.auditLog.deleteMany({});
  await prisma.conversation.deleteMany({});
  await prisma.appointment.deleteMany({});
  await prisma.doctor.deleteMany({});
  await prisma.patient.deleteMany({});
  await prisma.chatSession.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.hospitalSettings.deleteMany({});

  // 2. Hash passwords
  const adminPasswordHash = await bcrypt.hash('AdminPass123!', 10);
  const recepPasswordHash = await bcrypt.hash('RecepPass123!', 10);

  // 3. Seed Users
  const adminUser = await prisma.user.create({
    data: {
      name: 'System Administrator',
      email: 'admin@hospital.com',
      password: adminPasswordHash,
      role: UserRole.ADMIN,
    },
  });

  const receptionistUser = await prisma.user.create({
    data: {
      name: 'Sarah Receptionist',
      email: 'reception@hospital.com',
      password: recepPasswordHash,
      role: UserRole.RECEPTIONIST,
    },
  });

  console.log('Seeded Users:', { admin: adminUser.email, receptionist: receptionistUser.email });

  // 4. Seed Hospital Settings
  const settings = await prisma.hospitalSettings.create({
    data: {
      id: 1,
      hospitalName: 'Linelekunda Super Speciality Hospital',
      phone: '+919876543210',
      emergencyNumber: '+919876543219',
      email: 'contact@linelekundahospital.com',
      address: '101, Medical Enclave, Sector 15, New Delhi, India',
      googleMapsLink: 'https://maps.google.com/?q=Linelekunda+Hospital',
      openingTime: '08:00',
      closingTime: '20:00',
    },
  });

  console.log('Seeded Hospital Settings:', settings.hospitalName);

  // 5. Seed Doctors for all 14 departments
  const departments = [
    { name: 'General Physician', specialization: 'Family Medicine & Primary Care' },
    { name: 'ENT', specialization: 'Otolaryngology (Ear, Nose, Throat)' },
    { name: 'Orthopedic', specialization: 'Bone and Joint Surgery' },
    { name: 'Cardiology', specialization: 'Cardiovascular Diseases' },
    { name: 'Neurology', specialization: 'Brain & Nervous System Care' },
    { name: 'Dermatology', specialization: 'Skin, Hair & Nail Disorders' },
    { name: 'Pediatrics', specialization: 'Child Healthcare & Neonatology' },
    { name: 'Gynecology', specialization: 'Women Reproductive Health' },
    { name: 'Dental', specialization: 'Orthodontics & Dental Surgery' },
    { name: 'Ophthalmology (Eye)', specialization: 'Eye Care & Cataract Surgery' },
    { name: 'Pulmonology', specialization: 'Lung & Respiratory Care' },
    { name: 'Urology', specialization: 'Urinary Tract & Kidney Care' },
    { name: 'Psychiatry', specialization: 'Mental Health & Therapy' },
    { name: 'Gastroenterology', specialization: 'Digestive & Liver Health' }
  ];

  const doctorsData = [
    { name: 'Dr. Ramesh Kumar', department: 'General Physician', availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], availableTime: '09:00 - 13:00' },
    { name: 'Dr. Aditi Sharma', department: 'General Physician', availableDays: ['Monday', 'Wednesday', 'Friday', 'Saturday'], availableTime: '14:00 - 18:00' },
    { name: 'Dr. Vivek Malhotra', department: 'ENT', availableDays: ['Tuesday', 'Thursday', 'Saturday'], availableTime: '10:00 - 15:00' },
    { name: 'Dr. Arjun Mehta', department: 'Orthopedic', availableDays: ['Monday', 'Wednesday', 'Thursday'], availableTime: '09:00 - 14:00' },
    { name: 'Dr. Sandeep Sen', department: 'Cardiology', availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Friday'], availableTime: '08:00 - 12:00' },
    { name: 'Dr. Anjali Gupta', department: 'Neurology', availableDays: ['Tuesday', 'Thursday'], availableTime: '11:00 - 16:00' },
    { name: 'Dr. Pooja Bannerjee', department: 'Dermatology', availableDays: ['Monday', 'Wednesday', 'Saturday'], availableTime: '15:00 - 19:00' },
    { name: 'Dr. Rajesh Patel', department: 'Pediatrics', availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], availableTime: '09:00 - 14:00' },
    { name: 'Dr. Meena Iyer', department: 'Gynecology', availableDays: ['Wednesday', 'Thursday', 'Friday'], availableTime: '12:00 - 17:00' },
    { name: 'Dr. Kunal Kapoor', department: 'Dental', availableDays: ['Monday', 'Tuesday', 'Thursday', 'Friday'], availableTime: '10:00 - 18:00' },
    { name: 'Dr. Nidhi Verma', department: 'Ophthalmology (Eye)', availableDays: ['Monday', 'Wednesday', 'Friday'], availableTime: '09:00 - 13:00' },
    { name: 'Dr. Sameer Deshmukh', department: 'Pulmonology', availableDays: ['Tuesday', 'Friday'], availableTime: '14:00 - 18:00' },
    { name: 'Dr. Tushar Saxena', department: 'Urology', availableDays: ['Wednesday', 'Saturday'], availableTime: '11:00 - 15:00' },
    { name: 'Dr. Vikram Seth', department: 'Psychiatry', availableDays: ['Monday', 'Thursday'], availableTime: '15:00 - 19:00' },
    { name: 'Dr. Shalini Roy', department: 'Gastroenterology', availableDays: ['Tuesday', 'Thursday', 'Friday'], availableTime: '10:00 - 14:00' }
  ];

  const seededDoctors = [];
  for (const doc of doctorsData) {
    const deptInfo = departments.find(d => d.name === doc.department);
    const doctor = await prisma.doctor.create({
      data: {
        name: doc.name,
        department: doc.department,
        specialization: deptInfo ? deptInfo.specialization : 'Specialist',
        availableDays: doc.availableDays,
        availableTime: doc.availableTime,
      },
    });
    seededDoctors.push(doctor);
  }

  console.log(`Seeded ${seededDoctors.length} doctors across ${departments.length} departments.`);

  // 6. Seed Patients
  const patientsData = [
    { fullName: 'John Doe', phone: '+919999999991', address: 'Flat 402, Sunshine Apts, New Delhi', latitude: 28.6139, longitude: 77.2090 },
    { fullName: 'Jane Smith', phone: '+919999999992', address: 'Sector 4, Dwarka, Delhi', latitude: 28.5921, longitude: 77.0460 },
    { fullName: 'Amit Patel', phone: '+919999999993', address: 'M G Road, Gurgaon, Haryana', latitude: 28.4595, longitude: 77.0266 },
    { fullName: 'Priya Sharma', phone: '+919999999994', address: 'Indiranagar, Bangalore, Karnataka', latitude: 12.9716, longitude: 77.5946 }
  ];

  const seededPatients = [];
  for (const pat of patientsData) {
    const patient = await prisma.patient.create({
      data: pat,
    });
    seededPatients.push(patient);
  }
  console.log(`Seeded ${seededPatients.length} patients.`);

  // 7. Seed Appointments
  const appointmentsData = [
    {
      patientId: seededPatients[0].id,
      department: 'Cardiology',
      reason: 'Frequent chest tightness during exercise',
      preferredDate: new Date('2026-08-01T00:00:00.000Z'),
      preferredTime: '10:00 AM',
      status: AppointmentStatus.PENDING,
    },
    {
      patientId: seededPatients[1].id,
      doctorId: seededDoctors.find(d => d.department === 'Pediatrics')?.id,
      department: 'Pediatrics',
      reason: 'Routine immunization schedule checkup',
      preferredDate: new Date('2026-07-30T00:00:00.000Z'),
      preferredTime: '11:30 AM',
      status: AppointmentStatus.CONFIRMED,
    },
    {
      patientId: seededPatients[2].id,
      doctorId: seededDoctors.find(d => d.department === 'Orthopedic')?.id,
      department: 'Orthopedic',
      reason: 'Follow-up on right ankle sprain recovery',
      preferredDate: new Date('2026-07-20T00:00:00.000Z'),
      preferredTime: '03:00 PM',
      status: AppointmentStatus.COMPLETED,
    },
    {
      patientId: seededPatients[3].id,
      department: 'Dermatology',
      reason: 'Sudden allergic skin rash on hands',
      preferredDate: new Date('2026-08-02T00:00:00.000Z'),
      preferredTime: '04:30 PM',
      status: AppointmentStatus.PENDING,
    }
  ];

  for (const app of appointmentsData) {
    await prisma.appointment.create({
      data: app,
    });
  }
  console.log('Seeded initial appointments.');

  // 8. Seed Conversation logs
  const conversationsData = [
    // Conversation history with Patient 0 (John Doe)
    {
      patientId: seededPatients[0].id,
      message: 'Hi, I would like to book an appointment.',
      sender: SenderType.PATIENT,
      messageType: MessageType.TEXT,
      deliveryStatus: DeliveryStatus.READ,
    },
    {
      patientId: seededPatients[0].id,
      message: 'Welcome to Linelekunda Hospital! May I know your full name?',
      sender: SenderType.BOT,
      messageType: MessageType.TEXT,
      deliveryStatus: DeliveryStatus.READ,
    },
    {
      patientId: seededPatients[0].id,
      message: 'John Doe',
      sender: SenderType.PATIENT,
      messageType: MessageType.TEXT,
      deliveryStatus: DeliveryStatus.READ,
    },
    {
      patientId: seededPatients[0].id,
      message: 'Thank you John Doe. Please choose a department from the list.',
      sender: SenderType.BOT,
      messageType: MessageType.TEXT,
      deliveryStatus: DeliveryStatus.READ,
    },
    {
      patientId: seededPatients[0].id,
      message: 'Cardiology',
      sender: SenderType.PATIENT,
      messageType: MessageType.TEXT,
      deliveryStatus: DeliveryStatus.READ,
    },
    // Manual follow-up from staff
    {
      patientId: seededPatients[0].id,
      message: 'Hello John, we see your request for Cardiology. Please note we have slots on August 1st.',
      sender: SenderType.DOCTOR,
      messageType: MessageType.TEXT,
      deliveryStatus: DeliveryStatus.DELIVERED,
    }
  ];

  for (const conv of conversationsData) {
    await prisma.conversation.create({
      data: conv,
    });
  }
  console.log('Seeded Conversation logs.');

  // 9. Seed Audit Logs
  const auditLogsData = [
    { actor: 'SYSTEM', actorRole: 'SYSTEM', action: 'System Setup', details: 'Database initialized and seeded with basic settings and departments.' },
    { actor: adminUser.id, actorRole: 'ADMIN', action: 'Admin Login', details: 'Admin user logged in during system seeding verification.' },
    { actor: 'BOT', actorRole: 'BOT', action: 'Patient Created', details: 'Patient John Doe registered through chatbot flow.' },
    { actor: 'BOT', actorRole: 'BOT', action: 'Appointment Created', details: 'Pending appointment in Cardiology created for John Doe.' }
  ];

  for (const log of auditLogsData) {
    await prisma.auditLog.create({
      data: log,
    });
  }
  console.log('Seeded initial Audit Logs.');

  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
