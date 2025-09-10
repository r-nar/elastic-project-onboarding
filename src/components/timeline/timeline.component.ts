import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Phase } from '../../phase.interface';

interface TimelinePhase extends Phase {
  left: number;
  width: number;
  milestoneLeft: number;
  handoverLeft: number;
  color: string;
}

@Component({
  selector: 'app-timeline',
  templateUrl: './timeline.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class TimelineComponent {
  phases = input.required<Phase[]>();
  
  private readonly a11yColors = [
    'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-indigo-500', 
    'bg-pink-500', 'bg-sky-500', 'bg-rose-500', 'bg-lime-500'
  ];

  timelineViewModel = computed(() => {
    const currentPhases = this.phases();
    if (!currentPhases || currentPhases.length === 0) {
      return { totalDurationDays: 0, projectStartDate: '', projectEndDate: '', timelinePhases: [] };
    }

    const validPhases = currentPhases.filter(p => p.startDate && p.endDate);
    if(validPhases.length === 0) {
      return { totalDurationDays: 0, projectStartDate: '', projectEndDate: '', timelinePhases: [] };
    }
    
    const startDates = validPhases.map(p => new Date(p.startDate).getTime());

    const allEndTimestamps = validPhases.flatMap(p => {
        const dates = [];
        if (p.endDate) dates.push(new Date(p.endDate).getTime());
        if (p.supportHandoverDate) dates.push(new Date(p.supportHandoverDate).getTime());
        return dates;
    });

    if (startDates.length === 0 || allEndTimestamps.length === 0) {
        return { totalDurationDays: 0, projectStartDate: '', projectEndDate: '', timelinePhases: [] };
    }

    const projectStartMs = Math.min(...startDates);
    const projectEndMs = Math.max(...allEndTimestamps);
    
    const totalDurationMs = projectEndMs - projectStartMs;
    if (totalDurationMs <= 0) {
      return { totalDurationDays: 0, projectStartDate: '', projectEndDate: '', timelinePhases: [] };
    }

    const timelinePhases: TimelinePhase[] = validPhases.map((phase, index) => {
      const phaseStartMs = new Date(phase.startDate).getTime();
      const phaseEndMs = new Date(phase.endDate).getTime();
      const milestoneMs = phase.milestoneDate ? new Date(phase.milestoneDate).getTime() : 0;
      const handoverMs = phase.supportHandoverDate ? new Date(phase.supportHandoverDate).getTime() : 0;

      const offsetMs = phaseStartMs - projectStartMs;
      const durationMs = phaseEndMs - phaseStartMs;
      
      const left = (offsetMs / totalDurationMs) * 100;
      const width = (durationMs / totalDurationMs) * 100;
      const milestoneLeft = milestoneMs >= projectStartMs ? ((milestoneMs - projectStartMs) / totalDurationMs) * 100 : -1;
      const handoverLeft = handoverMs >= projectStartMs ? ((handoverMs - projectStartMs) / totalDurationMs) * 100 : -1;

      return {
        ...phase,
        left: left > 0 ? left : 0,
        width: width > 0 ? width : 0,
        milestoneLeft: milestoneLeft,
        handoverLeft: handoverLeft,
        color: this.a11yColors[index % this.a11yColors.length],
      };
    });

    return {
      totalDurationDays: Math.ceil(totalDurationMs / (1000 * 60 * 60 * 24)) || 1,
      projectStartDate: new Date(projectStartMs).toLocaleDateString(),
      projectEndDate: new Date(projectEndMs).toLocaleDateString(),
      timelinePhases,
    };
  });
}