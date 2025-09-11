import { ChangeDetectionStrategy, Component, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimelineComponent } from './components/timeline/timeline.component';
import { Phase } from './phase.interface';

declare var jspdf: any;
declare var JSZip: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
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