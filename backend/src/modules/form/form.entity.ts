import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export interface SatisfactionRatings {
  overallCare: number;
  nursingCare: number;
  medicalCare: number;
  welcoming: number;
  cleanliness: number;
  comfort: number;
  responseTime: number;
  wouldRecommend: number;
  overallSatisfaction: number;
}

export interface ExperienceAnswers {
  professionalsIdentified: boolean;
  nameVerified: boolean;
  treatmentExplained: boolean;
  participatedInDecisions: boolean;
  medicationInstructionsClear: boolean;
  dischargeOrientationComplete: boolean;
  knewWhoToAsk: boolean;
  privacyRespected: boolean;
}

@Entity('form_responses')
export class FormResponseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  patientName: string;

  @Column({ length: 11 })
  patientCpf: string;

  @Column()
  patientAge: number;

  @Column()
  patientGender: string;

  @Column()
  admissionDate: string;

  @Column()
  dischargeDate: string;

  @Column({ name: 'evaluated_department' })
  evaluatedDepartment: string;

  @Column({ type: 'jsonb' })
  satisfaction: SatisfactionRatings;

  @Column({ type: 'jsonb' })
  experience: ExperienceAnswers;

  @Column({ default: '' })
  comments: string;

  @CreateDateColumn()
  createdAt: Date;
}

export type FormResponse = FormResponseEntity;
