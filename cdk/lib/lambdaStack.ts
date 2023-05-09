import { Construct } from "constructs";
import { Stack, aws_lambda, Duration, RemovalPolicy } from "aws-cdk-lib";
import { readFileSync } from "fs";
import {
    AccessLogFormat,
    ApiDefinition,
    LogGroupLogDestination,
    SpecRestApi,
} from "aws-cdk-lib/aws-apigateway";
import { ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";

function readOpenApiDefinition(crateName: string, serviceName: string) {
    const openApiPath = `../smithy/model/build/codegen/${crateName}/openapi/${serviceName}.openapi.json`;
    return JSON.parse(readFileSync(openApiPath, "utf8"));
}

export class LambdaStack extends Stack {
    constructor(scope: Construct, id: string) {
        super(scope, id);

        const apiDefinition = readOpenApiDefinition(
            "simple-service-server-sdk",
            "SimpleService"
        );
        console.log(JSON.stringify(apiDefinition));

        const accessLogLogGroup = new LogGroup(this, "ApiLogs", {
            removalPolicy: RemovalPolicy.RETAIN,
            retention: RetentionDays.TEN_YEARS,
        });

        const api = new SpecRestApi(this, "RestApi", {
            apiDefinition: ApiDefinition.fromInline(apiDefinition),
            deployOptions: {
                accessLogDestination: new LogGroupLogDestination(
                    accessLogLogGroup
                ),
                /**
                 * Unless specified, the log format will default to "Common Log Format" ([CLF]).
                 * However, CloudWatch Insights works best with JSON format.
                 */
                accessLogFormat: AccessLogFormat.jsonWithStandardFields(),
                metricsEnabled: true,
            },
        });

        const bootstrapLocation = `${__dirname}/../../simple-service/target/cdk/release`;
        const entryId = "main";
        const lambda = new aws_lambda.Function(this, entryId, {
            functionName: `${id}-${entryId}`,
            runtime: aws_lambda.Runtime.PROVIDED_AL2,
            // This value has no effect since we're bringing with us a custom
            // runtime
            // (https://docs.aws.amazon.com/lambda/latest/dg/runtimes-custom.html)
            // that just makes the Lambda execute a binary.
            handler: "irrelevant",
            code: aws_lambda.Code.fromAsset(bootstrapLocation),
            memorySize: 128,
            timeout: Duration.seconds(5),
            environment: {
                RUST_LOG: "DEBUG",
            },
        });

        // Update the OpenAPI definition to add the Lambda integration URI.
        for (const path in apiDefinition.paths) {
            console.log(path);
            for (const operation in apiDefinition.paths[path]) {
                console.log(operation);
                const op = apiDefinition.paths[path][operation];
                console.log(op);
                const integration = op["x-amazon-apigateway-integration"];
                if (!integration) {
                    throw new Error(
                        `No x-amazon-apigateway-integration for ${op.operationId}. Make sure API Gateway integration is configured in the Smithy model.`
                    );
                }
                // Don't mess with mock integrations.
                if (integration["type"] === "mock") {
                    continue;
                }
                integration.uri = `arn:${this.partition}:apigateway:${this.region}:lambda:path/2015-03-31/functions/${lambda.functionArn}/invocations`;
            }
        }

        // Allow API Gateway to call the Lambda function.
        lambda.addPermission("ApiGatewayInvokesLambdaPermission", {
            principal: new ServicePrincipal("apigateway.amazonaws.com"),
            sourceArn: api.arnForExecuteApi(),
        });
    }
}
