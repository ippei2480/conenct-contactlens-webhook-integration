import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as node_lambda from "aws-cdk-lib/aws-lambda-nodejs";
import * as events from "aws-cdk-lib/aws-events";
import * as events_targets from "aws-cdk-lib/aws-events-targets";

export interface WebHookIntegProps {
  eventBuridgeRuleDetailType: string;
  connectAnalysisBucketName: string;
  ipaasWebhookURL: string;
}

export class WebHookInteg extends Construct {
  constructor(scope: Construct, id: string, props: WebHookIntegProps) {
    super(scope, id);
    // Lambda
    const fncRole = new iam.Role(this, "FncRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSLambdaBasicExecutionRole"
        ),
      ],
    });
    fncRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["s3:ListBucket", "s3:ListObject", "s3:GetObject"],
        resources: [`*`],
      })
    );

    const fncParseAnalysis = new node_lambda.NodejsFunction(
      this,
      "FncParseAnalysis",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        architecture: lambda.Architecture.ARM_64,
        memorySize: 128,
        timeout: cdk.Duration.seconds(15),
        role: fncRole,
        entry: "./lambda/parseAnalysis.ts",
        handler: "handler",
        environment: {
          ANALYSIS_BUCKET_NAME: props.connectAnalysisBucketName,
          WEBHOOK_URL: props.ipaasWebhookURL,
        },
      }
    );

    // EventBridge Rule
    const eventRule = new events.Rule(this, "EventRule", {
      eventPattern: {
        source: ["aws.connect"],
        detailType: [props.eventBuridgeRuleDetailType],
      },
      targets: [new events_targets.LambdaFunction(fncParseAnalysis)],
    });
  }
}
