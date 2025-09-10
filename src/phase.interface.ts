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
  elasticArtefacts: {
    agentMonitoring: boolean;
    indexTemplates: boolean;
    ilm: boolean;
    watchers: boolean;
    transforms: boolean;
    ingestPipelines: boolean;
    logstashPipelines: boolean;
    pythonScripting: boolean;
    aiMl: boolean;
    others: boolean;
    othersText: string;
  };
  elasticArtefactsNotes: string;
  elasticArtefactsFile: File | null;
  elasticArtefactsFileName: string;
  elasticArtefactsNotAvailable: boolean;
}
