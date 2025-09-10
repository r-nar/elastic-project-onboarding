import { ChangeDetectionStrategy, Component, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimelineComponent } from './components/timeline/timeline.component';
import { Phase } from './phase.interface';

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
        
        if (supportHandoverDate) {
            if (milestoneDate && new Date(supportHandoverDate) < new Date(milestoneDate)) {
               errors[id]['supportHandoverDate'] = 'Handover must be on or after the milestone date.';
            } else if (!milestoneDate && endDate && new Date(supportHandoverDate) < new Date(endDate)) {
               errors[id]['supportHandoverDate'] = 'Handover must be on or after the end date.';
            }
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
        },
      ];
    });
  }

  removePhase(idToRemove: number): void {
    this.phases.update(currentPhases =>
      currentPhases.filter(phase => phase.id !== idToRemove)
    );
  }

  updatePhaseField(index: number, field: keyof Phase, value: string | number): void {
    this.phases.update(currentPhases => {
      const newPhases = [...currentPhases];
      const phaseToUpdate = { ...newPhases[index] };
      (phaseToUpdate as any)[field] = value;
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
}