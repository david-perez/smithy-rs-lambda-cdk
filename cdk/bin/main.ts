#!/usr/bin/env node

import { App } from "aws-cdk-lib";
import "source-map-support/register";
import { LambdaStack } from "../lib/lambdaStack";

const app = new App();

new LambdaStack(app, "Lambda");
