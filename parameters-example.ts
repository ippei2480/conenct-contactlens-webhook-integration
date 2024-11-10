export interface AppParameter {
  env: {
    account: string;
    region: string;
  };
  eventBridgeRuleDetailType: string;
  connectAnalysisBucketName: string;
  ipaasWebhookURL: string;
}

export const appParameter: AppParameter = {
  env: {
    account: "XXXXXXXXXXXX",
    region: "ap-northeast-1",
  },
  eventBridgeRuleDetailType: "Contact Lens Post Call Rules Matched",
  connectAnalysisBucketName: "",
  ipaasWebhookURL: "",
};
