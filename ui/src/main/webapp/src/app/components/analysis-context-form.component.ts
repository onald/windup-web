import {Component, OnInit, ViewChild} from "@angular/core";
import {NgForm} from "@angular/forms";
import {ActivatedRoute, Router, NavigationEnd} from "@angular/router";

import {FormComponent} from "./form.component";
import {ApplicationGroupService} from "../services/application-group.service";
import {MigrationPathService} from "../services/migration-path.service";
import {AnalysisContextService} from "../services/analysis-context.service";
import {ConfigurationOption} from "../model/configuration-option.model";
import {ConfigurationOptionsService} from "../services/configuration-options.service";
import {ModalDialogComponent} from "./modal-dialog.component";
import {IsDirty} from "../is-dirty.interface";
import {Observable} from "rxjs/Observable";
import {PackageRegistryService} from "../services/package-registry.service";
import {ApplicationGroup, AnalysisContext, Package, MigrationPath, AdvancedOption, RulesPath, PackageMetadata} from "windup-services";
import {RouteHistoryService} from "../services/route-history.service";
import {Subscription} from "rxjs";
import {RouteFlattenerService} from "../services/route-flattener.service";
import {WindupService} from "../services/windup.service";
import {NotificationService} from "../services/notification.service";
import {utils} from "../utils";

@Component({
    templateUrl: './analysis-context-form.component.html'
})
export class AnalysisContextFormComponent extends FormComponent implements OnInit, IsDirty
{
    @ViewChild(NgForm)
    private analysisContextForm:NgForm;

    private _dirty: boolean = null;

    applicationGroup: ApplicationGroup = null;

    analysisContext:AnalysisContext;
    packageTree: Package[] = [];

    /**
     * These two variables exist because we need for the item in the array not to just be a literal.
     *
     * This works around issues with JavaScript not being able to iterate over and modify a simple array of literals within
     * a form easily.
     *
     * See also: http://stackoverflow.com/questions/33346677/angular2-ngmodel-against-ngfor-variables
     */
    includePackages: Package[];
    excludePackages: Package[];

    configurationOptions:ConfigurationOption[] = [];

    private _migrationPathsObservable:Observable<MigrationPath[]>;
    private routerSubscription: Subscription;

    isInWizard: boolean;


    action: Action;

    constructor(private _router:Router,
                private _activatedRoute: ActivatedRoute,
                private _applicationGroupService:ApplicationGroupService,
                private _migrationPathService:MigrationPathService,
                private _analysisContextService:AnalysisContextService,
                private _configurationOptionsService:ConfigurationOptionsService,
                private _packageRegistryService: PackageRegistryService,
                private _routeHistoryService: RouteHistoryService,
                private _routeFlattener: RouteFlattenerService,
                private _windupService: WindupService,
                private _notificationService: NotificationService
    ) {
        super();
        this.includePackages = [];
        this.excludePackages = [];
    }

    ngOnInit() {
        this._configurationOptionsService.getAll().subscribe((options:ConfigurationOption[]) => {
            this.configurationOptions = options;
        });

        this.routerSubscription = this._router.events.filter(event => event instanceof NavigationEnd).subscribe(_ => {
            let flatRouteData = this._routeFlattener.getFlattenedRouteData(this._activatedRoute.snapshot);

            if (flatRouteData.data['applicationGroup']) {
                let applicationGroup = flatRouteData.data['applicationGroup'];

                // Reload from the service to insure fresh data
                this._applicationGroupService.get(applicationGroup.id).subscribe(updatedGroup => {
                    this.applicationGroup = updatedGroup;
                    this.initializeAnalysisContext();
                    this.loadPackageMetadata();
                    console.log("Loaded analysis context: " + JSON.stringify(this.analysisContext));
                });
            }

            this.isInWizard = flatRouteData.data.hasOwnProperty('wizard') && flatRouteData.data['wizard'];
        });
    }

    getDefaultAnalysisContext() {
        let analysisContext = <AnalysisContext>{};
        analysisContext.migrationPath = <MigrationPath>{id: 0};
        analysisContext.advancedOptions = [];
        analysisContext.includePackages = [];
        analysisContext.excludePackages = [];
        analysisContext.rulesPaths = [];

        return analysisContext;
    }

    initializeAnalysisContext() {
        let analysisContext = this.applicationGroup.analysisContext;

        if (analysisContext == null) {
            analysisContext = this.getDefaultAnalysisContext();
        } else {
            // for migration path, store the id only
            if (analysisContext.migrationPath) {
                analysisContext.migrationPath = <MigrationPath>{id: analysisContext.migrationPath.id};
            } else {
                analysisContext.migrationPath = <MigrationPath>{id: 0};
            }

            if (analysisContext.rulesPaths == null)
                analysisContext.rulesPaths = [];
        }

        this.analysisContext = analysisContext;
    }

    private loadPackageMetadata() {
        this._applicationGroupService.getPackageMetadata(this.applicationGroup.id).subscribe(
            (packageMetadata: PackageMetadata) => {
                if (packageMetadata.scanStatus === "COMPLETE") {
                    packageMetadata.packageTree.forEach(node => {
                        this._packageRegistryService.putHierarchy(node);
                    });
                }

                this.packageTree = packageMetadata.packageTree;

                if (this.analysisContext != null) {
                    if (this.analysisContext.includePackages == null || this.analysisContext.includePackages.length == 0) {
                        this.includePackages = [];
                    } else {
                        this.includePackages = this.analysisContext.includePackages.map(node => this._packageRegistryService.get(node.id));
                    }

                    if (this.analysisContext.excludePackages == null || this.analysisContext.excludePackages.length == 0) {
                        this.analysisContext.excludePackages = [];
                    } else {
                        this.analysisContext.excludePackages = this.analysisContext.excludePackages.map(node => this._packageRegistryService.get(node.id));
                    }
                }

                this.includePackages = this.analysisContext.includePackages;
                this.excludePackages = this.analysisContext.excludePackages;
            }
        );
    }

    get migrationPaths() {
        if (this._migrationPathsObservable == null) {
            this._migrationPathsObservable = this._migrationPathService.getAll();
        }
        return this._migrationPathsObservable;
    }

    get dirty(): boolean {
        if (this._dirty != null) {
            return this._dirty;
        }

        return this.analysisContextForm.dirty;
    }

    advancedOptionsChanged(advancedOptions:AdvancedOption[]) {
        this._dirty = true;
    }

    onNodesChanged(event) {
        console.log(event);
    }

    save() {
        this.action = Action.Save;
    }

    onSubmit() {
        if (this.analysisContext.id != null) {
            console.log("Updating analysis context: " + this.analysisContext.migrationPath.id);
            this._analysisContextService.update(this.analysisContext).subscribe(
                analysisContext => {
                    this._dirty = false;
                    this.onSuccess(analysisContext);
                },
                error => this.handleError(<any> error)
            );
        } else {
            console.log("Creating analysis context: " + this.analysisContext.migrationPath.id);
            this._analysisContextService.create(this.analysisContext).subscribe(
                analysisContext => {
                    this._dirty = false;
                    this.onSuccess(analysisContext);
                },
                error => this.handleError(<any> error)
            );
        }
    }

    onSuccess(analysisContext: AnalysisContext) {
        if (this.action === Action.SaveAndRun) {
            this._windupService.executeWindupGroup(this.applicationGroup.id)
                .subscribe(execution => {
                    this._notificationService.success('Windup execution has started');
                    this._router.navigate([`/projects/${this.applicationGroup.migrationProject.id}/groups/${this.applicationGroup.id}`]);
                },
                error => {
                    this._notificationService.error(utils.getErrorMessage(error));
                });
        } else if (this.isInWizard) {
            this._router.navigate([`/projects/${this.applicationGroup.migrationProject.id}/groups/${this.applicationGroup.id}`]);
        } else {
            this.navigateBack();
        }
    }

    saveAndRun() {
        this.action = Action.SaveAndRun;
    }

    rulesPathsChanged(rulesPaths:RulesPath[]) {
        this.analysisContext.rulesPaths = rulesPaths;
    }

    viewAdvancedOptions(advancedOptionsModal:ModalDialogComponent) {
        advancedOptionsModal.show();
        return false;
    }

    cancel() {
        if (!this.isInWizard) {
            this.navigateBack();
        } else {
            this._router.navigate(['/']);
        }
    }

    navigateBack() {
        let groupPageRoute = `/projects/${this.applicationGroup.migrationProject.id}/groups/${this.applicationGroup.id}`;
        this._routeHistoryService.navigateBackOrToRoute(groupPageRoute);
    }
}

enum Action {
    Save = 0,
    SaveAndRun = 1
}
