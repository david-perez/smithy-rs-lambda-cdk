$version: "2.0"

namespace com.amazonaws.simple

use aws.protocols#restJson1

@restJson1
// Define a service-level API Gateway integration -- this can be overridden on individual methods.
// https://awslabs.github.io/smithy/1.0/spec/aws/amazon-apigateway.html#aws-apigateway-integration-trait
@aws.apigateway#integration(
    type: "aws_proxy",
    // Specifies the integration's HTTP method type (for example, POST). For
    // Lambda function invocations, the value must be POST.
    httpMethod: "POST",
    uri: "arn:${AWS::Partition}:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${LambdaFunction.Arn}/invocations",
)
service SimpleService {
    version: "2023-05-08",
    operations: [
        Operation
    ]
}

@http(uri: "/operation", method: "POST")
operation Operation {
    input: OperationInputOutput
    output: OperationInputOutput
}

structure OperationInputOutput {
    message: String
}
