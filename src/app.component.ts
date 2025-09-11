import { ChangeDetectionStrategy, Component, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimelineComponent } from './components/timeline/timeline.component';
import { Phase } from './phase.interface';

declare var jspdf: any;
declare var JSZip: any;

@Component({
  selector: 'app-root',
  template: `
    <main class="py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-4xl mx-auto space-y-12">
        <div>
          <!-- Header -->
          <header class="text-center mb-12">
            <h1 class="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
              Elastic Project Onboarding
            </h1>
            <p class="mt-4 text-lg text-slate-600">
              Define your project phases and visualize the timeline instantly.
            </p>
          </header>

          <!-- Project Details Form -->
          <section class="bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-slate-200 space-y-6">
            <div>
              <label for="project-name" class="block text-sm font-medium text-slate-700 mb-1">Project Name</label>
              <input type="text" id="project-name" [value]="projectName()" (input)="updateProjectName($event)" class="block w-full px-4 py-2 bg-slate-200 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition" placeholder="e.g., Q4 Marketing Campaign">
            </div>
            <div>
              <label for="project-scope" class="block text-sm font-medium text-slate-700 mb-1">Project Scope</label>
              <textarea id="project-scope" rows="4" [value]="projectScope()" (input)="updateProjectScope($event)" class="block w-full px-4 py-2 bg-slate-200 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition" placeholder="Briefly describe the goals and deliverables..."></textarea>
            </div>
          </section>

          <!-- Project Phases -->
          <section class="space-y-6 mt-12">
            @for (phase of phases(); track phase.id; let i = $index) {
              <div class="bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-slate-200 transition-all duration-300 ease-in-out">
                <div class="flex justify-between items-center mb-6">
                  <input type="text" [value]="phase.name" (input)="updatePhaseField(i, 'name', $any($event.target).value)" class="text-xl font-bold text-slate-800 bg-transparent focus:bg-slate-100 rounded p-1 -m-1 outline-none focus:ring-2 focus:ring-indigo-400" />
                  @if (phases().length > 1) {
                    <button (click)="removePhase(phase.id)" class="text-slate-400 hover:text-red-600 transition-colors rounded-full p-1 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  }
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                  <!-- Start Date -->
                  <div>
                    <label [for]="'start-date-' + i" class="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                    <input type="date" [id]="'start-date-' + i" [value]="phase.startDate" (change)="updatePhaseField(i, 'startDate', $any($event.target).value)" class="block w-full px-3 py-2 bg-slate-200 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition">
                  </div>
                  <!-- End Date -->
                  <div>
                    <label [for]="'end-date-' + i" class="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                    <input type="date" [id]="'end-date-' + i" [value]="phase.endDate" (change)="updatePhaseField(i, 'endDate', $any($event.target).value)" [min]="phase.startDate" [disabled]="!phase.startDate"
                           class="block w-full px-3 py-2 bg-slate-200 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition disabled:bg-slate-300 disabled:cursor-not-allowed"
                           [class.border-red-500]="validationErrors()[phase.id]?.endDate"
                           [class.focus:border-red-500]="validationErrors()[phase.id]?.endDate">
                    @if(validationErrors()[phase.id]?.endDate) {
                      <p class="mt-1 text-sm text-red-600">{{ validationErrors()[phase.id].endDate }}</p>
                    }
                  </div>
                  <!-- Milestone Date -->
                  <div>
                    <label [for]="'milestone-date-' + i" class="block text-sm font-medium text-slate-700 mb-1">Milestone Date (Optional)</label>
                    <input type="date" [id]="'milestone-date-' + i" [value]="phase.milestoneDate" (change)="updatePhaseField(i, 'milestoneDate', $any($event.target).value)" [min]="phase.startDate" [max]="phase.endDate" [disabled]="!phase.endDate"
                           class="block w-full px-3 py-2 bg-slate-200 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition disabled:bg-slate-300 disabled:cursor-not-allowed"
                           [class.border-red-500]="validationErrors()[phase.id]?.milestoneDate"
                           [class.focus:border-red-500]="validationErrors()[phase.id]?.milestoneDate">
                     @if(validationErrors()[phase.id]?.milestoneDate) {
                      <p class="mt-1 text-sm text-red-600">{{ validationErrors()[phase.id].milestoneDate }}</p>
                    }
                  </div>
                  <!-- Support Handover Date -->
                  <div>
                    <label [for]="'handover-date-' + i" class="block text-sm font-medium text-slate-700 mb-1">Support Handover Date</label>
                    <input type="date" [id]="'handover-date-' + i" [value]="phase.supportHandoverDate" (change)="updatePhaseField(i, 'supportHandoverDate', $any($event.target).value)" [min]="phase.startDate" [disabled]="!phase.startDate"
                           class="block w-full px-3 py-2 bg-slate-200 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition disabled:bg-slate-300 disabled:cursor-not-allowed"
                           [class.border-red-500]="validationErrors()[phase.id]?.supportHandoverDate"
                           [class.focus:border-red-500]="validationErrors()[phase.id]?.supportHandoverDate">
                    @if(validationErrors()[phase.id]?.supportHandoverDate) {
                      <p class="mt-1 text-sm text-red-600">{{ validationErrors()[phase.id].supportHandoverDate }}</p>
                    }
                  </div>
                </div>
              </div>
            }
          </section>

          <!-- Actions -->
          <div class="flex justify-center mt-12">
            <button (click)="addPhase()" class="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
              </svg>
              Add Phase
            </button>
          </div>

          <!-- Timeline Visualization -->
          <div class="mt-12">
            <app-timeline [phases]="phases()" />
          </div>
        </div>

        <!-- Phase Documents -->
        <section class="bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-slate-200 space-y-6">
          <h2 class="text-2xl font-bold text-slate-800">Phase Documents</h2>
          <p class="text-slate-500">Provide documents or notes for each project phase.</p>
          <div class="space-y-8">
            @for (phase of phases(); track phase.id; let i = $index) {
              <div class="pt-6 border-t border-slate-200 first:border-t-0 first:pt-0">
                 <h3 class="text-lg font-bold text-slate-800 mb-4">{{ phase.name }}</h3>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <!-- Design Plan -->
                    <div class="space-y-4">
                      <h4 class="text-md font-semibold text-slate-700">Design Plan</h4>
                      <div class="flex items-center">
                        <input [id]="'design-na-' + i" type="checkbox" [checked]="phase.designPlanNotAvailable" (change)="updatePhaseField(i, 'designPlanNotAvailable', $any($event.target).checked)" class="h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500">
                        <label [for]="'design-na-' + i" class="ml-2 block text-sm text-slate-900">Not Available</label>
                      </div>
                      <div>
                        <label [for]="'design-text-' + i" class="block text-sm font-medium text-slate-700">Notes / Link to document</label>
                        <textarea [id]="'design-text-' + i" rows="3" [value]="phase.designPlanText" (input)="updatePhaseField(i, 'designPlanText', $any($event.target).value)" [disabled]="phase.designPlanNotAvailable" class="mt-1 block w-full px-3 py-2 bg-slate-200 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition disabled:bg-slate-300 disabled:cursor-not-allowed" placeholder="Add a brief description or a link..."></textarea>
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-slate-700">Upload Document</label>
                        <div class="mt-1 flex items-center gap-4">
                          <label [for]="'design-file-' + i" class="relative cursor-pointer inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500 transition" [class.bg-slate-300]="phase.designPlanNotAvailable" [class.cursor-not-allowed]="phase.designPlanNotAvailable" [class.opacity-50]="phase.designPlanNotAvailable">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                            <span>Upload File</span>
                            <input type="file" [id]="'design-file-' + i" (change)="handleFileUpload(i, 'design', $event)" [disabled]="phase.designPlanNotAvailable" class="sr-only">
                          </label>
                          @if(phase.designPlanFileName) {
                            <span class="text-sm text-slate-600 truncate">{{ phase.designPlanFileName }}</span>
                          }
                        </div>
                      </div>
                    </div>

                    <!-- Test Plan -->
                    <div class="space-y-4">
                      <h4 class="text-md font-semibold text-slate-700">Test Plan</h4>
                      <div class="flex items-center">
                        <input [id]="'test-na-' + i" type="checkbox" [checked]="phase.testPlanNotAvailable" (change)="updatePhaseField(i, 'testPlanNotAvailable', $any($event.target).checked)" class="h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500">
                        <label [for]="'test-na-' + i" class="ml-2 block text-sm text-slate-900">Not Available</label>
                      </div>
                      <div>
                        <label [for]="'test-text-' + i" class="block text-sm font-medium text-slate-700">Notes / Link to document</label>
                        <textarea [id]="'test-text-' + i" rows="3" [value]="phase.testPlanText" (input)="updatePhaseField(i, 'testPlanText', $any($event.target).value)" [disabled]="phase.testPlanNotAvailable" class="mt-1 block w-full px-3 py-2 bg-slate-200 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition disabled:bg-slate-300 disabled:cursor-not-allowed" placeholder="Add a brief description or a link..."></textarea>
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-slate-700">Upload Document</label>
                        <div class="mt-1 flex items-center gap-4">
                           <label [for]="'test-file-' + i" class="relative cursor-pointer inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500 transition" [class.bg-slate-300]="phase.testPlanNotAvailable" [class.cursor-not-allowed]="phase.testPlanNotAvailable" [class.opacity-50]="phase.testPlanNotAvailable">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                            <span>Upload File</span>
                            <input type="file" [id]="'test-file-' + i" (change)="handleFileUpload(i, 'test', $event)" [disabled]="phase.testPlanNotAvailable" class="sr-only">
                          </label>
                          @if(phase.testPlanFileName) {
                            <span class="text-sm text-slate-600 truncate">{{ phase.testPlanFileName }}</span>
                          }
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Elastic Specific Artifacts -->
                  <div class="col-span-1 md:col-span-2 mt-6 pt-6 border-t border-slate-200">
                    <div class="space-y-4">
                      <h4 class="text-md font-semibold text-slate-700">Elastic Specific Artifacts</h4>
                       <div class="flex items-center">
                        <input [id]="'elastic-na-' + i" type="checkbox" [checked]="phase.elasticArtefactsNotAvailable" (change)="updatePhaseField(i, 'elasticArtefactsNotAvailable', $any($event.target).checked)" class="h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500">
                        <label [for]="'elastic-na-' + i" class="ml-2 block text-sm text-slate-900">Not Available</label>
                      </div>

                      <div class="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3" [class.opacity-50]="phase.elasticArtefactsNotAvailable">
                        @for (key of artefactKeys; track key) {
                          <div class="flex items-center">
                              <input [id]="'artefact-' + i + '-' + key" type="checkbox" [checked]="$any(phase.elasticArtefacts)[key]" (change)="updateElasticArtefact(i, key, $any($event.target).checked)" [disabled]="phase.elasticArtefactsNotAvailable" class="h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 disabled:cursor-not-allowed">
                              <label [for]="'artefact-' + i + '-' + key" class="ml-2 block text-sm text-slate-900">{{ artefactLabels[key] }}</label>
                          </div>
                        }
                        <div class="flex items-center">
                            <input [id]="'artefact-' + i + '-others'" type="checkbox" [checked]="phase.elasticArtefacts.others" (change)="updateElasticArtefact(i, 'others', $any($event.target).checked)" [disabled]="phase.elasticArtefactsNotAvailable" class="h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 disabled:cursor-not-allowed">
                            <label [for]="'artefact-' + i + '-others'" class="ml-2 block text-sm text-slate-900">Others</label>
                        </div>
                      </div>

                      @if(phase.elasticArtefacts.others) {
                          <div [class.opacity-50]="phase.elasticArtefactsNotAvailable">
                              <label [for]="'others-text-' + i" class="sr-only">Specify Others</label>
                              <input type="text" [id]="'others-text-' + i" [value]="phase.elasticArtefacts.othersText" (input)="updateElasticArtefact(i, 'othersText', $any($event.target).value)" [disabled]="phase.elasticArtefactsNotAvailable" class="mt-1 block w-full px-3 py-2 bg-slate-200 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition disabled:bg-slate-300 disabled:cursor-not-allowed" placeholder="Please specify...">
                          </div>
                      }

                      <div>
                        <label [for]="'elastic-notes-' + i" class="block text-sm font-medium text-slate-700">Notes / Link to document</label>
                        <textarea [id]="'elastic-notes-' + i" rows="3" [value]="phase.elasticArtefactsNotes" (input)="updatePhaseField(i, 'elasticArtefactsNotes', $any($event.target).value)" [disabled]="phase.elasticArtefactsNotAvailable" class="mt-1 block w-full px-3 py-2 bg-slate-200 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition disabled:bg-slate-300 disabled:cursor-not-allowed" placeholder="Add a brief description or a link..."></textarea>
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-slate-700">Zip and upload all Elastic specific document(s)</label>
                        <div class="mt-1 flex items-center gap-4">
                          <label [for]="'elastic-file-' + i" class="relative cursor-pointer inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500 transition" [class.bg-slate-300]="phase.elasticArtefactsNotAvailable" [class.cursor-not-allowed]="phase.elasticArtefactsNotAvailable" [class.opacity-50]="phase.elasticArtefactsNotAvailable">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                            <span>Upload File</span>
                            <input type="file" [id]="'elastic-file-' + i" (change)="handleFileUpload(i, 'elastic', $event)" [disabled]="phase.elasticArtefactsNotAvailable" class="sr-only">
                          </label>
                          @if(phase.elasticArtefactsFileName) {
                            <span class="text-sm text-slate-600 truncate">{{ phase.elasticArtefactsFileName }}</span>
                          }
                        </div>
                      </div>
                    </div>
                  </div>
              </div>
            }
          </div>
        </section>

        <!-- Submit Action -->
        <section class="flex justify-center pt-6">
           <button (click)="downloadProjectAsZip()" [disabled]="isProcessing()"
                  class="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:bg-indigo-300 disabled:cursor-wait">
            @if (isProcessing()) {
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Processing...</span>
            } @else {
              <svg xmlns="http://www.w3.org/2000/svg" class="-ml-1 mr-3 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
              <span>Submit and Download</span>
            }
          </button>
        </section>

      </div>
    </main>
  `,
  styles: [
    `
      input[type='date']::-webkit-calendar-picker-indicator {
        cursor: pointer;
        filter: invert(1);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TimelineComponent],
})
export class AppComponent {
  projectName = signal<string>('My Awesome Project');
  projectScope = signal<string>('This project aims to deliver an innovative solution by leveraging cutting-edge technologies to solve a critical business problem.');
  isProcessing = signal(false);
  
  readonly artefactKeys = [
    'agentMonitoring', 'indexTemplates', 'ilm', 'watchers', 'transforms',
    'ingestPipelines', 'logstashPipelines', 'pythonScripting', 'aiMl'
  ];
  readonly artefactLabels: Record<string, string> = {
    agentMonitoring: 'Agent Monitoring',
    indexTemplates: 'Index templates',
    ilm: 'ILM',
    watchers: 'Watchers',
    transforms: 'Transforms',
    ingestPipelines: 'Ingest Pipelines',
    logstashPipelines: 'Logstash Pipelines',
    pythonScripting: 'Python Scripting',
    aiMl: 'AI/ ML'
  };
  
  validationErrors = signal<Record<string, Record<string, string>>>({});

  constructor() {
    effect(() => {
      const phases = this.phases();
      const errors: Record<string, Record<string, string>> = {};
      
      for (const phase of phases) {
        errors[phase.id] = {};
        const { id, startDate, endDate, milestoneDate, supportHandoverDate } = phase;

        if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
          errors[id]['endDate'] = 'End date cannot be before the start date.';
        }

        if (startDate && endDate && milestoneDate) {
          if (new Date(milestoneDate) < new Date(startDate) || new Date(milestoneDate) > new Date(endDate)) {
            errors[id]['milestoneDate'] = 'Milestone must be between the start and end date.';
          }
        }
        
        if (startDate && supportHandoverDate && new Date(supportHandoverDate) < new Date(startDate)) {
          errors[id]['supportHandoverDate'] = 'Handover must be on or after the start date.';
        }
      }
      this.validationErrors.set(errors);
    });
  }

  private get today(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  phases = signal<Phase[]>([
    {
      id: Date.now(),
      name: 'Phase 1 - Discovery',
      startDate: this.today,
      endDate: '',
      milestoneDate: '',
      supportHandoverDate: '',
      designPlanText: '',
      designPlanFile: null,
      designPlanFileName: '',
      designPlanNotAvailable: false,
      testPlanText: '',
      testPlanFile: null,
      testPlanFileName: '',
      testPlanNotAvailable: false,
      elasticArtefacts: {
        agentMonitoring: false, indexTemplates: false, ilm: false, watchers: false,
        transforms: false, ingestPipelines: false, logstashPipelines: false,
        pythonScripting: false, aiMl: false, others: false, othersText: ''
      },
      elasticArtefactsNotes: '',
      elasticArtefactsFile: null,
      elasticArtefactsFileName: '',
      elasticArtefactsNotAvailable: false,
    },
  ]);

  addPhase(): void {
    this.phases.update(currentPhases => {
      const newPhaseNumber = currentPhases.length + 1;
      return [
        ...currentPhases,
        {
          id: Date.now(),
          name: `Phase ${newPhaseNumber}`,
          startDate: this.today,
          endDate: '',
          milestoneDate: '',
          supportHandoverDate: '',
          designPlanText: '',
          designPlanFile: null,
          designPlanFileName: '',
          designPlanNotAvailable: false,
          testPlanText: '',
          testPlanFile: null,
          testPlanFileName: '',
          testPlanNotAvailable: false,
           elasticArtefacts: {
            agentMonitoring: false, indexTemplates: false, ilm: false, watchers: false,
            transforms: false, ingestPipelines: false, logstashPipelines: false,
            pythonScripting: false, aiMl: false, others: false, othersText: ''
          },
          elasticArtefactsNotes: '',
          elasticArtefactsFile: null,
          elasticArtefactsFileName: '',
          elasticArtefactsNotAvailable: false,
        },
      ];
    });
  }

  removePhase(idToRemove: number): void {
    this.phases.update(currentPhases =>
      currentPhases.filter(phase => phase.id !== idToRemove)
    );
  }

  updatePhaseField(index: number, field: keyof Phase, value: string | number | boolean): void {
    this.phases.update(currentPhases => {
      const newPhases = [...currentPhases];
      const phaseToUpdate = { ...newPhases[index] };
      (phaseToUpdate as any)[field] = value;
      
      if (field === 'designPlanNotAvailable' && value === true) {
        phaseToUpdate.designPlanText = '';
        phaseToUpdate.designPlanFile = null;
        phaseToUpdate.designPlanFileName = '';
      }
      if (field === 'testPlanNotAvailable' && value === true) {
        phaseToUpdate.testPlanText = '';
        phaseToUpdate.testPlanFile = null;
        phaseToUpdate.testPlanFileName = '';
      }
       if (field === 'elasticArtefactsNotAvailable' && value === true) {
        phaseToUpdate.elasticArtefactsNotes = '';
        phaseToUpdate.elasticArtefactsFile = null;
        phaseToUpdate.elasticArtefactsFileName = '';
      }
      
      newPhases[index] = phaseToUpdate;
      return newPhases;
    });
  }
  
  updateElasticArtefact(phaseIndex: number, artefact: string, value: string | boolean) {
    this.phases.update(phases => {
      const newPhases = [...phases];
      const phaseToUpdate = { ...newPhases[phaseIndex] };
      const newArtefacts = { ...phaseToUpdate.elasticArtefacts };

      if (artefact === 'othersText') {
        newArtefacts.othersText = value as string;
      } else {
        (newArtefacts as any)[artefact] = value as boolean;
      }
      
      phaseToUpdate.elasticArtefacts = newArtefacts;
      newPhases[phaseIndex] = phaseToUpdate;
      return newPhases;
    });
  }
  
  handleFileUpload(index: number, planType: 'design' | 'test' | 'elastic', event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] || null;

    this.phases.update(currentPhases => {
      const newPhases = [...currentPhases];
      const phaseToUpdate = { ...newPhases[index] };
      if (planType === 'design') {
        phaseToUpdate.designPlanFile = file;
        phaseToUpdate.designPlanFileName = file ? file.name : '';
      } else if (planType === 'test') {
        phaseToUpdate.testPlanFile = file;
        phaseToUpdate.testPlanFileName = file ? file.name : '';
      } else {
        phaseToUpdate.elasticArtefactsFile = file;
        phaseToUpdate.elasticArtefactsFileName = file ? file.name : '';
      }
      newPhases[index] = phaseToUpdate;
      return newPhases;
    });
  }

  updateProjectName(event: Event) {
    const input = event.target as HTMLInputElement;
    this.projectName.set(input.value);
  }

  updateProjectScope(event: Event) {
    const input = event.target as HTMLTextAreaElement;
    this.projectScope.set(input.value);
  }

  async downloadProjectAsZip(): Promise<void> {
    this.isProcessing.set(true);
    try {
      const { jsPDF } = jspdf;
      const zip = new JSZip();
      const doc = new jsPDF();
      
      const pageHeight = doc.internal.pageSize.height;
      const margin = 20;
      let cursorY = margin;

      // --- PDF Content Generation ---
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('Elastic Project Onboarding Plan', 14, cursorY);
      cursorY += 15;

      doc.setFontSize(12);
      doc.text('Project Details', 14, cursorY);
      cursorY += 8;

      doc.setFont('helvetica', 'normal');
      doc.text(`Project Name: ${this.projectName()}`, 14, cursorY);
      cursorY += 8;

      doc.setFont('helvetica', 'bold');
      doc.text('Project Scope:', 14, cursorY);
      cursorY += 6;
      doc.setFont('helvetica', 'normal');
      const scopeLines = doc.splitTextToSize(this.projectScope(), 180);
      doc.text(scopeLines, 14, cursorY);
      cursorY += scopeLines.length * 5 + 10;

      this.phases().forEach(phase => {
        if (cursorY > pageHeight - 70) { // Check for new page
          doc.addPage();
          cursorY = margin;
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text(phase.name, 14, cursorY);
        cursorY += 10;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        
        doc.text(`Start Date: ${phase.startDate || 'N/A'}`, 14, cursorY);
        doc.text(`End Date: ${phase.endDate || 'N/A'}`, 100, cursorY);
        cursorY += 7;

        doc.text(`Milestone Date: ${phase.milestoneDate || 'N/A'}`, 14, cursorY);
        doc.text(`Support Handover: ${phase.supportHandoverDate || 'N/A'}`, 100, cursorY);
        cursorY += 10;

        // Design Plan
        doc.setFont('helvetica', 'bold');
        doc.text('Design Plan:', 14, cursorY);
        cursorY += 5;
        doc.setFont('helvetica', 'normal');
        if (phase.designPlanNotAvailable) {
          doc.text('Not Available', 20, cursorY);
          cursorY += 7;
        } else {
          if (phase.designPlanText) {
            const textLines = doc.splitTextToSize(`Notes: ${phase.designPlanText}`, 170);
            doc.text(textLines, 20, cursorY);
            cursorY += textLines.length * 4 + 3;
          }
          doc.text(`File: ${phase.designPlanFileName || 'No file uploaded'}`, 20, cursorY);
          cursorY += 7;
        }

        // Test Plan
        if (cursorY > pageHeight - 40) {
          doc.addPage();
          cursorY = margin;
        }
        doc.setFont('helvetica', 'bold');
        doc.text('Test Plan:', 14, cursorY);
        cursorY += 5;
        doc.setFont('helvetica', 'normal');
        if (phase.testPlanNotAvailable) {
          doc.text('Not Available', 20, cursorY);
          cursorY += 7;
        } else {
          if (phase.testPlanText) {
            const textLines = doc.splitTextToSize(`Notes: ${phase.testPlanText}`, 170);
            doc.text(textLines, 20, cursorY);
            cursorY += textLines.length * 4 + 3;
          }
          doc.text(`File: ${phase.testPlanFileName || 'No file uploaded'}`, 20, cursorY);
          cursorY += 7;
        }
        
        // Elastic Specific Artifacts
        if (cursorY > pageHeight - 60) {
          doc.addPage();
          cursorY = margin;
        }
        doc.setFont('helvetica', 'bold');
        doc.text('Elastic Specific Artifacts:', 14, cursorY);
        cursorY += 5;
        doc.setFont('helvetica', 'normal');
        
        if (phase.elasticArtefactsNotAvailable) {
          doc.text('Not Available', 20, cursorY);
          cursorY += 7;
        } else {
            const selectedArtefacts = this.artefactKeys
              .filter(key => (phase.elasticArtefacts as any)[key])
              .map(key => this.artefactLabels[key]);
            
            if (phase.elasticArtefacts.others) {
                const otherText = phase.elasticArtefacts.othersText.trim();
                selectedArtefacts.push(otherText ? `Other: ${otherText}` : 'Other (unspecified)');
            }

            if (selectedArtefacts.length > 0) {
                const textLines = doc.splitTextToSize(`Selected: ${selectedArtefacts.join(', ')}`, 170);
                doc.text(textLines, 20, cursorY);
                cursorY += textLines.length * 4 + 3;
            } else {
                doc.text('Selected: None', 20, cursorY);
                cursorY += 7;
            }

            if (phase.elasticArtefactsNotes) {
                const textLines = doc.splitTextToSize(`Notes: ${phase.elasticArtefactsNotes}`, 170);
                doc.text(textLines, 20, cursorY);
                cursorY += textLines.length * 4 + 3;
            }
            doc.text(`File: ${phase.elasticArtefactsFileName || 'No file uploaded'}`, 20, cursorY);
            cursorY += 7;
        }
        cursorY += 5; // Space between phases
      });
      
      zip.file('Project_Plan.pdf', doc.output('blob'));

      // --- Zipping Uploaded Files ---
      this.phases().forEach(phase => {
        const phaseName = phase.name.replace(/[^a-zA-Z0-9]/g, '_');
        if (phase.designPlanFile) {
          zip.file(`Design_Plan/${phaseName}/${phase.designPlanFile.name}`, phase.designPlanFile);
        }
        if (phase.testPlanFile) {
          zip.file(`Test_Plan/${phaseName}/${phase.testPlanFile.name}`, phase.testPlanFile);
        }
        if (phase.elasticArtefactsFile) {
          zip.file(`Elastic_specific_Artefacts/${phaseName}/${phase.elasticArtefactsFile.name}`, phase.elasticArtefactsFile);
        }
      });

      // --- Triggering Download ---
      const zipContent = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipContent);
      const safeProjectName = this.projectName().replace(/[^a-zA-Z0-9]/g, '_') || 'Project';
      link.download = `${safeProjectName}_Onboarding_Package.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

    } catch (error) {
      console.error('Error generating zip file:', error);
    } finally {
      this.isProcessing.set(false);
    }
  }
}
