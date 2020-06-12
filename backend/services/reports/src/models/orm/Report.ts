import { BeforeInsert, Column, Entity, Index, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import ReportState from '../../constants/ReportState';
import { ReportMetaData } from './ReportMetaData';

@Entity()
@Index(['state', 'date'])
export class Report {

  @PrimaryGeneratedColumn({ type: 'bigint' })
  public id: number;

  @Column({ type: 'int', default: ReportState.OPEN })
  public state: ReportState;

  @OneToOne(type => ReportMetaData, metadata => metadata.report, { cascade: true })
  public payload: ReportMetaData;

  @Column({ type: 'bigint' })
  public date: number;

  @BeforeInsert()
  public updateDates() {
    this.date = Date.now();
  }
}
