import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum Form3Type {
  INTERNACAO = 'Internação Hospitalar',
  EXAMES = 'Exames Laboratoriais e de Imagem',
  AMBULATORIO = 'Ambulatório',
  UTI = 'UTI',
  PRONTO_SOCORRO = 'Pronto Socorro',
  HEMODIALISE = 'Hemodiálise',
  CENTRO_CIRURGICO = 'Centro Cirúrgico',
}

export interface Form3Answer {
  questionId: string;
  value: number;
  reasons?: string[];
  note?: string;
}

@Entity('form3_responses')
export class Form3ResponseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: Form3Type,
  })
  formType: Form3Type;

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

  @Column()
  evaluatedDepartment: string;

  @Column({ type: 'jsonb' })
  answers: Form3Answer[];

  @Column({ default: '' })
  comments: string;

  @CreateDateColumn()
  createdAt: Date;
}

export type Form3Response = Form3ResponseEntity;
