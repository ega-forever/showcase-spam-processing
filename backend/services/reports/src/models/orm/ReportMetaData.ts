import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import ReportType from '../../constants/ReportType';
import SourceReferenceType from '../../constants/SourceReferenceType';
import SourceType from '../../constants/SourceType';
import { Report } from './Report';

@Entity()
export class ReportMetaData {

  @PrimaryGeneratedColumn({ type: 'bigint' })
  public id: number;

  @OneToOne(type => Report, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn()
  public report: Report;

  @Column({ type: 'int' })
  public sourceType: SourceType;

  @Column({ type: 'int' })
  public reportType: ReportType;

  @Column()
  public message: string;

  @Column({ unique: true })
  public externalReportId: string;

  @Column()
  public referenceResourceId: string;

  @Column({ type: 'int' })
  public referenceResourceType: SourceReferenceType;
}
