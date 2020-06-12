import { Component } from '@angular/core';
import { ReportState } from './constants/ReportState';
import { ReportTypeNameByCode } from './constants/ReportType';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  public title = 'reports';
  public selectedReportType: ReportState = ReportState.OPEN;
  public currentItemsOffset = 0;
  public pagesAvailable = [];
  public limitItemsPerPage = 10;
  public reports = {
    [ReportState.OPEN]: {
      count: 0,
      items: []
    },
    [ReportState.RESOLVED]: {
      count: 0,
      items: []
    },
    [ReportState.BLOCKED]: {
      count: 0,
      items: []
    }
  };
  public currentViewItemIndex = null;

  constructor(private http: HttpClient) {
    for (const type of [ReportState.OPEN, ReportState.BLOCKED, ReportState.RESOLVED]) {
      this.loadItems(type, 0);
    }
  }


  public selectReportsByType(type: number) {
    this.selectedReportType = type as ReportState;
    this.loadItems(type, 0);
  }

  public viewContent(index: number) {
    this.currentViewItemIndex = index;
  }

  public changeReportState(id: number, state: number) {
    this.http.put(`${ environment.restURI }/reports/${ id }`, { state }).subscribe(() => {
      this.loadItems(this.selectedReportType, this.currentItemsOffset);
      this.loadItems(state, 0);
    });
  }

  public loadItems(state: number, offset: number) {
    this.http.get(`${ environment.restURI }/reports?limit=10&offset=${ offset }&state=${ state }`).subscribe((data) => {
      this.reports[state] = data;

      if (state === this.selectedReportType) {
        this.currentItemsOffset = offset;
        this.pagesAvailable = Array(Math.ceil(this.reports[this.selectedReportType].count / this.limitItemsPerPage))
          .fill(0).map((s, i) => i + 1);
      }
    });
  }

  public getReportNameByType(type: number): string {
    return ReportTypeNameByCode[type];
  }

}
