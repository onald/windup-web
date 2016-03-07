import {Component, OnDestroy, OnInit} from "angular2/core";
import {Router} from "angular2/router";

import {WindupService} from "../services/windup.service";
import {RegisteredApplicationModel} from "../models/registered.application.model";
import {RegisteredApplicationService} from "../services/registeredapplication.service";
import {ProgressStatusModel} from "../models/progressstatus.model";

@Component({
    selector: 'application-list',
    templateUrl: 'app/templates/applicationlist.component.html',
    providers: [ RegisteredApplicationService, WindupService ]
})
export class ApplicationListComponent implements OnInit, OnDestroy {
    applications:RegisteredApplicationModel[];
    processingStatus:Map<string, ProgressStatusModel> = new Map<string, ProgressStatusModel>();
    errorMessage:string;
    private _refreshIntervalID:number;

    constructor(private _router:Router, private _registeredApplicationService:RegisteredApplicationService, private _windupService:WindupService) {}

    ngOnInit():any {
        this.getApplications();
        this._refreshIntervalID = setInterval(() => this.getApplications(), 2500);
    }

    ngOnDestroy():any {
        if (this._refreshIntervalID)
            clearInterval(this._refreshIntervalID);
    }

    status(application:RegisteredApplicationModel):ProgressStatusModel {
        let status:ProgressStatusModel = this.processingStatus.get(application.filePath);

        if (status == null) {
            status = new ProgressStatusModel();
            status.currentTask = "...";
        }
        return status;
    }

    getApplications() {
        return this._registeredApplicationService.getApplications().subscribe(
            applications => this.applicationsLoaded(applications),
            error => this.errorMessage = <any>error
        );
    }

    applicationsLoaded(applications:RegisteredApplicationModel[]) {
        applications.forEach(application => {
            this._windupService.getStatus(application.filePath).subscribe(
                status => this.processingStatus.set(application.filePath, status),
                error => this.errorMessage = <any>error
            );
        });
        this.applications = applications;
    }

    executeAnalysis(application:RegisteredApplicationModel) {
        this._windupService.executeWindup(application.filePath).subscribe(
            () => console.log("Execution started"),
            error => this.errorMessage = <any>error
        );
    }

    registerApplication() {
        this._router.navigate(['RegisterApplicationForm'])
    }
}