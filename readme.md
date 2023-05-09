smithy-rs-lambda-cdk
--------------------

This project contains scaffolding to build and deploy a simple Smithy-modeled
Rust service in an [AWS Lambda] fronted by [Amazon API Gateway]. It can serve
as an example to quickly get you started with a [smithy-rs] service running on
AWS Lambda.

It comprises three directories:

- `smithy` is a Gradle project that builds the `model/main.smithy` Smithy model
  using [smithy-rs]. smithy-rs is used as a [Git submodule] inside this
  directory.
  - The model is built using the `rust-server-codegen` plugin, which produces
    a server SDK in the form of a Rust crate.
  - The version of smithy-rs used is the one that is pointed to by the Git
    submodule, defined in `.gitmodules`. At the moment this points to the
    [`smithy-rs-release-0.55.x`] branch, whose latest version is `0.55.2`.
    This version must also be specified and kept up to date in the
    `model/smithy-build.json` file, in the
    `runtimeConfig.versions.DEFAULT` key.
- `simple-service` is the implementation of the actual smithy-rs service, which
  depends on the generated server SDK crate. It
  uses the [lambda_http] and [lambda_runtime] crates to implement a Lambda
  handler that receives HTTP requests from API Gateway.
- `cdk` is an infrastructure-as-code project to deploy the necessary
  infrastructure to an AWS account. It uses [the CDK] and is written in
  TypeScript.

Installation prerrequisites
---------------------------

You will need the following installed:

- Java >= 11.
- Rust toolchain.
- Node >= 18.
- The [AWS CDK v2].
- [`cargo-lambda`].

[AWS Lambda]: https://aws.amazon.com/lambda/
[Amazon API Gateway]: https://aws.amazon.com/api-gateway/
[smithy-rs]: https://github.com/awslabs/smithy-rs/
[Git submodule]: https://git-scm.com/book/en/v2/Git-Tools-Submodules
[`smithy-rs-release-0.55.x`]: https://github.com/awslabs/smithy-rs/tree/smithy-rs-release-0.55.x
[lambda_http]: https://crates.io/crates/lambda_http
[lambda_runtime]: https://crates.io/crates/lambda_runtime
[the CDK]: https://aws.amazon.com/cdk/
[AWS CDK v2]: https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html
[`cargo-lambda`]: https://www.cargo-lambda.info/guide/installation.html

Checking out the repository
---------------------------

Make sure you retrieve the Git submodule when cloning or checking out the
repository. The submodule should live under the `smithy/smithy-rs` directory.

```console
$ git clone --recurse-submodules https://github.com/david-perez/smithy-rs-lambda-cdk.git
```

Building and deploying
----------------------

Building comprises three steps.

1. The server SDK needs to be code-generated using smithy-rs.
2. The service using the server SDK needs to be built.
3. The CDK project needs to be built.

The project can then be deployed to an AWS account.

### Code-generating the server SDK

```console
$ cd smithy
$ ./gradlew assemble
```

This should produce the server SDK in the form of a regular Rust crate,
`simple-service-server-sdk`, in the top-level directory. You can build this
crate using cargo to ensure the code generation process produced a valid Rust
crate:

```console
$ cd simple-service-server-sdk
$ cargo test
```

### Building the service

Build the Rust Lambda function implementing the smithy-rs service in _release_
mode:

```console
$ cd simple-service
$ cargo lambda build --release --x86-64
```

The binary should appear under `target/release`. It should be named
`bootstrap`. Copy it over to the `target/cdk/release` directory, where the CDK
will look into:

```console
$ mkdir --parents target/cdk/release
$ cp target/lambda/bootstrap/bootstrap target/cdk/release/bootstrap
```

### Building the CDK project

```console
$ cd cdk
$ npm install
$ npm run build
```

### Deploying the project

The first time you deploy the function, you need to invoke `cdk bootstrap`.
This is to deploy the CDK toolkit stack into an AWS environment, and has
_nothing_ to do with the fact that our Rust binary is also named `bootstrap`.

```console
$ cd cdk
$ cdk bootstrap
```

To deploy the Lambda function stack, run this command:

```console
$ cdk deploy -y --all
```

#### Destroying the project

To destroy the stack:

```console
$ cdk destroy --all
```
