import { ChangeDetectionStrategy, Component, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimelineComponent } from './components/timeline/timeline.component';
import { Phase } from './phase.interface';

declare var jspdf: any;
declare var html2canvas: any;
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
      
      newPhases[index] = phaseToUpdate;
      return newPhases;
    });
  }
  
  handleFileUpload(index: number, planType: 'design' | 'test', event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] || null;

    this.phases.update(currentPhases => {
      const newPhases = [...currentPhases];
      const phaseToUpdate = { ...newPhases[index] };
      if (planType === 'design') {
        phaseToUpdate.designPlanFile = file;
        phaseToUpdate.designPlanFileName = file ? file.name : '';
      } else {
        phaseToUpdate.testPlanFile = file;
        phaseToUpdate.testPlanFileName = file ? file.name : '';
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

      const planElement = document.querySelector('#project-capture-area');
      if (!planElement) {
        console.error('Could not find the element to capture.');
        return;
      }
      const canvas = await html2canvas(planElement as HTMLElement);
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      zip.file('Project_Plan.pdf', pdf.output('blob'));

      this.phases().forEach(phase => {
        const phaseName = phase.name.replace(/[^a-zA-Z0-9]/g, '_');
        if (phase.designPlanFile) {
          zip.file(`documents/${phaseName}_Design_Plan_${phase.designPlanFile.name}`, phase.designPlanFile);
        }
        if (phase.testPlanFile) {
          zip.file(`documents/${phaseName}_Test_Plan_${phase.testPlanFile.name}`, phase.testPlanFile);
        }
      });

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