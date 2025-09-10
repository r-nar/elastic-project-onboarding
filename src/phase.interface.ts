export interface Phase {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  milestoneDate: string;
  supportHandoverDate: string;
  designPlanText: string;
  designPlanFile: File | null;
  designPlanFileName: string;
  designPlanNotAvailable: boolean;
  testPlanText: string;
  testPlanFile: File | null;
  testPlanFileName: string;
  testPlanNotAvailable: boolean;
}
