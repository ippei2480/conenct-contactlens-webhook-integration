import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { AppParameter } from "../parameters";
import { WebHookInteg } from "./constructs/WebHookInteg";

export interface ConenctContactlensWebhookIntegrationStackProps
  extends cdk.StackProps {
  parameters: AppParameter;
}

export class ConenctContactlensWebhookIntegrationStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props: ConenctContactlensWebhookIntegrationStackProps
  ) {
    super(scope, id, props);
    const webHookInteg = new WebHookInteg(this, "WebHookInteg", {
      eventBuridgeRuleDetailType: props.parameters.eventBridgeRuleDetailType,
      connectAnalysisBucketName: props.parameters.connectAnalysisBucketName,
      ipaasWebhookURL: props.parameters.ipaasWebhookURL,
    });
  }
}
