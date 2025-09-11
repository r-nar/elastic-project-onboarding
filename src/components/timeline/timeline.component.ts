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
  template: `
    <div class="bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-slate-200">
      <h2 class="text-2xl font-bold text-slate-800 mb-2">Project Plan Visualization</h2>
      <p class="text-slate-500 mb-6">A high-level overview of your project's timeline.</p>

      @if (timelineViewModel().timelinePhases.length > 0) {
        <div class="space-y-8">
          <!-- Legend -->
          <div class="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 rounded bg-blue-500"></div>
              <span>Phase Duration</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-px h-4 border-l-2 border-dotted border-teal-500"></div>
              <span>Milestone</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-px h-4 border-l-2 border-dotted border-red-500"></div>
              <span>Support Handover</span>
            </div>
          </div>

          <!-- Timeline -->
          <div class="space-y-6">
            <div class="flex justify-between text-xs font-semibold text-slate-500">
              <span>{{ timelineViewModel().projectStartDate }}</span>
              <span>{{ timelineViewModel().projectEndDate }}</span>
            </div>

            @for (phase of timelineViewModel().timelinePhases; track phase.id) {
              <div class="group">
                <h3 class="text-sm font-semibold text-slate-800 truncate mb-1" title="{{phase.name}}">{{ phase.name }}</h3>
                <div class="relative w-full h-8 bg-slate-100 rounded">
                  <!-- Phase Bar -->
                  <div class="absolute h-full rounded"
                       [class]="phase.color"
                       [style.left.%]="phase.left"
                       [style.width.%]="phase.width">
                  </div>

                  <!-- Milestone Marker -->
                  @if (phase.milestoneLeft >= 0) {
                    <div class="absolute w-px h-12 -top-2 border-l-2 border-dotted border-teal-500" [style.left.%]="phase.milestoneLeft"></div>
                  }
                  <!-- Handover Marker -->
                  @if (phase.handoverLeft >= 0) {
                    <div class="absolute w-px h-12 -top-2 border-l-2 border-dotted border-red-500" [style.left.%]="phase.handoverLeft"></div>
                  }

                  <!-- Tooltip (attached to the phase bar container) -->
                  <div class="hidden group-hover:block absolute -top-24 w-48 bg-slate-800 text-white text-xs rounded-lg shadow-xl p-2 z-10" [style.left.%]="phase.left + (phase.width / 2)" style="transform: translateX(-50%);">
                    <p class="font-bold mb-1">{{phase.name}}</p>
                    <p>Start: {{phase.startDate}}</p>
                    <p>End: {{phase.endDate}}</p>
                    @if (phase.milestoneDate) {
                      <p class="text-teal-300">Milestone: {{phase.milestoneDate}}</p>
                    }
                    @if (phase.supportHandoverDate) {
                      <p class="text-red-300">Handover: {{phase.supportHandoverDate}}</p>
                    }
                    <div class="absolute top-full left-1/2 -mt-1 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-800"></div>
                  </div>
                </div>
              </div>
            }
          </div>

          <div class="text-center text-sm text-slate-500 font-medium">Total Project Duration: {{ timelineViewModel().totalDurationDays }} days</div>
        </div>
      } @else {
        <div class="text-center py-12 px-6 bg-slate-100 rounded-lg">
          <svg class="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V7a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 class="mt-2 text-sm font-semibold text-slate-900">No plan built yet</h3>
          <p class="mt-1 text-sm text-slate-500">Enter a start and end date for at least one phase to see the timeline.</p>
        </div>
      }
    </div>
  `,
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
