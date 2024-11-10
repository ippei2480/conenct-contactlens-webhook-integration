#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { ConenctContactlensWebhookIntegrationStack } from "../lib/conenct-contactlens-webhook-integration-stack";
import { appParameter } from "../parameters";

const app = new cdk.App();
new ConenctContactlensWebhookIntegrationStack(
  app,
  "ConenctContactlensWebhookIntegrationStack",
  {
    env: appParameter.env,
    parameters: appParameter,
  }
);
